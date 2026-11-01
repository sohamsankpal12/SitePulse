/**
 * SitePulse Monitor Lambda
 * Triggered by EventBridge Scheduler every minute.
 * Checks enabled websites that are due for monitoring.
 * Records results, creates/closes incidents, sends SNS notifications.
 */
const https = require('https');
const http = require('http');
const { URL } = require('url');
const dns = require('dns').promises;
const { randomUUID } = require('crypto');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { ddb, TABLES, QueryCommand, ScanCommand, UpdateCommand, PutCommand, GetCommand } = require('./shared/dynamodb');
const { validateUrl } = require('./shared/helpers');

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);
const FAILURE_THRESHOLD = parseInt(process.env.FAILURE_THRESHOLD || '2', 10);
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '10', 10);

// ─── HTTP Check ───────────────────────────────────────────────────────────────
async function checkWebsite(url) {
  const start = Date.now();
  return new Promise((resolve) => {
    const parsed = new URL(url);

    // Revalidate for SSRF after DNS may have changed
    const { valid, reason } = validateUrl(url);
    if (!valid) {
      return resolve({ status: 'ERROR', errorType: 'INVALID_URL', reason, responseTimeMs: 0, httpStatusCode: null });
    }

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', timeout: REQUEST_TIMEOUT_MS,
        headers: { 'User-Agent': 'SitePulse-Monitor/1.0' } },
      (res) => {
        res.resume(); // drain body
        const responseTimeMs = Date.now() - start;
        const httpStatusCode = res.statusCode;
        const status = httpStatusCode >= 200 && httpStatusCode < 400 ? 'UP' : 'DOWN';
        resolve({ status, httpStatusCode, responseTimeMs, errorType: null });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'DOWN', httpStatusCode: null, responseTimeMs: REQUEST_TIMEOUT_MS, errorType: 'TIMEOUT' });
    });
    req.on('error', (err) => {
      const responseTimeMs = Date.now() - start;
      let errorType = 'CONNECTION_ERROR';
      if (err.code === 'ENOTFOUND') errorType = 'DNS_FAILURE';
      else if (err.code === 'ECONNREFUSED') errorType = 'CONNECTION_REFUSED';
      else if (err.code === 'ETIMEDOUT') errorType = 'TIMEOUT';
      resolve({ status: 'DOWN', httpStatusCode: null, responseTimeMs, errorType });
    });
    req.end();
  });
}

// ─── Batch utility ────────────────────────────────────────────────────────────
async function pLimit(fns, concurrency) {
  const results = [];
  let i = 0;
  async function run() {
    while (i < fns.length) {
      const idx = i++;
      results[idx] = await fns[idx]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, fns.length) }, run);
  await Promise.all(workers);
  return results;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async () => {
  const now = new Date();
  const nowIso = now.toISOString();

  // Fetch all enabled websites (scan with filter — acceptable for monitoring Lambda)
  // In production with >1000 sites, paginate or use GSI
  let websites = [];
  let lastKey;
  do {
    const result = await ddb.send(new ScanCommand({
      TableName: TABLES.WEBSITES,
      FilterExpression: 'enabled = :t',
      ExpressionAttributeValues: { ':t': true },
      ExclusiveStartKey: lastKey,
    }));
    websites.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  // Filter: due for checking
  const due = websites.filter((w) => {
    if (!w.lastCheckedAt) return true;
    const elapsed = (now - new Date(w.lastCheckedAt)) / 60000; // minutes
    return elapsed >= (w.monitoringInterval || 5);
  });

  console.log(`Monitor: ${due.length} websites due for checking out of ${websites.length} enabled`);

  const tasks = due.map((website) => async () => {
    try {
      await processWebsite(website, nowIso);
    } catch (err) {
      console.error(`Error checking ${website.url}:`, err);
    }
  });

  await pLimit(tasks, MAX_CONCURRENT);
  console.log('Monitor run complete.');
};

async function processWebsite(website, nowIso) {
  const { websiteId, url, userId, alertThreshold = FAILURE_THRESHOLD } = website;

  const checkResult = await checkWebsite(url);
  const { status, httpStatusCode, responseTimeMs, errorType } = checkResult;

  const checkedAt = nowIso;

  // Write check record
  await ddb.send(new PutCommand({
    TableName: TABLES.CHECKS,
    Item: {
      websiteId,
      checkedAt,
      status,
      httpStatusCode,
      responseTimeMs,
      errorType,
    },
  }));

  // Determine new consecutive failure count
  const prevFailures = website.consecutiveFailures || 0;
  const consecutiveFailures = status === 'DOWN' ? prevFailures + 1 : 0;
  const prevStatus = website.currentStatus;

  // Update website record
  await ddb.send(new UpdateCommand({
    TableName: TABLES.WEBSITES,
    Key: { websiteId },
    UpdateExpression: 'SET currentStatus = :s, lastCheckedAt = :t, lastResponseTimeMs = :rt, consecutiveFailures = :cf, updatedAt = :u',
    ExpressionAttributeValues: {
      ':s': status,
      ':t': checkedAt,
      ':rt': responseTimeMs,
      ':cf': consecutiveFailures,
      ':u': checkedAt,
    },
  }));

  // ── Incident logic ──────────────────────────────────────────────────────────
  if (status === 'DOWN' && consecutiveFailures === alertThreshold) {
    // Open new incident
    const incidentId = randomUUID();
    await ddb.send(new PutCommand({
      TableName: TABLES.INCIDENTS,
      Item: {
        incidentId,
        websiteId,
        userId,
        url,
        startedAt: checkedAt,
        recoveredAt: null,
        durationSeconds: null,
        reason: errorType || `HTTP ${httpStatusCode}`,
        status: 'OPEN',
        notifiedAt: checkedAt,
      },
    }));

    // Notify
    await sendAlert('DOWN', { url, incidentId, startedAt: checkedAt, reason: errorType || `HTTP ${httpStatusCode}`, responseTimeMs });
  }

  if (status === 'UP' && prevStatus === 'DOWN') {
    // Close open incident
    const openIncidents = await ddb.send(new QueryCommand({
      TableName: TABLES.INCIDENTS,
      IndexName: 'websiteId-startedAt-index',
      KeyConditionExpression: 'websiteId = :wid',
      FilterExpression: '#st = :open',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':wid': websiteId, ':open': 'OPEN' },
      ScanIndexForward: false,
      Limit: 1,
    }));

    if (openIncidents.Items?.length > 0) {
      const incident = openIncidents.Items[0];
      const durationSeconds = Math.round((new Date(checkedAt) - new Date(incident.startedAt)) / 1000);
      await ddb.send(new UpdateCommand({
        TableName: TABLES.INCIDENTS,
        Key: { incidentId: incident.incidentId },
        UpdateExpression: 'SET #st = :resolved, recoveredAt = :r, durationSeconds = :d',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':resolved': 'RESOLVED', ':r': checkedAt, ':d': durationSeconds },
      }));
      await sendAlert('UP', { url, incidentId: incident.incidentId, startedAt: incident.startedAt, recoveredAt: checkedAt, durationSeconds });
    }
  }
}

async function sendAlert(type, data) {
  if (!SNS_TOPIC_ARN) {
    console.log('SNS_TOPIC_ARN not configured — skipping notification');
    return;
  }

  let subject, message;
  if (type === 'DOWN') {
    subject = `🔴 SitePulse Alert: ${data.url} is DOWN`;
    message = `
SitePulse Incident Alert
========================
Website:      ${data.url}
Status:       DOWN
Incident ID:  ${data.incidentId}
Started at:   ${data.startedAt}
Reason:       ${data.reason}
Response time: ${data.responseTimeMs != null ? data.responseTimeMs + 'ms' : 'N/A'}

An incident has been opened. You will receive another notification when the website recovers.

— SitePulse Monitoring
    `.trim();
  } else {
    subject = `🟢 SitePulse Recovery: ${data.url} is back UP`;
    message = `
SitePulse Recovery Notification
================================
Website:       ${data.url}
Status:        UP (Recovered)
Incident ID:   ${data.incidentId}
Incident start: ${data.startedAt}
Recovered at:  ${data.recoveredAt}
Downtime:      ${data.durationSeconds != null ? Math.floor(data.durationSeconds / 60) + 'm ' + (data.durationSeconds % 60) + 's' : 'unknown'}

— SitePulse Monitoring
    `.trim();
  }

  try {
    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: subject,
      Message: message,
    }));
  } catch (err) {
    console.error('SNS publish error:', err);
  }
}

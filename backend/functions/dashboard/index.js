/**
 * GET /dashboard/stats — Aggregate stats for the authenticated user
 */
const { ddb, TABLES, QueryCommand } = require('./shared/dynamodb');
const { ok, internalError, getUserId, getMethod } = require('./shared/helpers');

exports.handler = async (event) => {
  try {
    const { CORS_HEADERS } = require('./shared/helpers');
    if (getMethod(event) === 'OPTIONS') {
      return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    const userId = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    // Fetch all websites for user
    const websitesResult = await ddb.send(new QueryCommand({
      TableName: TABLES.WEBSITES,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      Limit: 1000,
    }));

    const websites = websitesResult.Items || [];
    const total = websites.length;
    const operational = websites.filter(w => w.currentStatus === 'UP').length;
    const outages = websites.filter(w => w.currentStatus === 'DOWN').length;
    const unknown = websites.filter(w => w.currentStatus === 'UNKNOWN').length;

    const responseTimes = websites
      .filter(w => w.lastResponseTimeMs != null)
      .map(w => w.lastResponseTimeMs);
    const avgResponseTimeMs = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

    const uptimePct = total > 0 ? Math.round((operational / total) * 10000) / 100 : null;

    // Recent incidents (open)
    const incidentsResult = await ddb.send(new QueryCommand({
      TableName: TABLES.INCIDENTS,
      IndexName: 'userId-startedAt-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId, ':open': 'OPEN' },
      FilterExpression: '#st = :open',
      ExpressionAttributeNames: { '#st': 'status' },
      ScanIndexForward: false,
      Limit: 10,
    }));

    return ok({
      total,
      operational,
      outages,
      unknown,
      avgResponseTimeMs,
      uptimePct,
      recentIncidents: incidentsResult.Items || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return internalError();
  }
};

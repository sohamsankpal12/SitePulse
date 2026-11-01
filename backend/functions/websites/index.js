/**
 * POST   /websites  — Add a website to monitor
 * GET    /websites  — List all websites for this user
 * GET    /websites/{id}   — Get one website
 * PATCH  /websites/{id}   — Update website settings
 * DELETE /websites/{id}   — Remove a website
 */
const { randomUUID } = require('crypto');
const { ddb, TABLES, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('./shared/dynamodb');
const { ok, created, noContent, badRequest, forbidden, notFound, internalError, validateUrl, getUserId, parsePagination, encodeNextToken, getMethod, getPathParam } = require('./shared/helpers');

const TABLE = TABLES.WEBSITES;

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function listWebsites(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { limit, startKey } = parsePagination(event.queryStringParameters || {});

  const result = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    Limit: limit,
    ExclusiveStartKey: startKey,
    ScanIndexForward: false,
  }));

  return ok({
    items: result.Items || [],
    count: result.Count,
    nextToken: encodeNextToken(result.LastEvaluatedKey),
  });
}

async function createWebsite(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON body'); }

  const { url, monitoringInterval = 5, alertThreshold = 2 } = body;
  if (!url) return badRequest('url is required');

  const { valid, reason, parsed } = validateUrl(url);
  if (!valid) return badRequest(reason);

  const intervalMins = Math.max(1, Math.min(60, parseInt(monitoringInterval, 10)));
  const websiteId = randomUUID();
  const now = new Date().toISOString();

  const item = {
    websiteId,
    userId,
    url: parsed.href,
    hostname: parsed.hostname,
    monitoringInterval: intervalMins,
    alertThreshold,
    enabled: true,
    currentStatus: 'UNKNOWN',
    lastCheckedAt: null,
    lastResponseTimeMs: null,
    consecutiveFailures: 0,
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return created(item);
}

async function getWebsite(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const websiteId = getPathParam(event, 'id');
  if (!websiteId) return badRequest('Missing website id');

  const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { websiteId } }));
  if (!result.Item) return notFound('Website not found');
  if (result.Item.userId !== userId) return forbidden();

  return ok(result.Item);
}

async function updateWebsite(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const websiteId = getPathParam(event, 'id');
  const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { websiteId } }));
  if (!existing.Item) return notFound();
  if (existing.Item.userId !== userId) return forbidden();

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON'); }

  const allowed = ['monitoringInterval', 'enabled', 'alertThreshold'];
  const updates = {};
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }
  if (Object.keys(updates).length === 0) return badRequest('No updatable fields provided');

  updates.updatedAt = new Date().toISOString();

  const expParts = Object.keys(updates).map((k) => `#${k} = :${k}`);
  const exprNames = Object.fromEntries(Object.keys(updates).map((k) => [`#${k}`, k]));
  const exprVals = Object.fromEntries(Object.keys(updates).map((k) => [`:${k}`, updates[k]]));

  const updated = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { websiteId },
    UpdateExpression: `SET ${expParts.join(', ')}`,
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: exprVals,
    ReturnValues: 'ALL_NEW',
  }));

  return ok(updated.Attributes);
}

async function deleteWebsite(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const websiteId = getPathParam(event, 'id');
  if (!websiteId) return badRequest('Missing website id');

  const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { websiteId } }));
  if (!existing.Item) return notFound();
  if (existing.Item.userId !== userId) return forbidden();

  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { websiteId } }));
  return noContent();
}

// ─── Router ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  try {
    const { CORS_HEADERS } = require('./shared/helpers');
    // DEBUG: log full event to CloudWatch
    console.log('FULL_EVENT:', JSON.stringify(event));
    const method = getMethod(event);
    const hasId  = !!getPathParam(event, 'id');

    if (method === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    if (method === 'GET' && !hasId) return listWebsites(event);
    if (method === 'POST')          return createWebsite(event);
    if (method === 'GET' && hasId)  return getWebsite(event);
    if (method === 'PATCH' && hasId)  return updateWebsite(event);
    if (method === 'DELETE' && hasId) return deleteWebsite(event);
    if (method === 'DELETE') return deleteWebsite(event);

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Websites handler error:', err);
    return internalError();
  }
};


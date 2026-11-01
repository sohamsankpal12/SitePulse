/**
 * GET /websites/{id}/checks  — list check history for a monitor
 *
 * Query params:
 *   limit      (default 96, max 500)
 *   nextToken  (base64 paginated key)
 *   from       ISO timestamp — only return checks after this time
 */
const { ddb, TABLES, GetCommand, QueryCommand } = require('./shared/dynamodb');
const {
  ok, badRequest, forbidden, notFound, internalError,
  getUserId, parsePagination, encodeNextToken, getMethod, getPathParam,
} = require('./shared/helpers');

exports.handler = async (event) => {
  try {
    const { CORS_HEADERS } = require('./shared/helpers');
    if (getMethod(event) === 'OPTIONS') {
      return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    const userId    = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const websiteId = getPathParam(event, 'id');
    if (!websiteId) return badRequest('Missing website id');

    // Verify ownership
    const siteRes = await ddb.send(new GetCommand({ TableName: TABLES.WEBSITES, Key: { websiteId } }));
    if (!siteRes.Item) return notFound('Website not found');
    if (siteRes.Item.userId !== userId) return forbidden();

    const qs = event.queryStringParameters || {};
    const { limit, startKey } = parsePagination(qs);
    const from = qs.from || null;

    const params = {
      TableName: TABLES.CHECKS,
      KeyConditionExpression: from
        ? 'websiteId = :wid AND checkedAt >= :from'
        : 'websiteId = :wid',
      ExpressionAttributeValues: {
        ':wid': websiteId,
        ...(from && { ':from': from }),
      },
      ScanIndexForward: false,   // newest first
      Limit: limit,
      ExclusiveStartKey: startKey,
    };

    const result = await ddb.send(new QueryCommand(params));

    return ok({
      items: result.Items || [],
      count: result.Count,
      nextToken: encodeNextToken(result.LastEvaluatedKey),
    });

  } catch (err) {
    console.error('Checks handler error:', err);
    return internalError();
  }
};

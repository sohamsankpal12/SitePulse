/**
 * GET /incidents            — List all incidents for this user
 * GET /incidents/{id}       — Get a specific incident
 */
const { ddb, TABLES, QueryCommand } = require('./shared/dynamodb');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ok, badRequest, forbidden, notFound, internalError, getUserId, parsePagination, encodeNextToken, getMethod, getPathParam } = require('./shared/helpers');

exports.handler = async (event) => {
  try {
    const { CORS_HEADERS } = require('./shared/helpers');
    if (getMethod(event) === 'OPTIONS') {
      return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }

    const userId    = getUserId(event);
    if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const incidentId = getPathParam(event, 'id');
    const qs = event.queryStringParameters || {};

    if (incidentId) {
      // Single incident
      const result = await ddb.send(new GetCommand({ TableName: TABLES.INCIDENTS, Key: { incidentId } }));
      if (!result.Item) return notFound('Incident not found');
      if (result.Item.userId !== userId) return forbidden();
      return ok(result.Item);
    }

    // List by userId (GSI: userId-startedAt-index)
    const { limit, startKey } = parsePagination(qs);
    const websiteId = qs.websiteId;

    let result;
    if (websiteId) {
      // Filter by websiteId using GSI
      result = await ddb.send(new QueryCommand({
        TableName: TABLES.INCIDENTS,
        IndexName: 'websiteId-startedAt-index',
        KeyConditionExpression: 'websiteId = :wid',
        ExpressionAttributeValues: { ':wid': websiteId, ':uid': userId },
        FilterExpression: 'userId = :uid',
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
      }));
    } else {
      result = await ddb.send(new QueryCommand({
        TableName: TABLES.INCIDENTS,
        IndexName: 'userId-startedAt-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
      }));
    }

    return ok({
      items: result.Items || [],
      count: result.Count,
      nextToken: encodeNextToken(result.LastEvaluatedKey),
    });
  } catch (err) {
    console.error('Incidents handler error:', err);
    return internalError();
  }
};

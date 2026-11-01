/**
 * Notifications Lambda
 * POST /notifications/email  — subscribe an email to the SNS alert topic
 * GET  /notifications        — list subscriptions for this user
 *
 * Uses AWS SNS for delivery. Subscription confirmation email is sent
 * automatically by SNS upon subscribe.
 */
const { SNSClient, SubscribeCommand, ListSubscriptionsByTopicCommand, UnsubscribeCommand } = require('@aws-sdk/client-sns');
const {
  ok, created, badRequest, forbidden, notFound, internalError,
  getUserId, CORS_HEADERS, getMethod,
} = require('./shared/helpers');
const { ddb, TABLES, GetCommand, PutCommand, DeleteCommand, QueryCommand } = require('./shared/dynamodb');

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// ─── Subscribe email ──────────────────────────────────────────────────────────
async function subscribeEmail(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON'); }

  const { email } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest('A valid email address is required');
  }

  if (!SNS_TOPIC_ARN) {
    return ok({ message: 'Demo mode — SNS not configured', subscriptionArn: null });
  }

  const result = await sns.send(new SubscribeCommand({
    TopicArn: SNS_TOPIC_ARN,
    Protocol: 'email',
    Endpoint: email,
    Attributes: { FilterPolicy: JSON.stringify({ userId: [userId] }) },
  }));

  // Store subscription reference in DynamoDB
  const now = new Date().toISOString();
  await ddb.send(new PutCommand({
    TableName: TABLES.SETTINGS,
    Item: {
      settingId: `notification#${userId}#email#${Buffer.from(email).toString('base64')}`,
      userId,
      type: 'email',
      endpoint: email,
      subscriptionArn: result.SubscriptionArn,
      status: 'PENDING_CONFIRMATION',
      createdAt: now,
      updatedAt: now,
    },
  }));

  return created({
    message: 'Confirmation email sent. Please check your inbox to confirm the subscription.',
    subscriptionArn: result.SubscriptionArn,
  });
}

// ─── List notifications ───────────────────────────────────────────────────────
async function listNotifications(event) {
  const userId = getUserId(event);
  if (!userId) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.SETTINGS,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: 'begins_with(settingId, :prefix)',
    ExpressionAttributeValues: {
      ':uid': userId,
      ':prefix': `notification#${userId}#`,
    },
  }));

  return ok({ items: result.Items || [] });
}

// ─── Router ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  try {
    if (getMethod(event) === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    if (getMethod(event) === 'POST') return subscribeEmail(event);
    if (getMethod(event) === 'GET')  return listNotifications(event);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Notifications handler error:', err);
    return internalError();
  }
};

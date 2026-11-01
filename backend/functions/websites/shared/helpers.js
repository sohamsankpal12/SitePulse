/**
 * SitePulse - Shared response helpers and validators
 */

// ─── HTTP Response Helpers ────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-id',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

const ok = (body, statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

const created = (body) => ok(body, 201);

const noContent = () => ({
  statusCode: 204,
  headers: CORS_HEADERS,
  body: '',
});

const error = (statusCode, message, details = null) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message, ...(details && { details }) }),
});

const badRequest = (msg) => error(400, msg);
const unauthorized = () => error(401, 'Unauthorized');
const forbidden = () => error(403, 'Forbidden');
const notFound = (msg = 'Resource not found') => error(404, msg);
const internalError = () => error(500, 'An internal error occurred');

// ─── URL Validation & SSRF Protection ────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
  /^169\.254\./,
  /^100\.6[4-9]\./,
  /^100\.[7-9][0-9]\./,
  /^100\.1[0-1][0-9]\./,
  /^100\.12[0-7]\./,
  /metadata\.google\.internal/i,
  /169\.254\.169\.254/,
];

function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only http and https URLs are allowed' };
  }
  const hostname = parsed.hostname.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: 'URL targets a private or reserved address' };
    }
  }
  return { valid: true, parsed };
}

// ─── User Identity ────────────────────────────────────────────────────────────
function getUserId(event) {
  // 1. API Gateway JWT Authorizer (when configured)
  const authorizer = event?.requestContext?.authorizer;
  if (authorizer?.jwt?.claims?.sub) return authorizer.jwt.claims.sub;
  if (authorizer?.claims?.sub) return authorizer.claims.sub;

  // 2. Parse JWT from Authorization header directly
  // Frontend sends: Authorization: Bearer <cognito_id_token>
  const authHeader = event?.headers?.Authorization || event?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      // JWT payload is the middle part (base64 encoded)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString('utf8')
      );
      if (payload.sub) return payload.sub;
    } catch {
      // Invalid token — fall through
    }
  }

  // 3. x-user-id header fallback
  const headerUser = event?.headers?.['x-user-id'] || event?.headers?.['X-User-Id'];
  if (headerUser) return headerUser;

  // 4. No auth — return null (caller will return 401)
  return null;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function parsePagination(qs = {}) {
  const limit = Math.min(parseInt(qs.limit || '50', 10), 200);
  const startKey = qs.nextToken
    ? JSON.parse(Buffer.from(qs.nextToken, 'base64').toString())
    : undefined;
  return { limit, startKey };
}

function encodeNextToken(lastKey) {
  if (!lastKey) return undefined;
  return Buffer.from(JSON.stringify(lastKey)).toString('base64');
}

// ─── HTTP Method ──────────────────────────────────────────────────────────────
function getMethod(event) {
  return (
    event.httpMethod ||
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    'GET'
  ).toUpperCase();
}

// ─── Path Parameter ───────────────────────────────────────────────────────────
function getPathParam(event, name) {
  if (event.pathParameters?.[name]) return event.pathParameters[name];
  const path = event.rawPath || event.path || '';
  const segments = path.split('/').filter(Boolean);
  // /websites/{id}         → segments = ['websites', id]
  // /websites/{id}/checks  → segments = ['websites', id, 'checks']
  if (name === 'id') {
    if (segments[0] === 'websites' && segments.length >= 2) return segments[1];
  }
  return null;
}

module.exports = {
  ok, created, noContent, error, badRequest, unauthorized, forbidden, notFound, internalError,
  validateUrl, getUserId, parsePagination, encodeNextToken, getMethod, getPathParam, CORS_HEADERS,
};

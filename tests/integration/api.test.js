/**
 * Integration test stubs — requires a deployed AWS backend.
 *
 * Set the following environment variable before running:
 *   API_BASE_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod
 *   TEST_AUTH_TOKEN=eyJhbGc...  (Cognito JWT)
 *
 * Run: npm run test:integration
 */
const API_BASE = process.env.API_BASE_URL;
const AUTH     = process.env.TEST_AUTH_TOKEN;

if (!API_BASE || !AUTH) {
  console.warn('⚠ Integration tests skipped: API_BASE_URL or TEST_AUTH_TOKEN not set.');
  process.exit(0);
}

const fetch = require('node-fetch');

const headers = {
  Authorization: `Bearer ${AUTH}`,
  'Content-Type': 'application/json',
};

describe('SitePulse API integration', () => {
  let createdId;

  test('POST /websites — create a monitor', async () => {
    const res = await fetch(`${API_BASE}/websites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://example.com', monitoringInterval: 5 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.websiteId).toBeTruthy();
    expect(body.url).toBe('https://example.com/');
    createdId = body.websiteId;
  });

  test('GET /websites — list includes created monitor', async () => {
    const res = await fetch(`${API_BASE}/websites`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.some(w => w.websiteId === createdId)).toBe(true);
  });

  test('GET /websites/:id — returns created monitor', async () => {
    const res = await fetch(`${API_BASE}/websites/${createdId}`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.websiteId).toBe(createdId);
  });

  test('PATCH /websites/:id — update interval', async () => {
    const res = await fetch(`${API_BASE}/websites/${createdId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ monitoringInterval: 10 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monitoringInterval).toBe(10);
  });

  test('GET /dashboard/stats — returns aggregate stats', async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.total).toBe('number');
  });

  test('DELETE /websites/:id — removes monitor', async () => {
    const res = await fetch(`${API_BASE}/websites/${createdId}`, {
      method: 'DELETE',
      headers,
    });
    expect(res.status).toBe(204);
  });

  test('GET /websites/:id after delete — 404', async () => {
    const res = await fetch(`${API_BASE}/websites/${createdId}`, { headers });
    expect(res.status).toBe(404);
  });
});

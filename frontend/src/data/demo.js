/**
 * Demo data — clearly labeled as sample data for the UI preview.
 * When the AWS backend is configured and VITE_API_URL is set,
 * all pages will fetch real data instead.
 */

import { subMinutes, subHours, subDays, formatISO } from 'date-fns';

const now = new Date();

export const DEMO_WEBSITES = [
  {
    websiteId: 'demo-1',
    url: 'https://mycompany.com',
    hostname: 'mycompany.com',
    currentStatus: 'UP',
    lastCheckedAt: formatISO(subMinutes(now, 1)),
    lastResponseTimeMs: 142,
    monitoringInterval: 5,
    enabled: true,
    consecutiveFailures: 0,
    createdAt: formatISO(subDays(now, 30)),
  },
  {
    websiteId: 'demo-2',
    url: 'https://api.mycompany.com',
    hostname: 'api.mycompany.com',
    currentStatus: 'DOWN',
    lastCheckedAt: formatISO(subMinutes(now, 2)),
    lastResponseTimeMs: null,
    monitoringInterval: 1,
    enabled: true,
    consecutiveFailures: 4,
    createdAt: formatISO(subDays(now, 25)),
  },
  {
    websiteId: 'demo-3',
    url: 'https://docs.mycompany.com',
    hostname: 'docs.mycompany.com',
    currentStatus: 'UP',
    lastCheckedAt: formatISO(subMinutes(now, 3)),
    lastResponseTimeMs: 890,
    monitoringInterval: 10,
    enabled: true,
    consecutiveFailures: 0,
    createdAt: formatISO(subDays(now, 20)),
  },
  {
    websiteId: 'demo-4',
    url: 'https://blog.mycompany.com',
    hostname: 'blog.mycompany.com',
    currentStatus: 'UP',
    lastCheckedAt: formatISO(subMinutes(now, 4)),
    lastResponseTimeMs: 310,
    monitoringInterval: 15,
    enabled: true,
    consecutiveFailures: 0,
    createdAt: formatISO(subDays(now, 15)),
  },
  {
    websiteId: 'demo-5',
    url: 'https://status.mycompany.com',
    hostname: 'status.mycompany.com',
    currentStatus: 'UNKNOWN',
    lastCheckedAt: null,
    lastResponseTimeMs: null,
    monitoringInterval: 5,
    enabled: false,
    consecutiveFailures: 0,
    createdAt: formatISO(subDays(now, 5)),
  },
];

export const DEMO_INCIDENTS = [
  {
    incidentId: 'inc-1',
    websiteId: 'demo-2',
    url: 'https://api.mycompany.com',
    startedAt: formatISO(subMinutes(now, 20)),
    recoveredAt: null,
    durationSeconds: null,
    reason: 'CONNECTION_REFUSED',
    status: 'OPEN',
  },
  {
    incidentId: 'inc-2',
    websiteId: 'demo-1',
    url: 'https://mycompany.com',
    startedAt: formatISO(subHours(now, 6)),
    recoveredAt: formatISO(subHours(now, 5.5)),
    durationSeconds: 1820,
    reason: 'HTTP 503',
    status: 'RESOLVED',
  },
  {
    incidentId: 'inc-3',
    websiteId: 'demo-3',
    url: 'https://docs.mycompany.com',
    startedAt: formatISO(subDays(now, 2)),
    recoveredAt: formatISO(subDays(now, 2) + 3600000),
    durationSeconds: 3610,
    reason: 'TIMEOUT',
    status: 'RESOLVED',
  },
];

// Generate 48 hours of check history for demo-1
export function generateDemoChecks(websiteId = 'demo-1', count = 96) {
  const checks = [];
  for (let i = count; i >= 0; i--) {
    const t = subMinutes(now, i * 30);
    const isDown = i === 40 || i === 41; // simulated outage window
    checks.push({
      websiteId,
      checkedAt: formatISO(t),
      status: isDown ? 'DOWN' : 'UP',
      httpStatusCode: isDown ? null : 200,
      responseTimeMs: isDown ? null : Math.round(100 + Math.random() * 400),
      errorType: isDown ? 'TIMEOUT' : null,
    });
  }
  return checks;
}

export const DEMO_STATS = {
  total: 5,
  operational: 3,
  outages: 1,
  unknown: 1,
  avgResponseTimeMs: 447,
  uptimePct: 98.6,
  recentIncidents: DEMO_INCIDENTS.slice(0, 3),
  generatedAt: new Date().toISOString(),
  _isDemo: true,
};

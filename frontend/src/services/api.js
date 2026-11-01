/**
 * API service layer — switches between real API and demo data
 * based on VITE_API_URL environment variable.
 */
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  DEMO_WEBSITES,
  DEMO_INCIDENTS,
  DEMO_STATS,
  generateDemoChecks,
} from '../data/demo';

const API_URL = import.meta.env.VITE_API_URL || '';
const IS_DEMO = !API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (IS_DEMO) return config;

  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error('Not authenticated. Please log in again.');
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// No-auth mode — no token needed. If you add Cognito later,
// uncomment the interceptor below and set VITE_USER_POOL_ID.
//
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('sitepulse_token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// ─── Error normalization ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// ─── Delay helper for demo ────────────────────────────────────────────────────
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── Websites ─────────────────────────────────────────────────────────────────
export const websitesApi = {
  list: async (params = {}) => {
    if (IS_DEMO) {
      await delay();
      return { items: DEMO_WEBSITES, count: DEMO_WEBSITES.length };
    }
    const { data } = await api.get('/websites', { params });
    return data;
  },

  get: async (id) => {
    if (IS_DEMO) {
      await delay(300);
      const site = DEMO_WEBSITES.find((w) => w.websiteId === id);
      if (!site) throw new Error('Not found');
      return site;
    }
    const { data } = await api.get(`/websites/${id}`);
    return data;
  },

  create: async (payload) => {
    if (IS_DEMO) {
      await delay(800);
      return { ...payload, websiteId: `demo-${Date.now()}`, currentStatus: 'UNKNOWN', createdAt: new Date().toISOString() };
    }
    const { data } = await api.post('/websites', payload);
    return data;
  },

  update: async (id, payload) => {
    if (IS_DEMO) {
      await delay(500);
      return { websiteId: id, ...payload };
    }
    const { data } = await api.patch(`/websites/${id}`, payload);
    return data;
  },

  delete: async (id) => {
    if (IS_DEMO) {
      await delay(500);
      return;
    }
    await api.delete(`/websites/${id}`);
  },
};

// ─── Checks ───────────────────────────────────────────────────────────────────
export const checksApi = {
  list: async (websiteId, params = {}) => {
    if (IS_DEMO) {
      await delay(500);
      return { items: generateDemoChecks(websiteId), count: 97 };
    }
    const { data } = await api.get(`/websites/${websiteId}/checks`, { params });
    return data;
  },
};

// ─── Incidents ────────────────────────────────────────────────────────────────
export const incidentsApi = {
  list: async (params = {}) => {
    if (IS_DEMO) {
      await delay(600);
      return { items: DEMO_INCIDENTS, count: DEMO_INCIDENTS.length };
    }
    const { data } = await api.get('/incidents', { params });
    return data;
  },

  get: async (id) => {
    if (IS_DEMO) {
      await delay(300);
      const inc = DEMO_INCIDENTS.find((i) => i.incidentId === id);
      if (!inc) throw new Error('Not found');
      return inc;
    }
    const { data } = await api.get(`/incidents/${id}`);
    return data;
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: async () => {
    if (IS_DEMO) {
      await delay(700);
      return DEMO_STATS;
    }
    const { data } = await api.get('/dashboard/stats');
    return data;
  },
};

export { IS_DEMO };

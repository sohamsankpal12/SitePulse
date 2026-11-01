import { formatDistanceToNow, format, parseISO, differenceInSeconds } from 'date-fns';

export function timeAgo(isoString) {
  if (!isoString) return '—';
  try { return formatDistanceToNow(parseISO(isoString), { addSuffix: true }); }
  catch { return '—'; }
}

export function fmtDate(isoString, fmt = 'MMM d, HH:mm') {
  if (!isoString) return '—';
  try { return format(parseISO(isoString), fmt); }
  catch { return '—'; }
}

export function fmtDuration(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

export function fmtMs(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function statusLabel(status) {
  const map = { UP: 'Operational', DOWN: 'Outage', UNKNOWN: 'Unknown', DEGRADED: 'Degraded' };
  return map[status] || status || 'Unknown';
}

export function statusClass(status) {
  const map = { UP: 'up', DOWN: 'down', DEGRADED: 'degraded', UNKNOWN: 'unknown' };
  return map[status] || 'unknown';
}

export function uptimePct(checks = []) {
  if (!checks.length) return null;
  const up = checks.filter((c) => c.status === 'UP').length;
  return Math.round((up / checks.length) * 10000) / 100;
}

export function avgResponseTime(checks = []) {
  const valid = checks.filter((c) => c.responseTimeMs != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((s, c) => s + c.responseTimeMs, 0) / valid.length);
}

export function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * WebsiteDetail page — per-monitor stats, uptime bar, response time chart,
 * check history table, and toggle enable/disable.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Power, ExternalLink } from 'lucide-react';
import { useApi }            from '../hooks/useApi';
import { websitesApi, checksApi } from '../services/api';
import LoadingSpinner        from '../components/LoadingSpinner';
import ErrorAlert            from '../components/ErrorAlert';
import StatusBadge           from '../components/StatusBadge';
import UptimeBar             from '../components/UptimeBar';
import ResponseTimeChart     from '../components/ResponseTimeChart';
import { fmtMs, fmtDate, timeAgo, uptimePct, avgResponseTime, statusClass } from '../utils/format';

export default function WebsiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);

  const { data: site,   loading: sLoading, error: sError, refetch: sRefetch } = useApi(
    () => websitesApi.get(id), [id]
  );
  const { data: checksData, loading: cLoading, error: cError, refetch: cRefetch } = useApi(
    () => checksApi.list(id, { limit: 96 }), [id]
  );

  const checks = checksData?.items ?? [];
  const loading = sLoading || cLoading;
  const error   = sError   || cError;

  if (loading) return <LoadingSpinner message="Loading monitor…" />;
  if (!site && !sLoading) return (
    <div className="page-wrap">
      <ErrorAlert message={sError || 'Monitor not found'} onRetry={sRefetch} />
    </div>
  );

  const uptime = uptimePct(checks);
  const avgRt  = avgResponseTime(checks);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await websitesApi.update(id, { enabled: !site.enabled });
      sRefetch();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="page-wrap">
      {/* Back nav */}
      <button className="btn btn-ghost back-btn" onClick={() => navigate('/websites')}>
        <ArrowLeft size={14} /> Monitors
      </button>

      {error && <ErrorAlert message={error} onRetry={() => { sRefetch(); cRefetch(); }} />}

      {/* Hero header */}
      <div className="detail-hero">
        <div className="detail-hero-left">
          <div className="detail-title-row">
            <span className={`status-dot ${statusClass(site?.currentStatus)} pulse`} style={{ width: 12, height: 12 }} />
            <h1 className="detail-hostname">{site?.hostname || site?.url}</h1>
            <StatusBadge status={site?.currentStatus} />
            {!site?.enabled && <span className="badge badge-unknown">Paused</span>}
          </div>
          <a className="detail-url" href={site?.url} target="_blank" rel="noreferrer">
            {site?.url} <ExternalLink size={12} />
          </a>
        </div>
        <div className="detail-hero-actions">
          <button
            className="btn btn-secondary"
            onClick={() => { sRefetch(); cRefetch(); }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className={`btn ${site?.enabled ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggle}
            disabled={toggling}
            id="detail-toggle-btn"
          >
            <Power size={14} />
            {toggling ? '…' : site?.enabled ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid stats-grid-4">
        <div className="stat-card">
          <div className="stat-label">Response Time</div>
          <div className="stat-value">{fmtMs(site?.lastResponseTimeMs)}</div>
          <div className="stat-sub">Last check</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Response</div>
          <div className="stat-value">{fmtMs(avgRt)}</div>
          <div className="stat-sub">Last 48h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Uptime</div>
          <div className="stat-value">{uptime != null ? `${uptime}%` : '—'}</div>
          <div className="stat-sub">Last 48h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Check Interval</div>
          <div className="stat-value">{site?.monitoringInterval}m</div>
          <div className="stat-sub">Last checked {timeAgo(site?.lastCheckedAt)}</div>
        </div>
      </div>

      {/* Uptime bar */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="section-title">Uptime — Last 48h</h2>
          <span className="section-hint">{checks.length} checks</span>
        </div>
        <UptimeBar checks={checks} slots={96} />
        <div className="uptime-bar-legend">
          <span><span className="legend-dot up" />Up</span>
          <span><span className="legend-dot down" />Down</span>
          <span><span className="legend-dot unknown" />No data</span>
        </div>
      </div>

      {/* Response time chart */}
      {checks.length > 0 && (
        <div className="section-card">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Response Time</h2>
          <ResponseTimeChart checks={checks} />
        </div>
      )}

      {/* Check history table */}
      <div className="section-card">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>Check History</h2>
        <div className="table-scroll">
          <table className="data-table" aria-label="Check history">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>HTTP</th>
                <th>Response</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {[...checks].reverse().slice(0, 50).map((c, i) => (
                <tr key={i}>
                  <td className="mono">{fmtDate(c.checkedAt)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="mono">{c.httpStatusCode ?? '—'}</td>
                  <td className="mono">{fmtMs(c.responseTimeMs)}</td>
                  <td className="error-type">{c.errorType ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

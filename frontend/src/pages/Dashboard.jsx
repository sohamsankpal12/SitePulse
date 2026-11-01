/**
 * Dashboard page — global stats, uptime overview, recent incidents.
 */
import { useNavigate } from 'react-router-dom';
import {
  Globe, AlertTriangle, TrendingUp, Activity,
  RefreshCw, ArrowRight
} from 'lucide-react';
import { useApi }        from '../hooks/useApi';
import { dashboardApi, websitesApi } from '../services/api';
import LoadingSpinner    from '../components/LoadingSpinner';
import ErrorAlert        from '../components/ErrorAlert';
import PageHeader        from '../components/PageHeader';
import StatusBadge       from '../components/StatusBadge';
import { fmtMs, fmtDuration, timeAgo, statusClass } from '../utils/format';

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTopColor: accent, borderTopWidth: 2 } : {}}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={accent ? { color: accent } : {}}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, loading: sLoading, error: sError, refetch: sRefetch } = useApi(
    () => dashboardApi.stats()
  );
  const { data: sitesData, loading: wLoading, error: wError, refetch: wRefetch } = useApi(
    () => websitesApi.list()
  );

  const loading = sLoading || wLoading;
  const error   = sError   || wError;

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div className="page-wrap">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of all monitored websites"
        action={
          <button
            id="dashboard-refresh-btn"
            className="btn btn-secondary"
            onClick={() => { sRefetch(); wRefetch(); }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={() => { sRefetch(); wRefetch(); }} />}

      {/* Stat grid */}
      <div className="stats-grid">
        <StatCard
          icon={Globe}
          label="Total Monitors"
          value={stats?.total ?? 0}
          sub={`${stats?.operational ?? 0} operational`}
          accent="var(--color-accent)"
        />
        <StatCard
          icon={Activity}
          label="Uptime"
          value={stats?.uptimePct != null ? `${Number(stats.uptimePct).toFixed(1)}%` : '—'}
          sub="Last 24 hours"
          accent="var(--color-up)"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Response"
          value={fmtMs(stats?.avgResponseTimeMs)}
          sub="Across all monitors"
          accent="var(--color-accent-light)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Outages"
          value={stats?.outages ?? 0}
          sub={stats?.outages > 0 ? 'Requires attention' : 'All clear'}
          accent={stats?.outages > 0 ? 'var(--color-down)' : 'var(--color-up)'}
        />
      </div>

      {/* Monitors overview */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="section-title">Monitors</h2>
          <button className="btn btn-ghost" onClick={() => navigate('/websites')}>
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="monitor-list">
          {(sitesData?.items ?? []).slice(0, 5).map((site) => (
            <div
              key={site.websiteId}
              className="monitor-row"
            >
              <div className="monitor-row-left">
                <span className={`status-dot ${statusClass(site.currentStatus)} pulse`} />
                <div>
                  <div className="monitor-hostname">{site.hostname || site.url}</div>
                  <div className="monitor-url-small">{site.url}</div>
                </div>
              </div>
              <div className="monitor-row-right">
                <StatusBadge status={site.currentStatus} />
                <span className="monitor-rt">{fmtMs(site.lastResponseTimeMs)}</span>
                <span className="monitor-checked">{timeAgo(site.lastCheckedAt)}</span>
              </div>
            </div>
          ))}
          {(!sitesData?.items?.length) && (
            <div className="empty-row">No monitors yet — <button className="link-btn" onClick={() => navigate('/websites')}>add one</button></div>
          )}
        </div>
      </div>

      {/* Recent incidents */}
      {stats?.recentIncidents?.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-title">Recent Incidents</h2>
            <button className="btn btn-ghost" onClick={() => navigate('/incidents')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="incidents-list">
            {stats.recentIncidents.map((inc) => (
              <div key={inc.incidentId} className="incident-row">
                <div className="incident-row-left">
                  <span className={`status-dot ${inc.status === 'OPEN' ? 'down pulse' : 'up'}`} />
                  <div>
                    <div className="incident-url">{inc.url}</div>
                    <div className="incident-reason">{inc.reason}</div>
                  </div>
                </div>
                <div className="incident-row-right">
                  <span className={`badge badge-${inc.status === 'OPEN' ? 'down' : 'up'}`}>
                    {inc.status}
                  </span>
                  {inc.durationSeconds && (
                    <span className="incident-duration">{fmtDuration(inc.durationSeconds)}</span>
                  )}
                  <span className="incident-time">{timeAgo(inc.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?._isDemo && (
        <div className="demo-banner" role="note">
          <span>📊</span>
          <strong>Demo mode</strong> — showing sample data. Set <code>VITE_API_URL</code> to connect your AWS backend.
        </div>
      )}
    </div>
  );
}

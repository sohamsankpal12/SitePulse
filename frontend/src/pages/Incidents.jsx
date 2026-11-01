/**
 * Incidents page — list of all incidents (open + resolved) with filters.
 */
import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useApi }        from '../hooks/useApi';
import { incidentsApi } from '../services/api';
import LoadingSpinner   from '../components/LoadingSpinner';
import ErrorAlert       from '../components/ErrorAlert';
import PageHeader       from '../components/PageHeader';
import EmptyState       from '../components/EmptyState';
import { fmtDuration, fmtDate, timeAgo } from '../utils/format';

const FILTERS = ['ALL', 'OPEN', 'RESOLVED'];

export default function Incidents() {
  const [filter, setFilter] = useState('ALL');
  const { data, loading, error, refetch } = useApi(() => incidentsApi.list());

  const incidents = (data?.items ?? []).filter((inc) =>
    filter === 'ALL' || inc.status === filter
  );

  return (
    <div className="page-wrap">
      <PageHeader
        title="Incidents"
        subtitle="History of detected outages and downtime events"
        action={
          <button id="incidents-refresh-btn" className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={refetch} />}

      {/* Filter tabs */}
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            id={`incident-filter-${f.toLowerCase()}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading incidents…" />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents"
          description={filter === 'ALL' ? 'Great news — no incidents recorded.' : `No ${filter.toLowerCase()} incidents.`}
        />
      ) : (
        <div className="section-card" style={{ padding: 0 }}>
          <table className="data-table" aria-label="Incidents table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Website</th>
                <th>Reason</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Recovered</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.incidentId}>
                  <td>
                    <span className={`badge badge-${inc.status === 'OPEN' ? 'down' : 'up'}`}>
                      <span className={`status-dot ${inc.status === 'OPEN' ? 'down pulse' : 'up'}`} />
                      {inc.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-hostname">{inc.url}</div>
                  </td>
                  <td>
                    <span className="reason-badge">{inc.reason}</span>
                  </td>
                  <td className="mono">{fmtDate(inc.startedAt)}</td>
                  <td className="mono">{inc.durationSeconds ? fmtDuration(inc.durationSeconds) : <span className="text-down">Ongoing</span>}</td>
                  <td className="mono">{inc.recoveredAt ? fmtDate(inc.recoveredAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

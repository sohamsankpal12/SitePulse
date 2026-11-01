/**
 * WebsiteList page — table of all monitored websites with add/delete actions.
 */
import { useState } from 'react';
import { Plus, Globe, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useApi }        from '../hooks/useApi';
import { websitesApi }  from '../services/api';
import LoadingSpinner   from '../components/LoadingSpinner';
import ErrorAlert       from '../components/ErrorAlert';
import PageHeader       from '../components/PageHeader';
import StatusBadge      from '../components/StatusBadge';
import EmptyState       from '../components/EmptyState';
import Modal            from '../components/Modal';
import AddWebsiteForm   from '../components/AddWebsiteForm';
import { fmtMs, timeAgo } from '../utils/format';

export default function WebsiteList() {
  const [showAdd, setShowAdd]     = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const { data, loading, error, refetch } = useApi(() => websitesApi.list());

  const sites = data?.items ?? [];

  const handleAdded = () => {
    setShowAdd(false);
    refetch();
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Delete monitor for ${site.url}?`)) return;
    setDeleting(site.websiteId);
    try {
      await websitesApi.delete(site.websiteId);
      refetch();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title="Monitors"
        subtitle={`${sites.length} website${sites.length !== 1 ? 's' : ''} being monitored`}
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button id="monitors-refresh-btn" className="btn btn-secondary" onClick={refetch}>
              <RefreshCw size={14} />
            </button>
            <button id="monitors-add-btn" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={14} />
              Add Monitor
            </button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={refetch} />}

      {loading ? (
        <LoadingSpinner message="Loading monitors…" />
      ) : sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No monitors yet"
          description="Add your first website to start tracking uptime, response times, and incidents."
          action={
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Monitor
            </button>
          }
        />
      ) : (
        <div className="table-card">
          <table className="data-table" aria-label="Monitors table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Website</th>
                <th>Response</th>
                <th>Interval</th>
                <th>Last Checked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr
                  key={site.websiteId}
                >
                  <td><StatusBadge status={site.currentStatus} /></td>
                  <td>
                    <div className="table-site-cell">
                      <span className="table-hostname">{site.hostname || site.url}</span>
                      <a
                        className="table-ext-link"
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${site.url}`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="table-url-small">{site.url}</div>
                  </td>
                  <td className="mono">{fmtMs(site.lastResponseTimeMs)}</td>
                  <td>{site.monitoringInterval}m</td>
                  <td>{timeAgo(site.lastCheckedAt)}</td>
                  <td>
                    <button
                      className="btn btn-ghost icon-btn danger-hover"
                      onClick={() => handleDelete(site)}
                      disabled={deleting === site.websiteId}
                      aria-label={`Delete ${site.url}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Monitor">
        <AddWebsiteForm onSuccess={handleAdded} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

/**
 * AddWebsiteForm — controlled form for creating a new monitor.
 * Submitted via websitesApi.create(); calls onSuccess/onCancel.
 */
import { useState } from 'react';
import { Globe, Clock, AlertCircle } from 'lucide-react';
import { websitesApi } from '../services/api';

const INTERVALS = [1, 5, 10, 15, 30, 60];

export default function AddWebsiteForm({ onSuccess, onCancel }) {
  const [form, setForm]     = useState({ url: '', monitoringInterval: 5, enabled: true });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.url.trim()) { setError('URL is required.'); return; }
    try {
      setLoading(true);
      const payload = {
        ...form,
        url: form.url.trim(),
        monitoringInterval: Number(form.monitoringInterval),
      };
      const created = await websitesApi.create(payload);
      onSuccess(created);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create monitor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="add-website-form" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="form-error-banner" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="aw-url" className="form-label">
          <Globe size={14} />
          URL to monitor
        </label>
        <input
          id="aw-url"
          name="url"
          type="url"
          className="form-input"
          placeholder="https://example.com"
          value={form.url}
          onChange={handleChange}
          required
          autoFocus
        />
        <span className="form-hint">Must include https://</span>
      </div>

      <div className="form-group">
        <label htmlFor="aw-interval" className="form-label">
          <Clock size={14} />
          Check interval
        </label>
        <select
          id="aw-interval"
          name="monitoringInterval"
          className="form-select"
          value={form.monitoringInterval}
          onChange={handleChange}
        >
          {INTERVALS.map((v) => (
            <option key={v} value={v}>Every {v} minute{v !== 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="form-group form-check-row">
        <input
          id="aw-enabled"
          name="enabled"
          type="checkbox"
          className="form-checkbox"
          checked={form.enabled}
          onChange={handleChange}
        />
        <label htmlFor="aw-enabled" className="form-check-label">
          Start monitoring immediately
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding…' : 'Add Monitor'}
        </button>
      </div>
    </form>
  );
}

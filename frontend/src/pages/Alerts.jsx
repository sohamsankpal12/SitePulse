/**
 * Alerts page — notification preferences (email, webhook) + demo info.
 * In demo mode shows instructions. With API: would manage SNS subscriptions.
 */
import { useState } from 'react';
import { Bell, Mail, Webhook, Info, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { IS_DEMO } from '../services/api';

export default function Alerts() {
  const [email, setEmail]   = useState('');
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // In real mode: POST /notifications/email with { email }
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-wrap">
      <PageHeader
        title="Alerts"
        subtitle="Configure notifications for downtime and recovery events"
      />

      {IS_DEMO && (
        <div className="info-banner" role="note">
          <Info size={16} />
          <div>
            <strong>Demo mode</strong> — In production, email alerts are delivered via AWS SNS.
            Connect your backend to enable real notifications.
          </div>
        </div>
      )}

      {/* Email notifications */}
      <div className="section-card">
        <div className="alerts-section-header">
          <div className="alerts-icon-wrap">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="section-title">Email Notifications</h2>
            <p className="section-desc">Receive an email when a monitor goes down or recovers.</p>
          </div>
        </div>

        <form className="alerts-form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="alert-email" className="form-label">Alert email address</label>
            <input
              id="alert-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !email}
            id="alerts-save-btn"
          >
            {saved ? (
              <><CheckCircle size={14} /> Saved!</>
            ) : saving ? 'Saving…' : 'Save Email'}
          </button>
        </form>
      </div>

      {/* Webhook (future) */}
      <div className="section-card">
        <div className="alerts-section-header">
          <div className="alerts-icon-wrap">
            <Webhook size={20} />
          </div>
          <div>
            <h2 className="section-title">Webhook</h2>
            <p className="section-desc">POST a JSON payload to a custom URL on status changes.</p>
          </div>
        </div>
        <div className="coming-soon-tag">Coming soon</div>
      </div>

      {/* How it works */}
      <div className="section-card how-it-works">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>
          <Bell size={16} style={{ marginRight: 6 }} />
          How alerts work
        </h2>
        <ol className="how-list">
          <li>SitePulse checks your website every <strong>N minutes</strong> (configurable per monitor).</li>
          <li>If a check fails, a downtime incident is opened and an <strong>alert is fired immediately</strong>.</li>
          <li>When the site recovers, a second notification is sent with the total downtime duration.</li>
          <li>Alerts are deduplicated — you won't receive spam during an extended outage.</li>
        </ol>
      </div>
    </div>
  );
}

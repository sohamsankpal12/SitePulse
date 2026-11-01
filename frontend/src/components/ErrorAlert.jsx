/**
 * ErrorAlert — dismissible error card
 */
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function ErrorAlert({ message, onRetry }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="error-alert" role="alert">
      <AlertCircle size={16} />
      <span>{message}</span>
      <div className="error-alert-actions">
        {onRetry && (
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={onRetry}>
            Retry
          </button>
        )}
        <button className="btn btn-ghost icon-btn" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

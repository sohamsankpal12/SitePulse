/**
 * StatusBadge — pill badge for UP / DOWN / DEGRADED / UNKNOWN
 */
import { statusLabel, statusClass } from '../utils/format';

export default function StatusBadge({ status, size = 'md' }) {
  const cls = statusClass(status);
  return (
    <span className={`badge badge-${cls} badge-${size}`}>
      <span className={`status-dot ${cls}`} />
      {statusLabel(status)}
    </span>
  );
}

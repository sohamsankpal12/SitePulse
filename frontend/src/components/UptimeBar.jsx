/**
 * UptimeBar — 90-slot sparkline bar showing per-check status.
 * Each slot is a colored rectangle (green=UP, red=DOWN, amber=DEGRADED, grey=UNKNOWN).
 */
import { statusClass } from '../utils/format';

export default function UptimeBar({ checks = [], slots = 90 }) {
  // Pad to `slots` with null if checks < slots
  const padded = Array.from({ length: slots }, (_, i) => {
    const c = checks[checks.length - slots + i];
    return c || null;
  });

  return (
    <div className="uptime-bar" aria-label="Uptime history">
      {padded.map((check, i) => {
        const cls = check ? statusClass(check.status) : 'empty';
        const label = check
          ? `${check.status} — ${new Date(check.checkedAt).toLocaleTimeString()}`
          : 'No data';
        return (
          <div
            key={i}
            className={`uptime-slot ${cls}`}
            title={label}
          />
        );
      })}
    </div>
  );
}

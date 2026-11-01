/**
 * ResponseTimeChart — Recharts area chart for historical response times.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const ms = payload[0]?.value;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      {ms != null ? (
        <div className="chart-tooltip-value">{ms}ms</div>
      ) : (
        <div className="chart-tooltip-value down">Outage</div>
      )}
    </div>
  );
};

export default function ResponseTimeChart({ checks = [] }) {
  const data = checks.map((c) => ({
    time: (() => {
      try { return format(parseISO(c.checkedAt), 'HH:mm'); }
      catch { return c.checkedAt; }
    })(),
    ms: c.status === 'DOWN' ? null : c.responseTimeMs,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="ms"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#rtGrad)"
          connectNulls={false}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

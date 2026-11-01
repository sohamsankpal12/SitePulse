/**
 * Settings page — account/API configuration info and environment variables guide.
 */
import { Settings2, Server, Database, Cloud } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { IS_DEMO } from '../services/api';

function SettingRow({ label, value, mono }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <span className={`setting-value ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="page-wrap">
      <PageHeader
        title="Settings"
        subtitle="Application configuration and deployment information"
      />

      {/* Connection status */}
      <div className="section-card">
        <div className="settings-section-header">
          <Server size={18} />
          <h2 className="section-title">Connection</h2>
        </div>
        <SettingRow
          label="Mode"
          value={IS_DEMO ? '🟡 Demo (no backend)' : '🟢 Live (AWS backend)'}
        />
        <SettingRow
          label="API URL"
          value={import.meta.env.VITE_API_URL || 'Not configured'}
          mono
        />
        <SettingRow
          label="Version"
          value={import.meta.env.VITE_APP_VERSION || '1.0.0'}
          mono
        />
      </div>

      {/* Infrastructure info */}
      <div className="section-card">
        <div className="settings-section-header">
          <Cloud size={18} />
          <h2 className="section-title">AWS Infrastructure</h2>
        </div>
        <div className="infra-grid">
          {[
            { icon: Database, label: 'Database',   value: 'DynamoDB (4 tables)'        },
            { icon: Cloud,    label: 'Functions',  value: 'AWS Lambda (Node 20.x)'     },
            { icon: Server,   label: 'API',        value: 'API Gateway (REST)'         },
            { icon: Settings2,label: 'Scheduler',  value: 'EventBridge Scheduler'      },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="infra-card">
              <Icon size={20} className="infra-icon" />
              <div>
                <div className="infra-label">{label}</div>
                <div className="infra-value">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

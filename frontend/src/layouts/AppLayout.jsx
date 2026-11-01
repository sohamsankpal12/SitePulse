/**
 * AppLayout — persistent sidebar + main content wrapper.
 * Sidebar collapses to an overlay on mobile (hamburger toggle).
 */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Globe, AlertTriangle, Bell, Settings,
  Menu, X, Zap, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/websites',  icon: Globe,           label: 'Monitors'  },
  { to: '/incidents', icon: AlertTriangle,   label: 'Incidents' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts'    },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigation">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <Zap size={18} />
          </div>
          <span className="logo-text">SitePulse</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={12} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-badge">
            <span className="status-dot up pulse" />
            <span>All systems monitored</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Mobile top bar */}
        <header className="mobile-topbar">
          <button
            className="btn btn-ghost icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="logo-text" style={{ fontSize: '1rem' }}>SitePulse</div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

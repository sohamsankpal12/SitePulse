import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import WebsiteList from './pages/WebsiteList';
import WebsiteDetail from './pages/WebsiteDetail';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function ProtectedApp() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/websites" element={<WebsiteList />} />
              <Route path="/websites/:id" element={<WebsiteDetail />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}

export default ProtectedApp;
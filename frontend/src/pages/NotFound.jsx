/**
 * NotFound — 404 fallback page
 */
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found-wrap">
      <div className="not-found-icon"><AlertCircle size={48} strokeWidth={1} /></div>
      <h1 className="not-found-title">404</h1>
      <p className="not-found-desc">This page doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        <Home size={14} /> Go to Dashboard
      </button>
    </div>
  );
}

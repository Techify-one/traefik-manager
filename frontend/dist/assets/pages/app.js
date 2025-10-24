import { React, html } from '../lib/html.js';
import { Routes, Route, Navigate, useLocation } from 'https://esm.sh/react-router-dom@6.22.3?bundle';
import DashboardPage from './dashboard.js';
import LoginPage from './login.js';
import ApiDocsPage from './api-docs.js';
import { useSession } from '../context/session-context.js';

function ProtectedRoute({ children }) {
  const { info, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return html`<div class="flex h-screen items-center justify-center">
      <div class="animate-spin h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600"></div>
    </div>`;
  }

  if (!info?.authenticated) {
    return html`<${Navigate} to="/login" replace state=${{ from: location.pathname }} />`;
  }

  return children;
}

function App() {
  return html`
    <${Routes}>
      <${Route} path="/" element=${html`<${ProtectedRoute}><${DashboardPage} /></${ProtectedRoute}>`} />
      <${Route} path="/login" element=${html`<${LoginPage} />`} />
      <${Route} path="/api-docs" element=${html`<${ProtectedRoute}><${ApiDocsPage} /></${ProtectedRoute}>`} />
      <${Route} path="*" element=${html`<${Navigate} to="/" replace />`} />
    </${Routes}>
  `;
}

export default App;

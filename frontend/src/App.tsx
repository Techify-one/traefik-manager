import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './context/session-context';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';
import { ApiDocsPage } from './pages/api-docs-page';
import { useMemo } from 'react';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { loading, info } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!info.authenticated) {
    return <Navigate to="/login.php" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  const { info } = useSession();

  const appTitle = useMemo(() => info.appName ?? 'Traefik Manager', [info.appName]);

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/index.php" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/api-docs" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />
        <Route path="/api-docs.php" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage title={appTitle} />} />
        <Route path="/login.php" element={<LoginPage title={appTitle} />} />
        <Route path="*" element={<Navigate to={info.authenticated ? '/' : '/login.php'} replace />} />
      </Routes>
    </div>
  );
}

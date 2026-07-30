import { Navigate, Route, Routes } from 'react-router';
import { useAuthStore } from './store/authStore';
import AppLayout from './layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ExtensionsPage from './pages/ExtensionsPage';
import DevicesPage from './pages/DevicesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import CallLogsPage from './pages/CallLogsPage';
import LiveCallsPage from './pages/LiveCallsPage';
import RecordingsPage from './pages/RecordingsPage';
import SystemPage from './pages/SystemPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="extensions" element={<ExtensionsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="calls" element={<CallLogsPage />} />
        <Route path="live-calls" element={<LiveCallsPage />} />
        <Route path="recordings" element={<RecordingsPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

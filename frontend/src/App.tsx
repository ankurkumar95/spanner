import { Routes, Route, Navigate } from 'react-router';
import Login from './pages/Login';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Segments from './pages/Segments';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import Approvals from './pages/Approvals';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="segments" element={<Segments />} />
        <Route path="companies" element={<Companies />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

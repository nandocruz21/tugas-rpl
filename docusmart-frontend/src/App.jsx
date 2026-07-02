import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import UserManagement from './pages/admin/UserManagement';
import AuditTrails from './pages/admin/AuditTrails';
import Profile from './pages/profile/Profile';
import SharedDocuments from './pages/dashboard/SharedDocuments';
import AllDocuments from './pages/dashboard/AllDocuments';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes inside MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<AllDocuments />} />
          <Route path="/shared" element={<SharedDocuments />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/audit-trails" element={<AuditTrails />} />
          </Route>
        </Route>
      </Route>

      {/* Redirect all unknown routes to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

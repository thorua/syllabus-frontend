import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersListPage } from './pages/users/UsersListPage';
import { AuditPage } from './pages/audit/AuditPage';
import { PregradoPage } from './pages/catalog/PregradoPage';
import { PosgradoPage } from './pages/catalog/PosgradoPage';
import { SubjectsPage } from './pages/catalog/SubjectsPage';
import { SyllabusListPage } from './pages/syllabus/SyllabusListPage';
import { SyllabusDetailPage } from './pages/syllabus/SyllabusDetailPage';
import { SyllabusFormPage } from './pages/syllabus/SyllabusFormPage';
import { SyllabusVersionsPage } from './pages/syllabus/SyllabusVersionsPage';
import { PermissionGuard } from './components/guards/PermissionGuard';
import { PENDING_ROUTES, UnderConstructionPage } from './pages/UnderConstructionPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Páginas de acceso: si ya hay sesión, ir al inicio. */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

const SYLLABUS_ROUTES = [
  { path: '/syllabus', permission: 'syllabus:read', page: <SyllabusListPage /> },
  { path: '/syllabus/new', permission: 'syllabus:create', page: <SyllabusFormPage /> },
  { path: '/syllabus/:id', permission: 'syllabus:read', page: <SyllabusDetailPage /> },
  { path: '/syllabus/:id/edit', permission: 'syllabus:update', page: <SyllabusFormPage /> },
  {
    path: '/syllabus/:id/versions',
    permission: 'syllabus:versions',
    page: <SyllabusVersionsPage />,
  },
];

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {SYLLABUS_ROUTES.map(({ path, permission, page }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <PermissionGuard permission={permission}>{page}</PermissionGuard>
            </ProtectedRoute>
          }
        />
      ))}

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="user:read">
              <UsersListPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="audit:read">
              <AuditPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pregrado"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="department:read">
              <PregradoPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/posgrado"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="program:read">
              <PosgradoPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="subject:read">
              <SubjectsPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-subjects"
        element={
          <ProtectedRoute>
            <PermissionGuard permission="subject:read">
              <SubjectsPage />
            </PermissionGuard>
          </ProtectedRoute>
        }
      />

      {Object.keys(PENDING_ROUTES).map((path) => (
        <Route
          key={path}
          path={`${path}/*`}
          element={
            <ProtectedRoute>
              <UnderConstructionPage />
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/departments" element={<Navigate to="/pregrado" replace />} />
      <Route path="/programs" element={<Navigate to="/posgrado" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;

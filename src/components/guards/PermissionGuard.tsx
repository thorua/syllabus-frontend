import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

interface PermissionGuardProps {
  /** Permiso efectivo requerido, p. ej. 'user:read'. */
  permission: string;
  children: ReactNode;
}

/** Sustituye al RoleGuard anterior: decide por permiso efectivo, no por rol. */
export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <Navigate to="/" replace />;
}

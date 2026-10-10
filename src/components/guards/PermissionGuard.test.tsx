import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';

const permissions = new Set<string>();

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ can: (permission: string) => permissions.has(permission) }),
}));

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Dashboard</p>} />
        <Route
          path="/users"
          element={
            <PermissionGuard permission="user:read">
              <p>Usuarios</p>
            </PermissionGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PermissionGuard', () => {
  afterEach(() => {
    cleanup();
    permissions.clear();
  });

  it('muestra la página cuando el usuario tiene el permiso efectivo', () => {
    permissions.add('user:read');
    renderAt('/users');
    expect(screen.getByText('Usuarios')).toBeTruthy();
  });

  it('redirige al inicio cuando le falta el permiso', () => {
    permissions.add('syllabus:read');
    renderAt('/users');
    expect(screen.queryByText('Usuarios')).toBeNull();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
});

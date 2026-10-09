import type { Gender, PermissionOverride, Role } from './enums';
import type { Department, Program } from './catalog';

export interface User {
  id: string;
  email: string;
  name: string;
  /** Rol de mayor jerarquía; solo para mostrar. */
  role: Role;
  roles: Role[];
  gender?: Gender;
  phone?: string;
  isActive: boolean;
  departments: Department[];
  programs: Program[];
  permissionOverrides: PermissionOverride[];
  /** Permisos efectivos ("recurso:acción") calculados por el backend. */
  permissions: string[];
  studentCode?: string;
  employeeCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface UserFilters {
  search?: string;
  departmentId?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

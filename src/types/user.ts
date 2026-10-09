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

/** Datos básicos y roles (UC3). password: obligatoria al crear; al editar, opcional. */
export interface UserInput {
  name: string;
  email: string;
  password?: string;
  roles: Role[];
  phone?: string;
  isActive?: boolean;
}

export interface AffiliationsInput {
  departmentIds: string[];
  programIds: string[];
}

import type { User } from './user';

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  level: string;
  department?: Department | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  semester: number;
  program: Program;
  department?: Department | null;
  professor?: Pick<User, 'id' | 'name' | 'email'> | null;
  modality?: string;
  hoursPresencial?: number;
  hoursDirigido?: number;
  hoursIndependiente?: number;
  prerequisites?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

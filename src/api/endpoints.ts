import api from './client';
import type {
  Department,
  LoginResponse,
  PaginatedResponse,
  Program,
  Subject,
  Syllabus,
  SyllabusFilters,
  User,
  UserFilters,
} from '../types';

const data = <T>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);

export const authApi = {
  login: (email: string, password: string) =>
    data(api.post<LoginResponse>('/auth/login', { email, password })),
  logout: () => api.post('/auth/logout'),
  me: () => data(api.get<User>('/auth/me')),
  changePassword: (currentPassword: string, newPassword: string) =>
    data(api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword })),
  forgotPassword: (email: string) =>
    data(api.post<{ message: string }>('/auth/forgot-password', { email })),
  resetPassword: (token: string, newPassword: string) =>
    data(api.post<{ message: string }>('/auth/reset-password', { token, newPassword })),
};

export const syllabusApi = {
  getAll: (filters: SyllabusFilters = {}) =>
    data(api.get<PaginatedResponse<Syllabus>>('/syllabus', { params: filters })),
};

export const usersApi = {
  getAll: (filters: UserFilters = {}) =>
    data(api.get<PaginatedResponse<User>>('/users', { params: filters })),
};

export const departmentsApi = {
  getAll: () => data(api.get<Department[]>('/departments')),
};

export const programsApi = {
  getAll: (departmentId?: string) =>
    data(api.get<Program[]>('/programs', { params: { departmentId } })),
};

export const subjectsApi = {
  getAll: (departmentId?: string, programId?: string) =>
    data(api.get<Subject[]>('/subjects', { params: { departmentId, programId } })),
};

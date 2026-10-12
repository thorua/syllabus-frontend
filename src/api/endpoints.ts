import api from './client';
import type {
  AffiliationsInput,
  AuditFilters,
  AuditLog,
  AuditOptions,
  Curriculum,
  Department,
  DepartmentInput,
  BatchSignResult,
  Faculty,
  FacultyInput,
  FormationArea,
  PendingSignature,
  SignatureCertificate,
  StudyPlan,
  SyllabusSignatures,
  LoginResponse,
  PaginatedResponse,
  Program,
  ProgramInput,
  Subject,
  SubjectFilters,
  SubjectInput,
  InstitutionalConfig,
  Syllabus,
  SyllabusCreateInput,
  SyllabusFilters,
  SyllabusUpdateInput,
  SyllabusVersion,
  User,
  UserFilters,
  UserInput,
  PermissionOverride,
} from '../types';

const data = <T>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

/** Descarga un archivo y toma su nombre del encabezado Content-Disposition. */
const file = (
  promise: Promise<{ data: Blob; headers: Record<string, unknown> }>,
  fallback: string,
) =>
  promise.then((r): DownloadedFile => {
    const disposition = String(r.headers['content-disposition'] ?? '');
    const match = /filename="?([^";]+)"?/.exec(disposition);
    return { blob: r.data, filename: match?.[1] ?? fallback };
  });

export interface BatchExportInput {
  syllabusIds?: string[];
  departmentId?: string;
  programId?: string;
  academicPeriod?: string;
}

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
  getById: (id: string) => data(api.get<Syllabus>(`/syllabus/${id}`)),
  getPeriods: () => data(api.get<string[]>('/syllabus/periods')),
  create: (input: SyllabusCreateInput) => data(api.post<Syllabus>('/syllabus', input)),
  update: (id: string, input: SyllabusUpdateInput) =>
    data(api.put<Syllabus>(`/syllabus/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/syllabus/${id}`)),
  getVersions: (id: string) => data(api.get<SyllabusVersion[]>(`/syllabus/${id}/versions`)),
  getVersion: (id: string, versionId: string) =>
    data(api.get<SyllabusVersion>(`/syllabus/${id}/versions/${versionId}`)),
  /** Copia el syllabus a otro período sin ajustes (queda registrado en el historial). */
  renew: (id: string, academicPeriod: string) =>
    data(api.post<Syllabus>(`/syllabus/${id}/renew`, { academicPeriod })),
};

export interface SignInput {
  version: number;
  password: string;
  /** Si no se envía, se usa el certificado registrado. */
  certificate?: File | null;
  remember?: boolean;
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const signaturesApi = {
  get: (id: string) => data(api.get<SyllabusSignatures>(`/syllabus/${id}/signatures`)),
  preview: (id: string) =>
    file(
      api.get<Blob>(`/syllabus/${id}/signatures/preview`, { responseType: 'blob' }),
      'syllabus-por-firmar.pdf',
    ),
  sign: (id: string, input: SignInput) => {
    const form = new FormData();
    form.append('version', String(input.version));
    form.append('password', input.password);
    form.append('remember', String(Boolean(input.remember)));
    if (input.certificate) form.append('certificate', input.certificate);
    return data(api.post<SyllabusSignatures>(`/syllabus/${id}/signatures`, form, multipart));
  },
  pending: () => data(api.get<PendingSignature[]>('/signatures/pending')),
  /** Firma varios syllabus con el certificado registrado (o el enviado) y una sola contraseña. */
  signBatch: (
    items: { id: string; version: number }[],
    password: string,
    certificate?: File | null,
  ) => {
    const form = new FormData();
    form.append('items', JSON.stringify(items));
    form.append('password', password);
    if (certificate) form.append('certificate', certificate);
    return data(api.post<BatchSignResult[]>('/signatures/batch', form, multipart));
  },
  myCertificate: () =>
    api
      .get<SignatureCertificate | ''>('/auth/me/certificate')
      .then((r) => (r.status === 204 || !r.data ? null : r.data)),
  saveCertificate: (certificate: File, password: string) => {
    const form = new FormData();
    form.append('certificate', certificate);
    form.append('password', password);
    return data(api.put<SignatureCertificate>('/auth/me/certificate', form, multipart));
  },
  deleteCertificate: () => data(api.delete<{ message: string }>('/auth/me/certificate')),
};

export const exportApi = {
  syllabus: (id: string) =>
    file(api.get<Blob>(`/export/syllabus/${id}`, { responseType: 'blob' }), 'syllabus.pdf'),
  batch: (input: BatchExportInput) =>
    file(api.post<Blob>('/export/batch', input, { responseType: 'blob' }), 'syllabus.zip'),
  template: () =>
    file(
      api.get<Blob>('/export/template', { responseType: 'blob' }),
      'plantilla-syllabus-en-blanco.pdf',
    ),
};

export const settingsApi = {
  get: () => data(api.get<InstitutionalConfig>('/settings')),
  update: (input: InstitutionalConfig) => data(api.put<InstitutionalConfig>('/settings', input)),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return data(api.post<InstitutionalConfig>('/settings/logo', form, multipart));
  },
};

export const usersApi = {
  getAll: (filters: UserFilters = {}) =>
    data(api.get<PaginatedResponse<User>>('/users', { params: filters })),
  create: (input: UserInput) => data(api.post<User>('/users', input)),
  update: (id: string, input: UserInput) => data(api.put<User>(`/users/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/users/${id}`)),
  updatePermissions: (id: string, permissionOverrides: PermissionOverride[]) =>
    data(api.put<User>(`/users/${id}/permissions`, { permissionOverrides })),
  updateAffiliations: (id: string, input: AffiliationsInput) =>
    data(api.put<User>(`/users/${id}/affiliations`, input)),
  permissionCatalog: () => data(api.get<Record<string, string>>('/users/permission-catalog')),
};

export const auditApi = {
  getAll: (filters: AuditFilters = {}) =>
    data(api.get<PaginatedResponse<AuditLog>>('/audit', { params: filters })),
  options: () => data(api.get<AuditOptions>('/audit/options')),
};

export const facultiesApi = {
  getAll: (includeInactive = false) =>
    data(api.get<Faculty[]>('/faculties', { params: { includeInactive } })),
  create: (input: FacultyInput) => data(api.post<Faculty>('/faculties', input)),
  update: (id: string, input: FacultyInput) => data(api.put<Faculty>(`/faculties/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/faculties/${id}`)),
};

export const departmentsApi = {
  getAll: (includeInactive = false) =>
    data(api.get<Department[]>('/departments', { params: { includeInactive } })),
  create: (input: DepartmentInput) => data(api.post<Department>('/departments', input)),
  update: (id: string, input: DepartmentInput) =>
    data(api.put<Department>(`/departments/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/departments/${id}`)),
};

export const programsApi = {
  getAll: (departmentId?: string, includeInactive = false) =>
    data(api.get<Program[]>('/programs', { params: { departmentId, includeInactive } })),
  create: (input: ProgramInput) => data(api.post<Program>('/programs', input)),
  update: (id: string, input: ProgramInput) => data(api.put<Program>(`/programs/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/programs/${id}`)),
};

export const subjectsApi = {
  getAll: (filters: SubjectFilters = {}) =>
    data(api.get<Subject[]>('/subjects', { params: filters })),
  create: (input: SubjectInput) => data(api.post<Subject>('/subjects', input)),
  update: (id: string, input: SubjectInput) => data(api.put<Subject>(`/subjects/${id}`, input)),
  deactivate: (id: string) => data(api.delete<{ message: string }>(`/subjects/${id}`)),
  assignProfessor: (id: string, professorId: string | null) =>
    data(api.put<Subject>(`/subjects/${id}/assign-professor`, { professorId })),
};

export const studyPlansApi = {
  getAll: (programId: string) =>
    data(api.get<StudyPlan[]>('/study-plans', { params: { programId } })),
  curriculum: (id: string, academicPeriod: string) =>
    data(api.get<Curriculum>(`/study-plans/${id}/curriculum`, { params: { academicPeriod } })),
  create: (programId: string, name: string) =>
    data(api.post<StudyPlan>('/study-plans', { programId, name })),
  update: (id: string, programId: string, name: string, isActive: boolean) =>
    data(api.put<StudyPlan>(`/study-plans/${id}`, { programId, name, isActive })),
  placeSubject: (
    id: string,
    subjectId: string,
    semester: number,
    area: FormationArea,
    academicPeriod: string,
  ) =>
    data(
      api.put<Curriculum>(
        `/study-plans/${id}/subjects/${subjectId}`,
        { semester, area },
        { params: { academicPeriod } },
      ),
    ),
  removeSubject: (id: string, subjectId: string, academicPeriod: string) =>
    data(
      api.delete<Curriculum>(`/study-plans/${id}/subjects/${subjectId}`, {
        params: { academicPeriod },
      }),
    ),
};

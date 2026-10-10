export type ProgramLevel = 'PREGRADO' | 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  /** Solo en el listado: programas y asignaturas activos. */
  programCount?: number;
  subjectCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  level: ProgramLevel;
  /** Nulo en posgrado. */
  department?: Department | null;
  isActive: boolean;
  /** Solo en el listado: asignaturas activas. */
  subjectCount?: number;
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
  /** Nulo en posgrado. */
  department?: Department | null;
  professor?: { id: string; name: string; email: string } | null;
  modality?: string;
  hoursPresencial?: number | null;
  hoursDirigido?: number | null;
  hoursIndependiente?: number | null;
  prerequisites?: string | null;
  isActive: boolean;
  syllabusCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentInput {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface ProgramInput {
  name: string;
  code: string;
  level: ProgramLevel;
  departmentId?: string | null;
  isActive?: boolean;
}

export interface SubjectInput {
  name: string;
  code: string;
  credits: number;
  semester: number;
  programId: string;
  departmentId?: string | null;
  modality?: string;
  hoursPresencial?: number | null;
  hoursDirigido?: number | null;
  hoursIndependiente?: number | null;
  prerequisites?: string;
  isActive?: boolean;
}

export interface SubjectFilters {
  departmentId?: string;
  programId?: string;
  professorId?: string;
  search?: string;
  includeInactive?: boolean;
  /** Solo asignaturas del alcance de gestión (p. ej. para crear su syllabus). */
  manageable?: boolean;
}

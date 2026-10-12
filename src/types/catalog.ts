export type ProgramLevel = 'PREGRADO' | 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';

export interface Faculty {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  /** Solo en el listado: departamentos y programas activos. */
  departmentCount?: number;
  programCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty: Faculty;
  /** Correo de la coordinación: contacto de los syllabus de sus asignaturas. */
  coordinationEmail?: string | null;
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
  /** La propia (posgrado) o la de su departamento (pregrado). */
  faculty: Faculty;
  /** Solo en posgrado: correo de la coordinación; sin él, el syllabus muestra el docente asignado. */
  coordinationEmail?: string | null;
  isActive: boolean;
  /** Solo en el listado: asignaturas activas (propias o en sus planes). */
  subjectCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Programa que incluye la asignatura en uno de sus planes de estudio. */
export interface SubjectInPlan {
  id: string;
  name: string;
  code: string;
  level: ProgramLevel;
  planId: string;
  plan: string;
  planActive: boolean;
  semester: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  /** Departamento que la ofrece; nulo en posgrado. */
  department?: Department | null;
  /** Solo en posgrado: el programa dueño de la asignatura. */
  program?: Program | null;
  /** Programas en cuyos planes de estudio está, con el semestre. */
  programs: SubjectInPlan[];
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

export interface FacultyInput {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface DepartmentInput {
  name: string;
  code: string;
  facultyId: string;
  coordinationEmail?: string;
  isActive?: boolean;
}

export interface ProgramInput {
  name: string;
  code: string;
  level: ProgramLevel;
  /** Pregrado. */
  departmentId?: string | null;
  /** Posgrado. */
  facultyId?: string | null;
  coordinationEmail?: string;
  isActive?: boolean;
}

export interface SubjectInput {
  name: string;
  code: string;
  credits: number;
  /** Departamento que la ofrece; en posgrado se indica programId en su lugar. */
  departmentId?: string | null;
  programId?: string | null;
  modality?: string;
  hoursPresencial?: number | null;
  hoursDirigido?: number | null;
  hoursIndependiente?: number | null;
  prerequisites?: string;
  isActive?: boolean;
}

export interface SubjectFilters {
  /** Departamento que la ofrece. */
  departmentId?: string;
  /** Programa en cuya malla está. */
  programId?: string;
  professorId?: string;
  search?: string;
  includeInactive?: boolean;
  /** Solo asignaturas del alcance de gestión (p. ej. para crear su syllabus). */
  manageable?: boolean;
}

export interface StudyPlan {
  id: string;
  programId: string;
  programName: string;
  name: string;
  isActive: boolean;
  subjectCount: number;
}

/** Estado del syllabus de una asignatura de la malla en el período consultado. */
export type CurriculumState =
  'VERIFICADO' | 'PENDIENTE_REGISTRO' | 'PENDIENTE_FIRMA' | 'BORRADOR' | 'SIN_SYLLABUS';

export interface CurriculumSubject {
  subjectId: string;
  code: string;
  name: string;
  credits: number;
  /** Departamento (o programa de posgrado) que ofrece la asignatura. */
  offeredBy: string;
  isActive: boolean;
  syllabusId: string | null;
  state: CurriculumState;
}

export interface Curriculum {
  plan: StudyPlan;
  academicPeriod: string;
  semesters: { number: number; credits: number; subjects: CurriculumSubject[] }[];
}

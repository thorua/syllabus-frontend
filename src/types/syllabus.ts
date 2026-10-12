import type { SectionType, SyllabusStatus } from './enums';
import type { Subject } from './catalog';
import type { EvaluationCorte } from './settings';
import type { User } from './user';

export interface SyllabusSection {
  id?: string;
  sectionType: SectionType;
  title: string;
  /** Texto de la sección; vacío en la de evaluación. */
  content: string | null;
  /** Solo en la sección de evaluación. */
  evaluation?: EvaluationCorte[] | null;
  order: number;
}

/**
 * Datos de la asignatura incluidos en el syllabus. programs solo viene en el detalle;
 * coordinationEmail es el correo de la coordinación que la ofrece (departamento o posgrado).
 */
export type SyllabusSubject = Omit<
  Subject,
  'isActive' | 'syllabusCount' | 'createdAt' | 'updatedAt' | 'programs' | 'requiresSyllabus'
> & {
  programs?: Subject['programs'];
  coordinationEmail?: string | null;
};

/** Firmas de la versión vigente: coordinación del departamento y luego Registro Académico. */
export type VerificationState = 'SIN_FIRMAS' | 'PENDIENTE_REGISTRO' | 'VERIFICADO';
export type SignatureStep = 'DEPARTAMENTO' | 'REGISTRO';

export interface SignatureCertificate {
  subject: string;
  issuer: string;
  serial: string;
  notAfter: string;
  uploadedAt: string;
}

/** Syllabus vigente que espera la firma del usuario. */
export interface PendingSignature {
  id: string;
  title: string;
  academicPeriod: string;
  subjectCode: string;
  subjectName: string;
  offeredBy: string;
  version: number;
  step: SignatureStep;
  updatedAt: string;
}

export interface BatchSignResult {
  id: string;
  signed: boolean;
  message: string;
  state?: VerificationState | null;
}

export interface SyllabusSignatures {
  state: VerificationState;
  version: number;
  /** Solo un syllabus activo se firma. */
  signable: boolean;
  signatures: {
    step: SignatureStep;
    signerName: string;
    certificateSubject: string;
    certificateIssuer: string;
    signedAt: string;
  }[];
  nextStep?: SignatureStep | null;
  /** Cargo al que le corresponde la firma pendiente. */
  nextSigner?: string | null;
  canSign: boolean;
  storedCertificate?: SignatureCertificate | null;
}

export interface Syllabus {
  id: string;
  title: string;
  academicPeriod: string;
  status: SyllabusStatus;
  /** Encabezado propio; si falta se usa el de la configuración institucional. */
  headerTitle?: string;
  documentCode?: string;
  documentDate?: string;
  subject: SyllabusSubject;
  createdBy: Pick<User, 'id' | 'name'>;
  /** Solo en el detalle. */
  sections?: SyllabusSection[];
  currentVersion?: number;
  /** Estado de las firmas de la versión vigente. */
  verification: VerificationState;
  /** Dentro del alcance de gestión del usuario (editar, desactivar, versiones según permisos). */
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusFilters {
  search?: string;
  departmentId?: string;
  programId?: string;
  subjectId?: string;
  academicPeriod?: string;
  status?: SyllabusStatus;
  page?: number;
  limit?: number;
}

export interface SyllabusSectionInput {
  sectionType: SectionType;
  title: string;
  content?: string | null;
  evaluation?: EvaluationCorte[] | null;
}

interface SyllabusHeaderInput {
  headerTitle?: string;
  documentCode?: string;
  documentDate?: string;
}

export interface SyllabusCreateInput extends SyllabusHeaderInput {
  subjectId: string;
  academicPeriod: string;
  title: string;
  status: SyllabusStatus;
  sections: SyllabusSectionInput[];
}

export interface SyllabusUpdateInput extends SyllabusHeaderInput {
  title: string;
  status: SyllabusStatus;
  sections: SyllabusSectionInput[];
  changeDescription: string;
  /** Versión sobre la que se editó, para detectar cambios simultáneos. */
  baseVersion?: number;
}

/** Contenido del syllabus guardado en una versión (UC22). */
export interface SyllabusSnapshot {
  title: string;
  status: SyllabusStatus;
  headerTitle?: string | null;
  documentCode?: string | null;
  documentDate?: string | null;
  sections: SyllabusSection[];
}

export interface SyllabusVersion {
  id: string;
  syllabusId: string;
  versionNumber: number;
  changeDescription: string;
  modifiedBy: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  /** Solo al consultar una versión concreta. */
  snapshot?: SyllabusSnapshot;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

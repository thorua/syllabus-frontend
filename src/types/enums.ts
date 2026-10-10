// Enums con los mismos valores que el backend y etiquetas para la UI.
// Los permisos NO se calculan aquí: llegan efectivos desde /api/auth/me.

export enum Role {
  ESTUDIANTE = 'ESTUDIANTE',
  PROFESOR = 'PROFESOR',
  COORDINADOR_PROGRAMA = 'COORDINADOR_PROGRAMA',
  COORDINADOR_DEPARTAMENTO = 'COORDINADOR_DEPARTAMENTO',
  ADM_REGISTRO = 'ADM_REGISTRO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export enum SyllabusStatus {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  BORRADOR = 'BORRADOR',
}

export enum Gender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO',
}

export enum SectionType {
  IDENTIFICATION = 'identification',
  JUSTIFICATION = 'justification',
  PERFORMANCE = 'performance',
  CONTENTS = 'contents',
  TEACHING_STRATEGIES = 'teaching_strategies',
  EVALUATION = 'evaluation',
  BIBLIOGRAPHY = 'bibliography',
}

export interface PermissionOverride {
  action: string;
  resource: string;
  allow: boolean;
}

export const RoleLabels: Record<Role, string> = {
  [Role.ESTUDIANTE]: 'Estudiante',
  [Role.PROFESOR]: 'Profesor',
  [Role.COORDINADOR_PROGRAMA]: 'Coordinador de Programa',
  [Role.COORDINADOR_DEPARTAMENTO]: 'Coordinador de Departamento',
  [Role.ADM_REGISTRO]: 'Registro Académico',
  [Role.ADMINISTRADOR]: 'Administrador',
};

export const SyllabusStatusLabels: Record<SyllabusStatus, string> = {
  [SyllabusStatus.ACTIVO]: 'Activo',
  [SyllabusStatus.INACTIVO]: 'Inactivo',
  [SyllabusStatus.BORRADOR]: 'Borrador',
};

export const SectionTypeLabels: Record<SectionType, string> = {
  [SectionType.IDENTIFICATION]: 'Identificación',
  [SectionType.JUSTIFICATION]: 'Justificación',
  [SectionType.PERFORMANCE]: 'Desempeño Esperado',
  [SectionType.CONTENTS]: 'Contenidos',
  [SectionType.TEACHING_STRATEGIES]: 'Estrategias de Enseñanza',
  [SectionType.EVALUATION]: 'Evaluación',
  [SectionType.BIBLIOGRAPHY]: 'Bibliografía',
};

export const SyllabusStatusColors: Record<SyllabusStatus, string> = {
  [SyllabusStatus.ACTIVO]: 'bg-green-100 text-green-800',
  [SyllabusStatus.INACTIVO]: 'bg-red-100 text-red-800',
  [SyllabusStatus.BORRADOR]: 'bg-yellow-100 text-yellow-800',
};

export const RoleColors: Record<Role, string> = {
  [Role.ESTUDIANTE]: 'bg-teal-100 text-teal-800',
  [Role.PROFESOR]: 'bg-blue-100 text-blue-800',
  [Role.COORDINADOR_PROGRAMA]: 'bg-purple-100 text-purple-800',
  [Role.COORDINADOR_DEPARTAMENTO]: 'bg-indigo-100 text-indigo-800',
  [Role.ADM_REGISTRO]: 'bg-cyan-100 text-cyan-800',
  [Role.ADMINISTRADOR]: 'bg-red-100 text-red-800',
};

/** Roles en orden de jerarquía, para selectores y filtros. */
export const ALL_ROLES: Role[] = [
  Role.ESTUDIANTE,
  Role.PROFESOR,
  Role.COORDINADOR_PROGRAMA,
  Role.COORDINADOR_DEPARTAMENTO,
  Role.ADM_REGISTRO,
  Role.ADMINISTRADOR,
];

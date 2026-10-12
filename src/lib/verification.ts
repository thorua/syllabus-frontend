import type { CurriculumState, Syllabus, VerificationState } from '../types';

/**
 * Convenciones de color de la verificación con firma digital, comunes al listado de syllabus, al
 * detalle y a la malla curricular: verde = verificado (firmado por la coordinación y por Registro),
 * ámbar = vigente sin verificar, azul = falta la firma de Registro, gris = borrador, rojo = sin syllabus.
 */
export interface Convention {
  label: string;
  mark: string;
  className: string;
}

export const CONVENTIONS: Record<CurriculumState, Convention> = {
  VERIFICADO: {
    label: 'Verificado',
    mark: '✔',
    className: 'border-green-300 bg-green-50 text-green-800',
  },
  PENDIENTE_REGISTRO: {
    label: 'Firmado por la coordinación, falta Registro',
    mark: '½',
    className: 'border-sky-300 bg-sky-50 text-sky-800',
  },
  PENDIENTE_FIRMA: {
    label: 'Vigente sin verificar',
    mark: '!',
    className: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  BORRADOR: {
    label: 'En borrador',
    mark: '…',
    className: 'border-gray-300 bg-gray-50 text-gray-600',
  },
  SIN_SYLLABUS: {
    label: 'Sin syllabus',
    mark: '✘',
    className: 'border-red-300 bg-red-50 text-red-700',
  },
};

/** Estado de un syllabus para la tabla de convenciones (los inactivos cuentan como sin syllabus). */
export function conventionOf(syllabus: Pick<Syllabus, 'status' | 'verification'>): CurriculumState {
  if (syllabus.status === 'BORRADOR') return 'BORRADOR';
  if (syllabus.status === 'INACTIVO') return 'SIN_SYLLABUS';
  const byVerification: Record<VerificationState, CurriculumState> = {
    VERIFICADO: 'VERIFICADO',
    PENDIENTE_REGISTRO: 'PENDIENTE_REGISTRO',
    SIN_FIRMAS: 'PENDIENTE_FIRMA',
  };
  return byVerification[syllabus.verification];
}

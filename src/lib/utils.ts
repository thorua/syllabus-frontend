import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Role, RoleLabels } from '../types/enums';
import type { Syllabus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoleLabel(role: string): string {
  return RoleLabels[role as Role] || role;
}

// --- Accesores seguros para entidades anidadas (asignatura, programa, profesor) ---

type MaybeSyllabus = Partial<Syllabus> | null | undefined;

const FALLBACK = '—';

export function getSubjectCode(syl: MaybeSyllabus): string {
  return syl?.subject?.code || FALLBACK;
}

export function getSubjectName(syl: MaybeSyllabus): string {
  return syl?.subject?.name || FALLBACK;
}

export function getDepartmentName(syl: MaybeSyllabus): string {
  return syl?.subject?.department?.name || FALLBACK;
}

export function getProgramName(syl: MaybeSyllabus): string {
  return syl?.subject?.program?.name || FALLBACK;
}

export function getProfessorName(syl: MaybeSyllabus): string {
  return syl?.subject?.professor?.name || 'Por asignar';
}

export function getSubjectCredits(syl: MaybeSyllabus): string {
  const credits = syl?.subject?.credits;
  return credits != null ? String(credits) : FALLBACK;
}

export function getSubjectSemester(syl: MaybeSyllabus): string {
  const semester = syl?.subject?.semester;
  return semester != null ? String(semester) : FALLBACK;
}

export function getCreatorName(syl: MaybeSyllabus): string {
  return syl?.createdBy?.name || FALLBACK;
}

export function getDescriptiveTitle(syl: MaybeSyllabus): string {
  const code = getSubjectCode(syl);
  const name = getSubjectName(syl);
  const period = syl?.academicPeriod;
  if (code !== FALLBACK && name !== FALLBACK) {
    return `${code} — ${name}${period ? ` · ${period}` : ''}`;
  }
  return syl?.title || period || FALLBACK;
}

export function getModifierName(
  version: { modifiedBy?: { name?: string } | null } | null | undefined,
): string {
  return version?.modifiedBy?.name || 'Usuario desconocido';
}

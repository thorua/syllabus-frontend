import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Role, RoleLabels } from '../types/enums';
import type { Syllabus, SyllabusSubject } from '../types';

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

/** Programas en cuyos planes vigentes está la asignatura (o su programa de posgrado), sin repetir. */
export function programNames(subject: SyllabusSubject): string {
  const names = [
    ...new Set((subject.programs ?? []).filter((p) => p.planActive).map((p) => p.name)),
  ];
  return names.length > 0 ? names.join(', ') : (subject.program?.name ?? '');
}

/** Departamento que ofrece la asignatura o, en posgrado, su programa. */
export function getOfferedBy(syl: MaybeSyllabus): string {
  return syl?.subject?.department?.name || syl?.subject?.program?.name || FALLBACK;
}

export function getProgramName(syl: MaybeSyllabus): string {
  return (syl?.subject && programNames(syl.subject)) || FALLBACK;
}

export function getProfessorName(syl: MaybeSyllabus): string {
  return syl?.subject?.professor?.name || 'Por asignar';
}

export function getSubjectCredits(syl: MaybeSyllabus): string {
  const credits = syl?.subject?.credits;
  return credits != null ? String(credits) : FALLBACK;
}

/** Semestre en que se cursa la asignatura en cada programa (según sus planes vigentes). */
export function getProgramSemesters(syl: MaybeSyllabus): string {
  const enPlanes = (syl?.subject?.programs ?? []).filter((p) => p.planActive);
  const semesters = [...new Set(enPlanes.map((p) => p.semester))].sort((a, b) => a - b);
  return semesters.length > 0 ? semesters.join(', ') : FALLBACK;
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

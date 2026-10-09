// src/lib/programLevel.ts

export const POSGRADO_LEVELS: string[] = ['ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'];

export const PROGRAM_LEVEL_LABELS: Record<string, string> = {
  PREGRADO: 'Pregrado',
  ESPECIALIZACION: 'Especialización',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
};

export function isPosgradoLevel(level?: string | null): boolean {
  return !!level && POSGRADO_LEVELS.includes(level.toUpperCase());
}

export function getLevelLabel(level?: string | null): string {
  return (level && PROGRAM_LEVEL_LABELS[level.toUpperCase()]) || level || '—';
}

export function getLevelBadgeClass(level?: string | null): string {
  switch ((level || '').toUpperCase()) {
    case 'PREGRADO':
      return 'bg-blue-100 text-blue-800';
    case 'ESPECIALIZACION':
      return 'bg-emerald-100 text-emerald-800';
    case 'MAESTRIA':
      return 'bg-purple-100 text-purple-800';
    case 'DOCTORADO':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

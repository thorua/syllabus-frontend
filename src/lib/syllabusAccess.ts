import { SyllabusStatus } from '../types';
import type { Syllabus } from '../types';

type Can = (permission: string) => boolean;

/**
 * Acciones disponibles sobre un syllabus: el permiso efectivo decide qué se puede hacer y canManage
 * (calculado por el backend) si el syllabus está dentro del alcance del usuario.
 */
export function syllabusAccess(syllabus: Syllabus, can: Can) {
  const inactive = syllabus.status === SyllabusStatus.INACTIVO;
  return {
    edit: syllabus.canManage && can('syllabus:update') && (!inactive || can('syllabus:delete')),
    deactivate: syllabus.canManage && can('syllabus:delete') && !inactive,
    versions: syllabus.canManage && can('syllabus:versions'),
  };
}

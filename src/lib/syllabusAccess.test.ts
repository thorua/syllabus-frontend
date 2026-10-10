import { describe, expect, it } from 'vitest';
import { syllabusAccess } from './syllabusAccess';
import { SyllabusStatus } from '../types';
import type { Syllabus } from '../types';

const syllabus = (status: SyllabusStatus, canManage: boolean) =>
  ({ status, canManage }) as Syllabus;
const withPermissions =
  (...permissions: string[]) =>
  (permission: string) =>
    permissions.includes(permission);

describe('syllabusAccess', () => {
  const coordinador = withPermissions('syllabus:update', 'syllabus:delete', 'syllabus:versions');

  it('fuera del alcance no permite nada aunque se tengan los permisos', () => {
    expect(syllabusAccess(syllabus(SyllabusStatus.ACTIVO, false), coordinador)).toEqual({
      edit: false,
      deactivate: false,
      versions: false,
    });
  });

  it('el profesor edita, pero no desactiva ni ve versiones', () => {
    const profesor = withPermissions('syllabus:update');
    expect(syllabusAccess(syllabus(SyllabusStatus.BORRADOR, true), profesor)).toEqual({
      edit: true,
      deactivate: false,
      versions: false,
    });
  });

  it('un syllabus inactivo solo lo reactiva quien puede desactivar', () => {
    const inactivo = syllabus(SyllabusStatus.INACTIVO, true);
    expect(syllabusAccess(inactivo, withPermissions('syllabus:update')).edit).toBe(false);
    expect(syllabusAccess(inactivo, coordinador)).toEqual({
      edit: true,
      deactivate: false,
      versions: true,
    });
  });
});

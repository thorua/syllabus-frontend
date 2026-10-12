import { describe, expect, it } from 'vitest';
import { conventionOf } from './verification';
import { SyllabusStatus } from '../types';

describe('conventionOf', () => {
  it('un syllabus vigente toma el color de sus firmas', () => {
    expect(conventionOf({ status: SyllabusStatus.ACTIVO, verification: 'VERIFICADO' })).toBe(
      'VERIFICADO',
    );
    expect(
      conventionOf({ status: SyllabusStatus.ACTIVO, verification: 'PENDIENTE_REGISTRO' }),
    ).toBe('PENDIENTE_REGISTRO');
    expect(conventionOf({ status: SyllabusStatus.ACTIVO, verification: 'SIN_FIRMAS' })).toBe(
      'PENDIENTE_FIRMA',
    );
  });

  it('un borrador o un inactivo no está verificado', () => {
    expect(conventionOf({ status: SyllabusStatus.BORRADOR, verification: 'SIN_FIRMAS' })).toBe(
      'BORRADOR',
    );
    expect(conventionOf({ status: SyllabusStatus.INACTIVO, verification: 'VERIFICADO' })).toBe(
      'SIN_SYLLABUS',
    );
  });
});

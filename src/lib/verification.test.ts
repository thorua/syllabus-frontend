import { describe, expect, it } from 'vitest';
import { AREAS, CONVENTIONS, conventionOf } from './verification';
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

describe('convenciones de la malla', () => {
  it('los espacios del plan tienen su propia convención y no se ven como faltantes', () => {
    expect(CONVENTIONS.ESPACIO.label).toContain('sin syllabus propio');
    expect(CONVENTIONS.ESPACIO.className).not.toContain('red');
  });

  it('cada área de formación tiene nombre y color', () => {
    for (const area of Object.values(AREAS)) {
      expect(area.label).not.toBe('');
      expect(area.className).toMatch(/^bg-/);
    }
  });
});

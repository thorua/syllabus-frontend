import { describe, expect, it } from 'vitest';
import { identificationRows } from './identification';
import type { SyllabusSubject } from '../types';

const enPlan = (name: string, planActive = true) => ({
  id: name,
  name,
  code: name,
  level: 'PREGRADO' as const,
  planId: `plan-${name}`,
  plan: 'Plan 2026',
  planActive,
  semester: 1,
});

const subject = (coordinationEmail?: string): SyllabusSubject => ({
  id: 's1',
  name: 'Matemáticas I',
  code: 'MAT100',
  credits: 4,
  coordinationEmail,
  programs: [
    enPlan('Ingeniería de Sistemas'),
    enPlan('Ingeniería Electrónica'),
    enPlan('Ingeniería de Sistemas'),
    enPlan('Ingeniería Mecánica', false),
  ],
  professor: { id: 'u1', name: 'Carlos Andrés Martínez', email: 'profesor@autonoma.edu.co' },
  hoursPresencial: 4,
});

const value = (rows: ReturnType<typeof identificationRows>, label: string) =>
  rows.find((r) => r.label === label)?.value;

// Mismas reglas que el PDF (backend ExportacionTest · elContactoEsLaCoordinacionYSoloSinCoordinacionElDocente).
describe('identificationRows', () => {
  it('con coordinación deja vacío el docente y muestra el correo de la coordinación', () => {
    const rows = identificationRows(subject('matematicas@autonoma.edu.co'), '2026-01');
    expect(value(rows, 'Docente (s)')).toBe('');
    expect(value(rows, 'E-mail docente (s)')).toBe('matematicas@autonoma.edu.co');
  });

  it('lista una vez cada programa con plan vigente que incluye la asignatura', () => {
    const rows = identificationRows(subject(), '2026-01');
    expect(value(rows, 'Programa (s) en los que se ofrece')).toBe(
      'Ingeniería de Sistemas, Ingeniería Electrónica',
    );
  });

  it('sin coordinación muestra el docente asignado y su correo', () => {
    const rows = identificationRows(subject(), '2026-01');
    expect(value(rows, 'Docente (s)')).toBe('Carlos Andrés Martínez');
    expect(value(rows, 'E-mail docente (s)')).toBe('profesor@autonoma.edu.co');
  });

  it('completa los datos faltantes como el formato institucional', () => {
    const rows = identificationRows(subject(), '2026-01');
    expect(value(rows, 'Departamento (área)')).toBe('No aplica (posgrado)');
    expect(value(rows, 'Horas de trabajo dirigido/tutoría sincrónica')).toBe('—');
    expect(value(rows, 'Prerrequisitos')).toBe('Ninguno');
    expect(value(rows, 'Año- Periodo académico')).toBe('2026-01');
  });
});

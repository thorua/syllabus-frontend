import { describe, expect, it } from 'vitest';
import { identificationRows } from './identification';
import type { SyllabusSubject } from '../types';

const subject = (coordinationEmail?: string): SyllabusSubject => ({
  id: 's1',
  name: 'Base de Datos I',
  code: 'SIS201',
  credits: 4,
  semester: 4,
  program: {
    id: 'p1',
    name: 'Ingeniería de Sistemas',
    code: 'IS',
    level: 'PREGRADO',
    coordinationEmail,
    isActive: true,
  },
  professor: { id: 'u1', name: 'Carlos Andrés Martínez', email: 'profesor@autonoma.edu.co' },
  hoursPresencial: 4,
});

const value = (rows: ReturnType<typeof identificationRows>, label: string) =>
  rows.find((r) => r.label === label)?.value;

// Mismas reglas que el PDF (backend ExportacionTest · elContactoEsLaCoordinacionYSoloSinCoordinacionElDocente).
describe('identificationRows', () => {
  it('con coordinación deja vacío el docente y muestra el correo de la coordinación', () => {
    const rows = identificationRows(subject('coordinacion.sistemas@autonoma.edu.co'), '2026-01');
    expect(value(rows, 'Docente (s)')).toBe('');
    expect(value(rows, 'E-mail docente (s)')).toBe('coordinacion.sistemas@autonoma.edu.co');
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

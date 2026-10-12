import { programNames } from './utils';
import type { SyllabusSubject } from '../types';

export interface IdentificationRow {
  label: string;
  value: string;
  email?: boolean;
}

const hours = (h?: number | null) => (h == null ? '—' : String(h));

/**
 * Tabla «1. IDENTIFICACIÓN» del formato GFR-FOR-005, con los datos de la asignatura. Mismas reglas
 * que el PDF (backend: exportacion/AlmeraPdf.java): si quien ofrece la asignatura (departamento o
 * programa de posgrado) tiene coordinación, «Docente (s)» queda vacío y el correo es el de la
 * coordinación; si no, se muestran el docente y su correo. Los programas salen de los planes de estudio.
 */
export function identificationRows(
  subject: SyllabusSubject,
  academicPeriod: string,
): IdentificationRow[] {
  // Al crear, la asignatura aún no trae el correo resuelto: se toma de quien la ofrece.
  const coordination =
    subject.coordinationEmail ??
    subject.department?.coordinationEmail ??
    subject.program?.coordinationEmail;
  const professor = subject.professor;
  return [
    { label: 'Nombre asignatura', value: subject.name },
    { label: 'Código', value: subject.code },
    {
      label: 'Departamento (área)',
      value: subject.department?.name ?? 'No aplica (posgrado)',
    },
    { label: 'Programa (s) en los que se ofrece', value: programNames(subject) },
    { label: 'Modalidad de la asignatura', value: subject.modality || 'Presencial' },
    { label: 'Número de créditos', value: String(subject.credits) },
    { label: 'Horas de trabajo presencial/sincrónico', value: hours(subject.hoursPresencial) },
    { label: 'Horas de trabajo dirigido/tutoría sincrónica', value: hours(subject.hoursDirigido) },
    {
      label: 'Horas de trabajo independiente/asincrónico',
      value: hours(subject.hoursIndependiente),
    },
    { label: 'Prerrequisitos', value: subject.prerequisites || 'Ninguno' },
    { label: 'Año- Periodo académico', value: academicPeriod },
    {
      label: 'Docente (s)',
      value: coordination ? '' : (professor?.name ?? 'Por asignar'),
    },
    {
      label: 'E-mail docente (s)',
      value: coordination ?? professor?.email ?? '',
      email: true,
    },
  ];
}

import type { EvaluationCorte, EvaluationTemplate } from '../types';

/**
 * Cortes del syllabus según la plantilla vigente (UC20): número, rótulo y porcentaje vienen de la
 * plantilla; los tipos se conservan del syllabus para los cortes que ya existían.
 */
export function applyTemplate(
  template: EvaluationTemplate,
  current?: EvaluationCorte[] | null,
): EvaluationCorte[] {
  return template.map((base) => {
    const previous = current?.find((c) => c.corte === base.corte);
    const tipos = previous?.tipos.length ? previous.tipos : base.tipos;
    return { ...base, tipos: tipos.map((t) => ({ ...t })) };
  });
}

export function sumTipos(corte: EvaluationCorte): number {
  return corte.tipos.reduce((total, t) => total + (Number(t.porcentaje) || 0), 0);
}

/** Problemas que impiden activar el syllabus; un borrador puede guardarse con ellos. */
export function evaluationIssues(cortes: EvaluationCorte[]): string[] {
  const issues: string[] = [];
  for (const corte of cortes) {
    if (corte.tipos.length === 0)
      issues.push(`${corte.label}: agregue al menos un tipo de evaluación.`);
    if (corte.tipos.some((t) => !t.tipo.trim()))
      issues.push(`${corte.label}: todos los tipos de evaluación deben tener nombre.`);
    const suma = sumTipos(corte);
    if (suma !== 100)
      issues.push(`${corte.label}: los porcentajes parciales suman ${suma} % y deben sumar 100 %.`);
  }
  return issues;
}

/** Representación en texto de la evaluación, para comparar versiones. */
export function evaluationToLines(cortes: EvaluationCorte[]): string[] {
  return cortes.flatMap((c) => [
    `${c.label} (${c.porcentaje} %)`,
    ...c.tipos.map((t) => `   ${t.tipo || '(sin nombre)'}: ${t.porcentaje} %`),
  ]);
}

/** Problemas de la plantilla institucional (UC20): cortes completos y que todo sume 100 %. */
export function templateIssues(template: EvaluationTemplate): string[] {
  const issues: string[] = [];
  if (template.length === 0) issues.push('La plantilla debe tener al menos un corte.');
  template.forEach((corte, i) => {
    const label = corte.label.trim() || `Corte ${i + 1}`;
    if (!corte.label.trim()) issues.push(`${label}: el rótulo es obligatorio.`);
    if (corte.porcentaje < 1 || corte.porcentaje > 100)
      issues.push(`${label}: el porcentaje debe estar entre 1 y 100.`);
    issues.push(...evaluationIssues([{ ...corte, label }]));
  });
  const total = template.reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0);
  if (total !== 100) issues.push(`Los cortes suman ${total} % y deben sumar 100 %.`);
  return issues;
}

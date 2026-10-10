import { describe, expect, it } from 'vitest';
import { applyTemplate, evaluationIssues, templateIssues } from './evaluation';
import type { EvaluationTemplate } from '../types';

const template: EvaluationTemplate = [
  { corte: 1, label: 'PRIMER CORTE', porcentaje: 50, tipos: [{ tipo: 'Quiz', porcentaje: 100 }] },
  {
    corte: 2,
    label: 'SEGUNDO CORTE',
    porcentaje: 50,
    tipos: [{ tipo: 'Examen', porcentaje: 100 }],
  },
];

describe('applyTemplate', () => {
  it('toma cortes, rótulos y porcentajes de la plantilla y conserva los tipos del syllabus', () => {
    const syllabus = [
      {
        corte: 1,
        label: 'CORTE VIEJO',
        porcentaje: 30,
        tipos: [{ tipo: 'Taller', porcentaje: 100 }],
      },
    ];
    expect(applyTemplate(template, syllabus)).toEqual([
      {
        corte: 1,
        label: 'PRIMER CORTE',
        porcentaje: 50,
        tipos: [{ tipo: 'Taller', porcentaje: 100 }],
      },
      template[1],
    ]);
  });

  it('copia los tipos para no modificar la plantilla al editar', () => {
    const result = applyTemplate(template);
    result[0].tipos[0].porcentaje = 10;
    expect(template[0].tipos[0].porcentaje).toBe(100);
  });
});

describe('evaluationIssues', () => {
  it('exige nombre en cada tipo y que los parciales sumen 100 por corte', () => {
    expect(evaluationIssues(template)).toEqual([]);
    expect(evaluationIssues([{ ...template[0], tipos: [{ tipo: ' ', porcentaje: 60 }] }])).toEqual([
      'PRIMER CORTE: todos los tipos de evaluación deben tener nombre.',
      'PRIMER CORTE: los porcentajes parciales suman 60 % y deben sumar 100 %.',
    ]);
  });
});

describe('templateIssues', () => {
  it('exige que los cortes sumen 100', () => {
    expect(templateIssues(template)).toEqual([]);
    expect(templateIssues([template[0]])).toContain('Los cortes suman 50 % y deben sumar 100 %.');
  });
});

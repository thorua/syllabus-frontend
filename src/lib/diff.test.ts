import { describe, expect, it } from 'vitest';
import { compareSnapshots, diffLines } from './diff';
import { SectionType, SyllabusStatus } from '../types';
import type { SyllabusSnapshot } from '../types';

describe('diffLines', () => {
  it('marca solo las líneas agregadas y eliminadas', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'equal', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'added', text: 'x' },
      { type: 'equal', text: 'c' },
    ]);
  });
});

describe('compareSnapshots', () => {
  const base: SyllabusSnapshot = {
    title: 'Syllabus',
    status: SyllabusStatus.BORRADOR,
    sections: [
      { sectionType: SectionType.JUSTIFICATION, title: 'Justificación', content: 'Uno', order: 1 },
      { sectionType: SectionType.BIBLIOGRAPHY, title: 'Bibliografía', content: 'Libro', order: 2 },
    ],
  };

  it('detecta datos generales y secciones modificadas, agregadas y eliminadas', () => {
    const after: SyllabusSnapshot = {
      ...base,
      status: SyllabusStatus.ACTIVO,
      sections: [
        { ...base.sections[0], content: 'Dos', order: 2 },
        { sectionType: SectionType.CONTENTS, title: 'Contenidos', content: 'Tema', order: 1 },
      ],
    };
    const { fields, sections } = compareSnapshots(base, after);
    expect(fields).toEqual([{ label: 'Estado', before: 'Borrador', after: 'Activo' }]);
    expect(sections.map((s) => [s.title, s.status])).toEqual([
      ['Contenidos', 'added'],
      ['Justificación', 'modified'],
      ['Bibliografía', 'removed'],
    ]);
  });

  it('compara la evaluación como texto legible', () => {
    const evaluation = (porcentaje: number) => [
      { corte: 1, label: 'PRIMER CORTE', porcentaje: 100, tipos: [{ tipo: 'Quiz', porcentaje }] },
    ];
    const section = (porcentaje: number) => ({
      sectionType: SectionType.EVALUATION,
      title: 'Evaluación',
      content: null,
      evaluation: evaluation(porcentaje),
      order: 1,
    });
    const { sections } = compareSnapshots(
      { ...base, sections: [section(60)] },
      { ...base, sections: [section(100)] },
    );
    expect(sections[0].lines.filter((l) => l.type !== 'equal')).toEqual([
      { type: 'removed', text: '   Quiz: 60 %' },
      { type: 'added', text: '   Quiz: 100 %' },
    ]);
  });
});

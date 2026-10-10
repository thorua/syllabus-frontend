import { SectionTypeLabels, SyllabusStatusLabels } from '../types';
import type { SyllabusSection, SyllabusSnapshot } from '../types';
import { evaluationToLines } from './evaluation';

export interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

/** Diferencia por líneas entre dos textos (subsecuencia común más larga). */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before ? before.split('\n') : [];
  const b = after ? after.split('\n') : [];
  // lcs[i][j] = longitud de la subsecuencia común de a[i..] y b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: 'equal', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: 'removed', text: a[i++] });
    } else {
      result.push({ type: 'added', text: b[j++] });
    }
  }
  while (i < a.length) result.push({ type: 'removed', text: a[i++] });
  while (j < b.length) result.push({ type: 'added', text: b[j++] });
  return result;
}

export interface FieldChange {
  label: string;
  before: string;
  after: string;
}

export interface SectionChange {
  key: string;
  title: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  lines: DiffLine[];
}

export interface SnapshotComparison {
  fields: FieldChange[];
  sections: SectionChange[];
}

function sectionText(section: SyllabusSection): string {
  const body = section.evaluation
    ? evaluationToLines(section.evaluation).join('\n')
    : (section.content ?? '');
  return `${section.title}\n${body}`;
}

/** Identifica cada sección por su tipo y su aparición, para seguirla aunque cambie de posición. */
function keyed(sections: SyllabusSection[]): Map<string, SyllabusSection> {
  const seen = new Map<string, number>();
  const result = new Map<string, SyllabusSection>();
  for (const section of [...sections].sort((x, y) => x.order - y.order)) {
    const n = seen.get(section.sectionType) ?? 0;
    seen.set(section.sectionType, n + 1);
    result.set(`${section.sectionType}#${n}`, section);
  }
  return result;
}

/** UC14: qué cambió entre dos versiones de un syllabus. */
export function compareSnapshots(
  before: SyllabusSnapshot,
  after: SyllabusSnapshot,
): SnapshotComparison {
  const fields: FieldChange[] = [];
  const field = (label: string, x?: string | null, y?: string | null) => {
    if ((x ?? '') !== (y ?? '')) fields.push({ label, before: x || '—', after: y || '—' });
  };
  field('Título', before.title, after.title);
  field('Estado', SyllabusStatusLabels[before.status], SyllabusStatusLabels[after.status]);
  field('Título del encabezado', before.headerTitle, after.headerTitle);
  field('Código del documento', before.documentCode, after.documentCode);
  field('Fecha de elaboración', before.documentDate, after.documentDate);

  const previous = keyed(before.sections);
  const current = keyed(after.sections);
  const sections: SectionChange[] = [];
  for (const [key, section] of current) {
    const old = previous.get(key);
    const lines = diffLines(old ? sectionText(old) : '', sectionText(section));
    const changed = lines.some((l) => l.type !== 'equal');
    sections.push({
      key,
      title: section.title || SectionTypeLabels[section.sectionType],
      status: !old ? 'added' : changed ? 'modified' : 'unchanged',
      lines,
    });
  }
  for (const [key, section] of previous) {
    if (!current.has(key)) {
      sections.push({
        key,
        title: section.title || SectionTypeLabels[section.sectionType],
        status: 'removed',
        lines: diffLines(sectionText(section), ''),
      });
    }
  }
  return { fields, sections };
}

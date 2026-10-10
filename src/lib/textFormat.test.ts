import { describe, expect, it } from 'vitest';
import { bibliographyBlocks, fragments, textBlocks } from './textFormat';

// Mismos casos que backend TextoConFormatoTest: la vista web y el PDF deben coincidir.
describe('textBlocks', () => {
  it('reconoce viñetas, subviñetas, subtítulos y espacios', () => {
    const blocks = textBlocks(
      [
        'RESULTADOS DE APRENDIZAJE:',
        '',
        'Párrafo de texto.',
        '- Metodología Scrum',
        '  - Roles del equipo',
        'o no es viñeta sin sangría',
        '',
        '',
        '✔ Principios SOLID',
      ].join('\n'),
    );
    expect(blocks.map((b) => b.form)).toEqual([
      'subtitle',
      'space',
      'paragraph',
      'bullet',
      'subbullet',
      'paragraph',
      'space',
      'bullet',
    ]);
    expect(blocks[4].fragments).toEqual([{ text: 'Roles del equipo', bold: false, italic: false }]);
  });
});

describe('fragments', () => {
  it('separa negrita y cursiva', () => {
    expect(fragments('**SO2** – Diseño de *software* seguro')).toEqual([
      { text: 'SO2', bold: true, italic: false },
      { text: ' – Diseño de ', bold: false, italic: false },
      { text: 'software', bold: false, italic: true },
      { text: ' seguro', bold: false, italic: false },
    ]);
  });
});

describe('bibliographyBlocks', () => {
  it('pone viñeta a cada referencia y negrita a los rótulos', () => {
    const blocks = bibliographyBlocks(
      [
        'Requerida:',
        '- FOWLER, Martin. *Refactoring*. Addison-Wesley, 2018.',
        'PRESSMAN, Roger. Ingeniería del software.',
        '',
        'Sugerida',
      ].join('\n'),
    );
    expect(blocks.map((b) => b.form)).toEqual([
      'subtitle',
      'bullet',
      'bullet',
      'space',
      'subtitle',
    ]);
    expect(blocks[0].fragments[0].text).toBe('Requerida');
    expect(blocks[1].fragments).toContainEqual({ text: 'Refactoring', bold: false, italic: true });
  });
});

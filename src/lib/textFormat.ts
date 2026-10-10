/**
 * Convenciones de formato del texto de las secciones, las mismas que aplica el PDF
 * (backend: exportacion/TextoConFormato.java) para que la vista web y el documento coincidan:
 * - «- texto» (o ✔, •): viñeta ✔; con dos o más espacios de sangría, subviñeta «o».
 * - **texto**: negrita; *texto*: cursiva.
 * - Una línea toda en mayúsculas es un subtítulo en negrita.
 * - Las líneas en blanco se conservan (varias seguidas cuentan como una).
 * En la bibliografía cada línea es una referencia con viñeta ✔, salvo los rótulos
 * Requerida, Sugerida y Complementaria.
 */
export type Form = 'paragraph' | 'subtitle' | 'bullet' | 'subbullet' | 'space';

export interface Fragment {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface Block {
  form: Form;
  fragments: Fragment[];
}

const BULLET = /^([-✔•]|o(?=\s))\s+(.*)$/;
const STYLE = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g;
const BIBLIOGRAPHY_LABEL = /^(Requerida|Sugerida|Complementaria)\s*:?$/i;

export const FORMAT_HINT =
  'Formato: «- » viñeta, «  - » subviñeta, **negrita**, *cursiva*; una línea en MAYÚSCULAS es un subtítulo.';

export function fragments(text: string): Fragment[] {
  const result: Fragment[] = [];
  let from = 0;
  for (const match of text.matchAll(STYLE)) {
    const start = match.index ?? 0;
    if (start > from) result.push({ text: text.slice(from, start), bold: false, italic: false });
    const bold = match[1] !== undefined;
    result.push({ text: bold ? match[1] : match[2], bold, italic: !bold });
    from = start + match[0].length;
  }
  if (from < text.length) result.push({ text: text.slice(from), bold: false, italic: false });
  return result;
}

const plain = (text: string, bold = false): Fragment[] => [{ text, bold, italic: false }];

function isUppercase(text: string): boolean {
  return /\p{L}/u.test(text) && text === text.toUpperCase() && text.length <= 120;
}

function build(
  text: string | null | undefined,
  line: (raw: string, clean: string) => Block,
): Block[] {
  const blocks: Block[] = [];
  for (const raw of (text ?? '').replace(/\t/g, '    ').split(/\r?\n/)) {
    const clean = raw.trim();
    if (!clean) {
      if (blocks.length > 0 && blocks[blocks.length - 1].form !== 'space')
        blocks.push({ form: 'space', fragments: [] });
    } else {
      blocks.push(line(raw, clean));
    }
  }
  if (blocks[blocks.length - 1]?.form === 'space') blocks.pop();
  return blocks;
}

export function textBlocks(text: string | null | undefined): Block[] {
  return build(text, (raw, clean) => {
    const indent = raw.length - raw.trimStart().length;
    const bullet = BULLET.exec(clean);
    const isO = bullet?.[1] === 'o';
    if (bullet && (!isO || indent >= 2)) {
      return { form: indent >= 2 || isO ? 'subbullet' : 'bullet', fragments: fragments(bullet[2]) };
    }
    if (isUppercase(clean))
      return { form: 'subtitle', fragments: plain(clean.replace(/\*/g, ''), true) };
    return { form: 'paragraph', fragments: fragments(clean) };
  });
}

export function bibliographyBlocks(text: string | null | undefined): Block[] {
  return build(text, (_raw, clean) => {
    if (BIBLIOGRAPHY_LABEL.test(clean)) {
      return { form: 'subtitle', fragments: plain(clean.replace(/\s*:$/, ''), true) };
    }
    const bullet = BULLET.exec(clean);
    return { form: 'bullet', fragments: fragments(bullet ? bullet[2] : clean) };
  });
}

import { SectionType } from '../../types';
import type { EvaluationCorte, SyllabusSection } from '../../types';
import { bibliographyBlocks, textBlocks } from '../../lib/textFormat';
import type { Block } from '../../lib/textFormat';
import { cn } from '../../lib/utils';

/** Tabla de evaluación de solo lectura: CORTE combinado verticalmente, como en el formato Almera. */
export function EvaluationTableReader({ cortes }: { cortes: EvaluationCorte[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left border-b font-medium">Corte</th>
            <th className="p-2 text-left border-b font-medium">Tipo de evaluación</th>
            <th className="p-2 text-left border-b font-medium">% Parcial</th>
            <th className="p-2 text-left border-b font-medium">% Total</th>
          </tr>
        </thead>
        <tbody>
          {cortes.map((corte) =>
            corte.tipos.map((tipo, i) => (
              <tr key={`${corte.corte}-${i}`} className="border-b">
                {i === 0 && (
                  <td rowSpan={corte.tipos.length} className="p-2 border-b align-top">
                    <span className="font-medium">{corte.label}</span>
                  </td>
                )}
                <td className="p-2">{tipo.tipo || '—'}</td>
                <td className="p-2">{tipo.porcentaje}%</td>
                {i === 0 && (
                  <td rowSpan={corte.tipos.length} className="p-2 border-b align-top">
                    <span className="font-medium">{corte.porcentaje}%</span>
                  </td>
                )}
              </tr>
            )),
          )}
          <tr className="font-medium bg-gray-50 border-t-2">
            <td className="p-2 border-t" />
            <td className="p-2 border-t">Total</td>
            <td className="p-2 border-t" />
            <td className="p-2 border-t">{cortes.reduce((sum, c) => sum + c.porcentaje, 0)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Contenido de una sección: la tabla de evaluación o el texto con viñetas, negritas y cursivas. */
export function SectionContent({ section }: { section: SyllabusSection }) {
  if (section.evaluation) {
    return <EvaluationTableReader cortes={section.evaluation} />;
  }
  if (!section.content?.trim()) {
    return <p className="text-sm italic text-gray-400">Sin contenido</p>;
  }
  const blocks =
    section.sectionType === SectionType.BIBLIOGRAPHY
      ? bibliographyBlocks(section.content)
      : textBlocks(section.content);
  return (
    <div className="space-y-1 text-sm text-gray-700">
      {blocks.map((block, i) => (
        <FormattedBlock key={i} block={block} />
      ))}
    </div>
  );
}

const BLOCK_STYLES: Record<Block['form'], string> = {
  paragraph: 'text-justify',
  subtitle: 'font-semibold text-gray-900',
  bullet: 'flex gap-2 pl-6',
  subbullet: 'flex gap-2 pl-12',
  space: 'h-2',
};

function FormattedBlock({ block }: { block: Block }) {
  const text = block.fragments.map((f, i) => (
    <span key={i} className={cn(f.bold && 'font-semibold', f.italic && 'italic')}>
      {f.text}
    </span>
  ));
  if (block.form === 'bullet' || block.form === 'subbullet') {
    return (
      <p className={BLOCK_STYLES[block.form]}>
        <span className="shrink-0 text-uam-blue">{block.form === 'bullet' ? '✔' : '◦'}</span>
        <span>{text}</span>
      </p>
    );
  }
  return <p className={BLOCK_STYLES[block.form]}>{text}</p>;
}

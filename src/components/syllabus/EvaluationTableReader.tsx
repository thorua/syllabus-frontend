import type { EvaluationCorte, SyllabusSection } from '../../types';

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

/** Contenido de una sección: la tabla de evaluación o el texto con sus saltos de línea. */
export function SectionContent({ section }: { section: SyllabusSection }) {
  if (section.evaluation) {
    return <EvaluationTableReader cortes={section.evaluation} />;
  }
  return section.content ? (
    <div className="whitespace-pre-wrap text-sm text-gray-700">{section.content}</div>
  ) : (
    <p className="text-sm italic text-gray-400">Sin contenido</p>
  );
}

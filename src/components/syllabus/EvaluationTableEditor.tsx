import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { sumTipos } from '../../lib/evaluation';
import type { EvaluationCorte, EvaluationTipo } from '../../types';

interface EvaluationTableEditorProps {
  value: EvaluationCorte[];
  onChange: (value: EvaluationCorte[]) => void;
}

/**
 * UC20: los cortes, sus rótulos y su porcentaje (% Total) vienen de la plantilla institucional;
 * el docente completa los tipos de evaluación y su porcentaje parcial dentro de cada corte.
 */
export function EvaluationTableEditor({ value, onChange }: EvaluationTableEditorProps) {
  const updateTipos = (corteIndex: number, tipos: EvaluationTipo[]) =>
    onChange(value.map((c, i) => (i === corteIndex ? { ...c, tipos } : c)));

  const updateTipo = (corteIndex: number, tipoIndex: number, patch: Partial<EvaluationTipo>) =>
    updateTipos(
      corteIndex,
      value[corteIndex].tipos.map((t, i) => (i === tipoIndex ? { ...t, ...patch } : t)),
    );

  const total = value.reduce((sum, c) => sum + c.porcentaje, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estrategia de evaluación del aprendizaje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="w-36 p-2 text-left border-b bg-gray-50">Corte</th>
                <th className="p-2 text-left border-b bg-gray-50">Tipo de evaluación</th>
                <th className="w-32 p-2 text-left border-b bg-gray-50">% Parcial</th>
                <th className="w-24 p-2 text-left border-b bg-gray-50">% Total</th>
              </tr>
            </thead>
            {value.map((corte, corteIndex) => {
              const suma = sumTipos(corte);
              return (
                <tbody key={corte.corte} className="border-b">
                  {corte.tipos.map((tipo, tipoIndex) => (
                    <tr key={tipoIndex}>
                      {tipoIndex === 0 && (
                        <td rowSpan={corte.tipos.length + 1} className="p-2 border-b align-top">
                          <span className="font-medium">{corte.label}</span>
                        </td>
                      )}
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Input
                            value={tipo.tipo}
                            onChange={(e) =>
                              updateTipo(corteIndex, tipoIndex, { tipo: e.target.value })
                            }
                            placeholder="Ej: Quiz, Taller, Proyecto"
                            maxLength={100}
                            aria-label={`${corte.label}: tipo de evaluación ${tipoIndex + 1}`}
                            className="h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateTipos(
                                corteIndex,
                                corte.tipos.filter((_, i) => i !== tipoIndex),
                              )
                            }
                            disabled={corte.tipos.length <= 1}
                            title="Quitar tipo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={tipo.porcentaje}
                          onChange={(e) =>
                            updateTipo(corteIndex, tipoIndex, {
                              porcentaje: Math.round(Number(e.target.value) || 0),
                            })
                          }
                          aria-label={`${corte.label}: % parcial ${tipoIndex + 1}`}
                          className="h-8"
                        />
                      </td>
                      {tipoIndex === 0 && (
                        <td rowSpan={corte.tipos.length + 1} className="p-2 border-b align-top">
                          <span className="font-medium">{corte.porcentaje}%</span>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2 border-b">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateTipos(corteIndex, [...corte.tipos, { tipo: '', porcentaje: 0 }])
                        }
                        disabled={corte.tipos.length >= 10}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar tipo
                      </Button>
                    </td>
                    <td className="p-2 border-b">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          suma === 100 ? 'text-green-700' : 'text-red-600',
                        )}
                      >
                        {suma}% de 100%
                      </span>
                    </td>
                  </tr>
                </tbody>
              );
            })}
            <tfoot>
              <tr className="font-medium bg-gray-50">
                <td className="p-2 border-t" />
                <td className="p-2 border-t">Total</td>
                <td className="p-2 border-t" />
                <td className="p-2 border-t">{total}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>
            Los cortes, sus rótulos y el % Total los define la plantilla institucional. Complete los
            tipos de evaluación de cada corte; sus porcentajes parciales deben sumar 100 % para
            activar el syllabus.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

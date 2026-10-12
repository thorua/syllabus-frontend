import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { PageContainer } from '../../components/composites';
import { Save, Plus, Trash2, Shield, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { useSettings, useUpdateSettings, useUploadLogo } from '../../hooks';
import { sumTipos, templateIssues } from '../../lib/evaluation';
import { cn } from '../../lib/utils';
import type { EvaluationCorte, EvaluationTipo, InstitutionalConfig } from '../../types';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type TextField = Exclude<keyof InstitutionalConfig, 'evaluationTemplate' | 'universityLogoUrl'>;

/** UC18 plantilla institucional, UC19 versión del formato y UC20 estrategia de evaluación. */
export function SettingsPage() {
  const { data: config, isLoading } = useSettings();

  if (isLoading || !config) {
    return (
      <Layout>
        <div className="text-center py-8">Cargando...</div>
      </Layout>
    );
  }
  return <SettingsForm initial={config} />;
}

function SettingsForm({ initial }: { initial: InstitutionalConfig }) {
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();
  const fileInput = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState(initial);
  const template = config.evaluationTemplate;

  const field = (key: TextField, label: string, placeholder?: string, required = false) => (
    <div className="space-y-2">
      <Label htmlFor={`cfg-${key}`}>
        {label}
        {required && ' *'}
      </Label>
      <Input
        id={`cfg-${key}`}
        value={config[key] ?? ''}
        onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  const setTemplate = (update: (prev: EvaluationCorte[]) => EvaluationCorte[]) =>
    setConfig((prev) => ({ ...prev, evaluationTemplate: update(prev.evaluationTemplate) }));

  const updateCorte = (index: number, patch: Partial<EvaluationCorte>) =>
    setTemplate((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const updateTipos = (index: number, update: (tipos: EvaluationTipo[]) => EvaluationTipo[]) =>
    setTemplate((prev) => prev.map((c, i) => (i === index ? { ...c, tipos: update(c.tipos) } : c)));

  const totalCortes = template.reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0);

  const handleLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('El logo debe ser una imagen PNG o JPEG');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('El archivo supera el tamaño máximo de 2 MB');
      return;
    }
    try {
      const saved = await uploadLogo.mutateAsync(file);
      setConfig((prev) => ({ ...prev, universityLogoUrl: saved.universityLogoUrl }));
      toast.success('Logo actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo subir el logo'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const issues = templateIssues(template);
    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }
    try {
      const saved = await updateSettings.mutateAsync(config);
      setConfig(saved);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar'));
    }
  };

  return (
    <Layout>
      <PageContainer title="Configuración" description="Ajustes institucionales">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Universidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {field('universityName', 'Nombre de la Universidad', undefined, true)}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-20 w-36 items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
                      <img
                        src={config.universityLogoUrl}
                        alt="Logo institucional"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        ref={fileInput}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleLogo}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInput.current?.click()}
                        disabled={uploadLogo.isPending}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadLogo.isPending ? 'Subiendo...' : 'Cambiar logo'}
                      </Button>
                      <p className="text-xs text-gray-500">
                        PNG o JPEG de hasta 2 MB. Se usa en el encabezado del PDF.
                      </p>
                    </div>
                  </div>
                </div>
                {field('universityAddress', 'Dirección')}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {field('universityPhone', 'Teléfono')}
                  {field('universityEmail', 'Email')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Facultad y Departamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {field('facultyName', 'Nombre de la Facultad')}
                {field('departmentName', 'Nombre del Departamento')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Encabezado del Documento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {field(
                  'syllabusHeader',
                  'Título del Encabezado',
                  'SYLLABUS DE LA ASIGNATURA',
                  true,
                )}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  {field('documentCode', 'Código del Documento', 'GFR-FOR-005', true)}
                  <div className="space-y-2">
                    {field('documentVersion', 'Versión del formato', undefined, true)}
                    <p className="text-xs text-gray-500">
                      La define la institución; el docente no puede modificarla.
                    </p>
                  </div>
                  {field('documentDate', 'Fecha Elaboración', '01/09/2026', true)}
                </div>
                {field(
                  'syllabusSubtitle',
                  'Subtítulo del Syllabus',
                  'Acreditación Institucional de Alta Calidad',
                )}
                {field('footerText', 'Texto del Pie de Página')}
                <div className="space-y-2">
                  <Label htmlFor="cfg-maxSectionLength">Máximo de caracteres por sección *</Label>
                  <Input
                    id="cfg-maxSectionLength"
                    type="number"
                    min={200}
                    max={20000}
                    value={config.maxSectionLength ?? 2000}
                    onChange={(e) =>
                      setConfig({ ...config, maxSectionLength: Number(e.target.value) })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Límite de cada sección del syllabus (2000 por defecto). Se aplica al guardar.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Plantilla de Evaluación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-500">
                  Los cortes, sus rótulos y su porcentaje sobre la nota final son fijos para todos
                  los syllabus. Los tipos de cada corte son la propuesta inicial: el docente puede
                  ajustarlos y sus porcentajes parciales deben sumar 100 % en cada corte. Los
                  syllabus existentes adoptan los cambios la próxima vez que se editan.
                </p>
                {template.map((corte, corteIndex) => {
                  const suma = sumTipos(corte);
                  return (
                    <div
                      key={corte.corte}
                      className="rounded-lg border border-gray-200 p-3 space-y-3"
                    >
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor={`corte-label-${corte.corte}`}>Etiqueta del corte</Label>
                          <Input
                            id={`corte-label-${corte.corte}`}
                            value={corte.label}
                            onChange={(e) => updateCorte(corteIndex, { label: e.target.value })}
                            placeholder="I"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`corte-pct-${corte.corte}`}>% del corte</Label>
                          <Input
                            id={`corte-pct-${corte.corte}`}
                            type="number"
                            min={1}
                            max={100}
                            value={corte.porcentaje}
                            onChange={(e) =>
                              updateCorte(corteIndex, {
                                porcentaje: Math.round(Number(e.target.value) || 0),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              suma === 100 ? 'text-green-600' : 'text-red-600',
                            )}
                          >
                            Suma tipos: {suma}% de 100%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Actividades / tipos de evaluación</Label>
                        {corte.tipos.map((tipo, tipoIndex) => (
                          <div key={tipoIndex} className="flex flex-wrap items-center gap-2">
                            <Input
                              value={tipo.tipo}
                              onChange={(e) =>
                                updateTipos(corteIndex, (tipos) =>
                                  tipos.map((t, i) =>
                                    i === tipoIndex ? { ...t, tipo: e.target.value } : t,
                                  ),
                                )
                              }
                              placeholder="Tipo de actividad (ej. Quiz)"
                              aria-label={`${corte.label}: tipo ${tipoIndex + 1}`}
                              maxLength={100}
                              className="flex-1 min-w-[160px]"
                            />
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={tipo.porcentaje}
                                onChange={(e) =>
                                  updateTipos(corteIndex, (tipos) =>
                                    tipos.map((t, i) =>
                                      i === tipoIndex
                                        ? {
                                            ...t,
                                            porcentaje: Math.round(Number(e.target.value) || 0),
                                          }
                                        : t,
                                    ),
                                  )
                                }
                                aria-label={`${corte.label}: % parcial ${tipoIndex + 1}`}
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateTipos(corteIndex, (tipos) =>
                                  tipos.filter((_, i) => i !== tipoIndex),
                                )
                              }
                              disabled={corte.tipos.length <= 1}
                              title="Quitar actividad"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateTipos(corteIndex, (tipos) => [
                              ...tipos,
                              { tipo: '', porcentaje: 0 },
                            ])
                          }
                          disabled={corte.tipos.length >= 10}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar actividad
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <button
                    type="button"
                    disabled={template.length >= 3}
                    onClick={() =>
                      setTemplate((prev) => [
                        ...prev,
                        {
                          corte: prev.length + 1,
                          label: '',
                          porcentaje: 0,
                          tipos: [{ tipo: '', porcentaje: 100 }],
                        },
                      ])
                    }
                    className="flex items-center gap-1 disabled:opacity-40 hover:text-uam-blue"
                  >
                    <Plus className="h-3 w-3" /> Agregar corte
                  </button>
                  <button
                    type="button"
                    disabled={template.length <= 1}
                    onClick={() => setTemplate((prev) => prev.slice(0, -1))}
                    className="flex items-center gap-1 disabled:opacity-40 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" /> Quitar último corte
                  </button>
                  <span
                    className={cn(
                      'ml-auto font-medium',
                      totalCortes === 100 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    Total de los cortes: {totalCortes}% de 100%
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateSettings.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </Layout>
  );
}

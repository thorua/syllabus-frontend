import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { SyllabusHeaderEditor } from '../../components/syllabus/SyllabusHeaderEditor';
import type { HeaderField } from '../../components/syllabus/SyllabusHeaderEditor';
import { EvaluationTableEditor } from '../../components/syllabus/EvaluationTableEditor';
import { IdentificationTable } from '../../components/syllabus/SectionContent';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Save,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import {
  useAuth,
  useCreateSyllabus,
  useSettings,
  useSubjects,
  useSyllabus,
  useUpdateSyllabus,
} from '../../hooks';
import { applyTemplate, evaluationIssues } from '../../lib/evaluation';
import { FORMAT_HINT } from '../../lib/textFormat';
import { getSubjectCode, getSubjectName } from '../../lib/utils';
import { SectionType, SectionTypeLabels, SyllabusStatus, SyllabusStatusLabels } from '../../types';
import type {
  EvaluationCorte,
  EvaluationTemplate,
  Syllabus,
  SyllabusSectionInput,
} from '../../types';

interface SectionDraft {
  key: number;
  sectionType: SectionType;
  title: string;
  content: string;
  evaluation: EvaluationCorte[] | null;
}

let nextKey = 0;

const DEFAULT_SECTIONS: [SectionType, string][] = [
  [SectionType.IDENTIFICATION, 'Identificación'],
  [SectionType.JUSTIFICATION, 'Justificación'],
  [SectionType.PERFORMANCE, 'Desempeño Esperado'],
  [SectionType.CONTENTS, 'Contenidos'],
  [SectionType.TEACHING_STRATEGIES, 'Estrategias de Enseñanza'],
  [SectionType.EVALUATION, 'Estrategia de Evaluación del Aprendizaje'],
  [SectionType.BIBLIOGRAPHY, 'Bibliografía'],
];

function initialSections(template: EvaluationTemplate, syllabus?: Syllabus): SectionDraft[] {
  if (syllabus?.sections) {
    return syllabus.sections.map((s) => ({
      key: nextKey++,
      sectionType: s.sectionType,
      title: s.title,
      content: s.content ?? '',
      // La plantilla vigente manda sobre los cortes; los tipos del syllabus se conservan.
      evaluation:
        s.sectionType === SectionType.EVALUATION ? applyTemplate(template, s.evaluation) : null,
    }));
  }
  return DEFAULT_SECTIONS.map(([sectionType, title]) => ({
    key: nextKey++,
    sectionType,
    title,
    content: '',
    evaluation: sectionType === SectionType.EVALUATION ? applyTemplate(template) : null,
  }));
}

/** UC11 crear y UC12 editar syllabus (cada guardado genera una versión, UC22). */
export function SyllabusFormPage() {
  const { id } = useParams<{ id: string }>();
  const { data: config, isLoading: loadingConfig } = useSettings();
  const { data: syllabus, isLoading: loadingSyllabus } = useSyllabus(id ?? '');

  if (loadingConfig || (id && loadingSyllabus)) {
    return (
      <Layout>
        <div className="text-center py-8">Cargando...</div>
      </Layout>
    );
  }
  if (!config || (id && !syllabus)) {
    return (
      <Layout>
        <div className="text-center py-8">Syllabus no encontrado</div>
      </Layout>
    );
  }
  return (
    <SyllabusForm key={id ?? 'new'} template={config.evaluationTemplate} syllabus={syllabus} />
  );
}

function SyllabusForm({
  template,
  syllabus,
}: {
  template: EvaluationTemplate;
  syllabus?: Syllabus;
}) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const isEdit = !!syllabus;
  const backTo = isEdit ? `/syllabus/${syllabus.id}` : '/syllabus';
  const { data: subjects = [] } = useSubjects({ manageable: true });
  const createSyllabus = useCreateSyllabus();
  const updateSyllabus = useUpdateSyllabus();
  const saving = createSyllabus.isPending || updateSyllabus.isPending;

  const [subjectId, setSubjectId] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [title, setTitle] = useState(syllabus?.title ?? '');
  const [titleEdited, setTitleEdited] = useState(isEdit);
  const [status, setStatus] = useState<SyllabusStatus>(
    syllabus && syllabus.status !== SyllabusStatus.INACTIVO
      ? syllabus.status
      : SyllabusStatus.BORRADOR,
  );
  const [header, setHeader] = useState<Record<HeaderField, string>>({
    headerTitle: syllabus?.headerTitle ?? '',
    documentCode: syllabus?.documentCode ?? '',
    documentDate: syllabus?.documentDate ?? '',
  });
  const [changeDescription, setChangeDescription] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>(() =>
    initialSections(template, syllabus),
  );

  // Sugiere el título a partir de la asignatura y el período mientras no se escriba uno propio.
  const suggestTitle = (nextSubjectId: string, nextPeriod: string) => {
    const subject = subjects.find((s) => s.id === nextSubjectId);
    if (!titleEdited && subject) {
      setTitle(`Syllabus ${subject.name}${nextPeriod ? ` - ${nextPeriod}` : ''}`);
    }
  };

  const updateSection = (index: number, patch: Partial<SectionDraft>) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const changeType = (index: number, sectionType: SectionType) =>
    updateSection(index, {
      sectionType,
      evaluation: sectionType === SectionType.EVALUATION ? applyTemplate(template) : null,
    });

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      {
        key: nextKey++,
        sectionType: SectionType.IDENTIFICATION,
        title: '',
        content: '',
        evaluation: null,
      },
    ]);

  const removeSection = (index: number) =>
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const moveSection = (index: number, offset: -1 | 1) =>
    setSections((prev) => {
      const target = index + offset;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const hasEvaluation = sections.some((s) => s.sectionType === SectionType.EVALUATION);
  const selectedSubject = syllabus?.subject ?? subjects.find((s) => s.id === subjectId);

  /** Mismas reglas que el backend para activar: secciones con contenido y evaluación completa. */
  const activationProblem = (): string | null => {
    const empty = sections.find(
      (s) =>
        s.sectionType !== SectionType.EVALUATION &&
        s.sectionType !== SectionType.IDENTIFICATION &&
        !s.content.trim(),
    );
    if (empty) return `La sección «${empty.title || 'sin título'}» no tiene contenido.`;
    const evaluation = sections.find((s) => s.evaluation)?.evaluation;
    return evaluation ? (evaluationIssues(evaluation)[0] ?? null) : null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sections.some((s) => !s.title.trim())) {
      toast.error('Todas las secciones deben tener título');
      return;
    }
    if (status === SyllabusStatus.ACTIVO) {
      const problem = activationProblem();
      if (problem) {
        toast.error(`${problem} Complétela o guarde el syllabus como borrador.`);
        return;
      }
    }
    const payload: SyllabusSectionInput[] = sections.map((s) => ({
      sectionType: s.sectionType,
      title: s.title,
      content: s.evaluation ? null : s.content,
      evaluation: s.evaluation,
    }));

    try {
      if (isEdit) {
        await updateSyllabus.mutateAsync({
          id: syllabus.id,
          input: {
            title,
            status,
            ...header,
            sections: payload,
            changeDescription,
            baseVersion: syllabus.currentVersion,
          },
        });
        toast.success('Syllabus actualizado correctamente');
        navigate(backTo);
      } else {
        const created = await createSyllabus.mutateAsync({
          subjectId,
          academicPeriod,
          title,
          status,
          ...header,
          sections: payload,
        });
        toast.success('Syllabus creado correctamente');
        navigate(`/syllabus/${created.id}`);
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, isEdit ? 'Error al actualizar syllabus' : 'Error al crear syllabus'),
      );
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(backTo)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {isEdit ? 'Editar Syllabus' : 'Crear Syllabus'}
            </h1>
            <p className="text-gray-500">
              {isEdit
                ? `${getSubjectCode(syllabus)} - ${getSubjectName(syllabus)} | ${syllabus.academicPeriod} · versión ${syllabus.currentVersion ?? 1}`
                : 'Complete la información para crear un nuevo syllabus'}
            </p>
            {syllabus?.status === SyllabusStatus.INACTIVO && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Este syllabus está <strong>inactivo</strong>. Al guardarlo como Borrador o Activo
                  se reactiva.
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SyllabusHeaderEditor
            {...header}
            readOnly={!can('syllabus:header')}
            onChange={(field, value) => setHeader((prev) => ({ ...prev, [field]: value }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEdit && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="syl-subject">Asignatura *</Label>
                    <select
                      id="syl-subject"
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        suggestTitle(e.target.value, academicPeriod);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Seleccione una asignatura</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </option>
                      ))}
                    </select>
                    {subjects.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No tiene asignaturas a su cargo para crear syllabus.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syl-period">Periodo Académico *</Label>
                    <Input
                      id="syl-period"
                      placeholder="Ej: 2026-02"
                      value={academicPeriod}
                      onChange={(e) => {
                        setAcademicPeriod(e.target.value);
                        suggestTitle(subjectId, e.target.value);
                      }}
                      pattern="\d{4}-0[1-3]"
                      title="Formato AAAA-01, AAAA-02 o AAAA-03"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="syl-title">Título del Syllabus *</Label>
                  <Input
                    id="syl-title"
                    placeholder="Ej: Syllabus Ingeniería de Software II - 2026-02"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleEdited(true);
                    }}
                    maxLength={250}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syl-status">Estado</Label>
                  <select
                    id="syl-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SyllabusStatus)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={SyllabusStatus.BORRADOR}>
                      {SyllabusStatusLabels[SyllabusStatus.BORRADOR]}
                    </option>
                    <option value={SyllabusStatus.ACTIVO}>
                      {SyllabusStatusLabels[SyllabusStatus.ACTIVO]} (vigente)
                    </option>
                  </select>
                </div>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="syl-change">Descripción del Cambio *</Label>
                  <Input
                    id="syl-change"
                    placeholder="Ej: Actualización de bibliografía y contenidos del módulo 3"
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    maxLength={500}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Esta descripción se guardará en el historial de versiones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Secciones del Syllabus</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  disabled={sections.length >= 20}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Sección
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.key} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Sección {index + 1}</span>
                      <Badge variant="outline">{SectionTypeLabels[section.sectionType]}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        title="Subir"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                        title="Bajar"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(index)}
                        disabled={sections.length <= 1}
                        title="Eliminar sección"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`sec-type-${section.key}`}>Tipo de Sección</Label>
                      <select
                        id={`sec-type-${section.key}`}
                        value={section.sectionType}
                        onChange={(e) => changeType(index, e.target.value as SectionType)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {Object.values(SectionType).map((type) => (
                          <option
                            key={type}
                            value={type}
                            disabled={
                              type === SectionType.EVALUATION &&
                              hasEvaluation &&
                              section.sectionType !== SectionType.EVALUATION
                            }
                          >
                            {SectionTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sec-title-${section.key}`}>Título de la Sección</Label>
                      <Input
                        id={`sec-title-${section.key}`}
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        placeholder="Título de la sección"
                        maxLength={200}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sec-content-${section.key}`}>Contenido</Label>
                    {section.sectionType === SectionType.IDENTIFICATION ? (
                      <div className="space-y-2">
                        {selectedSubject && (
                          <IdentificationTable
                            subject={selectedSubject}
                            academicPeriod={syllabus?.academicPeriod ?? academicPeriod}
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          {selectedSubject
                            ? 'Se completa con los datos de la asignatura y de su programa; se corrigen en Asignaturas o en Pregrado/Posgrado.'
                            : 'Seleccione la asignatura: esta tabla se completa con sus datos.'}
                        </p>
                      </div>
                    ) : section.evaluation ? (
                      <EvaluationTableEditor
                        value={section.evaluation}
                        onChange={(evaluation) => updateSection(index, { evaluation })}
                      />
                    ) : (
                      <textarea
                        id={`sec-content-${section.key}`}
                        value={section.content}
                        onChange={(e) => updateSection(index, { content: e.target.value })}
                        maxLength={20000}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Escriba el contenido de esta sección..."
                      />
                    )}
                    {!section.evaluation && section.sectionType !== SectionType.IDENTIFICATION && (
                      <p className="text-xs text-gray-500">{FORMAT_HINT}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Syllabus'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

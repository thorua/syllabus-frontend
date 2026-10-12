import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, Power } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/composites';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Modal } from '../../components/ui/modal';
import { ConventionsLegend } from '../../components/syllabus/Conventions';
import { getErrorMessage } from '../../api/client';
import { cn } from '../../lib/utils';
import { CONVENTIONS } from '../../lib/verification';
import { getLevelLabel, isPosgradoLevel } from '../../lib/programLevel';
import {
  useAuth,
  useCurriculum,
  usePlaceSubject,
  usePrograms,
  useRemovePlanSubject,
  useSaveStudyPlan,
  useStudyPlans,
  useSubjects,
  useSyllabusPeriods,
} from '../../hooks';
import type { CurriculumState, CurriculumSubject } from '../../types';

const selectClass = 'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm';

/** Período en curso: enero–junio es AAAA-01 y julio–diciembre AAAA-02. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-0${now.getMonth() < 6 ? 1 : 2}`;
}

/**
 * Malla curricular de cada plan de estudios por semestre, con el estado del syllabus de cada
 * asignatura en el período: verificado (✔ verde), pendiente de firma, en borrador o sin syllabus
 * (✘ rojo). Muestra quién ofrece cada asignatura, p. ej. las de Matemáticas en los planes de
 * ingeniería. La Administración arma los planes (agrega, mueve o quita asignaturas).
 */
export function StudyPlansPage() {
  const { can, user } = useAuth();
  const manage = can('plan:manage');
  const { data: programs = [] } = usePrograms();
  const { data: periods = [] } = useSyllabusPeriods();
  const [programId, setProgramId] = useState('');
  const [planId, setPlanId] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: plans = [] } = useStudyPlans(programId || undefined);
  const { data: curriculum, isLoading } = useCurriculum(planId || undefined, period);
  const savePlan = useSaveStudyPlan();
  const remove = useRemovePlanSubject();

  const periodOptions = useMemo(
    () => [...new Set([currentPeriod(), ...periods])].sort().reverse(),
    [periods],
  );

  // Abre primero un programa del usuario o, si no tiene, el primero con asignaturas.
  useEffect(() => {
    if (programId || programs.length === 0) return;
    const propio = programs.find((p) => user?.programs.some((up) => up.id === p.id));
    setProgramId((propio ?? programs.find((p) => (p.subjectCount ?? 0) > 0) ?? programs[0]).id);
  }, [programs, programId, user]);

  // Período inicial: el actual si ya tiene syllabus; si no, el más reciente anterior que tenga.
  useEffect(() => {
    if (periods.length === 0 || periods.includes(currentPeriod())) return;
    const anterior = periods
      .filter((p) => p < currentPeriod())
      .sort()
      .reverse()[0];
    if (anterior) setPeriod(anterior);
  }, [periods]);

  useEffect(() => {
    if (plans.length > 0 && !plans.some((p) => p.id === planId)) {
      setPlanId((plans.find((p) => p.isActive) ?? plans[0]).id);
    }
    if (plans.length === 0) setPlanId('');
  }, [plans, planId]);

  const counts = useMemo(() => {
    const c: Partial<Record<CurriculumState, number>> = {};
    curriculum?.semesters.forEach((s) =>
      s.subjects.forEach((x) => (c[x.state] = (c[x.state] ?? 0) + 1)),
    );
    return c;
  }, [curriculum]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const plan = plans.find((p) => p.id === planId);
  const program = programs.find((p) => p.id === programId);

  const handleRemove = async (subject: CurriculumSubject) => {
    try {
      await remove.mutateAsync({ planId, subjectId: subject.subjectId, academicPeriod: period });
      toast.success(`${subject.code} retirada del plan`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo quitar la asignatura'));
    }
  };

  const togglePlan = async () => {
    if (!plan) return;
    try {
      await savePlan.mutateAsync({
        id: plan.id,
        programId,
        name: plan.name,
        isActive: !plan.isActive,
      });
      toast.success(plan.isActive ? 'Plan marcado como no vigente' : 'Plan marcado como vigente');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el plan'));
    }
  };

  return (
    <Layout>
      <PageContainer
        title="Planes de estudio"
        description="Malla curricular por semestre y estado de los syllabus del período"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="plan-program">Programa</Label>
              <select
                id="plan-program"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className={selectClass}
              >
                {(['Pregrado', 'Posgrado'] as const).map((grupo) => (
                  <optgroup key={grupo} label={grupo}>
                    {programs
                      .filter((p) => isPosgradoLevel(p.level) === (grupo === 'Posgrado'))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {isPosgradoLevel(p.level) ? ` (${getLevelLabel(p.level)})` : ''}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-period">Período</Label>
              <select
                id="plan-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={selectClass}
              >
                {periodOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            {manage && programId && (
              <Button variant="outline" onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo plan
              </Button>
            )}
          </div>

          {plans.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-uam-gray-mid/30">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                    p.id === planId
                      ? 'border-uam-blue text-uam-blue'
                      : 'border-transparent text-gray-500 hover:text-uam-blue',
                  )}
                >
                  {p.name}
                  {!p.isActive && <span className="ml-1 text-xs text-gray-400">(no vigente)</span>}
                </button>
              ))}
              {manage && plan && (
                <div className="ml-auto flex gap-2 pb-1">
                  <Button variant="outline" size="sm" onClick={togglePlan}>
                    <Power className="mr-2 h-3 w-3" />
                    {plan.isActive ? 'Marcar no vigente' : 'Marcar vigente'}
                  </Button>
                  <Button size="sm" onClick={() => setAdding(true)}>
                    <Plus className="mr-2 h-3 w-3" /> Agregar asignatura
                  </Button>
                </div>
              )}
            </div>
          ) : (
            programId && (
              <p className="text-sm text-gray-500">
                {program?.name} aún no tiene planes de estudio.
              </p>
            )
          )}

          <ConventionsLegend />

          {curriculum && total > 0 && (
            <p className="text-sm text-gray-600">
              {counts.VERIFICADO ?? 0} de {total} asignaturas con syllabus verificado en {period}
              {counts.SIN_SYLLABUS ? ` · ${counts.SIN_SYLLABUS} sin syllabus` : ''}.
            </p>
          )}

          {isLoading && <p className="text-sm text-gray-500">Cargando malla...</p>}
          {curriculum && curriculum.semesters.length === 0 && (
            <p className="text-sm text-gray-500">El plan no tiene asignaturas.</p>
          )}
          {curriculum && curriculum.semesters.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {curriculum.semesters.map((semestre) => (
                <section
                  key={semestre.number}
                  className="w-56 shrink-0 rounded-lg bg-uam-gray-light/50 p-2"
                >
                  <h3 className="mb-2 text-center text-sm font-semibold text-uam-blue">
                    Semestre {semestre.number}
                    <span className="block text-xs font-normal text-gray-500">
                      {semestre.credits} créditos
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {semestre.subjects.map((x) => (
                      <SubjectCard
                        key={x.subjectId}
                        subject={x}
                        ownDepartment={program?.department?.name}
                        onRemove={manage ? () => handleRemove(x) : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </PageContainer>

      {adding && planId && (
        <AddSubjectModal planId={planId} period={period} onClose={() => setAdding(false)} />
      )}
      {creating && (
        <CreatePlanModal
          programId={programId}
          onCreated={setPlanId}
          onClose={() => setCreating(false)}
        />
      )}
    </Layout>
  );
}

function SubjectCard({
  subject,
  ownDepartment,
  onRemove,
}: {
  subject: CurriculumSubject;
  ownDepartment?: string;
  onRemove?: () => void;
}) {
  const c = CONVENTIONS[subject.state];
  const external = !!ownDepartment && subject.offeredBy !== ownDepartment;
  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-xs">{subject.code}</span>
        <span aria-label={c.label} title={c.label} className="text-sm font-bold">
          {c.mark}
        </span>
      </div>
      <p className="text-sm font-medium leading-tight">{subject.name}</p>
      <p className={cn('mt-1 text-xs', external ? 'font-medium' : 'opacity-75')}>
        {subject.offeredBy} · {subject.credits} cr.
      </p>
    </>
  );
  return (
    <div className={cn('group relative rounded-md border p-2', c.className)}>
      {subject.syllabusId && subject.state !== 'BORRADOR' ? (
        <Link to={`/syllabus/${subject.syllabusId}`} className="block hover:underline">
          {body}
        </Link>
      ) : (
        body
      )}
      {onRemove && (
        <button
          type="button"
          title="Quitar del plan"
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 hidden rounded-full border bg-white p-0.5 text-gray-500 shadow hover:text-red-600 group-hover:block"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function AddSubjectModal({
  planId,
  period,
  onClose,
}: {
  planId: string;
  period: string;
  onClose: () => void;
}) {
  const { data: subjects = [] } = useSubjects();
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('1');
  const place = usePlaceSubject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await place.mutateAsync({
        planId,
        subjectId,
        semester: Number(semester),
        academicPeriod: period,
      });
      toast.success('Asignatura ubicada en el plan');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo agregar la asignatura'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Agregar o mover asignatura" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="add-subject">Asignatura</Label>
          <select
            id="add-subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={cn(selectClass, 'w-full')}
            required
          >
            <option value="">Seleccione...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name} ({s.department?.name ?? s.program?.name})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Si ya está en el plan, se mueve al semestre indicado.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="add-semester">Semestre</Label>
          <Input
            id="add-semester"
            type="number"
            min={1}
            max={12}
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={place.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreatePlanModal({
  programId,
  onCreated,
  onClose,
}: {
  programId: string;
  onCreated: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(`Plan ${new Date().getFullYear()}`);
  const save = useSaveStudyPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const plan = await save.mutateAsync({ programId, name });
      toast.success('Plan de estudios creado');
      onCreated(plan.id);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear el plan'));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Nuevo plan de estudios" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="plan-name">Nombre</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
}

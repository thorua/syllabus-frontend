import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Pagination } from '../../components/ui/pagination';
import { Modal, ConfirmDialog } from '../../components/ui/modal';
import { ActiveBadge } from '../../components/ui/status-badge';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Plus, Search, Edit, Trash2, UserPlus, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { getLevelLabel, isPosgradoLevel } from '../../lib/programLevel';
import { Role, type Subject, type SubjectInput } from '../../types';
import {
  useAuth,
  useDebounce,
  useDepartments,
  usePrograms,
  useSubjects,
  useSaveSubject,
  useDeactivateSubject,
  useAssignProfessor,
  useUsers,
} from '../../hooks';

const PAGE_SIZE = 10;
const MODALITIES = ['Presencial', 'Virtual', 'Híbrida'];
const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

interface SubjectForm {
  name: string;
  code: string;
  credits: string;
  semester: string;
  programId: string;
  departmentId: string;
  modality: string;
  hoursPresencial: string;
  hoursDirigido: string;
  hoursIndependiente: string;
  prerequisites: string;
}

const emptyForm: SubjectForm = {
  name: '',
  code: '',
  credits: '3',
  semester: '1',
  programId: '',
  departmentId: '',
  modality: 'Presencial',
  hoursPresencial: '',
  hoursDirigido: '',
  hoursIndependiente: '',
  prerequisites: '',
};

const toForm = (s: Subject): SubjectForm => ({
  name: s.name,
  code: s.code,
  credits: String(s.credits),
  semester: String(s.semester),
  programId: s.program.id,
  departmentId: s.department?.id ?? '',
  modality: s.modality || 'Presencial',
  hoursPresencial: s.hoursPresencial?.toString() ?? '',
  hoursDirigido: s.hoursDirigido?.toString() ?? '',
  hoursIndependiente: s.hoursIndependiente?.toString() ?? '',
  prerequisites: s.prerequisites ?? '',
});

const optionalNumber = (value: string) => (value === '' ? null : Number(value));

const toInput = (f: SubjectForm, posgrado: boolean): SubjectInput => ({
  name: f.name,
  code: f.code,
  credits: Number(f.credits),
  semester: Number(f.semester),
  programId: f.programId,
  departmentId: posgrado ? null : f.departmentId,
  modality: f.modality,
  hoursPresencial: optionalNumber(f.hoursPresencial),
  hoursDirigido: optionalNumber(f.hoursDirigido),
  hoursIndependiente: optionalNumber(f.hoursIndependiente),
  prerequisites: f.prerequisites,
});

/**
 * UC7 asignaturas (Coord. de Departamento, en sus departamentos; el posgrado solo lo gestiona
 * Administración) y UC8 asignar profesor (Coord. de Programa). En /my-subjects es de solo consulta.
 */
export function SubjectsPage() {
  const { user, can } = useAuth();
  const readOnly = useLocation().pathname === '/my-subjects';
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectForm>(emptyForm);
  const [assignSubject, setAssignSubject] = useState<Subject | null>(null);
  const [assignProfessorId, setAssignProfessorId] = useState('');
  const [toDeactivate, setToDeactivate] = useState<Subject | null>(null);
  const debouncedSearch = useDebounce(search);

  const canManage = !readOnly && (can('subject:create') || can('subject:update'));
  // Administración (alcance total) gestiona todo; el Coord. de Departamento, solo sus departamentos.
  const fullScope = !!user?.roles.some((r) => r === Role.ADMINISTRADOR || r === Role.ADM_REGISTRO);

  const { data: departments = [] } = useDepartments();
  const { data: programs = [] } = usePrograms();
  const { data: allSubjects = [], isLoading: loading } = useSubjects({
    departmentId: filterDept || undefined,
    programId: filterProgram || undefined,
    search: debouncedSearch || undefined,
    includeInactive: showInactive,
  });
  const saveSubject = useSaveSubject();
  const deactivateSubject = useDeactivateSubject();
  const assignProfessor = useAssignProfessor();

  const totalPages = Math.max(1, Math.ceil(allSubjects.length / PAGE_SIZE));
  const subjects = allSubjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const editableDepartments = useMemo(
    () =>
      fullScope
        ? departments
        : departments.filter((d) => user?.departments.some((ud) => ud.id === d.id)),
    [departments, fullScope, user],
  );
  const editablePrograms = useMemo(
    () => programs.filter((p) => fullScope || !isPosgradoLevel(p.level)),
    [programs, fullScope],
  );
  const selectedProgram = programs.find((p) => p.id === formData.programId);
  const isPosgrado = isPosgradoLevel(selectedProgram?.level);

  const resetPage = () => setPage(1);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      ...emptyForm,
      departmentId: editableDepartments.length === 1 ? editableDepartments[0].id : '',
    });
    setShowModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData(toForm(subject));
    setShowModal(true);
  };

  const openAssignModal = (subject: Subject) => {
    setAssignSubject(subject);
    setAssignProfessorId(subject.professor?.id ?? '');
  };

  const handleProgramChange = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    setFormData((prev) => ({
      ...prev,
      programId,
      // Por defecto el departamento del programa, si el usuario puede gestionarlo.
      departmentId:
        program &&
        !isPosgradoLevel(program.level) &&
        editableDepartments.some((d) => d.id === program.department?.id)
          ? (program.department?.id ?? '')
          : prev.departmentId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSubject.mutateAsync({
        id: editingSubject?.id,
        input: toInput(formData, isPosgrado),
      });
      toast.success(
        editingSubject ? 'Asignatura actualizada correctamente' : 'Asignatura creada correctamente',
      );
      setShowModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar la asignatura'));
    }
  };

  const handleAssign = async () => {
    if (!assignSubject) return;
    try {
      await assignProfessor.mutateAsync({
        id: assignSubject.id,
        professorId: assignProfessorId || null,
      });
      toast.success(assignProfessorId ? 'Profesor asignado correctamente' : 'Asignación retirada');
      setAssignSubject(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al asignar el profesor'));
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateSubject.mutateAsync(toDeactivate.id);
      toast.success('Asignatura desactivada');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo desactivar la asignatura'));
    } finally {
      setToDeactivate(null);
    }
  };

  const reactivate = async (subject: Subject) => {
    try {
      await saveSubject.mutateAsync({
        id: subject.id,
        input: {
          ...toInput(toForm(subject), isPosgradoLevel(subject.program.level)),
          isActive: true,
        },
      });
      toast.success('Asignatura activada');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo activar la asignatura'));
    }
  };

  const columns: Column<Subject>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (s) => <span className="font-mono text-xs">{s.code}</span>,
    },
    { key: 'name', header: 'Nombre', render: (s) => <span className="font-medium">{s.name}</span> },
    {
      key: 'program',
      header: 'Programa',
      render: (s) => (
        <div className="text-gray-500">
          <span className="block">{s.program.name}</span>
          {isPosgradoLevel(s.program.level) && (
            <span className="text-xs text-gray-400">{getLevelLabel(s.program.level)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Cred/Sem',
      render: (s) => (
        <span className="text-gray-500">
          {s.credits}/{s.semester}
        </span>
      ),
    },
    {
      key: 'professor',
      header: 'Profesor',
      render: (s) => <span className="text-gray-500">{s.professor?.name || 'Por asignar'}</span>,
    },
    // El conteo incluye borradores e inactivos: no aplica a la consulta del estudiante (UC10).
    ...(readOnly
      ? []
      : [
          {
            key: 'syllabus',
            header: 'Syllabus',
            render: (s: Subject) => (
              <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium">
                {s.syllabusCount}
              </span>
            ),
          },
        ]),
    ...(showInactive
      ? [
          {
            key: 'isActive',
            header: 'Estado',
            render: (s: Subject) => <ActiveBadge isActive={s.isActive} />,
          },
        ]
      : []),
  ];

  const rowActions: RowAction<Subject>[] = readOnly
    ? []
    : [
        {
          label: 'Asignar profesor',
          icon: <UserPlus className="h-4 w-4" />,
          onClick: openAssignModal,
          if: (s) => s.isActive && can('subject:assign'),
        },
        {
          label: 'Editar',
          icon: <Edit className="h-4 w-4" />,
          onClick: openEditModal,
          if: () => can('subject:update'),
        },
        {
          label: 'Desactivar',
          icon: <Trash2 className="h-4 w-4 text-red-500" />,
          onClick: setToDeactivate,
          variant: 'danger',
          if: (s) => s.isActive && can('subject:delete'),
        },
        {
          label: 'Activar',
          icon: <RotateCcw className="h-4 w-4 text-green-600" />,
          onClick: reactivate,
          if: (s) => !s.isActive && can('subject:update'),
        },
      ];

  return (
    <Layout>
      <PageContainer
        title={readOnly ? 'Mis Asignaturas' : 'Asignaturas'}
        description={
          readOnly ? 'Asignaturas de sus programas académicos' : 'Gestionar asignaturas académicas'
        }
        action={
          !readOnly && can('subject:create') ? (
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Asignatura
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="pl-10"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                resetPage();
              }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={filterProgram}
              onChange={(e) => {
                setFilterProgram(e.target.value);
                resetPage();
              }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos los programas</option>
              {programs.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                </option>
              ))}
            </select>
            {canManage && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => {
                    setShowInactive(e.target.checked);
                    resetPage();
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Mostrar inactivas
              </label>
            )}
          </div>

          <DataTable
            columns={columns}
            data={subjects}
            isLoading={loading}
            emptyMessage="No se encontraron asignaturas"
            rowActions={rowActions}
            keyExtractor={(s) => s.id}
          />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </PageContainer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSubject ? 'Editar Asignatura' : 'Crear Asignatura'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Nombre</Label>
              <Input
                id="subject-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-code">Código</Label>
              <Input
                id="subject-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-program">Programa</Label>
            <select
              id="subject-program"
              value={formData.programId}
              onChange={(e) => handleProgramChange(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">Seleccione...</option>
              {editablePrograms.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                  {isPosgradoLevel(prog.level) ? ` (${getLevelLabel(prog.level)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {isPosgrado ? (
            <p className="text-xs text-gray-500">
              Las asignaturas de posgrado no pertenecen a departamentos.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="subject-dept">Departamento</Label>
              <select
                id="subject-dept"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className={selectClass}
                required
              >
                <option value="">Seleccione...</option>
                {editableDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="subject-credits">Créditos</Label>
              <Input
                id="subject-credits"
                type="number"
                min={1}
                max={30}
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-semester">Semestre</Label>
              <Input
                id="subject-semester"
                type="number"
                min={1}
                max={12}
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="subject-modality">Modalidad</Label>
              <select
                id="subject-modality"
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                className={selectClass}
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horas semanales</Label>
            <div className="grid gap-4 grid-cols-3">
              {(
                [
                  ['hoursPresencial', 'Presenciales'],
                  ['hoursDirigido', 'Trabajo dirigido'],
                  ['hoursIndependiente', 'Independientes'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <span className="text-xs text-gray-500">{label}</span>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    aria-label={`Horas ${label.toLowerCase()}`}
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-prereq">Prerrequisitos</Label>
            <Input
              id="subject-prereq"
              placeholder="Ninguno"
              maxLength={300}
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveSubject.isPending}>
              {editingSubject ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!assignSubject}
        onClose={() => setAssignSubject(null)}
        title="Asignar Profesor"
        size="sm"
      >
        {assignSubject && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {assignSubject.code} — {assignSubject.name}
            </p>
            <div className="space-y-2">
              <Label htmlFor="assign-professor">Profesor</Label>
              <AssignProfessorSelect
                subject={assignSubject}
                value={assignProfessorId}
                onChange={setAssignProfessorId}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignSubject(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAssign} disabled={assignProfessor.isPending}>
                Asignar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar asignatura"
        message={`¿Desactivar «${toDeactivate?.name ?? ''}»? Dejará de estar disponible, pero su historial se conserva.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

interface AssignProfessorSelectProps {
  subject: Subject;
  value: string;
  onChange: (value: string) => void;
}

/** Solo profesores activos afiliados al programa o al departamento de la asignatura (UC9). */
function AssignProfessorSelect({ subject, value, onChange }: AssignProfessorSelectProps) {
  const { data: usersData, isLoading } = useUsers({
    role: Role.PROFESOR,
    isActive: true,
    limit: 100,
  });
  const professors = (usersData?.data ?? []).filter(
    (p) =>
      p.programs.some((prog) => prog.id === subject.program.id) ||
      (!!subject.department && p.departments.some((d) => d.id === subject.department?.id)),
  );

  return (
    <>
      <select
        id="assign-professor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Sin profesor asignado</option>
        {professors.map((prof) => (
          <option key={prof.id} value={prof.id}>
            {prof.name}
          </option>
        ))}
      </select>
      {!isLoading && professors.length === 0 && (
        <p className="text-xs text-gray-500">
          No hay profesores afiliados a este programa o departamento. Registro Académico puede
          afiliarlos en Usuarios.
        </p>
      )}
    </>
  );
}

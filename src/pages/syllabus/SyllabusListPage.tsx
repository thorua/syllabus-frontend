import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { ConfirmDialog } from '../../components/ui/modal';
import { SyllabusStatusBadge } from '../../components/ui/status-badge';
import { PageContainer, DataTable } from '../../components/composites';
import type { Column, RowAction } from '../../components/composites/DataTable';
import {
  useAuth,
  useDebounce,
  useSyllabusList,
  useSyllabusPeriods,
  useDeactivateSyllabus,
  useDepartments,
  usePrograms,
  useSubjects,
} from '../../hooks';
import { getErrorMessage } from '../../api/client';
import { getDescriptiveTitle, getOfferedBy, getCreatorName } from '../../lib/utils';
import { syllabusAccess } from '../../lib/syllabusAccess';
import { conventionOf } from '../../lib/verification';
import { ConventionBadge, ConventionsLegend } from '../../components/syllabus/Conventions';
import { Plus, Search, Eye, Edit, Trash2, History as HistoryIcon, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SyllabusStatus, SyllabusStatusLabels } from '../../types';
import type { Syllabus, SyllabusFilters } from '../../types';

const emptyFilters = {
  search: '',
  departmentId: '',
  programId: '',
  subjectId: '',
  academicPeriod: '',
  status: '',
};

/** UC10: syllabus del alcance del usuario; el estudiante solo ve los vigentes. */
export function SyllabusListPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [toDeactivate, setToDeactivate] = useState<Syllabus | null>(null);
  const search = useDebounce(filters.search, 300);

  const queryFilters: SyllabusFilters = {
    page,
    limit: 10,
    ...(search && { search }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.programId && { programId: filters.programId }),
    ...(filters.subjectId && { subjectId: filters.subjectId }),
    ...(filters.academicPeriod && { academicPeriod: filters.academicPeriod }),
    ...(filters.status && { status: filters.status as SyllabusStatus }),
  };

  const { data: syllabusData, isLoading } = useSyllabusList(queryFilters);

  const syllabus = syllabusData?.data ?? [];
  const totalPages = syllabusData?.pagination?.totalPages ?? 1;

  const { data: departments = [] } = useDepartments();
  const { data: programs = [] } = usePrograms(filters.departmentId || undefined);
  const { data: subjects = [] } = useSubjects(
    filters.programId ? { programId: filters.programId } : {},
  );
  const { data: periods = [] } = useSyllabusPeriods();

  const deactivateMutation = useDeactivateSyllabus();

  const handleFilterChange = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'departmentId') {
        next.programId = '';
        next.subjectId = '';
      }
      if (key === 'programId') {
        next.subjectId = '';
      }
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(toDeactivate.id);
      toast.success('Syllabus desactivado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al desactivar'));
    } finally {
      setToDeactivate(null);
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const columns: Column<Syllabus>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{s.title}</p>
          <p className="text-sm text-uam-gray-dark truncate">{getDescriptiveTitle(s)}</p>
          <p className="text-xs text-uam-gray-mid mt-0.5">
            {getOfferedBy(s)} · Creado por {getCreatorName(s)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-32',
      render: (s) => <SyllabusStatusBadge status={s.status} />,
    },
    {
      key: 'verification',
      header: 'Verificación',
      className: 'w-40',
      render: (s) => <ConventionBadge state={conventionOf(s)} />,
    },
  ];

  const rowActions: RowAction<Syllabus>[] = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (s) => navigate(`/syllabus/${s.id}`),
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (s) => navigate(`/syllabus/${s.id}/edit`),
      if: (s) => syllabusAccess(s, can).edit,
    },
    {
      label: 'Versiones',
      icon: <HistoryIcon className="h-4 w-4" />,
      onClick: (s) => navigate(`/syllabus/${s.id}/versions`),
      if: (s) => syllabusAccess(s, can).versions,
    },
    {
      label: 'Desactivar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: setToDeactivate,
      variant: 'danger',
      if: (s) => syllabusAccess(s, can).deactivate,
    },
  ];

  return (
    <Layout>
      <PageContainer
        title="Syllabus"
        description="Gestión de syllabus académicos"
        action={
          can('syllabus:create') ? (
            <Link to="/syllabus/new">
              <Button className="bg-uam-blue hover:bg-uam-blue-dark shadow-uam">
                <Plus className="mr-2 h-4 w-4" />
                Crear Syllabus
              </Button>
            </Link>
          ) : undefined
        }
      >
        {/* Filtros */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-uam-gray-mid" />
                <Input
                  placeholder="Buscar por título, código o nombre de asignatura..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-10 border-uam-gray-mid/30 focus:border-uam-blue"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 border-uam-gray-mid/30 ${showFilters ? 'bg-uam-blue/5 border-uam-blue/30 text-uam-blue' : ''}`}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-uam-yellow text-uam-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-uam-gray-dark"
                >
                  <X className="mr-1 h-3 w-3" /> Limpiar
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid gap-3 mt-4 pt-4 border-t border-uam-gray-mid/20 md:grid-cols-2 lg:grid-cols-5">
                <Select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  options={[
                    { value: '', label: 'Todos los departamentos' },
                    ...departments.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                />
                <Select
                  value={filters.programId}
                  onChange={(e) => handleFilterChange('programId', e.target.value)}
                  options={[
                    { value: '', label: 'Todos los programas' },
                    ...programs.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
                <Select
                  value={filters.subjectId}
                  onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                  disabled={!filters.programId}
                  options={[
                    { value: '', label: 'Todas las asignaturas' },
                    ...subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` })),
                  ]}
                />
                <Select
                  value={filters.academicPeriod}
                  onChange={(e) => handleFilterChange('academicPeriod', e.target.value)}
                  options={[
                    { value: '', label: 'Todos los periodos' },
                    ...periods.map((p) => ({ value: p, label: p })),
                  ]}
                />
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...Object.values(SyllabusStatus).map((status) => ({
                      value: status,
                      label: SyllabusStatusLabels[status],
                    })),
                  ]}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 space-y-4">
            <ConventionsLegend
              states={['VERIFICADO', 'PENDIENTE_REGISTRO', 'PENDIENTE_FIRMA', 'BORRADOR']}
            />
            <DataTable
              columns={columns}
              data={syllabus}
              isLoading={isLoading}
              emptyMessage="No se encontraron syllabus"
              keyExtractor={(s) => s.id}
              rowActions={rowActions}
            />

            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-uam-gray-mid/20">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      <ConfirmDialog
        isOpen={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar syllabus"
        message={`¿Desactivar «${toDeactivate?.title ?? ''}»? Dejará de estar vigente, pero su historial de versiones se conserva.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

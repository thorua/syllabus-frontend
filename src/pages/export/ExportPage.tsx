import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Download, CheckSquare, Square, FileText, Filter, FilePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import { SyllabusStatus } from '../../types';
import type { Syllabus } from '../../types';
import {
  useAuth,
  useSyllabusList,
  useSyllabusPeriods,
  useDepartments,
  usePrograms,
  useExportSyllabus,
  useExportBatch,
  useExportTemplate,
} from '../../hooks';
import { getDescriptiveTitle } from '../../lib/utils';

const selectClass =
  'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-uam-blue focus:ring-uam-blue/20';

/** UC15 exportar individual, UC16 por lote (ZIP) y UC17 formato Almera; solo syllabus vigentes. */
export function ExportPage() {
  const { can } = useAuth();
  const canBatch = can('export:batch');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({ departmentId: '', programId: '', academicPeriod: '' });

  const { data: departments = [] } = useDepartments();
  const { data: programs = [] } = usePrograms(filters.departmentId || undefined);
  const { data: periods = [] } = useSyllabusPeriods();

  const { data: syllabusData, isLoading } = useSyllabusList({
    limit: 100,
    status: SyllabusStatus.ACTIVO,
    departmentId: filters.departmentId || undefined,
    programId: filters.programId || undefined,
    academicPeriod: filters.academicPeriod || undefined,
  });

  const exportSyllabus = useExportSyllabus();
  const exportBatch = useExportBatch();
  const exportTemplate = useExportTemplate();

  const syllabus = syllabusData?.data ?? [];
  const total = syllabusData?.pagination.total ?? 0;

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'departmentId' ? { programId: '' } : {}),
    }));
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const allSelected = syllabus.length > 0 && selectedIds.length === syllabus.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : syllabus.map((s) => s.id));

  const run = async (action: () => Promise<void>, success: string, failure: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(getErrorMessage(error, failure));
    }
  };

  const exportIndividual = (s: Syllabus) =>
    run(
      () => exportSyllabus.mutateAsync(s.id),
      'Syllabus exportado correctamente',
      'Error al exportar syllabus',
    );

  // Con selección se exportan los elegidos; sin ella, todos los vigentes que cumplen los filtros.
  const exportSelectedOrFiltered = () =>
    run(
      async () => {
        await exportBatch.mutateAsync(
          selectedIds.length > 0
            ? { syllabusIds: selectedIds }
            : {
                departmentId: filters.departmentId || undefined,
                programId: filters.programId || undefined,
                academicPeriod: filters.academicPeriod || undefined,
              },
        );
        setSelectedIds([]);
      },
      `${selectedIds.length || total} syllabus exportados en un archivo ZIP`,
      'Error al exportar syllabus',
    );

  const exportBlankTemplate = () =>
    run(
      () => exportTemplate.mutateAsync(),
      'Plantilla en blanco exportada correctamente',
      'Error al exportar plantilla',
    );

  const columns: Column<Syllabus>[] = [
    ...(canBatch
      ? [
          {
            key: 'select',
            header: '',
            className: 'w-10',
            render: (s: Syllabus) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(s.id);
                }}
                className="text-gray-400 hover:text-uam-blue transition-colors"
                aria-label={`Seleccionar ${s.title}`}
              >
                {selectedIds.includes(s.id) ? (
                  <CheckSquare className="h-5 w-5 text-uam-blue" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
            ),
          },
        ]
      : []),
    {
      key: 'title',
      header: 'Título',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 rounded-lg p-2">
            <FileText className="h-5 w-5 text-uam-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{s.title}</h3>
            <p className="text-sm text-gray-500">{getDescriptiveTitle(s)}</p>
          </div>
        </div>
      ),
    },
  ];

  const rowActions: RowAction<Syllabus>[] = [
    {
      label: 'Exportar',
      icon: (
        <span className="inline-flex items-center gap-1 rounded border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-uam-blue hover:text-white hover:border-uam-blue transition-colors">
          <Download className="h-3.5 w-3.5" />
          Exportar
        </span>
      ),
      onClick: exportIndividual,
    },
  ];

  return (
    <Layout>
      <PageContainer
        title="Exportar"
        description="Exportar syllabus a documentos PDF con el formato institucional Almera"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={exportBlankTemplate}
              variant="outline"
              className="border-gray-200"
              disabled={exportTemplate.isPending}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Plantilla en Blanco
            </Button>
            {canBatch && (
              <Button
                onClick={exportSelectedOrFiltered}
                disabled={total === 0 || exportBatch.isPending}
                className="bg-uam-blue hover:bg-uam-blue-dark shadow-uam"
              >
                <Download className="mr-2 h-4 w-4" />
                {exportBatch.isPending
                  ? 'Generando ZIP...'
                  : selectedIds.length > 0
                    ? `Exportar Seleccionados (${selectedIds.length})`
                    : `Exportar Filtrados (${total})`}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-uam-blue" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  className={selectClass}
                  aria-label="Departamento"
                >
                  <option value="">Todos los departamentos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.programId}
                  onChange={(e) => handleFilterChange('programId', e.target.value)}
                  className={selectClass}
                  aria-label="Programa"
                >
                  <option value="">Todos los programas</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.academicPeriod}
                  onChange={(e) => handleFilterChange('academicPeriod', e.target.value)}
                  className={selectClass}
                  aria-label="Periodo académico"
                >
                  <option value="">Todos los periodos</option>
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Syllabus Vigentes
                  <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>
                </CardTitle>
                {canBatch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="border-gray-200"
                    disabled={syllabus.length === 0}
                  >
                    {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={syllabus}
                isLoading={isLoading}
                emptyMessage="No se encontraron syllabus vigentes con los filtros seleccionados"
                emptyIcon={<FileText className="h-12 w-12 text-gray-300 mx-auto" />}
                rowActions={rowActions}
                keyExtractor={(s) => s.id}
              />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </Layout>
  );
}

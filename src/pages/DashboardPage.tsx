import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Pagination } from '../components/ui/pagination';
import { SyllabusStatusBadge } from '../components/ui/status-badge';
import { PageContainer, DataTable } from '../components/composites';
import type { Column, RowAction } from '../components/composites/DataTable';
import {
  useAuth,
  useSyllabusList,
  useDepartments,
  usePrograms,
  useUsers,
  useSubjects,
} from '../hooks';
import { getRoleLabel, getDescriptiveTitle, getDepartmentName, getProgramName } from '../lib/utils';
import {
  FileText,
  Users,
  Building2,
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Download,
  ArrowRight,
} from 'lucide-react';
import type { SyllabusFilters, Syllabus } from '../types';

export function DashboardPage() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    programId: '',
    academicPeriod: '',
    status: '',
  });
  const [page, setPage] = useState(1);

  const { data: statsSyllabus } = useSyllabusList({ limit: 1 });
  const canReadUsers = can('user:read');
  const { data: statsUsers } = useUsers({ limit: 1 }, canReadUsers);
  const { data: statsDepartments } = useDepartments();
  const { data: statsSubjects } = useSubjects();

  const stats = {
    syllabus: statsSyllabus?.pagination?.total || 0,
    users: statsUsers?.pagination?.total || 0,
    departments: statsDepartments?.length || 0,
    subjects: (Array.isArray(statsSubjects) ? statsSubjects : [])?.length || 0,
  };

  const loading =
    !statsSyllabus || (canReadUsers && !statsUsers) || !statsDepartments || !statsSubjects;

  const queryFilters: SyllabusFilters = {
    page,
    limit: 6,
    ...(filters.search && { search: filters.search }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.programId && { programId: filters.programId }),
    ...(filters.academicPeriod && { academicPeriod: filters.academicPeriod }),
    ...(filters.status && { status: filters.status as SyllabusFilters['status'] }),
  };

  const { data: syllabusData, isLoading: syllabusLoading } = useSyllabusList(queryFilters);

  const syllabus = syllabusData?.data ?? [];
  const totalPages = syllabusData?.pagination?.totalPages ?? 1;

  const { data: departments = [] } = useDepartments();
  const { data: programs = [] } = usePrograms(filters.departmentId || undefined);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'departmentId' ? { programId: '' } : {}),
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', departmentId: '', programId: '', academicPeriod: '', status: '' });
    setPage(1);
  };

  const statCards = [
    {
      title: 'Syllabus',
      value: stats.syllabus,
      icon: <FileText className="h-6 w-6" />,
      href: '/syllabus',
      color: 'bg-uam-blue',
      lightColor: 'bg-blue-50',
    },
    {
      title: 'Usuarios',
      value: stats.users,
      icon: <Users className="h-6 w-6" />,
      href: '/users',
      color: 'bg-uam-purple',
      lightColor: 'bg-purple-50',
    },
    {
      title: 'Departamentos',
      value: stats.departments,
      icon: <Building2 className="h-6 w-6" />,
      href: '/departments',
      color: 'bg-uam-orange',
      lightColor: 'bg-orange-50',
    },
    {
      title: 'Asignaturas',
      value: stats.subjects,
      icon: <BookOpen className="h-6 w-6" />,
      href: '/subjects',
      color: 'bg-uam-green',
      lightColor: 'bg-green-50',
    },
  ];

  const syllabusColumns: Column<Syllabus>[] = [
    {
      key: 'title',
      header: 'Syllabus',
      render: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{s.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{getDescriptiveTitle(s)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {getDepartmentName(s)} / {getProgramName(s)}
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
  ];

  const syllabusRowActions: RowAction<Syllabus>[] = [
    {
      label: 'Ver',
      icon: <Eye className="h-4 w-4" />,
      onClick: (s) => {
        navigate(`/syllabus/${s.id}`);
      },
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (s) => {
        navigate(`/syllabus/${s.id}/edit`);
      },
      if: () => can('syllabus:update'),
    },
  ];

  return (
    <Layout>
      <PageContainer
        title="Dashboard"
        description={
          <>
            Bienvenido, <span className="font-semibold text-uam-blue">{user?.name}</span> —{' '}
            {getRoleLabel(user?.role || '')}
          </>
        }
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
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link key={card.title} to={card.href}>
              <Card className="hover:shadow-uam-md transition-all duration-200 cursor-pointer border-0 shadow-sm group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {loading ? '...' : card.value}
                      </p>
                    </div>
                    <div
                      className={`${card.lightColor} rounded-xl p-3 ${card.color} text-white shadow-sm`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500 group-hover:text-uam-blue transition-colors">
                    <span>Ver detalle</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Filtros de Syllabus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-10 border-gray-200"
                />
              </div>

              <Select
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                options={[
                  { value: '', label: 'Todos los departamentos' },
                  ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
                ]}
              />

              <Select
                value={filters.programId}
                onChange={(e) => handleFilterChange('programId', e.target.value)}
                disabled={!filters.departmentId}
                options={[
                  { value: '', label: 'Todos los programas' },
                  ...programs.map((prog) => ({ value: prog.id, label: prog.name })),
                ]}
              />

              <Input
                placeholder="Periodo (ej: 2026-03)"
                value={filters.academicPeriod}
                onChange={(e) => handleFilterChange('academicPeriod', e.target.value)}
                className="h-10 border-gray-200"
              />

              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'ACTIVO', label: 'Activo' },
                  { value: 'BORRADOR', label: 'Borrador' },
                  { value: 'INACTIVO', label: 'Inactivo' },
                ]}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 border-gray-200"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Últimos Syllabus
              </CardTitle>
              <Link
                to="/syllabus"
                className="text-sm font-medium text-uam-blue hover:text-uam-blue-dark transition-colors flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={syllabusColumns}
              data={syllabus}
              isLoading={syllabusLoading}
              emptyMessage="No se encontraron syllabus"
              keyExtractor={(s) => s.id}
              rowActions={syllabusRowActions}
            />

            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/syllabus"
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
              >
                <div className="bg-blue-50 rounded-lg p-2.5 group-hover:bg-uam-blue group-hover:text-white text-uam-blue transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-uam-blue transition-colors">
                    Gestionar Syllabus
                  </p>
                  <p className="text-xs text-gray-500">Crear, editar y consultar</p>
                </div>
              </Link>
              <Link
                to="/export"
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-amber-50 hover:border-amber-200 transition-all duration-200 group"
              >
                <div className="bg-amber-50 rounded-lg p-2.5 group-hover:bg-uam-yellow group-hover:text-white text-uam-amber transition-colors">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-uam-amber transition-colors">
                    Exportar Documentos
                  </p>
                  <p className="text-xs text-gray-500">Generar archivos PDF</p>
                </div>
              </Link>
              {can('user:read') && (
                <Link
                  to="/users"
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 group"
                >
                  <div className="bg-purple-50 rounded-lg p-2.5 group-hover:bg-uam-purple group-hover:text-white text-uam-purple transition-colors">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-uam-purple transition-colors">
                      Gestionar Usuarios
                    </p>
                    <p className="text-xs text-gray-500">Administrar usuarios del sistema</p>
                  </div>
                </Link>
              )}
              {can('config:update') && (
                <Link
                  to="/settings"
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 group"
                >
                  <div className="bg-orange-50 rounded-lg p-2.5 group-hover:bg-uam-orange group-hover:text-white text-uam-orange transition-colors">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-uam-orange transition-colors">
                      Configuración
                    </p>
                    <p className="text-xs text-gray-500">Ajustes institucionales</p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </Layout>
  );
}

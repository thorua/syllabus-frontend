import { useState } from 'react';
import { Eye, FileCheck } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Pagination } from '../../components/ui/pagination';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { cn, formatDateTime } from '../../lib/utils';
import { useAuditLogs, useAuditOptions, useUsers } from '../../hooks';
import type { AuditLog } from '../../types';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Desactivación',
  LOGIN: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento fallido',
  LOGOUT: 'Cierre de sesión',
  PASSWORD_CHANGE: 'Cambio de contraseña',
  PASSWORD_RESET_REQUEST: 'Solicitud de recuperación',
  PASSWORD_RESET: 'Contraseña restablecida',
  PERMISSIONS_UPDATE: 'Permisos actualizados',
  AFFILIATIONS_UPDATE: 'Afiliaciones actualizadas',
  ASSIGN: 'Asignación',
  EXPORT: 'Exportación',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  PERMISSIONS_UPDATE: 'bg-amber-100 text-amber-800',
  AFFILIATIONS_UPDATE: 'bg-purple-100 text-purple-800',
};

const ENTITY_LABELS: Record<string, string> = {
  session: 'Sesión',
  user: 'Usuario',
  department: 'Departamento',
  program: 'Programa',
  subject: 'Asignatura',
  syllabus: 'Syllabus',
  config: 'Configuración',
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;
const entityLabel = (entity: string) => ENTITY_LABELS[entity] ?? entity;

/** Resumen legible del registro afectado. */
function summary(log: AuditLog): string {
  if (log.entityId && log.entityId === log.userId && log.user) return log.user.email;
  const d = log.details ?? {};
  const value = d.email ?? d.name ?? d.code ?? d.title;
  return typeof value === 'string' ? value : (log.entityId ?? '—');
}

const emptyFilters = { userId: '', entity: '', action: '', dateFrom: '', dateTo: '' };

export function AuditPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 15,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });
  const { data: options } = useAuditOptions();
  const { data: usersData } = useUsers({ limit: 100 });

  const logs = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleFilterChange = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Fecha',
      className: 'whitespace-nowrap',
      render: (log) => (
        <span className="text-gray-500 text-xs">{formatDateTime(log.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      header: 'Usuario',
      render: (log) =>
        log.user ? (
          <div>
            <p className="font-medium text-gray-900">{log.user.name}</p>
            <p className="text-xs text-gray-500">{log.user.email}</p>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">No identificado</span>
        ),
    },
    {
      key: 'action',
      header: 'Acción',
      render: (log) => (
        <Badge
          className={cn(
            'border whitespace-nowrap',
            ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-800',
          )}
        >
          {actionLabel(log.action)}
        </Badge>
      ),
    },
    { key: 'entity', header: 'Entidad', render: (log) => entityLabel(log.entity) },
    {
      key: 'summary',
      header: 'Registro',
      render: (log) => (
        <span className="block max-w-[14rem] truncate text-gray-600 text-xs" title={summary(log)}>
          {summary(log)}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<AuditLog>[] = [
    { label: 'Ver detalle', icon: <Eye className="h-4 w-4" />, onClick: setSelected },
  ];

  return (
    <Layout>
      <PageContainer
        title="Auditoría"
        description="Registro de cambios del sistema: quién, qué y cuándo"
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Select
                aria-label="Usuario"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                options={[
                  { value: '', label: 'Todos los usuarios' },
                  ...(usersData?.data ?? []).map((u) => ({ value: u.id, label: u.name })),
                ]}
              />
              <Select
                aria-label="Entidad"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
                options={[
                  { value: '', label: 'Todas las entidades' },
                  ...(options?.entities ?? []).map((e) => ({ value: e, label: entityLabel(e) })),
                ]}
              />
              <Select
                aria-label="Acción"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                options={[
                  { value: '', label: 'Todas las acciones' },
                  ...(options?.actions ?? []).map((a) => ({ value: a, label: actionLabel(a) })),
                ]}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="dateFrom" className="text-xs text-gray-500 shrink-0">
                  Desde
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="h-10 border-gray-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dateTo" className="text-xs text-gray-500 shrink-0">
                  Hasta
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="h-10 border-gray-200"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(emptyFilters);
                  setPage(1);
                }}
                className="text-gray-600 border-gray-200"
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Eventos{data ? ` (${data.pagination.total})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={logs}
              isLoading={isLoading}
              emptyMessage="No hay eventos para los filtros seleccionados"
              emptyIcon={<FileCheck className="w-12 h-12" />}
              keyExtractor={(log) => log.id}
              rowActions={rowActions}
              onRowClick={setSelected}
            />
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle del evento"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
              <dt className="text-gray-500">Fecha</dt>
              <dd>{formatDateTime(selected.createdAt)}</dd>
              <dt className="text-gray-500">Usuario</dt>
              <dd>
                {selected.user
                  ? `${selected.user.name} (${selected.user.email})`
                  : 'No identificado'}
              </dd>
              <dt className="text-gray-500">Acción</dt>
              <dd>{actionLabel(selected.action)}</dd>
              <dt className="text-gray-500">Entidad</dt>
              <dd>
                {entityLabel(selected.entity)}
                {selected.entityId && (
                  <span className="ml-2 text-xs text-gray-400">{selected.entityId}</span>
                )}
              </dd>
              <dt className="text-gray-500">IP</dt>
              <dd>{selected.ipAddress ?? '—'}</dd>
            </dl>
            {selected.details && (
              <div>
                <p className="mb-1 text-gray-500">Detalles</p>
                <pre className="max-h-72 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                  {JSON.stringify(selected.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

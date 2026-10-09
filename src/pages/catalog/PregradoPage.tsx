import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Modal, ConfirmDialog } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { ActiveBadge } from '../../components/ui/status-badge';
import { Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { getLevelBadgeClass, getLevelLabel } from '../../lib/programLevel';
import { getErrorMessage } from '../../api/client';
import type { Department, Program } from '../../types';
import {
  useAuth,
  useDepartments,
  usePrograms,
  useSaveDepartment,
  useDeactivateDepartment,
  useSaveProgram,
  useDeactivateProgram,
} from '../../hooks';

type PendingDeactivation =
  { kind: 'department'; item: Department } | { kind: 'program'; item: Program };

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

/** UC5 departamentos y UC6 programas de pregrado (siempre pertenecen a un departamento). */
export function PregradoPage() {
  const { can } = useAuth();
  const [filterDept, setFilterDept] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', code: '' });
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState({ name: '', code: '', departmentId: '' });
  const [pending, setPending] = useState<PendingDeactivation | null>(null);

  const { data: departments = [] } = useDepartments(showInactive);
  const { data: allPrograms = [], isLoading: loading } = usePrograms(
    filterDept || undefined,
    showInactive,
  );
  const programs = allPrograms.filter((p) => p.level === 'PREGRADO');
  const activeDepartments = departments.filter((d) => d.isActive);

  const saveDepartment = useSaveDepartment();
  const deactivateDepartment = useDeactivateDepartment();
  const saveProgram = useSaveProgram();
  const deactivateProgram = useDeactivateProgram();

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptFormData({ name: '', code: '' });
    setShowDeptModal(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptFormData({ name: dept.name, code: dept.code });
    setShowDeptModal(true);
  };

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramFormData({ name: '', code: '', departmentId: filterDept });
    setShowProgramModal(true);
  };

  const openEditProgram = (prog: Program) => {
    setEditingProgram(prog);
    setProgramFormData({
      name: prog.name,
      code: prog.code,
      departmentId: prog.department?.id ?? '',
    });
    setShowProgramModal(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveDepartment.mutateAsync({ id: editingDept?.id, input: deptFormData });
      toast.success(editingDept ? 'Departamento actualizado' : 'Departamento creado');
      setShowDeptModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar el departamento'));
    }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProgram.mutateAsync({
        id: editingProgram?.id,
        input: { ...programFormData, level: 'PREGRADO' },
      });
      toast.success(editingProgram ? 'Programa actualizado' : 'Programa creado');
      setShowProgramModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar el programa'));
    }
  };

  const handleDeactivate = async () => {
    if (!pending) return;
    try {
      if (pending.kind === 'department') await deactivateDepartment.mutateAsync(pending.item.id);
      else await deactivateProgram.mutateAsync(pending.item.id);
      toast.success(
        pending.kind === 'department' ? 'Departamento desactivado' : 'Programa desactivado',
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo desactivar'));
    } finally {
      setPending(null);
    }
  };

  const reactivateDept = async (dept: Department) => {
    try {
      await saveDepartment.mutateAsync({
        id: dept.id,
        input: { name: dept.name, code: dept.code, isActive: true },
      });
      toast.success('Departamento activado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo activar'));
    }
  };

  const reactivateProgram = async (prog: Program) => {
    try {
      await saveProgram.mutateAsync({
        id: prog.id,
        input: {
          name: prog.name,
          code: prog.code,
          level: 'PREGRADO',
          departmentId: prog.department?.id,
          isActive: true,
        },
      });
      toast.success('Programa activado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo activar'));
    }
  };

  const columns: Column<Program>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (prog) => <span className="font-mono text-xs">{prog.code}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (prog) => <span className="font-medium">{prog.name}</span>,
    },
    {
      key: 'department',
      header: 'Departamento',
      render: (prog) => <span className="text-gray-500">{prog.department?.name || '—'}</span>,
    },
    {
      key: 'level',
      header: 'Nivel',
      render: (prog) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getLevelBadgeClass(prog.level)}`}
        >
          {getLevelLabel(prog.level)}
        </span>
      ),
    },
    {
      key: 'subjectCount',
      header: 'Asignaturas',
      render: (prog) => <Badge variant="outline">{prog.subjectCount ?? 0}</Badge>,
    },
    ...(showInactive
      ? [
          {
            key: 'isActive',
            header: 'Estado',
            render: (prog: Program) => <ActiveBadge isActive={prog.isActive} />,
          },
        ]
      : []),
  ];

  const rowActions: RowAction<Program>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: openEditProgram,
      if: () => can('program:update'),
    },
    {
      label: 'Desactivar',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (prog) => setPending({ kind: 'program', item: prog }),
      variant: 'danger',
      if: (prog) => prog.isActive && can('program:delete'),
    },
    {
      label: 'Activar',
      icon: <RotateCcw className="h-4 w-4 text-green-600" />,
      onClick: reactivateProgram,
      if: (prog) => !prog.isActive && can('program:update'),
    },
  ];

  return (
    <Layout>
      <PageContainer title="Pregrado" description="Departamentos y programas de pregrado">
        <div className="space-y-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Mostrar inactivos
          </label>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Departamentos</h3>
                {can('department:create') && (
                  <Button variant="outline" size="sm" onClick={openCreateDept}>
                    <Plus className="mr-2 h-4 w-4" /> Crear Departamento
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {departments.length === 0 && (
                  <p className="text-sm text-gray-500">No hay departamentos registrados.</p>
                )}
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={cn(
                      'border rounded-lg p-4 hover:shadow-md transition-shadow',
                      !dept.isActive && 'bg-gray-50 opacity-75',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{dept.name}</h3>
                        <p className="text-sm text-gray-500">Código: {dept.code}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span>{dept.programCount ?? 0} programas</span>
                          <span>|</span>
                          <span>{dept.subjectCount ?? 0} asignaturas</span>
                          {!dept.isActive && <ActiveBadge isActive={false} />}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {can('department:update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => openEditDept(dept)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {dept.isActive && can('department:delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Desactivar"
                            onClick={() => setPending({ kind: 'department', item: dept })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        {!dept.isActive && can('department:update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Activar"
                            onClick={() => reactivateDept(dept)}
                          >
                            <RotateCcw className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-gray-900">Programas de Pregrado</h3>
              {can('program:create') && (
                <Button onClick={openCreateProgram} disabled={activeDepartments.length === 0}>
                  <Plus className="mr-2 h-4 w-4" /> Crear Programa
                </Button>
              )}
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={selectClass}
            >
              <option value="">Todos los departamentos</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <DataTable
              columns={columns}
              data={programs}
              isLoading={loading}
              emptyMessage="No se encontraron programas"
              rowActions={rowActions}
              keyExtractor={(prog) => prog.id}
            />
          </div>
        </div>
      </PageContainer>

      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title={editingDept ? 'Editar Departamento' : 'Crear Departamento'}
        size="sm"
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Nombre</Label>
            <Input
              id="dept-name"
              value={deptFormData.name}
              onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-code">Código</Label>
            <Input
              id="dept-code"
              value={deptFormData.code}
              onChange={(e) =>
                setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })
              }
              maxLength={20}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowDeptModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveDepartment.isPending}>
              {editingDept ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        title={editingProgram ? 'Editar Programa de Pregrado' : 'Crear Programa de Pregrado'}
        size="md"
      >
        <form onSubmit={handleProgramSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prog-name">Nombre</Label>
            <Input
              id="prog-name"
              value={programFormData.name}
              onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prog-code">Código</Label>
            <Input
              id="prog-code"
              value={programFormData.code}
              onChange={(e) =>
                setProgramFormData({ ...programFormData, code: e.target.value.toUpperCase() })
              }
              maxLength={20}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prog-dept">Departamento (obligatorio en pregrado)</Label>
            <select
              id="prog-dept"
              value={programFormData.departmentId}
              onChange={(e) =>
                setProgramFormData({ ...programFormData, departmentId: e.target.value })
              }
              className={selectClass}
              required
            >
              <option value="">Seleccione...</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowProgramModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveProgram.isPending}>
              {editingProgram ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={handleDeactivate}
        title={pending?.kind === 'department' ? 'Desactivar departamento' : 'Desactivar programa'}
        message={`¿Desactivar «${pending?.item.name ?? ''}»? Dejará de estar disponible, pero su historial se conserva.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

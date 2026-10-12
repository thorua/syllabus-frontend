import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ConfirmDialog, Modal } from '../../components/ui/modal';
import { ActiveBadge } from '../../components/ui/status-badge';
import { getErrorMessage } from '../../api/client';
import { useAuth, useDeactivateFaculty, useFaculties, useSaveFaculty } from '../../hooks';
import type { Faculty } from '../../types';

/**
 * Facultades: primer nivel de la estructura académica (facultad → departamento → programa). Los
 * departamentos y los programas de posgrado pertenecen a una facultad.
 */
export function FacultiesPage() {
  const { can } = useAuth();
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [toDeactivate, setToDeactivate] = useState<Faculty | null>(null);
  const { data: faculties = [], isLoading } = useFaculties(showInactive);
  const save = useSaveFaculty();
  const deactivate = useDeactivateFaculty();

  const open = (faculty: Faculty | null) => {
    setEditing(faculty);
    setForm({ name: faculty?.name ?? '', code: faculty?.code ?? '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save.mutateAsync({ id: editing?.id, input: form });
      toast.success(editing ? 'Facultad actualizada' : 'Facultad creada');
      setShowModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar la facultad'));
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivate.mutateAsync(toDeactivate.id);
      toast.success('Facultad desactivada');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo desactivar'));
    } finally {
      setToDeactivate(null);
    }
  };

  const reactivate = async (faculty: Faculty) => {
    try {
      await save.mutateAsync({
        id: faculty.id,
        input: { name: faculty.name, code: faculty.code, isActive: true },
      });
      toast.success('Facultad activada');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo activar'));
    }
  };

  const columns: Column<Faculty>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (f) => <span className="font-mono text-xs">{f.code}</span>,
    },
    { key: 'name', header: 'Nombre', render: (f) => <span className="font-medium">{f.name}</span> },
    {
      key: 'departmentCount',
      header: 'Departamentos',
      render: (f) => <Badge variant="outline">{f.departmentCount ?? 0}</Badge>,
    },
    {
      key: 'programCount',
      header: 'Programas',
      render: (f) => <Badge variant="outline">{f.programCount ?? 0}</Badge>,
    },
    ...(showInactive
      ? [
          {
            key: 'isActive',
            header: 'Estado',
            render: (f: Faculty) => <ActiveBadge isActive={f.isActive} />,
          },
        ]
      : []),
  ];

  const rowActions: RowAction<Faculty>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: open,
      if: () => can('faculty:update'),
    },
    {
      label: 'Desactivar',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: setToDeactivate,
      variant: 'danger',
      if: (f) => f.isActive && can('faculty:delete'),
    },
    {
      label: 'Activar',
      icon: <RotateCcw className="h-4 w-4 text-green-600" />,
      onClick: reactivate,
      if: (f) => !f.isActive && can('faculty:update'),
    },
  ];

  return (
    <Layout>
      <PageContainer
        title="Facultades"
        description="Estructura académica: facultad → departamento → programa"
        action={
          can('faculty:create') ? (
            <Button onClick={() => open(null)}>
              <Plus className="mr-2 h-4 w-4" /> Crear Facultad
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Mostrar inactivas
          </label>
          <DataTable
            columns={columns}
            data={faculties}
            isLoading={isLoading}
            emptyMessage="No hay facultades registradas"
            rowActions={rowActions}
            keyExtractor={(f) => f.id}
          />
        </div>
      </PageContainer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Facultad' : 'Crear Facultad'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faculty-name">Nombre</Label>
            <Input
              id="faculty-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={150}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faculty-code">Código</Label>
            <Input
              id="faculty-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              maxLength={20}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar facultad"
        message={`¿Desactivar «${toDeactivate?.name ?? ''}»? Solo es posible si ya no tiene departamentos ni programas activos.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

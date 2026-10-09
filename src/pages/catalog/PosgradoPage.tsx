import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Modal, ConfirmDialog } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { ActiveBadge } from '../../components/ui/status-badge';
import { Plus, Edit, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/client';
import {
  getLevelBadgeClass,
  getLevelLabel,
  isPosgradoLevel,
  POSGRADO_LEVELS,
} from '../../lib/programLevel';
import type { Program, ProgramLevel } from '../../types';
import { useAuth, usePrograms, useSaveProgram, useDeactivateProgram } from '../../hooks';

/** UC6 programas de posgrado: especialización, maestría y doctorado, sin departamento. */
export function PosgradoPage() {
  const { can } = useAuth();
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [formData, setFormData] = useState<{ name: string; code: string; level: ProgramLevel }>({
    name: '',
    code: '',
    level: 'MAESTRIA',
  });
  const [toDeactivate, setToDeactivate] = useState<Program | null>(null);

  const { data: allPrograms = [], isLoading: loading } = usePrograms(undefined, showInactive);
  const saveProgram = useSaveProgram();
  const deactivateProgram = useDeactivateProgram();

  const programs = allPrograms.filter((p) => isPosgradoLevel(p.level));

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', code: '', level: 'MAESTRIA' });
    setShowModal(true);
  };

  const openEdit = (prog: Program) => {
    setEditing(prog);
    setFormData({ name: prog.name, code: prog.code, level: prog.level });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProgram.mutateAsync({ id: editing?.id, input: formData });
      toast.success(editing ? 'Programa actualizado' : 'Programa creado');
      setShowModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar el programa'));
    }
  };

  const handleDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivateProgram.mutateAsync(toDeactivate.id);
      toast.success('Programa desactivado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo desactivar'));
    } finally {
      setToDeactivate(null);
    }
  };

  const reactivate = async (prog: Program) => {
    try {
      await saveProgram.mutateAsync({
        id: prog.id,
        input: { name: prog.name, code: prog.code, level: prog.level, isActive: true },
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
      onClick: openEdit,
      if: () => can('program:update'),
    },
    {
      label: 'Desactivar',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: setToDeactivate,
      variant: 'danger',
      if: (prog) => prog.isActive && can('program:delete'),
    },
    {
      label: 'Activar',
      icon: <RotateCcw className="h-4 w-4 text-green-600" />,
      onClick: reactivate,
      if: (prog) => !prog.isActive && can('program:update'),
    },
  ];

  return (
    <Layout>
      <PageContainer
        title="Posgrado"
        description="Programas de especialización, maestría y doctorado. El posgrado no pertenece a departamentos."
        action={
          can('program:create') ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Crear Programa
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
            Mostrar inactivos
          </label>
          <DataTable
            columns={columns}
            data={programs}
            isLoading={loading}
            emptyMessage="No se encontraron programas de posgrado"
            rowActions={rowActions}
            keyExtractor={(prog) => prog.id}
          />
        </div>
      </PageContainer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Programa de Posgrado' : 'Crear Programa de Posgrado'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pos-name">Nombre</Label>
            <Input
              id="pos-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-code">Código</Label>
            <Input
              id="pos-code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              maxLength={20}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-level">Nivel</Label>
            <select
              id="pos-level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value as ProgramLevel })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {POSGRADO_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {getLevelLabel(level)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveProgram.isPending}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar programa"
        message={`¿Desactivar «${toDeactivate?.name ?? ''}»? Dejará de estar disponible, pero su historial se conserva.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

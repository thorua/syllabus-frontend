import React, { useMemo, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageContainer, DataTable, type Column, type RowAction } from '../../components/composites';
import { Pagination } from '../../components/ui/pagination';
import { Modal, ConfirmDialog } from '../../components/ui/modal';
import { RoleBadge, ActiveBadge } from '../../components/ui/status-badge';
import { Badge } from '../../components/ui/badge';
import { cn, formatDate } from '../../lib/utils';
import { getLevelLabel, isPosgradoLevel } from '../../lib/programLevel';
import { getErrorMessage } from '../../api/client';
import { Plus, Search, Edit, Trash2, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ALL_ROLES, Role, RoleLabels, type PermissionOverride, type User } from '../../types';
import {
  useAuth,
  useDebounce,
  useDeactivateUser,
  useDepartments,
  usePermissionCatalog,
  usePrograms,
  useSaveUser,
  useUsers,
} from '../../hooks';

interface OverrideDraft {
  permission: string;
  allow: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  departmentIds: string[];
  programIds: string[];
  overrides: OverrideDraft[];
  phone: string;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  password: '',
  roles: [Role.PROFESOR],
  departmentIds: [],
  programIds: [],
  overrides: [],
  phone: '',
};

const selectClass = 'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm';

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

const toPermission = (o: PermissionOverride) => `${o.resource}:${o.action}`;

export function UsersListPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const debouncedSearch = useDebounce(search);

  const { data: usersData, isLoading } = useUsers({
    page,
    search: debouncedSearch || undefined,
    departmentId: filterDept || undefined,
    role: (filterRole as Role) || undefined,
    isActive: filterActive === '' ? undefined : filterActive === 'true',
    limit: 10,
  });

  const { data: departments = [] } = useDepartments();
  const { data: programs = [] } = usePrograms();
  const { data: catalog = {} } = usePermissionCatalog(can('user:permissions'));
  const saveUser = useSaveUser();
  const deactivateUser = useDeactivateUser();

  const users = usersData?.data ?? [];
  const totalPages = usersData?.pagination?.totalPages ?? 1;

  const programGroups = useMemo(
    () => [
      { label: 'Pregrado', items: programs.filter((p) => !isPosgradoLevel(p.level)) },
      { label: 'Posgrado', items: programs.filter((p) => isPosgradoLevel(p.level)) },
    ],
    [programs],
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles,
      departmentIds: user.departments.map((d) => d.id),
      programIds: user.programs.map((p) => p.id),
      overrides: user.permissionOverrides.map((o) => ({
        permission: toPermission(o),
        allow: o.allow,
      })),
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const setOverride = (index: number, patch: Partial<OverrideDraft>) => {
    setFormData((prev) => ({
      ...prev,
      overrides: prev.overrides.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  };

  const addOverride = () => {
    const used = formData.overrides.map((o) => o.permission);
    const next = Object.keys(catalog).find((p) => !used.includes(p));
    if (!next) return;
    setFormData((prev) => ({
      ...prev,
      overrides: [...prev.overrides, { permission: next, allow: true }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roles.length === 0) {
      toast.error('Seleccione al menos un rol');
      return;
    }

    const permissionOverrides: PermissionOverride[] = formData.overrides.map((o) => {
      const [resource, action] = o.permission.split(':');
      return { resource, action, allow: o.allow };
    });
    const overridesChanged =
      JSON.stringify(permissionOverrides.map((o) => [toPermission(o), o.allow]).sort()) !==
      JSON.stringify(
        (editingUser?.permissionOverrides ?? []).map((o) => [toPermission(o), o.allow]).sort(),
      );
    const affiliationsChanged =
      !sameSet(formData.departmentIds, editingUser?.departments.map((d) => d.id) ?? []) ||
      !sameSet(formData.programIds, editingUser?.programs.map((p) => p.id) ?? []);

    try {
      await saveUser.mutateAsync({
        id: editingUser?.id,
        input: {
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          roles: formData.roles,
          phone: formData.phone,
        },
        affiliations: affiliationsChanged
          ? { departmentIds: formData.departmentIds, programIds: formData.programIds }
          : undefined,
        permissionOverrides: overridesChanged ? permissionOverrides : undefined,
      });
      toast.success(
        editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
      );
      setShowModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar usuario'));
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await deactivateUser.mutateAsync(userToDeactivate.id);
      toast.success('Usuario desactivado correctamente');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al desactivar usuario'));
    } finally {
      setUserToDeactivate(null);
    }
  };

  const handleReactivate = async (user: User) => {
    try {
      await saveUser.mutateAsync({
        id: user.id,
        input: {
          name: user.name,
          email: user.email,
          roles: user.roles,
          phone: user.phone,
          isActive: true,
        },
      });
      toast.success('Usuario activado correctamente');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al activar usuario'));
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => <span className="text-gray-500">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1 [&>*]:whitespace-nowrap">
          {user.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Departamento',
      render: (user) => {
        const extraDepts = user.departments.length - 1;
        return (
          <div className="text-gray-500 text-xs">
            <span className="block">{user.departments[0]?.name || '—'}</span>
            {extraDepts > 0 && <span className="text-gray-400">+{extraDepts} más</span>}
            {user.programs.length > 0 && (
              <span className="block text-gray-400">
                {user.programs.length} programa{user.programs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'overrides',
      header: 'Permisos',
      render: (user) => {
        const overrideCount = user.permissionOverrides.length;
        return overrideCount > 0 ? (
          <Badge className="border bg-amber-50 text-amber-800">
            <Shield className="h-3 w-3 mr-1" />
            {overrideCount} ajuste{overrideCount > 1 ? 's' : ''}
          </Badge>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (user) => <ActiveBadge isActive={user.isActive} />,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      className: 'whitespace-nowrap',
      render: (user) => <span className="text-gray-500 text-xs">{formatDate(user.createdAt)}</span>,
    },
  ];

  const rowActions: RowAction<User>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: openEditModal,
      if: () => can('user:update'),
    },
    {
      label: 'Desactivar',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: setUserToDeactivate,
      variant: 'danger',
      if: (user) => user.isActive && can('user:delete'),
    },
    {
      label: 'Activar',
      icon: <RotateCcw className="h-4 w-4 text-green-600" />,
      onClick: handleReactivate,
      if: (user) => !user.isActive && can('user:update'),
    },
  ];

  const resetPage = () => setPage(1);

  return (
    <Layout>
      <PageContainer
        title="Gestión de Usuarios"
        description="Administrar usuarios del sistema"
        action={
          can('user:create') ? (
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
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
              className={selectClass}
            >
              <option value="">Todos los departamentos</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                resetPage();
              }}
              className={selectClass}
            >
              <option value="">Todos los roles</option>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {RoleLabels[role]}
                </option>
              ))}
            </select>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                resetPage();
              }}
              className={selectClass}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="No se encontraron usuarios"
            rowActions={rowActions}
            keyExtractor={(user: User) => user.id}
          />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </PageContainer>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </Label>
              <Input
                id="user-password"
                type="password"
                minLength={8}
                placeholder={editingUser ? 'Dejar vacío para no cambiarla' : 'Mínimo 8 caracteres'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roles (un usuario puede tener varios)</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, roles: toggle(prev.roles, role) }))
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    formData.roles.includes(role)
                      ? 'bg-uam-blue text-white border-uam-blue'
                      : 'border-gray-200 text-gray-600 hover:border-uam-blue hover:text-uam-blue',
                  )}
                >
                  {RoleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          {can('user:affiliations') && (
            <>
              <div className="space-y-2">
                <Label>Afiliaciones a departamentos</Label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          departmentIds: toggle(prev.departmentIds, dept.id),
                        }))
                      }
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        formData.departmentIds.includes(dept.id)
                          ? 'bg-uam-purple text-white border-uam-purple'
                          : 'border-gray-200 text-gray-600 hover:border-uam-purple hover:text-uam-purple',
                      )}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {programGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <Label>Afiliaciones a programas de {group.label.toLowerCase()}</Label>
                  <div className="flex flex-wrap gap-2">
                    {group.items.length === 0 && (
                      <span className="text-xs text-gray-400">Sin programas</span>
                    )}
                    {group.items.map((prog) => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            programIds: toggle(prev.programIds, prog.id),
                          }))
                        }
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          formData.programIds.includes(prog.id)
                            ? 'bg-uam-green text-white border-uam-green'
                            : 'border-gray-200 text-gray-600 hover:border-uam-green hover:text-uam-green',
                        )}
                      >
                        {prog.name}
                        {isPosgradoLevel(prog.level) && (
                          <span className="ml-1 opacity-70">({getLevelLabel(prog.level)})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {can('user:permissions') && (
            <div className="space-y-2">
              <Label className="block">
                Permisos individuales (otorgar o restringir acciones puntuales)
              </Label>
              {formData.overrides.map((override, index) => (
                <div
                  key={override.permission}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2"
                >
                  <select
                    value={override.permission}
                    onChange={(e) => setOverride(index, { permission: e.target.value })}
                    className={cn(selectClass, 'h-9 flex-1 min-w-[220px]')}
                  >
                    {Object.entries(catalog).map(([permission, description]) => (
                      <option
                        key={permission}
                        value={permission}
                        disabled={
                          permission !== override.permission &&
                          formData.overrides.some((o) => o.permission === permission)
                        }
                      >
                        {description}
                      </option>
                    ))}
                  </select>
                  <select
                    value={override.allow ? 'allow' : 'deny'}
                    onChange={(e) => setOverride(index, { allow: e.target.value === 'allow' })}
                    className={cn(
                      selectClass,
                      'h-9',
                      override.allow ? 'text-green-700' : 'text-red-700',
                    )}
                  >
                    <option value="allow">Otorgar</option>
                    <option value="deny">Restringir</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        overrides: prev.overrides.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addOverride}>
                <Shield className="mr-2 h-4 w-4" />
                Agregar permiso
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveUser.isPending}>
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Desactivar usuario"
        message={`¿Está seguro de desactivar a ${userToDeactivate?.name ?? ''}? No podrá iniciar sesión, pero su historial se conserva.`}
        confirmLabel="Desactivar"
      />
    </Layout>
  );
}

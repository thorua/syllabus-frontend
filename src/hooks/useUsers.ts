import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints';
import type { AffiliationsInput, PermissionOverride, UserFilters, UserInput } from '../types';

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  catalog: ['users', 'permission-catalog'] as const,
};

export function useUsers(filters: UserFilters = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.getAll(filters),
    enabled,
  });
}

export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: userKeys.catalog,
    queryFn: () => usersApi.permissionCatalog(),
    staleTime: Infinity,
    enabled,
  });
}

interface SaveUserVariables {
  id?: string;
  input: UserInput;
  /** Solo se envían si cambiaron (cada uno es un caso de uso con su propio permiso). */
  affiliations?: AffiliationsInput;
  permissionOverrides?: PermissionOverride[];
}

/** Guarda datos y roles (UC3) y, si cambiaron, afiliaciones (UC9) y permisos (UC4). */
export function useSaveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, affiliations, permissionOverrides }: SaveUserVariables) => {
      const user = id ? await usersApi.update(id, input) : await usersApi.create(input);
      if (affiliations) await usersApi.updateAffiliations(user.id, affiliations);
      if (permissionOverrides) await usersApi.updatePermissions(user.id, permissionOverrides);
      return user;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}

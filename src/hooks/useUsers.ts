import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints';
import type { UserFilters } from '../types';

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
};

export function useUsers(filters: UserFilters = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.getAll(filters),
    enabled,
  });
}

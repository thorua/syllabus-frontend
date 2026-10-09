import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/endpoints';
import type { AuditFilters } from '../types';

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters) => [...auditKeys.all, 'list', filters] as const,
  options: ['audit', 'options'] as const,
};

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditApi.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useAuditOptions() {
  return useQuery({
    queryKey: auditKeys.options,
    queryFn: () => auditApi.options(),
    staleTime: 0,
  });
}

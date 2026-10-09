import { useQuery } from '@tanstack/react-query';
import { departmentsApi, programsApi, subjectsApi } from '../api/endpoints';

export const departmentKeys = { all: ['departments'] as const };
export const programKeys = { all: ['programs'] as const };
export const subjectKeys = { all: ['subjects'] as const };

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: () => departmentsApi.getAll(),
  });
}

export function usePrograms(departmentId?: string) {
  return useQuery({
    queryKey: [...programKeys.all, departmentId ?? 'all'],
    queryFn: () => programsApi.getAll(departmentId),
  });
}

export function useSubjects(departmentId?: string, programId?: string) {
  return useQuery({
    queryKey: [...subjectKeys.all, departmentId ?? 'all', programId ?? 'all'],
    queryFn: () => subjectsApi.getAll(departmentId, programId),
  });
}

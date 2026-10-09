import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, programsApi, subjectsApi } from '../api/endpoints';
import type { DepartmentInput, ProgramInput, SubjectFilters, SubjectInput } from '../types';

export const departmentKeys = { all: ['departments'] as const };
export const programKeys = { all: ['programs'] as const };
export const subjectKeys = { all: ['subjects'] as const };

/** Los contadores de cada catálogo dependen de los otros: se refrescan juntos. */
const catalogKeys = [departmentKeys.all, programKeys.all, subjectKeys.all];

export function useDepartments(includeInactive = false) {
  return useQuery({
    queryKey: [...departmentKeys.all, includeInactive],
    queryFn: () => departmentsApi.getAll(includeInactive),
  });
}

export function usePrograms(departmentId?: string, includeInactive = false) {
  return useQuery({
    queryKey: [...programKeys.all, departmentId ?? 'all', includeInactive],
    queryFn: () => programsApi.getAll(departmentId, includeInactive),
  });
}

export function useSubjects(filters: SubjectFilters = {}) {
  return useQuery({
    queryKey: [...subjectKeys.all, filters],
    queryFn: () => subjectsApi.getAll(filters),
  });
}

interface SaveVariables<T> {
  id?: string;
  input: T;
}

function useCatalogMutation<V, R>(mutationFn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(catalogKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export const useSaveDepartment = () =>
  useCatalogMutation(({ id, input }: SaveVariables<DepartmentInput>) =>
    id ? departmentsApi.update(id, input) : departmentsApi.create(input),
  );

export const useDeactivateDepartment = () => useCatalogMutation(departmentsApi.deactivate);

export const useSaveProgram = () =>
  useCatalogMutation(({ id, input }: SaveVariables<ProgramInput>) =>
    id ? programsApi.update(id, input) : programsApi.create(input),
  );

export const useDeactivateProgram = () => useCatalogMutation(programsApi.deactivate);

export const useSaveSubject = () =>
  useCatalogMutation(({ id, input }: SaveVariables<SubjectInput>) =>
    id ? subjectsApi.update(id, input) : subjectsApi.create(input),
  );

export const useDeactivateSubject = () => useCatalogMutation(subjectsApi.deactivate);

export const useAssignProfessor = () =>
  useCatalogMutation(({ id, professorId }: { id: string; professorId: string | null }) =>
    subjectsApi.assignProfessor(id, professorId),
  );

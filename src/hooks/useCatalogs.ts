import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentsApi,
  facultiesApi,
  programsApi,
  studyPlansApi,
  subjectsApi,
} from '../api/endpoints';
import type {
  DepartmentInput,
  FormationArea,
  FacultyInput,
  ProgramInput,
  SubjectFilters,
  SubjectInput,
} from '../types';

export const facultyKeys = { all: ['faculties'] as const };
export const departmentKeys = { all: ['departments'] as const };
export const programKeys = { all: ['programs'] as const };
export const subjectKeys = { all: ['subjects'] as const };
export const studyPlanKeys = {
  all: ['study-plans'] as const,
  list: (programId: string) => [...studyPlanKeys.all, 'list', programId] as const,
  curriculum: (id: string, period: string) => [...studyPlanKeys.all, id, period] as const,
};

/** Los contadores de cada catálogo dependen de los otros: se refrescan juntos. */
const catalogKeys = [
  facultyKeys.all,
  departmentKeys.all,
  programKeys.all,
  subjectKeys.all,
  studyPlanKeys.all,
];

export function useFaculties(includeInactive = false) {
  return useQuery({
    queryKey: [...facultyKeys.all, includeInactive],
    queryFn: () => facultiesApi.getAll(includeInactive),
  });
}

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

export function useStudyPlans(programId?: string) {
  return useQuery({
    queryKey: studyPlanKeys.list(programId ?? ''),
    queryFn: () => studyPlansApi.getAll(programId!),
    enabled: !!programId,
  });
}

/** Malla del plan con el estado del syllabus de cada asignatura en el período. */
export function useCurriculum(planId?: string, academicPeriod?: string) {
  return useQuery({
    queryKey: studyPlanKeys.curriculum(planId ?? '', academicPeriod ?? ''),
    queryFn: () => studyPlansApi.curriculum(planId!, academicPeriod!),
    enabled: !!planId && !!academicPeriod,
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

export const useSaveFaculty = () =>
  useCatalogMutation(({ id, input }: SaveVariables<FacultyInput>) =>
    id ? facultiesApi.update(id, input) : facultiesApi.create(input),
  );

export const useDeactivateFaculty = () => useCatalogMutation(facultiesApi.deactivate);

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

export const useSaveStudyPlan = () =>
  useCatalogMutation(
    ({
      id,
      programId,
      name,
      isActive,
    }: {
      id?: string;
      programId: string;
      name: string;
      isActive?: boolean;
    }) =>
      id
        ? studyPlansApi.update(id, programId, name, isActive ?? true)
        : studyPlansApi.create(programId, name),
  );

interface PlanSubjectVariables {
  planId: string;
  subjectId: string;
  academicPeriod: string;
}

export const usePlaceSubject = () =>
  useCatalogMutation(
    ({
      planId,
      subjectId,
      semester,
      area,
      academicPeriod,
    }: PlanSubjectVariables & { semester: number; area: FormationArea }) =>
      studyPlansApi.placeSubject(planId, subjectId, semester, area, academicPeriod),
  );

export const useRemovePlanSubject = () =>
  useCatalogMutation(({ planId, subjectId, academicPeriod }: PlanSubjectVariables) =>
    studyPlansApi.removeSubject(planId, subjectId, academicPeriod),
  );

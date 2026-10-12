import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syllabusApi } from '../api/endpoints';
import { subjectKeys } from './useCatalogs';
import type { SyllabusCreateInput, SyllabusFilters, SyllabusUpdateInput } from '../types';

export const syllabusKeys = {
  all: ['syllabus'] as const,
  list: (filters: SyllabusFilters) => [...syllabusKeys.all, 'list', filters] as const,
  periods: () => [...syllabusKeys.all, 'periods'] as const,
  detail: (id: string) => [...syllabusKeys.all, 'detail', id] as const,
  versions: (id: string) => [...syllabusKeys.all, 'versions', id] as const,
  version: (id: string, versionId: string) => [...syllabusKeys.versions(id), versionId] as const,
};

export function useSyllabusList(filters: SyllabusFilters = {}) {
  return useQuery({
    queryKey: syllabusKeys.list(filters),
    queryFn: () => syllabusApi.getAll(filters),
  });
}

export function useSyllabusPeriods() {
  return useQuery({ queryKey: syllabusKeys.periods(), queryFn: syllabusApi.getPeriods });
}

export function useSyllabus(id: string) {
  return useQuery({
    queryKey: syllabusKeys.detail(id),
    queryFn: () => syllabusApi.getById(id),
    enabled: !!id,
  });
}

export function useSyllabusVersions(id: string, enabled = true) {
  return useQuery({
    queryKey: syllabusKeys.versions(id),
    queryFn: () => syllabusApi.getVersions(id),
    enabled: !!id && enabled,
  });
}

/** Versión con su snapshot; las versiones son inmutables, así que no se vuelven a consultar. */
export function useSyllabusVersion(id: string, versionId?: string) {
  return useQuery({
    queryKey: syllabusKeys.version(id, versionId ?? ''),
    queryFn: () => syllabusApi.getVersion(id, versionId!),
    enabled: !!id && !!versionId,
    staleTime: Infinity,
  });
}

/** Un syllabus nuevo o desactivado cambia también el conteo de syllabus por asignatura. */
function useSyllabusMutation<V, R>(mutationFn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: syllabusKeys.all }),
        queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
      ]),
  });
}

export const useCreateSyllabus = () =>
  useSyllabusMutation((input: SyllabusCreateInput) => syllabusApi.create(input));

export const useUpdateSyllabus = () =>
  useSyllabusMutation(({ id, input }: { id: string; input: SyllabusUpdateInput }) =>
    syllabusApi.update(id, input),
  );

export const useDeactivateSyllabus = () => useSyllabusMutation(syllabusApi.deactivate);

export const useRenewSyllabus = () =>
  useSyllabusMutation(({ id, academicPeriod }: { id: string; academicPeriod: string }) =>
    syllabusApi.renew(id, academicPeriod),
  );

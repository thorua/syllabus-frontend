import { useQuery } from '@tanstack/react-query';
import { syllabusApi } from '../api/endpoints';
import type { SyllabusFilters } from '../types';

export const syllabusKeys = {
  all: ['syllabus'] as const,
  list: (filters: SyllabusFilters) => [...syllabusKeys.all, 'list', filters] as const,
};

export function useSyllabusList(filters: SyllabusFilters = {}) {
  return useQuery({
    queryKey: syllabusKeys.list(filters),
    queryFn: () => syllabusApi.getAll(filters),
  });
}

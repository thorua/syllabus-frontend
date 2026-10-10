import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/endpoints';

export const settingsKeys = { all: ['settings'] as const };

export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: settingsApi.get });
}

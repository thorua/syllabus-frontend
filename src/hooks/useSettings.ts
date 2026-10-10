import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/endpoints';
import type { InstitutionalConfig } from '../types';

export const settingsKeys = { all: ['settings'] as const };

export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: settingsApi.get });
}

function useSettingsMutation<V>(mutationFn: (variables: V) => Promise<InstitutionalConfig>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (config) => queryClient.setQueryData(settingsKeys.all, config),
  });
}

export const useUpdateSettings = () => useSettingsMutation(settingsApi.update);

export const useUploadLogo = () => useSettingsMutation(settingsApi.uploadLogo);

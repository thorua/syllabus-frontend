import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signaturesApi } from '../api/endpoints';
import { studyPlanKeys } from './useCatalogs';
import { syllabusKeys } from './useSyllabus';
import type { SignInput } from '../api/endpoints';

const certificateKey = ['my-certificate'] as const;
const signaturesKey = (id: string) => [...syllabusKeys.detail(id), 'signatures'] as const;

/** Firmas de la versión vigente y si el usuario puede firmar el paso pendiente. */
export function useSyllabusSignatures(id: string) {
  return useQuery({
    queryKey: signaturesKey(id),
    queryFn: () => signaturesApi.get(id),
    enabled: !!id,
  });
}

/** Una firma cambia la verificación del syllabus, de los listados y de la malla. */
export function useSignSyllabus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SignInput }) => signaturesApi.sign(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: syllabusKeys.all }),
        queryClient.invalidateQueries({ queryKey: studyPlanKeys.all }),
        queryClient.invalidateQueries({ queryKey: certificateKey }),
      ]),
  });
}

export function useMyCertificate(enabled = true) {
  return useQuery({ queryKey: certificateKey, queryFn: signaturesApi.myCertificate, enabled });
}

function useCertificateMutation<V, R>(mutationFn: (variables: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: certificateKey }),
        queryClient.invalidateQueries({ queryKey: syllabusKeys.all }),
      ]),
  });
}

export const useSaveCertificate = () =>
  useCertificateMutation(({ file, password }: { file: File; password: string }) =>
    signaturesApi.saveCertificate(file, password),
  );

export const useDeleteCertificate = () =>
  useCertificateMutation(() => signaturesApi.deleteCertificate());

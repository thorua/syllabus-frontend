import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signaturesApi } from '../api/endpoints';
import { studyPlanKeys } from './useCatalogs';
import { syllabusKeys } from './useSyllabus';
import type { SignInput } from '../api/endpoints';

const certificateKey = ['my-certificate'] as const;
const signatureImageKey = ['my-signature-image'] as const;
const signaturesKey = (id: string) => [...syllabusKeys.detail(id), 'signatures'] as const;

const pendingKey = ['signatures', 'pending'] as const;

/** Syllabus vigentes que esperan la firma del usuario. */
export function usePendingSignatures(enabled = true) {
  return useQuery({ queryKey: pendingKey, queryFn: signaturesApi.pending, enabled });
}

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
        queryClient.invalidateQueries({ queryKey: pendingKey }),
      ]),
  });
}

/** Firma por lote: varios syllabus revisados con una sola contraseña. */
export function useSignBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      items,
      password,
      certificate,
    }: {
      items: { id: string; version: number }[];
      password: string;
      certificate?: File | null;
    }) => signaturesApi.signBatch(items, password, certificate),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: syllabusKeys.all }),
        queryClient.invalidateQueries({ queryKey: studyPlanKeys.all }),
        queryClient.invalidateQueries({ queryKey: pendingKey }),
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

/** Imagen de la firma manuscrita del usuario (PNG), o null si no la ha registrado. */
export function useMySignatureImage() {
  return useQuery({ queryKey: signatureImageKey, queryFn: signaturesApi.mySignatureImage });
}

function useSignatureImageMutation<V>(mutationFn: (variables: V) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: signatureImageKey }),
  });
}

export const useSaveSignatureImage = () =>
  useSignatureImageMutation((image: Blob) => signaturesApi.saveSignatureImage(image));

export const useDeleteSignatureImage = () =>
  useSignatureImageMutation(() => signaturesApi.deleteSignatureImage());

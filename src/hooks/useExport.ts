import { useMutation } from '@tanstack/react-query';
import { exportApi } from '../api/endpoints';
import { openForPrint, saveFile } from '../lib/download';
import type { BatchExportInput } from '../api/endpoints';

/** Cada exportación descarga el archivo generado por el backend (formato Almera). */
export const useExportSyllabus = () =>
  useMutation({ mutationFn: (id: string) => exportApi.syllabus(id).then(saveFile) });

/** UC17: abre el PDF formato Almera para imprimirlo. */
export const usePrintSyllabus = () =>
  useMutation({ mutationFn: (id: string) => openForPrint(() => exportApi.syllabus(id)) });

export const useExportBatch = () =>
  useMutation({ mutationFn: (input: BatchExportInput) => exportApi.batch(input).then(saveFile) });

export const useExportTemplate = () =>
  useMutation({ mutationFn: () => exportApi.template().then(saveFile) });

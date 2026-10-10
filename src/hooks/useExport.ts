import { useMutation } from '@tanstack/react-query';
import { exportApi } from '../api/endpoints';
import { saveFile } from '../lib/download';
import type { BatchExportInput } from '../api/endpoints';

/** Cada exportación descarga el archivo generado por el backend (formato Almera). */
export const useExportSyllabus = () =>
  useMutation({ mutationFn: (id: string) => exportApi.syllabus(id).then(saveFile) });

export const useExportBatch = () =>
  useMutation({ mutationFn: (input: BatchExportInput) => exportApi.batch(input).then(saveFile) });

export const useExportTemplate = () =>
  useMutation({ mutationFn: () => exportApi.template().then(saveFile) });

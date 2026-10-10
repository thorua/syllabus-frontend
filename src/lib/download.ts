import type { DownloadedFile } from '../api/endpoints';

/** Guarda en el equipo un archivo descargado de la API. */
export function saveFile({ blob, filename }: DownloadedFile) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

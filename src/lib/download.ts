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

/**
 * Abre un PDF de la API en una pestaña nueva para imprimirlo (UC17). La pestaña se abre antes de
 * esperar la descarga para que el navegador no la bloquee como ventana emergente.
 */
export async function openForPrint(download: () => Promise<DownloadedFile>) {
  const tab = window.open('', '_blank');
  try {
    const { blob } = await download();
    const url = window.URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
    // El visor del navegador ya cargó el documento; se libera la memoria del enlace después.
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

import axios from 'axios';

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sesión vencida o usuario desactivado: volver al login.
// Las rutas /auth/* manejan su propio 401 (p. ej. credenciales inválidas).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    // Las descargas piden un Blob: si el backend responde un error JSON, se lee para mostrar su mensaje.
    const body = error.response?.data;
    if (body instanceof Blob && body.type.includes('json')) {
      try {
        error.response.data = JSON.parse(await body.text());
      } catch {
        // Se conserva el Blob: getErrorMessage usará el mensaje por defecto.
      }
    }
    return Promise.reject(error);
  },
);

/** Mensaje de error del backend (propiedad "error" del ProblemDetail) o uno por defecto. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
}

export default api;

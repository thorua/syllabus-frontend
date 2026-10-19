# Sistema de Gestión de Syllabus — Frontend

Interfaz web del sistema de syllabus de la Universidad Autónoma de Manizales: React 18, TypeScript, Vite y Tailwind, servida por Nginx con proxy `/api` al backend.

El backend y el `docker-compose.yml` que levanta todo están en el repositorio `syllabus-backend`. Clone los dos en la misma carpeta y siga las instrucciones de ese repositorio.

## Desarrollo

Requisitos: Node 22 y el backend corriendo en http://localhost:8080.

```bash
npm install
npm run dev        # http://localhost:5173 (proxy /api → :8080)
```

Antes de cada commit:

```bash
npm run lint && npm run typecheck && npm run format:check && npm test
```

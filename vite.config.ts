import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// En desarrollo (npm run dev) /api se redirige al backend local, igual que hace Nginx en Docker.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Opcional: Reducir logs de HMR
    hmr: {
      overlay: true // Mantener overlay de errores
    }
  },
  // Opcional: Configurar nivel de logging
  logLevel: 'info' // 'silent', 'error', 'warn', 'info'
});

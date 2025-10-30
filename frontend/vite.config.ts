import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for Vite build (assets paths)
// Keep this as '/' - actual BASE_PATH is now dynamically injected by PHP at runtime
const BASE_PATH = '/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: '/index.html'
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});

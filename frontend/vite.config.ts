import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If you change the installation path, update this base path and also:
// - frontend/src/config.ts (BASE_PATH)
// Then rebuild with: ./build-frontend.sh
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

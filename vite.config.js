import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        scholarships: resolve(import.meta.dirname, 'scholarships.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
        credentials: resolve(import.meta.dirname, 'credentials.html'),
        about: resolve(import.meta.dirname, 'about.html')
      }
    }
  }
});

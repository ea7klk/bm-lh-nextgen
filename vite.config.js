import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/public': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/advanced': 'http://localhost:3000',
    },
  },
});

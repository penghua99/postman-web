import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@server': path.resolve(__dirname, 'server'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@lark-apaas/client-toolkit/logger': path.resolve(__dirname, 'client/src/utils/logger.ts'),
      '@lark-apaas/client-toolkit': path.resolve(__dirname, 'client/src/utils/confirm.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
});

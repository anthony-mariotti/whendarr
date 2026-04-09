import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  base: command === 'serve' ? './' : './',
  server: {
    port: 5173,
    proxy: {
      [`/api`]: {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      [`/health`]: {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'dayjs/locale': path.resolve('node_modules/dayjs/esm/locale')
    }
  }
}));

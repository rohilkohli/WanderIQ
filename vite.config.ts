/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    globals:      true,
    environment:  'jsdom',
    setupFiles:   ['./src/test/setup.ts'],
    exclude:      ['tests/e2e/**', 'node_modules/**', 'dist/**', '.idea/**', '.git/**', '.cache/**'],
    coverage: {
      provider:    'v8',
      thresholds: {
        lines:     80,
        branches:  75,
        functions: 80,
      },
    },
  },
});

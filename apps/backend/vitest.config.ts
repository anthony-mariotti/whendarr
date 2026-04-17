import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/routes/**/*.ts',
        'src/integrations/**/*.ts',
        'src/services/**/*.ts',
        'src/utils/**/*.ts'
      ],
      exclude: ['**/*.test.ts']
    }
  }
});

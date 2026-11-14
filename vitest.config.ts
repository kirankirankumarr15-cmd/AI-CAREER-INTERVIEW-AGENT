import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      'tests/ats-engine.test.ts',
      'tests/practice-hub.test.ts',
    ],
    setupFiles: ['tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'app/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '**/.next/**', '**/node_modules/**'],
    },
    testTimeout: 20000,
  },
});

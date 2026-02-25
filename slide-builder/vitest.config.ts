import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'test']
    },
    alias: {
      vscode: path.resolve(__dirname, 'test/__mocks__/vscode.ts')
    },
    // Resource optimization to prevent CPU/memory issues
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
        isolate: true
      }
    },
    maxConcurrency: 5,
    fileParallelism: true,
    testTimeout: 10000,
    hookTimeout: 10000
  },
  esbuild: {
    jsx: 'automatic'
  }
});

import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    /** Serial execution — integration tests share one Postgres DB. */
    fileParallelism: false,
    poolOptions: {
      threads: { singleThread: true },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});

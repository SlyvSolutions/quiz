import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/quiz/',
  build: { outDir: 'dist', emptyOutDir: true },
  test: { include: ['tests/**/*.test.ts'] },
});

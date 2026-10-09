import { defineConfig } from 'vitest/config';

process.env.NODE_ENV ??= 'test';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/applytrack-test';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
process.env.PORT ??= '5000';
// RAG tests stub provider HTTP calls; a dummy key keeps env validation
// green while never touching a real API.
process.env.OPENROUTER_API_KEY ??= 'test-key';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});

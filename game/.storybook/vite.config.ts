import { defineConfig } from 'vite';

// Keep the workshop independent of game asset packaging and release plugins.
export default defineConfig({ publicDir: false, build: { target: 'es2022' } });

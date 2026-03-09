import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  base: '/SEISMO/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});

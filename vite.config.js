import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages için yolların doğru çözümlenmesini sağlar
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html' // Dosyanın ana dizinde olduğunu teyit eder
      }
    }
  }
});

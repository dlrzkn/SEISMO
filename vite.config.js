import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // GitHub Pages'de yolların bozulmaması için kritik
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html' // Vite'a index.html'in ana dizinde olduğunu açıkça söyler
      }
    }
  }
});

import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages için base path ayarı
  base: './', 
  build: {
    rollupOptions: {
      input: {
        // Giriş noktasının ana dizindeki index.html olduğunu kesinleştiriyoruz
        main: './index.html' 
      }
    }
  }
});

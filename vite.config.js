import { defineConfig } from 'vite';

export default defineConfig({
  // Root varsayılan olarak zaten ana dizindir, 
  // ama açıkça belirtmek çakışmaları önler.
  root: './', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html' // Burada 'src/index.html' yazıyorsa hatanın kaynağı budur.
      }
    }
  }
});

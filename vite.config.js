import { defineConfig } from 'vite';

export default defineConfig({
  // index.html artık ana dizinde olduğu için root'u siliyoruz veya '.' yapıyoruz
  base: '/SEISMO/',
  build: {
    // Çıktı klasörü artık kök dizine göre 'dist' olmalı
    outDir: 'dist',
    emptyOutDir: true,
    // Dosya yollarının doğru çözümlenmesi için rollup ayarı (isteğe bağlı)
    rollupOptions: {
      input: './index.html'
    }
  }
});


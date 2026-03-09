import { MapEngine } from './core/map.js';
import { UIController } from './ui/ui-controller.js';
// EarthquakeService importunu veri çekme aşamasında ekleyeceğiz

document.addEventListener('DOMContentLoaded', () => {
    // 1. UI Başlat
    UIController.init();

    // 2. Harita Başlat
    const map = MapEngine.init('map');

    // 3. Sistem Saati ve Meta Güncelleme
    setInterval(() => {
        // ui-controller içindeki saat fonksiyonu burada tetiklenebilir
    }, 1000);
});

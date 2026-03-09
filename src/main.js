import { MapEngine } from './core/map.js';
import { UIController } from './ui/ui-controller.js';
import { EarthquakeService } from './services/earthquake.js';

/**
 * SEISMO | Ana Uygulama Başlatıcı (Senior Orchestrator)
 */
const SeismoApp = {
    async init() {
        console.log("SEISMO Terminal başlatılıyor...");

        // 1. UI Kontrollerini ve Saati Başlat
        UIController.init();

        // 2. Harita Motorunu Kur (Mapbox Globe)
        const map = MapEngine.init('map');

        // 3. Harita Yüklendiğinde Veri Döngüsünü Başlat
        map.on('load', () => {
            this.startDataCycle();
            // 5 dakikada bir otomatik güncelleme
            setInterval(() => this.startDataCycle(), 300000);
        });
    },

    async startDataCycle() {
        UIController.setLoading(true);
        
        // Servis üzerinden verileri çek (ilk kodundaki fetchSeismicData mantığı)
        const events = await EarthquakeService.fetchEarthquakes();
        
        if (events) {
            // Haritadaki noktaları güncelle
            MapEngine.updateSource(events);
            // Sağ paneli ve istatistikleri güncelle
            UIController.renderFeed(events);
            UIController.updateAnalytics(events);
        }

        UIController.setLoading(false);
    }
};

// Sayfa hazır olduğunda uygulamayı ateşle
document.addEventListener('DOMContentLoaded', () => SeismoApp.init());

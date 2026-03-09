import { MapEngine } from './core/map.js';
import { UIController } from './ui/ui-controller.js';
import { EarthquakeService } from './services/earthquake.js';

/**
 * SEISMO | Ana Uygulama Başlatıcı (Senior Orchestrator)
 */
const SeismoApp = {
    // API'den gelen son ham veriyi hafızada tutmak için
    allEvents: [],
    currentMinMag: 0,

    async init() {
        console.log("SEISMO Terminal başlatılıyor...");

        // 1. UI Kontrollerini ve Saati Başlat
        UIController.init();

        // 2. Harita Motorunu Kur
        const map = MapEngine.init('map');

        // 3. Harita Yüklendiğinde Veri Akışını Başlat
        map.on('load', () => {
            this.startDataCycle();
            // 5 dakikada bir otomatik güncelleme
            setInterval(() => this.startDataCycle(), 300000);
        });

        // 4. Filtreleme Olayını Dinle
        window.addEventListener('seismo:filter', (e) => {
            this.currentMinMag = parseFloat(e.detail.minMag);
            this.applyFilters();
        });
    },

    async startDataCycle() {
        UIController.setLoading(true);
        
        // Servis üzerinden ham verileri çek
        const events = await EarthquakeService.fetchEarthquakes();
        
        if (events) {
            this.allEvents = events;
            this.applyFilters();
        }

        UIController.setLoading(false);
    },

    /**
     * Hafızadaki veriyi mevcut filtrelere göre süzüp görselleştirir
     */
    applyFilters() {
        const filtered = this.allEvents.filter(ev => ev.mag >= this.currentMinMag);
        
        // Haritayı güncelle
        MapEngine.updateSource(filtered);
        
        // Arayüz listesini ve istatistikleri güncelle
        UIController.renderFeed(filtered);
        UIController.updateAnalytics(filtered);
    }
};

// Sayfa hazır olduğunda uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => SeismoApp.init());

import { MapEngine } from './core/map-engine.js';
import { EarthquakeService } from './services/earthquake.js';
import { UIController } from './ui/ui-controller.js';

/**
 * SEISMO | Ana Uygulama Orkestratörü
 */
const SeismoApp = {
    allEvents: [],
    currentMinMag: 0,

    async init() {
        console.log("SEISMO Terminal başlatılıyor...");

        // 1. Haritayı Başlat
        const map = MapEngine.init('map');
        MapEngine.initLayers();

        // 2. Arayüz Dinleyicilerini Kur (Filtre değişimlerini yakalar)
        // Ok fonksiyonu (arrow function) kullanarak 'this' bağlamını koruyoruz
        UIController.init((newMag) => {
            this.currentMinMag = newMag;
            this.applyFilters();
        });

        // 3. Harita tamamen yüklendiğinde veri döngüsünü başlat
        map.on('load', () => {
            console.log("Harita yüklendi, veri akışı başlıyor...");
            this.startDataCycle();
        });
    },

    async startDataCycle() {
        UIController.setLoading(true);
        
        try {
            const events = await EarthquakeService.fetchAll();
            
            if (events && Array.isArray(events)) {
                this.allEvents = events;
                this.applyFilters();
            }
        } catch (error) {
            console.error("Sismik veri akışı hatası:", error);
        } finally {
            UIController.setLoading(false);
        }

        // 2 dakikada bir otomatik yenile
        // setTimeout içinde yine ok fonksiyonu kullanarak 'this' kaybını önlüyoruz
        setTimeout(() => this.startDataCycle(), 120000);
    },

    applyFilters() {
        // Ham veriyi mevcut büyüklük filtresine göre süz
        const filtered = this.allEvents.filter(ev => ev.mag >= this.currentMinMag);
        
        // Haritayı, beslemeyi ve analizleri güncelle
        MapEngine.updateData(filtered);
        UIController.renderFeed(filtered);
        UIController.updateAnalytics(filtered);
    }
};

// Sayfa hazır olduğunda motoru çalıştır
document.addEventListener('DOMContentLoaded', () => SeismoApp.init());

import './css/style.css';
import { MapManager } from './core/map';
import { EarthquakeService } from './services/earthquake';
import { UIManager } from './components/ui';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const app = {
    async init() {
        // 1. UI ve Harita başlatma
        this.uiManager = new UIManager();
        this.uiManager.renderSkeleton();

        this.mapManager = new MapManager('map', MAPBOX_TOKEN);
        this.mapManager.init();

        // 2. Veri servisi başlatma
        this.earthquakeService = new EarthquakeService();
        
        // 3. Verileri çek ve ilk gösterimi yap
        const allEvents = await this.earthquakeService.fetchAll();
        this.renderData(allEvents);

        // 4. Filtreleme olaylarını dinle
        this.uiManager.attachEventListeners((minMag) => {
            const filtered = allEvents.filter(ev => ev.mag >= minMag);
            this.renderData(filtered);
        });

        console.log("Sistem tüm bileşenleriyle aktif.");
    },

    // Hem haritayı hem UI'ı aynı anda güncelleyen yardımcı fonksiyon
    renderData(events) {
        this.mapManager.updateData(events);
        this.uiManager.updateFeed(events);
        this.uiManager.updateAnalytics(events);
    }
};

app.init();

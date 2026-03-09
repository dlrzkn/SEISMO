import './css/style.css';
import { MapManager } from './core/map';
import { EarthquakeService } from './services/earthquake';
import { UIManager } from './components/ui'; // Yeni modülü import et

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const app = {
    async init() {
        // 1. Arayüz yöneticisini başlat ve iskeleti kur
        this.uiManager = new UIManager();
        this.uiManager.renderSkeleton();

        // 2. Haritayı başlat (ID artık 'map' olarak UI Manager'dan geliyor)
        this.mapManager = new MapManager('map', MAPBOX_TOKEN);
        this.mapManager.init();

        // 3. Veri servisini başlat
        this.earthquakeService = new EarthquakeService();
        
        // 4. Verileri çek, haritayı ve listeyi güncelle
        const events = await this.earthquakeService.fetchAll();
        this.mapManager.updateData(events);
        this.uiManager.updateFeed(events); // Listeyi doldur

        console.log("Sistem tüm bileşenleriyle aktif.");
    }
};

app.init();

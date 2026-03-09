import './css/style.css';
import { MapManager } from './core/map';
import { EarthquakeService } from './services/earthquake';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const app = {
    async init() {
        // 1. Ekran yapısını oluştur
        document.getElementById('app').innerHTML = `
            <div id="map" style="width: 100vw; height: 100vh;"></div>
        `;

        // 2. Haritayı başlat
        this.mapManager = new MapManager('map', MAPBOX_TOKEN);
        this.mapManager.init();

        // 3. Veri servisini başlat
        this.earthquakeService = new EarthquakeService();
        
        // 4. Verileri çek ve haritayı güncelle
        const events = await this.earthquakeService.fetchAll();
        this.mapManager.updateData(events);

        console.log(`${events.length} adet deprem verisi haritaya işlendi.`);
    }
};

app.init();

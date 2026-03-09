import './css/style.css';
import { MapManager } from './core/map';
import { EarthquakeService } from './services/earthquake'; // Yeni eklenen satır

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const app = {
    async init() {
        document.getElementById('app').innerHTML = `
            <div id="map" style="width: 100vw; height: 100vh;"></div>
        `;

        this.mapManager = new MapManager('map', MAPBOX_TOKEN);
        this.mapManager.init();

        // Veri servisini başlat ve test et
        this.earthquakeService = new EarthquakeService();
        const data = await this.earthquakeService.fetchAll();
        console.log("Gelen Ham Veri:", data);
    }
};

app.init();

import './css/style.css';
import { MapManager } from './core/map';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const app = {
    async init() {
        // HTML yapısını oluştur
        document.getElementById('app').innerHTML = `
            <div id="map" style="width: 100vw; height: 100vh;"></div>
        `;

        // Harita modülünü başlat
        this.mapManager = new MapManager('map', MAPBOX_TOKEN);
        this.mapManager.init();

        console.log("Harita modülü başarıyla yüklendi.");
    }
};

app.init();

// SEISMO/src/js/main.js
import { MapEngine } from './components/map-engine.js';
import { EarthquakeService } from './services/earthquake.js';
import { UIController } from './components/ui-controller.js';

// Geri kalan kodlar...


const config = {
    token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
};

// 1. Haritayı Başlat
const map = MapEngine.init(config);

map.on('load', async () => {
    // 2. Verileri Çek
    const data = await EarthquakeService.fetchAndProcess();
    
    // 3. Arayüzü Başlat
    UIController.init(map, data);

    // 4. Global erişim için (Listeden tıklayınca haritaya gitmesi için)
    window.focusEvent = (coords) => {
        map.flyTo({ center: coords, zoom: 8, duration: 2000, essential: true });
    };
});

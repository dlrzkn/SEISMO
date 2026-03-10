// SEISMO/src/js/main.js
import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';
// import { UIController } from './ui.js'; 

const token = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const map = MapEngine.init({ token });

map.on('load', async () => {
    // 1. Veriyi çek
    const rawData = await EarthquakeService.fetchAndProcess();
    
    // 2. Haritayı güncelle (Hem Isı Haritası hem Noktalar otomatik güncellenir)
    const geojson = { 
        type: 'FeatureCollection', 
        features: rawData.map(ev => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: ev.coordinates },
            properties: { ...ev }
        }))
    };
    map.getSource('earthquakes').setData(geojson);

    // 3. UI Bileşenlerini başlat (Gelecek adımda yapacağız)
    // UIController.init(map, rawData);
});

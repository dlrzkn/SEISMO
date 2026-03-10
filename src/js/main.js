import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';

const config = {
    token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
};

const map = MapEngine.init(config);

map.on('load', async () => {
    const data = await EarthquakeService.fetchAll();
    // Veriyi haritaya bas ve UI'ı güncelle
});

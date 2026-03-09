import mapboxgl from 'mapbox-gl';

export class MapManager {
    constructor(containerId, token) {
        mapboxgl.accessToken = token;
        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [35, 39],
            zoom: 2.5,
            projection: 'globe'
        });
    }

    init() {
        this.map.on('style.load', () => {
            this.map.setFog({});
            this.initSources();
            this.initLayers();
        });
    }

    // Harita veri kaynağını oluşturur
    initSources() {
        this.map.addSource('earthquakes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
    }

    // Harita katmanlarını (noktaları) oluşturur
    initLayers() {
        this.map.addLayer({
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 4, 6, 15, 9, 45],
                'circle-color': ['interpolate', ['linear'], ['get', 'mag'], 3, '#2ecc71', 5, '#f1c40f', 7, '#e67e22', 8, '#c0392b'],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.8
            }
        });
    }

    // Gelen temiz veriyi haritaya yükleyen fonksiyon
    updateData(events) {
        if (!this.map.getSource('earthquakes')) return;

        const geojson = {
            type: 'FeatureCollection',
            features: events.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: ev.coordinates },
                properties: { ...ev }
            }))
        };

        this.map.getSource('earthquakes').setData(geojson);
    }
}

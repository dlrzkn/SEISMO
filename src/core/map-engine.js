// SEISMO/src/core/map-engine.js
export const MapEngine = {
    init(config) {
        mapboxgl.accessToken = config.token;
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [35, 39],
            zoom: 2.5,
            projection: 'globe'
        });

        map.on('style.load', () => {
            this.setupAtmosphere(map);
            this.initSources(map);
            this.initLayers(map);
        });

        return map;
    },

    setupAtmosphere(map) {
        map.setFog({
            'range': [0.5, 10],
            'color': '#0a0c10',
            'high-color': '#161c24',
            'space-color': '#000000',
            'star-intensity': 0.2
        });
    },

    initSources(map) {
        // Senin orijinal 'earthquakes' kaynağın
        map.addSource('earthquakes', { 
            type: 'geojson', 
            data: { type: 'FeatureCollection', features: [] } 
        });
        // Plaka sınırları
        map.addSource('plates', { 
            type: 'geojson', 
            data: 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json' 
        });
    },

    initLayers(map) {
        // KATMAN 1: Fay Hatları (En altta)
        map.addLayer({ 
            id: 'plates-layer', type: 'line', source: 'plates', 
            paint: { 'line-color': '#ff4d4d', 'line-width': 1, 'line-dasharray': [4, 3] } 
        });

        // KATMAN 2: Isı Haritası (Ortada)
        map.addLayer({
            id: 'quakes-heat', type: 'heatmap', source: 'earthquakes',
            maxzoom: 9,
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
                    0.6, '#f1c40f', 0.8, '#e67e22', 1, '#e74c3c'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                'heatmap-opacity': 0.6
            }
        });

        // KATMAN 3: Deprem Noktaları (En üstte - Tıklanabilir)
        map.addLayer({
            id: 'earthquake-points', type: 'circle', source: 'earthquakes',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 4, 6, 15, 9, 45],
                'circle-color': ['interpolate', ['linear'], ['get', 'mag'], 3, '#2ecc71', 5, '#f1c40f', 7, '#e67e22', 8, '#c0392b'],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.8
            }
        });
    }
};



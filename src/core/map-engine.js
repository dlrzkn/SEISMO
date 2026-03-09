/**
 * Map Engine - Harita Görselleştirme Çekirdeği
 */
export const MapEngine = {
    map: null,

    /**
     * Harita motorunu başlatır
     */
    init(containerId) {
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [35, 39],
            zoom: 2.5,
            projection: 'globe'
        });

        this.map.on('style.load', () => {
            this.setupAtmosphere();
            this.initSources();
            this.initLayers();
        });

        return this.map;
    },

    /**
     * Uzay ve atmosfer efektlerini kurar
     */
    setupAtmosphere() {
        this.map.setFog({
            'range': [0.5, 10],
            'color': '#0a0c10',
            'high-color': '#161c24',
            'space-color': '#000000',
            'horizon-blend': 0.05
        });
    },

    /**
     * GeoJSON veri kaynaklarını tanımlar
     */
    initSources() {
        if (!this.map.getSource('earthquakes')) {
            this.map.addSource('earthquakes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
    },

    /**
     * Sismik noktaların görsel stillerini tanımlar (Büyüklüğe göre renk ve boyut)
     */
    initLayers() {
        if (!this.map.getLayer('earthquake-points')) {
            this.map.addLayer({
                id: 'earthquake-points',
                type: 'circle',
                source: 'earthquakes',
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        1, 3,
                        4, 8,
                        6, 15,
                        9, 40
                    ],
                    'circle-color': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        3, '#2ecc71',
                        5, '#f1c40f',
                        7, '#e67e22',
                        8, '#c0392b'
                    ],
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.8
                }
            });
        }
    },

    /**
     * Gelen sismik verileri haritada günceller
     */
    updateSource(events) {
        const source = this.map.getSource('earthquakes');
        if (!source) return;

        const geojson = {
            type: 'FeatureCollection',
            features: events.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: ev.coordinates },
                properties: { ...ev }
            }))
        };

        source.setData(geojson);
    }
};

export const MapEngine = {
    map: null,

    async init(config) {
        mapboxgl.accessToken = config.token;
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [35, 39],
            zoom: 2.5,
            projection: 'globe',
            antialias: true
        });

        return new Promise((resolve) => {
            this.map.on('style.load', () => {
                this.setupAtmosphere();
                this.initSources();
                this.initLayers();
                resolve(this.map);
            });

            this.map.on('load', () => {
                this.setupInteraction();
                // Harita hazır olduğunda bir 'resize' tetikle (Tablet uyumu için)
                this.map.resize();
            });
        });
    },

    initSources() {
        // Deprem Kaynağı
        this.map.addSource('earthquakes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        // LEVHA SINIRLARI (Görseldeki kırmızı çizgiler)
        this.map.addSource('plates', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json'
        });
    },

    initLayers() {
        // 1. Levha Sınırları Katmanı
        this.map.addLayer({
            id: 'plates-layer',
            type: 'line',
            source: 'plates',
            paint: {
                'line-color': '#ff4d4d',
                'line-width': 1.5,
                'line-dasharray': [2, 1],
                'line-opacity': 0.6
            }
        });

        // 2. Deprem Noktaları (Görseldeki Glow Efekti)
        this.map.addLayer({
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    2, ['interpolate', ['linear'], ['get', 'mag'], 2, 2, 8, 12],
                    10, ['interpolate', ['linear'], ['get', 'mag'], 2, 4, 8, 40]
                ],
                'circle-color': [
                    'step', ['get', 'mag'],
                    '#00d2ff', 4.0, // Minor
                    '#fceb5e', 5.5, // Moderate
                    '#ff9100', 7.0, // Strong
                    '#ff1744'       // Major
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.8
            }
        });
    },

    // GÖRSELDEKİ POPUP MANTIĞI
    setupInteraction() {
        this.map.on('click', 'earthquake-points', (e) => {
            const p = e.features[0].properties;
            const coords = e.features[0].geometry.coordinates;

            new mapboxgl.Popup({ offset: 15, className: 'seismo-popup' })
                .setLngLat(coords)
                .setHTML(`
                    <div class="popup-content">
                        <div class="popup-header">
                            <span class="popup-source">${p.source}</span>
                            <span class="popup-mag">${parseFloat(p.mag).toFixed(1)} <small>Mw</small></span>
                        </div>
                        <div class="popup-body">
                            <p class="popup-place">${p.place}</p>
                            <div class="popup-grid">
                                <div><small>DERİNLİK</small><br>${p.depth} KM</div>
                                <div><small>SAAT</small><br>${new Date(p.time).toLocaleTimeString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                `)
                .addTo(this.map);
        });
    },

    setupAtmosphere() {
        this.map.setFog({
            'range': [0.5, 10],
            'color': '#0a0c10',
            'high-color': '#161c24',
            'space-color': '#000000',
            'star-intensity': 0.2
        });
    },

    updateSource(id, data) {
        if (this.map.getSource(id)) {
            this.map.getSource(id).setData(data);
        }
    }
};

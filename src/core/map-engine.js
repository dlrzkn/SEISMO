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
                this.map.resize();
            });
        });
    },

    initSources() {
        this.map.addSource('earthquakes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

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
            },
            layout: { 'visibility': 'none' }
        });

        // 2. Glow (Parlama) Katmanı - Bilimsel Yayılım
        this.map.addLayer({
            id: 'earthquake-glow',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                'circle-radius': [
                    'interpolate', ['exponential', 2], ['zoom'],
                    1, ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 8, 25],
                    10, ['interpolate', ['linear'], ['get', 'mag'], 1, 15, 8, 80]
                ],
                'circle-color': [
                    'interpolate', ['linear'], ['get', 'mag'],
                    2.0, '#00d2ff',
                    5.5, '#ff9100',
                    8.0, '#9c27b0'
                ],
                'circle-opacity': 0.15,
                'circle-blur': 1.5
            }
        });

        // 3. Ana Sismik Noktalar - Richter ve Derinlik Odaklı
        this.map.addLayer({
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                'circle-radius': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    1, ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 8, 8],
                    10, ['interpolate', ['linear'], ['get', 'mag'], 1, 3, 8, 30]
                ],
                'circle-color': [
                    'interpolate', ['linear'], ['get', 'mag'],
                    2.0, '#00d2ff',
                    4.0, '#fceb5e',
                    5.5, '#ff9100',
                    7.0, '#ff1744',
                    8.0, '#9c27b0'
                ],
                'circle-opacity': 0.8,
                'circle-stroke-width': [
                    'interpolate', ['linear'], ['zoom'],
                    1, 0.5,
                    10, 2
                ],
                'circle-stroke-color': '#ffffff',
                'circle-stroke-opacity': [
                    'interpolate', ['linear'], ['get', 'depth'],
                    0, 0.8,   // Yüzeye yakın: Net
                    100, 0.2  // Derin: Belirsiz
                ]
            }
        });
    },

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
                                <div><small>DERİNLİK</small><br>${parseFloat(p.depth).toFixed(1)} KM</div>
                                <div><small>SAAT</small><br>${new Date(p.time).toLocaleTimeString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                `)
                .addTo(this.map);
        });

        this.map.on('mouseenter', 'earthquake-points', () => { this.map.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', 'earthquake-points', () => { this.map.getCanvas().style.cursor = ''; });
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
        const source = this.map.getSource(id);
        if (source) {
            requestAnimationFrame(() => {
                source.setData(data);
            });
        }
    }
};

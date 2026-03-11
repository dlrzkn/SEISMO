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
        // 1. Levha Sınırları
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

        // 2. Heatmap Katmanı
        this.map.addLayer({
            id: 'earthquakes-heat',
            type: 'heatmap',
            source: 'earthquakes',
            maxzoom: 9,
            layout: { 'visibility': 'none' },
            paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 7, 1],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                'heatmap-color': [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(33,102,172,0)',
                    0.2, 'rgb(103,169,207)',
                    0.4, 'rgb(209,229,240)',
                    0.6, 'rgb(253,219,199)',
                    0.8, 'rgb(239,138,98)',
                    1, 'rgb(178,24,43)'
                ],
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
            }
        });

        // 3. Şiddetli Glow Katmanları
        const glowLevels = [
            { id: 'glow-7', mag: 7.0, color: '#FF0000', blur: 1.0, opacity: 0.4, radBase: 20 },
            { id: 'glow-8', mag: 8.0, color: '#8B0000', blur: 1.5, opacity: 0.6, radBase: 35 },
            { id: 'glow-9', mag: 9.0, color: '#4b0082', blur: 2.0, opacity: 0.8, radBase: 50 }
        ];

        glowLevels.forEach(level => {
            this.map.addLayer({
                id: level.id,
                type: 'circle',
                source: 'earthquakes',
                filter: ['>=', ['get', 'mag'], level.mag],
                paint: {
                    'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 1, level.radBase, 10, level.radBase * 5],
                    'circle-color': level.color,
                    'circle-opacity': level.opacity,
                    'circle-blur': level.blur,
                    'circle-pitch-alignment': 'map'
                }
            });
        });

        // 4. Genel Sismik Bloom
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
                    0.0, '#D3D3D3', 2.0, '#0000FF', 3.0, '#00FF00', 4.0, '#FFFF00',
                    5.0, '#FFA500', 6.0, '#FF8C00', 7.0, '#FF0000', 8.0, '#8B0000', 9.0, '#4b0082'
                ],
                'circle-opacity': 0.15,
                'circle-blur': ['interpolate', ['linear'], ['get', 'depth'], 0, 0.5, 150, 2.0]
            }
        });

        // 5. Ana Sismik Odak Noktaları
        this.map.addLayer({
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                'circle-radius': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    1, ['interpolate', ['linear'], ['get', 'mag'], 1, 1.5, 8, 10],
                    10, ['interpolate', ['linear'], ['get', 'mag'], 1, 4, 8, 35]
                ],
                'circle-color': [
                    'interpolate', ['linear'], ['get', 'mag'],
                    0.0, '#D3D3D3', 2.0, '#0000FF', 3.0, '#00FF00', 4.0, '#FFFF00',
                    5.0, '#FFA500', 6.0, '#FF8C00', 7.0, '#FF0000', 8.0, '#8B0000', 9.0, '#4b0082'
                ],
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.65, 10, 0.9],
                'circle-stroke-width': 1,
                'circle-stroke-color': 'rgba(255,255,255,0.3)',
                'circle-pitch-alignment': 'map'
            }
        });
    },

       setupInteraction() {
        this.map.on('click', 'earthquake-points', (e) => {
            const p = e.features[0].properties;
            const coords = e.features[0].geometry.coordinates;
            const dateObj = new Date(p.time);

            new mapboxgl.Popup({ offset: 15, className: 'seismo-popup' })
                .setLngLat(coords)
                .setHTML(`
                    <div class="popup-main">
                        <div class="popup-header-block">
                            <span class="popup-source-tag">${p.source || 'VERİ KAYNAĞI'}</span>
                            <div class="popup-mag-block">
                                <span class="popup-mag-value">${parseFloat(p.mag).toFixed(1)}</span>
                                <small>Mw</small>
                            </div>
                        </div>
                        <div class="popup-place-block">${p.place}</div>
                        <div class="popup-data-grid" style="align-items: center;">
                            <div class="data-node">
                                <div class="data-node-label">DERİNLİK</div>
                                <div class="data-node-value">${parseFloat(p.depth).toFixed(1)} KM</div>
                            </div>
                            <div class="data-node">
                                <div class="data-node-label">TARİH</div>
                                <div class="data-node-value">${dateObj.toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div class="data-node">
                                <div class="data-node-label">SAAT (TSI)</div>
                                <div class="data-node-value">${dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                            <div class="data-node">
                                <div class="data-node-label">KOORDİNAT</div>
                                <div class="data-node-value">${coords[1].toFixed(2)}N / ${coords[0].toFixed(2)}E</div>
                            </div>
                            <div class="data-node" style="padding-top: 4px;">
                                <a href="${p.url}" target="_blank" class="popup-link-btn" style="width: 100%;">DETAYLI ANALİZ ↗</a>
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
            'range': [1, 10],
            'color': '#0b1426',       // style.css'deki --bg-main ile uyumlu
            'high-color': '#162235',  // Atmosferik geçiş
            'space-color': '#000000', // Uzay derinliği
            'star-intensity': 0.15    // Mapbox yıldızlarını azalttık (CSS yıldızları için yer açtık)
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

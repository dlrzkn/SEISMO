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
   initLayers() {
    this.map.addLayer({
        id: 'earthquake-points',
        type: 'circle',
        source: 'earthquakes',
        paint: {
            // ZOOM VE BÜYÜKLÜK DENGESİ: Noktalar zoom yapınca devleşmez, 
            // ama büyük depremler küçüklerden her zaman ayırt edilir.
            'circle-radius': [
                'interpolate', ['exponential', 1.5], ['zoom'],
                1, ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 8, 8],  // Uzaktan (dünya geneli) çok küçük noktalar
                10, ['interpolate', ['linear'], ['get', 'mag'], 1, 3, 8, 30] // Yakından (yerel) detaylı ama kontrollü boyutlar
            ],

            // BİLİMSEL RICHTER SKALASI RENKLERİ:
            'circle-color': [
                'interpolate', ['linear'], ['get', 'mag'],
                2.0, '#00d2ff', // Mikro (Siyan)
                4.0, '#fceb5e', // Hafif (Sarı)
                5.5, '#ff9100', // Orta (Turuncu)
                7.0, '#ff1744', // Şiddetli (Kırmızı)
                8.0, '#9c27b0'  // Felaket (Mor)
            ],

            // GLOW VE DERİNLİK EFEKTİ:
            'circle-opacity': 0.75,
            'circle-stroke-width': [
                'interpolate', ['linear'], ['zoom'],
                1, 0.5,
                10, 2
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.4,
            
            // Parlama (Glow) miktarını Richter ölçeğine bağlıyoruz
            'circle-blur': [
                'interpolate', ['linear'], ['get', 'mag'],
                2, 0.1,
                7, 0.5
            ]
        }
    });
}


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

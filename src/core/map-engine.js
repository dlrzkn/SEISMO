export const MapEngine = {
    map: null,

    init(config) {
        mapboxgl.accessToken = config.token;
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11', // Bilimsel analiz için koyu tema daha iyidir
            center: [35, 39],
            zoom: 3,
            projection: 'globe'
        });

        // Responsive Desteği: Tablet döndürüldüğünde haritayı yeniden boyutlandır
        window.addEventListener('resize', () => this.map.resize());

        return new Promise((resolve) => {
            this.map.on('style.load', () => {
                this.setupAtmosphere(this.map);
                this.initSources(this.map);
                this.initLayers(this.map);
                resolve(this.map);
            });
        });
    },

    // UI/UX İyileştirmesi: Mag değerine göre dinamik büyüklük
    initLayers(map) {
        // Fay hatları (Scientific Layer)
        map.addLayer({ 
            id: 'plates-layer', type: 'line', source: 'plates', 
            paint: { 'line-color': '#ff4d4d', 'line-width': 0.8, 'line-opacity': 0.5 } 
        });

        // Deprem Noktaları (Logaritmik Ölçeklendirme)
        map.addLayer({
            id: 'earthquake-points', type: 'circle', source: 'earthquakes',
            paint: {
                // Daha profesyonel bir zoom-radius dengesi
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    2, ['interpolate', ['linear'], ['get', 'mag'], 2, 2, 8, 15],
                    10, ['interpolate', ['linear'], ['get', 'mag'], 2, 5, 8, 60]
                ],
                'circle-color': [
                    'step', ['get', 'mag'],
                    '#5efc82', 4.0, // Yeşil (Minor)
                    '#fceb5e', 5.5, // Sarı (Moderate)
                    '#ff9100', 7.0, // Turuncu (Strong)
                    '#ff1744'       // Kırmızı (Major)
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.7
            }
        });
    }
};

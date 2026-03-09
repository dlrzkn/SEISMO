/**
 * Map Engine - Harita Görselleştirme Çekirdeği
 */
export const MapEngine = {
    map: null,

    /**
     * Harita motorunu başlatır
     * @param {string} containerId - Haritanın yükleneceği HTML element ID'si
     */
    init(containerId) {
        // Token doğrudan tanımlı
        mapboxgl.accessToken = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8QN';

        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [35, 39],
            zoom: 2.5,
            projection: 'globe',
            antialias: true
        });

        // Katmanları başlat
        this.initLayers(); 

        return this.map;
    },

    /**
     * Sismik veri katmanlarını hazırlar
     */
    initLayers() {
        if (!this.map) return;

        this.map.on('style.load', () => {
            // Atmosfer efekti (Globe projeksiyonu için)
            console.log("Harita stili başarıyla yüklendi, katmanlar ekleniyor...");
            this.map.setFog({
                'range': [0.5, 10],
                'color': '#0a0c10',
                'high-color': '#161c24',
                'space-color': '#000000',
                'horizon-blend': 0.05
            });

            // Boş GeoJSON kaynağını ekle
            this.map.addSource('earthquakes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Deprem noktalarını görselleştir
            this.map.addLayer({
                id: 'earthquake-points',
                type: 'circle',
                source: 'earthquakes',
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        1, 4,
                        6, 15,
                        9, 45
                    ],
                    'circle-color': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        3, '#2ecc71',
                        5, '#f1c40f',
                        7, '#e67e22',
                        8, '#c0392b'
                    ],
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.8
                }
            });
        });
    },

    /**
     * Haritadaki deprem verilerini günceller
     * @param {Array} events - Normalize edilmiş deprem verileri
     */
    updateData(events) {
        if (!this.map) return;
        
        const source = this.map.getSource('earthquakes');
        // Kaynak henüz yüklenmemişse (style.load bekliyorsa) işlemi durdur
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: events.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: ev.coordinates },
                properties: { ...ev }
            }))
        });
    }
};

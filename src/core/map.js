import mapboxgl from 'mapbox-gl';

export class MapManager {
    constructor(containerId, token) {
        mapboxgl.accessToken = token;
        
        // --- Senior State Management ---
        this.orbitActive = false;     // Başlangıçta yörünge kapalı
        this.userInteracting = false; // Kullanıcı müdahale takibi
        this.interactionTimeout = null;

        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/satellite-v9', // NASA Blue/Yörünge havası
            center: [35, 39],
            zoom: 2.2,
            projection: 'globe',
            pitch: 45 // 3D perspektif derinliği
        });
    }

    init() {
        this.map.on('style.load', () => {
            // Sismolojik Gözlem Evi Atmosferi
            this.map.setFog({
                'color': 'rgb(11, 11, 25)',
                'high-color': 'rgb(36, 92, 223)',
                'horizon-blend': 0.02,
                'space-color': 'rgb(11, 11, 25)',
                'star-intensity': 0.6
            });
            
            this.initSources();
            this.initLayers();
            this.startOrbitLoop(); // Döngü arka planda hep hazır bekler
        });

        this.setupInteractionListeners();
    }

    // --- TV Modu & Etkileşim Mantığı ---
    setupInteractionListeners() {
        const handleStart = () => {
            this.userInteracting = true;
            clearTimeout(this.interactionTimeout);
        };

        const handleEnd = () => {
            // Kullanıcı bırakınca 3 saniye (3000ms) sonra yörüngeye dön
            this.interactionTimeout = setTimeout(() => {
                this.userInteracting = false;
            }, 3000);
        };

        this.map.on('mousedown', handleStart);
        this.map.on('touchstart', handleStart);
        this.map.on('wheel', handleStart);
        
        this.map.on('mouseup', handleEnd);
        this.map.on('touchend', handleEnd);
    }

    toggleOrbit(isActive) {
        this.orbitActive = isActive;
    }

    startOrbitLoop() {
        const rotate = () => {
            // Şartlar: Buton aktif OLACAK ve Kullanıcı dokunmuyor OLACAK
            if (this.orbitActive && !this.userInteracting) {
                const center = this.map.getCenter();
                center.lng -= 0.12; // Sabit sismik dönüş hızı
                this.map.easeTo({ center, duration: 100, easing: n => n });
            }
            requestAnimationFrame(rotate);
        };
        rotate();
    }

    // --- Bilimsel Veri Katmanları ---
    initSources() {
        this.map.addSource('earthquakes', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
    }

    initLayers() {
        this.map.addLayer({
            id: 'earthquake-points',
            type: 'circle',
            source: 'earthquakes',
            paint: {
                // Jeofiziksel Büyüklük (Logaritmik Alan Artışı)
                'circle-radius': [
                    'interpolate', ['linear'], ['get', 'mag'],
                    1.0, 2,   // Mikro
                    3.0, 5,   // Küçük
                    5.0, 12,  // Orta
                    7.0, 28,  // Güçlü
                    8.5, 55   // Majör/Yıkıcı
                ],
                // Sismolojik Sınıflandırma (Step function ile net eşikler)
                'circle-color': [
                    'step', ['get', 'mag'],
                    '#00d2ff', 3.0,  // <3.0: Mikro (Mavi)
                    '#2ecc71', 4.5,  // 3.0-4.5: Küçük (Yeşil)
                    '#f1c40f', 6.0,  // 4.5-6.0: Orta (Sarı)
                    '#e67e22', 7.2,  // 6.0-7.2: Güçlü (Turuncu)
                    '#ff4b2b'        // >7.2: Majör/Kritik (Kırmızı)
                ],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.85
            }
        });
    }

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

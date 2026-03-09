import mapboxgl from 'mapbox-gl';

export class MapManager {
    constructor(containerId, token) {
        mapboxgl.accessToken = token;
        this.orbitActive = false; // Buton basılana kadar kapalı
        this.userInteracting = false;
        this.interactionTimeout = null;

        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/satellite-v9', // NASA Blue havası için v9 daha uygundur
            center: [35, 39],
            zoom: 2.0,
            projection: 'globe',
            pitch: 45 // Derinlik hissi
        });
    }

    init() {
        this.map.on('style.load', () => {
            // Atmosfer ve Uzay efekti (Eski projedeki o derinlik)
            this.map.setFog({
                color: 'rgb(11, 11, 25)',
                'high-color': 'rgb(36, 92, 223)',
                'horizon-blend': 0.02,
                'space-color': 'rgb(11, 11, 25)',
                'star-intensity': 0.6
            });
            this.initSources();
            this.initLayers();
            this.startOrbit(); // Döngüyü başlat
        });

        // Etkileşim Zekası (3 saniye kuralı)
        const handleInteraction = () => {
            this.userInteracting = true;
            clearTimeout(this.interactionTimeout);
            this.interactionTimeout = setTimeout(() => {
                this.userInteracting = false;
            }, 3000);
        };

        this.map.on('mousedown', handleInteraction);
        this.map.on('touchstart', handleInteraction);
        this.map.on('wheel', handleInteraction);

        // Tıklama olayını (Şık Pop-up) buraya ekledik
        this.map.on('click', 'earthquake-points', (e) => {
            const p = e.features[0].properties;
            // Burayı ilerde UI.js ile birleştirip o büyük kartı açacağız
            new mapboxgl.Popup({ className: 'custom-popup' })
                .setLngLat(e.lngLat)
                .setHTML(`
                    <div style="background: rgba(10,10,10,0.9); color: white; padding: 10px; border: 1px solid #00d2ff;">
                        <h2 style="color: #ff4b2b; margin:0;">${p.mag} Mw</h2>
                        <p>${p.place}</p>
                        <small>Derinlik: ${p.depth}km</small>
                    </div>
                `)
                .addTo(this.map);
        });
    }

    // Yörünge kontrolü için dışardan çağrılacak metod
    toggleOrbit(status) {
        this.orbitActive = status;
    }

    startOrbit() {
        const rotate = () => {
            if (this.orbitActive && !this.userInteracting) {
                const center = this.map.getCenter();
                center.lng -= 0.1; // Dönüş hızı
                this.map.easeTo({ center, duration: 100, easing: n => n });
            }
            requestAnimationFrame(rotate);
        };
        rotate();
    }

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
                // Jeofiziksel Büyüklük Standartları (Renk ve Boyut)
                'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 4, 4, 8, 6, 18, 8, 40],
                'circle-color': [
                    'interpolate', ['linear'], ['get', 'mag'],
                    2, '#00d2ff', // Düşük
                    4, '#f1c40f', // Orta
                    6, '#e67e22', // Yüksek
                    7.5, '#ff4b2b' // Kritik
                ],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.8
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

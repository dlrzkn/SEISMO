import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';
import { UIController } from './ui.js';

const App = {
    state: {
        map: null,
        rawEvents: [],
        filteredEvents: [],
        filters: {
            minMag: 0,
            timeRange: 'day',
            depthFilter: 'all'
        },
        analytics: {
            totalEnergyTJ: 0,
            shallowRatio: 0,
            activeServices: []
        },
        settings: {
            isRotating: true,
            shallowLimit: 70
        }
    },

    async init() {
        this.startClock();
        
        const config = {
            token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
        };

        try {
            this.state.map = await MapEngine.init(config);
            this.attachEventListeners();
            
            // İlk döngü
            await this.dataCycle();
            
            // 2 dakikalık periyotlarla akıllı güncelleme
            setInterval(() => this.dataCycle(), 120000);
            
        } catch (err) {
            console.error("Sistem Başlatma Hatası:", err);
            UIController.updateStatus("SİSTEM HATASI");
        }
    },

    async dataCycle() {
        UIController.updateStatus("TARANIYOR...");
        try {
            const geojson = await EarthquakeService.fetchAndProcess();
            
            // Servis durumlarını analiz et
            this.state.analytics.activeServices = Object.entries(geojson.metadata.services)
                .filter(([_, status]) => status.online)
                .map(([id, _]) => id);

            // Veriyi normalize ederek sakla
            this.state.rawEvents = geojson.features.map(f => ({
                ...f.properties,
                coordinates: f.geometry.coordinates.slice(0, 2),
                depth: f.geometry.coordinates[2] || 0
            }));

            this.applyFilters();

            // Durum çubuğuna servis detaylarını yansıt
            const statusMsg = this.state.analytics.activeServices.length > 0 
                ? `SİNYAL: ${this.state.analytics.activeServices.join(' + ')}`
                : "VERİ YOK";
            UIController.updateStatus(statusMsg);

        } catch (err) {
            console.error("Veri Döngüsü Hatası:", err);
            UIController.updateStatus("BAĞLANTI KESİLDİ");
        }
    },

    applyFilters() {
        const { minMag, timeRange, depthFilter } = this.state.filters;
        const now = Date.now();
        const timeLimits = { 'hour': 3600000, 'day': 86400000, 'week': 604800000 };

        this.state.filteredEvents = this.state.rawEvents.filter(ev => {
            const mMatch = ev.mag >= minMag;
            const tMatch = (now - ev.time) <= timeLimits[timeRange];
            
            let dMatch = true;
            if (depthFilter === 'shallow') dMatch = ev.depth < this.state.settings.shallowLimit;
            else if (depthFilter === 'deep') dMatch = ev.depth >= this.state.settings.shallowLimit;
            
            return mMatch && tMatch && dMatch;
        });

        this.runAnalytics();
        this.syncUI();
    },

    runAnalytics() {
        let totalJoules = 0;
        let shallowCount = 0;

        this.state.filteredEvents.forEach(eq => {
            totalJoules += Math.pow(10, 4.8 + (1.5 * eq.mag));
            if (eq.depth < this.state.settings.shallowLimit) shallowCount++;
        });

        this.state.analytics.totalEnergyTJ = (totalJoules / 1e12).toFixed(2);
        this.state.analytics.shallowRatio = this.state.filteredEvents.length > 0 
            ? ((shallowCount / this.state.filteredEvents.length) * 100).toFixed(1) 
            : 0;

        // YENİ EKLENEN: Enerji UI Güncellemesi (Zamana göre dinamik)
        const energyEl = document.getElementById('energy-total-tj');
        const timeLabelEl = document.getElementById('energy-time-label');
        if (energyEl) energyEl.innerText = this.state.analytics.totalEnergyTJ;
        if (timeLabelEl) {
            const labels = { 'hour': '1S', 'day': '24S', 'week': '7G' };
            timeLabelEl.innerText = labels[this.state.filters.timeRange] || '24S';
        }
    },

    syncUI() {
        if (this.state.map) {
            MapEngine.updateSource('earthquakes', {
                type: 'FeatureCollection',
                features: this.state.filteredEvents.map(ev => ({
                    type: 'Feature',
                    geometry: { 
                        type: 'Point', 
                        coordinates: [...ev.coordinates, ev.depth] 
                    },
                    properties: ev
                }))
            });
        }
        UIController.renderAll(this.state);
    },

    attachEventListeners() {
        // Magnitude Slider
        document.getElementById('mag-slider')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state.filters.minMag = val;
            UIController.updateMagValue(val);
            this.applyFilters();
        });

        // Zaman ve Derinlik Filtreleri
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { time, depth } = e.target.dataset;
                if (time) this.state.filters.timeRange = time;
                if (depth) this.state.filters.depthFilter = depth;
                UIController.updateActiveButtons(e.target);
                this.applyFilters();
            });
        });

        // Levha Sınırları Toggle
        document.getElementById('plate-boundaries')?.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            if (this.state.map?.getLayer('plates-layer')) {
                this.state.map.setLayoutProperty('plates-layer', 'visibility', visibility);
            }
        });

        // Isı Haritası (Heatmap) Toggle
        document.getElementById('heatmap-toggle')?.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            if (this.state.map?.getLayer('earthquakes-heat')) {
                this.state.map.setLayoutProperty('earthquakes-heat', 'visibility', visibility);
            }
        });

        // YENİ UÇUŞ VE POP-UP SİMÜLASYON MOTORU
        window.focusEvent = (coords) => {
            if (!this.state.map) return;
            
            // 1. Alt Paneli Otomatik Kapat ve Harita Sekmesine Geç
            const mapBtn = document.querySelector('.nav-btn[data-target="map"]');
            if(mapBtn && !mapBtn.classList.contains('active')) {
                mapBtn.click();
            }
            document.body.classList.remove('show-layers'); // Katmanlar açıksa kapat

            // 2. Depremin Olduğu Yere Uç
            this.state.map.flyTo({ 
                center: coords, 
                zoom: 8, 
                duration: 2500, 
                essential: true 
            });

            // 3. Uçuş Bittiğinde Otomatik Tıklama Simülasyonu (Pop-up'ı açmak için)
            this.state.map.once('moveend', () => {
                const point = this.state.map.project(coords);
                this.state.map.fire('click', { lngLat: { lng: coords[0], lat: coords[1] }, point: point });
            });
        };

        // Mobil Alt Menü Navigasyonu
        this.setupMobileNavigation();
    },

    setupMobileNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const body = document.body;

        // Başlangıç durumu: Uygulama ilk açıldığında harita aktif olsun
        if (window.innerWidth <= 1024) {
            body.classList.add('tab-map');
        }

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currentBtn = e.currentTarget;
                const target = currentBtn.getAttribute('data-target');
                const isAlreadyActive = currentBtn.classList.contains('active');

                // 1. Tıklanan sekme "Harita" ise
                if (target === 'map') {
                    if (isAlreadyActive) {
                        // Haritadayken bir daha basarsa Katman panelini aç/kapat
                        body.classList.toggle('show-layers');
                    } else {
                        // Temiz haritaya geç
                        body.classList.remove('tab-analysis', 'tab-list', 'show-layers');
                        body.classList.add('tab-map');
                    }
                } 
                // 2. Tıklanan sekme "Analiz" veya "Liste" ise
                else {
                    if (isAlreadyActive) {
                        // Açık olan panele tekrar basıldı, kapat ve haritaya dön
                        document.querySelector('.nav-btn[data-target="map"]').click();
                        return;
                    } else {
                        // İlgili sekmeyi aç
                        body.classList.remove('tab-map', 'tab-analysis', 'tab-list', 'show-layers');
                        body.classList.add(`tab-${target}`);
                    }
                }

                // Aktif buton görselini güncelle
                navButtons.forEach(b => b.classList.remove('active'));
                currentBtn.classList.add('active');

                // Mapbox haritasının boyutlarını güncelle (gri ekran hatasını önler)
                if (this.state.map) {
                    setTimeout(() => {
                        this.state.map.resize();
                    }, 50);
                }
            });
        });
    },

    startClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;
        setInterval(() => {
            clockEl.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    }
};

App.init();


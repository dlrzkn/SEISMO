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

        window.focusEvent = (coords) => {
            this.state.map?.flyTo({ 
                center: coords, 
                zoom: 8, 
                duration: 2500, 
                essential: true 
            });
        };

        // YENİ EKLENEN: Mobil Alt Menü Navigasyonu
        this.setupMobileNavigation();
    },

    setupMobileNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const panels = {
            'map': document.getElementById('map'),
            'control-sidebar': document.querySelector('.control-sidebar'),
            'feed-sidebar': document.querySelector('.feed-sidebar')
        };

        // Eğer ekran mobil boyutlarındaysa ve harita div'i varsa başlangıçta haritayı aktif et
        if (window.innerWidth <= 768 && panels['map']) {
            panels['map'].classList.add('mobile-active');
        }

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 1. Sekmelerdeki "active" sınıfını temizle ve tıklanana ekle
                navButtons.forEach(b => b.classList.remove('active'));
                const currentBtn = e.currentTarget;
                currentBtn.classList.add('active');

                // 2. Hedef paneli bul
                const targetId = currentBtn.getAttribute('data-target');
                
                // 3. Tüm panelleri gizle
                Object.values(panels).forEach(panel => {
                    if (panel) panel.classList.remove('mobile-active');
                });
                
                // 4. İlgili paneli göster
                if (panels[targetId]) {
                    panels[targetId].classList.add('mobile-active');
                    
                    // Mapbox Resize Tetikleyicisi (Harita sekmesine dönüldüğünde çökmemesi için)
                    if (targetId === 'map' && this.state.map) {
                        setTimeout(() => {
                            this.state.map.resize();
                        }, 50);
                    }
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


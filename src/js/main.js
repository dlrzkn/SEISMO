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
            shallowRatio: 0
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
            // Map Engine başlatma ve state'e atama
            this.state.map = await MapEngine.init(config);
            
            this.attachEventListeners();
            
            // İlk veri çekme işlemi
            await this.dataCycle();
            
            // 2 dakikalık periyotlarla güncelleme (120000ms)
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
            
            // Sadece gerekli property'leri state'e aktararak bellek kullanımını minimize etme
            this.state.rawEvents = geojson.features.map(f => ({
                ...f.properties,
                coordinates: f.geometry.coordinates.slice(0, 2), // [lng, lat]
                depth: f.geometry.coordinates[2] || 0
            }));

            this.applyFilters();
            UIController.updateStatus("GÜÇLÜ");
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
            // Richter - Joule Dönüşümü: E = 10^(4.8 + 1.5M)
            totalJoules += Math.pow(10, 4.8 + (1.5 * eq.mag));
            if (eq.depth < this.state.settings.shallowLimit) shallowCount++;
        });

        this.state.analytics.totalEnergyTJ = (totalJoules / 1e12).toFixed(2);
        this.state.analytics.shallowRatio = this.state.filteredEvents.length > 0 
            ? ((shallowCount / this.state.filteredEvents.length) * 100).toFixed(1) 
            : 0;
    },

    syncUI() {
        // Harita kaynağını yeni FeatureCollection ile güncelle
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

        // UI Bileşenlerini render et
        UIController.renderAll(this.state);
    },

    attachEventListeners() {
        // Magnitude Slider Kontrolü
        document.getElementById('mag-slider')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state.filters.minMag = val;
            UIController.updateMagValue(val);
            this.applyFilters();
        });

        // Zaman ve Derinlik Filtre Butonları
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { time, depth } = e.target.dataset;
                if (time) this.state.filters.timeRange = time;
                if (depth) this.state.filters.depthFilter = depth;
                
                UIController.updateActiveButtons(e.target);
                this.applyFilters();
            });
        });

        // Tektonik Plaka Katman Kontrolü
        document.getElementById('plate-boundaries')?.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            if (this.state.map.getLayer('plates-layer')) {
                this.state.map.setLayoutProperty('plates-layer', 'visibility', visibility);
            }
        });

        // Global Odaklanma Event'i (Listeden haritaya uçuş)
        window.focusEvent = (coords) => {
            this.state.map.flyTo({ 
                center: coords, 
                zoom: 8, 
                duration: 2500, 
                essential: true 
            });
        };
    },

    startClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;
        
        setInterval(() => {
            clockEl.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    }
};

// Uygulama Giriş Noktası
App.init();

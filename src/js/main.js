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
        // Saati her şeyden önce başlat (Arayüzün yaşadığını görelim)
        this.startClock();
        
        const config = {
            token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
        };

        try {
            // 1. Haritayı Başlat
            this.state.map = await MapEngine.init(config);
            
            // 2. Olay Dinleyicileri Kur
            this.attachEventListeners();

            // 3. İlk Veriyi Çek ve İşle
            await this.dataCycle();

            // Periyodik Güncelleme (2 dk)
            setInterval(() => this.dataCycle(), 120000);

        } catch (err) {
            console.error("Uygulama başlatma hatası:", err);
            UIController.updateStatus("SİSTEM HATASI");
        }
    },

    async dataCycle() {
        UIController.updateStatus("TARANIYOR...");
        try {
            const geojson = await EarthquakeService.fetchAndProcess();
            this.state.rawEvents = geojson.features.map(f => f.properties);
            
            this.applyFilters();
            UIController.updateStatus("GÜÇLÜ SİNYAL");
        } catch (err) {
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
            if (depthFilter === 'deep') dMatch = ev.depth >= this.state.settings.shallowLimit;
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
        // Haritayı Güncelle
        MapEngine.updateSource('earthquakes', {
            type: 'FeatureCollection',
            features: this.state.filteredEvents.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [...ev.coordinates, ev.depth] },
                properties: ev
            }))
        });

        // Arayüzü Güncelle (Yeni state yapısına göre)
        UIController.renderAll(this.state);
    },

    attachEventListeners() {
        // Slider
        document.getElementById('mag-slider')?.addEventListener('input', (e) => {
            this.state.filters.minMag = parseFloat(e.target.value);
            UIController.updateMagValue(e.target.value);
            this.applyFilters();
        });

        // Filtre Butonları
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { time, depth } = e.target.dataset;
                if (time) this.state.filters.timeRange = time;
                if (depth) this.state.filters.depthFilter = depth;
                
                UIController.updateActiveButtons(e.target);
                this.applyFilters();
            });
        });

        window.focusEvent = (coords) => {
            this.state.map.flyTo({ center: coords, zoom: 8, duration: 2500, essential: true });
        };
    },

    startClock() {
        setInterval(() => {
            const clock = document.getElementById('clock');
            if (clock) clock.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    }
};

App.init();

import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';
import { UIController } from './ui.js';

const App = {
    // 1. UYGULAMA DURUMU (STATE)
    state: {
        map: null,
        rawEvents: [],      // Ham veri
        filteredEvents: [], // Filtrelenmiş veri
        filters: {
            minMag: 0,
            timeRange: 'day',
            depthFilter: 'all'
        },
        settings: {
            isRotating: true,
            shallowLimit: 70
        }
    },

    // 2. BAŞLATICI
    async init() {
        console.log("SeismoPro Başlatılıyor...");
        
        const config = {
            token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
        };

        // Haritayı yükle ve state'e kaydet
        this.state.map = await MapEngine.init(config);

        // Olay dinleyicileri (Slider, Butonlar)
        this.attachEventListeners();

        // İlk veri çekme döngüsü
        await this.dataCycle();

        // Periyodik güncelleme (Her 2 dakikada bir)
        setInterval(() => this.dataCycle(), 120000);

        // Saat döngüsü
        this.startClock();
    },

    // 3. VERİ DÖNGÜSÜ
    async dataCycle() {
        UIController.updateStatus("TARANIYOR...");
        try {
            const geojson = await EarthquakeService.fetchAndProcess();
            // GeoJSON içindeki ham özellikleri alalım
            this.state.rawEvents = geojson.features.map(f => f.properties);
            
            this.applyFilters();
            UIController.updateStatus("ONLINE");
        } catch (err) {
            UIController.updateStatus("BAĞLANTI HATASI");
            console.error("Data Cycle Error:", err);
        }
    },

    // 4. FİLTRELEME MANTIĞI
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

        // Veriyi güncelle (Harita + Liste + Analiz)
        this.syncUI();
    },

    // 5. TÜM BİLEŞENLERİ SENKRONİZE ET
    syncUI() {
        // Haritadaki kaynağı güncelle
        MapEngine.updateSource('earthquakes', {
            type: 'FeatureCollection',
            features: this.state.filteredEvents.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [...ev.coordinates, ev.depth] },
                properties: ev
            }))
        });

        // UI bileşenlerini güncelle
        UIController.renderAll(this.state.filteredEvents, this.state.settings.shallowLimit);
    },

    // 6. OLAY DİNLEYİCİLERİ
    attachEventListeners() {
        // Mag Slider
        const slider = document.getElementById('mag-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.state.filters.minMag = parseFloat(e.target.value);
                UIController.updateMagValue(e.target.value);
                this.applyFilters();
            });
        }

        // Zaman ve Derinlik Butonları
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { time, depth } = e.target.dataset;
                
                if (time) this.state.filters.timeRange = time;
                if (depth) this.state.filters.depthFilter = depth;

                // Aktif buton görselini güncelle
                UIController.updateActiveButtons(e.target);
                this.applyFilters();
            });
        });

        // Global Odaklanma (Listeden tıklayınca)
        window.focusEvent = (coords) => {
            this.state.map.flyTo({ center: coords, zoom: 8, duration: 2000, essential: true });
        };
    },

    startClock() {
        setInterval(() => {
            const clock = document.getElementById('clock');
            if (clock) clock.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    }
};

// Uygulamayı başlat
App.init();

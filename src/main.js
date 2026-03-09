import { MapManager } from './core/map.js';
import { UIManager } from './components/ui.js';

class App {
    constructor() {
        this.ui = new UIManager();
        this.map = new MapManager('map', 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'); // Token'ını buraya ekle
        this.rawEvents = [];
        this.filters = { mag: 0, time: 'day', depth: 'all' };
        this.init();
    }

    async init() {
        this.ui.renderSkeleton();
        this.map.init();
        
        // Olay Dinleyicileri (Filtreler ve Butonlar)
        this.setupListeners();
        
        // Veri Döngüsü (Her 60 saniyede bir güncelle)
        await this.fetchData();
        setInterval(() => this.fetchData(), 60000);
        
        // Sayaç Başlat (Son Güncelleme)
        this.startUpdateTimer();
    }

    async fetchData() {
        try {
            // Sadece USGS ve EMSC (Kandilli Kesinlikle Yok)
            const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
            const data = await response.json();
            
            this.rawEvents = data.features.map(f => ({
                id: f.id,
                mag: f.properties.mag,
                place: f.properties.place,
                time: new Date(f.properties.time).toLocaleTimeString('tr-TR'),
                timestamp: f.properties.time,
                coordinates: f.geometry.coordinates,
                depth: f.geometry.coordinates[2],
                source: f.properties.sources.split(',')[0].toUpperCase()
            }));

            this.applyFilters();
            this.calculateAnalytics();
        } catch (error) {
            console.error("Veri çekme hatası:", error);
            document.getElementById('connection-status').innerText = "SİNYAL: ZAYIF";
            document.getElementById('connection-status').style.background = "#ff4b2b";
        }
    }

    applyFilters() {
        let filtered = this.rawEvents.filter(ev => ev.mag >= this.filters.mag);

        if (this.filters.depth === 'shallow') filtered = filtered.filter(ev => ev.depth <= 70);
        if (this.filters.depth === 'deep') filtered = filtered.filter(ev => ev.depth > 70);

        this.ui.updateFeed(filtered);
        this.map.updateData(filtered);
        this.calculateAnalytics(filtered);
    }

    calculateAnalytics(events = this.rawEvents) {
        // Enerji Hesaplama (Logaritmik Mw -> Joule -> Terajoule)
        let totalJoule = 0;
        events.forEach(ev => {
            const joule = Math.pow(10, 1.5 * ev.mag + 4.8);
            totalJoule += joule;
        });
        const totalTJ = (totalJoule / 1e12).toFixed(2);
        document.getElementById('total-energy').innerText = `${totalTJ} TJ`;

        // Derinlik Analizi
        const shallow = events.filter(e => e.depth <= 70).length;
        const total = events.length || 1;
        const shallowPct = ((shallow / total) * 100).toFixed(1);
        
        document.getElementById('shallow-pct').innerText = shallowPct;
        document.getElementById('deep-pct').innerText = (100 - shallowPct).toFixed(1);
        document.getElementById('depth-bar-fill').style.width = `${shallowPct}%`;
    }

    setupListeners() {
        // Büyüklük Slider
        document.getElementById('mag-slider').addEventListener('input', (e) => {
            this.filters.mag = parseFloat(e.target.value);
            document.getElementById('mag-value').innerText = `${this.filters.mag.toFixed(1)} Mw`;
            this.applyFilters();
        });

        // Yörünge Toggle
        document.getElementById('rotation-toggle').addEventListener('click', (e) => {
            const isActive = e.target.classList.toggle('active');
            e.target.innerText = isActive ? "YÖRÜNGE: AKTİF" : "YÖRÜNGE: PASİF";
            this.map.toggleOrbit(isActive);
        });

        // Derinlik Filtreleri
        document.querySelectorAll('[data-depth]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-depth]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filters.depth = e.target.dataset.depth;
                this.applyFilters();
            });
        });
    }

    startUpdateTimer() {
        let seconds = 0;
        setInterval(() => {
            seconds++;
            document.getElementById('last-update').innerText = `SON GÜNCELLEME: ${seconds}s ÖNCE`;
            if (seconds >= 60) seconds = 0;
        }, 1000);
    }
}

new App();

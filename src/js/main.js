import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';
import { UIController } from './ui.js'; // Görseldeki dizine göre güncelledim

const App = {
    // 1. Durum Yönetimi (Referans kodundan gelen güç)
    state: {
        map: null,
        rawGeoJSON: null,
        filters: {
            minMag: 0,
            depthLimit: 70, // Sığ/Derin sınırı (km)
            timeRange: 'day'
        },
        analytics: {
            totalEnergyTJ: 0,
            shallowRatio: 0
        }
    },

    async init() {
        const config = {
            token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
        };

        // 2. Haritayı Başlat ve Yüklenmesini Bekle
        this.state.map = await MapEngine.init(config);

        // 3. İlk Veri Döngüsünü Başlat
        await this.refreshData();

        // 4. Periyodik Güncelleme (Referans: refreshInterval)
        setInterval(() => this.refreshData(), 120000); // 2 dakikada bir

        // 5. UI Dinleyicilerini Bağla
        this.setupEventListeners();
    },

    async refreshData() {
        console.log("Sismik veriler taranıyor...");
        
        // Servisten GeoJSON formatında temiz veriyi al
        const geoData = await EarthquakeService.fetchAndProcess();
        this.state.rawGeoJSON = geoData;

        // Bilimsel Analizleri Yap (Referans kodundaki mantık)
        this.runScientificAnalysis(geoData.features);

        // Haritayı ve Arayüzü Güncelle
        MapEngine.updateSource('earthquakes', geoData);
        UIController.renderAll(this.state);
    },

    // --- REFERANS KODUNDAKİ BİLİMSEL MOTOR ---
    runScientificAnalysis(features) {
        let totalJoules = 0;
        let shallowCount = 0;

        features.forEach(f => {
            const eq = f.properties;
            // Gutenberg-Richter Enerji Formülü: Log(E) = 4.8 + 1.5M
            totalJoules += Math.pow(10, 4.8 + (1.5 * eq.mag));
            
            if (eq.depth < this.state.filters.depthLimit) shallowCount++;
        });

        this.state.analytics.totalEnergyTJ = (totalJoules / 1e12).toFixed(2);
        this.state.analytics.shallowRatio = features.length > 0 
            ? ((shallowCount / features.length) * 100).toFixed(1) 
            : 0;
    },

    setupEventListeners() {
        // Global focus event (Listeden tıklama)
        window.focusEvent = (coords, zoom = 8) => {
            this.state.map.flyTo({ 
                center: coords, 
                zoom: zoom, 
                duration: 2500, 
                essential: true 
            });
        };

        // Pencere yeniden boyutlandırma koruması (Tablet/Mobil)
        window.addEventListener('resize', () => this.state.map.resize());
    }
};

// Uygulamayı Ateşle
App.init();

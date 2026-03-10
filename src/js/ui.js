// SEISMO/src/js/ui.js

export const UIController = {
    state: {
        minMag: 0,
        timeRange: 'day',
        depthFilter: 'all',
        isRotating: true,
        userInteracting: false
    },

    init(map, rawData) {
        this.map = map;
        this.rawData = rawData;
        
        this.initClock();
        this.attachListeners();
        this.update(rawData);
    },

    // 1. ANALİZ: Enerji ve Derinlik Hesaplama
    update(data) {
        const filtered = this.applyFilters(data);
        this.renderStats(filtered);
        this.renderFeed(filtered);
        this.updateMap(filtered);
    },

    applyFilters(data) {
        const now = Date.now();
        const timeLimits = { 'hour': 3600000, 'day': 86400000, 'week': 604800000 };
        
        return data.filter(ev => {
            const mMatch = ev.mag >= this.state.minMag;
            const tMatch = (now - ev.time) <= timeLimits[this.state.timeRange];
            let dMatch = true;
            if (this.state.depthFilter === 'shallow') dMatch = ev.depth < 70;
            if (this.state.depthFilter === 'deep') dMatch = ev.depth >= 70;
            return mMatch && tMatch && dMatch;
        });
    },

    // 2. GÖRSELLEŞTİRME: Enerji (TJ) ve Grafik
    renderStats(data) {
        let totalJ = 0;
        data.forEach(ev => totalJ += Math.pow(10, 4.8 + (1.5 * ev.mag)));
        
        const energyEl = document.getElementById('total-energy');
        if (energyEl) energyEl.innerText = `${(totalJ / 1e12).toFixed(2)} TJ`;

        const shallowCount = data.filter(e => e.depth < 70).length;
        const ratio = data.length > 0 ? (shallowCount / data.length) * 100 : 0;
        
        const analysisBox = document.getElementById('depth-analysis');
        if (analysisBox) {
            analysisBox.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px;">
                    <span style="color: #ff4d4d">SIĞ: %${ratio.toFixed(1)}</span>
                    <span style="color: #3498db">DERİN: %${(100-ratio).toFixed(1)}</span>
                </div>
                <div class="depth-viz-container">
                    <div class="depth-bar" style="width: ${ratio}%; background: #ff4d4d;"></div>
                    <div class="depth-bar" style="width: ${100-ratio}%; background: #3498db;"></div>
                </div>`;
        }
    },

    // 3. LİSTELEME: Sağ Menü Deprem Akışı
    renderFeed(data) {
        const container = document.getElementById('earthquake-feed');
        const countEl = document.getElementById('event-count');
        if (!container || !countEl) return;

        countEl.innerText = data.length;
        container.innerHTML = data.map(ev => `
            <div class="earthquake-node" onclick="window.focusEvent(${ev.coordinates})">
                <div class="source-tag">${ev.source}</div>
                <div class="mag-badge" style="color: ${this.getMagColor(ev.mag)}">
                    <div style="font-weight: 800; font-size: 16px;">${ev.mag.toFixed(1)}</div>
                    <div style="font-size: 8px;">Mw</div>
                </div>
                <div class="node-info">
                    <div style="font-size: 13px; font-weight: 600;">${ev.place}</div>
                    <div style="font-size: 11px; color: #777;">${ev.depth.toFixed(1)} km • ${new Date(ev.time).toLocaleTimeString('tr-TR')}</div>
                </div>
            </div>
        `).join('');
    },

    // Yardımcı Fonksiyonlar
    getMagColor: m => m >= 7 ? '#c0392b' : m >= 5 ? '#e67e22' : m >= 3 ? '#f1c40f' : '#2ecc71',
    
    initClock() {
        setInterval(() => {
            const clockEl = document.getElementById('clock');
            if (clockEl) clockEl.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    },

    attachListeners() {
        // Mag Slider
        const slider = document.getElementById('mag-slider');
        if (slider) {
            slider.oninput = (e) => {
                this.state.minMag = parseFloat(e.target.value);
                document.getElementById('mag-value').innerText = e.target.value + " Mw";
                this.update(this.rawData);
            };
        }

        // Zaman ve Derinlik Butonları
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                const target = e.target;
                if (target.dataset.time) this.state.timeRange = target.dataset.time;
                if (target.dataset.depth) this.state.depthFilter = target.dataset.depth;
                
                target.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                this.update(this.rawData);
            };
        });
    },

    updateMap(data) {
        const geojson = {
            type: 'FeatureCollection',
            features: data.map(ev => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: ev.coordinates },
                properties: { ...ev }
            }))
        };
        if (this.map.getSource('earthquakes')) {
            this.map.getSource('earthquakes').setData(geojson);
        }
    }
};


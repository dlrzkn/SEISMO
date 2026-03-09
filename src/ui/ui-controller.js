/**
 * UI Controller - Kullanıcı Arayüzü ve Etkileşim Yönetimi
 */
export const UIController = {
    elements: {
        clock: document.getElementById('clock'),
        feed: document.getElementById('earthquake-feed'),
        count: document.getElementById('event-count'),
        totalEnergy: document.getElementById('total-energy'),
        depthAnalysis: document.getElementById('depth-analysis'),
        magSlider: document.getElementById('mag-slider'),
        magValue: document.getElementById('mag-value'),
        lastUpdate: document.getElementById('last-update')
    },

    init() {
        this.startClock();
        this.attachListeners();
        console.log("UI Controller aktive edildi.");
    },

    /**
     * Sistem saatini günceller
     */
    startClock() {
        setInterval(() => {
            if (this.elements.clock) {
                this.elements.clock.innerText = new Date().toLocaleTimeString('tr-TR');
            }
        }, 1000);
    },

    /**
     * Deprem listesini (Feed) oluşturur
     */
    renderFeed(events) {
        if (!this.elements.feed) return;
        this.elements.feed.innerHTML = '';
        this.elements.count.innerText = events.length;

        events.forEach(ev => {
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            const color = this.getMagColor(ev.mag);
            
            node.innerHTML = `
                <div class="source-tag">${ev.source}</div>
                <div class="mag-badge" style="border-left: 3px solid ${color}; padding-left: 8px;">
                    <div style="font-weight: 800; font-size: 16px; color: ${color};">${ev.mag.toFixed(1)}</div>
                    <div style="font-size: 8px; color: var(--text-secondary);">Mw</div>
                </div>
                <div class="node-info">
                    <div style="font-size: 13px; font-weight: 600;">${ev.place}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">
                        ${ev.depth.toFixed(1)} km • ${new Date(ev.time).toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            `;
            this.elements.feed.appendChild(node);
        });
    },

    /**
     * Enerji ve derinlik analizlerini hesaplar
     */
    updateAnalytics(events) {
        // Enerji Hesaplama (TJ)
        let totalJ = 0;
        events.forEach(ev => totalJ += Math.pow(10, 4.8 + (1.5 * ev.mag)));
        if (this.elements.totalEnergy) {
            this.elements.totalEnergy.innerText = `${(totalJ / 1e12).toFixed(2)} TJ`;
        }

        // Derinlik Analizi
        const shallow = events.filter(e => e.depth < 70).length;
        const ratio = events.length > 0 ? (shallow / events.length) * 100 : 0;
        
        if (this.elements.depthAnalysis) {
            this.elements.depthAnalysis.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px;">
                    <span style="color: #ff4d4d">SIĞ: %${ratio.toFixed(1)}</span>
                    <span style="color: #3498db">DERİN: %${(100 - ratio).toFixed(1)}</span>
                </div>
                <div class="depth-viz-container">
                    <div class="depth-bar" style="width: ${ratio}%; background: #ff4d4d;"></div>
                    <div class="depth-bar" style="width: ${100 - ratio}%; background: #3498db;"></div>
                </div>
            `;
        }
    },

    /**
     * Olay dinleyicilerini bağlar
     */
       attachListeners() {
        if (this.elements.magSlider) {
            this.elements.magSlider.oninput = (e) => {
                const val = e.target.value;
                this.elements.magValue.innerText = `${val} Mw`;
                
                // Global bir event yayınlayarak main.js'in haberdar olmasını sağlayalım
                window.dispatchEvent(new CustomEvent('seismo:filter', { detail: { minMag: val } }));
            };
        }
    },


    getMagColor: m => m >= 7 ? '#c0392b' : m >= 5 ? '#e67e22' : m >= 3 ? '#f1c40f' : '#2ecc71',

    setLoading(status) {
        const indicator = document.querySelector('.status-tag');
        if (indicator) indicator.innerText = status ? "TARANIYOR..." : "SİNYAL: GÜÇLÜ";
    }
};


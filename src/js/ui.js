export const UIController = {
    // DOM Elementlerini cache'liyoruz
    els: {
        feed: document.getElementById('earthquake-feed'),
        count: document.getElementById('event-count'),
        energy: document.getElementById('total-energy'),
        analysis: document.getElementById('depth-analysis'),
        magSlider: document.getElementById('mag-slider'),
        magValue: document.getElementById('mag-value'),
        status: document.getElementById('connection-status')
    },

    /**
     * Tüm arayüzü tek seferde render eden ana fonksiyon.
     * @param {Object} appState - main.js'deki merkezi state objesi
     */
    renderAll(appState) {
        // Filtrelenmiş verileri listeye bas
        this.renderFeed(appState.filteredEvents);
        
        // Bilimsel analiz panelini güncelle
        this.renderAnalytics(appState.analytics);
        
        // Sayaçları güncelle
        if (this.els.count) this.els.count.innerText = appState.filteredEvents.length;
    },

    // 1. SOL LİSTE (Sismik Akış)
    renderFeed(events) {
        if (!this.els.feed) return;
        this.els.feed.innerHTML = '';

        events.forEach(eq => {
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            const color = this.getMagColor(eq.mag);

            node.innerHTML = `
                <div class="mag-badge" style="border-color: ${color}; color: ${color};">
                    <div class="mag-val">${parseFloat(eq.mag).toFixed(1)}</div>
                    <div class="mag-type">${eq.magType || 'Mw'}</div>
                </div>
                <div class="node-info">
                    <div class="node-place">${eq.place}</div>
                    <div class="node-meta">
                        ${eq.depth.toFixed(1)} km • ${new Date(eq.time).toLocaleTimeString('tr-TR')}
                        <span class="source-tag-inline">/ ${eq.source}</span>
                    </div>
                </div>
            `;

            // Listeye tıklayınca haritada odaklan (main.js'deki global event)
            node.onclick = () => window.focusEvent(eq.coordinates, 9);
            this.els.feed.appendChild(node);
        });
    },

    // 2. BİLİMSEL ANALİZ PANELİ (Enerji ve Sığ/Derin Oranı)
    renderAnalytics(analytics) {
        if (this.els.energy) this.els.energy.innerText = `${analytics.totalEnergyTJ} TJ`;
        
        if (this.els.analysis) {
            const ratio = analytics.shallowRatio;
            this.els.analysis.innerHTML = `
                <div class="analysis-labels" style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px;">
                    <span style="color: var(--danger)">SIĞ: %${ratio}</span>
                    <span style="color: var(--accent)">DERİN: %${(100 - ratio).toFixed(1)}</span>
                </div>
                <div class="depth-viz-container">
                    <div class="depth-bar-shallow" style="width: ${ratio}%; background: var(--danger); height: 100%;"></div>
                    <div class="depth-bar-deep" style="width: ${100 - ratio}%; background: var(--accent); height: 100%;"></div>
                </div>
            `;
        }
    },

    // 3. YARDIMCI GÜNCELLEMELER
    updateMagValue(val) {
        if (this.els.magValue) this.els.magValue.innerText = `${parseFloat(val).toFixed(1)} Mw`;
    },

    updateStatus(text) {
        if (this.els.status) this.els.status.innerText = text;
    },

    // Büyüklüğe göre sismolojik renk skalası (Scientific Standard)
    getMagColor(mag) {
        if (mag < 3) return '#00d2ff'; // Minor (NASA Blue)
        if (mag < 5) return '#fceb5e'; // Moderate
        if (mag < 7) return '#ff9100'; // Strong
        return '#ff1744';             // Major
    }
};

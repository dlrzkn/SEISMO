export const UIController = {
    // DOM Elementlerini cache'liyoruz (Hız için sürekli querySelector yapmıyoruz)
    els: {
        feed: document.getElementById('earthquake-feed'),
        count: document.getElementById('event-count'),
        energy: document.getElementById('total-energy'),
        analysis: document.getElementById('depth-analysis'),
        magSlider: document.getElementById('mag-slider'),
        magValue: document.getElementById('mag-value')
    },

    // Tüm arayüzü tek seferde render eden ana fonksiyon
    renderAll(state) {
        this.renderFeed(state.rawGeoJSON.features);
        this.renderAnalytics(state.analytics);
        this.updateStats(state.rawGeoJSON.features.length);
    },

    // 1. SOL LİSTE (Feed)
    renderFeed(features) {
        if (!this.els.feed) return;
        this.els.feed.innerHTML = '';

        features.forEach(f => {
            const eq = f.properties;
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            const color = this.getMagColor(eq.mag);

            node.innerHTML = `
                <div class="source-tag">${eq.source}</div>
                <div class="mag-badge" style="border-color: ${color}; color: ${color};">
                    <div class="mag-val">${parseFloat(eq.mag).toFixed(1)}</div>
                    <div class="mag-type">${eq.magType || 'Mw'}</div>
                </div>
                <div class="node-info">
                    <div class="node-place">${eq.place}</div>
                    <div class="node-meta">
                        ${eq.depth.toFixed(1)} km • ${new Date(eq.time).toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            `;

            // Listeye tıklayınca haritada uçma (main.js'deki global focusEvent)
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
                <div class="analysis-labels">
                    <span class="label-shallow">SIĞ: %${ratio}</span>
                    <span class="label-deep">DERİN: %${(100 - ratio).toFixed(1)}</span>
                </div>
                <div class="depth-viz-container">
                    <div class="depth-bar-shallow" style="width: ${ratio}%"></div>
                    <div class="depth-bar-deep" style="width: ${100 - ratio}%"></div>
                </div>
            `;
        }
    },

    updateStats(count) {
        if (this.els.count) this.els.count.innerText = count;
    },

    // Büyüklüğe göre sismolojik renk skalası (Scientific Standard)
    getMagColor(mag) {
        if (mag < 3) return '#5efc82'; // Minor
        if (mag < 5) return '#fceb5e'; // Moderate
        if (mag < 7) return '#ff9100'; // Strong
        return '#ff1744'; // Major
    }
};


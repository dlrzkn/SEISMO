export const UIController = {
    els: {
        feed: document.getElementById('earthquake-feed'),
        count: document.getElementById('event-count'),
        energy: document.getElementById('total-energy'),
        analysis: document.getElementById('depth-analysis'),
        magSlider: document.getElementById('mag-slider'),
        magValue: document.getElementById('mag-value'),
        status: document.getElementById('connection-status')
    },

    renderAll(appState) {
        this.renderFeed(appState.filteredEvents);
        this.renderAnalytics(appState.analytics);
        if (this.els.count) this.els.count.innerText = appState.filteredEvents.length;
    },

    // 1. SAĞ LİSTE (Görseldeki Badge Yapısı)
    renderFeed(events) {
        if (!this.els.feed) return;
        this.els.feed.innerHTML = '';

        events.forEach(eq => {
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            const color = this.getMagColor(eq.mag);

            // Büyüklüğün sol tarafta dikey durduğu o şık yapı
            node.innerHTML = `
                <div class="mag-section" style="border-left: 3px solid ${color};">
                    <div class="mag-value" style="color: ${color}">${parseFloat(eq.mag).toFixed(1)}</div>
                    <div class="mag-type">${eq.magType || 'MW'}</div>
                </div>
                <div class="info-section">
                    <div class="place-name">${eq.place}</div>
                    <div class="meta-data">
                        ${parseFloat(eq.depth).toFixed(1)} km • ${new Date(eq.time).toLocaleTimeString('tr-TR')}
                        <span class="source-tag">/ ${eq.source}</span>
                    </div>
                </div>
            `;

            node.onclick = () => window.focusEvent(eq.coordinates, 9);
            this.els.feed.appendChild(node);
        });
    },

    // 2. SOL ALT ANALİZ (Renkli Derinlik Barı)
    renderAnalytics(analytics) {
        if (this.els.energy) this.els.energy.innerText = `${analytics.totalEnergyTJ} TJ`;
        
        if (this.els.analysis) {
            const ratio = analytics.shallowRatio;
            this.els.analysis.innerHTML = `
                <div class="analysis-header" style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; font-weight: 700;">
                    <span style="color: #ff4d4d">SIĞ: %${ratio}</span>
                    <span style="color: #00d2ff">DERİN: %${(100 - ratio).toFixed(1)}</span>
                </div>
                <div class="depth-viz-container" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; display: flex;">
                    <div class="depth-bar-shallow" style="width: ${ratio}%; background: #ff4d4d; height: 100%; transition: width 0.5s ease;"></div>
                    <div class="depth-bar-deep" style="width: ${100 - ratio}%; background: #00d2ff; height: 100%; transition: width 0.5s ease;"></div>
                </div>
            `;
        }
    },

    updateMagValue(val) {
        if (this.els.magValue) this.els.magValue.innerText = `${parseFloat(val).toFixed(1)} Mw`;
    },

    updateStatus(text) {
        if (this.els.status) this.els.status.innerText = text;
    },

    updateActiveButtons(clickedBtn) {
        const parent = clickedBtn.parentElement;
        if (parent) {
            parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');
        }
    },

    getMagColor(mag) {
        if (mag < 3) return '#00d2ff'; // NASA Blue
        if (mag < 5) return '#fceb5e'; // Moderate
        if (mag < 7) return '#ff9100'; // Strong
        return '#ff4d4d';             // Major
    }
};

export const UIController = {
    els: {
        feed: document.getElementById('earthquake-feed'),
        count: document.getElementById('event-count'),
        energy: document.getElementById('total-energy'),
        energyTimerange: document.getElementById('energy-timerange'),
        analysis: document.getElementById('depth-analysis'),
        magSlider: document.getElementById('mag-slider'),
        magValue: document.getElementById('mag-value'),
        status: document.getElementById('connection-status'),
        clock: document.getElementById('clock')
    },

    renderAll(appState) {
        this.renderFeed(appState.filteredEvents);
        this.renderAnalytics(appState.analytics);
        if (this.els.count) this.els.count.innerText = appState.filteredEvents.length;
        if (this.els.energyTimerange) {
            const labels = { 'hour': '1S', 'day': '24S', 'week': '7G' };
            this.els.energyTimerange.innerText = labels[appState.filters.timeRange];
        }
    },

    // SAĞ LİSTE: Senin o sevdiğin dikey badge tasarımı
    renderFeed(events) {
        if (!this.els.feed) return;
        this.els.feed.innerHTML = '';

        events.forEach(eq => {
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            const color = this.getMagColor(eq.mag);

            node.innerHTML = `
                <div class="source-tag">${eq.source}</div>
                <div class="mag-block" style="border-left: 3px solid ${color}; padding-left: 10px;">
                    <div style="color: ${color}; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 18px;">
                        ${parseFloat(eq.mag).toFixed(1)}
                    </div>
                    <div style="font-size: 8px; color: var(--text-secondary);">${eq.magType || 'MW'}</div>
                </div>
                <div class="node-info">
                    <div class="node-place" style="font-size: 12px; font-weight: 600; color: #fff;">${eq.place}</div>
                    <div class="node-meta" style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
                        ${parseFloat(eq.depth).toFixed(1)} km • ${new Date(eq.time).toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            `;

            node.onclick = () => window.focusEvent(eq.coordinates, 9);
            this.els.feed.appendChild(node);
        });
    },

    // DERİNLİK ANALİZİ: Kırmızı/Mavi Bar Tasarımı
renderAnalytics(analytics) {
    const ratio = analytics.shallowRatio;
    this.els.analysis.innerHTML = `
        <div class="analysis-header" style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; font-weight: 700;">
            <span style="color: #ff4d4d">SIĞ: %${ratio}</span>
            <span style="color: #00d2ff">DERİN: %${(100 - ratio).toFixed(1)}</span>
        </div>
        <div class="depth-viz-container" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; display: flex;">
            <div class="depth-bar-shallow" style="width: ${ratio}%; background: #ff4d4d; height: 100%;"></div>
            <div class="depth-bar-deep" style="width: ${100 - ratio}%; background: #00d2ff; height: 100%;"></div>
        </div>
    `;
},

    updateMagValue(val) {
        if (this.els.magValue) this.els.magValue.innerText = `${parseFloat(val).toFixed(1)} Mw`;
    },


       updateStatus(text) {
        if (this.els.status) this.els.status.innerText = `SİNYAL: ${text}`;
    },


    updateActiveButtons(clickedBtn) {
        const parent = clickedBtn.parentElement;
        if (parent) {
            parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');
        }
    },

    getMagColor(mag) {
        if (mag < 3) return '#00d2ff';
        if (mag < 5) return '#fceb5e';
        if (mag < 7) return '#ff9100';
        return '#ff4d4d';
    }
};

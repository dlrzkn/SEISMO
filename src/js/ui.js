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
        
        if (this.els.energy) {
            this.els.energy.innerText = `${appState.analytics.totalEnergyTJ} TJ`;
        }
        
        if (this.els.energyTimerange) {
            const labels = { 'hour': '1S', 'day': '24S', 'week': '7G' };
            this.els.energyTimerange.innerText = labels[appState.filters.timeRange] || '24S';
        }
    },

    renderFeed(events) {
        if (!this.els.feed) return;
        
        const fragment = document.createDocumentFragment();
        this.els.feed.innerHTML = '';

        events.forEach(eq => {
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            
            // YENİ EKLENEN SATIR: main.js'in bu elementi bulabilmesi için benzersiz ID atanıyor
            node.id = `eq-${eq.id}`; 
            
            const color = this.getMagColor(eq.mag);

            node.innerHTML = `
                <div class="source-tag">${eq.source}</div>
                <div class="mag-block" style="border-left: 3px solid ${color}; padding-left: 10px;">
                    <div class="mag-value" style="color: ${color};">
                        ${parseFloat(eq.mag).toFixed(1)}
                    </div>
                    <div class="mag-type">${eq.magType || 'MW'}</div>
                </div>
                <div class="node-info">
                    <div class="node-place">${eq.place}</div>
                    <div class="node-meta">
                        ${parseFloat(eq.depth).toFixed(1)} km • ${new Date(eq.time).toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            `;

            node.onclick = () => {
                if (window.focusEvent) window.focusEvent(eq.coordinates);
            };
            fragment.appendChild(node);
        });

        this.els.feed.appendChild(fragment);
    },

    renderAnalytics(analytics) {
        if (!this.els.analysis) return;
        const ratio = parseFloat(analytics.shallowRatio) || 0;
        const deepRatio = (100 - ratio).toFixed(1);
        
        this.els.analysis.innerHTML = `
            <div class="analysis-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #ff4d4d; font-weight: 800; font-size: 10px;">SIĞ: %${ratio}</span>
                <span style="color: #00d2ff; font-weight: 800; font-size: 10px;">DERİN: %${deepRatio}</span>
            </div>
            <div class="depth-viz-container" style="display: flex; height: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                <div class="depth-bar-shallow" style="width: ${ratio}%; background: #ff4d4d; transition: width 0.5s ease;"></div>
                <div class="depth-bar-deep" style="width: ${deepRatio}%; background: #00d2ff; transition: width 0.5s ease;"></div>
            </div>
        `;
    },

    updateMagValue(val) {
        if (this.els.magValue) this.els.magValue.innerText = `${parseFloat(val).toFixed(1)} Mw`;
    },

    updateStatus(text) {
        if (this.els.status) {
            this.els.status.innerText = `SİNYAL: ${text.replace('SİNYAL: ', '')}`;
        }
    },

    updateActiveButtons(clickedBtn) {
        const parent = clickedBtn.parentElement;
        if (parent) {
            parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');
        }
    },

    getMagColor(mag) {
        if (mag < 2.0) return '#D3D3D3';
        if (mag < 3.0) return '#0000FF';
        if (mag < 4.0) return '#00FF00';
        if (mag < 5.0) return '#FFFF00';
        if (mag < 6.0) return '#FFA500';
        if (mag < 7.0) return '#FF8C00';
        if (mag < 8.0) return '#FF0000';
        if (mag < 9.0) return '#8B0000';
        return '#4b0082';
    }
};


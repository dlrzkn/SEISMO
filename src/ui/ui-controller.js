/**
 * UI Controller - Arayüz ve Etkileşim Yönetimi
 */
export const UIController = {
    /**
     * UI Dinleyicilerini Başlatır
     * @param {Function} onFilterChange - Filtre değiştiğinde çağrılacak callback
     */
    init(onFilterChange) {
        // Mag Slider Kontrolü
        const magSlider = document.getElementById('mag-slider');
        const magValue = document.getElementById('mag-value');

        magSlider.oninput = (e) => {
            const val = e.target.value;
            magValue.innerText = `${val} Mw`;
            onFilterChange(parseFloat(val));
        };

        // Saat ve Sistem Sayaçlarını Başlat
        this.startSystemClock();
    },

    /**
     * Sağ paneldeki deprem akışını günceller
     */
    renderFeed(events) {
        const container = document.getElementById('earthquake-feed');
        const countEl = document.getElementById('event-count');
        if (!container) return;

        container.innerHTML = '';
        countEl.innerText = events.length;

        events.forEach(ev => {
            const color = this.getMagColor(ev.mag);
            const node = document.createElement('div');
            node.className = 'earthquake-node';
            
            node.innerHTML = `
                <div class="source-tag">${ev.source}</div>
                <div class="mag-badge" style="border-color: ${color}; color: ${color};">
                    <div style="font-weight: 800; font-size: 16px;">${ev.mag.toFixed(1)}</div>
                    <div style="font-size: 8px;">Mw</div>
                </div>
                <div class="node-info">
                    <div style="font-size: 13px; font-weight: 600;">${ev.place}</div>
                    <div style="font-size: 11px; color: #777;">
                        ${ev.depth.toFixed(1)} km • ${new Date(ev.time).toLocaleTimeString('tr-TR')}
                    </div>
                </div>
            `;
            
            // Tıklandığında haritaya odaklanma (Custom Event)
            node.onclick = () => {
                window.dispatchEvent(new CustomEvent('seismo:focus', { detail: ev.coordinates }));
            };

            container.appendChild(node);
        });
    },

    /**
     * Enerji ve Derinlik Analizi İstatistiklerini Günceller
     */
    updateAnalytics(events) {
        const energyEl = document.getElementById('total-energy');
        const analysisBox = document.getElementById('depth-analysis');
        if (!energyEl) return;

        // Bilimsel Enerji Hesaplaması (Ergs to Terajoules)
        let totalJ = 0;
        events.forEach(ev => totalJ += Math.pow(10, 4.8 + (1.5 * ev.mag)));
        energyEl.innerText = `${(totalJ / 1e12).toFixed(2)} TJ`;

        // Derinlik Dağılım Grafiği
        const shallow = events.filter(e => e.depth < 70).length;
        const ratio = events.length > 0 ? (shallow / events.length) * 100 : 0;

        if (analysisBox) {
            analysisBox.innerHTML = `
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

    setLoading(isLoading) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.innerText = isLoading ? "TARANIYOR..." : "SİNYAL: GÜÇLÜ";
            statusEl.style.borderColor = isLoading ? "#f1c40f" : "#00d2ff";
        }
    },

    startSystemClock() {
        setInterval(() => {
            const clock = document.getElementById('clock');
            if (clock) clock.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    },

    getMagColor: m => m >= 7 ? '#c0392b' : m >= 5 ? '#e67e22' : m >= 3 ? '#f1c40f' : '#2ecc71'
};

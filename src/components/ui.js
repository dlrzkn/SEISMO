export class UIManager {
    constructor() {
        this.container = document.body;
        this.orbitActive = false; // Yörünge butonu durumu
    }

    renderSkeleton() {
        this.container.innerHTML = `
            <div class="top-bar">
                <div class="brand">
                    <span class="live-indicator">LIVE</span>
                    <h1>SEISMOPRO <small>SİSMOLOJİK ANALİZ TERMİNALİ</small></h1>
                </div>
                <div class="global-stats">
                    Σ ENERJİ (24S): <span id="total-energy" style="color: #00d2ff; font-weight: bold;">0.00</span> TJ
                </div>
                <div class="system-status">
                    <span class="signal-tag">SİNYAL: GÜÇLÜ</span>
                    <span id="live-clock">00:00:00</span>
                </div>
            </div>

            <div class="app-container">
                <aside class="sidebar-left">
                    <div class="panel">
                        <h3>| SİSMİK FİLTRELER</h3>
                        <label>Eşik Değer (Mw): <span id="mag-val">0.0</span></label>
                        <input type="range" id="mag-filter" min="0" max="9" step="0.1" value="0">
                        
                        <div class="btn-group">
                            <button id="toggle-orbit" class="btn-inactive">YÖRÜNGE: PASİF</button>
                        </div>
                    </div>

                    <div class="panel">
                        <h3>| ANALİZ ARAÇLARI</h3>
                        <div class="depth-stats">
                            <p>SIĞ: %<span id="shallow-pct">0</span></p>
                            <p>DERİN: %<span id="deep-pct">0</span></p>
                            <div class="depth-bar-bg"><div id="depth-bar-fill"></div></div>
                        </div>
                    </div>
                </aside>

                <main id="map"></main>

                <aside class="sidebar-right">
                    <div class="feed-header">
                        <span id="event-count">0</span> DEPREM LİSTESİ
                    </div>
                    <div id="earthquake-feed" class="feed-scroll"></div>
                </aside>
            </div>

            <footer class="footer">
                <div class="source-info">SOURCES: USGS | EMSC | GFZ</div>
                <div class="timer">SON GÜNCELLEME: <span id="last-update">0</span>S ÖNCE</div>
            </footer>
        `;
        this.startClock();
    }

    // Jeofiziksel Renk Ataması (Haritayla 1:1 Uyumlu)
    getSeismicColor(mag) {
        if (mag < 3.0) return '#00d2ff';
        if (mag < 4.5) return '#2ecc71';
        if (mag < 6.0) return '#f1c40f';
        if (mag < 7.2) return '#e67e22';
        return '#ff4b2b';
    }

    updateFeed(events) {
        const feed = document.getElementById('earthquake-feed');
        const count = document.getElementById('event-count');
        count.innerText = events.length;
        
        feed.innerHTML = events.map(ev => `
            <div class="earthquake-node" style="border-left: 4px solid ${this.getSeismicColor(ev.mag)}">
                <div class="mag-badge">${ev.mag.toFixed(1)}</div>
                <div class="info">
                    <strong>${ev.place}</strong>
                    <div class="meta">Derinlik: ${ev.depth}km | ${ev.time}</div>
                </div>
            </div>
        `).join('');
    }

    attachEventListeners(onFilter, onOrbitToggle) {
        const magSlider = document.getElementById('mag-filter');
        const orbitBtn = document.getElementById('toggle-orbit');

        magSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('mag-val').innerText = val.toFixed(1);
            onFilter(val);
        });

        orbitBtn.addEventListener('click', () => {
            this.orbitActive = !this.orbitActive;
            orbitBtn.innerText = this.orbitActive ? "YÖRÜNGE: AKTİF" : "YÖRÜNGE: PASİF";
            orbitBtn.className = this.orbitActive ? "btn-active" : "btn-inactive";
            onOrbitToggle(this.orbitActive);
        });
    }

    startClock() {
        setInterval(() => {
            document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
        }, 1000);
    }
}

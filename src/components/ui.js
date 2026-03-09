export class UIManager {
    constructor() {
        this.container = document.body;
        this.orbitActive = true; 
    }

    renderSkeleton() {
        this.container.innerHTML = `
            <header class="top-bar">
                <div class="brand-section">
                    <div class="status-indicator">
                        <div class="pulse-dot"></div>
                        <span class="live-text">LIVE</span>
                    </div>
                    <div class="logo-group">
                        <h1>SEISMO<span>PRO</span></h1>
                        <small class="sub-logo">Sismolojik Analiz Terminali</small>
                    </div>
                </div>

                <div class="global-analytics">
                    <div class="stat-node">
                        <span class="stat-label">Σ ENERJİ (<span id="energy-timerange">24S</span>):</span>
                        <span id="total-energy" class="stat-value">0.00 TJ</span>
                    </div>
                </div>

                <div class="system-meta">
                    <div id="connection-status" class="status-tag">SİNYAL: GÜÇLÜ</div>
                    <div id="clock" class="mono-clock">00:00:00</div>
                </div>
            </header>

            <main class="app-container">
                <div id="map"></div> 

                <aside class="sidebar control-sidebar">
                    <div class="glass-card">
                        <h3>Sismik Filtreler</h3>
                        <div class="filter-group">
                            <label>Eşik Değer (Mw): <span id="mag-value">0.0 Mw</span></label>
                            <input type="range" id="mag-slider" min="0" max="9" step="0.1" value="0">
                        </div>

                        <div class="filter-group">
                            <label>Zaman Penceresi</label>
                            <div class="btn-grid">
                                <button class="filter-btn" data-time="hour">1S</button>
                                <button class="filter-btn active" data-time="day">24S</button>
                                <button class="filter-btn" data-time="week">7G</button>
                            </div>
                        </div>

                        <div class="filter-group">
                            <label>Odak Derinliği</label>
                            <div class="btn-grid">
                                <button class="filter-btn active" data-depth="all">Tümü</button>
                                <button class="filter-btn" data-depth="shallow">Sığ</button>
                                <button class="filter-btn" data-depth="deep">Derin</button>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card layer-card">
                        <h3>SİSTEM & KATMAN YÖNETİMİ</h3>
                        <div class="control-grid">
                            <button id="theme-toggle" class="terminal-btn">NASA BLUE</button>
                            <button id="rotation-toggle" class="terminal-btn active">YÖRÜNGE: AKTİF</button>
                        </div>
                        <div class="control-row plate-row">
                            <input type="checkbox" id="plate-boundaries" checked>
                            <label for="plate-boundaries" class="switch-label">LEVHA SINIRLARINI GÖSTER</label>
                        </div>
                    </div>

                    <div class="glass-card stats-card">
                        <h3>Derinlik Dağılım Analizi</h3>
                        <div id="depth-analysis" class="analysis-box">
                            <div class="depth-stats-row">
                                <span class="shallow-text">SIĞ: %<span id="shallow-pct">0</span></span>
                                <span class="deep-text">DERİN: %<span id="deep-pct">0</span></span>
                            </div>
                            <div class="depth-bar-bg"><div id="depth-bar-fill" style="width: 0%"></div></div>
                        </div>
                    </div>
                </aside>

                <aside class="sidebar feed-sidebar">
                    <div class="feed-header">
                        <div class="count-box">
                            <span id="event-count">0</span> <small>DEPREM</small>
                        </div>
                        <div class="feed-controls">
                            <button id="sort-time" class="sort-btn active" title="Zamana Göre Sırala">🕒</button>
                            <button id="sort-mag" class="sort-btn" title="Büyüklüğe Göre Sırala">📊</button>
                        </div>
                    </div>
                    <div id="earthquake-feed" class="feed-scroll"></div>
                </aside>
            </main>

            <footer class="map-legend">
                <div class="source-pills">
                    <span class="pill usgs">USGS</span>
                    <span class="pill emsc">EMSC</span>
                    <span class="pill gfz">GFZ</span>
                </div>
                <div id="last-update" class="last-update">SON GÜNCELLEME: 0s ÖNCE</div>
            </footer>
        `;
        this.startClock();
    }

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
                <div class="mag-badge" style="background: ${this.getSeismicColor(ev.mag)}">${ev.mag.toFixed(1)}</div>
                <div class="node-info">
                    <strong>${ev.place}</strong>
                    <div class="meta">${ev.depth} km | ${ev.time}</div>
                </div>
                <div class="source-tag">${ev.source}</div>
            </div>
        `).join('');
    }

    startClock() {
        setInterval(() => {
            const now = new Date();
            document.getElementById('clock')?.innerText = now.toLocaleTimeString('tr-TR');
        }, 1000);
    }
}


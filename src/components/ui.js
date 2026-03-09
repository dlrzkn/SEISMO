export class UIManager {
    constructor() {
        this.appContainer = document.getElementById('app');
    }

    // Ana arayüz iskeletini oluşturur
    renderSkeleton() {
        this.appContainer.innerHTML = `
            <main class="app-container">
                <div id="map"></div> 
                
                <aside class="sidebar control-sidebar">
                    <div class="glass-card">
                        <h3>Sismik Filtreler</h3>
                        <div class="filter-group">
                            <label>Eşik Değer (Mw): <span id="mag-value">0.0 Mw</span></label>
                            <input type="range" id="mag-slider" min="0" max="9" step="0.1" value="0">
                        </div>
                    </div>
                </aside>

                <aside class="sidebar feed-sidebar">
                    <div class="feed-header">
                        <div class="count-box">
                            <span id="event-count">0</span> <small>DEPREM</small>
                        </div>
                    </div>
                    <div id="earthquake-feed" class="feed-scroll"></div>
                </aside>
            </main>
        `;
    }

    // Deprem listesini günceller
    updateFeed(events) {
        const feedContainer = document.getElementById('earthquake-feed');
        const countEl = document.getElementById('event-count');
        
        countEl.innerText = events.length;
        feedContainer.innerHTML = events.map(ev => `
            <div class="earthquake-node">
                <div style="font-weight: 800; color: #00d2ff;">${ev.mag.toFixed(1)}</div>
                <div>
                    <div style="font-size: 13px; font-weight: 600;">${ev.place}</div>
                    <div style="font-size: 11px; opacity: 0.6;">${new Date(ev.time).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
    }
}

    // Slider hareketlerini dinleyen fonksiyon
    attachEventListeners(onFilterChange) {
        const slider = document.getElementById('mag-slider');
        const magValue = document.getElementById('mag-value');

        slider.addEventListener('input', (e) => {
            const minMag = e.target.value;
            magValue.innerText = `${minMag} Mw`;
            onFilterChange(minMag);
        });
    }

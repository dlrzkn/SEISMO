import { MapEngine } from '../core/map-engine.js';
import { EarthquakeService } from '../services/earthquake.js';
import { UIController } from './ui.js';

const App = {
    state: {
        map: null,
        rawEvents: [],
        filteredEvents: [],
        knownEventIds: new Set(),
        pulseMarkers: [],
        sorting: {
            type: 'time',
            order: 'desc'
        },
        filters: {
            minMag: 0,
            timeRange: 'day',
            depthFilter: 'all'
        },
        analytics: {
            totalEnergyTJ: 0,
            shallowRatio: 0,
            activeServices: []
        },
        settings: {
            isRotating: true,
            shallowLimit: 70
        }
    },

    async init() {
        this.startClock();
        
        const config = {
            token: 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q'
        };

        try {
            this.state.map = await MapEngine.init(config);
            this.attachEventListeners();
            
            this.locateUserAndFly();
            
            await this.dataCycle();
            setInterval(() => this.dataCycle(), 120000);
            
        } catch (err) {
            console.error("Sistem Başlatma Hatası:", err);
            UIController.updateStatus("SİSTEM HATASI");
        }
    },

    locateUserAndFly() {
        this.state.map.setZoom(1.5);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { longitude, latitude } = position.coords;
                this.state.map.flyTo({
                    center: [longitude, latitude],
                    zoom: 3.8,
                    duration: 4000,
                    essential: true
                });
            }, () => {
                this.state.map.flyTo({
                    center: [35.2433, 38.9637],
                    zoom: 3.8,
                    duration: 4000
                });
            });
        } else {
            this.state.map.flyTo({
                center: [35.2433, 38.9637],
                zoom: 3.8,
                duration: 4000
            });
        }
    },

    async dataCycle() {
        UIController.updateStatus("TARANIYOR...");
        try {
            const geojson = await EarthquakeService.fetchAndProcess();
            
            this.state.analytics.activeServices = Object.entries(geojson.metadata.services)
                .filter(([_, status]) => status.online)
                .map(([id, _]) => id);

            const newEvents = [];
            const isFirstLoad = this.state.knownEventIds.size === 0;

            this.state.rawEvents = geojson.features.map(f => {
                const eventId = f.id || (f.properties && f.properties.id) || f.properties.time.toString(); 

                if (!this.state.knownEventIds.has(eventId)) {
                    this.state.knownEventIds.add(eventId);
                    
                    if (!isFirstLoad) {
                        newEvents.push({
                            id: eventId,
                            mag: f.properties.mag,
                            coordinates: f.geometry.coordinates.slice(0, 2),
                            depth: f.geometry.coordinates[2] || 0
                        });
                    }
                }

                return {
                    id: eventId,
                    ...f.properties,
                    coordinates: f.geometry.coordinates.slice(0, 2),
                    depth: f.geometry.coordinates[2] || 0
                };
            });

            this.applyFilters();

            if (newEvents.length > 0) {
                this.triggerMapPulse(newEvents);
                this.triggerListHighlight(newEvents);
            }

            const statusMsg = this.state.analytics.activeServices.length > 0 
                ? `SİNYAL: ${this.state.analytics.activeServices.join(' + ')}`
                : "VERİ YOK";
            UIController.updateStatus(statusMsg);

        } catch (err) {
            console.error("Veri Döngüsü Hatası:", err);
            UIController.updateStatus("BAĞLANTI KESİLDİ");
        }
    },

    triggerMapPulse(newEvents) {
        if (!this.state.map) return;

        newEvents.forEach(ev => {
            const el = document.createElement('div');
            el.className = 'seismic-pulse-container';
            
            const core = document.createElement('div');
            core.className = 'seismic-pulse-core';
            
            const ring = document.createElement('div');
            ring.className = 'seismic-pulse-ring';

            if (ev.mag >= 5.0) {
                ring.style.borderColor = 'var(--danger)';
                core.style.backgroundColor = 'var(--danger)';
            } else {
                ring.style.borderColor = 'var(--accent)';
                core.style.backgroundColor = 'var(--accent)';
            }

            el.appendChild(core);
            el.appendChild(ring);

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat(ev.coordinates)
                .addTo(this.state.map);

            this.state.pulseMarkers.push(marker);

            setTimeout(() => {
                marker.remove();
                this.state.pulseMarkers = this.state.pulseMarkers.filter(m => m !== marker);
            }, 60000); 
        });
    },

    triggerListHighlight(newEvents) {
        setTimeout(() => {
            newEvents.forEach(ev => {
                const listItem = document.getElementById(`eq-${ev.id}`);
                if (listItem) {
                    listItem.classList.add('new-event-highlight');
                    
                    setTimeout(() => {
                        listItem.classList.remove('new-event-highlight');
                    }, 3000);
                }
            });
        }, 100);
    },

    applyFilters() {
        const { minMag, timeRange, depthFilter } = this.state.filters;
        const now = Date.now();
        const timeLimits = { 'hour': 3600000, 'day': 86400000, 'week': 604800000 };

        this.state.filteredEvents = this.state.rawEvents.filter(ev => {
            const mMatch = ev.mag >= minMag;
            const tMatch = (now - ev.time) <= timeLimits[timeRange];
            
            let dMatch = true;
            if (depthFilter === 'shallow') dMatch = ev.depth < this.state.settings.shallowLimit;
            else if (depthFilter === 'deep') dMatch = ev.depth >= this.state.settings.shallowLimit;
            
            return mMatch && tMatch && dMatch;
        });

        this.sortEvents();
        this.runAnalytics();
        this.syncUI();
    },

    sortEvents() {
        const { type, order } = this.state.sorting;
        const multiplier = order === 'desc' ? -1 : 1;

        this.state.filteredEvents.sort((a, b) => {
            if (type === 'time') {
                return (a.time - b.time) * multiplier;
            } else if (type === 'mag') {
                return (a.mag - b.mag) * multiplier;
            }
            return 0;
        });
    },

    runAnalytics() {
        let totalJoules = 0;
        let shallowCount = 0;

        this.state.filteredEvents.forEach(eq => {
            totalJoules += Math.pow(10, 4.8 + (1.5 * eq.mag));
            if (eq.depth < this.state.settings.shallowLimit) shallowCount++;
        });

        this.state.analytics.totalEnergyTJ = (totalJoules / 1e12).toFixed(2);
        this.state.analytics.shallowRatio = this.state.filteredEvents.length > 0 
            ? ((shallowCount / this.state.filteredEvents.length) * 100).toFixed(1) 
            : 0;

        const energyEl = document.getElementById('energy-total-tj');
        const timeLabelEl = document.getElementById('energy-time-label');
        if (energyEl) energyEl.innerText = this.state.analytics.totalEnergyTJ;
        if (timeLabelEl) {
            const labels = { 'hour': '1S', 'day': '24S', 'week': '7G' };
            timeLabelEl.innerText = labels[this.state.filters.timeRange] || '24S';
        }
    },

    syncUI() {
        if (this.state.map) {
            MapEngine.updateSource('earthquakes', {
                type: 'FeatureCollection',
                features: this.state.filteredEvents.map(ev => ({
                    type: 'Feature',
                    geometry: { 
                        type: 'Point', 
                        coordinates: [...ev.coordinates, ev.depth] 
                    },
                    properties: ev
                }))
            });
        }
        UIController.renderAll(this.state);
    },

    attachEventListeners() {
        document.getElementById('mag-slider')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state.filters.minMag = val;
            UIController.updateMagValue(val);
            this.applyFilters();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { time, depth } = e.target.dataset;
                if (time) this.state.filters.timeRange = time;
                if (depth) this.state.filters.depthFilter = depth;
                UIController.updateActiveButtons(e.target);
                this.applyFilters();
            });
        });

        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clickedBtn = e.currentTarget;
                const sortType = clickedBtn.getAttribute('data-sort');
                
                if (this.state.sorting.type === sortType) {
                    this.state.sorting.order = this.state.sorting.order === 'desc' ? 'asc' : 'desc';
                } else {
                    this.state.sorting.type = sortType;
                    this.state.sorting.order = 'desc';
                    
                    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                    clickedBtn.classList.add('active');
                }
                
                clickedBtn.setAttribute('data-order', this.state.sorting.order);
                
                this.sortEvents();
                this.syncUI();
            });
        });

        document.getElementById('plate-boundaries')?.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            if (this.state.map?.getLayer('plates-layer')) {
                this.state.map.setLayoutProperty('plates-layer', 'visibility', visibility);
            }
        });

        document.getElementById('heatmap-toggle')?.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            if (this.state.map?.getLayer('earthquakes-heat')) {
                this.state.map.setLayoutProperty('earthquakes-heat', 'visibility', visibility);
            }
        });

        window.focusEvent = (coords) => {
            if (!this.state.map) return;
            
            const mapBtn = document.querySelector('.nav-btn[data-target="map"]');
            if(mapBtn && !mapBtn.classList.contains('active')) {
                mapBtn.click();
            }
            document.body.classList.remove('show-layers'); 

            this.state.map.flyTo({ 
                center: coords, 
                zoom: 8, 
                duration: 2500, 
                essential: true 
            });

            this.state.map.once('moveend', () => {
                const point = this.state.map.project(coords);
                this.state.map.fire('click', { lngLat: { lng: coords[0], lat: coords[1] }, point: point });
            });
        };

        this.setupMobileNavigation();
    },

    setupMobileNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const body = document.body;

        if (window.innerWidth <= 1024) {
            body.classList.add('tab-map');
        }

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const currentBtn = e.currentTarget;
                const target = currentBtn.getAttribute('data-target');
                const isAlreadyActive = currentBtn.classList.contains('active');

                if (target === 'map') {
                    if (isAlreadyActive) {
                        body.classList.toggle('show-layers');
                    } else {
                        body.classList.remove('tab-analysis', 'tab-list', 'show-layers');
                        body.classList.add('tab-map');
                    }
                } 
                else {
                    if (isAlreadyActive) {
                        document.querySelector('.nav-btn[data-target="map"]').click();
                        return;
                    } else {
                        body.classList.remove('tab-map', 'tab-analysis', 'tab-list', 'show-layers');
                        body.classList.add(`tab-${target}`);
                    }
                }

                navButtons.forEach(b => b.classList.remove('active'));
                currentBtn.classList.add('active');

                if (this.state.map) {
                    setTimeout(() => {
                        this.state.map.resize();
                    }, 50);
                }
            });
        });
    },

    startClock() {
        const clockEl = document.getElementById('clock');
        if (!clockEl) return;
        setInterval(() => {
            clockEl.innerText = new Date().toLocaleTimeString('tr-TR');
        }, 1000);
    }
};

App.init();

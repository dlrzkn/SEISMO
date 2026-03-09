/**
 * Earthquake Service - Çok Kaynaklı Sismik Analiz Merkezi
 */
export const EarthquakeService = {
    config: {
        dedupTimeBuffer: 60000, 
        dedupSpaceBuffer: 50,    
        // Zaman seçenekleri için endpoint haritası
        periods: {
            'hour': { usgs: 'all_hour.geojson', emsc: 'limit=100' },
            'day': { usgs: 'all_day.geojson', emsc: 'limit=500' },
            'week': { usgs: 'all_week.geojson', emsc: 'limit=1000' }
        }
    },

    /**
     * İki koordinat arası mesafeyi hesaplar (km)
     */
    getHaversineDistance(coords1, coords2) {
        const R = 6371; 
        const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
        const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    /**
     * Çakışan depremleri temizler
     */
    deduplicate(events) {
        const sorted = [...events].sort((a, b) => b.mag - a.mag);
        const unique = [];
        sorted.forEach(current => {
            const isDup = unique.some(ex => {
                const tDiff = Math.abs(current.time - ex.time);
                const sDiff = this.getHaversineDistance(current.coordinates, ex.coordinates);
                return tDiff < this.config.dedupTimeBuffer && sDiff < this.config.dedupSpaceBuffer;
            });
            if (!isDup) unique.push(current);
        });
        return unique;
    },

    /**
     * Çoklu kaynaktan veri çekme (USGS & EMSC)
     */
    async fetchEarthquakes(periodKey = 'day') {
        const period = this.config.periods[periodKey];
        const usgsUrl = `${import.meta.env.VITE_API_BASE_URL}${period.usgs}`;
        const emscUrl = `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&${period.emsc}`;

        try {
            const [usgsRes, emscRes] = await Promise.allSettled([
                fetch(usgsUrl).then(r => r.json()),
                fetch(emscUrl).then(r => r.json())
            ]);

            let allEvents = [];

            // USGS Verilerini İşle
            if (usgsRes.status === 'fulfilled') {
                allEvents.push(...usgsRes.value.features.map(f => ({
                    id: f.id,
                    mag: f.properties.mag,
                    place: f.properties.place?.toUpperCase() || "BİLİNMEYEN LOKASYON",
                    time: f.properties.time,
                    coordinates: f.geometry.coordinates,
                    depth: f.geometry.coordinates[2],
                    source: 'USGS'
                })));
            }

            // EMSC Verilerini İşle
            if (emscRes.status === 'fulfilled') {
                allEvents.push(...emscRes.value.features.map(f => ({
                    id: f.id,
                    mag: f.properties.mag,
                    place: (f.properties.flynn_region || "BÖLGE ANALİZ EDİLEMEDİ").toUpperCase(),
                    time: new Date(f.properties.time).getTime(),
                    coordinates: f.geometry.coordinates,
                    depth: f.geometry.coordinates[2],
                    source: 'EMSC'
                })));
            }

            return this.deduplicate(allEvents);
        } catch (error) {
            console.error("Sismik servis hatası:", error);
            return null;
        }
    }
};


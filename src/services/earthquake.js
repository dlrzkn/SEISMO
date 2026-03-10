// SEISMO/src/services/earthquake.js
export const EarthquakeService = {
    endpoints: [
        { id: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson' },
        { id: 'EMSC', url: 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=500' },
        { id: 'GFZ', url: 'https://geofon.gfz-potsdam.de/eqinfo/list.php?fmt=geojson' }
    ],

    async fetchAndProcess() {
        const results = await Promise.allSettled(this.endpoints.map(e => fetch(e.url).then(r => r.json())));
        let allFeatures = [];
        
        results.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                allFeatures.push(...this.normalize(res.value, this.endpoints[index].id));
            }
        });

        return this.deduplicate(allFeatures);
    },

    getHaversineDistance(coords1, coords2) {
        const R = 6371;
        const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
        const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) * Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },

    deduplicate(events) {
        const sorted = [...events].sort((a, b) => b.mag - a.mag);
        const unique = [];
        sorted.forEach(current => {
            const isDup = unique.some(ex => {
                const tDiff = Math.abs(current.time - ex.time);
                const sDiff = this.getHaversineDistance(current.coordinates, ex.coordinates);
                return tDiff < 60000 && sDiff < 50; 
            });
            if (!isDup) unique.push(current);
        });
        return unique;
    },

    normalize(data, source) {
        // (Senin paylaştığın normalize fonksiyonunun birebir aynısı buraya gelecek)
    }
};

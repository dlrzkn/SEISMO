export const EarthquakeService = {
    endpoints: [
        { id: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson' },
        { id: 'EMSC', url: 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=500' },
        { id: 'GFZ', url: 'https://geofon.gfz-potsdam.de/eqinfo/list.php?fmt=geojson' }
    ],

    async fetchAndProcess() {
        const results = await Promise.allSettled(this.endpoints.map(async (e) => {
            try {
                const response = await fetch(e.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                return { id: e.id, data };
            } catch (err) {
                console.error(`Service Fetch Error [${e.id}]:`, err);
                return null;
            }
        }));

        let allFeatures = [];
        results.forEach(res => {
            if (res.status === 'fulfilled' && res.value) {
                allFeatures.push(...this.normalize(res.value.data, res.value.id));
            }
        });

        const cleanData = this.deduplicate(allFeatures);
        
        return {
            type: 'FeatureCollection',
            metadata: {
                generated: Date.now(),
                count: cleanData.length
            },
            features: cleanData.map(eq => ({
                type: 'Feature',
                id: eq.id,
                geometry: { 
                    type: 'Point', 
                    coordinates: [eq.coordinates[0], eq.coordinates[1], eq.depth] 
                },
                properties: { 
                    ...eq,
                    mag: parseFloat(eq.mag) // Sayısal karşılaştırma için float zorlaması
                }
            }))
        };
    },

    normalize(data, source) {
        const rawFeatures = data.features || (Array.isArray(data) ? data : []);
        
        return rawFeatures.map(f => {
            const p = f.properties || f;
            const geom = f.geometry || {};
            
            let lon = 0, lat = 0, depth = 0;
            if (geom.coordinates) {
                [lon, lat, depth] = geom.coordinates;
            } else {
                lon = p.longitude || p.lon || 0;
                lat = p.latitude || p.lat || 0;
                depth = p.depth || 0;
            }

            const magType = p.magType || p.magnitudeType || 'U';

            return {
                id: String(p.unid || p.ids || p.id || `${source}-${p.time}-${lon}`),
                mag: parseFloat(p.mag || p.magnitude || 0).toFixed(1),
                magType: magType.toUpperCase(),
                depth: parseFloat(Math.abs(depth).toFixed(2)),
                place: (p.place || p.region || p.flynn_region || "BÖLGE TANIMLANAMADI").toUpperCase().trim(),
                time: p.time ? new Date(p.time).getTime() : (p.m_time ? new Date(p.m_time).getTime() : Date.now()),
                source: source,
                coordinates: [parseFloat(lon), parseFloat(lat)],
                url: p.url || (p.uri ? p.uri : "#")
            };
        });
    },

    getHaversineDistance(coords1, coords2) {
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
        const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
        const a = Math.sin(dLat/2) ** 2 +
                  Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) * Math.sin(dLon/2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },

    deduplicate(events) {
        // En büyük depremi referans almak için azalan sıralama
        const sorted = [...events].sort((a, b) => b.mag - a.mag);
        const unique = [];

        for (const current of sorted) {
            const isDup = unique.some(ex => {
                const tDiff = Math.abs(current.time - ex.time);
                const sDiff = this.getHaversineDistance(current.coordinates, ex.coordinates);
                // 60 saniye ve 50km altındaki kayıtlar mükerrer kabul edilir
                return tDiff < 60000 && sDiff < 50;
            });
            if (!isDup) unique.push(current);
        }
        return unique;
    }
};

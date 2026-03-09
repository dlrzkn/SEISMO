export class EarthquakeService {
    constructor() {
        this.endpoints = [
            { id: 'USGS', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson' },
            { id: 'EMSC', url: 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=500' }
        ];
    }

    async fetchAll() {
        try {
            const results = await Promise.allSettled(
                this.endpoints.map(api => fetch(api.url).then(res => res.json()))
            );
            
            let allEvents = [];
            results.forEach((res, index) => {
                if (res.status === 'fulfilled') {
                    const normalized = this.normalize(res.value, this.endpoints[index].id);
                    allEvents.push(...normalized);
                }
            });

            return allEvents;
        } catch (error) {
            console.error("Sismik veri hatası:", error);
            return [];
        }
    }

    // Farklı API'lardan gelen verileri tek tipe sokan "Senior" süzgeç
    normalize(data, source) {
        const features = data.features || (Array.isArray(data) ? data : []);
        return features.map(f => {
            const p = f.properties || f;
            const coords = f.geometry?.coordinates || [p.longitude, p.latitude, p.depth];
            
            return {
                id: p.id || p.unid || Math.random().toString(36),
                mag: parseFloat(p.mag || p.magnitude || 0),
                place: (p.place || p.region || "Bilinmeyen Bölge").toUpperCase(),
                time: new Date(p.time || p.m_time).getTime(),
                depth: Math.abs(parseFloat(coords[2] || 0)),
                coordinates: [coords[0], coords[1]],
                source: source
            };
        });
    }
}

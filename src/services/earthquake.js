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
            
            // Verileri burada birleştireceğiz (normalize işlemi)
            console.log("Sismik veriler başarıyla tarandı.");
            return results;
        } catch (error) {
            console.error("Veri çekme hatası:", error);
            return [];
        }
    }
}


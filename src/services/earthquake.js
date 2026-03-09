/**
 * Earthquake Service - Sismik Veri Sağlayıcı
 */
export const EarthquakeService = {
    // Vite üzerinden .env değişkenine erişim
    baseUrl: import.meta.env.VITE_API_BASE_URL,

    /**
     * Güncel deprem verilerini çeker
     * @param {string} period - 'hour', 'day', 'week'
     * @returns {Promise<Object>} GeoJSON verisi
     */
    async fetchEarthquakes(period = 'day') {
        try {
            const response = await fetch(`${this.baseUrl}all_${period}.geojson`);
            if (!response.ok) throw new Error('API bağlantı hatası');
            
            const data = await response.json();
            return this.transformData(data);
        } catch (error) {
            console.error('Sismik veri çekilirken hata oluştu:', error);
            return null;
        }
    },

    /**
     * Gelen veriyi uygulama içinde kullanılabilir hale getirir (Normalization)
     */
    transformData(geoJson) {
        return geoJson.features.map(feature => ({
            id: feature.id,
            mag: feature.properties.mag,
            place: feature.properties.place,
            time: new Date(feature.properties.time),
            coordinates: feature.geometry.coordinates,
            depth: feature.geometry.coordinates[2],
            url: feature.properties.url
        }));
    }
};


/**
 * Map Engine - Harita Çekirdeği
 */
export const MapEngine = {
    map: null,

    /**
     * Haritayı başlatır
     * @param {string} containerId - Haritanın yükleneceği HTML element ID'si
     */
    init(containerId) {
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        this.map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [35, 39], // Türkiye merkezli başlangıç
            zoom: 4,
            projection: 'globe'
        });

        this.map.on('style.load', () => {
            this.map.setFog({}); // Atmosfer efekti
        });

        console.log("Map Engine başlatıldı.");
        return this.map;
    }
};


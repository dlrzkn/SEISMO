// SEISMO/src/core/map-engine.js

export const initMap = (config) => {
    mapboxgl.accessToken = config.token;

    const map = new mapboxgl.Map({
        container: config.container || 'map',
        style: config.style || 'mapbox://styles/mapbox/dark-v11',
        center: config.center || [35, 39],
        zoom: config.zoom || 2.5,
        projection: 'globe' // Küre görünümü
    });

    // Navigasyon kontrollerini ekle
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Harita yüklendiğinde temel atmosfer ayarlarını yap
    map.on('load', () => {
        map.setFog({
            'range': [1, 10],
            'color': '#000000',
            'high-color': '#000000',
            'space-color': '#000000',
            'star-intensity': 0.2
        });
        
        console.log("Map Engine: Harita motoru başarıyla başlatıldı.");
    });

    return map;
};

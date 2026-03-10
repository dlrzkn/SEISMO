// src/js/main.js

mapboxgl.accessToken = 'pk.eyJ1IjoiZGxyemtuIiwiYSI6ImNtbWY2ZG5pNDA0cmwycnNodm1jdTN3cmQifQ.Sf5rAPwn1JZfwpDF_blj8Q';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [35, 39],
    zoom: 2.5,
    projection: 'globe'
});

map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {
    // 1. Fay Hatlarını (Plaka Sınırlarını) Ekleyelim
    map.addSource('plates', {
        'type': 'geojson',
        'data': 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json'
    });

    map.addLayer({
        'id': 'plates-layer',
        'type': 'line',
        'source': 'plates',
        'paint': {
            'line-color': '#ff6b6b',
            'line-width': 1.5,
            'line-opacity': 0.4,
            'line-dasharray': [2, 1]
        }
    });

    // 2. 7 Günlük Deprem Verisini Çekelim
    map.addSource('quakes', {
        'type': 'geojson',
        'data': 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
    });

    // 3. Isı Haritası Katmanı
    map.addLayer({
        'id': 'quakes-heat',
        'type': 'heatmap',
        'source': 'quakes',
        'maxzoom': 9,
        'paint': {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
                0.6, '#f1c40f', 0.8, '#e67e22', 1, '#e74c3c'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': 0.6
        }
    }, 'quakes-point');

    // 4. Nokta Katmanı (Daha Önceki Estetik Ayarlarınla)
    map.addLayer({
        'id': 'quakes-point',
        'type': 'circle',
        'source': 'quakes',
        'paint': {
            'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 2, 8, 18],
            'circle-color': [
                'step', ['get', 'mag'],
                '#2ecc71', 3.0, '#f1c40f', 4.0, '#e67e22', 5.0, '#e74c3c', 6.0, '#c0392b', 7.0, '#96281b', 8.0, '#8e44ad'
            ],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 0.5,
            'circle-opacity': 0.8
        }
    });

    // --- Fonksiyonları Başlat (Dönüş, Filtre ve Popup) ---
    initRotation(map);
    initPopups(map);
    initFilters(map);
});

var map = L.map( 'map', {
    center: [50.7, -1.3],
    minZoom: 10,
    maxZoom:12,
    zoom: 11
});

// This is optional, but restricts panning to the downloaded area.
let southWest = L.latLng(50.57, -1.6);
let northEast = L.latLng(50.79, -1.05);
let bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);

L.tileLayer( 'tiles/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo( map );

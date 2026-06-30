(() => {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') {
        return;
    }

    const locationElements = document.querySelectorAll('p');
    let city = '';
    let country = '';

    for (const element of locationElements) {
        if (element.textContent.includes('Location:')) {
            const match = element.textContent.match(/Location:\s*(.+?),\s*(.+)/);
            if (match) {
                city = match[1].trim();
                country = match[2].trim();
            }
            break;
        }
    }

    if (!city || !country) {
        return;
    }

    const map = L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
    }).setView([40.7128, -74.006], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>'
    }).addTo(map);

    const geocodeAndAddMarker = searchText => {
        const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`;
        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const location = data[0];
                    const lat = Number(location.lat);
                    const lon = Number(location.lon);
                    map.setView([lat, lon], 13);
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: '<i class="fas fa-map-marker-alt" style="color: #dc3545; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);"></i>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 24]
                    });
                    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
                    marker.bindPopup(`
                        <div style="text-align: center; min-width: 200px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                                <strong>Property Location</strong>
                            </div>
                            <div style="padding: 10px;">
                                <strong style="color: #333; font-size: 16px;">${city}, ${country}</strong><br>
                                <small style="color: #666;">📍 Exact location marked</small><br><br>
                                <button onclick="getDirections(${lat}, ${lon})" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-directions"></i> Get Directions
                                </button>
                            </div>
                        </div>
                    `);
                } else {
                    map.setView([40.7128, -74.006], 10);
                    L.marker([40.7128, -74.006]).addTo(map).bindPopup('Location not found. Please check the address.');
                }
            })
            .catch(error => {
                console.error('Error geocoding location:', error);
                map.setView([40.7128, -74.006], 10);
                L.marker([40.7128, -74.006]).addTo(map).bindPopup('Error loading location. Please try again.');
            });
    };

    geocodeAndAddMarker(`${city}, ${country}`);

    L.control.fullscreen({
        position: 'topleft',
        title: { false: 'View Fullscreen', true: 'Exit Fullscreen' }
    }).addTo(map);

    L.control.scale({
        imperial: true,
        metric: true,
        position: 'bottomleft'
    }).addTo(map);
});

function getDirections(lat, lon) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
}
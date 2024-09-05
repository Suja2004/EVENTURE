document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([15.3173, 75.7139], 7); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var locationLayer; 
    var locationData; 
    var eventLayer; 
    var eventsData; 

    // Load GeoJSON data from external file
    fetch('data/locations.json')
        .then(response => response.json())
        .then(data => {
            locationData = data;

            // Load event data
            fetch('data/events.json')
                .then(response => response.json())
                .then(data => {
                    eventsData = data;

                    function updateMap(category) {
                        if (locationLayer) {
                            locationLayer.clearLayers();
                        }
                        if (eventLayer) {
                            eventLayer.clearLayers();
                        }

                        var filteredData = locationData.features.filter(feature => category === 'all' || feature.properties.category === category);

                        locationLayer = L.geoJSON({
                            "type": "FeatureCollection",
                            "features": filteredData
                        }, {
                            pointToLayer: function (feature, latlng) {
                                var marker = L.marker(latlng)
                                    .bindPopup(`<h3>${feature.properties.name}</h3><p>Category: ${feature.properties.category}</p>`)
                                    .on('click', function() {
                                        map.setView(latlng, 15); 
                                    });
                                return marker;
                            }
                        }).addTo(map);

                        // Adjust map view if necessary
                        if (filteredData.length > 0) {
                            map.fitBounds(L.geoJSON(filteredData).getBounds());
                        }

                        // Add event pins if there are displayed location pins
                        if (filteredData.length > 0) {
                            addEventPins(filteredData);
                        }
                    }

                    // Function to add event pins
                    function addEventPins(locations) {
                        var eventMarkers = [];

                        // Get coordinates from displayed location pins
                        var locationBounds = L.geoJSON(locations).getBounds();
                        var locationCenter = locationBounds.getCenter();
                        var radius = locationBounds.getNorthEast().distanceTo(locationBounds.getSouthWest()) / 2;

                        // Get current date and date range for filtering
                        var now = new Date();
                        var today = now.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
                        var futureDates = [0, 1, 2].map(days => {
                            var futureDate = new Date();
                            futureDate.setDate(now.getDate() + days);
                            return futureDate.toISOString().split('T')[0];
                        });

                        // Filter events based on proximity and date
                        var nearbyEvents = eventsData.features.filter(event => {
                            var eventLatLng = L.latLng(event.geometry.coordinates[1], event.geometry.coordinates[0]);
                            var eventDate = event.properties.date;
                            return (locationBounds.contains(eventLatLng) || eventLatLng.distanceTo(locationCenter) <= radius * 0.5) &&
                                (futureDates.includes(eventDate) || eventDate === today);
                        });

                        // Add event markers with custom icon
                        eventLayer = L.geoJSON({
                            "type": "FeatureCollection",
                            "features": nearbyEvents
                        }, {
                            pointToLayer: function (feature, latlng) {
                                return L.marker(latlng, {
                                    icon: L.divIcon({
                                        className: 'event-icon',
                                        html: '<div>📅</div>', // Optionally, use an emoji or text
                                        iconSize: [32, 32]
                                    })
                                }).bindPopup(`<h3>${feature.properties.name}</h3><p>${feature.properties.date}<br>${feature.properties.time}</p>`)
                                  .on('click', function() {
                                    map.setView(latlng, 15); // Zoom to the event pin
                                  });
                            }
                        }).addTo(map);
                    }

                    // Initialize map with no locations
                    updateMap('none');

                    // Handle category button clicks
                    document.querySelectorAll('.category-icons button').forEach(button => {
                        button.addEventListener('click', function() {
                            var selectedCategory = this.dataset.category;
                            updateMap(selectedCategory);
                        });
                    });

                    // Handle reset map button click
                    document.getElementById('resetMapBtn').addEventListener('click', function() {
                        map.setView([15.3173, 75.7139], 7);
                        updateMap('none');
                    });

                    // Search functionality
                    var searchInput = document.getElementById('search');
                    searchInput.addEventListener('input', function() {
                        var searchTerm = searchInput.value.toLowerCase();
                        var filteredData = locationData.features.filter(feature => feature.properties.name.toLowerCase().includes(searchTerm));

                        if (locationLayer) {
                            locationLayer.clearLayers();
                        }

                        L.geoJSON({
                            "type": "FeatureCollection",
                            "features": filteredData
                        }, {
                            pointToLayer: function (feature, latlng) {
                                return L.marker(latlng)
                                    .bindPopup(`<h3>${feature.properties.name}</h3><p>Category: ${feature.properties.category}</p>`)
                                    .on('click', function() {
                                        map.setView(latlng, 15); // Zoom to the pin
                                    });
                            }
                        }).addTo(map);

                        // Add event pins for filtered locations
                        if (filteredData.length > 0) {
                            addEventPins(filteredData);
                        }
                    });

                    // GPS button functionality
                    document.getElementById('gpsBtn').addEventListener('click', function() {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function(position) {
                                var lat = position.coords.latitude;
                                var lng = position.coords.longitude;
                                map.setView([lat, lng], 15); 
                                L.marker([lat, lng]).addTo(map)
                                    .bindPopup("You are here")
                                    .openPopup();
                            }, function(error) {
                                console.error("Error fetching location:", error);
                                alert("Unable to retrieve your location.");
                            }, {
                                enableHighAccuracy: true 
                            });
                        } else {
                            alert("Geolocation is not supported by this browser.");
                        }
                    });
                })
                .catch(error => {
                    console.error("Error loading events data:", error);
                    alert("Unable to load event data.");
                });
        })
        .catch(error => {
            console.error("Error loading locations data:", error);
            alert("Unable to load location data.");
        });
});

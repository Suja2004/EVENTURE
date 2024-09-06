document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([13.3411861, 74.7519958], 10); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var locationLayer; 
    var locationData; 
    var eventLayer; 
    var eventsData; 

    fetch('data/location-desc.json')
    .then(response => response.json())
    .then(data => {
        const locations = data.locations;
        const locationCards = document.getElementById('locationCards');

        document.querySelectorAll('.category-icons button').forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                loadLocationCards(category, locations);
                updateMap(category, locations);
            });
        });

        function loadLocationCards(category, locations) {
            locationCards.innerHTML = ''; 
            const filteredLocations = locations.filter(location => location.category === category);
        
            filteredLocations.forEach(location => {
                const card = document.createElement('div');
                card.classList.add('location-card');
        
                const img = document.createElement('img');
                img.src = `images/${location.img}`;
                img.alt = `${location.name}`;
                
                img.onerror = function() {
                    img.style.display = 'none'; 
                    const placeholder = document.createElement('div');
                    placeholder.className = 'placeholder';
                    placeholder.textContent = `${location.name}`;
                    card.appendChild(placeholder);

                };
        
                card.appendChild(img);
        
                const info = document.createElement('div');
                info.classList.add('location-info');
                info.innerHTML = `
                    <h4>${location.name}</h4>
                    <p>${location.description}</p>
                `;
                card.appendChild(info);
                card.addEventListener('click', function() {
                    if (location.coordinates) {
                        const lat = location.coordinates[1];
                        const lng = location.coordinates[0];
                        const latlng = [lat, lng];
                        
                        map.setView(latlng, 15); 
        
                        L.marker(latlng).addTo(map)
                            .bindPopup(`<h3>${location.name}</h3>
                                `)
                            .openPopup();
                    } else {
                        console.error(`Coordinates are missing for ${location.name}`);
                    }
                });
                locationCards.appendChild(card);
            });
        
            // Show the cards container
            locationCards.classList.add('expanded');
        }

        function updateMap(category, locations) {
            if (locationLayer) {
                map.removeLayer(locationLayer);
            }
            const filteredLocations = locations.filter(location => location.category === category);

            locationLayer = L.geoJSON({
                type: "FeatureCollection",
                features: filteredLocations.map(loc => ({
                    type: "Feature",
                    properties: {
                        name: loc.name,
                        category: loc.category
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [loc.geometry.coordinates[1], loc.geometry.coordinates[0]] 
                    }
                }))
            }).addTo(map);
        }
    })
    .catch(error => {
        console.error("Error loading location data:", error);
        alert("Unable to load location data.");
    });



    // Load GeoJSON data from external file
    fetch('data/locations.json')
        .then(response => response.json())
        .then(data => {
            locationData = data;

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
                                    .bindPopup(`<h3>${feature.properties.name}</h3>
                                        `)
                                    .on('click', function() {
                                        map.setView(latlng, 15); 
                                    });
                                return marker;
                            }
                        }).addTo(map);

                        if (filteredData.length > 0) {
                            map.fitBounds(L.geoJSON(filteredData).getBounds());
                        }

                        if (filteredData.length > 0) {
                            addEventPins(filteredData);
                        }
                    }

                    function addEventPins(locations) {
                        var eventMarkers = [];

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
                                        map.setView(latlng, 15);
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

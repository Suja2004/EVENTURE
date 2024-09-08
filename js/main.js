
document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map').setView([13.3411861, 74.7519958], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);


    var locationLayer;
    var locationData;
    var eventLayer;
    var eventsData;
    let currentDestination = null;

    function showLocationDetails(location) {
        locationDetails.innerHTML = '<button id="closeDetailsButton"><i class="fa-solid fa-x"></i></button><button id="routeButton">Show Route</button>';
        console.log(location);

        // Create and append the heading element
        const headingElement = document.createElement('h2');
        headingElement.textContent = location.properties.name;
        locationDetails.appendChild(headingElement);

        // Create the image element
        const imageElement = document.createElement('img');
        imageElement.src = `images/${location.properties.img}`;
        imageElement.alt = location.properties.name; // Set the alt attribute

        // Create placeholder element
        const placeholderElement = document.createElement('div');
        placeholderElement.className = 'image-placeholder';
        placeholderElement.textContent = 'Image not available';

        // Handle image loading error
        imageElement.onerror = function () {
            // Hide the image and show the placeholder
            imageElement.style.display = 'none';
            locationDetails.appendChild(placeholderElement);
        };

        // Append the image element before adding other content
        locationDetails.appendChild(imageElement);

        // Add other location details using template literals
        locationDetails.innerHTML += `
            <p><strong>Description:</strong> ${location.properties.description}</p>
            <p><strong>Address:</strong> ${location.properties.address}</p>
            <p><strong>Contact:</strong> ${location.properties.contact}</p>
            <p><strong>Opening Hours:</strong> ${location.properties.openingHours}</p>
        `;

        // Show the details section
        locationDetails.style.display = 'block';

        // Store the destination coordinates
        currentDestination = {
            lat: location.geometry.coordinates[1],
            lng: location.geometry.coordinates[0]
        };

        // Add event listener to the route button
        document.getElementById('routeButton').addEventListener('click', function () {
            if (currentDestination) {
                displayRouteToDestination(currentDestination.lat, currentDestination.lng);
            } else {
                alert("Destination coordinates are not set.");
            }
        });

        // Close button functionality
        document.getElementById('closeDetailsButton').addEventListener('click', function () {
            locationDetails.style.display = 'none';
        });
    }

    function loadLocationCards(category, locations) {
        locationCards.innerHTML = '';
        var filteredLocations = locations.features.filter(feature => category === 'all' || feature.properties.category === category);
    
        // Clear existing markers if needed
        if (window.currentMarkers) {
            window.currentMarkers.forEach(marker => marker.remove());
        }
    
        // Store markers in an array
        window.currentMarkers = [];
    
        filteredLocations.forEach(location => {
            const card = document.createElement('div');
            card.classList.add('location-card');
    
            const img = document.createElement('img');
            img.src = `images/${location.properties.img}`;
            img.alt = `${location.properties.name}`;
    
            img.onerror = function () {
                img.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'placeholder';
                placeholder.textContent = 'Image not available';
                card.appendChild(placeholder);
            };
    
            card.appendChild(img);
    
            const info = document.createElement('div');
            info.classList.add('location-info');
            info.innerHTML = `
                <h4>${location.properties.name}</h4>
                <p>${location.properties.description}</p>
            `;
            card.appendChild(info);
    
            card.addEventListener('click', function () {
                // Set the map view to the selected location
                if (location.geometry.coordinates) {
                    const lat = location.geometry.coordinates[1];
                    const lng = location.geometry.coordinates[0];
                    const latlng = [lat, lng];
    
                    map.setView(latlng, 15); // Center map on location
                    showLocationDetails(location); // Show location details
    
                    // Add marker for the location
                    const marker = L.marker(latlng).addTo(map)
                        .bindPopup(`<h3>${location.properties.name}</h3>`)
                        .on('click', function () {
                            map.setView(latlng, 15);
                            showLocationDetails(location);
                        });
                    
                    // Store the marker
                    window.currentMarkers.push(marker);
                } else {
                    console.error(`Coordinates are missing for ${location.properties.name}`);
                }
            });
    
            locationCards.appendChild(card);
        });
    }
    
    let routeControl = null;

    function displayRouteToDestination(destLat, destLng) {
        if (!map) {
            console.error("Map is not initialized.");
            return;
        }

        // Get the current GPS location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const sourceLat = position.coords.latitude;
                const sourceLng = position.coords.longitude;
                map.setView([sourceLat, sourceLng], 10);

                // Clear previous route if exists
                if (routeControl) {
                    map.removeControl(routeControl);
                    routeControl = null;
                }

                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(sourceLat, sourceLng),
                        L.latLng(destLat, destLng)
                    ],
                    routeWhileDragging: true,
                    showAlternatives: true, 
                    fitSelectedRoutes: true, 
                    plan: new L.Routing.Plan([
                        L.latLng(sourceLat, sourceLng),
                        L.latLng(destLat, destLng)
                    ], {
                        createMarker: function () { return null; } 
                    }),
                    routeLine: L.Routing.line,
                }).addTo(map);
            }, function (error) {
                console.error("Error fetching location:", error);
                alert("Unable to retrieve your location.");
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    function toggleRouteVisibility(visible) {
        if (routeControl) {
            routeControl.getContainer().style.display = visible ? 'block' : 'none';
        }
    }
    
    toggleRouteVisibility(false);
    
    fetch('data/location-desc.json')
        .then(response => response.json())
        .then(data => {
            const locations = data;
            const locationCards = document.getElementById('locationCards');
            const categoryButtons = document.querySelectorAll('.category-icons button');
            const clickcount = {};

            categoryButtons.forEach(button => {
                const category = button.getAttribute('data-category');
                clickcount[category] = 0;
            });

            categoryButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const category = this.getAttribute('data-category');
                    const isHighlighted = this.classList.contains('highlighted');

                    clickcount[category]++;
                    categoryButtons.forEach(button => {
                        const othercategory = button.getAttribute('data-category');
                        if (othercategory != category) {
                            clickcount[othercategory] = 0;
                        }
                    });

                    categoryButtons.forEach(btn => btn.classList.remove('highlighted'));

                    if (!isHighlighted) {
                        updateButtonHighlight(category);
                    }

                    loadLocationCards(category, locations);
                    togglePinsAndCards(category, locations);
                });
            });

            function updateButtonHighlight(category) {
                categoryButtons.forEach(button => {
                    const buttonCategory = button.getAttribute('data-category');
                    button.classList.toggle('highlighted', buttonCategory === category);
                });
            }



            function togglePinsAndCards(category, locations) {
                if (clickcount[category] === 2) {
                    clickcount[category] = 0;
                    locationCards.style.display = 'none';
                    map.removeLayer(locationLayer);
                } else {
                    locationCards.style.display = 'block';
                }


                if (locationLayer) {
                    map.removeLayer(locationLayer);
                    locationLayer = null;
                } else {
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
            }
        })
        .catch(error => {
            console.error("Error loading location data:", error);
            alert("Unable to load location data.");
        });

    fetch('data/location-desc.json')
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

                        if (!category) {
                            return;
                        }

                        var filteredData = locationData.features.filter(feature => category === 'all' || feature.properties.category === category);

                        locationLayer = L.geoJSON({
                            "type": "FeatureCollection",
                            "features": filteredData
                        }, {
                            pointToLayer: function (feature, latlng) {
                                var marker = L.marker(latlng)
                                    .bindPopup(`<h3>${feature.properties.name}</h3>`)
                                    .on('click', function () {
                                        map.setView(latlng, 15);
                                        showLocationDetails(feature);
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

                        var now = new Date();
                        var today = now.toISOString().split('T')[0];
                        var futureDates = [0, 1, 2].map(days => {
                            var futureDate = new Date();
                            futureDate.setDate(now.getDate() + days);
                            return futureDate.toISOString().split('T')[0];
                        });

                        var nearbyEvents = eventsData.features.filter(event => {
                            var eventLatLng = L.latLng(event.geometry.coordinates[1], event.geometry.coordinates[0]);
                            var eventDate = event.properties.date;
                            return (locationBounds.contains(eventLatLng) || eventLatLng.distanceTo(locationCenter) <= radius * 0.5) &&
                                (futureDates.includes(eventDate) || eventDate === today);
                        });

                        eventLayer = L.geoJSON({
                            "type": "FeatureCollection",
                            "features": nearbyEvents
                        }, {
                            pointToLayer: function (feature, latlng) {
                                return L.marker(latlng, {
                                    icon: L.divIcon({
                                        className: 'event-icon',
                                        html: '<div>📅</div>',
                                        iconSize: [32, 32]
                                    })
                                }).bindPopup(`<h3>${feature.properties.name}</h3><p>${feature.properties.date}<br>${feature.properties.time}</p>`)
                                    .on('click', function () {
                                        map.setView(latlng, 15);
                                    });
                            }
                        }).addTo(map);
                    }

                    updateMap('none');

                    document.querySelectorAll('.category-icons button').forEach(button => {
                        button.addEventListener('click', function () {
                            var selectedCategory = this.dataset.category;
                            updateMap(selectedCategory);
                        });
                    });

                    document.getElementById('resetMapBtn').addEventListener('click', function () {
                        map.setView([13.3411861, 74.7519958], 10);
                        updateMap('none');
                        locationLayer.clearLayers();
                    });

                    var searchInput = document.getElementById('search');

                    searchInput.addEventListener('input', function () {
                        var searchTerm = searchInput.value.toLowerCase();

                        if (searchTerm.trim() === "") {

                            updateMap('none');
                            locationLayer.clearLayers();
                            return;
                        }

                        var filteredData = locationData.features.filter(feature => feature.properties.name.toLowerCase().includes(searchTerm));

                        if (locationLayer) {
                            locationLayer.clearLayers();
                        }

                        L.geoJSON({
                            "type": "FeatureCollection",
                            "features": filteredData
                        }, {
                            pointToLayer: function (feature, latlng) {
                                var marker = L.marker(latlng)
                                    .bindPopup(`<h3>${feature.properties.name}</h3>`)
                                    .on('click', function () {
                                        map.setView(latlng, 15);
                                        showLocationDetails(feature);
                                    });
                                return marker;
                            }
                        }).addTo(map);

                        if (filteredData.length > 0) {
                            addEventPins(filteredData);
                        }
                    });

                    document.getElementById('gpsBtn').addEventListener('click', function () {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function (position) {
                                var lat = position.coords.latitude;
                                var lng = position.coords.longitude;
                                map.setView([lat, lng], 13);
                                L.marker([lat, lng]).addTo(map)
                                    .bindPopup("You are here")
                                    .openPopup();
                            }, function (error) {
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

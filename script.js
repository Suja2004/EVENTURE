document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    var map = L.map('map').setView([13.3411861, 74.7519958], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const locationsFile = 'locations.json';
    let currentMarker = null;

    // Fetch and populate categories
    const categoryButtons = document.querySelectorAll('#sidebar button');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            loadLocations(category);

            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Function to load and display locations
    const loadLocations = async (category) => {
        try {
            const response = await fetch(locationsFile);
            const data = await response.json();
            const locationsList = document.querySelector('.locations-list');
            locationsList.innerHTML = ''; 

            // Filter locations based on the selected category
            const filteredFeatures = data.features.filter(feature => feature.properties.category === category);
            filteredFeatures.forEach(feature => {
                const card = document.createElement('div');
                card.className = 'location-card';
                card.dataset.name = feature.properties.name;
                card.dataset.latitude = feature.geometry.coordinates[1];
                card.dataset.longitude = feature.geometry.coordinates[0];
                card.innerHTML = `
                    <img src="images/${feature.properties.img}" alt="${feature.properties.name}">
                    <h3>${feature.properties.name}</h3>
                `;
                card.addEventListener('click', () => {
                    document.getElementById('details').style.display = "block";
                    showDetails(
                        feature.properties.name,
                        feature.properties.description,
                        feature.properties.img,
                        feature.properties.address,
                        feature.properties.contact,
                        feature.properties.openingHours,
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0]
                    );
                });
                locationsList.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const showDetails = (name, description, img, address, contact, openingHours, latitude, longitude) => {
        const details = document.querySelector('#details');

        // Show location details
        details.innerHTML = `<div class="btns"><button id="closeDetailsButton" class="detailbtn"><i class="fa-solid fa-x"></i></button><button id="routeButton" class="detailbtn"><i class="fa-solid fa-route"></i></button><button id="toggle-route-btn" class="detailbtn"><i class="fa-solid fa-diamond-turn-right"></i></button></div>
            <h2>${name}</h2>
            <img src="images/${img}" alt="${name}" class="detail-image">
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Contact:</strong> ${contact}</p>
            <p><strong>Opening Hours:</strong> ${openingHours}</p>
        `;

        // Update map
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker = L.marker([latitude, longitude]).addTo(map)
            .bindPopup(`<b>${name}</b>`)
            .openPopup();

        map.setView([latitude, longitude], 15);
        document.getElementById('toggle-route-btn').addEventListener('click', function () {
            toggleRouteVisibility();
        });

        document.getElementById('routeButton').addEventListener('click', function () {
                displayRouteToDestination(latitude,longitude, name);
                document.getElementById('toggle-route-btn').style.display = 'block';
        });
        
        document.getElementById('closeDetailsButton').addEventListener('click', function () {
            details.style.display = 'none';
        });
    };

    function toggleRouteVisibility() {
        const routeContainer = document.querySelector('.leaflet-routing-container');

        if (routeContainer.style.display === 'block') {
            routeContainer.style.display = 'none';
        } else {
            routeContainer.style.display = 'block';
        }
    }

    let routeControl = null;

    function CenterToMe(sourceLat, sourceLng) {
        map.setView([sourceLat, sourceLng],7);

    }

    function displayRouteToDestination(destLat, destLng, destName) {
        if (!map) {
            console.error("Map is not initialized.");
            return;
        }

        // Get the current GPS location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const sourceLat = position.coords.latitude;
                const sourceLng = position.coords.longitude;

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
                    showAlternatives: true
                }).addTo(map);
                L.marker([sourceLat, sourceLng]).addTo(map)
                    .bindPopup("You are here")
                    .on('click', function () {
                        map.setView([sourceLat, sourceLng], 12);
                    })
                    .openPopup();
                L.marker([destLat, destLng]).addTo(map)
                    .bindPopup(destName)
                    .openPopup();
                CenterToMe(position.coords.latitude, position.coords.longitude);

            }, function (error) {
                console.error("Error fetching location:", error);
                alert("Unable to retrieve your location.");
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    const initialCategory = document.querySelector('#sidebar button').dataset.category;
    loadLocations(initialCategory);
});
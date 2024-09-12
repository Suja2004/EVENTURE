document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    var map = L.map('map').setView([13.3411861, 74.7519958], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const locationsFile = 'locations.json';
    let currentMarker = null;

    // Fetch and populate categories
    const categoryButtons = document.querySelectorAll('#sidebar button');

    const navbar = document.querySelectorAll('navbar a');

    var locationLayer = L.layerGroup().addTo(map);

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            loadLocations(category);

            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });


    // navbar.forEach(link =>{
    //     link.addEventListener('click',()=>{
    //         navbar.forEach(btn => btn.classList.remove('current'));
    //         link.classList.add('current');
    //     })
    // })
    // Function to load and display locations
    const loadLocations = async (category) => {
        try {
            const response = await fetch(locationsFile);
            const data = await response.json();
            const locationsList = document.querySelector('.locations-list');
            locationsList.innerHTML = ''; // Clear previous locations

            // Clear previous markers
            locationLayer.clearLayers();

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

                // Add a marker for each location
                const marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
                    .bindPopup(feature.properties.name)
                    .on('click', function () {
                        map.setView([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 13); // Center map on marker click
                    })
                    .addTo(locationLayer);

                card.addEventListener('click', () => {
                    if (window.matchMedia("(max-width: 640px)").matches) {
                        document.getElementById('details').style.display = "block";
                    } else {
                        document.getElementById('details').style.display = "flex";
                    }
                    document.getElementById('map').style.display = 'none';

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
        details.innerHTML = `
        <div class="btns image">
            <button id="routeButton" class="detailbtn"><i class="fa-solid fa-route"></i></button>
            <button id="save" class="save"><i class="fa-regular fa-bookmark"></i></button>
            <h2>${name}</h2>
            <img src="images/${img}" alt="${name}" class="detail-image">
        </div>
        <div class="descript" id="descript">
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Contact:</strong> ${contact}</p>
            <p><strong>Opening Hours:</strong> ${openingHours}</p>
        </div>
    `;

        // Attach the event listener to the save button
        document.getElementById('save').addEventListener('click', function () {
            toggleBookmark(this);
        });

        // Add marker to the map and other functionalities
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        currentMarker = L.marker([latitude, longitude]).addTo(map)
            .bindPopup(`<b>${name}</b>`)
            .openPopup();

        map.setView([latitude, longitude], 15);

        // Event listeners for other buttons
        document.getElementById('back-btn').addEventListener('click', function () {
            back();
        });

        document.getElementById('toggle-route-btn').addEventListener('click', function () {
            toggleRouteVisibility();
        });

        document.getElementById('routeButton').addEventListener('click', function () {
            displayRouteToDestination(latitude, longitude, name);
            document.getElementById('toggle-route-btn').style.display = 'block';
            document.getElementById('back-btn').style.display = 'block';
            document.getElementById('map').style.display = 'block';
            document.getElementById('det-con').style.minHeight = '100%';
            document.getElementById('details').style.display = 'none';
            document.getElementById('locations').style.display = 'none';
        });
    };

    function toggleBookmark(button) {
        const icon = button.querySelector('svg');

        if (!icon) {
            console.error("SVG icon element not found!");
            return;
        }

        if (icon.getAttribute('data-prefix') === 'far') {
            icon.setAttribute('data-prefix', 'fas');
        } else {
            icon.setAttribute('data-prefix', 'far'); 
        }
    }


    function back() {
        if (window.matchMedia("(max-width: 640px)").matches) {

            document.getElementById('details').style.display = "block";
            document.getElementById('det-con').style.minHeight = '54%';
        } else {
            document.getElementById('details').style.display = "flex";

        }
        document.getElementById('locations').style.display = 'block';
        document.getElementById('map').style.display = 'none';

    }

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
        map.setView([sourceLat, sourceLng], 17);

    }

    function displayRouteToDestination(destLat, destLng, destName) {
        if (!map) {
            console.error("Map is not initialized.");
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const sourceLat = position.coords.latitude;
                const sourceLng = position.coords.longitude;
                locationLayer.clearLayers();

                if (routeControl) {
                    locationLayer.clearLayers();
                    map.removeControl(routeControl);
                    routeControl = null;
                }

                routeControl = L.Routing.control({
                    waypoints: [
                        L.latLng(sourceLat, sourceLng),
                        L.latLng(destLat, destLng)
                    ],
                    showAlternatives: false
                }).addTo(map);
                L.marker([sourceLat, sourceLng]).addTo(map)
                    .bindPopup("You are here")
                    .on('click', function () {
                        map.setView([sourceLat, sourceLng], 15);
                    })
                    .openPopup();
                L.marker([destLat, destLng]).addTo(map)
                    .bindPopup(destName)
                    .on('click', function () {
                        map.setView([destLat, destLng], 15);
                    })
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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    var map = L.map('map').setView([13.3411861, 74.7519958], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const locationsFile = 'json/locations.json';
    let currentMarker = null;

    // Fetch and populate categories
    const categoryButtons = document.querySelectorAll('#sidebar button');

    // const navbar = document.querySelectorAll('navbar a');

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

            const locationsList = document.querySelector('.locations-list');
            locationsList.innerHTML = ''; // Clear previous locations

            // Clear previous markers
            locationLayer.clearLayers();

            const response = await fetch(locationsFile);
            const data = await response.json();
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

    const apiKey = '6e28638bfafdff2eb0d6c5c95d4d275e'; // Replace with your actual API key

const showDetails = (name, description, img, address, contact, openingHours, latitude, longitude) => {
    const details = document.querySelector('#details');

    // Show location details
    details.innerHTML = `
    <div class="btns image">
        <button id="save" class="save" onclick="togglePin('${name}')">
            ${isPinned(name) ? '<i class="fa-solid fa-bookmark"></i>' : '<i class="fa-regular fa-bookmark"></i>'}
        </button>
        <button id="routeButton" class="detailbtn"><i class="fa-solid fa-route"></i></button>
        <h2>${name}</h2>
        <img src="images/${img}" alt="${name}" class="detail-image">
    </div>
    <div class="descript" id="descript">
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Opening Hours:</strong> ${openingHours}</p>
        <p id="crowd-level"><strong>Crowd Level:</strong> Loading...</p>
        <p id="weather-info"><strong>Weather:</strong> Loading...</p>
    </div>
    `;

    // Fetch and display crowd level and weather data
    fetchCrowdAndWeatherData(latitude, longitude, name);

    // Event listeners for other buttons
    document.getElementById('save').addEventListener('click', function () {
        toggleBookmark(this);
    });

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();

    map.setView([latitude, longitude], 15);

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

// Fetch real-time weather data and display both crowd level and weather
const fetchCrowdAndWeatherData = async (latitude, longitude, name) => {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Check if required weather data is available
        if (data.main && data.main.temp && data.weather && data.weather[0].main) {
            const crowdLevel = estimateCrowd(data);
            const weatherInfo = `${data.main.temp}°C, ${data.weather[0].description}`;

            // Update the crowd level and weather info in the details section
            document.getElementById('crowd-level').innerHTML = `<strong>Crowd Level:</strong> ${crowdLevel}`;
            document.getElementById('weather-info').innerHTML = `<strong>Weather:</strong> ${weatherInfo}`;
        } else {
            throw new Error('Incomplete data received from API');
        }
    } catch (error) {
        console.error('Error fetching crowd and weather data:', error);
        document.getElementById('crowd-level').innerHTML = `<strong>Crowd Level:</strong> Unavailable`;
        document.getElementById('weather-info').innerHTML = `<strong>Weather:</strong> Unavailable`;
    }
};

// Function to estimate crowd level based on weather data
const estimateCrowd = (weatherData) => {
    const temp = weatherData.main.temp;
    const weatherCondition = weatherData.weather[0].main;

    if (temp > 30 && weatherCondition === "Clear") {
        return "High";
    } else if (temp <= 30 && temp >= 20) {
        return "Moderate";
    } else {
        return "Low";
    }
};


    function isPinned(name) {
        const pinnedLocations = JSON.parse(localStorage.getItem('pinnedLocations') || '[]');
        return pinnedLocations.includes(name);
    }

    window.togglePin = function (name) {
        let pinnedLocations = JSON.parse(localStorage.getItem('pinnedLocations') || '[]');
        if (pinnedLocations.includes(name)) {
            pinnedLocations = pinnedLocations.filter(location => location !== name);
        } else {
            pinnedLocations.push(name);
        }
        localStorage.setItem('pinnedLocations', JSON.stringify(pinnedLocations));
        // console.log(pinnedLocation);
    };

    async function displaySavedLocations() {
        const savedList = document.getElementById('saved-list');

        if (!savedList) {
            console.error('Element with id "saved-list" not found.');
            return;
        }

        while (savedList.firstChild) {
            savedList.removeChild(savedList.firstChild);
        }

        const pinnedLocations = JSON.parse(localStorage.getItem('pinnedLocations') || '[]');
        const response = await fetch(locationsFile);
        const data = await response.json();

        pinnedLocations.forEach(location => {

            const filteredFeatures = data.features.filter(feature => feature.properties.name === location);

            filteredFeatures.forEach(feature => {
                // Create container for each location
                const listItem = document.createElement('div');
                listItem.className = 'location-card';

                // Create image element
                const img = document.createElement('img');
                img.src = `images/${feature.properties.img}`; // Adjust path as necessary
                img.alt = feature.properties.name;
                img.className = 'location-image';
                // Create name element
                const name = document.createElement('p');
                name.textContent = feature.properties.name;
                name.className = 'location-name';

                // Append image and name to list item
                listItem.appendChild(img);
                listItem.appendChild(name);

                // Append list item to saved list
                savedList.appendChild(listItem);
            });
        });
    }

    displaySavedLocations();


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

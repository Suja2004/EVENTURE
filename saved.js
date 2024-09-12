let savedLocations = []; // Array to store saved locations

document.addEventListener('DOMContentLoaded', function () {
    displaySavedLocations();

    document.getElementById('back-to-map').addEventListener('click', function () {
        window.location.href = 'index.html'; 
    });
});

function displaySavedLocations() {
    const savedList = document.getElementById('saved-list');
    savedList.innerHTML = '';

    savedLocations.forEach(location => {
        const listItem = document.createElement('li');
        listItem.textContent = location.name;
        savedList.appendChild(listItem);
    });
}

// Function to load saved locations from localStorage
function loadSavedLocations() {
    const savedData = localStorage.getItem('savedLocations');
    if (savedData) {
        savedLocations = JSON.parse(savedData);
        displaySavedLocations();
    }
}

// Function to save locations to localStorage
function saveToLocalStorage() {
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
}

loadSavedLocations();

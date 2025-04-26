function initGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                updatePickupLocation(latitude, longitude);
                fetchNearbyHospitals(latitude, longitude);
            },
            error => {
                console.error('Error getting location:', error);
                document.getElementById('pickupStatic').textContent = 
                    'Cheeriyal, Telangana (Default)';
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function updatePickupLocation(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            const address = data.address || {};
            // Build full address from components
            const addressParts = [];
            if (address.road) addressParts.push(address.road);
            if (address.house_number) addressParts.push(address.house_number);
            if (address.suburb) addressParts.push(address.suburb);
            if (address.city) addressParts.push(address.city);
            if (address.town) addressParts.push(address.town);
            if (address.village) addressParts.push(address.village);
            if (address.state) addressParts.push(address.state);
            if (address.postcode) addressParts.push(address.postcode);
            if (address.country) addressParts.push(address.country);

            const fullAddress = addressParts.join(', ');
            
            document.getElementById('pickupStatic').textContent = 
                fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        })
        .catch(() => {
            document.getElementById('pickupStatic').textContent = 
                `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        });
}

async function fetchNearbyHospitals(lat, lng) {
    const radius = 10000;
    const query = `[out:json];
        node[amenity=hospital](around:${radius},${lat},${lng});
        out;`;
    
    try {
        const response = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        populateHospitalList(data.elements);
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        document.getElementById('destinationSelect').innerHTML = `
            <option value="">Unable to load hospitals</option>
            <option>City General Hospital</option>
            <option>Regional Trauma Care</option>
        `;
    }
}

function populateHospitalList(hospitals) {
    const select = document.getElementById('destinationSelect');
    select.innerHTML = '<option value="">Select a nearby hospital</option>';
    
    hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital.tags.name || 'Unnamed Hospital';
        option.textContent = hospital.tags.name || 'Unnamed Hospital';
        if (hospital.tags['emergency'] === 'yes') {
            option.textContent += ' (24/7 Emergency)';
        }
        select.appendChild(option);
    });
    
    if (hospitals.length === 0) {
        select.innerHTML = `
            <option value="">No hospitals found in 5km radius</option>
            <option>City General Hospital</option>
            <option>Regional Trauma Care</option>
        `;
    }
}

// Event Listeners
document.getElementById('togglePickupManual').addEventListener('change', function() {
    const manualInput = document.getElementById('pickupManual');
    const staticDisplay = document.getElementById('pickupStatic');
    manualInput.classList.toggle('hidden');
    staticDisplay.style.display = this.checked ? 'none' : 'block';
    manualInput.required = this.checked;
});

document.getElementById('toggleDestManual').addEventListener('change', function() {
    const manualInput = document.getElementById('destinationManual');
    const selectInput = document.getElementById('destinationSelect');
    manualInput.classList.toggle('hidden');
    selectInput.style.display = this.checked ? 'none' : 'block';
    manualInput.required = this.checked;
    selectInput.required = !this.checked;
});

function handleBooking() {
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const pickup = document.getElementById('togglePickupManual').checked 
        ? document.getElementById('pickupManual').value
        : document.getElementById('pickupStatic').textContent;
    const destination = document.getElementById('toggleDestManual').checked
        ? document.getElementById('destinationManual').value
        : document.getElementById('destinationSelect').value;

    if (!fullName || !phone || !pickup || !destination) {
        alert('Please fill in all required fields');
        return;
    }

    fetch('http://localhost:3000/book-ambulance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fullName,
            phone,
            pickup,
            destination
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || 'Ambulance booked successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    });
}

// Initialize application
initGeolocation();

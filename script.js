const CONFIG = {
    NASA_API_KEY: 'AJCQXy383Z7fGIxzN8TwbaJXmSofj0m8qjXSBqdo',
    SOLAR_SCALE: 0.0001,
    ISS_UPDATE_INTERVAL: 5000
};

let issMap, issMarker;
let solarScene, solarCamera, solarRenderer, solarControls;
let neoChart;

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    showSection('apod');
    initAPOD();
    initSpaceX();
    initISS();
    initNEO();
});

function initParticles() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 200, density: { enable: true, value_area: 800 } },
            color: { value: '#FFFFFF' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            }
        }
    });
}

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showSection(btn.dataset.section);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const activeSection = document.getElementById(sectionId);
    activeSection.classList.add('active');
    
    if(sectionId === 'iss') {
        setTimeout(() => issMap.invalidateSize(), 100);
    }
    if(sectionId === 'solar') {
        initSolarSystem();
    }
}

async function initAPOD() {
    const apodSearchBtn = document.getElementById('apodSearchBtn');
    apodSearchBtn.addEventListener('click', fetchAPOD);
    await fetchAPOD();
}

async function fetchAPOD() {
    try {
        showLoader();
        const date = document.getElementById('apodDate').value;
        const response = await fetch(
            `https://api.nasa.gov/planetary/apod?api_key=${CONFIG.NASA_API_KEY}&date=${date || ''}`
        );
        const data = await response.json();
        
        const apodDisplay = document.getElementById('apodDisplay');
        apodDisplay.innerHTML = `
            <h3>${data.title}</h3>
            ${data.media_type === 'image' ? 
                `<img src="${data.url}" alt="${data.title}">` : 
                `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`}
            <p>${data.explanation}</p>
            ${data.copyright ? `<p class="copyright">© ${data.copyright}</p>` : ''}
        `;
    } catch (error) {
        showError('Failed to load APOD');
    } finally {
        hideLoader();
    }
}

async function initSpaceX() {
    try {
        showLoader();
        const response = await fetch('https://api.spacexdata.com/v4/launches/past');
        const launches = await response.json();
        
        const spacexData = document.getElementById('spacexData');
        spacexData.innerHTML = launches.reverse().slice(0, 5).map(launch => `
            <div class="card">
                <h3>${launch.name}</h3>
                <p>${new Date(launch.date_utc).toLocaleDateString()}</p>
                <p>${launch.details || 'No details available'}</p>
                ${launch.links.patch.small ? 
                    `<img src="${launch.links.patch.small}" alt="Mission Patch">` : ''}
                ${launch.links.webcast ? 
                    `<a href="${launch.links.webcast}" target="_blank">Watch Launch</a>` : ''}
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to load SpaceX data');
    } finally {
        hideLoader();
    }
}

function initISS() {
    issMap = L.map('issMap').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(issMap);
    
    const issIcon = L.icon({
        iconUrl: 'https://img.icons8.com/color/48/iss.png',
        iconSize: [40, 40]
    });
    
    issMarker = L.marker([0, 0], { icon: issIcon }).addTo(issMap);
    
    const updateISS = async () => {
        try {
            const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
            const data = await response.json();
            
            issMarker.setLatLng([data.latitude, data.longitude]);
            issMap.panTo([data.latitude, data.longitude]);
            
            document.getElementById('issLat').textContent = data.latitude.toFixed(4);
            document.getElementById('issLon').textContent = data.longitude.toFixed(4);
            document.getElementById('issVel').textContent = (data.velocity * 3.6).toFixed(2);
        } catch (error) {
            showError('Failed to update ISS position');
        }
    };
    
    updateISS();
    setInterval(updateISS, CONFIG.ISS_UPDATE_INTERVAL);
}

function initSolarSystem() {

    if(solarScene) {
        while(solarScene.children.length > 0) { 
            solarScene.remove(solarScene.children[0]); 
        }
    } else {
        solarScene = new THREE.Scene();
        solarCamera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 4000);
        solarRenderer = new THREE.WebGLRenderer({ antialias: true });
        solarRenderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('solarSystem').appendChild(solarRenderer.domElement);
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    solarScene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1.5, 2000);
    sunLight.position.set(0, 0, 0);
    solarScene.add(sunLight);

    // Create Sun (scaled for visibility)
    const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sunMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.8
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    solarScene.add(sun);

    // Planet data (scaled for visualization)
    const planets = [
        {
            name: "Mercury",
            radius: 2.44,    // in 1000km
            distance: 57.9,  // in million km
            color: 0x888888,
            speed: 0.017,
            orbitalPeriod: 88,
            facts: [
                "Closest planet to the Sun",
                "No atmosphere",
                "Surface temperature range: -173°C to 427°C",
                "Orbital speed: 47.36 km/s"
            ]
        },
        {
            name: "Venus",
            radius: 6.05,
            distance: 108.2,
            color: 0xFFD700,
            speed: 0.013,
            orbitalPeriod: 225,
            facts: [
                "Hottest planet (462°C average)",
                "Volcanic surface",
                "Day longer than year (243 Earth days)",
                "Retrograde rotation"
            ]
        },
        {
            name: "Earth",
            radius: 6.37,
            distance: 149.6,
            color: 0x4169E1,
            speed: 0.011,
            orbitalPeriod: 365.25,
            facts: [
                "Only known life-bearing planet",
                "71% surface covered by water",
                "1 Moon (Luna)",
                "Orbital speed: 29.78 km/s"
            ]
        },
        {
            name: "Mars",
            radius: 3.39,
            distance: 227.9,
            color: 0xFF4500,
            speed: 0.009,
            orbitalPeriod: 687,
            facts: [
                "Red Planet (iron oxide surface)",
                "2 moons (Phobos & Deimos)",
                "Tallest volcano: Olympus Mons",
                "Potential for liquid water"
            ]
        },
        {
            name: "Jupiter",
            radius: 69.9,
            distance: 778.3,
            color: 0xDAA520,
            speed: 0.005,
            orbitalPeriod: 4333,
            facts: [
                "Largest planet in solar system",
                "79 known moons",
                "Great Red Spot (giant storm)",
                "Strong magnetic field"
            ]
        },
        {
            name: "Saturn",
            radius: 58.2,
            distance: 1427,
            color: 0xF4A460,
            speed: 0.0035,
            orbitalPeriod: 10759,
            facts: [
                "Spectacular ring system",
                "62 confirmed moons",
                "Least dense planet",
                "Hexagonal north polar storm"
            ]
        },
        {
            name: "Uranus",
            radius: 25.3,
            distance: 2871,
            color: 0x87CEEB,
            speed: 0.0025,
            orbitalPeriod: 30687,
            facts: [
                "Ice giant planet",
                "Axial tilt: 97.77°",
                "27 known moons",
                "Coldest planetary atmosphere (-224°C)"
            ]
        },
        {
            name: "Neptune",
            radius: 24.6,
            distance: 4497,
            color: 0x4682B4,
            speed: 0.002,
            orbitalPeriod: 60190,
            facts: [
                "Windiest planet (2100 km/h winds)",
                "14 known moons",
                "Great Dark Spot storm system",
                "Farthest known solar planet"
            ]
        }
    ];

    // Create planets
    planets.forEach(planet => {
        // Scale down for visualization (1 unit = 1 million km)
        const scaledRadius = planet.radius * 0.2; // Increased size for visibility
        const scaledDistance = planet.distance * 0.1; // Adjusted distance scaling

        // Planet mesh
        const geometry = new THREE.SphereGeometry(scaledRadius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: planet.color,
            specular: 0x222222,
            shininess: 10
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Create orbital path
        const orbitGeometry = new THREE.RingGeometry(
            scaledDistance - scaledRadius,
            scaledDistance + scaledRadius,
            64
        );
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        solarScene.add(orbit);

        // Position planet
        mesh.position.x = scaledDistance;
        solarScene.add(mesh);

        // Add interactive elements
        mesh.userData = planet;
        mesh.addEventListener('click', showPlanetInfo);

        // Animation
        function animate() {
            requestAnimationFrame(animate);
            const angle = Date.now() * 0.001 * planet.speed;
            mesh.position.x = Math.cos(angle) * scaledDistance;
            mesh.position.z = Math.sin(angle) * scaledDistance;
            mesh.rotation.y += 0.005;
        }
        animate();
    });

    // Camera setup
    solarCamera.position.set(0, 500, 1000);
    solarControls = new THREE.OrbitControls(solarCamera, solarRenderer.domElement);

    solarControls.minDistance = 100;
    solarControls.maxDistance = 3000;
    solarControls.autoRotate = true;
    solarControls.autoRotateSpeed = 0.5;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        solarRenderer.render(solarScene, solarCamera);
        solarControls.update();
    }
    animate();
}

// Enhanced Planet Info Display
function showPlanetInfo(event) {
    const planet = event.target.userData;
    const modal = document.getElementById('planetModal');
    
    document.getElementById('planetName').textContent = planet.name;
    document.getElementById('planetInfo').innerHTML = `
        <div class="planet-stats">
            <p><i class="fas fa-ruler"></i> Diameter: ${(planet.radius * 2).toLocaleString()} km</p>
            <p><i class="fas fa-sun"></i> Distance from Sun: ${planet.distance.toLocaleString()} million km</p>
            <p><i class="fas fa-clock"></i> Orbital Period: ${planet.orbitalPeriod} Earth days</p>
            <p><i class="fas fa-tachometer-alt"></i> Orbital Speed: ${(planet.speed * 100).toFixed(1)} km/s</p>
        </div>
        <div class="planet-facts">
            <h4>Key Features:</h4>
            <ul>${planet.facts.map(fact => `<li>${fact}</li>`).join('')}</ul>
        </div>
    `;

    // Update chart
    const ctx = document.getElementById('planetChart').getContext('2d');
    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Size', 'Distance', 'Orbital Speed', 'Orbital Period'],
            datasets: [{
                data: [
                    planet.radius,
                    planet.distance / 100,
                    planet.speed * 100,
                    planet.orbitalPeriod / 100
                ],
                backgroundColor: [
                    '#00f3ff',
                    '#4a00e0',
                    '#ff4655',
                    '#00ff87'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    modal.style.display = 'block';
    gsap.from(modal, { scale: 0.8, opacity: 0, duration: 0.3 });
}

async function initNEO() {
    try {
        showLoader();
        const response = await fetch(
            `https://api.nasa.gov/neo/rest/v1/feed?api_key=${CONFIG.NASA_API_KEY}`
        );
        const data = await response.json();
        const neoList = Object.values(data.near_earth_objects).flat();
        
        const ctx = document.getElementById('neoChart').getContext('2d');
        neoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: neoList.slice(0, 10).map(n => n.name),
                datasets: [{
                    label: 'Estimated Diameter (km)',
                    data: neoList.slice(0, 10).map(n => n.estimated_diameter.kilometers.estimated_diameter_max),
                    backgroundColor: 'rgba(0, 243, 255, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        showError('Failed to load NEO data');
    } finally {
        hideLoader();
    }
}

function showLoader() {
    document.querySelector('.loader').style.display = 'flex';
}

function hideLoader() {
    document.querySelector('.loader').style.display = 'none';
}

function showError(message) {
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = message;
    document.body.appendChild(errorToast);
    
    setTimeout(() => errorToast.remove(), 5000);
}

window.addEventListener('resize', () => {
    if(issMap) issMap.invalidateSize();
    if(solarRenderer) {
        solarRenderer.setSize(window.innerWidth, window.innerHeight);
        solarCamera.aspect = window.innerWidth / window.innerHeight;
        solarCamera.updateProjectionMatrix();
    }
});
// =====================================
// Celestial Odyssey – Main JavaScript
// =====================================


const NASA_API_KEY = "AJCQXy383Z7fGIxzN8TwbaJXmSofj0m8qjXSBqdo";

// ============================
// 1. APOD: Astronomy Picture of the Day
// ============================
async function fetchAPOD(date = "") {
  try {
    let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
    if (date) url += `&date=${date}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch APOD data");
    const data = await response.json();
    displayAPOD(data);
  } catch (error) {
    console.error("APOD Error:", error);
    document.getElementById("apodDisplay").innerHTML = "<p>Unable to load APOD data.</p>";
  }
}

function displayAPOD(data) {
  const container = document.getElementById("apodDisplay");
  container.innerHTML = `
    <h3>${data.title}</h3>
    ${
      data.media_type === "image"
        ? `<img src="${data.url}" alt="${data.title}">`
        : `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`
    }
    <p>${data.explanation}</p>
  `;
}

// ============================
// 2. ISS Tracker
// ============================
async function fetchISSTracker() {
  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!response.ok) throw new Error("Failed to fetch ISS data");
    const data = await response.json();
    displayISS(data);
  } catch (error) {
    console.error("ISS Tracker Error:", error);
    document.getElementById("issData").innerHTML = "<p>Unable to fetch ISS data.</p>";
  }
}

function displayISS(data) {
  const container = document.getElementById("issData");
  container.innerHTML = `
    <p><strong>Latitude:</strong> ${data.latitude.toFixed(2)}</p>
    <p><strong>Longitude:</strong> ${data.longitude.toFixed(2)}</p>
    <p><strong>Altitude:</strong> ${data.altitude.toFixed(2)} km</p>
  `;
}

// ============================
// 3. Near-Earth Objects (NEO)
// ============================
async function fetchNEOData() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`);
    if (!response.ok) throw new Error("Failed to fetch NEO data");
    const data = await response.json();
    displayNEO(data.near_earth_objects[today] || []);
  } catch (error) {
    console.error("NEO Error:", error);
    document.getElementById("neoData").innerHTML = "<p>Unable to load NEO data.</p>";
  }
}

function displayNEO(neoList) {
  const container = document.getElementById("neoData");
  if (!neoList.length) {
    container.innerHTML = "<p>No Near-Earth Objects today.</p>";
    return;
  }
  // Display first NEO as a sample
  const neo = neoList[0];
  container.innerHTML = `
    <p><strong>Name:</strong> ${neo.name}</p>
    <p><strong>Estimated Diameter:</strong> ${neo.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km</p>
    <p><strong>Miss Distance:</strong> ${neo.close_approach_data[0].miss_distance.kilometers} km</p>
  `;
}

// ============================
// 4. SpaceX Launches
// ============================
async function fetchSpaceXLaunches() {
  try {
    const response = await fetch("https://api.spacexdata.com/v4/launches/upcoming");
    if (!response.ok) throw new Error("Failed to fetch SpaceX launches");
    const launches = await response.json();
    displaySpaceXLaunches(launches);
  } catch (error) {
    console.error("SpaceX Error:", error);
    document.getElementById("spacexData").innerHTML = "<p>Unable to load SpaceX launch data.</p>";
  }
}

function displaySpaceXLaunches(launches) {
  const container = document.getElementById("spacexData");
  container.innerHTML = "";
  if (!launches.length) {
    container.innerHTML = "<p>No upcoming launches found.</p>";
    return;
  }
  launches.forEach(launch => {
    const launchCard = document.createElement("div");
    launchCard.className = "launch-card";
    launchCard.innerHTML = `
      <h4>${launch.name}</h4>
      <p><strong>Date:</strong> ${new Date(launch.date_utc).toLocaleDateString()}</p>
      <p>${launch.details ? launch.details.substring(0, 100) + "..." : "No details available."}</p>
    `;
    container.appendChild(launchCard);
  });
}

// ============================
// 5. Chart.js Visualization (NEO Count Sample)
// ============================
function renderNEOChart() {
  const ctx = document.getElementById("neoChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
      datasets: [{
        label: "NEO Count",
        data: [5, 7, 3, 8, 6],
        backgroundColor: "rgba(0, 243, 255, 0.3)",
        borderColor: "rgba(0, 243, 255, 1)",
        fill: true,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ============================
// 6. Solar System Explorer (3D Interactive Simulation using Three.js)
// ============================
function initSolarSystem() {
  const solarContainer = document.getElementById("solarDisplay");
  solarContainer.innerHTML = "";

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(solarContainer.clientWidth, solarContainer.clientHeight);
  solarContainer.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, solarContainer.clientWidth / solarContainer.clientHeight, 0.1, 1000);
  camera.position.z = 50;

  // Add ambient and point lights
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  // Create Sun
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Create interactive planets with OrbitControls
  const planetData = [
    { size: 1.5, color: 0x00aaff, orbit: 12 },
    { size: 2, color: 0xff5555, orbit: 20 },
    { size: 1.8, color: 0x55ff55, orbit: 28 },
    { size: 1.2, color: 0xff66cc, orbit: 35 },
    { size: 1.6, color: 0xffff66, orbit: 42 }
  ];
  const planets = [];
  planetData.forEach(data => {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: data.color });
    const planet = new THREE.Mesh(geometry, material);
    planet.orbitRadius = data.orbit;
    planet.angle = Math.random() * Math.PI * 2;
    scene.add(planet);
    planets.push(planet);
  });

  // Allow user interactivity: OrbitControls (if available)
  // Note: OrbitControls is not included by default. You can add it via a separate script if desired.
  // For simplicity, we simulate basic mouse interaction:
  document.addEventListener("mousemove", (e) => {
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
  });

  function animateSolar() {
    requestAnimationFrame(animateSolar);
    planets.forEach(planet => {
      planet.angle += 0.005;
      planet.position.x = Math.cos(planet.angle) * planet.orbitRadius;
      planet.position.z = Math.sin(planet.angle) * planet.orbitRadius;
    });
    renderer.render(scene, camera);
  }
  animateSolar();
}

// ============================
// 7. Modal Handling for Detailed Info (e.g. on clicking a book card)
// ============================
document.getElementById("modalClose").addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal")) closeModal();
});

function openModal(content) {
  const modal = document.getElementById("modal");
  document.getElementById("modalBody").innerHTML = content;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ============================
// 8. Page Initialization & Periodic Data Refresh
// ============================
document.addEventListener("DOMContentLoaded", () => {
  fetchAPOD();
  fetchISSTracker();
  fetchNEOData();
  renderNEOChart();
  initSolarSystem();
  fetchSpaceXLaunches();
});

// ============================
// 9. Search Functionality for APOD (by Date) and Mars Photos (optional)
// ============================
document.getElementById("apodSearchBtn").addEventListener("click", () => {
  const date = document.getElementById("apodDate").value;
  if (!date) {
    alert("Please enter a date (YYYY-MM-DD).");
    return;
  }
  fetchAPOD(date);
});





// ============================
// 11. Expose Global Functions for Modal Actions (if needed)
// ============================
window.openModal = openModal;
window.closeModal = closeModal;

// =====================================
// End of Cosmic Odyssey Script
// =====================================

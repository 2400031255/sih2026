/* ============================================================
   AGRISYNC OS — MAPS MODULE
   Uses: Leaflet.js + OpenStreetMap (FREE, no API key needed)
   ============================================================ */

let leafletLoaded = false;
let leafletPromise = null;

// ── LOAD LEAFLET ───────────────────────────────────────────
export function loadLeaflet() {
  if (leafletLoaded && window.L) return Promise.resolve();
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload  = () => { leafletLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

// ── INIT BASIC MAP ─────────────────────────────────────────
export async function initMap(containerId, options = {}) {
  try {
    await loadLeaflet();
    const container = document.getElementById(containerId);
    if (!container) return null;
    container.style.height = options.height || '420px';

    const center = options.center || [17.3850, 78.4867];
    const map = L.map(containerId, { zoomControl: true }).setView(center, options.zoom || 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return map;
  } catch (err) {
    showMapError(containerId, err.message);
    return null;
  }
}

// ── CUSTOM ICON ────────────────────────────────────────────
function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};color:#fff;border-radius:50%;
      width:36px;height:36px;display:flex;align-items:center;
      justify-content:center;font-size:16px;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2px solid #fff;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── FARMER MAP: live location + nearby factories ───────────
export async function initFarmerMap(containerId, lat, lon, factories = []) {
  const map = await initMap(containerId, { center: [lat, lon], zoom: 12 });
  if (!map) return;

  // Live location marker with accuracy circle
  L.circle([lat, lon], { radius: 200, color: '#245C3A', fillOpacity: 0.1 }).addTo(map);
  L.marker([lat, lon], { icon: makeIcon('#245C3A', '📍') })
    .addTo(map)
    .bindPopup('<strong>📍 Your Farm Location</strong><br><small>Live GPS</small>')
    .openPopup();

  // Factory markers
  factories.forEach(f => {
    if (!f.lat || !f.lng) return;
    L.marker([f.lat, f.lng], { icon: makeIcon('#D5A928', '🏭') })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:160px">
          <strong>🏭 ${f.name}</strong><br>
          <span style="font-size:12px;color:#666">${f.distance} km away</span><br>
          <span style="font-size:12px;color:#245C3A">${f.crop || 'Multiple crops'}</span>
        </div>`);
  });

  return map;
}

// ── ROUTE MAP: pickup → delivery with polyline ─────────────
export async function initRouteMap(containerId, originLatLng, destLatLng, stops = []) {
  const midLat = (originLatLng[0] + destLatLng[0]) / 2;
  const midLon = (originLatLng[1] + destLatLng[1]) / 2;
  const map = await initMap(containerId, { center: [midLat, midLon], zoom: 10 });
  if (!map) return null;

  // Draw route via OSRM (free routing)
  try {
    const coords = [originLatLng, ...stops, destLatLng];
    const waypoints = coords.map(c => `${c[1]},${c[0]}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      L.geoJSON(route.geometry, {
        style: { color: '#245C3A', weight: 5, opacity: 0.8 }
      }).addTo(map);
      map.fitBounds(L.geoJSON(route.geometry).getBounds(), { padding: [40, 40] });

      const dist = (route.distance / 1000).toFixed(1);
      const dur  = Math.round(route.duration / 60);
      return { distance: `${dist} km`, duration: `${dur} min` };
    }
  } catch {
    // Fallback: straight line
    L.polyline([originLatLng, destLatLng], { color: '#245C3A', weight: 4, dashArray: '8,6' }).addTo(map);
  }

  // Markers
  L.marker(originLatLng, { icon: makeIcon('#245C3A', '📦') }).addTo(map)
    .bindPopup('<strong>📦 Pickup Point</strong>');
  L.marker(destLatLng, { icon: makeIcon('#C96B4B', '🏭') }).addTo(map)
    .bindPopup('<strong>🏭 Delivery Point</strong>');

  const dist = calculateDistance(originLatLng[0], originLatLng[1], destLatLng[0], destLatLng[1]);
  return { distance: `${dist} km`, duration: 'Calculating...' };
}

// ── LIVE TRACKING MAP ──────────────────────────────────────
export async function initLiveTrackingMap(containerId, deliveries = []) {
  const map = await initMap(containerId, { zoom: 11 });
  if (!map) return null;

  const bounds = [];
  deliveries.forEach(d => {
    if (d.currentLat && d.currentLng) {
      const m = L.marker([d.currentLat, d.currentLng], { icon: makeIcon('#C96B4B', '🚚') })
        .addTo(map)
        .bindPopup(`<strong>🚚 ${d.truckNo || 'Truck'}</strong><br>${d.cropName || ''}<br><span style="color:#245C3A">${d.status}</span>`);
      bounds.push([d.currentLat, d.currentLng]);
    }
  });

  if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  return map;
}

// ── CALCULATE DISTANCE (Haversine) ────────────────────────
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
          + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ── MAP ERROR STATE ────────────────────────────────────────
function showMapError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.height = '200px';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                height:100%;gap:12px;background:rgba(36,92,58,0.04);border-radius:12px">
      <div style="font-size:40px">🗺️</div>
      <div style="font-weight:600;color:var(--text-primary)">Map unavailable</div>
      <div style="font-size:13px;color:var(--text-muted);text-align:center;max-width:240px">${msg}</div>
    </div>`;
}

/* ============================================================
   AGRISYNC OS — MAPS MODULE
   Uses: Google Maps JavaScript API
   ⚠️  Requires GOOGLE_MAPS_KEY in firebase.js
   ============================================================ */

import { GOOGLE_MAPS_KEY } from './firebase.js';

let mapsLoaded = false;
let mapsLoadPromise = null;

// ── LOAD GOOGLE MAPS SDK ───────────────────────────────────
export function loadGoogleMaps() {
  if (mapsLoaded) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  mapsLoadPromise = new Promise((resolve, reject) => {
    window.__gmapsCallback = () => { mapsLoaded = true; resolve(); };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry&callback=__gmapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

// ── INIT BASIC MAP ─────────────────────────────────────────
export async function initMap(containerId, options = {}) {
  try {
    await loadGoogleMaps();
    const container = document.getElementById(containerId);
    if (!container) return null;

    const defaultCenter = options.center || { lat: 17.3850, lng: 78.4867 }; // Hyderabad
    const map = new google.maps.Map(container, {
      center:    defaultCenter,
      zoom:      options.zoom || 12,
      mapTypeId: options.type || 'roadmap',
      styles:    getMapStyles(),
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    return map;
  } catch (err) {
    showMapError(containerId, err.message);
    return null;
  }
}

// ── ADD MARKER ─────────────────────────────────────────────
export function addMarker(map, { lat, lng, title, icon, info, color = '#245C3A' }) {
  if (!map || !google) return null;

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title,
    icon: icon || {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    },
    animation: google.maps.Animation.DROP,
  });

  if (info) {
    const infoWindow = new google.maps.InfoWindow({ content: info });
    marker.addListener('click', () => infoWindow.open(map, marker));
  }

  return marker;
}

// ── FARMER MAP: Show location + nearby factories ───────────
export async function initFarmerMap(containerId, farmerLat, farmerLng, factories = []) {
  const map = await initMap(containerId, {
    center: { lat: farmerLat, lng: farmerLng },
    zoom: 11,
  });
  if (!map) return;

  // Farmer marker
  addMarker(map, {
    lat: farmerLat, lng: farmerLng,
    title: 'Your Location',
    color: '#245C3A',
    info: '<div style="padding:8px"><strong>📍 Your Farm</strong></div>',
  });

  // Factory markers
  factories.forEach(f => {
    addMarker(map, {
      lat: f.lat, lng: f.lng,
      title: f.name,
      color: '#D5A928',
      info: `
        <div style="padding:8px;min-width:160px">
          <strong>🏭 ${f.name}</strong><br>
          <span style="font-size:12px;color:#666">${f.distance} km away</span><br>
          <span style="font-size:12px;color:#245C3A">${f.crop || ''}</span>
        </div>
      `,
    });
  });
}

// ── LOGISTICS MAP: Route between pickup and delivery ───────
export async function initRouteMap(containerId, origin, destination) {
  const map = await initMap(containerId, { zoom: 10 });
  if (!map) return;

  const directionsService  = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    polylineOptions: { strokeColor: '#245C3A', strokeWeight: 4 },
    suppressMarkers: false,
  });

  try {
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    });
    directionsRenderer.setDirections(result);

    const leg = result.routes[0].legs[0];
    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
    };
  } catch (err) {
    console.warn('Route calculation failed:', err);
    return null;
  }
}

// ── GEOCODE ADDRESS ────────────────────────────────────────
export async function geocodeAddress(address) {
  try {
    await loadGoogleMaps();
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          reject(new Error('Geocoding failed'));
        }
      });
    });
  } catch (err) {
    return null;
  }
}

// ── CALCULATE DISTANCE ─────────────────────────────────────
export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2
          + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180)
          * Math.sin(dLng/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ── MAP ERROR STATE ────────────────────────────────────────
function showMapError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="map-placeholder">
      <div style="font-size:40px">🗺️</div>
      <div style="font-weight:600;color:var(--text-primary)">Map unavailable</div>
      <div style="font-size:13px;color:var(--text-muted);text-align:center;max-width:240px">
        ${msg || 'Configure Google Maps API key to enable maps.'}
      </div>
    </div>
  `;
}

// ── CUSTOM MAP STYLES (Natural/Agricultural theme) ─────────
function getMapStyles() {
  return [
    { featureType: 'water',      elementType: 'geometry', stylers: [{ color: '#a0c4d8' }] },
    { featureType: 'landscape',  elementType: 'geometry', stylers: [{ color: '#e8f0e0' }] },
    { featureType: 'road',       elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road',       elementType: 'geometry.stroke', stylers: [{ color: '#d4d4d4' }] },
    { featureType: 'poi.park',   elementType: 'geometry', stylers: [{ color: '#c5dba4' }] },
    { featureType: 'transit',    stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  ];
}

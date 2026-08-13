/* ============================================================
   AGRISYNC OS — WEATHER MODULE
   Uses: Open-Meteo API (FREE, no key needed) + Nominatim geocoding
   ============================================================ */

import { showToast } from './navigation.js';

const CACHE_KEY      = 'agrisync_weather_v2';
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes

const WMO_CODES = {
  0:  { label:'Clear Sky',          icon:'☀️' },
  1:  { label:'Mainly Clear',       icon:'🌤️' },
  2:  { label:'Partly Cloudy',      icon:'⛅' },
  3:  { label:'Overcast',           icon:'☁️' },
  45: { label:'Foggy',              icon:'🌫️' },
  48: { label:'Icy Fog',            icon:'🌫️' },
  51: { label:'Light Drizzle',      icon:'🌦️' },
  53: { label:'Drizzle',            icon:'🌦️' },
  55: { label:'Heavy Drizzle',      icon:'🌧️' },
  61: { label:'Light Rain',         icon:'🌧️' },
  63: { label:'Rain',               icon:'🌧️' },
  65: { label:'Heavy Rain',         icon:'🌧️' },
  71: { label:'Light Snow',         icon:'❄️' },
  73: { label:'Snow',               icon:'❄️' },
  75: { label:'Heavy Snow',         icon:'❄️' },
  80: { label:'Rain Showers',       icon:'🌦️' },
  81: { label:'Showers',            icon:'🌧️' },
  82: { label:'Violent Showers',    icon:'⛈️' },
  95: { label:'Thunderstorm',       icon:'⛈️' },
  96: { label:'Thunderstorm+Hail',  icon:'⛈️' },
  99: { label:'Thunderstorm+Hail',  icon:'⛈️' },
};

// ── GET USER LOCATION ──────────────────────────────────────
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()  => reject(new Error('Location permission denied')),
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

// ── REVERSE GEOCODE (city name from coords) ────────────────
async function getCityName(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'Accept-Language': 'en' }
    });
    const d = await r.json();
    return d.address?.city || d.address?.town || d.address?.village || d.address?.county || 'Your Location';
  } catch { return 'Your Location'; }
}

// ── FETCH WEATHER (Open-Meteo, free, no key) ───────────────
export async function fetchWeather(lat, lon) {
  const cached = getCachedWeather(lat, lon);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation`
      + `&hourly=temperature_2m,weather_code,precipitation_probability`
      + `&daily=sunrise,sunset,precipitation_probability_max,temperature_2m_max,temperature_2m_min`
      + `&timezone=auto&forecast_days=1`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const city = await getCityName(lat, lon);
    const result = processOpenMeteo(data, city);
    cacheWeather(lat, lon, result);
    return result;
  } catch (err) {
    console.warn('Weather fetch failed:', err.message);
    return getMockWeather();
  }
}

// ── FETCH HOURLY FORECAST ──────────────────────────────────
export async function fetchForecast(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&hourly=temperature_2m,weather_code,precipitation_probability`
      + `&timezone=auto&forecast_days=1`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const now  = new Date();
    const currentHour = now.getHours();
    return data.hourly.time
      .map((t, i) => ({
        time:    new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        temp:    Math.round(data.hourly.temperature_2m[i]),
        icon:    (WMO_CODES[data.hourly.weather_code[i]] || WMO_CODES[0]).icon,
        condition: (WMO_CODES[data.hourly.weather_code[i]] || WMO_CODES[0]).label,
        rain:    data.hourly.precipitation_probability[i] || 0,
        hour:    new Date(t).getHours(),
      }))
      .filter(f => f.hour >= currentHour)
      .slice(0, 8);
  } catch {
    return getMockForecast();
  }
}

// ── PROCESS OPEN-METEO RESPONSE ────────────────────────────
function processOpenMeteo(data, city) {
  const c    = data.current;
  const wmo  = WMO_CODES[c.weather_code] || WMO_CODES[0];
  const rain = c.precipitation || 0;
  const temp = Math.round(c.temperature_2m);
  const humidity = c.relative_humidity_2m;
  const wind = Math.round(c.wind_speed_10m);

  const sunrise = data.daily?.sunrise?.[0]
    ? new Date(data.daily.sunrise[0]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '06:00 AM';
  const sunset = data.daily?.sunset?.[0]
    ? new Date(data.daily.sunset[0]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '06:30 PM';
  const rainChance = data.daily?.precipitation_probability_max?.[0] || 0;

  return {
    temp,
    feelsLike:   Math.round(c.apparent_temperature),
    humidity,
    windSpeed:   wind,
    condition:   wmo.label,
    description: wmo.label.toLowerCase(),
    icon:        wmo.icon,
    city,
    country:     'IN',
    sunrise,
    sunset,
    rainChance,
    recommendation: getFarmingRecommendation({ temp, humidity, wind, rain, rainChance, wmoCode: c.weather_code }),
    isMock: false,
  };
}

// ── FARMING RECOMMENDATIONS ────────────────────────────────
function getFarmingRecommendation({ temp, humidity, wind, rain, rainChance, wmoCode }) {
  if (wmoCode >= 95) return { icon:'⛈️', title:'Thunderstorm Warning', text:'Stay indoors. Secure equipment and livestock. Do not operate machinery.', severity:'warning' };
  if (wmoCode >= 61 || rain > 5) return { icon:'🌧️', title:'Rain Expected', text:'Harvest mature tomatoes and leafy vegetables today. Delay pesticide application. Good time for transplanting seedlings.', severity:'info' };
  if (temp > 38) return { icon:'🌡️', title:'Extreme Heat Alert', text:'Water crops early morning or evening. Provide shade for sensitive crops. Avoid field work between 11am–4pm.', severity:'warning' };
  if (temp > 32 && humidity < 40) return { icon:'☀️', title:'Hot & Dry', text:'Increase irrigation frequency. Mulch soil to retain moisture. Good for harvesting and drying grains.', severity:'info' };
  if (wind > 40) return { icon:'💨', title:'Strong Winds', text:'Stake tall crops. Delay spraying. Secure greenhouse covers.', severity:'warning' };
  if (temp < 10) return { icon:'🥶', title:'Cold Weather', text:'Protect frost-sensitive crops. Reduce irrigation. Good for storing harvested produce.', severity:'info' };
  if (humidity > 85) return { icon:'💧', title:'High Humidity', text:'Monitor for fungal diseases. Ensure good air circulation. Avoid overhead irrigation.', severity:'info' };
  if (rainChance > 60) return { icon:'🌦️', title:'Rain Likely Today', text:'Complete field operations early. Harvest ripe produce before afternoon. Check drainage channels.', severity:'info' };
  return { icon:'🌱', title:'Good Farming Conditions', text:'Ideal conditions for field operations, planting, and harvesting. Proceed with planned agricultural activities.', severity:'success' };
}

// ── RENDER WEATHER CARD ────────────────────────────────────
export function renderWeatherCard(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="weather-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="weather-temp">${data.temp}°C</div>
          <div class="weather-condition">${data.icon} ${data.condition}</div>
          <div class="weather-location">
            <i class="fa-solid fa-location-dot"></i> ${data.city}, ${data.country}
          </div>
        </div>
        <div style="text-align:right;color:rgba(255,255,255,0.7);font-size:13px">
          <div>🌅 ${data.sunrise}</div>
          <div style="margin-top:4px">🌇 ${data.sunset}</div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail-item"><div class="weather-detail-val">${data.humidity}%</div><div class="weather-detail-label">Humidity</div></div>
        <div class="weather-detail-item"><div class="weather-detail-val">${data.windSpeed} km/h</div><div class="weather-detail-label">Wind</div></div>
        <div class="weather-detail-item"><div class="weather-detail-val">${data.rainChance}%</div><div class="weather-detail-label">Rain</div></div>
      </div>
      <div class="weather-recommendation">
        <span style="font-size:20px">${data.recommendation.icon}</span>
        <div>
          <div style="font-weight:600;margin-bottom:3px">${data.recommendation.title}</div>
          <div style="font-size:12px;opacity:0.85">${data.recommendation.text}</div>
        </div>
      </div>
    </div>
  `;
}

// ── CACHE ──────────────────────────────────────────────────
function cacheWeather(lat, lon, data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, data, ts: Date.now() })); } catch {}
}
function getCachedWeather(lat, lon) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat: cLat, lon: cLon, data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_DURATION) return null;
    if (Math.abs(cLat - lat) > 0.05 || Math.abs(cLon - lon) > 0.05) return null;
    return data;
  } catch { return null; }
}

// ── MOCK DATA ──────────────────────────────────────────────
function getMockWeather() {
  return {
    temp:28, feelsLike:31, humidity:72, windSpeed:14,
    condition:'Partly Cloudy', description:'partly cloudy',
    icon:'⛅', city:'Hyderabad', country:'IN',
    sunrise:'06:12 AM', sunset:'06:48 PM', rainChance:30,
    recommendation:{ icon:'🌱', title:'Good Farming Conditions', text:'Ideal conditions for field operations. Moderate humidity is good for most crops.', severity:'success' },
    isMock:true,
  };
}
function getMockForecast() {
  return [
    { time:'3 PM',  temp:30, icon:'☀️',  condition:'Clear',  rain:5  },
    { time:'6 PM',  temp:27, icon:'⛅',  condition:'Clouds', rain:15 },
    { time:'9 PM',  temp:24, icon:'🌙',  condition:'Clear',  rain:5  },
    { time:'12 AM', temp:22, icon:'🌙',  condition:'Clear',  rain:5  },
    { time:'3 AM',  temp:21, icon:'🌧️', condition:'Rain',   rain:70 },
  ];
}

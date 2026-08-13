/* ============================================================
   AGRISYNC OS — WEATHER MODULE
   Uses: OpenWeather API + Geolocation
   ============================================================ */

import { OPENWEATHER_KEY } from './firebase.js';
import { showToast } from './navigation.js';

const CACHE_KEY      = 'agrisync_weather';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// ── WEATHER ICONS MAP ──────────────────────────────────────
const WEATHER_ICONS = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

// ── FARMING RECOMMENDATIONS ────────────────────────────────
function getFarmingRecommendation(weather) {
  const { main, wind, rain } = weather;
  const temp     = main.temp;
  const humidity = main.humidity;
  const rainMM   = rain?.['1h'] || rain?.['3h'] || 0;
  const windKph  = (wind?.speed || 0) * 3.6;

  if (rainMM > 10 || weather.weather[0].main === 'Thunderstorm') {
    return {
      icon: '⛈️',
      title: 'Heavy rain expected',
      text: 'Avoid field operations. Harvest mature crops immediately to prevent losses. Ensure drainage channels are clear.',
      severity: 'warning',
    };
  }
  if (rainMM > 2 || weather.weather[0].main === 'Rain') {
    return {
      icon: '🌧️',
      title: 'Rain expected',
      text: 'Harvest mature tomatoes and leafy vegetables today. Delay pesticide application. Good time for transplanting seedlings.',
      severity: 'info',
    };
  }
  if (temp > 38) {
    return {
      icon: '🌡️',
      title: 'Extreme heat alert',
      text: 'Water crops early morning or evening. Provide shade for sensitive crops. Avoid field work between 11am–4pm.',
      severity: 'warning',
    };
  }
  if (temp > 32 && humidity < 40) {
    return {
      icon: '☀️',
      title: 'Hot and dry conditions',
      text: 'Increase irrigation frequency. Mulch soil to retain moisture. Good conditions for harvesting and drying grains.',
      severity: 'info',
    };
  }
  if (windKph > 40) {
    return {
      icon: '💨',
      title: 'Strong winds',
      text: 'Stake tall crops and support fruit-bearing plants. Delay spraying operations. Secure greenhouse covers.',
      severity: 'warning',
    };
  }
  if (temp < 10) {
    return {
      icon: '🥶',
      title: 'Cold weather',
      text: 'Protect frost-sensitive crops with covers. Reduce irrigation. Good conditions for storing harvested produce.',
      severity: 'info',
    };
  }
  if (humidity > 85) {
    return {
      icon: '💧',
      title: 'High humidity',
      text: 'Monitor crops for fungal diseases. Ensure good air circulation. Avoid overhead irrigation.',
      severity: 'info',
    };
  }
  return {
    icon: '🌱',
    title: 'Good farming conditions',
    text: 'Ideal conditions for field operations, planting, and harvesting. Proceed with planned agricultural activities.',
    severity: 'success',
  };
}

// ── FETCH WEATHER ──────────────────────────────────────────
export async function fetchWeather(lat, lon) {
  // Check cache
  const cached = getCachedWeather(lat, lon);
  if (cached) return cached;

  if (!OPENWEATHER_KEY || OPENWEATHER_KEY === 'YOUR_OPENWEATHER_API_KEY') {
    return getMockWeather();
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const data = await res.json();
    const result = processWeatherData(data);
    cacheWeather(lat, lon, result);
    return result;
  } catch (err) {
    console.warn('Weather fetch failed:', err.message);
    return getMockWeather();
  }
}

// ── FETCH FORECAST ─────────────────────────────────────────
export async function fetchForecast(lat, lon) {
  if (!OPENWEATHER_KEY || OPENWEATHER_KEY === 'YOUR_OPENWEATHER_API_KEY') {
    return getMockForecast();
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric&cnt=5`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.list.map(item => ({
      time:      new Date(item.dt * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      temp:      Math.round(item.main.temp),
      icon:      WEATHER_ICONS[item.weather[0].icon] || '🌤️',
      condition: item.weather[0].main,
    }));
  } catch {
    return getMockForecast();
  }
}

// ── GET USER LOCATION ──────────────────────────────────────
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(new Error('Location permission denied')),
      { timeout: 8000, maximumAge: 300000 }
    );
  });
}

// ── PROCESS WEATHER DATA ───────────────────────────────────
function processWeatherData(data) {
  const recommendation = getFarmingRecommendation(data);
  return {
    temp:        Math.round(data.main.temp),
    feelsLike:   Math.round(data.main.feels_like),
    humidity:    data.main.humidity,
    windSpeed:   Math.round((data.wind?.speed || 0) * 3.6),
    condition:   data.weather[0].main,
    description: data.weather[0].description,
    icon:        WEATHER_ICONS[data.weather[0].icon] || '🌤️',
    city:        data.name,
    country:     data.sys?.country || 'IN',
    sunrise:     new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    sunset:      new Date(data.sys.sunset  * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    rainChance:  data.rain ? Math.min(100, Math.round((data.rain['1h'] || 0) * 10)) : 0,
    recommendation,
  };
}

// ── RENDER WEATHER CARD ────────────────────────────────────
export function renderWeatherCard(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="weather-card" data-aos="fade-up">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="weather-temp">${data.temp}°C</div>
          <div class="weather-condition">${data.icon} ${data.description}</div>
          <div class="weather-location">
            <i class="fa-solid fa-location-dot"></i>
            ${data.city}, ${data.country}
          </div>
        </div>
        <div style="text-align:right;color:rgba(255,255,255,0.7);font-size:13px">
          <div>🌅 ${data.sunrise}</div>
          <div style="margin-top:4px">🌇 ${data.sunset}</div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail-item">
          <div class="weather-detail-val">${data.humidity}%</div>
          <div class="weather-detail-label">Humidity</div>
        </div>
        <div class="weather-detail-item">
          <div class="weather-detail-val">${data.windSpeed} km/h</div>
          <div class="weather-detail-label">Wind</div>
        </div>
        <div class="weather-detail-item">
          <div class="weather-detail-val">${data.rainChance}%</div>
          <div class="weather-detail-label">Rain</div>
        </div>
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

// ── CACHE HELPERS ──────────────────────────────────────────
function cacheWeather(lat, lon, data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    lat, lon, data, ts: Date.now()
  }));
}

function getCachedWeather(lat, lon) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat: cLat, lon: cLon, data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_DURATION) return null;
    if (Math.abs(cLat - lat) > 0.1 || Math.abs(cLon - lon) > 0.1) return null;
    return data;
  } catch { return null; }
}

// ── MOCK DATA (when API key not configured) ────────────────
function getMockWeather() {
  return {
    temp: 28, feelsLike: 31, humidity: 72, windSpeed: 14,
    condition: 'Partly Cloudy', description: 'partly cloudy',
    icon: '⛅', city: 'Hyderabad', country: 'IN',
    sunrise: '06:12 AM', sunset: '06:48 PM', rainChance: 30,
    recommendation: {
      icon: '🌱',
      title: 'Good farming conditions',
      text: 'Ideal conditions for field operations. Moderate humidity is good for most crops. Proceed with planned activities.',
      severity: 'success',
    },
    isMock: true,
  };
}

function getMockForecast() {
  return [
    { time: '3 PM',  temp: 30, icon: '☀️',  condition: 'Clear' },
    { time: '6 PM',  temp: 27, icon: '⛅',  condition: 'Clouds' },
    { time: '9 PM',  temp: 24, icon: '🌙',  condition: 'Clear' },
    { time: '12 AM', temp: 22, icon: '🌙',  condition: 'Clear' },
    { time: '3 AM',  temp: 21, icon: '🌧️', condition: 'Rain' },
  ];
}

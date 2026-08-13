# 🌾 AgriSync OS
### AI-Powered Farm-to-Factory Procurement Platform
> **"From Farm. To Factory. Smarter."**

[![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)](https://firebase.google.com)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Overview

AgriSync OS is a production-quality agricultural procurement platform connecting:
- 👨🌾 **Farmers** — List crops, find buyers, get AI price forecasts
- 🏭 **Factories** — Discover farmers, AI procurement recommendations
- 🚚 **Logistics** — Manage fleet, drivers, deliveries and routes
- 🏢 **Government/FPO** — Analytics, surplus/shortage detection, reports
- 👨💼 **Admin** — Full platform management

---

## 🏗️ Architecture

```
agrisync-os/
├── index.html              # Landing page
├── login.html              # Authentication
├── register.html           # Registration
├── farmer/                 # Farmer portal
│   ├── dashboard.html
│   ├── crops.html
│   ├── add-crop.html
│   ├── buyers.html
│   ├── orders.html
│   ├── weather.html
│   ├── maps.html
│   ├── voice.html
│   └── profile.html
├── factory/                # Factory portal
│   ├── dashboard.html
│   ├── procurement.html
│   ├── farmers.html
│   ├── requests.html
│   ├── orders.html
│   └── ai-insights.html
├── logistics/              # Logistics portal
│   ├── dashboard.html
│   ├── deliveries.html
│   ├── routes.html
│   ├── trucks.html
│   └── drivers.html
├── government/             # Government portal
│   ├── dashboard.html
│   ├── production.html
│   ├── shortages.html
│   ├── surplus.html
│   ├── analytics.html
│   └── reports.html
├── admin/                  # Admin panel
│   ├── dashboard.html
│   └── users.html
├── css/                    # Stylesheets
│   ├── style.css           # Design system + components
│   ├── dashboard.css       # Dashboard layout
│   ├── components.css      # Landing, auth, weather, voice
│   └── responsive.css      # Mobile-first breakpoints
├── js/                     # JavaScript modules
│   ├── firebase.js         # ⚠️ Firebase config (edit this)
│   ├── auth.js             # Authentication + role routing
│   ├── navigation.js       # UI utilities, toasts, modals
│   ├── language.js         # i18n — 9 Indian languages
│   ├── weather.js          # OpenWeather API integration
│   ├── maps.js             # Google Maps integration
│   ├── voice.js            # Web Speech API
│   ├── notifications.js    # Real-time Firestore notifications
│   ├── farmer.js           # Farmer Firestore operations
│   ├── factory.js          # Factory Firestore operations
│   ├── logistics.js        # Logistics Firestore operations
│   ├── government.js       # Analytics + Chart.js
│   ├── admin.js            # Admin user management
│   ├── ai.js               # Rule-based AI recommendations
│   └── reports.js          # Print/PDF reports
├── firestore.rules         # Firestore security rules
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript ES6+ |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Maps | Google Maps JavaScript API |
| Weather | OpenWeather API |
| Voice | Web Speech API |
| Charts | Chart.js 4.x |
| Icons | Font Awesome 6.x |
| Animations | AOS.js |

---

## 🚀 Setup Guide

### Step 1 — Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: `agrisync-os`
3. Enable **Authentication** → Email/Password
4. Create **Firestore Database** → Start in production mode
5. Enable **Storage**
6. Go to **Project Settings** → **Your Apps** → Add Web App
7. Copy the `firebaseConfig` object

### Step 2 — Configure Firebase

Open `js/firebase.js` and replace the placeholders:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### Step 3 — Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** and **Geocoding API**
3. Create an API key
4. In `js/firebase.js`, set:
```javascript
export const GOOGLE_MAPS_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
```

### Step 4 — OpenWeather API Key

1. Register at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. In `js/firebase.js`, set:
```javascript
export const OPENWEATHER_KEY = "YOUR_OPENWEATHER_API_KEY";
```

### Step 5 — Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### Step 6 — Storage Rules

In Firebase Console → Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /crops/{userId}/{allPaths=**} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 💻 Local Development

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Hosting + Firestore + Storage)
firebase init

# Serve locally
firebase serve

# Or use any static server
npx serve .
```

---

## 🚀 Deploy to Firebase Hosting

```bash
# Build (no build step needed — pure HTML/CSS/JS)
firebase deploy --only hosting

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 🔐 Demo Accounts

Create these in Firebase Auth + Firestore manually, or register via the app:

| Role | Email | Password |
|------|-------|----------|
| Farmer | farmer@demo.com | demo123 |
| Factory | factory@demo.com | demo123 |
| Logistics | logistics@demo.com | demo123 |
| Government | govt@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

> ⚠️ Change demo passwords before any public deployment.

---

## 🌐 Supported Languages

| Code | Language | Native |
|------|----------|--------|
| en | English | English |
| hi | Hindi | हिन्दी |
| te | Telugu | తెలుగు |
| ta | Tamil | தமிழ் |
| kn | Kannada | ಕನ್ನಡ |
| ml | Malayalam | മലയാളം |
| mr | Marathi | मराठी |
| bn | Bengali | বাংলা |
| pa | Punjabi | ਪੰਜਾਬੀ |

---

## 🤖 AI System

AgriSync OS uses a **transparent rule-based recommendation engine** (not a trained ML model).

Scoring weights:
- Reliability: 30%
- Distance: 25%
- Price: 20%
- Quantity match: 15%
- Quality: 10%

All recommendations are labeled **"AI-assisted"** and include explanations.

---

## 📊 Firestore Collections

| Collection | Description |
|-----------|-------------|
| `users` | All user profiles |
| `farmers` | Farmer-specific data |
| `factories` | Factory-specific data |
| `logistics` | Logistics provider data |
| `crops` | Crop listings |
| `procurement_requests` | Factory → Farmer requests |
| `orders` | Confirmed orders |
| `deliveries` | Delivery records |
| `trucks` | Fleet management |
| `drivers` | Driver management |
| `notifications` | Real-time notifications |
| `analytics` | Platform analytics |
| `reports` | Generated reports |

---

## 🔮 Future Enhancements

- [ ] Crop disease detection (image AI)
- [ ] Real-time GPS tracking
- [ ] UPI payment integration
- [ ] SMS notifications (Twilio/MSG91)
- [ ] Offline PWA support
- [ ] Excel export for reports
- [ ] Multi-language voice (expanded)
- [ ] Demand forecasting ML model
- [ ] Blockchain supply chain audit

---

## 📄 License

MIT License — Built for India's farmers 🇮🇳

---

*AgriSync OS — From Farm. To Factory. Smarter.*

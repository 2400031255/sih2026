/* ============================================================
   AGRISYNC OS — FIREBASE CONFIGURATION
   ============================================================ */

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBZcXSiSntewbf7Y0AHotBfk9Rsr-IhhJM",
  authDomain:        "sih2026-1a32c.firebaseapp.com",
  projectId:         "sih2026-1a32c",
  storageBucket:     "sih2026-1a32c.firebasestorage.app",
  messagingSenderId: "118242990403",
  appId:             "1:118242990403:web:6ce7f3e8e67c765a64f7f6",
  measurementId:     "G-YG2Q899946"
};

// ── EXTERNAL API KEYS ──────────────────────────────────────
export const OPENWEATHER_KEY = "YOUR_OPENWEATHER_API_KEY"; // optional, falls back to Open-Meteo
export const GOOGLE_MAPS_KEY = ""; // not needed — using Leaflet/OpenStreetMap (free)

// ── INITIALIZE ─────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;

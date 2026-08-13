/* ============================================================
   AGRISYNC OS — VOICE MODULE
   Uses: Web Speech API (SpeechRecognition + SpeechSynthesis)
   ============================================================ */

import { getLang } from './language.js';
import { showToast } from './navigation.js';

// ── LANGUAGE CODE MAP ──────────────────────────────────────
const SPEECH_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN',
  ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN',
  mr: 'mr-IN', bn: 'bn-IN', pa: 'pa-IN',
};

// ── SPEECH RECOGNITION ─────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isVoiceSupported() {
  return !!SpeechRecognition;
}

export function startListening({ onResult, onError, onEnd, continuous = false }) {
  if (!SpeechRecognition) {
    showToast('Voice recognition is not supported on this browser.', 'error');
    onError?.('unsupported');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang        = SPEECH_LANG_MAP[getLang()] || 'en-IN';
  recognition.continuous  = continuous;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    onResult?.({ final, interim, raw: e });
  };

  recognition.onerror = (e) => {
    const msgs = {
      'not-allowed':  'Microphone permission denied.',
      'no-speech':    'No speech detected. Please try again.',
      'network':      'Network error during voice recognition.',
      'aborted':      'Voice recognition stopped.',
    };
    onError?.(msgs[e.error] || 'Voice recognition error.');
  };

  recognition.onend = () => onEnd?.();

  recognition.start();
  return recognition;
}

// ── CROP VOICE PARSER ──────────────────────────────────────
// Parses natural language into crop form fields
export function parseCropFromSpeech(text) {
  const lower = text.toLowerCase();
  const result = {};

  // Quantity: "500 kg", "five hundred kilograms"
  const qtyMatch = lower.match(/(\d+(?:\.\d+)?)\s*(kg|kilogram|kilo|quintal|ton|tonne|litre|liter)/i);
  if (qtyMatch) {
    result.quantity = parseFloat(qtyMatch[1]);
    result.unit = normalizeUnit(qtyMatch[2]);
  }

  // Crop names (common Indian crops)
  const crops = [
    'tomato','potato','onion','rice','wheat','maize','corn','cotton',
    'sugarcane','soybean','groundnut','mustard','sunflower','chilli',
    'brinjal','cabbage','cauliflower','spinach','carrot','radish',
    'mango','banana','grapes','pomegranate','orange','lemon',
    'turmeric','ginger','garlic','coriander','cumin',
  ];
  for (const crop of crops) {
    if (lower.includes(crop)) {
      result.cropName = crop.charAt(0).toUpperCase() + crop.slice(1);
      break;
    }
  }

  // Price: "28 rupees", "₹30 per kg"
  const priceMatch = lower.match(/(?:₹|rs\.?|rupees?)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?)/i);
  if (priceMatch) {
    result.expectedPrice = parseFloat(priceMatch[1] || priceMatch[2]);
  }

  return result;
}

function normalizeUnit(raw) {
  const map = {
    kg: 'kg', kilogram: 'kg', kilo: 'kg',
    quintal: 'quintal', ton: 'ton', tonne: 'ton',
    litre: 'litre', liter: 'litre',
  };
  return map[raw.toLowerCase()] || raw;
}

// ── TEXT TO SPEECH ─────────────────────────────────────────
export function speak(text, options = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = SPEECH_LANG_MAP[getLang()] || 'en-IN';
  utterance.rate  = options.rate  || 0.9;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // Try to use a local voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = utterance.lang.split('-')[0];
  const preferred = voices.find(v => v.lang.startsWith(langCode))
                 || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  utterance.onerror = () => {}; // Silently fail
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// ── VOICE BUTTON COMPONENT ─────────────────────────────────
export function initVoiceButton(btnId, onResult) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (!isVoiceSupported()) {
    btn.disabled = true;
    btn.title = 'Voice not supported on this browser';
    btn.style.opacity = '0.5';
    return;
  }

  let recognition = null;
  let listening = false;

  btn.addEventListener('click', () => {
    if (listening) {
      recognition?.stop();
      return;
    }

    listening = true;
    btn.classList.add('listening');
    const label = btn.querySelector('.voice-btn-label');
    if (label) label.textContent = 'Listening...';

    recognition = startListening({
      onResult: ({ final, interim }) => {
        if (final) {
          onResult(final);
          showToast(`Heard: "${final}"`, 'info');
        }
      },
      onError: (msg) => {
        showToast(msg, 'error');
        resetBtn();
      },
      onEnd: resetBtn,
    });
  });

  function resetBtn() {
    listening = false;
    btn.classList.remove('listening');
    const label = btn.querySelector('.voice-btn-label');
    if (label) label.textContent = 'Tap & Speak';
  }
}

// ── LISTEN BUTTON (TTS) ────────────────────────────────────
export function initListenButtons() {
  document.querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-speak')
                || btn.closest('[data-speak-text]')?.getAttribute('data-speak-text')
                || '';
      if (text) speak(text);
    });
  });
}

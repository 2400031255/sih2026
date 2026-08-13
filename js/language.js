/* ============================================================
   AGRISYNC OS — LANGUAGE / i18n SYSTEM
   Supports: English, Hindi, Telugu, Tamil, Kannada,
             Malayalam, Marathi, Bengali, Punjabi
   ============================================================ */

export const LANGUAGES = [
  { code: 'en', name: 'English',    native: 'English',    flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',     native: 'తెలుగు',      flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',      native: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ',       flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam',  native: 'മലയാളം',      flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',    native: 'मराठी',       flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',    native: 'বাংলা',       flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',      flag: '🇮🇳' },
];

const translations = {
  en: {
    // Navigation
    'nav.dashboard':     'Dashboard',
    'nav.crops':         'My Crops',
    'nav.buyers':        'Buyers',
    'nav.orders':        'Orders',
    'nav.weather':       'Weather',
    'nav.maps':          'Maps',
    'nav.ai':            'AI Insights',
    'nav.notifications': 'Notifications',
    'nav.profile':       'Profile',
    'nav.procurement':   'Procurement',
    'nav.farmers':       'Farmers',
    'nav.requests':      'Requests',
    'nav.deliveries':    'Deliveries',
    'nav.routes':        'Routes',
    'nav.trucks':        'Trucks',
    'nav.drivers':       'Drivers',
    'nav.production':    'Production',
    'nav.shortages':     'Shortages',
    'nav.surplus':       'Surplus',
    'nav.analytics':     'Analytics',
    'nav.reports':       'Reports',
    'nav.logout':        'Logout',
    // Dashboard
    'dash.welcome':      'Welcome back',
    'dash.today':        "Today's Overview",
    'dash.loading':      'Loading dashboard...',
    // Crops
    'crop.add':          'Add Crop',
    'crop.name':         'Crop Name',
    'crop.quantity':     'Quantity',
    'crop.unit':         'Unit',
    'crop.harvest':      'Harvest Date',
    'crop.price':        'Expected Price (₹/kg)',
    'crop.quality':      'Quality Grade',
    'crop.images':       'Crop Images',
    'crop.location':     'Location',
    'crop.empty':        'No crops added yet',
    'crop.empty.desc':   'Add your first crop to start finding buyers.',
    // Orders
    'order.pending':     'Pending',
    'order.accepted':    'Accepted',
    'order.transit':     'In Transit',
    'order.completed':   'Completed',
    'order.cancelled':   'Cancelled',
    // Weather
    'weather.loading':   'Loading weather...',
    'weather.error':     "Couldn't load weather. Please try again.",
    'weather.humidity':  'Humidity',
    'weather.wind':      'Wind',
    'weather.rain':      'Rain',
    'weather.feels':     'Feels Like',
    // Voice
    'voice.tap':         'Tap & Speak',
    'voice.listening':   'Listening...',
    'voice.unsupported': 'Voice not supported on this browser.',
    'voice.speak':       '🔊 Listen',
    // Auth
    'auth.login':        'Sign In',
    'auth.register':     'Create Account',
    'auth.email':        'Email Address',
    'auth.password':     'Password',
    'auth.name':         'Full Name',
    'auth.mobile':       'Mobile Number',
    'auth.role':         'I am a',
    'auth.state':        'State',
    'auth.district':     'District',
    'auth.village':      'Village / Address',
    'auth.language':     'Preferred Language',
    'auth.forgot':       'Forgot Password?',
    'auth.no_account':   "Don't have an account?",
    'auth.have_account': 'Already have an account?',
    // Common
    'common.save':       'Save',
    'common.cancel':     'Cancel',
    'common.delete':     'Delete',
    'common.edit':       'Edit',
    'common.view':       'View',
    'common.search':     'Search...',
    'common.filter':     'Filter',
    'common.loading':    'Loading...',
    'common.error':      'Something went wrong.',
    'common.retry':      'Try Again',
    'common.submit':     'Submit',
    'common.confirm':    'Confirm',
    'common.back':       'Back',
    'common.next':       'Next',
    'common.close':      'Close',
    'common.yes':        'Yes',
    'common.no':         'No',
    'common.kg':         'kg',
    'common.km':         'km',
    'common.rs':         '₹',
  },

  hi: {
    'nav.dashboard':     'डैशबोर्ड',
    'nav.crops':         'मेरी फसलें',
    'nav.buyers':        'खरीदार',
    'nav.orders':        'ऑर्डर',
    'nav.weather':       'मौसम',
    'nav.maps':          'नक्शा',
    'nav.ai':            'AI सुझाव',
    'nav.notifications': 'सूचनाएं',
    'nav.profile':       'प्रोफ़ाइल',
    'nav.logout':        'लॉग आउट',
    'dash.welcome':      'वापस स्वागत है',
    'dash.today':        'आज का अवलोकन',
    'crop.add':          'फसल जोड़ें',
    'crop.name':         'फसल का नाम',
    'crop.quantity':     'मात्रा',
    'crop.unit':         'इकाई',
    'crop.harvest':      'कटाई की तारीख',
    'crop.price':        'अपेक्षित मूल्य (₹/किग्रा)',
    'crop.quality':      'गुणवत्ता श्रेणी',
    'crop.images':       'फसल की तस्वीरें',
    'crop.location':     'स्थान',
    'crop.empty':        'अभी तक कोई फसल नहीं जोड़ी',
    'crop.empty.desc':   'खरीदार खोजने के लिए अपनी पहली फसल जोड़ें।',
    'order.pending':     'लंबित',
    'order.accepted':    'स्वीकृत',
    'order.transit':     'पारगमन में',
    'order.completed':   'पूर्ण',
    'order.cancelled':   'रद्द',
    'weather.loading':   'मौसम लोड हो रहा है...',
    'weather.humidity':  'आर्द्रता',
    'weather.wind':      'हवा',
    'weather.rain':      'बारिश',
    'voice.tap':         'बोलने के लिए दबाएं',
    'voice.listening':   'सुन रहा है...',
    'auth.login':        'साइन इन करें',
    'auth.register':     'खाता बनाएं',
    'auth.email':        'ईमेल पता',
    'auth.password':     'पासवर्ड',
    'auth.name':         'पूरा नाम',
    'auth.mobile':       'मोबाइल नंबर',
    'auth.role':         'मैं हूं',
    'common.save':       'सहेजें',
    'common.cancel':     'रद्द करें',
    'common.loading':    'लोड हो रहा है...',
    'common.error':      'कुछ गलत हो गया।',
    'common.retry':      'पुनः प्रयास करें',
    'common.search':     'खोजें...',
    'common.kg':         'किग्रा',
    'common.km':         'किमी',
    'common.rs':         '₹',
  },

  te: {
    'nav.dashboard':     'డాష్‌బోర్డ్',
    'nav.crops':         'నా పంటలు',
    'nav.buyers':        'కొనుగోలుదారులు',
    'nav.orders':        'ఆర్డర్లు',
    'nav.weather':       'వాతావరణం',
    'nav.maps':          'మ్యాప్స్',
    'nav.ai':            'AI సూచనలు',
    'nav.notifications': 'నోటిఫికేషన్లు',
    'nav.profile':       'ప్రొఫైల్',
    'nav.logout':        'లాగ్ అవుట్',
    'dash.welcome':      'తిరిగి స్వాగతం',
    'crop.add':          'పంట జోడించు',
    'crop.name':         'పంట పేరు',
    'crop.quantity':     'పరిమాణం',
    'crop.empty':        'ఇంకా పంటలు జోడించలేదు',
    'order.pending':     'పెండింగ్',
    'order.accepted':    'అంగీకరించబడింది',
    'order.completed':   'పూర్తయింది',
    'weather.humidity':  'తేమ',
    'voice.tap':         'నొక్కి మాట్లాడండి',
    'auth.login':        'సైన్ ఇన్',
    'auth.register':     'ఖాతా సృష్టించు',
    'common.save':       'సేవ్ చేయి',
    'common.loading':    'లోడ్ అవుతోంది...',
    'common.kg':         'కిలో',
    'common.rs':         '₹',
  },

  ta: {
    'nav.dashboard':     'டாஷ்போர்டு',
    'nav.crops':         'என் பயிர்கள்',
    'nav.buyers':        'வாங்குபவர்கள்',
    'nav.orders':        'ஆர்டர்கள்',
    'nav.weather':       'வானிலை',
    'nav.logout':        'வெளியேறு',
    'crop.add':          'பயிர் சேர்',
    'crop.name':         'பயிர் பெயர்',
    'crop.empty':        'இன்னும் பயிர்கள் சேர்க்கப்படவில்லை',
    'order.pending':     'நிலுவையில்',
    'order.completed':   'முடிந்தது',
    'auth.login':        'உள்நுழை',
    'common.save':       'சேமி',
    'common.loading':    'ஏற்றுகிறது...',
    'common.rs':         '₹',
  },

  kn: {
    'nav.dashboard':     'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.crops':         'ನನ್ನ ಬೆಳೆಗಳು',
    'nav.buyers':        'ಖರೀದಿದಾರರು',
    'nav.orders':        'ಆರ್ಡರ್‌ಗಳು',
    'nav.weather':       'ಹವಾಮಾನ',
    'nav.logout':        'ಲಾಗ್ ಔಟ್',
    'crop.add':          'ಬೆಳೆ ಸೇರಿಸಿ',
    'crop.empty':        'ಇನ್ನೂ ಯಾವುದೇ ಬೆಳೆ ಸೇರಿಸಿಲ್ಲ',
    'auth.login':        'ಸೈನ್ ಇನ್',
    'common.save':       'ಉಳಿಸಿ',
    'common.loading':    'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.rs':         '₹',
  },

  ml: {
    'nav.dashboard':     'ഡാഷ്‌ബോർഡ്',
    'nav.crops':         'എന്റെ വിളകൾ',
    'nav.buyers':        'വാങ്ങുന്നവർ',
    'nav.orders':        'ഓർഡറുകൾ',
    'nav.weather':       'കാലാവസ്ഥ',
    'nav.logout':        'ലോഗ് ഔട്ട്',
    'crop.add':          'വിള ചേർക്കുക',
    'crop.empty':        'ഇതുവരെ വിളകൾ ചേർത്തിട്ടില്ല',
    'auth.login':        'സൈൻ ഇൻ',
    'common.save':       'സേവ് ചെയ്യുക',
    'common.loading':    'ലോഡ് ചെയ്യുന്നു...',
    'common.rs':         '₹',
  },

  mr: {
    'nav.dashboard':     'डॅशबोर्ड',
    'nav.crops':         'माझी पिके',
    'nav.buyers':        'खरेदीदार',
    'nav.orders':        'ऑर्डर',
    'nav.weather':       'हवामान',
    'nav.logout':        'लॉग आउट',
    'crop.add':          'पीक जोडा',
    'crop.empty':        'अद्याप कोणतेही पीक जोडले नाही',
    'auth.login':        'साइन इन करा',
    'common.save':       'जतन करा',
    'common.loading':    'लोड होत आहे...',
    'common.rs':         '₹',
  },

  bn: {
    'nav.dashboard':     'ড্যাশবোর্ড',
    'nav.crops':         'আমার ফসল',
    'nav.buyers':        'ক্রেতারা',
    'nav.orders':        'অর্ডার',
    'nav.weather':       'আবহাওয়া',
    'nav.logout':        'লগ আউট',
    'crop.add':          'ফসল যোগ করুন',
    'crop.empty':        'এখনো কোনো ফসল যোগ করা হয়নি',
    'auth.login':        'সাইন ইন',
    'common.save':       'সংরক্ষণ করুন',
    'common.loading':    'লোড হচ্ছে...',
    'common.rs':         '₹',
  },

  pa: {
    'nav.dashboard':     'ਡੈਸ਼ਬੋਰਡ',
    'nav.crops':         'ਮੇਰੀਆਂ ਫਸਲਾਂ',
    'nav.buyers':        'ਖਰੀਦਦਾਰ',
    'nav.orders':        'ਆਰਡਰ',
    'nav.weather':       'ਮੌਸਮ',
    'nav.logout':        'ਲੌਗ ਆਊਟ',
    'crop.add':          'ਫਸਲ ਜੋੜੋ',
    'crop.empty':        'ਅਜੇ ਕੋਈ ਫਸਲ ਨਹੀਂ ਜੋੜੀ',
    'auth.login':        'ਸਾਈਨ ਇਨ',
    'common.save':       'ਸੇਵ ਕਰੋ',
    'common.loading':    'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    'common.rs':         '₹',
  },
};

// ── LANGUAGE ENGINE ────────────────────────────────────────
let currentLang = localStorage.getItem('agrisync_lang') || 'en';

export function setLanguage(code) {
  if (!translations[code]) return;
  currentLang = code;
  localStorage.setItem('agrisync_lang', code);
  applyTranslations();
  document.documentElement.lang = code;
}

export function getLang() { return currentLang; }

export function t(key) {
  return translations[currentLang]?.[key]
      || translations['en']?.[key]
      || key;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

// Auto-apply on DOM ready
document.addEventListener('DOMContentLoaded', applyTranslations);

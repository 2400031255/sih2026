/* ============================================================
   AGRISYNC OS — AUTHENTICATION MODULE v2
   Farmer  : Mobile OTP (Firebase Phone Auth)
   Factory / Logistics : Email + Password
   Government/FPO Admin : Email + Password + role/approved check
   ============================================================ */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, serverTimestamp, updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from './firebase.js';
import { setLanguage } from './language.js';
import { showToast } from './navigation.js';

// ── ROOT URL HELPER ────────────────────────────────────────
function rootUrl(path) {
  const parts  = window.location.pathname.split('/');
  const isGH   = parts.length > 2 && parts[1] !== '';
  const prefix = isGH ? '/' + parts[1] + '/' : '/';
  return window.location.origin + prefix + path;
}

// ── ROLE → DASHBOARD MAP ───────────────────────────────────
const ROLE_ROUTES = {
  farmer:           'farmer/dashboard.html',
  factory:          'factory/dashboard.html',
  logistics:        'logistics/dashboard.html',
  government_admin: 'government/dashboard.html',
  // legacy aliases
  government:       'government/dashboard.html',
  admin:            'government/dashboard.html',
};

// ── RECAPTCHA SETUP ────────────────────────────────────────
let recaptchaVerifier = null;

export function setupRecaptcha(containerId) {
  // Clear any existing verifier
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_) {}
    recaptchaVerifier = null;
  }
  // Ensure container div exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      showToast('reCAPTCHA expired. Please try again.', 'error');
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (_) {}
        recaptchaVerifier = null;
      }
    },
  });
  return recaptchaVerifier;
}

// ── PHONE AUTH: SEND OTP ───────────────────────────────────
export async function sendOTP(phoneNumber) {
  if (!phoneNumber || !/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
    return { success: false, error: 'Please enter a valid Indian mobile number.' };
  }
  try {
    // Always recreate verifier to avoid stale/already-rendered state
    setupRecaptcha('recaptcha-container');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    window.__agrisync_confirmation = confirmationResult;
    return { success: true };
  } catch (err) {
    console.error('OTP send error:', err.code, err.message, err);
    if (recaptchaVerifier) {
      try { recaptchaVerifier.clear(); } catch (_) {}
      recaptchaVerifier = null;
    }
    const code = err.code || err.message || 'unknown';
    return { success: false, error: parsePhoneError(err.code) + ' [' + code + ']' };
  }
}

// ── PHONE AUTH: VERIFY OTP ─────────────────────────────────
export async function verifyOTP(otp) {
  try {
    const confirmation = window.__agrisync_confirmation;
    if (!confirmation) return { success: false, error: 'Session expired. Please request a new OTP.' };
    const cred = await confirmation.confirm(otp);
    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, error: parsePhoneError(err.code) };
  }
}

// ── FARMER: CREATE PROFILE AFTER OTP ──────────────────────
export async function createFarmerProfile(uid, data) {
  const profile = {
    uid,
    role:              'farmer',
    name:              data.name || '',
    mobile:            data.mobile || '',
    preferredLanguage: data.language || 'en',
    language:          data.language || 'en',
    state:             data.state || '',
    district:          data.district || '',
    village:           data.village || '',
    crops:             data.crops || [],
    active:            true,
    totalCrops:        0,
    totalOrders:       0,
    reliabilityScore:  100,
    createdAt:         serverTimestamp(),
    updatedAt:         serverTimestamp(),
  };
  await setDoc(doc(db, 'users', uid), profile);
  await setDoc(doc(db, 'farmers', uid), profile);
  return profile;
}

// ── EMAIL/PASSWORD REGISTER (Factory / Logistics) ─────────
export async function registerUser(formData) {
  const { name, email, password, role, mobile, state, district, village, language,
          companyName, contactPerson, address, requiredCrops, truckDetails } = formData;

  // Block government_admin public signup
  if (role === 'government_admin' || role === 'admin' || role === 'government') {
    return { success: false, error: 'Government/FPO accounts cannot be created publicly. Contact your administrator.' };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name || companyName });

    const base = {
      uid:       cred.user.uid,
      name:      name || companyName || '',
      email,
      mobile:    mobile || '',
      role,
      state:     state || '',
      district:  district || '',
      village:   village || '',
      language:  language || 'en',
      active:    true,
      approved:  false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), base);

    if (role === 'factory') {
      await setDoc(doc(db, 'factories', cred.user.uid), {
        ...base,
        factoryName:    companyName || name || '',
        contactPerson:  contactPerson || '',
        address:        address || '',
        requiredCrops:  requiredCrops || [],
        totalOrders:    0,
      });
    } else if (role === 'logistics') {
      await setDoc(doc(db, 'logistics', cred.user.uid), {
        ...base,
        companyName:     companyName || name || '',
        contactPerson:   contactPerson || '',
        address:         address || '',
        truckDetails:    truckDetails || '',
        totalDeliveries: 0,
        trucks:          0,
        drivers:         0,
      });
    }

    setLanguage(language || 'en');
    return { success: true, user: cred.user, role };
  } catch (err) {
    return { success: false, error: parseAuthError(err.code) };
  }
}

// ── EMAIL/PASSWORD LOGIN ───────────────────────────────────
export async function loginUser(email, password) {
  try {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(cred.user.uid);

    if (!profile) {
      await signOut(auth);
      return { success: false, error: 'Account data not found. Please register again.' };
    }
    if (profile.active === false) {
      await signOut(auth);
      return { success: false, error: 'Your account has been deactivated. Contact support.' };
    }

    // Government admin: must have approved = true
    if (profile.role === 'government_admin' && !profile.approved) {
      await signOut(auth);
      return { success: false, error: 'Your Government/FPO account is pending approval.' };
    }

    setLanguage(profile.language || profile.preferredLanguage || 'en');
    return { success: true, user: cred.user, profile };
  } catch (err) {
    return { success: false, error: parseAuthError(err.code) };
  }
}

// ── LOGOUT ─────────────────────────────────────────────────
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('agrisync_user');
    window.__agrisync_confirmation = null;
    window.location.href = rootUrl('login.html');
  } catch {
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ── GET USER PROFILE ───────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('getUserProfile error:', err.code, err.message);
    return null;
  }
}

// ── FORGOT PASSWORD ────────────────────────────────────────
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { success: false, error: parseAuthError(err.code) };
  }
}

// ── AUTH GUARD ─────────────────────────────────────────────
export function requireAuth(allowedRole) {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        window.location.href = rootUrl('login.html');
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        window.location.href = rootUrl('login.html');
        return;
      }

      const role = profile.role;

      // Government admin approval check
      if (role === 'government_admin' && !profile.approved) {
        await signOut(auth);
        window.location.href = rootUrl('login.html');
        return;
      }

      // Role mismatch — redirect to correct dashboard
      if (allowedRole) {
        const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
        // government_admin can access government pages
        const effectiveAllowed = allowed.flatMap(r =>
          r === 'government' ? ['government', 'government_admin', 'admin'] : [r]
        );
        if (!effectiveAllowed.includes(role)) {
          window.location.href = rootUrl(ROLE_ROUTES[role] || 'login.html');
          return;
        }
      }

      window.__agrisync_user = { ...user, profile };
      setLanguage(profile.language || profile.preferredLanguage || 'en');
      resolve({ user, profile });
    });
  });
}

// ── REDIRECT BY ROLE ───────────────────────────────────────
export function redirectByRole(role) {
  window.location.href = rootUrl(ROLE_ROUTES[role] || 'login.html');
}

export function currentUser() {
  return window.__agrisync_user || null;
}

// ── PHONE ERROR MESSAGES ───────────────────────────────────
function parsePhoneError(code) {
  const map = {
    'auth/invalid-phone-number':      'Please enter a valid Indian mobile number.',
    'auth/invalid-verification-code': 'Incorrect verification code. Please try again.',
    'auth/code-expired':              'This verification code has expired. Please request a new one.',
    'auth/too-many-requests':         'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':    'Unable to connect. Please check your internet connection.',
    'auth/missing-phone-number':      'Please enter your mobile number.',
    'auth/quota-exceeded':            'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed':      'Security check failed. Please refresh and try again.',
    'auth/session-expired':           'Session expired. Please request a new OTP.',
  };
  return map[code] || 'Verification failed. Please try again. Check console for details.';
}

// ── EMAIL ERROR MESSAGES ───────────────────────────────────
function parseAuthError(code) {
  const map = {
    'auth/email-already-in-use':   'This email is already registered.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/user-disabled':          'This account has been disabled.',
    'auth/invalid-credential':     'Invalid email or password.',
  };
  return map[code] || 'Authentication failed. Please try again.';
}

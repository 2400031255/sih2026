/* ============================================================
   AGRISYNC OS — AUTHENTICATION MODULE
   Handles: Login, Register, Logout, Auth Guards, Role Routing
   ============================================================ */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from './firebase.js';
import { setLanguage } from './language.js';
import { showToast } from './navigation.js';

// ── ROLE → DASHBOARD MAP ───────────────────────────────────
const ROLE_ROUTES = {
  farmer:     'farmer/dashboard.html',
  factory:    'factory/dashboard.html',
  logistics:  'logistics/dashboard.html',
  government: 'government/dashboard.html',
  admin:      'admin/dashboard.html',
};

// ── REGISTER ───────────────────────────────────────────────
export async function registerUser(formData) {
  const {
    name, email, password, role, mobile,
    state, district, village, language
  } = formData;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const userDoc = {
      uid:       cred.user.uid,
      name,
      email,
      mobile:    mobile || '',
      role,
      state:     state || '',
      district:  district || '',
      village:   village || '',
      language:  language || 'en',
      active:    true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), userDoc);

    if (role === 'farmer') {
      await setDoc(doc(db, 'farmers', cred.user.uid), {
        ...userDoc,
        totalCrops:       0,
        totalOrders:      0,
        reliabilityScore: 100,
      });
    } else if (role === 'factory') {
      await setDoc(doc(db, 'factories', cred.user.uid), {
        ...userDoc,
        companyName: name,
        totalOrders: 0,
      });
    } else if (role === 'logistics') {
      await setDoc(doc(db, 'logistics', cred.user.uid), {
        ...userDoc,
        totalDeliveries: 0,
        trucks:  0,
        drivers: 0,
      });
    }

    setLanguage(language || 'en');
    return { success: true, user: cred.user, role };
  } catch (err) {
    return { success: false, error: parseAuthError(err.code) };
  }
}

// ── LOGIN ──────────────────────────────────────────────────
export async function loginUser(email, password) {
  try {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(cred.user.uid);

    if (!profile) {
      await signOut(auth);
      return { success: false, error: 'Account data not found. Please register again.' };
    }
    if (!profile.active) {
      await signOut(auth);
      return { success: false, error: 'Your account has been deactivated. Contact support.' };
    }

    setLanguage(profile.language || 'en');
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
    window.location.href = 'login.html';
  } catch (err) {
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ── GET USER PROFILE ───────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
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
        window.location.href = 'login.html';
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        window.location.href = 'login.html';
        return;
      }
      if (allowedRole && profile.role !== allowedRole && profile.role !== 'admin') {
        window.location.href = ROLE_ROUTES[profile.role] || 'login.html';
        return;
      }
      window.__agrisync_user = { ...user, profile };
      setLanguage(profile.language || 'en');
      resolve({ user, profile });
    });
  });
}

// ── REDIRECT AFTER LOGIN ───────────────────────────────────
export function redirectByRole(role) {
  const route = ROLE_ROUTES[role];
  window.location.href = route || 'login.html';
}

// ── CURRENT USER (sync) ────────────────────────────────────
export function currentUser() {
  return window.__agrisync_user || null;
}

// ── ERROR MESSAGES ─────────────────────────────────────────
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

/* ============================================================
   AGRISYNC OS — ADMIN MODULE
   ============================================================ */

import {
  collection, doc, updateDoc, getDocs,
  query, orderBy, limit, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase.js';
import { showToast, formatDate } from './navigation.js';

// ── GET ALL USERS ──────────────────────────────────────────
export async function getAllUsers(role = null) {
  try {
    let q = role
      ? query(collection(db, 'users'), where('role', '==', role), orderBy('createdAt', 'desc'))
      : query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

// ── TOGGLE USER ACTIVE STATUS ──────────────────────────────
export async function toggleUserStatus(userId, currentStatus) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      active:    !currentStatus,
      updatedAt: serverTimestamp(),
    });
    showToast(`User ${!currentStatus ? 'activated' : 'deactivated'}.`, 'success');
    return { success: true };
  } catch {
    showToast('Action failed.', 'error');
    return { success: false };
  }
}

// ── RENDER USER ROW ────────────────────────────────────────
export function renderUserRow(user) {
  const roleColors = {
    farmer:     'badge-green',
    factory:    'badge-blue',
    logistics:  'badge-terra',
    government: 'badge-brown',
    admin:      'badge-gold',
  };
  return `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div class="avatar-placeholder avatar-sm" style="font-size:12px">
            ${(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600">${user.name || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${user.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${roleColors[user.role] || 'badge-blue'}">${user.role}</span></td>
      <td>${user.state || '—'}</td>
      <td>${user.district || '—'}</td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <span class="badge ${user.active ? 'badge-green' : 'badge-red'}">
          ${user.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm ${user.active ? 'btn-danger' : 'btn-primary'}"
                onclick="toggleUser('${user.id}', ${user.active})">
          ${user.active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  `;
}

/* ============================================================
   AGRISYNC OS — NOTIFICATIONS MODULE
   Real-time Firestore notifications with badge + panel
   ============================================================ */

import {
  collection, query, where, orderBy, limit,
  onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase.js';
import { speak } from './voice.js';
import { timeAgo } from './navigation.js';

// ── NOTIFICATION TYPE CONFIG ───────────────────────────────
const NOTIF_CONFIG = {
  RAIN_ALERT:        { icon: '🌧️', color: 'blue',  label: 'Weather Alert' },
  BUYER_REQUEST:     { icon: '🏭', color: 'gold',  label: 'Buyer Request' },
  ORDER_ACCEPTED:    { icon: '✅', color: 'green', label: 'Order Accepted' },
  ORDER_REJECTED:    { icon: '❌', color: 'red',   label: 'Order Rejected' },
  DELIVERY_STARTED:  { icon: '🚚', color: 'blue',  label: 'Delivery Started' },
  TRUCK_ASSIGNED:    { icon: '🚛', color: 'gold',  label: 'Truck Assigned' },
  PAYMENT_COMPLETED: { icon: '💰', color: 'green', label: 'Payment Done' },
  PRICE_ALERT:       { icon: '📈', color: 'terra', label: 'Price Alert' },
  SYSTEM:            { icon: '🔔', color: 'brown', label: 'System' },
};

const COLOR_MAP = {
  green: 'rgba(79,125,58,0.12)',
  gold:  'rgba(213,169,40,0.12)',
  blue:  'rgba(76,140,138,0.12)',
  red:   'rgba(192,57,43,0.12)',
  terra: 'rgba(201,107,75,0.12)',
  brown: 'rgba(121,85,72,0.12)',
};

// ── SEND NOTIFICATION ──────────────────────────────────────
export async function sendNotification({ userId, type, title, message, data = {} }) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type:      type || 'SYSTEM',
      title,
      message,
      data,
      read:      false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

// ── REAL-TIME LISTENER ─────────────────────────────────────
export function listenNotifications(userId, onUpdate) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const unread = notifs.filter(n => !n.read).length;
    onUpdate(notifs, unread);
    updateBadge(unread);
  });
}

// ── MARK AS READ ───────────────────────────────────────────
export async function markRead(notifId) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch {}
}

export async function markAllRead(userId) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
  } catch {}
}

// ── RENDER NOTIFICATION PANEL ──────────────────────────────
export function renderNotifPanel(notifs, userId) {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-icon">🔔</div>
        <div class="empty-title">No notifications</div>
        <p class="empty-desc">You're all caught up!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = notifs.map(n => {
    const cfg   = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.SYSTEM;
    const bgCol = COLOR_MAP[cfg.color] || COLOR_MAP.brown;
    const time  = n.createdAt ? timeAgo(n.createdAt) : '';
    return `
      <div class="notif-item ${n.read ? '' : 'unread'}"
           onclick="window.__markNotifRead('${n.id}', this)">
        <div class="notif-item-icon" style="background:${bgCol}">
          ${cfg.icon}
        </div>
        <div style="flex:1;min-width:0">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${time}</div>
        </div>
        ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--terracotta);flex-shrink:0;margin-top:4px"></div>' : ''}
      </div>
    `;
  }).join('');

  // Expose mark-read to inline onclick
  window.__markNotifRead = async (id, el) => {
    await markRead(id);
    el.classList.remove('unread');
    el.querySelector('[style*="terracotta"]')?.remove();
  };
}

// ── UPDATE BADGE ───────────────────────────────────────────
function updateBadge(count) {
  const dot  = document.querySelector('.notif-dot');
  const badge = document.querySelector('.nav-badge[data-notif]');

  if (dot)   dot.style.display   = count > 0 ? 'block' : 'none';
  if (badge) badge.textContent   = count > 0 ? (count > 99 ? '99+' : count) : '';
  if (badge) badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

// ── INIT NOTIFICATIONS ─────────────────────────────────────
export function initNotifications(userId) {
  return listenNotifications(userId, (notifs, unread) => {
    renderNotifPanel(notifs, userId);

    // Speak new unread notifications (latest only)
    const latest = notifs.find(n => !n.read);
    if (latest && latest.createdAt) {
      const age = Date.now() - (latest.createdAt.toDate?.() || new Date()).getTime();
      if (age < 10000) { // Within last 10 seconds = new
        speak(`${latest.title}. ${latest.message}`);
      }
    }
  });
}

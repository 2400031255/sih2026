/* ============================================================
   AGRISYNC OS — LOGISTICS MODULE
   Firestore operations for logistics role
   ============================================================ */

import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase.js';
import { sendNotification } from './notifications.js';
import { showToast, formatDate } from './navigation.js';

// ── DELIVERY STATUS FLOW ───────────────────────────────────
export const DELIVERY_STATUSES = [
  { key: 'pending',         label: 'Pending',         icon: '⏳', color: 'badge-gold' },
  { key: 'assigned',        label: 'Assigned',         icon: '📋', color: 'badge-blue' },
  { key: 'pickup_started',  label: 'Pickup Started',   icon: '🚗', color: 'badge-blue' },
  { key: 'picked_up',       label: 'Picked Up',        icon: '📦', color: 'badge-terra' },
  { key: 'in_transit',      label: 'In Transit',       icon: '🚚', color: 'badge-terra' },
  { key: 'delivered',       label: 'Delivered',        icon: '✅', color: 'badge-green' },
  { key: 'completed',       label: 'Completed',        icon: '🎉', color: 'badge-green' },
  { key: 'cancelled',       label: 'Cancelled',        icon: '❌', color: 'badge-red' },
];

export function getStatusConfig(key) {
  return DELIVERY_STATUSES.find(s => s.key === key) || DELIVERY_STATUSES[0];
}

// ── ADD TRUCK ──────────────────────────────────────────────
export async function addTruck(logisticsId, truckData) {
  try {
    const truck = {
      logisticsId,
      registrationNo: truckData.registrationNo,
      model:          truckData.model || '',
      capacity:       parseFloat(truckData.capacity) || 0,
      unit:           truckData.unit || 'ton',
      status:         'available',  // available | assigned | maintenance
      createdAt:      serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'trucks'), truck);
    showToast('Truck added successfully!', 'success');
    return { success: true, id: ref.id };
  } catch {
    showToast('Failed to add truck.', 'error');
    return { success: false };
  }
}

// ── ADD DRIVER ─────────────────────────────────────────────
export async function addDriver(logisticsId, driverData) {
  try {
    const driver = {
      logisticsId,
      name:        driverData.name,
      mobile:      driverData.mobile,
      licenseNo:   driverData.licenseNo || '',
      status:      'available',  // available | assigned | off
      createdAt:   serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'drivers'), driver);
    showToast('Driver added!', 'success');
    return { success: true, id: ref.id };
  } catch {
    showToast('Failed to add driver.', 'error');
    return { success: false };
  }
}

// ── ASSIGN DELIVERY ────────────────────────────────────────
export async function assignDelivery(orderId, { truckId, driverId, logisticsId, pickupAddress, deliveryAddress }) {
  try {
    // Create delivery record
    const delivRef = await addDoc(collection(db, 'deliveries'), {
      orderId,
      logisticsId,
      truckId,
      driverId,
      pickupAddress,
      deliveryAddress,
      status:    'assigned',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update order with delivery info
    await updateDoc(doc(db, 'orders', orderId), {
      deliveryId:  delivRef.id,
      logisticsId,
      status:      'processing',
      updatedAt:   serverTimestamp(),
    });

    // Mark truck and driver as assigned
    if (truckId)  await updateDoc(doc(db, 'trucks',  truckId),  { status: 'assigned' });
    if (driverId) await updateDoc(doc(db, 'drivers', driverId), { status: 'assigned' });

    showToast('Delivery assigned!', 'success');
    return { success: true, deliveryId: delivRef.id };
  } catch (err) {
    showToast('Assignment failed.', 'error');
    return { success: false };
  }
}

// ── UPDATE DELIVERY STATUS ─────────────────────────────────
export async function updateDeliveryStatus(deliveryId, newStatus, { farmerId, factoryId, cropName } = {}) {
  try {
    await updateDoc(doc(db, 'deliveries', deliveryId), {
      status:    newStatus,
      updatedAt: serverTimestamp(),
      [`${newStatus}At`]: serverTimestamp(),
    });

    // Notify relevant parties
    const cfg = getStatusConfig(newStatus);
    if (farmerId) {
      await sendNotification({
        userId:  farmerId,
        type:    'DELIVERY_STARTED',
        title:   `Delivery ${cfg.label}`,
        message: `Your ${cropName || 'crop'} delivery is now: ${cfg.label}`,
      });
    }
    if (factoryId && newStatus === 'delivered') {
      await sendNotification({
        userId:  factoryId,
        type:    'DELIVERY_STARTED',
        title:   'Delivery completed!',
        message: `${cropName || 'Crop'} has been delivered successfully.`,
      });
    }

    // Free up truck/driver on completion
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const snap = await getDocs(query(
        collection(db, 'deliveries'),
        where('__name__', '==', deliveryId)
      ));
      // handled via order update
    }

    showToast(`Status updated: ${cfg.label}`, 'success');
    return { success: true };
  } catch {
    showToast('Status update failed.', 'error');
    return { success: false };
  }
}

// ── LISTEN DELIVERIES ──────────────────────────────────────
export function listenDeliveries(logisticsId, onUpdate) {
  const q = query(
    collection(db, 'deliveries'),
    where('logisticsId', '==', logisticsId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── LISTEN TRUCKS ──────────────────────────────────────────
export function listenTrucks(logisticsId, onUpdate) {
  const q = query(collection(db, 'trucks'), where('logisticsId', '==', logisticsId));
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── LISTEN DRIVERS ─────────────────────────────────────────
export function listenDrivers(logisticsId, onUpdate) {
  const q = query(collection(db, 'drivers'), where('logisticsId', '==', logisticsId));
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── RENDER DELIVERY ROW ────────────────────────────────────
export function renderDeliveryRow(delivery) {
  const cfg = getStatusConfig(delivery.status);
  return `
    <tr>
      <td><span style="font-weight:600">#${delivery.id.slice(-6).toUpperCase()}</span></td>
      <td>${delivery.pickupAddress || '—'}</td>
      <td>${delivery.deliveryAddress || '—'}</td>
      <td><span class="badge ${cfg.color}">${cfg.icon} ${cfg.label}</span></td>
      <td>${formatDate(delivery.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="openDeliveryDetail('${delivery.id}')">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-primary" onclick="openStatusUpdate('${delivery.id}','${delivery.status}')">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </td>
    </tr>
  `;
}

// ── RENDER TRUCK CARD ──────────────────────────────────────
export function renderTruckCard(truck) {
  const statusColor = { available: 'badge-green', assigned: 'badge-gold', maintenance: 'badge-red' };
  return `
    <div class="card" data-aos="fade-up">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:32px;margin-bottom:var(--sp-2)">🚛</div>
          <div style="font-weight:700;font-size:15px">${truck.registrationNo}</div>
          <div style="font-size:12px;color:var(--text-muted)">${truck.model || 'Truck'}</div>
        </div>
        <span class="badge ${statusColor[truck.status] || 'badge-green'}">${truck.status}</span>
      </div>
      <div style="margin-top:var(--sp-3);font-size:13px;color:var(--text-muted)">
        Capacity: <strong style="color:var(--text-primary)">${truck.capacity} ${truck.unit}</strong>
      </div>
      <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2)">
        <button class="btn btn-sm btn-ghost" onclick="editTruck('${truck.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-outline" onclick="assignTruck('${truck.id}')">
          Assign
        </button>
      </div>
    </div>
  `;
}

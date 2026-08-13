/* ============================================================
   AGRISYNC OS — FARMER MODULE
   Firestore operations for farmer role
   ============================================================ */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, GeoPoint
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { db, storage } from './firebase.js';
import { sendNotification } from './notifications.js';
import { showToast, formatCurrency, formatDate } from './navigation.js';

// ── ADD CROP ───────────────────────────────────────────────
export async function addCrop(farmerId, cropData, imageFiles = []) {
  try {
    // Upload images first
    const imageUrls = await uploadCropImages(farmerId, imageFiles);

    const crop = {
      farmerId,
      cropName:      cropData.cropName,
      quantity:      parseFloat(cropData.quantity),
      unit:          cropData.unit || 'kg',
      harvestDate:   cropData.harvestDate,
      expectedPrice: parseFloat(cropData.expectedPrice),
      quality:       cropData.quality || 'B',
      description:   cropData.description || '',
      images:        imageUrls,
      latitude:      cropData.latitude  || null,
      longitude:     cropData.longitude || null,
      status:        'available',  // available | sold | expired
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'crops'), crop);
    showToast('Crop added successfully!', 'success');
    return { success: true, id: docRef.id };
  } catch (err) {
    showToast('Failed to add crop. Please try again.', 'error');
    return { success: false, error: err.message };
  }
}

// ── UPLOAD CROP IMAGES ─────────────────────────────────────
async function uploadCropImages(farmerId, files) {
  if (!files || files.length === 0) return [];
  const uploads = Array.from(files).slice(0, 3).map(async (file) => {
    const path    = `crops/${farmerId}/${Date.now()}_${file.name}`;
    const storRef = ref(storage, path);
    const snap    = await uploadBytesResumable(storRef, file);
    return getDownloadURL(snap.ref);
  });
  return Promise.all(uploads);
}

// ── GET FARMER CROPS ───────────────────────────────────────
export function listenFarmerCrops(farmerId, onUpdate) {
  const q = query(
    collection(db, 'crops'),
    where('farmerId', '==', farmerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(crops);
  });
}

// ── UPDATE CROP ────────────────────────────────────────────
export async function updateCrop(cropId, updates) {
  try {
    await updateDoc(doc(db, 'crops', cropId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    showToast('Crop updated.', 'success');
    return { success: true };
  } catch (err) {
    showToast('Update failed.', 'error');
    return { success: false };
  }
}

// ── DELETE CROP ────────────────────────────────────────────
export async function deleteCrop(cropId) {
  try {
    await deleteDoc(doc(db, 'crops', cropId));
    showToast('Crop removed.', 'success');
    return { success: true };
  } catch {
    showToast('Delete failed.', 'error');
    return { success: false };
  }
}

// ── GET FARMER ORDERS ──────────────────────────────────────
export function listenFarmerOrders(farmerId, onUpdate) {
  const q = query(
    collection(db, 'orders'),
    where('farmerId', '==', farmerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(orders);
  });
}

// ── ACCEPT PROCUREMENT REQUEST ─────────────────────────────
export async function acceptRequest(requestId, farmerId) {
  try {
    const reqRef  = doc(db, 'procurement_requests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Request not found');

    const reqData = reqSnap.data();

    // Update request status
    await updateDoc(reqRef, {
      status:    'accepted',
      acceptedAt: serverTimestamp(),
    });

    // Create order
    const orderRef = await addDoc(collection(db, 'orders'), {
      farmerId,
      factoryId:   reqData.factoryId,
      cropId:      reqData.cropId,
      cropName:    reqData.cropName,
      quantity:    reqData.quantity,
      unit:        reqData.unit || 'kg',
      pricePerUnit: reqData.offeredPrice,
      totalValue:  reqData.quantity * reqData.offeredPrice,
      status:      'confirmed',
      requestId,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

    // Notify factory
    await sendNotification({
      userId:  reqData.factoryId,
      type:    'ORDER_ACCEPTED',
      title:   'Farmer accepted your request',
      message: `Order confirmed for ${reqData.quantity} kg of ${reqData.cropName}.`,
      data:    { orderId: orderRef.id },
    });

    showToast('Request accepted! Order created.', 'success');
    return { success: true, orderId: orderRef.id };
  } catch (err) {
    showToast('Failed to accept request.', 'error');
    return { success: false };
  }
}

// ── REJECT PROCUREMENT REQUEST ─────────────────────────────
export async function rejectRequest(requestId, factoryId, cropName) {
  try {
    await updateDoc(doc(db, 'procurement_requests', requestId), {
      status:     'rejected',
      rejectedAt: serverTimestamp(),
    });

    await sendNotification({
      userId:  factoryId,
      type:    'ORDER_REJECTED',
      title:   'Farmer declined your request',
      message: `Your request for ${cropName} was not accepted.`,
    });

    showToast('Request rejected.', 'info');
    return { success: true };
  } catch {
    showToast('Action failed.', 'error');
    return { success: false };
  }
}

// ── GET INCOMING REQUESTS ──────────────────────────────────
export function listenIncomingRequests(farmerId, onUpdate) {
  const q = query(
    collection(db, 'procurement_requests'),
    where('farmerId', '==', farmerId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── RENDER CROP CARD ───────────────────────────────────────
export function renderCropCard(crop) {
  const statusColors = {
    available: 'badge-green',
    sold:      'badge-gold',
    expired:   'badge-red',
  };
  const emoji = getCropEmoji(crop.cropName);
  return `
    <div class="crop-card" data-aos="fade-up">
      <div class="crop-card-img">
        ${crop.images?.[0]
          ? `<img src="${crop.images[0]}" alt="${crop.cropName}" loading="lazy">`
          : emoji}
      </div>
      <div class="crop-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--sp-2)">
          <div class="crop-card-name">${crop.cropName}</div>
          <span class="badge ${statusColors[crop.status] || 'badge-green'}">${crop.status}</span>
        </div>
        <div class="crop-card-meta">
          <div class="crop-meta-row">
            <span>Quantity</span>
            <span class="crop-meta-val">${crop.quantity} ${crop.unit}</span>
          </div>
          <div class="crop-meta-row">
            <span>Expected Price</span>
            <span class="crop-meta-val">₹${crop.expectedPrice}/kg</span>
          </div>
          <div class="crop-meta-row">
            <span>Quality</span>
            <span class="crop-meta-val">Grade ${crop.quality}</span>
          </div>
          <div class="crop-meta-row">
            <span>Harvest Date</span>
            <span class="crop-meta-val">${crop.harvestDate || '—'}</span>
          </div>
        </div>
      </div>
      <div class="crop-card-footer">
        <button class="btn btn-sm btn-ghost" onclick="editCrop('${crop.id}')">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="btn btn-sm btn-primary" onclick="viewCropBuyers('${crop.id}')">
          <i class="fa-solid fa-store"></i> Find Buyers
        </button>
      </div>
    </div>
  `;
}

// ── CROP EMOJI MAP ─────────────────────────────────────────
export function getCropEmoji(name = '') {
  const map = {
    tomato: '🍅', potato: '🥔', onion: '🧅', rice: '🌾',
    wheat: '🌾', maize: '🌽', corn: '🌽', mango: '🥭',
    banana: '🍌', grapes: '🍇', orange: '🍊', lemon: '🍋',
    chilli: '🌶️', carrot: '🥕', spinach: '🥬', cabbage: '🥬',
    cauliflower: '🥦', brinjal: '🍆', cotton: '🌿',
    sugarcane: '🎋', soybean: '🫘', groundnut: '🥜',
  };
  return map[name.toLowerCase()] || '🌱';
}

// ── RENDER ORDER ROW ───────────────────────────────────────
export function renderOrderRow(order) {
  const statusBadge = {
    confirmed:  'badge-blue',
    processing: 'badge-gold',
    in_transit: 'badge-terra',
    delivered:  'badge-green',
    completed:  'badge-green',
    cancelled:  'badge-red',
  };
  return `
    <tr>
      <td><span style="font-weight:600">#${order.id.slice(-6).toUpperCase()}</span></td>
      <td>${order.cropName}</td>
      <td>${order.quantity} ${order.unit || 'kg'}</td>
      <td>${formatCurrency(order.totalValue)}</td>
      <td><span class="badge ${statusBadge[order.status] || 'badge-blue'}">${order.status}</span></td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="viewOrder('${order.id}')">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
    </tr>
  `;
}

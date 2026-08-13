/* ============================================================
   AGRISYNC OS — FACTORY MODULE
   Firestore operations for factory role
   ============================================================ */

import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase.js';
import { sendNotification } from './notifications.js';
import { showToast, formatCurrency, formatDate } from './navigation.js';
import { calculateDistance } from './maps.js';
import { calculateReliabilityScore } from './ai.js';

// ── SEARCH AVAILABLE CROPS ─────────────────────────────────
export async function searchCrops({ cropName, minQty, maxPrice, state } = {}) {
  try {
    let q = query(
      collection(db, 'crops'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snap = await getDocs(q);
    let crops = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side filters
    if (cropName) crops = crops.filter(c => c.cropName?.toLowerCase().includes(cropName.toLowerCase()));
    if (minQty)   crops = crops.filter(c => c.quantity >= parseFloat(minQty));
    if (maxPrice) crops = crops.filter(c => c.expectedPrice <= parseFloat(maxPrice));

    return crops;
  } catch (err) {
    showToast('Search failed. Please try again.', 'error');
    return [];
  }
}

// ── GET NEARBY FARMERS ─────────────────────────────────────
export async function getNearbyFarmers(factoryLat, factoryLng, radiusKm = 100) {
  try {
    const snap = await getDocs(collection(db, 'farmers'));
    const farmers = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(f => f.latitude && f.longitude)
      .map(f => ({
        ...f,
        distance: calculateDistance(factoryLat, factoryLng, f.latitude, f.longitude),
      }))
      .filter(f => f.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return farmers;
  } catch {
    return [];
  }
}

// ── CREATE PROCUREMENT REQUEST ─────────────────────────────
export async function createProcurementRequest(factoryId, requestData) {
  try {
    const request = {
      factoryId,
      farmerId:     requestData.farmerId,
      cropId:       requestData.cropId,
      cropName:     requestData.cropName,
      quantity:     parseFloat(requestData.quantity),
      unit:         requestData.unit || 'kg',
      offeredPrice: parseFloat(requestData.offeredPrice),
      totalValue:   parseFloat(requestData.quantity) * parseFloat(requestData.offeredPrice),
      message:      requestData.message || '',
      requiredBy:   requestData.requiredBy || '',
      status:       'pending',  // pending | accepted | rejected | expired
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'procurement_requests'), request);

    // Notify farmer
    await sendNotification({
      userId:  requestData.farmerId,
      type:    'BUYER_REQUEST',
      title:   'New buyer request!',
      message: `A factory wants to buy ${requestData.quantity} kg of ${requestData.cropName} at ₹${requestData.offeredPrice}/kg.`,
      data:    { requestId: docRef.id },
    });

    showToast('Procurement request sent to farmer!', 'success');
    return { success: true, id: docRef.id };
  } catch (err) {
    showToast('Failed to send request.', 'error');
    return { success: false };
  }
}

// ── LISTEN FACTORY ORDERS ──────────────────────────────────
export function listenFactoryOrders(factoryId, onUpdate) {
  const q = query(
    collection(db, 'orders'),
    where('factoryId', '==', factoryId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── LISTEN FACTORY REQUESTS ────────────────────────────────
export function listenFactoryRequests(factoryId, onUpdate) {
  const q = query(
    collection(db, 'procurement_requests'),
    where('factoryId', '==', factoryId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── GET FARMER PROFILE WITH RELIABILITY ───────────────────
export async function getFarmerWithReliability(farmerId) {
  try {
    const snap = await getDoc(doc(db, 'farmers', farmerId));
    if (!snap.exists()) return null;
    const farmer = { id: snap.id, ...snap.data() };
    const { score, breakdown } = calculateReliabilityScore(farmer);
    return { ...farmer, reliabilityScore: score, reliabilityBreakdown: breakdown };
  } catch {
    return null;
  }
}

// ── RENDER CROP LISTING ROW ────────────────────────────────
export function renderCropListingRow(crop, factoryLat, factoryLng) {
  const dist = crop.latitude && factoryLat
    ? calculateDistance(factoryLat, factoryLng, crop.latitude, crop.longitude)
    : '—';

  return `
    <tr>
      <td>
        <div style="font-weight:600">${crop.cropName}</div>
        <div style="font-size:12px;color:var(--text-muted)">${crop.farmerId?.slice(0,8)}...</div>
      </td>
      <td>${crop.quantity} ${crop.unit}</td>
      <td>₹${crop.expectedPrice}/kg</td>
      <td><span class="badge badge-green">Grade ${crop.quality}</span></td>
      <td>${dist} km</td>
      <td>${crop.harvestDate || '—'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="openRequestModal('${crop.id}','${crop.farmerId}','${crop.cropName}',${crop.quantity},${crop.expectedPrice})">
          <i class="fa-solid fa-paper-plane"></i> Request
        </button>
      </td>
    </tr>
  `;
}

// ── RENDER FARMER CARD ─────────────────────────────────────
export function renderFarmerCard(farmer) {
  const { score } = calculateReliabilityScore(farmer);
  const stars = Math.round(score / 20);
  return `
    <div class="card" data-aos="fade-up">
      <div style="display:flex;gap:var(--sp-3);align-items:flex-start">
        <div class="avatar-placeholder avatar-md" style="font-size:16px">
          ${(farmer.name || 'F').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:15px">${farmer.name || 'Farmer'}</div>
          <div style="font-size:12px;color:var(--text-muted)">${farmer.district || ''}, ${farmer.state || ''}</div>
          <div style="color:var(--harvest-gold);font-size:14px;margin-top:3px">
            ${'★'.repeat(stars)}${'☆'.repeat(5-stars)}
            <span style="font-size:11px;color:var(--text-muted);margin-left:4px">${score}/100</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:var(--text-muted)">${farmer.distance || '—'} km</div>
        </div>
      </div>
      <div style="margin-top:var(--sp-4);display:flex;gap:var(--sp-2);flex-wrap:wrap">
        ${(farmer.crops || []).map(c => `<span class="tag">${c}</span>`).join('')}
      </div>
      <div style="margin-top:var(--sp-4);display:flex;gap:var(--sp-2)">
        <button class="btn btn-sm btn-outline" onclick="viewFarmerProfile('${farmer.id}')">
          <i class="fa-solid fa-user"></i> Profile
        </button>
        <button class="btn btn-sm btn-primary" onclick="contactFarmer('${farmer.id}')">
          <i class="fa-solid fa-paper-plane"></i> Request
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   AGRISYNC OS — GOVERNMENT / FPO ANALYTICS MODULE
   ============================================================ */

import {
  collection, getDocs, query, where,
  orderBy, limit, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from './firebase.js';

// ── PLATFORM STATISTICS ────────────────────────────────────
export async function getPlatformStats() {
  try {
    const [farmers, factories, crops, orders, deliveries] = await Promise.all([
      getCountFromServer(collection(db, 'farmers')),
      getCountFromServer(collection(db, 'factories')),
      getCountFromServer(collection(db, 'crops')),
      getCountFromServer(collection(db, 'orders')),
      getCountFromServer(collection(db, 'deliveries')),
    ]);

    return {
      totalFarmers:    farmers.data().count,
      totalFactories:  factories.data().count,
      totalCrops:      crops.data().count,
      totalOrders:     orders.data().count,
      totalDeliveries: deliveries.data().count,
    };
  } catch {
    // Return mock stats if Firestore fails
    return {
      totalFarmers: 1240, totalFactories: 87,
      totalCrops: 3450, totalOrders: 892, totalDeliveries: 756,
    };
  }
}

// ── CROP PRODUCTION DATA ───────────────────────────────────
export async function getCropProductionData() {
  try {
    const snap = await getDocs(query(
      collection(db, 'crops'),
      orderBy('createdAt', 'desc'),
      limit(200)
    ));
    const crops = snap.docs.map(d => d.data());

    // Aggregate by crop name
    const agg = {};
    crops.forEach(c => {
      const name = c.cropName || 'Other';
      agg[name] = (agg[name] || 0) + (c.quantity || 0);
    });

    const sorted = Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      labels: sorted.map(([k]) => k),
      data:   sorted.map(([, v]) => v),
    };
  } catch {
    return {
      labels: ['Tomato','Onion','Potato','Rice','Wheat','Maize','Cotton','Soybean'],
      data:   [12500, 9800, 8200, 15000, 11000, 7500, 4200, 3800],
    };
  }
}

// ── ORDER TREND DATA (last 6 months) ──────────────────────
export async function getOrderTrendData() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-IN', { month: 'short' }));
  }
  // Mock trend data (replace with real Firestore aggregation)
  return {
    labels: months,
    orders:    [45, 62, 78, 91, 110, 134],
    delivered: [40, 55, 70, 85, 98,  120],
    value:     [180000, 248000, 312000, 364000, 440000, 536000],
  };
}

// ── DISTRICT PRODUCTION MAP ────────────────────────────────
export async function getDistrictData() {
  // Returns top producing districts
  return [
    { district: 'Guntur',      state: 'AP',  production: 45000, crop: 'Chilli' },
    { district: 'Nashik',      state: 'MH',  production: 38000, crop: 'Onion' },
    { district: 'Kolar',       state: 'KA',  production: 32000, crop: 'Tomato' },
    { district: 'Ludhiana',    state: 'PB',  production: 28000, crop: 'Wheat' },
    { district: 'Thanjavur',   state: 'TN',  production: 25000, crop: 'Rice' },
    { district: 'Nadia',       state: 'WB',  production: 22000, crop: 'Potato' },
    { district: 'Amravati',    state: 'MH',  production: 19000, crop: 'Cotton' },
    { district: 'Anantapur',   state: 'AP',  production: 17000, crop: 'Groundnut' },
  ];
}

// ── SURPLUS / SHORTAGE ANALYSIS ────────────────────────────
export async function getSurplusShortageData() {
  try {
    const cropsSnap  = await getDocs(collection(db, 'crops'));
    const ordersSnap = await getDocs(collection(db, 'orders'));

    const supply = {};
    cropsSnap.docs.forEach(d => {
      const c = d.data();
      supply[c.cropName] = (supply[c.cropName] || 0) + (c.quantity || 0);
    });

    const demand = {};
    ordersSnap.docs.forEach(d => {
      const o = d.data();
      demand[o.cropName] = (demand[o.cropName] || 0) + (o.quantity || 0);
    });

    const analysis = Object.keys({ ...supply, ...demand }).map(crop => {
      const s = supply[crop] || 0;
      const d = demand[crop] || 0;
      const diff = s - d;
      return {
        crop,
        supply: s,
        demand: d,
        surplus:  diff > 0 ? diff : 0,
        shortage: diff < 0 ? Math.abs(diff) : 0,
        status:   diff > 500 ? 'surplus' : diff < -500 ? 'shortage' : 'balanced',
      };
    });

    return analysis;
  } catch {
    return [
      { crop: 'Tomato',  supply: 12500, demand: 9800,  surplus: 2700, shortage: 0,    status: 'surplus' },
      { crop: 'Onion',   supply: 8200,  demand: 11000, surplus: 0,    shortage: 2800, status: 'shortage' },
      { crop: 'Potato',  supply: 9500,  demand: 9200,  surplus: 300,  shortage: 0,    status: 'balanced' },
      { crop: 'Rice',    supply: 15000, demand: 14500, surplus: 500,  shortage: 0,    status: 'balanced' },
      { crop: 'Wheat',   supply: 11000, demand: 13000, surplus: 0,    shortage: 2000, status: 'shortage' },
    ];
  }
}

// ── INIT CHARTS ────────────────────────────────────────────
export function initCropProductionChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Production (kg)',
        data:  data.data,
        backgroundColor: [
          '#245C3A','#4F7D3A','#A8C39A','#D5A928',
          '#795548','#4C8C8A','#C96B4B','#26332B',
        ],
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toLocaleString('en-IN')} kg`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(36,92,58,0.06)' },
          ticks: { color: '#5A6B5E' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#5A6B5E' },
        },
      },
    },
  });
}

export function initOrderTrendChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Orders',
          data:  data.orders,
          borderColor: '#245C3A',
          backgroundColor: 'rgba(36,92,58,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#245C3A',
          pointRadius: 4,
        },
        {
          label: 'Delivered',
          data:  data.delivered,
          borderColor: '#D5A928',
          backgroundColor: 'rgba(213,169,40,0.06)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#D5A928',
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(36,92,58,0.06)' }, ticks: { color: '#5A6B5E' } },
        x: { grid: { display: false }, ticks: { color: '#5A6B5E' } },
      },
    },
  });
}

export function initSurplusChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.crop),
      datasets: [{
        data: data.map(d => d.supply),
        backgroundColor: ['#245C3A','#4F7D3A','#D5A928','#4C8C8A','#C96B4B'],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { color: '#26332B', padding: 16 } },
      },
    },
  });
}

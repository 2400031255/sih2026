/* ============================================================
   AGRISYNC OS — REPORTS MODULE
   Print + PDF export using browser print API
   ============================================================ */

import { getDocs, query, collection, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase.js';
import { formatDate, formatCurrency } from './navigation.js';

// ── GENERATE ORDER REPORT ──────────────────────────────────
export async function generateOrderReport(userId, role) {
  const field = role === 'farmer' ? 'farmerId' : 'factoryId';
  const snap  = await getDocs(query(
    collection(db, 'orders'),
    where(field, '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GENERATE CROP REPORT ───────────────────────────────────
export async function generateCropReport(farmerId) {
  const snap = await getDocs(query(
    collection(db, 'crops'),
    where('farmerId', '==', farmerId),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── PRINT REPORT ───────────────────────────────────────────
export function printReport(title, tableHtml) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — AgriSync OS</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #26332B; }
        h1   { font-size: 22px; color: #245C3A; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #888; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #245C3A; color: white; padding: 10px 12px; text-align: left; }
        td { padding: 9px 12px; border-bottom: 1px solid #e8e8e8; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>🌾 AgriSync OS — ${title}</h1>
      <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} · From Farm. To Factory. Smarter.</div>
      ${tableHtml}
      <div class="footer">AgriSync OS · Confidential · For authorized use only</div>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ── RENDER ORDER REPORT TABLE ──────────────────────────────
export function renderOrderReportTable(orders) {
  const rows = orders.map(o => `
    <tr>
      <td>#${o.id.slice(-6).toUpperCase()}</td>
      <td>${o.cropName}</td>
      <td>${o.quantity} ${o.unit || 'kg'}</td>
      <td>₹${o.pricePerUnit}/kg</td>
      <td>${formatCurrency(o.totalValue)}</td>
      <td>${o.status}</td>
      <td>${formatDate(o.createdAt)}</td>
    </tr>
  `).join('');

  const total = orders.reduce((s, o) => s + (o.totalValue || 0), 0);

  return `
    <table>
      <thead>
        <tr>
          <th>Order ID</th><th>Crop</th><th>Quantity</th>
          <th>Price/kg</th><th>Total Value</th><th>Status</th><th>Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="font-weight:700;text-align:right">Total Value:</td>
          <td style="font-weight:700">${formatCurrency(total)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  `;
}

// ── RENDER CROP REPORT TABLE ───────────────────────────────
export function renderCropReportTable(crops) {
  const rows = crops.map(c => `
    <tr>
      <td>${c.cropName}</td>
      <td>${c.quantity} ${c.unit}</td>
      <td>₹${c.expectedPrice}/kg</td>
      <td>Grade ${c.quality}</td>
      <td>${c.harvestDate || '—'}</td>
      <td>${c.status}</td>
      <td>${formatDate(c.createdAt)}</td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Crop</th><th>Quantity</th><th>Price</th>
          <th>Quality</th><th>Harvest Date</th><th>Status</th><th>Added On</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

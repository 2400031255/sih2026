/* ============================================================
   AGRISYNC OS — AI RECOMMENDATION ENGINE
   ⚠️  This is a transparent rule-based recommendation system.
       It uses weighted scoring — NOT a trained ML model.
       All scoring logic is documented and explainable.
   ============================================================ */

import { calculateDistance } from './maps.js';

// ── SCORING WEIGHTS ────────────────────────────────────────
const WEIGHTS = {
  reliability:  0.30,  // Past delivery + quality history
  distance:     0.25,  // Proximity (lower = better)
  price:        0.20,  // Price competitiveness
  quantity:     0.15,  // Quantity match to requirement
  quality:      0.10,  // Crop quality grade
};

const QUALITY_SCORES = { A: 100, B: 80, C: 60, D: 40 };

// ── SUPPLIER RELIABILITY SCORE ─────────────────────────────
export function calculateReliabilityScore(farmer) {
  const {
    totalOrders    = 0,
    completedOrders = 0,
    cancelledOrders = 0,
    onTimeDeliveries = 0,
    qualityRating  = 4.0,  // out of 5
    avgQualityGrade = 'B',
  } = farmer;

  if (totalOrders === 0) return { score: 75, breakdown: defaultBreakdown() };

  const deliveryRate  = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 75;
  const cancelRate    = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const onTimeRate    = completedOrders > 0 ? (onTimeDeliveries / completedOrders) * 100 : 75;
  const qualityScore  = (qualityRating / 5) * 100;
  const consistScore  = Math.max(0, 100 - (cancelRate * 2));

  const score = Math.round(
    deliveryRate * 0.30 +
    onTimeRate   * 0.25 +
    qualityScore * 0.25 +
    consistScore * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      delivery:    Math.round(deliveryRate),
      timeliness:  Math.round(onTimeRate),
      quality:     Math.round(qualityScore),
      consistency: Math.round(consistScore),
    },
  };
}

function defaultBreakdown() {
  return { delivery: 75, timeliness: 75, quality: 75, consistency: 75 };
}

// ── PROCUREMENT RECOMMENDATION ─────────────────────────────
export function recommendSuppliers({
  requirement,      // { cropName, quantity, maxPrice, factoryLat, factoryLng }
  farmers,          // Array of farmer objects with crop listings
  topN = 5,
}) {
  const scored = farmers
    .filter(f => f.cropName?.toLowerCase() === requirement.cropName?.toLowerCase())
    .map(f => {
      const score = scoreSupplier(f, requirement);
      return { ...f, aiScore: score };
    })
    .sort((a, b) => b.aiScore.total - a.aiScore.total)
    .slice(0, topN);

  return {
    recommendations: scored,
    summary: generateSummary(scored, requirement),
    methodology: 'Rule-based scoring using: reliability (30%), distance (25%), price (20%), quantity match (15%), quality (10%)',
  };
}

function scoreSupplier(farmer, req) {
  // 1. Reliability score (0–100)
  const { score: relScore } = calculateReliabilityScore(farmer);

  // 2. Distance score (0–100) — closer is better, max 200km
  const dist = farmer.lat && farmer.lng && req.factoryLat && req.factoryLng
    ? calculateDistance(req.factoryLat, req.factoryLng, farmer.lat, farmer.lng)
    : 50;
  const distScore = Math.max(0, 100 - (dist / 2));

  // 3. Price score (0–100) — lower price = higher score
  const priceScore = req.maxPrice && farmer.expectedPrice
    ? Math.max(0, Math.min(100, ((req.maxPrice - farmer.expectedPrice) / req.maxPrice) * 100 + 50))
    : 60;

  // 4. Quantity match score (0–100)
  const qtyRatio = req.quantity && farmer.quantity
    ? Math.min(farmer.quantity / req.quantity, 1)
    : 0.5;
  const qtyScore = qtyRatio * 100;

  // 5. Quality score (0–100)
  const qualScore = QUALITY_SCORES[farmer.quality] || 60;

  const total = Math.round(
    relScore  * WEIGHTS.reliability +
    distScore * WEIGHTS.distance    +
    priceScore * WEIGHTS.price      +
    qtyScore  * WEIGHTS.quantity    +
    qualScore * WEIGHTS.quality
  );

  return {
    total,
    reliability: Math.round(relScore),
    distance:    Math.round(distScore),
    price:       Math.round(priceScore),
    quantity:    Math.round(qtyScore),
    quality:     Math.round(qualScore),
    distanceKm:  dist,
  };
}

function generateSummary(recommendations, req) {
  if (!recommendations.length) {
    return `No suppliers found for ${req.cropName}. Consider expanding search radius or adjusting price range.`;
  }
  const best = recommendations[0];
  const totalAvail = recommendations.reduce((s, f) => s + (f.quantity || 0), 0);
  const avgPrice   = Math.round(recommendations.reduce((s, f) => s + (f.expectedPrice || 0), 0) / recommendations.length);

  return `Found ${recommendations.length} suppliers for ${req.cropName}. `
       + `Total available: ${totalAvail} kg. `
       + `Average price: ₹${avgPrice}/kg. `
       + `Top recommendation: ${best.name || 'Farmer'} with AI score ${best.aiScore.total}/100.`;
}

// ── PRICE FORECAST ─────────────────────────────────────────
// Rule-based price trend using seasonality + demand signals
export function forecastPrice(cropName, currentPrice, month = new Date().getMonth()) {
  const seasonalFactors = {
    tomato:   [1.2, 1.1, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 1.1],
    onion:    [0.9, 0.8, 0.9, 1.1, 1.3, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.0],
    potato:   [1.0, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1],
    rice:     [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 1.0, 1.1, 1.1, 1.0],
    wheat:    [1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1],
  };

  const key    = cropName.toLowerCase();
  const factor = seasonalFactors[key]?.[month] || 1.0;
  const noise  = (Math.random() - 0.5) * 0.05; // ±2.5% variation
  const forecast = Math.round(currentPrice * (factor + noise));
  const trend  = forecast > currentPrice ? 'up' : forecast < currentPrice ? 'down' : 'stable';

  return {
    current:  currentPrice,
    forecast,
    trend,
    change:   forecast - currentPrice,
    changePct: Math.round(((forecast - currentPrice) / currentPrice) * 100),
    confidence: 'Medium',
    note: 'Based on historical seasonal patterns. Actual prices may vary.',
  };
}

// ── HARVEST PREDICTION ─────────────────────────────────────
export function predictHarvestWindow(cropName, sowingDate) {
  const growthDays = {
    tomato: 75, potato: 90, onion: 120, rice: 130, wheat: 120,
    maize: 90, cotton: 160, sugarcane: 365, soybean: 100,
    groundnut: 120, mustard: 90, sunflower: 90, chilli: 90,
    brinjal: 70, cabbage: 75, cauliflower: 80, spinach: 40,
    carrot: 75, radish: 35, mango: 0, banana: 270,
  };

  const days = growthDays[cropName.toLowerCase()] || 90;
  const sow  = new Date(sowingDate);
  const harvest = new Date(sow.getTime() + days * 86400000);
  const window  = new Date(harvest.getTime() + 7 * 86400000);

  return {
    harvestStart: harvest.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
    harvestEnd:   window.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
    daysToHarvest: Math.max(0, Math.round((harvest - Date.now()) / 86400000)),
    growthDays: days,
  };
}

// ── RENDER AI RECOMMENDATION CARD ─────────────────────────
export function renderAIRecommendation(containerId, { requirement, recommendations, summary }) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const stars = (score) => {
    const filled = Math.round(score / 20);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  };

  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-robot"></i>
          AI Procurement Recommendation
        </div>
        <span class="badge badge-blue">
          <i class="fa-solid fa-circle-info"></i>
          Rule-based AI
        </span>
      </div>
      <div style="background:rgba(36,92,58,0.04);border-radius:var(--radius-md);padding:var(--sp-4);margin-bottom:var(--sp-5)">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-4);text-align:center">
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Crop</div>
            <div style="font-weight:700;color:var(--text-primary)">${requirement.cropName}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Required</div>
            <div style="font-weight:700;color:var(--text-primary)">${requirement.quantity} kg</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Max Price</div>
            <div style="font-weight:700;color:var(--text-primary)">₹${requirement.maxPrice}/kg</div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:var(--sp-4)">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:var(--sp-3)">
          Recommended Suppliers
        </div>
        ${recommendations.map((f, i) => `
          <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0;border-bottom:var(--border)">
            <div style="width:28px;height:28px;border-radius:50%;background:${i===0?'var(--harvest-gold)':'rgba(36,92,58,0.1)'};
                        color:${i===0?'var(--charcoal)':'var(--forest-green)'};
                        display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">
              ${i+1}
            </div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px">${f.name || 'Farmer'}</div>
              <div style="font-size:12px;color:var(--text-muted)">${f.aiScore.distanceKm} km · ${f.quantity} kg · ₹${f.expectedPrice}/kg</div>
            </div>
            <div style="text-align:right">
              <div style="color:var(--harvest-gold);font-size:14px">${stars(f.aiScore.total)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${f.aiScore.total}/100</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="background:rgba(213,169,40,0.08);border-radius:var(--radius-md);padding:var(--sp-3);font-size:12px;color:var(--text-secondary)">
        <i class="fa-solid fa-circle-info" style="color:var(--harvest-gold)"></i>
        ${summary}
      </div>
    </div>
  `;
}

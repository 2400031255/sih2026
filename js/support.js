/* ============================================================
   AGRISYNC OS — CUSTOMER SUPPORT WIDGET
   Features: AI Chat, Raise Complaint, Customer Care Number
   ============================================================ */

const SUPPORT_PHONE = '+91-1800-XXX-AGRI'; // toll-free
const SUPPORT_EMAIL = 'support@agrisync.in';
const SUPPORT_HOURS = 'Mon–Sat, 8 AM – 8 PM IST';

// ── AI CHAT RESPONSES ──────────────────────────────────────
const AI_RESPONSES = {
  price:    'Current market prices are updated daily. Go to Dashboard → Market Prices for live rates. You can also check the AI Insights section for price forecasts.',
  weather:  'Weather data is fetched from your live GPS location using Open-Meteo. Go to Weather page for full forecast and farming recommendations.',
  order:    'To track your order: go to Orders page and click on any order to see its status. You will also receive notifications for every status change.',
  payment:  'Payments are processed after order completion. Contact your buyer directly or raise a complaint if payment is delayed beyond 7 days.',
  crop:     'To add a crop: go to My Crops → Add Crop. Fill in crop name, quantity, price and harvest date. Buyers will be able to find you.',
  buyer:    'To find buyers: go to Buyers page. Our AI will match you with the best factories based on your crop, location and price.',
  delivery: 'Delivery is managed by the logistics provider assigned to your order. Track it in real-time on the Orders page.',
  account:  'To update your profile: go to Profile page. You can change your name, mobile, location and preferred language.',
  complaint:'To raise a complaint: click the Raise Complaint button in this support panel. Our team responds within 24 hours.',
  default:  'I\'m here to help! You can ask me about prices, weather, orders, payments, crops, buyers, delivery, or your account. Or call our helpline for immediate assistance.',
};

function getAIResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes('price') || m.includes('rate') || m.includes('cost')) return AI_RESPONSES.price;
  if (m.includes('weather') || m.includes('rain') || m.includes('forecast')) return AI_RESPONSES.weather;
  if (m.includes('order') || m.includes('track') || m.includes('status')) return AI_RESPONSES.order;
  if (m.includes('pay') || m.includes('money') || m.includes('rupee')) return AI_RESPONSES.payment;
  if (m.includes('crop') || m.includes('add') || m.includes('list')) return AI_RESPONSES.crop;
  if (m.includes('buyer') || m.includes('factory') || m.includes('sell')) return AI_RESPONSES.buyer;
  if (m.includes('deliver') || m.includes('truck') || m.includes('transport')) return AI_RESPONSES.delivery;
  if (m.includes('account') || m.includes('profile') || m.includes('password')) return AI_RESPONSES.account;
  if (m.includes('complaint') || m.includes('problem') || m.includes('issue')) return AI_RESPONSES.complaint;
  return AI_RESPONSES.default;
}

// ── INJECT WIDGET HTML ─────────────────────────────────────
function injectWidget() {
  const html = `
  <style>
    .support-fab {
      position:fixed; bottom:28px; right:28px; z-index:9000;
      width:56px; height:56px; border-radius:50%;
      background:linear-gradient(135deg,#245C3A,#4F7D3A);
      color:#fff; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      font-size:22px; box-shadow:0 4px 20px rgba(36,92,58,0.45);
      transition:all 0.2s;
    }
    .support-fab:hover { transform:scale(1.1); box-shadow:0 6px 28px rgba(36,92,58,0.55); }
    .support-fab .fab-badge {
      position:absolute; top:-4px; right:-4px;
      width:18px; height:18px; border-radius:50%;
      background:#C96B4B; color:#fff; font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      border:2px solid #fff;
    }

    .support-panel {
      position:fixed; bottom:96px; right:28px; z-index:9000;
      width:360px; max-height:580px;
      background:#fff; border-radius:20px;
      box-shadow:0 16px 60px rgba(0,0,0,0.18);
      border:1px solid rgba(36,92,58,0.12);
      display:flex; flex-direction:column;
      transform:scale(0.9) translateY(20px);
      opacity:0; visibility:hidden;
      transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .support-panel.open {
      transform:scale(1) translateY(0);
      opacity:1; visibility:visible;
    }

    .sp-header {
      background:linear-gradient(135deg,#245C3A,#4F7D3A);
      color:#fff; padding:16px 20px; border-radius:20px 20px 0 0;
      display:flex; align-items:center; justify-content:space-between;
    }
    .sp-header-title { font-size:15px; font-weight:800; }
    .sp-header-sub   { font-size:11px; opacity:0.75; margin-top:2px; }
    .sp-close {
      width:30px; height:30px; border-radius:50%;
      background:rgba(255,255,255,0.15); border:none; color:#fff;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      font-size:14px; transition:background 0.2s;
    }
    .sp-close:hover { background:rgba(255,255,255,0.25); }

    .sp-tabs {
      display:flex; border-bottom:1px solid rgba(36,92,58,0.10);
    }
    .sp-tab {
      flex:1; padding:10px 8px; font-size:12px; font-weight:600;
      color:#7a9485; border:none; background:transparent; cursor:pointer;
      border-bottom:2px solid transparent; transition:all 0.2s;
    }
    .sp-tab.active { color:#245C3A; border-bottom-color:#245C3A; }

    .sp-body { flex:1; overflow:hidden; display:flex; flex-direction:column; }
    .sp-tab-content { display:none; flex:1; flex-direction:column; overflow:hidden; }
    .sp-tab-content.active { display:flex; }

    /* Chat */
    .sp-chat-msgs {
      flex:1; overflow-y:auto; padding:16px;
      display:flex; flex-direction:column; gap:10px;
      max-height:280px;
    }
    .sp-msg {
      max-width:85%; padding:10px 14px; border-radius:14px;
      font-size:13px; line-height:1.5;
    }
    .sp-msg.bot  { background:rgba(36,92,58,0.08); color:#1c2b22; align-self:flex-start; border-radius:4px 14px 14px 14px; }
    .sp-msg.user { background:#245C3A; color:#fff; align-self:flex-end; border-radius:14px 4px 14px 14px; }
    .sp-msg-time { font-size:10px; opacity:0.55; margin-top:4px; }

    .sp-chat-input {
      display:flex; gap:8px; padding:12px 16px;
      border-top:1px solid rgba(36,92,58,0.10);
    }
    .sp-chat-input input {
      flex:1; padding:9px 14px; border:1.5px solid rgba(36,92,58,0.15);
      border-radius:999px; font-size:13px; outline:none;
      font-family:inherit; transition:border-color 0.2s;
    }
    .sp-chat-input input:focus { border-color:#245C3A; }
    .sp-send {
      width:36px; height:36px; border-radius:50%;
      background:#245C3A; color:#fff; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      font-size:14px; transition:background 0.2s; flex-shrink:0;
    }
    .sp-send:hover { background:#4F7D3A; }

    /* Contact */
    .sp-contact { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .sp-contact-card {
      display:flex; align-items:center; gap:14px;
      padding:14px 16px; border-radius:12px;
      border:1.5px solid rgba(36,92,58,0.12);
      background:rgba(36,92,58,0.03); cursor:pointer;
      transition:all 0.2s; text-decoration:none; color:inherit;
    }
    .sp-contact-card:hover { border-color:#245C3A; background:rgba(36,92,58,0.07); }
    .sp-contact-icon {
      width:44px; height:44px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:20px; flex-shrink:0;
    }
    .sp-contact-label { font-size:11px; color:#7a9485; margin-bottom:2px; }
    .sp-contact-value { font-size:14px; font-weight:700; color:#1c2b22; }
    .sp-hours { font-size:11px; color:#7a9485; text-align:center; padding:8px; }

    /* Complaint */
    .sp-complaint { padding:16px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; }
    .sp-complaint select, .sp-complaint textarea, .sp-complaint input {
      width:100%; padding:10px 14px;
      border:1.5px solid rgba(36,92,58,0.15); border-radius:10px;
      font-size:13px; font-family:inherit; outline:none;
      transition:border-color 0.2s; background:#fff; color:#1c2b22;
    }
    .sp-complaint select:focus, .sp-complaint textarea:focus, .sp-complaint input:focus {
      border-color:#245C3A;
    }
    .sp-complaint textarea { resize:vertical; min-height:80px; }
    .sp-complaint label { font-size:12px; font-weight:600; color:#4a6355; margin-bottom:4px; display:block; }
    .sp-submit {
      width:100%; padding:12px; border-radius:10px;
      background:linear-gradient(135deg,#245C3A,#4F7D3A);
      color:#fff; border:none; cursor:pointer;
      font-size:14px; font-weight:700; font-family:inherit;
      display:flex; align-items:center; justify-content:center; gap:8px;
      transition:all 0.2s;
    }
    .sp-submit:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(36,92,58,0.3); }
    .sp-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

    @media(max-width:480px) {
      .support-panel { width:calc(100vw - 32px); right:16px; bottom:80px; }
      .support-fab   { bottom:20px; right:16px; }
    }
  </style>

  <!-- FAB Button -->
  <button class="support-fab" id="support-fab" title="Customer Support">
    <i class="fa-solid fa-headset"></i>
    <span class="fab-badge" id="support-badge" style="display:none">!</span>
  </button>

  <!-- Support Panel -->
  <div class="support-panel" id="support-panel">
    <div class="sp-header">
      <div>
        <div class="sp-header-title"><i class="fa-solid fa-headset"></i> AgriSync Support</div>
        <div class="sp-header-sub">We're here to help · ${SUPPORT_HOURS}</div>
      </div>
      <button class="sp-close" id="sp-close"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="sp-tabs">
      <button class="sp-tab active" data-tab="chat"><i class="fa-solid fa-robot"></i> AI Chat</button>
      <button class="sp-tab" data-tab="contact"><i class="fa-solid fa-phone"></i> Contact</button>
      <button class="sp-tab" data-tab="complaint"><i class="fa-solid fa-flag"></i> Complaint</button>
    </div>

    <div class="sp-body">

      <!-- AI CHAT TAB -->
      <div class="sp-tab-content active" id="tab-chat">
        <div class="sp-chat-msgs" id="sp-chat-msgs">
          <div class="sp-msg bot">
            👋 Hi! I'm AgriSync AI Assistant. Ask me anything about crops, prices, orders, weather, or payments.
            <div class="sp-msg-time">Just now</div>
          </div>
          <div class="sp-msg bot">
            Quick questions: <br>
            • How to add a crop?<br>
            • How to find buyers?<br>
            • How to track my order?
            <div class="sp-msg-time">Just now</div>
          </div>
        </div>
        <div class="sp-chat-input">
          <input type="text" id="sp-chat-in" placeholder="Type your question..." />
          <button class="sp-send" id="sp-send"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>

      <!-- CONTACT TAB -->
      <div class="sp-tab-content" id="tab-contact">
        <div class="sp-contact">
          <a href="tel:18001234274" class="sp-contact-card">
            <div class="sp-contact-icon" style="background:rgba(36,92,58,0.10)">📞</div>
            <div>
              <div class="sp-contact-label">Toll-Free Helpline</div>
              <div class="sp-contact-value">1800-123-AGRI (2474)</div>
            </div>
          </a>
          <a href="https://wa.me/911800123AGRI" class="sp-contact-card">
            <div class="sp-contact-icon" style="background:rgba(37,211,102,0.12)">💬</div>
            <div>
              <div class="sp-contact-label">WhatsApp Support</div>
              <div class="sp-contact-value">+91 98765 43210</div>
            </div>
          </a>
          <a href="mailto:${SUPPORT_EMAIL}" class="sp-contact-card">
            <div class="sp-contact-icon" style="background:rgba(76,140,138,0.12)">✉️</div>
            <div>
              <div class="sp-contact-label">Email Support</div>
              <div class="sp-contact-value">${SUPPORT_EMAIL}</div>
            </div>
          </a>
          <div class="sp-hours">
            <i class="fa-solid fa-clock"></i> Support Hours: ${SUPPORT_HOURS}
          </div>
        </div>
      </div>

      <!-- COMPLAINT TAB -->
      <div class="sp-tab-content" id="tab-complaint">
        <div class="sp-complaint" id="sp-complaint-form">
          <div>
            <label>Complaint Type *</label>
            <select id="comp-type">
              <option value="">Select type...</option>
              <option>Payment Issue</option>
              <option>Order Problem</option>
              <option>Delivery Delay</option>
              <option>Wrong Crop Quality</option>
              <option>Price Dispute</option>
              <option>Account Issue</option>
              <option>App Bug / Technical</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label>Order ID (if applicable)</label>
            <input type="text" id="comp-order" placeholder="e.g. ORD-2025-001" />
          </div>
          <div>
            <label>Describe your issue *</label>
            <textarea id="comp-desc" placeholder="Please describe your issue in detail..."></textarea>
          </div>
          <button class="sp-submit" id="comp-submit">
            <i class="fa-solid fa-flag"></i> Submit Complaint
          </button>
        </div>
      </div>

    </div>
  </div>`;

  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
}

// ── INIT SUPPORT WIDGET ────────────────────────────────────
export function initSupportWidget(userProfile) {
  injectWidget();

  const fab   = document.getElementById('support-fab');
  const panel = document.getElementById('support-panel');
  const close = document.getElementById('sp-close');

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    document.getElementById('support-badge').style.display = 'none';
  });
  close.addEventListener('click', () => panel.classList.remove('open'));

  // Tabs
  document.querySelectorAll('.sp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sp-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // AI Chat
  const chatIn  = document.getElementById('sp-chat-in');
  const sendBtn = document.getElementById('sp-send');
  const msgs    = document.getElementById('sp-chat-msgs');

  function sendMessage() {
    const text = chatIn.value.trim();
    if (!text) return;
    appendMsg(text, 'user');
    chatIn.value = '';
    setTimeout(() => {
      appendMsg(getAIResponse(text), 'bot');
    }, 600);
  }

  function appendMsg(text, type) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `sp-msg ${type}`;
    div.innerHTML = `${text}<div class="sp-msg-time">${time}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  chatIn.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // Complaint submit
  document.getElementById('comp-submit').addEventListener('click', async () => {
    const type = document.getElementById('comp-type').value;
    const desc = document.getElementById('comp-desc').value.trim();
    if (!type || !desc) {
      alert('Please fill in complaint type and description.');
      return;
    }
    const btn = document.getElementById('comp-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    try {
      // Save to Firestore if available
      if (window.__agrisync_user) {
        const { addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const { db } = await import('./firebase.js');
        await addDoc(collection(db, 'complaints'), {
          userId:    window.__agrisync_user.uid,
          userName:  userProfile?.name || 'Unknown',
          userRole:  userProfile?.role || 'unknown',
          type,
          orderId:   document.getElementById('comp-order').value.trim(),
          description: desc,
          status:    'open',
          createdAt: serverTimestamp(),
        });
      }
      document.getElementById('sp-complaint-form').innerHTML = `
        <div style="text-align:center;padding:32px 16px">
          <div style="font-size:48px;margin-bottom:12px">✅</div>
          <div style="font-size:16px;font-weight:800;color:#245C3A;margin-bottom:8px">Complaint Submitted!</div>
          <div style="font-size:13px;color:#7a9485;line-height:1.6">
            Your complaint ID: <strong>#${Date.now().toString().slice(-6)}</strong><br>
            Our team will respond within 24 hours.<br>
            You can also call <strong>1800-123-AGRI</strong> for urgent issues.
          </div>
        </div>`;
    } catch {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-flag"></i> Submit Complaint';
      alert('Failed to submit. Please try again or call our helpline.');
    }
  });
}

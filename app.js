/**
 * GoMitra / LokalKirim - Simulator Operasional Multi-Peran
 * Engine Status Tanpa Database Sesuai Standar AGENTS.md
 */

// =========================================================================
// 1. AUDIO SYNTHESIZER (Web Audio API)
// =========================================================================
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playOrderBell() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playDriverPing() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [600, 900].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (i * 0.12));
        gain.gain.setValueAtTime(0.18, now + (i * 0.12));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.12) + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + (i * 0.12));
        osc.stop(now + (i * 0.12) + 0.25);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
        gain.gain.setValueAtTime(0.15, now + (idx * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + (idx * 0.08));
        osc.stop(now + (idx * 0.08) + 0.4);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
}

const sfx = new SoundFX();

// =========================================================================
// 2. DATA INISIAL MOCK
// =========================================================================
const INITIAL_DATA = {
  merchants: [
    {
      id: 'toko-berkah',
      name: 'Toko Berkah Kelontong',
      address: 'Jl. Mawar No. 12, Sektor 4',
      isOpen: true,
      pricingType: 'custom_flat',
      pricingRuleText: 'Skema Khusus: 0–10 km Flat Rp 5.000',
      products: [
        { id: 'p1', name: 'Beras Ramos Super (5 kg)', price: 69000, qty: 1 },
        { id: 'p2', name: 'Minyak Goreng 2 Liter', price: 35000, qty: 0 },
        { id: 'p3', name: 'Telur Ayam Negeri 1 kg', price: 28000, qty: 0 },
        { id: 'p4', name: 'Gula Pasir 1 kg', price: 17500, qty: 0 },
        { id: 'p5', name: 'Kopi Bubuk 10 Sachet', price: 13000, qty: 0 }
      ]
    },
    {
      id: 'geprek-juara',
      name: 'Ayam Geprek Sambal Bawang',
      address: 'Jl. Melati Ruko No. 5',
      isOpen: true,
      pricingType: 'regular_km',
      pricingRuleText: 'Skema Reguler: Min Rp 8.000, Rp 2.000/km',
      products: [
        { id: 'g1', name: 'Paket Ayam Geprek + Nasi', price: 19000, qty: 2 },
        { id: 'g2', name: 'Ayam Geprek Keju Mozzarella', price: 25000, qty: 0 },
        { id: 'g3', name: 'Es Teh Manis', price: 5000, qty: 1 },
        { id: 'g4', name: 'Tahu & Tempe Goreng', price: 8000, qty: 0 }
      ]
    },
    {
      id: 'apotek-sehat',
      name: 'Apotek Barokah Sehat',
      address: 'Jl. Pahlawan No. 88',
      isOpen: true,
      pricingType: 'regular_km',
      pricingRuleText: 'Skema Reguler: Min Rp 8.000, Rp 2.000/km',
      products: [
        { id: 'a1', name: 'Herbal Masuk Angin (Box 5 Sachet)', price: 21000, qty: 1 },
        { id: 'a2', name: 'Paracetamol 500mg (Strip)', price: 6500, qty: 0 },
        { id: 'a3', name: 'Vitamin C 1000mg', price: 38000, qty: 0 },
        { id: 'a4', name: 'Minyak Kayu Putih 60ml', price: 24500, qty: 0 }
      ]
    }
  ],
  pricingRules: {
    perKmFare: 2000,
    baseMinFare: 8000,
    flatMaxKm: 10,
    flatRate: 5000,
    platformFee: 1000
  },
  driver: {
    id: 'drv-01',
    name: 'Budi Santoso',
    vehicle: 'Honda Beat - B 4821 KLR',
    phone: '0812-8877-6655',
    isOnline: true,
    earnings: 0,
    cashHeld: 0
  },
  orders: [],
  activeOrderId: null,
  distanceKm: 3.5,
  currentMerchantId: 'toko-berkah'
};

// =========================================================================
// 3. PERSISTENSI & SINKRONISASI
// =========================================================================
let state = loadInitialState();
const channel = window.BroadcastChannel ? new BroadcastChannel('lokalkirim_pwa_sim') : null;

if (channel) {
  channel.onmessage = (event) => {
    if (event.data && event.data.type === 'STATE_UPDATE') {
      state = event.data.payload;
      renderAll(false);
    }
  };
}

window.addEventListener('storage', (event) => {
  if (event.key === 'lokalkirim_clean_state' && event.newValue) {
    try {
      state = JSON.parse(event.newValue);
      renderAll(false);
    } catch (e) {}
  }
});

function loadInitialState() {
  if (typeof window !== 'undefined' && window.loadSharedState) {
    return window.loadSharedState();
  }
  const saved = localStorage.getItem('lokalkirim_clean_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Gagal memuat state lokal:', e);
    }
  }
  return (typeof window !== 'undefined' && window.LOKALKIRIM_INITIAL_DATA)
    ? JSON.parse(JSON.stringify(window.LOKALKIRIM_INITIAL_DATA))
    : JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveState(broadcast = true, actionType = 'STATE_UPDATE') {
  if (typeof window !== 'undefined' && window.saveSharedState) {
    window.saveSharedState(state, broadcast, actionType);
    return;
  }
  localStorage.setItem('lokalkirim_clean_state', JSON.stringify(state));
  if (broadcast && channel) {
    channel.postMessage({ type: 'STATE_UPDATE', payload: state, action: actionType });
  }
}

function formatRp(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

function showToast(msg) {
  const toast = document.getElementById('toastBox');
  const text = document.getElementById('toastMessage');
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// =========================================================================
// 4. DYNAMIC PRICING ENGINE
// =========================================================================
function calculateDeliveryFee(merchantId, distanceKm) {
  const merchant = state.merchants.find(m => m.id === merchantId) || state.merchants[0];
  const rules = state.pricingRules;
  let ongkir = 0;
  let calculationNote = '';

  if (merchant.pricingType === 'custom_flat') {
    if (distanceKm <= rules.flatMaxKm) {
      ongkir = rules.flatRate;
      calculationNote = `Tarif Flat Mitra (0–${rules.flatMaxKm} km)`;
    } else {
      const extraKm = distanceKm - rules.flatMaxKm;
      ongkir = rules.flatRate + Math.round(extraKm * rules.perKmFare);
      calculationNote = `Flat Rp ${rules.flatRate.toLocaleString()} + (${extraKm.toFixed(1)} km × ${formatRp(rules.perKmFare)})`;
    }
  } else {
    const distanceCost = Math.round(distanceKm * rules.perKmFare);
    ongkir = Math.max(rules.baseMinFare, distanceCost);
    calculationNote = distanceCost > rules.baseMinFare 
      ? `${distanceKm} km × ${formatRp(rules.perKmFare)}/km`
      : `Tarif Dasar Minimum`;
  }

  const platformFee = Math.min(rules.platformFee, Math.round(ongkir * 0.3));
  const driverNetEarnings = ongkir - platformFee;

  return {
    ongkir,
    calculationNote,
    platformFee,
    driverNetEarnings
  };
}

// =========================================================================
// 5. RENDERING & KONTROL SISTEM
// =========================================================================

// --- 5.1 APLIKASI PELANGGAN ---
function renderCustomerApp() {
  const merchSelect = document.getElementById('custMerchantSelect');
  if (!merchSelect) return; // Panel 1 is now embedded with customer.html

  const currentMerch = state.merchants.find(m => m.id === state.currentMerchantId) || state.merchants[0];

  if (merchSelect.children.length === 0) {
    merchSelect.innerHTML = state.merchants.map(m => `
      <option value="${m.id}" ${m.id === currentMerch.id ? 'selected' : ''}>
        ${m.name}
      </option>
    `).join('');
    merchSelect.onchange = (e) => {
      state.currentMerchantId = e.target.value;
      saveState();
      renderAll();
    };
  } else {
    merchSelect.value = state.currentMerchantId;
  }

  const badgeEl = document.getElementById('custMerchantBadge');
  badgeEl.className = 'merchant-badge-info ' + (currentMerch.pricingType === 'custom_flat' ? 'flat' : 'regular');
  badgeEl.innerHTML = `
    <b>${currentMerch.name}</b> &mdash; ${currentMerch.pricingRuleText}
  `;

  const rangeInput = document.getElementById('custDistanceRange');
  const distanceVal = document.getElementById('custDistanceValue');
  rangeInput.value = state.distanceKm;
  distanceVal.textContent = `${state.distanceKm.toFixed(1)} km`;

  rangeInput.oninput = (e) => {
    state.distanceKm = parseFloat(e.target.value);
    distanceVal.textContent = `${state.distanceKm.toFixed(1)} km`;
    updateCustomerCartSummary();
  };

  const prodListEl = document.getElementById('custProductList');
  prodListEl.innerHTML = currentMerch.products.map(prod => `
    <div class="product-item">
      <div>
        <div class="product-name">${prod.name}</div>
        <div class="product-price">${formatRp(prod.price)}</div>
      </div>
      <div class="qty-control">
        <button class="btn-qty" onclick="changeProductQty('${currentMerch.id}', '${prod.id}', -1)">-</button>
        <span class="qty-val">${prod.qty}</span>
        <button class="btn-qty" onclick="changeProductQty('${currentMerch.id}', '${prod.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  updateCustomerCartSummary();
  renderCustomerActiveOrder();
}

window.changeProductQty = function(merchId, prodId, delta) {
  const merchant = state.merchants.find(m => m.id === merchId);
  if (!merchant) return;
  const prod = merchant.products.find(p => p.id === prodId);
  if (!prod) return;
  prod.qty = Math.max(0, prod.qty + delta);
  saveState();
  renderAll();
};

function updateCustomerCartSummary() {
  const subtotalEl = document.getElementById('custSubtotal');
  if (!subtotalEl) return;

  const currentMerch = state.merchants.find(m => m.id === state.currentMerchantId);
  const subtotal = currentMerch.products.reduce((acc, p) => acc + (p.price * p.qty), 0);
  const pricing = calculateDeliveryFee(currentMerch.id, state.distanceKm);

  subtotalEl.textContent = formatRp(subtotal);
  document.getElementById('custOngkir').textContent = formatRp(pricing.ongkir);
  document.getElementById('custOngkirCalcDesc').textContent = pricing.calculationNote;
  document.getElementById('custTotalBill').textContent = formatRp(subtotal + pricing.ongkir);
}

function renderCustomerActiveOrder() {
  const orderSection = document.getElementById('custActiveOrderSection');
  if (!orderSection) return;

  const activeOrder = state.orders.find(o => o.id === state.activeOrderId);
  const checkoutCard = document.getElementById('custCheckoutCard');

  if (!activeOrder || activeOrder.status === 'COMPLETED') {
    if (activeOrder && activeOrder.status === 'COMPLETED') {
      orderSection.classList.remove('hidden');
      document.getElementById('custTrackerId').textContent = '#' + activeOrder.id;
      document.getElementById('custStepper').innerHTML = renderStepperHtml(4);
      document.getElementById('custTrackerDesc').innerHTML = `<b>Pesanan Selesai</b> &mdash; Barang telah diserahkan dan transaksi tuntas.`;
      document.getElementById('custDriverCard').classList.remove('hidden');
      checkoutCard.classList.remove('hidden');
    } else {
      orderSection.classList.add('hidden');
      checkoutCard.classList.remove('hidden');
    }
    return;
  }

  orderSection.classList.remove('hidden');
  checkoutCard.classList.add('hidden');
  document.getElementById('custTrackerId').textContent = '#' + activeOrder.id;

  let stepIndex = 1;
  let descText = '';

  switch (activeOrder.status) {
    case 'PENDING':
      stepIndex = 1;
      descText = 'Menunggu konfirmasi penerimaan dari mitra usaha.';
      break;
    case 'PREPARING':
      stepIndex = 2;
      descText = 'Pesanan sedang disiapkan oleh mitra usaha.';
      break;
    case 'READY_FOR_PICKUP':
      stepIndex = 2;
      descText = 'Pesanan selesai disiapkan. Menunggu kurir mengambil barang.';
      break;
    case 'DRIVER_ACCEPTED':
      stepIndex = 3;
      descText = `Kurir ${state.driver.name} sedang menuju lokasi toko.`;
      break;
    case 'ON_THE_WAY':
      stepIndex = 3;
      descText = `Kurir ${state.driver.name} sedang dalam perjalanan menuju alamat Anda.`;
      break;
    case 'COMPLETED':
      stepIndex = 4;
      descText = 'Pesanan telah selesai diantar.';
      break;
  }

  document.getElementById('custStepper').innerHTML = renderStepperHtml(stepIndex);
  document.getElementById('custTrackerDesc').innerHTML = descText;

  const driverCard = document.getElementById('custDriverCard');
  if (['DRIVER_ACCEPTED', 'ON_THE_WAY', 'COMPLETED'].includes(activeOrder.status)) {
    driverCard.classList.remove('hidden');
    document.getElementById('custDriverName').textContent = state.driver.name;
    document.getElementById('custDriverPlate').textContent = state.driver.vehicle;
  } else {
    driverCard.classList.add('hidden');
  }
}

function renderStepperHtml(currentStep) {
  const steps = [
    { num: 1, label: 'Diterima' },
    { num: 2, label: 'Disiapkan' },
    { num: 3, label: 'Diantar' },
    { num: 4, label: 'Selesai' }
  ];

  const progressPercent = Math.min(100, Math.max(0, (currentStep - 1) / 3 * 100));

  return `
    <div class="stepper-line">
      <div class="stepper-progress" style="width: ${progressPercent}%;"></div>
    </div>
    ${steps.map(s => {
      let cls = '';
      if (s.num < currentStep) cls = 'completed';
      else if (s.num === currentStep) cls = 'active';
      return `<div class="step-node ${cls}">${s.num < currentStep ? '✓' : s.num}</div>`;
    }).join('')}
  `;
}

function customerPlaceOrder() {
  const currentMerch = state.merchants.find(m => m.id === state.currentMerchantId);
  const items = currentMerch.products.filter(p => p.qty > 0);

  if (items.length === 0) {
    showToast('Pilih minimal satu produk sebelum membuat pesanan.');
    return;
  }

  const subtotal = items.reduce((acc, p) => acc + (p.price * p.qty), 0);
  const pricing = calculateDeliveryFee(currentMerch.id, state.distanceKm);
  const payMethodInput = document.querySelector('input[name="custPayMethod"]:checked');
  const payMethod = payMethodInput ? payMethodInput.value : 'COD';

  const newOrder = {
    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    merchantId: currentMerch.id,
    merchantName: currentMerch.name,
    merchantAddress: currentMerch.address,
    customerAddress: 'Jl. Kenanga No. 42',
    distanceKm: state.distanceKm,
    items: JSON.parse(JSON.stringify(items)),
    subtotal: subtotal,
    deliveryFee: pricing.ongkir,
    driverNetEarnings: pricing.driverNetEarnings,
    platformFee: pricing.platformFee,
    totalBill: subtotal + pricing.ongkir,
    paymentMethod: payMethod,
    status: 'PENDING'
  };

  state.orders.unshift(newOrder);
  state.activeOrderId = newOrder.id;
  saveState();

  sfx.playOrderBell();
  showToast(`Pesanan #${newOrder.id} berhasil dikirim ke mitra toko.`);
  renderAll();
}

// --- 5.2 PORTAL MITRA USAHA ---
function renderMerchantApp() {
  const storeNameEl = document.getElementById('merchStoreName');
  if (!storeNameEl) return; // Embedded via merchant.html iframe

  const currentMerch = state.merchants.find(m => m.id === state.currentMerchantId) || state.merchants[0];
  storeNameEl.textContent = currentMerch.name;

  const ruleBadge = document.getElementById('merchStoreRuleBadge');
  ruleBadge.textContent = currentMerch.pricingType === 'custom_flat' ? 'Flat Rp 5.000' : 'Reguler/km';

  const storeOrders = state.orders.filter(o => o.merchantId === currentMerch.id);
  const completedStoreOrders = storeOrders.filter(o => o.status === 'COMPLETED');
  const revenue = completedStoreOrders.reduce((acc, o) => acc + o.subtotal, 0);

  document.getElementById('merchTodayOrders').textContent = storeOrders.length;
  document.getElementById('merchTodayRevenue').textContent = formatRp(revenue);

  const queueEl = document.getElementById('merchOrderQueue');
  const activeStoreOrders = storeOrders.filter(o => ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status));

  document.getElementById('merchQueueCount').textContent = `${activeStoreOrders.length} Pesanan`;

  if (activeStoreOrders.length === 0) {
    queueEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">Tidak Ada Pesanan Aktif</div>
        <div class="text-xs text-muted">Pesanan baru dari pelanggan akan masuk di panel ini secara real-time.</div>
      </div>
    `;
    return;
  }

  queueEl.innerHTML = activeStoreOrders.map(order => {
    let actionBtnHtml = '';
    let statusBadgeCls = 'status-pending';
    let statusText = 'Pesanan Baru';

    if (order.status === 'PENDING') {
      actionBtnHtml = `
        <button class="btn btn-primary btn-block btn-sm" onclick="merchantAcceptOrder('${order.id}')">
          Terima & Siapkan Pesanan
        </button>
      `;
    } else if (order.status === 'PREPARING') {
      statusBadgeCls = 'status-preparing';
      statusText = 'Sedang Disiapkan';
      actionBtnHtml = `
        <button class="btn btn-primary btn-block btn-sm" onclick="merchantRequestDriver('${order.id}')">
          Siap Diambil (Panggil Kurir)
        </button>
      `;
    } else if (order.status === 'READY_FOR_PICKUP') {
      statusBadgeCls = 'status-ready';
      statusText = 'Menunggu Kurir';
      actionBtnHtml = `
        <div class="text-xs text-muted">
          Panggilan penjemputan disiarkan ke kurir terdekat.
        </div>
      `;
    } else if (order.status === 'DRIVER_ACCEPTED') {
      statusBadgeCls = 'status-preparing';
      statusText = 'Kurir Menuju Toko';
      actionBtnHtml = `
        <div class="text-xs text-primary font-semibold">
          Kurir (${state.driver.name}) sedang menuju lokasi toko.
        </div>
      `;
    } else if (order.status === 'ON_THE_WAY') {
      statusBadgeCls = 'status-ready';
      statusText = 'Dalam Pengantaran';
      actionBtnHtml = `
        <div class="text-xs text-muted">
          Pesanan sedang dibawa kurir ke alamat pelanggan.
        </div>
      `;
    }

    return `
      <div class="merch-order-card">
        <div class="merch-order-top">
          <span class="font-bold text-sm font-mono">#${order.id}</span>
          <span class="badge-order-status ${statusBadgeCls}">${statusText}</span>
        </div>
        <div class="text-xs text-muted">Waktu: ${order.timestamp} &bull; Metode: ${order.paymentMethod}</div>

        <div class="border-top pt-1 pb-1">
          ${order.items.map(it => `
            <div class="order-item-row">
              <span>${it.qty}x ${it.name}</span>
              <span class="font-mono">${formatRp(it.price * it.qty)}</span>
            </div>
          `).join('')}
        </div>

        <div class="flex-between text-xs font-bold pt-1">
          <span>Subtotal Toko:</span>
          <span class="text-primary font-mono">${formatRp(order.subtotal)}</span>
        </div>

        <div class="mt-2">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.merchantAcceptOrder = function(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'PREPARING';
  saveState();
  showToast(`Pesanan #${orderId} diterima dan mulai diproses.`);
  renderAll();
};

window.merchantRequestDriver = function(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'READY_FOR_PICKUP';
  saveState();
  sfx.playDriverPing();
  showToast(`Penawaran penjemputan pesanan #${orderId} disiarkan ke kurir.`);
  renderAll();
};

// --- 5.3 APLIKASI MITRA KURIR ---
function renderDriverApp() {
  const onlineToggle = document.getElementById('driverOnlineToggle');
  if (!onlineToggle) return; // Embedded via driver.html iframe

  onlineToggle.checked = state.driver.isOnline;

  const banner = document.getElementById('driverStatusBanner');
  const bannerText = document.getElementById('driverStatusText');

  if (state.driver.isOnline) {
    banner.className = 'driver-status-banner online';
    bannerText.textContent = 'Status: Siap Menerima Pesanan (Online)';
  } else {
    banner.className = 'driver-status-banner offline';
    bannerText.textContent = 'Status: Tidak Aktif (Offline)';
  }

  document.getElementById('driverEarnings').textContent = formatRp(state.driver.earnings);
  document.getElementById('driverCashHeld').textContent = formatRp(state.driver.cashHeld);

  const offerBox = document.getElementById('driverOfferBox');
  const activeTripBox = document.getElementById('driverActiveTrip');
  const emptyState = document.getElementById('driverEmptyState');

  const myTrip = state.orders.find(o => ['DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status));

  if (myTrip) {
    offerBox.classList.add('hidden');
    emptyState.classList.add('hidden');
    activeTripBox.classList.remove('hidden');

    document.getElementById('driverTripOrderId').textContent = '#' + myTrip.id;
    document.getElementById('driverTripStoreName').textContent = myTrip.merchantName;
    document.getElementById('driverTripStoreAddress').textContent = myTrip.merchantAddress;
    document.getElementById('driverTripCustomerName').textContent = myTrip.customerAddress;
    document.getElementById('driverTripPaymentType').textContent = `Tagihan ${myTrip.paymentMethod}: ${formatRp(myTrip.totalBill)}`;

    const nextBtn = document.getElementById('btnDriverNextStep');

    if (myTrip.status === 'DRIVER_ACCEPTED') {
      document.getElementById('driverTripStatusBadge').textContent = 'Fase 1: Menuju Toko';
      nextBtn.textContent = 'Konfirmasi Pengambilan Barang';
      nextBtn.className = 'btn btn-primary btn-block btn-lg';
      nextBtn.onclick = () => driverPickupCargo(myTrip.id);
    } else if (myTrip.status === 'ON_THE_WAY') {
      document.getElementById('driverTripStatusBadge').textContent = 'Fase 2: Menuju Pelanggan';
      nextBtn.textContent = 'Konfirmasi Selesai Pengantaran';
      nextBtn.className = 'btn btn-primary btn-block btn-lg';
      nextBtn.onclick = () => driverCompleteTrip(myTrip.id);
    }
    return;
  }

  activeTripBox.classList.add('hidden');

  const broadcastOrder = state.driver.isOnline ? state.orders.find(o => o.status === 'READY_FOR_PICKUP') : null;

  if (broadcastOrder) {
    offerBox.classList.remove('hidden');
    emptyState.classList.add('hidden');

    document.getElementById('driverOfferShop').textContent = broadcastOrder.merchantName;
    document.getElementById('driverOfferPickup').textContent = 'Jemput: ' + broadcastOrder.merchantAddress;
    document.getElementById('driverOfferDropoff').textContent = `Antar: ${broadcastOrder.customerAddress} (${broadcastOrder.distanceKm} km)`;
    document.getElementById('driverOfferNetEarn').textContent = formatRp(broadcastOrder.driverNetEarnings);

    document.getElementById('btnAcceptOrder').onclick = () => driverAcceptOffer(broadcastOrder.id);
    document.getElementById('btnRejectOrder').onclick = () => {
      showToast('Penawaran pesanan dilewati.');
      offerBox.classList.add('hidden');
    };
  } else {
    offerBox.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }
}

function driverAcceptOffer(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'DRIVER_ACCEPTED';
  order.driverId = state.driver.id;
  saveState();
  sfx.playSuccess();
  showToast(`Pesanan #${orderId} diterima. Menuju ke lokasi penjemputan.`);
  renderAll();
}

function driverPickupCargo(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'ON_THE_WAY';
  saveState();
  showToast(`Barang pesanan telah diambil. Menuju alamat pengantaran.`);
  renderAll();
}

function driverCompleteTrip(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'COMPLETED';

  state.driver.earnings += order.driverNetEarnings;
  if (order.paymentMethod === 'COD') {
    state.driver.cashHeld += order.totalBill;
  }

  saveState();
  sfx.playSuccess();
  showToast(`Pengantaran selesai. Pendapatan kurir bertambah ${formatRp(order.driverNetEarnings)}.`);
  renderAll();
}

// --- 5.4 PANEL PENGAWAS OPERASIONAL (ADMIN) ---
function renderAdminApp() {
  const totalOrdersEl = document.getElementById('adminKpiTotalOrders');
  if (!totalOrdersEl) return; // Embedded via admin.html iframe

  const totalOrders = state.orders.length;
  const completedOrders = state.orders.filter(o => o.status === 'COMPLETED');
  const gmv = completedOrders.reduce((acc, o) => acc + o.totalBill, 0);
  const platformRevenue = completedOrders.reduce((acc, o) => acc + o.platformFee, 0);

  totalOrdersEl.textContent = totalOrders;
  document.getElementById('adminKpiGmv').textContent = formatRp(gmv);
  document.getElementById('adminKpiPlatformFee').textContent = formatRp(platformRevenue);

  document.getElementById('cfgPerKmFare').value = state.pricingRules.perKmFare;
  document.getElementById('cfgBaseMinFare').value = state.pricingRules.baseMinFare;
  document.getElementById('cfgFlatMaxKm').value = state.pricingRules.flatMaxKm;
  document.getElementById('cfgFlatRate').value = state.pricingRules.flatRate;
  document.getElementById('cfgPlatformFee').value = state.pricingRules.platformFee;

  const streamEl = document.getElementById('adminStreamList');
  const activeOrders = state.orders.filter(o => o.status !== 'COMPLETED');
  document.getElementById('adminStreamCount').textContent = `${activeOrders.length} Berjalan`;

  if (state.orders.length === 0) {
    streamEl.innerHTML = `<div class="empty-state text-xs">Belum ada aktivitas transaksi.</div>`;
    return;
  }

  streamEl.innerHTML = state.orders.slice(0, 8).map(o => {
    let badgeColor = '#64748B';
    if (o.status === 'PENDING') badgeColor = '#B45309';
    if (o.status === 'PREPARING') badgeColor = '#1D4ED8';
    if (o.status === 'READY_FOR_PICKUP') badgeColor = '#C2410C';
    if (o.status === 'ON_THE_WAY') badgeColor = '#4F46E5';
    if (o.status === 'COMPLETED') badgeColor = '#15803D';

    return `
      <div class="stream-card">
        <div>
          <span class="stream-id">#${o.id}</span>
          <span class="text-xs text-muted">(${o.merchantName})</span>
          <div class="text-xs text-muted">Total: ${formatRp(o.totalBill)} &bull; Ongkir: ${formatRp(o.deliveryFee)}</div>
        </div>
        <div class="text-right">
          <span class="badge-mini" style="background:${badgeColor}18; color:${badgeColor}; font-weight:600;">
            ${o.status}
          </span>
          <div class="text-xs text-muted font-mono mt-1">Kas Platform: ${formatRp(o.platformFee)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function updatePricingRulesFromAdmin() {
  state.pricingRules.perKmFare = parseInt(document.getElementById('cfgPerKmFare').value) || 2000;
  state.pricingRules.baseMinFare = parseInt(document.getElementById('cfgBaseMinFare').value) || 8000;
  state.pricingRules.flatMaxKm = parseInt(document.getElementById('cfgFlatMaxKm').value) || 10;
  state.pricingRules.flatRate = parseInt(document.getElementById('cfgFlatRate').value) || 5000;
  state.pricingRules.platformFee = parseInt(document.getElementById('cfgPlatformFee').value) || 1000;

  const berkah = state.merchants.find(m => m.id === 'toko-berkah');
  if (berkah) {
    berkah.pricingRuleText = `Skema Khusus: 0–${state.pricingRules.flatMaxKm} km Flat ${formatRp(state.pricingRules.flatRate)}`;
  }

  saveState();
  showToast('Konfigurasi aturan harga berhasil diperbarui.');
  renderAll();
}

// =========================================================================
// 6. SIMULASI ALUR PENUH (WALKTHROUGH)
// =========================================================================
let demoRunning = false;
async function runAutomatedDemoWalkthrough() {
  if (demoRunning) return;
  demoRunning = true;
  const demoBtn = document.getElementById('btnQuickDemo');
  demoBtn.textContent = 'Menjalankan Simulasi...';
  demoBtn.disabled = true;

  try {
    showToast('Fase 1: Pelanggan memilih barang dan membuat pesanan...');
    state = loadInitialState();
    state.currentMerchantId = 'toko-berkah';
    state.distanceKm = 3.5;
    saveState();

    await sleep(1000);
    const iframe = document.getElementById('customerIframe');
    if (iframe && iframe.contentWindow && iframe.contentWindow.triggerDemoCustomerOrder) {
      iframe.contentWindow.triggerDemoCustomerOrder();
    } else {
      customerPlaceOrder();
    }

    await sleep(2400);
    state = loadInitialState();
    let currentOrder = state.orders[0];
    if (!currentOrder && state.activeOrderId) {
      currentOrder = state.orders.find(o => o.id === state.activeOrderId);
    }

    if (currentOrder) {
      showToast(`Fase 2: Mitra Toko menerima & menyiapkan pesanan #${currentOrder.id}...`);
      const merchIframe = document.getElementById('merchantIframe');
      if (merchIframe && merchIframe.contentWindow && merchIframe.contentWindow.acceptOrder) {
        merchIframe.contentWindow.acceptOrder(currentOrder.id);
      } else {
        merchantAcceptOrder(currentOrder.id);
      }
    }

    await sleep(2400);
    state = loadInitialState();
    if (currentOrder) {
      showToast(`Fase 3: Toko selesai mengemas pesanan #${currentOrder.id}. Memanggil kurir penjemput...`);
      const merchIframe = document.getElementById('merchantIframe');
      if (merchIframe && merchIframe.contentWindow && merchIframe.contentWindow.requestDriverPickup) {
        merchIframe.contentWindow.requestDriverPickup(currentOrder.id);
      } else {
        merchantRequestDriver(currentOrder.id);
      }
    }

    await sleep(2200);
    state = loadInitialState();
    if (currentOrder) {
      showToast(`Fase 4: Kurir menerima penugasan penjemputan pesanan #${currentOrder.id}...`);
      const driverIframe = document.getElementById('driverIframe');
      if (driverIframe && driverIframe.contentWindow && driverIframe.contentWindow.driverAcceptOffer) {
        driverIframe.contentWindow.driverAcceptOffer(currentOrder.id);
      } else {
        driverAcceptOffer(currentOrder.id);
      }
    }

    await sleep(2400);
    state = loadInitialState();
    if (currentOrder) {
      showToast(`Fase 5: Kurir tiba di toko, konfirmasi muatan barang & mulai pengantaran...`);
      const driverIframe = document.getElementById('driverIframe');
      if (driverIframe && driverIframe.contentWindow && driverIframe.contentWindow.driverPickupCargo) {
        driverIframe.contentWindow.driverPickupCargo(currentOrder.id);
      } else {
        driverPickupCargo(currentOrder.id);
      }
    }

    await sleep(2600);
    state = loadInitialState();
    if (currentOrder) {
      showToast(`Fase 6: Kurir tiba di alamat pelanggan, serah terima & tagih kas COD...`);
      const driverIframe = document.getElementById('driverIframe');
      if (driverIframe && driverIframe.contentWindow && driverIframe.contentWindow.driverCompleteTrip) {
        driverIframe.contentWindow.driverCompleteTrip(currentOrder.id);
      } else {
        driverCompleteTrip(currentOrder.id);
      }
    }

    await sleep(1200);
    showToast('Siklus transaksi berhasil tuntas 100% di semua peran (Pelanggan, Toko, Kurir, Admin).');
  } finally {
    demoRunning = false;
    demoBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      Simulasi Alur Penuh
    `;
    demoBtn.disabled = false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =========================================================================
// 7. INISIALISASI EVENT
// =========================================================================
function renderAll(save = false) {
  renderCustomerApp();
  renderMerchantApp();
  renderDriverApp();
  renderAdminApp();
  if (save) saveState();
}

document.addEventListener('DOMContentLoaded', () => {
  const viewBtns = document.querySelectorAll('.view-btn');
  const stage = document.getElementById('simulatorStage');

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewMode = btn.dataset.view;
      stage.className = `simulator-stage view-${viewMode}`;
    });
  });

  const btnAudio = document.getElementById('btnAudioToggle');
  const audioLabel = document.getElementById('audioLabel');
  btnAudio.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    if (sfx.enabled) {
      sfx.init();
      audioLabel.textContent = 'Audio Aktif';
      showToast('Audio notifikasi diaktifkan.');
    } else {
      audioLabel.textContent = 'Audio Nonaktif';
      showToast('Audio notifikasi dinonaktifkan.');
    }
  });

  const btnPlaceOrder = document.getElementById('btnPlaceOrder');
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener('click', customerPlaceOrder);
  }

  const driverToggle = document.getElementById('driverOnlineToggle');
  if (driverToggle) {
    driverToggle.addEventListener('change', (e) => {
      state.driver.isOnline = e.target.checked;
      saveState();
      renderDriverApp();
      showToast(state.driver.isOnline ? 'Status kurir: Aktif (Online).' : 'Status kurir: Tidak Aktif (Offline).');
    });
  }

  const btnUpdatePricing = document.getElementById('btnUpdatePricing');
  if (btnUpdatePricing) {
    btnUpdatePricing.addEventListener('click', updatePricingRulesFromAdmin);
  }

  const btnQuickDemo = document.getElementById('btnQuickDemo');
  if (btnQuickDemo) {
    btnQuickDemo.addEventListener('click', runAutomatedDemoWalkthrough);
  }

  const modalReset = document.getElementById('modalResetDialog');
  const btnOpenReset = document.getElementById('btnResetData');
  const btnCloseReset = document.getElementById('btnCloseResetModal');
  const btnCancelReset = document.getElementById('btnCancelResetModal');

  if (btnOpenReset && modalReset) {
    btnOpenReset.addEventListener('click', (e) => {
      e.preventDefault();
      modalReset.classList.remove('hidden');
    });
  }

  const hideResetModal = () => {
    if (modalReset) modalReset.classList.add('hidden');
  };

  if (btnCloseReset) btnCloseReset.addEventListener('click', hideResetModal);
  if (btnCancelReset) btnCancelReset.addEventListener('click', hideResetModal);

  // Close when clicking outside modal-card (backdrop)
  if (modalReset) {
    modalReset.addEventListener('click', (e) => {
      if (e.target === modalReset) hideResetModal();
    });
  }

  // Reload all 4 role iframes so state updates immediately render without stale cache
  function reloadSimulatorIframes() {
    const iframes = ['customerIframe', 'merchantIframe', 'driverIframe', 'adminIframe'];
    iframes.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.contentWindow) {
        try {
          el.contentWindow.location.reload();
        } catch (e) {
          el.src = el.src;
        }
      }
    });
  }

  // Opsi 1: Reset Transaksi Saja (Langsung eksekusi tanpa confirm popup yang memblokir)
  const btnDoResetTx = document.getElementById('btnDoResetTransactions');
  if (btnDoResetTx) {
    btnDoResetTx.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.resetTransactionsOnly) {
        state = window.resetTransactionsOnly();
      } else {
        state.orders = [];
        state.activeOrderId = null;
        if (state.driver) { state.driver.earnings = 0; state.driver.cashHeld = 0; }
        saveState(true, 'RESET_TRANSACTIONS');
      }
      hideResetModal();
      showToast('Data transaksi dan antrean pesanan berhasil dikosongkan.');
      reloadSimulatorIframes();
      renderAll();
    });
  }

  // Opsi 2: Reset Total (Standar Pabrik - Langsung eksekusi dari tombol modal)
  const btnDoResetAll = document.getElementById('btnDoResetAll');
  if (btnDoResetAll) {
    btnDoResetAll.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.resetAllDataToDefault) {
        state = window.resetAllDataToDefault();
      } else {
        localStorage.removeItem('lokalkirim_clean_state');
        state = JSON.parse(JSON.stringify(INITIAL_DATA));
        saveState(true, 'RESET_ALL');
      }
      hideResetModal();
      showToast('Seluruh ekosistem berhasil dipulihkan ke standar pabrik.');
      reloadSimulatorIframes();
      renderAll();
    });
  }

  // Opsi Sub-Reset
  const btnSubProds = document.getElementById('btnSubResetProducts');
  if (btnSubProds) {
    btnSubProds.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.resetMerchantProductsToDefault) {
        state = window.resetMerchantProductsToDefault('toko-berkah');
      }
      showToast('Katalog produk toko berhasil dipulihkan ke default.');
      hideResetModal();
      reloadSimulatorIframes();
    });
  }

  const btnSubMerch = document.getElementById('btnSubResetMerchants');
  if (btnSubMerch) {
    btnSubMerch.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.resetMerchantsOnlyToDefault) {
        state = window.resetMerchantsOnlyToDefault();
      }
      showToast('Daftar mitra toko berhasil dipulihkan ke default.');
      hideResetModal();
      reloadSimulatorIframes();
    });
  }

  const btnSubDrv = document.getElementById('btnSubResetDrivers');
  if (btnSubDrv) {
    btnSubDrv.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.resetDriversOnlyToDefault) {
        state = window.resetDriversOnlyToDefault();
      }
      showToast('Armada mitra kurir berhasil dipulihkan ke default.');
      hideResetModal();
      reloadSimulatorIframes();
    });
  }

  renderAll();

  // Storage listener for cross-iframe sync
  window.addEventListener('storage', (event) => {
    if (event.key === 'lokalkirim_clean_state' && event.newValue) {
      try {
        state = JSON.parse(event.newValue);
        renderAll(false);
      } catch (e) {}
    }
  });
});

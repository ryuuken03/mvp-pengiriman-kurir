/**
 * GoMitra / LokalKirim - Aplikasi Mitra Kurir (driver.js)
 * Fitur: Penawaran Order Siap Diambil, Detail Transaksi Lengkap, Fase Trip & Kas Tunai COD
 * Sesuai Standar AGENTS.md
 */

// =========================================================================
// 1. SOUND FX SYNTHESIZER
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
        gain.gain.setValueAtTime(0.2, now + (i * 0.12));
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
        gain.gain.setValueAtTime(0.18, now + (idx * 0.08));
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
// 2. STATE PERSISTENCE & CROSS-ROLE SYNC
// =========================================================================
const DEFAULT_DRIVER_PROFILE = {
  id: 'drv-01',
  name: 'Budi Santoso',
  phone: '0812-8877-6655',
  vehicle: 'Honda Beat ESP (Hitam)',
  plateNumber: 'B 4821 KLR',
  isOnline: true,
  earnings: 0,
  cashHeld: 0
};

let coreState = loadCoreState();
let ignoredOfferId = null;
let lastKnownReadyOrderCount = 0;

const channel = window.BroadcastChannel ? new BroadcastChannel('lokalkirim_pwa_sim') : null;

function loadCoreState() {
  if (typeof window !== 'undefined' && window.loadSharedState) {
    return window.loadSharedState();
  }
  const saved = localStorage.getItem('lokalkirim_clean_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.driver) {
        parsed.driver = JSON.parse(JSON.stringify(DEFAULT_DRIVER_PROFILE));
      }
      return parsed;
    } catch (e) {
      console.warn('Gagal parsing local state:', e);
    }
  }
  return {
    merchants: [],
    orders: [],
    pricingRules: { perKmFare: 2000, baseMinFare: 8000, flatMaxKm: 10, flatRate: 5000, platformFee: 1000 },
    driver: JSON.parse(JSON.stringify(DEFAULT_DRIVER_PROFILE)),
    activeOrderId: null
  };
}

function saveCoreState(broadcast = true, actionType = 'STATE_UPDATE') {
  if (typeof window !== 'undefined' && window.saveSharedState) {
    window.saveSharedState(coreState, broadcast, actionType);
    return;
  }
  localStorage.setItem('lokalkirim_clean_state', JSON.stringify(coreState));
  if (broadcast && channel) {
    channel.postMessage({ type: 'STATE_UPDATE', payload: coreState, action: actionType });
  }
}

function formatRp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function showToast(msg) {
  const toast = document.getElementById('driverToastBox');
  const text = document.getElementById('driverToastMessage');
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// =========================================================================
// 3. RENDER DRIVER INTERFACE & DATA TRANSAKSI
// =========================================================================
function renderDriverViews() {
  const driver = coreState.driver || DEFAULT_DRIVER_PROFILE;
  const isOnline = driver.isOnline !== false;

  // 1. Update Header & Online Switch
  const toggleBtn = document.getElementById('btnToggleDriverOnline');
  const toggleLabel = document.getElementById('driverOnlineStatusLabel');
  const banner = document.getElementById('driverStatusBanner');
  const bannerText = document.getElementById('driverStatusBannerText');

  if (isOnline) {
    toggleBtn.className = 'status-toggle-btn online';
    toggleLabel.textContent = 'Online (Siap)';
    banner.className = 'driver-status-banner online';
    bannerText.textContent = 'Status: Siap Menerima Pesanan Penjemputan (Online)';
  } else {
    toggleBtn.className = 'status-toggle-btn offline';
    toggleLabel.textContent = 'Offline (Istirahat)';
    banner.className = 'driver-status-banner offline';
    bannerText.textContent = 'Status: Tidak Aktif (Offline - Penawaran Ditangguhkan)';
  }

  // 2. Update KPI Wallet Metrics
  const completedTrips = (coreState.orders || []).filter(o => o.status === 'COMPLETED');
  document.getElementById('kpiDriverEarnings').textContent = formatRp(driver.earnings);
  document.getElementById('kpiDriverCashHeld').textContent = formatRp(driver.cashHeld);
  document.getElementById('kpiDriverCompletedTrips').textContent = completedTrips.length;

  document.getElementById('walletTotalEarned').textContent = formatRp(driver.earnings);
  document.getElementById('walletTotalCashCOD').textContent = formatRp(driver.cashHeld);
  document.getElementById('walletTotalTrips').textContent = completedTrips.length;

  // 3. Check for Active Ongoing Trip
  const myActiveTrip = (coreState.orders || []).find(o =>
    ['DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status)
  );

  const offerBox = document.getElementById('driverOfferBox');
  const activeTripBox = document.getElementById('driverActiveTripBox');
  const emptyState = document.getElementById('driverEmptyState');
  const badgeOffers = document.getElementById('tabBadgeOffers');

  // Check for New Pickup Offer ('READY_FOR_PICKUP') from Merchant
  const readyPickupOrder = isOnline
    ? (coreState.orders || []).find(o => o.status === 'READY_FOR_PICKUP' && o.id !== ignoredOfferId)
    : null;

  if (myActiveTrip) {
    // Kurir sedang aktif menjalankan order
    if (offerBox) offerBox.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (activeTripBox) activeTripBox.classList.remove('hidden');
    if (badgeOffers) badgeOffers.classList.add('hidden');

    renderActiveTripCard(myActiveTrip);
  } else if (readyPickupOrder) {
    // Ada penawaran order siap dijemput
    if (activeTripBox) activeTripBox.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (offerBox) offerBox.classList.remove('hidden');
    if (badgeOffers) {
      badgeOffers.classList.remove('hidden');
      badgeOffers.textContent = '1';
    }

    renderOfferCard(readyPickupOrder);
  } else {
    // Tidak ada active trip & tidak ada penawaran langsung
    if (offerBox) offerBox.classList.add('hidden');
    if (activeTripBox) activeTripBox.classList.add('hidden');
    if (badgeOffers) badgeOffers.classList.add('hidden');

    const hasAnyOrders = (coreState.orders || []).length > 0;
    if (emptyState) {
      if (hasAnyOrders) {
        emptyState.classList.add('hidden');
      } else {
        emptyState.classList.remove('hidden');
      }
    }
  }

  // Render Daftar Seluruh Transaksi & Status Pesanan (STATUS APAPUN TETAP TAMPIL)
  renderDriverOrdersList(coreState.orders || []);
  renderCompletedHistory(completedTrips);
}

// State filter untuk tab kurir
let driverOrderFilter = 'ALL';

function renderDriverOrdersList(allOrders) {
  const container = document.getElementById('driverOrdersList');
  if (!container) return;

  const activeOrders = allOrders.filter(o => 
    ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status)
  );
  const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');

  // Update counters
  const countAll = document.getElementById('driverCountAll');
  if (countAll) countAll.textContent = allOrders.length;
  const countActive = document.getElementById('driverCountActive');
  if (countActive) countActive.textContent = activeOrders.length;
  const countCompleted = document.getElementById('driverCountCompleted');
  if (countCompleted) countCompleted.textContent = completedOrders.length;

  let displayOrders = allOrders;
  if (driverOrderFilter === 'ACTIVE') {
    displayOrders = activeOrders;
  } else if (driverOrderFilter === 'COMPLETED') {
    displayOrders = completedOrders;
  }

  // Urutan pesanan terbaru di atas
  displayOrders = [...displayOrders].reverse();

  if (displayOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <div class="empty-title" style="font-size: 0.85rem;">${driverOrderFilter === 'ALL' ? 'Belum Ada Transaksi Pesanan' : 'Tidak Ada Pesanan pada Kategori Ini'}</div>
        <div class="text-xs text-muted">Seluruh transaksi dari pelanggan dan toko akan terpantau statusnya di sini.</div>
      </div>
    `;
    return;
  }

  const hasOngoingTrip = allOrders.some(o => ['DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status));

  container.innerHTML = displayOrders.map(order => {
    let badgeClass = 'badge-pending';
    let statusText = 'Pesanan Dibuat';
    let statusNote = '';
    let actionBtnHtml = '';

    const storeName = order.merchantName || order.storeName || 'Toko Berkah Kelontong';
    const storeAddr = order.merchantAddress || order.storeAddress || 'Jl. Mawar No. 12, Sektor 4';
    const custName = order.customerName || 'Pelanggan';
    const custAddr = order.customerAddress || 'Alamat Antar';
    const distanceKm = order.distanceKm || 3.5;
    const netEarn = order.driverNetEarnings || order.driverShare || (order.deliveryFee ? order.deliveryFee - 1000 : 4000);
    const isCOD = (order.paymentMethod || 'COD') === 'COD';
    const totalBill = order.totalBill || order.totalAmount || (order.subtotal + (order.shippingFee || 5000));

    if (order.status === 'PENDING') {
      badgeClass = 'badge-pending';
      statusText = 'Menunggu Konfirmasi Toko';
      statusNote = 'Pelanggan telah membuat pesanan, menunggu konfirmasi toko.';
    } else if (order.status === 'PREPARING') {
      badgeClass = 'badge-preparing';
      statusText = 'Sedang Disiapkan Toko';
      statusNote = 'Toko sedang mengemas barang belanjaan. Segera siap dijemput kurir.';
    } else if (order.status === 'READY_FOR_PICKUP') {
      badgeClass = 'badge-ready';
      statusText = 'Siap Dijemput';
      if (!hasOngoingTrip && coreState.driver?.isOnline !== false) {
        actionBtnHtml = `
          <button type="button" class="btn btn-primary btn-sm btn-block mt-2" onclick="driverAcceptOffer('${order.id}')">
            Terima & Jalankan Penjemputan
          </button>
        `;
      } else if (hasOngoingTrip) {
        statusNote = 'Selesaikan pengantaran aktif saat ini terlebih dahulu.';
      } else {
        statusNote = 'Aktifkan status Online untuk menerima penjemputan ini.';
      }
    } else if (order.status === 'DRIVER_ACCEPTED') {
      badgeClass = 'badge-preparing';
      statusText = 'Kurir Menuju Toko';
      statusNote = 'Penugasan aktif Anda. Segera menuju toko untuk penjemputan muatan barang.';
    } else if (order.status === 'ON_THE_WAY') {
      badgeClass = 'badge-otw';
      statusText = 'Dalam Pengantaran';
      statusNote = 'Barang telah diambil kurir, sedang meluncur ke alamat penerima.';
    } else if (order.status === 'COMPLETED') {
      badgeClass = 'badge-completed';
      statusText = 'Pesanan Selesai';
      statusNote = `Pengantaran sukses tuntas. Pendapatan bersih +${formatRp(netEarn)} telah masuk buku kas.`;
    } else if (order.status === 'CANCELLED') {
      badgeClass = 'badge-cancelled';
      statusText = 'Dibatalkan';
      statusNote = 'Pesanan ini telah dibatalkan.';
    }

    return `
      <div class="driver-order-card ${order.status === 'READY_FOR_PICKUP' ? 'ready-card' : ''}">
        <div class="driver-order-card-header">
          <div>
            <span class="font-mono font-bold text-sm">#${order.id}</span>
            <span class="text-xs text-muted ml-2">${order.timestamp || ''}</span>
          </div>
          <span class="status-badge ${badgeClass}">${statusText}</span>
        </div>

        <div class="driver-route-snippet">
          <div class="route-line-snippet">
            <span class="route-point-label">Jemput:</span>
            <span class="font-semibold">${storeName}</span> &bull; <span class="text-muted text-xs">${storeAddr}</span>
          </div>
          <div class="route-line-snippet mt-1">
            <span class="route-point-label">Antar:</span>
            <span class="font-semibold">${custName}</span> &bull; <span class="text-muted text-xs">${custAddr} (${distanceKm} km)</span>
          </div>
        </div>

        <div class="driver-order-financial-strip">
          <span class="text-xs text-muted">
            Bayar: <b>${isCOD ? `COD (${formatRp(totalBill)})` : 'Non-Tunai / QRIS'}</b>
          </span>
          <div class="text-right">
            <span class="text-xs text-muted">Hak Kurir:</span>
            <span class="font-mono font-bold ml-1" style="color: #15803D;">+${formatRp(netEarn)}</span>
          </div>
        </div>

        ${statusNote ? `<div class="text-xs text-muted mt-1">${statusNote}</div>` : ''}
        ${actionBtnHtml}
      </div>
    `;
  }).join('');
}

// Render Offer Card with complete transaction data
function renderOfferCard(order) {
  const orderIdEl = document.getElementById('offerOrderId');
  if (orderIdEl) orderIdEl.textContent = '#' + order.id;

  const storeName = order.merchantName || order.storeName || 'Toko Berkah Kelontong';
  const storeAddr = order.merchantAddress || order.storeAddress || 'Jl. Mawar No. 12, Sektor 4';

  // Toko Data (Aman jika elemen tidak ada di DOM)
  const shopNameEl = document.getElementById('offerShopName');
  if (shopNameEl) shopNameEl.textContent = storeName;
  const shopAddrEl = document.getElementById('offerShopAddr');
  if (shopAddrEl) shopAddrEl.textContent = storeAddr;

  const pickupNameEl = document.getElementById('offerPickupName');
  if (pickupNameEl) pickupNameEl.textContent = storeName;
  const pickupAddrEl = document.getElementById('offerPickupAddr');
  if (pickupAddrEl) pickupAddrEl.textContent = storeAddr;

  // Customer Data
  const custNameEl = document.getElementById('offerCustomerName');
  if (custNameEl) custNameEl.textContent = `${order.customerName || 'Pelanggan'} (${order.customerPhone || '-'})`;
  const custAddrEl = document.getElementById('offerCustomerAddr');
  if (custAddrEl) custAddrEl.textContent = `${order.customerAddress || 'Alamat Antar'} (${order.distanceKm || 3.5} km)`;

  // Cargo List
  const cargoContainer = document.getElementById('offerCargoList');
  if (cargoContainer) {
    if (order.items && order.items.length > 0) {
      cargoContainer.innerHTML = order.items.map(it => {
        const itName = it.product ? it.product.name : (it.name || 'Barang');
        const itPrice = it.product ? it.product.price : (it.price || 0);
        return `
          <div class="cargo-item-row">
            <span><b>${it.qty}x</b> ${itName}</span>
            <span class="font-mono text-muted">${formatRp(itPrice * it.qty)}</span>
          </div>
        `;
      }).join('');
    } else {
      cargoContainer.innerHTML = '<div class="text-muted text-xs">1 Paket Belanja Mitra Usaha</div>';
    }
  }

  // Financial Data
  const payBox = document.getElementById('offerPaymentBadgeBox');
  const payMethodText = document.getElementById('offerPaymentMethod');
  const isCOD = (order.paymentMethod || 'COD') === 'COD';
  const totalBill = order.totalBill || order.totalAmount || (order.subtotal + (order.shippingFee || 5000));

  if (payBox && payMethodText) {
    if (isCOD) {
      payBox.className = 'payment-type-card cod';
      payMethodText.textContent = `COD: ${formatRp(totalBill)} (Kurir Tagih Tunai)`;
    } else {
      payBox.className = 'payment-type-card qris';
      payMethodText.textContent = 'Non-Tunai / QRIS (Lunas)';
    }
  }

  const netEarn = order.driverNetEarnings || order.driverShare || (order.deliveryFee ? order.deliveryFee - 1000 : (order.shippingFee ? order.shippingFee - 1000 : 4000));
  const netEarnEl = document.getElementById('offerNetEarnings');
  if (netEarnEl) netEarnEl.textContent = formatRp(netEarn);

  // Action Buttons (Terima & Jalankan, Lewati)
  const btnAccept = document.getElementById('btnAcceptOffer');
  if (btnAccept) {
    btnAccept.onclick = (e) => {
      e.preventDefault();
      driverAcceptOffer(order.id);
    };
  }

  const btnReject = document.getElementById('btnRejectOffer');
  if (btnReject) {
    btnReject.onclick = (e) => {
      e.preventDefault();
      ignoredOfferId = order.id;
      showToast('Penawaran pesanan #' + order.id + ' dilewati.');
      renderDriverViews();
    };
  }
}

// Render Active Trip Card
function renderActiveTripCard(trip) {
  const tripOrderIdEl = document.getElementById('tripOrderId');
  if (tripOrderIdEl) tripOrderIdEl.textContent = '#' + trip.id;

  const isPickupFase = trip.status === 'DRIVER_ACCEPTED';
  const badgeFase = document.getElementById('tripFaseBadge');
  const stepBoxPickup = document.getElementById('stepBoxPickup');
  const stepBoxDelivery = document.getElementById('stepBoxDelivery');
  const btnNext = document.getElementById('btnTripNextStep');

  const storeName = trip.merchantName || trip.storeName || 'Toko Berkah Kelontong';
  const storeAddr = trip.merchantAddress || trip.storeAddress || 'Jl. Mawar No. 12, Sektor 4';

  // Fill Store Info
  const tripStoreNameEl = document.getElementById('tripStoreName');
  if (tripStoreNameEl) tripStoreNameEl.textContent = storeName;
  const tripStoreAddrEl = document.getElementById('tripStoreAddress');
  if (tripStoreAddrEl) tripStoreAddrEl.textContent = storeAddr;

  // Fill Store Cargo List
  const cargoBox = document.getElementById('tripCargoList');
  if (cargoBox) {
    if (trip.items && trip.items.length > 0) {
      cargoBox.innerHTML = trip.items.map(it => {
        const itName = it.product ? it.product.name : (it.name || 'Barang');
        const itPrice = it.product ? it.product.price : (it.price || 0);
        return `
          <div class="cargo-item-row">
            <span><b>${it.qty}x</b> ${itName}</span>
            <span class="font-mono text-muted">${formatRp(itPrice * it.qty)}</span>
          </div>
        `;
      }).join('');
    } else {
      cargoBox.innerHTML = '<div class="text-muted text-xs">1 Paket Belanja Toko</div>';
    }
  }

  // Fill Customer Info
  const custNameEl = document.getElementById('tripCustomerName');
  if (custNameEl) custNameEl.textContent = `${trip.customerName || 'Pelanggan'} (${trip.customerPhone || '-'})`;
  const custAddrEl = document.getElementById('tripCustomerAddress');
  if (custAddrEl) custAddrEl.textContent = `${trip.customerAddress || 'Alamat Penerima'} (${trip.distanceKm || 3.5} km)`;

  // WhatsApp Link for Driver
  const waBtn = document.getElementById('btnChatCustomerWA');
  if (waBtn) {
    const cleanPhone = (trip.customerPhone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    const waMsg = encodeURIComponent(`Halo ${trip.customerName || 'Kak'}, saya ${coreState.driver?.name || 'Kurir Lokal'} mengantar pesanan #${trip.id} dari ${storeName}. Mohon pastikan ada di lokasi pengantaran.`);
    waBtn.href = `https://wa.me/${waPhone || '6281298765432'}?text=${waMsg}`;
  }

  // Cash alert
  const cashAlertBox = document.getElementById('tripCashAlertBox');
  const cashAlertText = document.getElementById('tripCashAlertText');
  const cashAlertAmount = document.getElementById('tripCashAlertAmount');
  const isCOD = (trip.paymentMethod || 'COD') === 'COD';
  const totalBill = trip.totalBill || trip.totalAmount || (trip.subtotal + (trip.shippingFee || 5000));

  if (cashAlertBox && cashAlertText && cashAlertAmount) {
    if (isCOD) {
      cashAlertBox.className = 'cash-alert-box cod mt-2';
      cashAlertText.innerHTML = `Tagihan Tunai COD: <b>${formatRp(totalBill)}</b> (Wajib ditagih sebelum serahkan barang)`;
      cashAlertAmount.textContent = formatRp(totalBill);
    } else {
      cashAlertBox.className = 'cash-alert-box qris mt-2';
      cashAlertText.innerHTML = `Metode Non-Tunai / QRIS (Sudah Lunas &mdash; Dilarang tagih uang tunai)`;
      cashAlertAmount.textContent = 'Rp 0';
    }
  }

  // Status Stepping
  if (isPickupFase) {
    if (badgeFase) {
      badgeFase.className = 'badge-fase fase-pickup';
      badgeFase.textContent = 'Fase 1: Menuju Lokasi Penjemputan (Toko)';
    }
    if (stepBoxPickup) stepBoxPickup.style.borderColor = 'var(--primary)';
    if (stepBoxDelivery) stepBoxDelivery.style.opacity = '0.6';

    if (btnNext) {
      btnNext.textContent = 'Konfirmasi Pengambilan Barang di Toko';
      btnNext.className = 'btn btn-primary btn-block btn-lg';
      btnNext.onclick = (e) => {
        e.preventDefault();
        driverPickupCargo(trip.id);
      };
    }
  } else {
    // ON_THE_WAY
    if (badgeFase) {
      badgeFase.className = 'badge-fase fase-delivery';
      badgeFase.textContent = 'Fase 2: Menuju Alamat Penerima (Pelanggan)';
    }
    if (stepBoxPickup) stepBoxPickup.style.opacity = '0.6';
    if (stepBoxDelivery) {
      stepBoxDelivery.style.opacity = '1';
      stepBoxDelivery.style.borderColor = '#8B5CF6';
    }

    if (btnNext) {
      btnNext.textContent = isCOD
        ? `Konfirmasi Selesai & Kas COD Diterima (${formatRp(totalBill)})`
        : 'Konfirmasi Selesai Pengantaran';
      btnNext.className = 'btn btn-primary btn-block btn-lg';
      btnNext.onclick = (e) => {
        e.preventDefault();
        driverCompleteTrip(trip.id);
      };
    }
  }
}

// Render Completed History
function renderCompletedHistory(completedOrders) {
  const container = document.getElementById('driverHistoryContainer');
  if (!container) return;

  if (completedOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-title" style="font-size: 0.85rem;">Belum Ada Riwayat Pengantaran</div>
        <div class="text-xs text-muted">Pesanan yang diselesaikan akan tersimpan dalam buku kas ini.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = completedOrders.map(order => `
    <div class="history-item-card">
      <div class="history-header">
        <div>
          <span class="font-mono font-bold text-sm">#${order.id}</span>
          <span class="text-xs text-muted ml-2">&bull; ${order.timestamp || 'Hari Ini'}</span>
        </div>
        <div class="history-earnings">+${formatRp(order.driverNetEarnings || 4000)}</div>
      </div>
      <div class="text-xs">
        <div><b>Jemput:</b> ${order.merchantName || 'Toko'} &bull; <b>Antar:</b> ${order.customerName || 'Pelanggan'} (${order.distanceKm || 3.5} km)</div>
        <div class="text-muted mt-1">Pembayaran: <b>${order.paymentMethod || 'COD'}</b> &bull; Total Belanja: ${formatRp(order.totalBill)}</div>
      </div>
    </div>
  `).join('');
}

// =========================================================================
// 4. ACTION HANDLERS (TERIMA, JEMPUT, SELESAI)
// =========================================================================
window.driverAcceptOffer = function(orderId) {
  const order = (coreState.orders || []).find(o => o.id === orderId);
  if (!order) return;

  order.status = 'DRIVER_ACCEPTED';
  order.driverId = coreState.driver.id;
  order.driverName = coreState.driver.name;

  saveCoreState();
  sfx.playSuccess();
  showToast(`Pesanan #${orderId} diterima! Silakan meluncur ke ${order.merchantName}.`);
  renderDriverViews();
};

window.driverPickupCargo = function(orderId) {
  const order = (coreState.orders || []).find(o => o.id === orderId);
  if (!order) return;

  order.status = 'ON_THE_WAY';
  saveCoreState();
  sfx.playSuccess();
  showToast(`Barang pesanan #${orderId} telah diambil. Menuju alamat pengantaran pelanggan.`);
  renderDriverViews();
};

window.driverCompleteTrip = function(orderId) {
  const order = (coreState.orders || []).find(o => o.id === orderId);
  if (!order) return;

  order.status = 'COMPLETED';

  const netEarn = order.driverNetEarnings || (order.deliveryFee ? order.deliveryFee - 1000 : 4000);
  coreState.driver.earnings = (coreState.driver.earnings || 0) + netEarn;

  if (order.paymentMethod === 'COD') {
    coreState.driver.cashHeld = (coreState.driver.cashHeld || 0) + order.totalBill;
  }

  // Sinkronkan juga ke array drivers untuk dashboard Admin
  if (coreState.drivers && Array.isArray(coreState.drivers)) {
    const drv = coreState.drivers.find(d => d.id === coreState.driver.id);
    if (drv) {
      drv.earnings = coreState.driver.earnings;
      drv.cashHeld = coreState.driver.cashHeld;
    }
  }

  saveCoreState();
  sfx.playSuccess();
  showToast(`Pengantaran pesanan #${orderId} tuntas! Pendapatan kurir bertambah ${formatRp(netEarn)}.`);
  renderDriverViews();
};

function toggleDriverOnline() {
  coreState.driver.isOnline = !coreState.driver.isOnline;
  saveCoreState();

  if (coreState.driver.isOnline) {
    showToast('Status Kurir: Online. Siap menerima panggilan pesanan.');
  } else {
    showToast('Status Kurir: Offline. Penawaran pesanan ditangguhkan.');
  }

  renderDriverViews();
}

// =========================================================================
// 5. EVENT LISTENERS & INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check if embedded inside Simulator Iframe
  if (window.self !== window.top) {
    const simNavBtn = document.getElementById('btnBackToSimulator');
    if (simNavBtn) simNavBtn.style.display = 'none';
  }

  // Tab Switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById('panel-' + target);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // Toggle Online
  document.getElementById('btnToggleDriverOnline').addEventListener('click', toggleDriverOnline);

  // Driver Order Filters
  const driverFilterBtns = document.querySelectorAll('#driverOrderFilters .filter-pill');
  driverFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      driverFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      driverOrderFilter = btn.dataset.filter || 'ALL';
      renderDriverOrdersList(coreState.orders || []);
    });
  });

  // Initial Render
  renderDriverViews();

  // Listen to BroadcastChannel from Merchant and Customer
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        if (event.data.action === 'RESET_TRANSACTIONS' || event.data.action === 'RESET_ALL') {
          ignoredOfferId = null;
        }
        const previousReady = (coreState.orders || []).filter(o => o.status === 'READY_FOR_PICKUP').length;
        coreState = event.data.payload;
        if (!coreState.driver) coreState.driver = JSON.parse(JSON.stringify(DEFAULT_DRIVER_PROFILE));

        const currentReady = (coreState.orders || []).filter(o => o.status === 'READY_FOR_PICKUP').length;

        // When Merchant calls kurir, play ping sound and alert kurir!
        if (currentReady > previousReady && coreState.driver.isOnline) {
          sfx.playDriverPing();
          const latestOffer = coreState.orders.find(o => o.status === 'READY_FOR_PICKUP');
          showToast(`Panggilan baru! Pesanan #${latestOffer?.id || ''} siap dijemput di ${latestOffer?.merchantName || 'toko'}.`);
        }

        renderDriverViews();
      }
    };
  }

  // Listen to storage event (Fallback for cross-window / iframe)
  window.addEventListener('storage', (event) => {
    if (event.key === 'lokalkirim_clean_state' && event.newValue) {
      try {
        const previousReady = (coreState.orders || []).filter(o => o.status === 'READY_FOR_PICKUP').length;
        coreState = JSON.parse(event.newValue);
        if (!coreState.driver) coreState.driver = JSON.parse(JSON.stringify(DEFAULT_DRIVER_PROFILE));

        const currentReady = (coreState.orders || []).filter(o => o.status === 'READY_FOR_PICKUP').length;

        if (currentReady > previousReady && coreState.driver.isOnline) {
          sfx.playDriverPing();
          const latestOffer = coreState.orders.find(o => o.status === 'READY_FOR_PICKUP');
          showToast(`Panggilan baru! Pesanan #${latestOffer?.id || ''} siap dijemput di ${latestOffer?.merchantName || 'toko'}.`);
        }

        renderDriverViews();
      } catch (e) {}
    }
  });
});

/**
 * GoMitra / LokalKirim - Portal Mitra Usaha (Merchant JS)
 * Fitur: Manajemen Antrean Pesanan, CRUD Produk Toko, Pengaturan Kios & Jam Buka, Sinkronisasi Real-time
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
// 2. STATE PERSISTENCE & CROSS-ROLE SYNC
// =========================================================================
const DEFAULT_MERCHANT_PROFILE = {
  id: 'toko-berkah',
  name: 'Toko Berkah Kelontong',
  phone: '0812-8877-6655',
  address: 'Jl. Mawar No. 12, Sektor 4, Komplek Niaga Mandiri',
  isOpen: true,
  openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  openHour: '07:00',
  closeHour: '21:00',
  pricingType: 'custom_flat',
  pricingRuleText: 'Skema Khusus: 0–10 km Flat Rp 5.000',
  products: [
    { id: 'p1', name: 'Beras Ramos Super Premium', category: 'Beras', unit: 'Kemasan 5 kg', price: 69000, status: 'Tersedia' },
    { id: 'p2', name: 'Beras Pandan Wangi Cianjur', category: 'Beras', unit: 'Kemasan 5 kg', price: 78000, status: 'Tersedia' },
    { id: 'p3', name: 'Minyak Goreng SunCo Pouch', category: 'Minyak Goreng', unit: 'Kemasan 2 Liter', price: 36000, status: 'Tersedia' },
    { id: 'p4', name: 'Minyak Goreng Bimoli Klasik', category: 'Minyak Goreng', unit: 'Kemasan 2 Liter', price: 37500, status: 'Tersedia' },
    { id: 'p5', name: 'Gula Pasir Kristal Putih Gulaku', category: 'Gula & Tepung', unit: 'Kemasan 1 kg', price: 17500, status: 'Tersedia' },
    { id: 'p6', name: 'Tepung Terigu Segitiga Biru', category: 'Gula & Tepung', unit: 'Kemasan 1 kg', price: 13000, status: 'Tersedia' },
    { id: 'p7', name: 'Telur Ayam Negeri Segar', category: 'Kebutuhan Dapur', unit: 'Pack 1 kg', price: 28000, status: 'Tersedia' },
    { id: 'p8', name: 'Paket Sembako Berkah Dapur Hemat', category: 'Paket Hemat', unit: 'Beras 5kg + Minyak 2L + Gula 1kg', price: 119000, status: 'Terlaris' }
  ]
};

let coreState = loadCoreState();
const channel = window.BroadcastChannel ? new BroadcastChannel('lokalkirim_pwa_sim') : null;

function loadCoreState() {
  if (typeof window !== 'undefined' && window.loadSharedState) {
    return window.loadSharedState();
  }
  const saved = localStorage.getItem('lokalkirim_clean_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.merchants || parsed.merchants.length === 0) {
        parsed.merchants = [JSON.parse(JSON.stringify(DEFAULT_MERCHANT_PROFILE))];
      }
      return parsed;
    } catch (e) {
      console.warn('Error reading stored state:', e);
    }
  }

  return {
    merchants: [JSON.parse(JSON.stringify(DEFAULT_MERCHANT_PROFILE))],
    orders: [],
    pricingRules: { perKmFare: 2000, baseMinFare: 8000, flatMaxKm: 10, flatRate: 5000, platformFee: 1000 },
    driver: { id: 'drv-01', name: 'Budi Santoso', earnings: 0, cashHeld: 0, isOnline: true },
    activeOrderId: null
  };
}

function getActiveMerchant() {
  if (!coreState.merchants || coreState.merchants.length === 0) {
    coreState.merchants = (typeof window !== 'undefined' && window.LOKALKIRIM_INITIAL_DATA)
      ? JSON.parse(JSON.stringify(window.LOKALKIRIM_INITIAL_DATA.merchants))
      : [JSON.parse(JSON.stringify(DEFAULT_MERCHANT_PROFILE))];
  }
  return coreState.merchants[0];
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

// Format Rupiah
function formatRp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

// Toast
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
// 3. TAB 1: ANTARAN PESANAN MASUK (ORDERS QUEUE)
// =========================================================================
let currentOrderFilter = 'ALL';

function renderOrdersTab() {
  const merch = getActiveMerchant();
  const allOrders = coreState.orders || [];
  
  // Hitung metrik berdasarkan status
  const activeOrders = allOrders.filter(o => 
    ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(o.status)
  );
  const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
  const revenueToday = completedOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);

  // Update KPI Cards
  const statOrdersCount = document.getElementById('statOrdersCount');
  if (statOrdersCount) statOrdersCount.textContent = activeOrders.length;
  const statRevToday = document.getElementById('statRevenueToday');
  if (statRevToday) statRevToday.textContent = formatRp(revenueToday);
  const statCompCount = document.getElementById('statCompletedCount');
  if (statCompCount) statCompCount.textContent = completedOrders.length;
  const tabBadgeOrders = document.getElementById('tabBadgeOrders');
  if (tabBadgeOrders) tabBadgeOrders.textContent = allOrders.length;

  // Update Filter Pill Counters
  const countAll = document.getElementById('countFilterAll');
  if (countAll) countAll.textContent = allOrders.length;
  const countActive = document.getElementById('countFilterActive');
  if (countActive) countActive.textContent = activeOrders.length;
  const countCompleted = document.getElementById('countFilterCompleted');
  if (countCompleted) countCompleted.textContent = completedOrders.length;

  // Filter pesanan yang akan ditampilkan (Default 'ALL': SEMUA STATUS TETAP TAMPIL)
  let displayOrders = allOrders;
  if (currentOrderFilter === 'ACTIVE') {
    displayOrders = activeOrders;
  } else if (currentOrderFilter === 'COMPLETED') {
    displayOrders = completedOrders;
  }

  // Tampilkan urutan pesanan terbaru di paling atas
  displayOrders = [...displayOrders].reverse();

  const queueContainer = document.getElementById('merchantOrdersQueue');
  if (!queueContainer) return;

  if (displayOrders.length === 0) {
    queueContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">${currentOrderFilter === 'ALL' ? 'Belum Ada Transaksi Pesanan' : 'Tidak Ada Pesanan pada Kategori Ini'}</div>
        <div class="text-xs text-muted">Pesanan baru yang dibuat oleh pelanggan dari Customer App akan muncul di sini secara otomatis.</div>
      </div>
    `;
    return;
  }

  queueContainer.innerHTML = displayOrders.map(order => {
    let actionBtnHtml = '';
    let badgeClass = 'pending';
    let statusText = 'Pesanan Baru Masuk';

    if (order.status === 'PENDING') {
      badgeClass = 'pending';
      statusText = 'Pesanan Dibuat';
      actionBtnHtml = `
        <button class="btn btn-primary btn-block btn-sm" onclick="acceptOrder('${order.id}')">
          Terima & Siapkan Pesanan
        </button>
      `;
    } else if (order.status === 'PREPARING') {
      badgeClass = 'preparing';
      statusText = 'Sedang Disiapkan Toko';
      actionBtnHtml = `
        <button class="btn btn-primary btn-block btn-sm" onclick="requestDriverPickup('${order.id}')">
          Siap Diambil (Panggil Kurir Penjemput)
        </button>
      `;
    } else if (order.status === 'READY_FOR_PICKUP') {
      badgeClass = 'ready';
      statusText = 'Menunggu Kurir';
      actionBtnHtml = `
        <div class="text-xs text-muted font-semibold">
          Permintaan penjemputan telah disiarkan ke kurir terdekat...
        </div>
      `;
    } else if (order.status === 'DRIVER_ACCEPTED') {
      badgeClass = 'preparing';
      statusText = 'Kurir Menuju Toko';
      actionBtnHtml = `
        <div class="text-xs text-primary font-bold">
          Kurir (${order.driverName || coreState.driver?.name || 'Kurir'}) sedang meluncur menuju lokasi toko Anda.
        </div>
      `;
    } else if (order.status === 'ON_THE_WAY') {
      badgeClass = 'otw';
      statusText = 'Dalam Pengantaran';
      actionBtnHtml = `
        <div class="text-xs text-muted font-semibold">
          Barang telah diambil kurir (${order.driverName || 'Kurir'}) dan sedang diantar ke pembeli.
        </div>
      `;
    } else if (order.status === 'COMPLETED') {
      badgeClass = 'completed';
      statusText = 'Pesanan Selesai';
      actionBtnHtml = `
        <div class="text-xs font-semibold" style="color: #15803D;">
          Pesanan sukses tuntas diantar ke pembeli. Omset ${formatRp(order.subtotal)} telah masuk pembukuan.
        </div>
      `;
    } else if (order.status === 'CANCELLED') {
      badgeClass = 'cancelled';
      statusText = 'Dibatalkan';
      actionBtnHtml = `
        <div class="text-xs font-semibold" style="color: #DC2626;">
          Pesanan ini telah dibatalkan.
        </div>
      `;
    }

    return `
      <div class="order-card-merchant ${order.status === 'PENDING' ? 'pending-alert' : ''}">
        <div class="order-card-header">
          <div>
            <span class="order-id-badge">#${order.id}</span>
            <span class="order-time-tag">${order.timestamp || ''}</span>
          </div>
          <span class="status-badge ${badgeClass}">${statusText}</span>
        </div>

        <div class="customer-detail-bar">
          <div><b>Penerima:</b> ${order.customerName || 'Pelanggan'} (${order.customerPhone || '-'})</div>
          <div class="text-muted mt-1"><b>Alamat:</b> ${order.customerAddress || 'Radius pengantaran'} (${order.distanceKm || 3.5} km)</div>
        </div>

        <div class="order-items-box">
          ${(order.items || []).map(it => {
            const itName = it.product ? it.product.name : (it.name || 'Barang');
            const itPrice = it.product ? it.product.price : (it.price || 0);
            return `
              <div class="order-item-line">
                <span>${it.qty}x ${itName}</span>
                <span class="font-mono">${formatRp(itPrice * it.qty)}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="order-financial-row">
          <span class="text-muted">Metode: <b>${order.paymentMethod || 'COD'}</b></span>
          <div>
            <span class="text-muted text-xs">Total Omset Toko:</span>
            <span class="font-bold text-primary font-mono ml-1">${formatRp(order.subtotal)}</span>
          </div>
        </div>

        <div class="order-action-footer">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.acceptOrder = function(orderId) {
  const order = coreState.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'PREPARING';
  saveCoreState();
  showToast(`Pesanan #${orderId} diterima dan mulai diproses.`);
  renderAllViews();
};

window.requestDriverPickup = function(orderId) {
  const order = coreState.orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = 'READY_FOR_PICKUP';
  saveCoreState();
  sfx.playSuccess();
  showToast(`Penawaran penjemputan pesanan #${orderId} disiarkan ke kurir.`);
  renderAllViews();
};

// =========================================================================
// 4. TAB 2: KATALOG PRODUK (CRUD LENGKAP)
// =========================================================================
let filterProductQuery = '';
let filterProductCategory = 'Semua';

function renderProductsTab() {
  const merch = getActiveMerchant();
  const products = merch.products || [];
  document.getElementById('tabBadgeProducts').textContent = products.length;

  let filtered = products.filter(p => {
    const matchCat = filterProductCategory === 'Semua' || p.category === filterProductCategory;
    const matchQuery = p.name.toLowerCase().includes(filterProductQuery.toLowerCase()) ||
                       (p.category || '').toLowerCase().includes(filterProductQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const tbody = document.getElementById('merchantProductTbody');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 24px;">
          Tidak ada produk yang cocok dengan pencarian atau kategori ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isAvailable = p.status === 'Tersedia' || p.status === 'Terlaris';
    const pillClass = p.status === 'Tersedia' ? 'tersedia' : (p.status === 'Terlaris' ? 'terlaris' : 'habis');

    return `
      <tr>
        <td>
          <div class="font-bold">${p.name}</div>
        </td>
        <td><span class="text-muted">${p.category}</span></td>
        <td>${p.unit || '-'}</td>
        <td class="font-mono font-bold">${formatRp(p.price)}</td>
        <td>
          <span class="stock-pill ${pillClass}">${p.status}</span>
        </td>
        <td class="text-right">
          <div class="table-actions">
            <button class="btn btn-outline-dark btn-sm" onclick="openEditProductModal('${p.id}')">
              Edit
            </button>
            <button class="btn btn-outline-dark btn-sm" onclick="toggleProductStock('${p.id}')" title="Ubah status stok cepat">
              ${isAvailable ? 'Jadikan Habis' : 'Jadikan Tersedia'}
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct('${p.id}')" title="Hapus produk">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Modal Product Form Handlers
function openAddProductModal() {
  document.getElementById('modalProductTitle').textContent = 'Tambah Produk Baru';
  document.getElementById('editProductId').value = '';
  document.getElementById('prodFormName').value = '';
  document.getElementById('prodFormCategory').value = 'Beras';
  document.getElementById('prodFormUnit').value = '';
  document.getElementById('prodFormPrice').value = '';
  document.getElementById('prodFormStatus').value = 'Tersedia';

  document.getElementById('modalProductForm').classList.remove('hidden');
}

window.openEditProductModal = function(prodId) {
  const merch = getActiveMerchant();
  const prod = merch.products.find(p => p.id === prodId);
  if (!prod) return;

  document.getElementById('modalProductTitle').textContent = 'Edit Informasi Produk';
  document.getElementById('editProductId').value = prod.id;
  document.getElementById('prodFormName').value = prod.name;
  document.getElementById('prodFormCategory').value = prod.category || 'Beras';
  document.getElementById('prodFormUnit').value = prod.unit || '';
  document.getElementById('prodFormPrice').value = prod.price;
  document.getElementById('prodFormStatus').value = prod.status || 'Tersedia';

  document.getElementById('modalProductForm').classList.remove('hidden');
};

function closeProductModal() {
  document.getElementById('modalProductForm').classList.add('hidden');
}

function handleSaveProduct(e) {
  e.preventDefault();
  const merch = getActiveMerchant();
  const prodId = document.getElementById('editProductId').value;
  const name = document.getElementById('prodFormName').value.trim();
  const category = document.getElementById('prodFormCategory').value;
  const unit = document.getElementById('prodFormUnit').value.trim();
  const price = parseInt(document.getElementById('prodFormPrice').value) || 0;
  const status = document.getElementById('prodFormStatus').value;

  if (!name || price <= 0) {
    showToast('Nama produk dan harga harus diisi.');
    return;
  }

  if (prodId) {
    // UPDATE
    const existing = merch.products.find(p => p.id === prodId);
    if (existing) {
      existing.name = name;
      existing.category = category;
      existing.unit = unit;
      existing.price = price;
      existing.status = status;
      showToast(`Produk "${name}" berhasil diperbarui.`);
    }
  } else {
    // CREATE
    const newId = 'prod-' + Date.now().toString().slice(-5);
    merch.products.push({
      id: newId,
      name,
      category,
      unit,
      price,
      status
    });
    showToast(`Produk baru "${name}" berhasil ditambahkan.`);
  }

  saveCoreState();
  closeProductModal();
  renderProductsTab();
}

window.toggleProductStock = function(prodId) {
  const merch = getActiveMerchant();
  const prod = merch.products.find(p => p.id === prodId);
  if (!prod) return;

  prod.status = prod.status === 'Tersedia' ? 'Habis' : 'Tersedia';
  saveCoreState();
  showToast(`Status produk "${prod.name}" diubah ke "${prod.status}".`);
  renderProductsTab();
};

window.deleteProduct = function(prodId) {
  const merch = getActiveMerchant();
  const prod = merch.products.find(p => p.id === prodId);
  if (!prod) return;

  if (confirm(`Yakin ingin menghapus produk "${prod.name}" dari katalog toko?`)) {
    merch.products = merch.products.filter(p => p.id !== prodId);
    saveCoreState();
    showToast(`Produk "${prod.name}" telah dihapus.`);
    renderProductsTab();
  }
};

// =========================================================================
// 5. TAB 3: PENGATURAN KIOS & JADWAL OPERASIONAL
// =========================================================================
function renderSettingsTab() {
  const merch = getActiveMerchant();

  document.getElementById('navStoreName').textContent = merch.name;
  document.getElementById('settingStoreName').value = merch.name;
  document.getElementById('settingStorePhone').value = merch.phone || '';
  document.getElementById('settingStoreAddress').value = merch.address;
  document.getElementById('settingPricingScheme').value = merch.pricingType || 'custom_flat';

  document.getElementById('settingOpenHour').value = merch.openHour || '07:00';
  document.getElementById('settingCloseHour').value = merch.closeHour || '21:00';

  // Open days checklist
  const openDays = merch.openDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  document.querySelectorAll('input[name="openDay"]').forEach(cb => {
    cb.checked = openDays.includes(cb.value);
  });

  // Top status toggle button
  updateStoreStatusButton(merch.isOpen);
}

function updateStoreStatusButton(isOpen) {
  const btn = document.getElementById('btnToggleStoreStatus');
  const label = document.getElementById('storeStatusLabel');

  if (isOpen) {
    btn.className = 'status-toggle-btn open';
    label.textContent = 'Toko Buka';
  } else {
    btn.className = 'status-toggle-btn closed';
    label.textContent = 'Toko Tutup';
  }
}

function toggleStoreStatus() {
  const merch = getActiveMerchant();
  merch.isOpen = !merch.isOpen;
  saveCoreState();
  updateStoreStatusButton(merch.isOpen);
  showToast(merch.isOpen ? 'Status diubah: Toko BUKA untuk menerima pesanan.' : 'Status diubah: Toko TUTUP sementara.');
}

function saveStoreProfile() {
  const merch = getActiveMerchant();
  const name = document.getElementById('settingStoreName').value.trim();
  const phone = document.getElementById('settingStorePhone').value.trim();
  const address = document.getElementById('settingStoreAddress').value.trim();
  const pricing = document.getElementById('settingPricingScheme').value;

  if (!name || !address) {
    showToast('Nama toko dan alamat tidak boleh kosong.');
    return;
  }

  merch.name = name;
  merch.phone = phone;
  merch.address = address;
  merch.pricingType = pricing;
  merch.pricingRuleText = pricing === 'custom_flat' 
    ? 'Skema Khusus: 0–10 km Flat Rp 5.000'
    : 'Skema Reguler: Min Rp 8.000, Rp 2.000/km';

  saveCoreState();
  document.getElementById('navStoreName').textContent = name;
  showToast('Profil kios dan alamat penjemputan berhasil diperbarui.');
}

function saveOperationalHours() {
  const merch = getActiveMerchant();
  const openDays = [];
  document.querySelectorAll('input[name="openDay"]:checked').forEach(cb => {
    openDays.push(cb.value);
  });

  merch.openDays = openDays;
  merch.openHour = document.getElementById('settingOpenHour').value;
  merch.closeHour = document.getElementById('settingCloseHour').value;

  saveCoreState();
  showToast(`Jadwal operasional disimpan: ${openDays.join(', ')} (${merch.openHour} - ${merch.closeHour}).`);
}

// =========================================================================
// 6. TAB 4: REKAP PENJUALAN
// =========================================================================
function renderSummaryTab() {
  const allOrders = coreState.orders || [];
  const completed = allOrders.filter(o => o.status === 'COMPLETED');
  const totalOmset = completed.reduce((acc, o) => acc + (o.subtotal || 0), 0);
  const avgBill = completed.length > 0 ? Math.round(totalOmset / completed.length) : 0;

  document.getElementById('rekapTotalOmset').textContent = formatRp(totalOmset);
  document.getElementById('rekapCompletedOrders').textContent = completed.length;
  document.getElementById('rekapAverageBill').textContent = formatRp(avgBill);

  const listContainer = document.getElementById('rekapCompletedList');

  if (completed.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state text-xs">
        <div class="empty-title">Belum Ada Transaksi Selesai</div>
        <div class="text-muted">Setelah kurir mengonfirmasi pengantaran selesai, rekapitulasi akan muncul di sini.</div>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = completed.map(o => `
    <div class="completed-row">
      <div>
        <span class="font-mono font-bold">#${o.id}</span>
        <span class="text-muted"> &bull; ${o.customerName || 'Pelanggan'} (${o.timestamp || ''})</span>
        <div class="text-xs text-muted">${(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
      </div>
      <div class="text-right">
        <div class="font-mono font-bold text-primary">${formatRp(o.subtotal)}</div>
        <span class="stock-pill tersedia">Tuntas Terbayar</span>
      </div>
    </div>
  `).join('');
}

// =========================================================================
// 7. EVENT LISTENERS & BOOTSTRAP
// =========================================================================
function renderAllViews() {
  renderOrdersTab();
  renderProductsTab();
  renderSettingsTab();
  renderSummaryTab();
}

document.addEventListener('DOMContentLoaded', () => {
  renderAllViews();

  // If inside simulator iframe, hide the standalone "Simulator Multi-Peran" link
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

      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById('panel-' + targetTab);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // Filter Status Pesanan Operasional
  const orderFilterBtns = document.querySelectorAll('#merchantOrderFilters .filter-pill');
  orderFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      orderFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.dataset.filter || 'ALL';
      renderOrdersTab();
    });
  });

  // Store status toggle button
  document.getElementById('btnToggleStoreStatus').addEventListener('click', toggleStoreStatus);

  // Profile & Settings saves
  document.getElementById('btnSaveStoreProfile').addEventListener('click', saveStoreProfile);
  document.getElementById('btnSaveOperationalHours').addEventListener('click', saveOperationalHours);

  // Product CRUD triggers
  document.getElementById('btnOpenAddProductModal').addEventListener('click', openAddProductModal);
  document.getElementById('btnCloseProductModal').addEventListener('click', closeProductModal);
  document.getElementById('btnCancelProductModal').addEventListener('click', closeProductModal);
  document.getElementById('formProduct').addEventListener('submit', handleSaveProduct);

  // Product Filters
  document.getElementById('filterProductQuery').addEventListener('input', (e) => {
    filterProductQuery = e.target.value;
    renderProductsTab();
  });

  document.getElementById('filterProductCategory').addEventListener('change', (e) => {
    filterProductCategory = e.target.value;
    renderProductsTab();
  });

  // Tombol Pulihkan Produk Default
  const btnResetProds = document.getElementById('btnResetProductsDefault');
  if (btnResetProds) {
    btnResetProds.addEventListener('click', () => {
      if (confirm('Pulihkan katalog produk toko ke 10 produk sembako standar bawaan?')) {
        const activeMerch = getActiveMerchant();
        if (typeof window !== 'undefined' && window.resetMerchantProductsToDefault) {
          coreState = window.resetMerchantProductsToDefault(activeMerch.id);
        } else {
          activeMerch.products = (typeof window !== 'undefined' && window.LOKALKIRIM_DEFAULT_PRODUCTS)
            ? JSON.parse(JSON.stringify(window.LOKALKIRIM_DEFAULT_PRODUCTS))
            : JSON.parse(JSON.stringify(DEFAULT_MERCHANT_PROFILE.products));
          saveCoreState(true, 'RESET_PRODUCTS');
        }
        showToast('Katalog produk berhasil dipulihkan ke standar sembako bawaan.');
        renderProductsTab();
      }
    });
  }

  // Cross-role synchronization listener via BroadcastChannel
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        const previousOrdersCount = (coreState.orders || []).filter(o => o.status === 'PENDING').length;
        coreState = event.data.payload;
        const newOrdersCount = (coreState.orders || []).filter(o => o.status === 'PENDING').length;

        // If new incoming pending order, ring bell!
        if (newOrdersCount > previousOrdersCount) {
          sfx.playOrderBell();
          showToast('Pesanan baru masuk dari pelanggan!');
        }

        renderAllViews();
      }
    };
  }

  // Cross-role synchronization listener via Storage Event (Cross-Tab / Iframe fallback)
  window.addEventListener('storage', (event) => {
    if (event.key === 'lokalkirim_clean_state' && event.newValue) {
      try {
        const previousOrdersCount = (coreState.orders || []).filter(o => o.status === 'PENDING').length;
        coreState = JSON.parse(event.newValue);
        const newOrdersCount = (coreState.orders || []).filter(o => o.status === 'PENDING').length;

        if (newOrdersCount > previousOrdersCount) {
          sfx.playOrderBell();
          showToast('Pesanan baru masuk dari pelanggan!');
        }

        renderAllViews();
      } catch (e) {}
    }
  });
});

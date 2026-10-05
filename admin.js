/**
 * GoMitra / LokalKirim - Konsol Pengawas Operasional (admin.js)
 * Modul: Monitoring Transaksi Real-Time, CRUD Mitra Usaha, CRUD Mitra Kurir, Pricing Engine
 * Sesuai Standar Industri & AGENTS.md
 */

// =========================================================================
// 1. STATE PERSISTENCE & SYNC ENGINE
// =========================================================================
const DEFAULT_INITIAL_DATA = {
  merchants: [
    {
      id: 'toko-berkah',
      name: 'Toko Berkah Kelontong',
      phone: '0812-8877-6655',
      address: 'Jl. Mawar No. 12, Sektor 4, Komplek Niaga Mandiri',
      isOpen: true,
      pricingType: 'custom_flat',
      pricingRuleText: 'Skema Khusus: 0–10 km Flat Rp 5.000',
      products: [
        { id: 'p1', name: 'Beras Ramos Super (5 kg)', price: 69000, qty: 1 },
        { id: 'p2', name: 'Minyak Goreng 2 Liter', price: 35000, qty: 0 },
        { id: 'p3', name: 'Telur Ayam Negeri 1 kg', price: 28000, qty: 0 }
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
    phone: '0812-8877-6655',
    vehicle: 'Honda Beat ESP (Hitam)',
    plateNumber: 'B 4821 KLR',
    isOnline: true,
    earnings: 0,
    cashHeld: 0
  },
  drivers: [
    {
      id: 'drv-01',
      name: 'Budi Santoso',
      phone: '0812-8877-6655',
      vehicle: 'Honda Beat ESP (Hitam)',
      plateNumber: 'B 4821 KLR',
      isOnline: true,
      earnings: 0,
      cashHeld: 0
    },
    {
      id: 'drv-02',
      name: 'Agus Priyanto',
      phone: '0857-1122-3344',
      vehicle: 'Yamaha Vario 125 (Merah)',
      plateNumber: 'B 3910 TZU',
      isOnline: false,
      earnings: 0,
      cashHeld: 0
    }
  ],
  orders: [],
  activeOrderId: null
};

let coreState = loadCoreState();
const channel = window.BroadcastChannel ? new BroadcastChannel('lokalkirim_pwa_sim') : null;

// Search & Filter state
let filterOrderQuery = '';
let filterOrderStatus = 'Semua';

function loadCoreState() {
  if (typeof window !== 'undefined' && window.loadSharedState) {
    return window.loadSharedState();
  }
  const saved = localStorage.getItem('lokalkirim_clean_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.drivers || parsed.drivers.length === 0) {
        parsed.drivers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.drivers));
      }
      if (!parsed.driver && parsed.drivers.length > 0) {
        parsed.driver = parsed.drivers[0];
      }
      return parsed;
    } catch (e) {
      console.warn('Gagal memuat state admin:', e);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
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
  const toast = document.getElementById('adminToastBox');
  const text = document.getElementById('adminToastMessage');
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// =========================================================================
// 2. MODUL 1: MONITORING TRANSAKSI REAL-TIME
// =========================================================================
function renderTransactionsTab() {
  const orders = coreState.orders || [];
  document.getElementById('badgeTotalOrders').textContent = orders.length;

  // 1. Calculate Executive KPIs
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const totalGmv = completedOrders.reduce((sum, o) => sum + (o.totalBill || 0), 0);
  const platformRevenue = completedOrders.reduce((sum, o) => sum + (o.platformFee || 1000), 0);
  const totalCashHeld = (coreState.driver?.cashHeld || 0) + (coreState.drivers || []).reduce((s, d) => s + (d.id !== coreState.driver?.id ? (d.cashHeld || 0) : 0), 0);

  document.getElementById('adminKpiTotalGmv').textContent = formatRp(totalGmv);
  document.getElementById('adminKpiPlatformFee').textContent = formatRp(platformRevenue);
  document.getElementById('adminKpiCashHeld').textContent = formatRp(totalCashHeld);
  document.getElementById('adminKpiOrdersCompleted').textContent = `${completedOrders.length} / ${orders.length}`;

  // 2. Filter Orders
  let filtered = orders.filter(order => {
    const matchStatus = filterOrderStatus === 'Semua' || order.status === filterOrderStatus;
    const query = filterOrderQuery.toLowerCase();
    const matchQuery = !query ||
      order.id.toLowerCase().includes(query) ||
      (order.customerName || '').toLowerCase().includes(query) ||
      (order.merchantName || '').toLowerCase().includes(query) ||
      (order.driverName || '').toLowerCase().includes(query);
    return matchStatus && matchQuery;
  });

  const tbody = document.getElementById('tbodyOrdersList');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted" style="padding: 32px;">
          Tidak ada transaksi yang sesuai dengan filter atau pencarian saat ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    let statusBadgeCls = 'status-pending';
    let statusLabel = 'Menunggu Konfirmasi';

    switch (o.status) {
      case 'PENDING':
        statusBadgeCls = 'status-pending';
        statusLabel = 'Pesanan Baru';
        break;
      case 'PREPARING':
        statusBadgeCls = 'status-preparing';
        statusLabel = 'Diproses Toko';
        break;
      case 'READY_FOR_PICKUP':
        statusBadgeCls = 'status-ready';
        statusLabel = 'Siap Dijemput';
        break;
      case 'DRIVER_ACCEPTED':
        statusBadgeCls = 'status-preparing';
        statusLabel = 'Kurir Menuju Toko';
        break;
      case 'ON_THE_WAY':
        statusBadgeCls = 'status-delivery';
        statusLabel = 'Dalam Pengantaran';
        break;
      case 'COMPLETED':
        statusBadgeCls = 'status-completed';
        statusLabel = 'Selesai Tuntas';
        break;
    }

    const assignedDriver = o.driverName || (o.driverId ? (coreState.drivers.find(d => d.id === o.driverId)?.name || 'Kurir') : '-');

    return `
      <tr>
        <td>
          <div class="font-mono font-bold">#${o.id}</div>
          <div class="text-xs text-muted">${o.timestamp || '-'}</div>
        </td>
        <td>
          <div class="font-semibold">${o.merchantName || 'Toko Mitra'}</div>
        </td>
        <td>
          <div>${o.customerName || 'Pelanggan'}</div>
          <div class="text-xs text-muted">${o.customerPhone || '-'}</div>
        </td>
        <td>
          <span class="font-semibold text-xs">${assignedDriver}</span>
        </td>
        <td class="font-mono">${formatRp(o.subtotal)}</td>
        <td class="font-mono">${formatRp(o.deliveryFee)}</td>
        <td class="font-mono text-primary font-bold">${formatRp(o.platformFee || 1000)}</td>
        <td>
          <div class="font-mono font-bold">${formatRp(o.totalBill)}</div>
          <span class="text-xs text-muted">(${o.paymentMethod || 'COD'})</span>
        </td>
        <td>
          <span class="status-pill ${statusBadgeCls}">${statusLabel}</span>
        </td>
        <td>
          <button class="btn-icon-action" onclick="openOrderDetailModal('${o.id}')" title="Lihat rincian lengkap transaksi">
            Detail
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Order Detail Modal
window.openOrderDetailModal = function(orderId) {
  const order = (coreState.orders || []).find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modalDetailOrderId').textContent = `Detail Transaksi #${order.id}`;

  const body = document.getElementById('modalDetailBody');
  const items = order.items || [];

  body.innerHTML = `
    <div class="order-detail-meta">
      <div><b>Status Operasional:</b> ${order.status} &bull; <b>Waktu:</b> ${order.timestamp || '-'}</div>
      <div><b>Mitra Toko:</b> ${order.merchantName} (${order.merchantAddress})</div>
      <div><b>Pelanggan:</b> ${order.customerName} (${order.customerPhone})</div>
      <div><b>Alamat Antar:</b> ${order.customerAddress} (${order.distanceKm} km)</div>
      <div><b>Kurir Ditugaskan:</b> ${order.driverName || 'Belum ada kurir'}</div>
    </div>

    <div class="font-bold text-xs mt-2">Daftar Barang Belanja:</div>
    <table class="order-items-table">
      <thead>
        <tr>
          <th>Nama Barang</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Harga</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(it => `
          <tr>
            <td>${it.name}</td>
            <td class="text-center">${it.qty}</td>
            <td class="text-right font-mono">${formatRp(it.price)}</td>
            <td class="text-right font-mono">${formatRp(it.price * it.qty)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 4px; border: 1px solid var(--border); margin-top: 6px;">
      <div class="order-summary-row">
        <span>Subtotal Belanja Toko (100% Hak Mitra):</span>
        <span class="font-mono font-bold">${formatRp(order.subtotal)}</span>
      </div>
      <div class="order-summary-row">
        <span>Ongkos Kirim:</span>
        <span class="font-mono">${formatRp(order.deliveryFee)}</span>
      </div>
      <div class="order-summary-row">
        <span>Potongan Fee Jasa Platform:</span>
        <span class="font-mono text-primary">-${formatRp(order.platformFee || 1000)}</span>
      </div>
      <div class="order-summary-row">
        <span>Hak Bersih Kurir:</span>
        <span class="font-mono font-bold" style="color: #059669;">${formatRp(order.driverNetEarnings)}</span>
      </div>
      <div class="order-summary-row" style="border-top: 1px solid var(--border); padding-top: 6px; margin-top: 6px;">
        <span class="font-bold">Total Pembayaran Pelanggan (${order.paymentMethod || 'COD'}):</span>
        <span class="font-mono font-bold text-primary" style="font-size: 0.95rem;">${formatRp(order.totalBill)}</span>
      </div>
    </div>
  `;

  document.getElementById('modalOrderDetail').classList.remove('hidden');
};

// =========================================================================
// 3. MODUL 2: CRUD MITRA USAHA (MERCHANTS)
// =========================================================================
function renderMerchantsTab() {
  const merchants = coreState.merchants || [];
  const tbody = document.getElementById('tbodyMerchantsList');

  if (merchants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted" style="padding: 32px;">
          Belum ada mitra usaha yang terdaftar. Klik "+ Tambah Mitra Usaha" untuk mendaftarkan toko.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = merchants.map(m => {
    const isFlat = m.pricingType === 'custom_flat';
    const isOpen = m.isOpen !== false;

    return `
      <tr>
        <td class="font-mono text-xs">${m.id}</td>
        <td>
          <div class="font-bold">${m.name}</div>
        </td>
        <td>
          <div class="text-xs font-semibold">${m.phone || '-'}</div>
        </td>
        <td>
          <div class="text-xs text-muted" style="max-width: 240px;">${m.address || '-'}</div>
        </td>
        <td>
          <span class="status-pill ${isFlat ? 'status-ready' : 'status-preparing'}">
            ${isFlat ? 'Flat Rp 5.000 (0-10 km)' : 'Reguler / km'}
          </span>
        </td>
        <td class="text-center font-mono font-bold">${(m.products || []).length}</td>
        <td>
          <button class="status-pill ${isOpen ? 'status-open' : 'status-closed'}" style="cursor: pointer;" onclick="toggleMerchantStatus('${m.id}')" title="Klik untuk ubah status buka/tutup">
            ${isOpen ? 'Buka (Aktif)' : 'Tutup'}
          </button>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action" onclick="openEditMerchantModal('${m.id}')" title="Ubah profil toko">
              Edit
            </button>
            <button class="btn-icon-action danger" onclick="deleteMerchant('${m.id}')" title="Hapus mitra toko">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleMerchantStatus = function(merchId) {
  const merch = coreState.merchants.find(m => m.id === merchId);
  if (!merch) return;
  merch.isOpen = !merch.isOpen;
  saveCoreState();
  showToast(`Status operasional ${merch.name} diubah menjadi ${merch.isOpen ? 'Buka' : 'Tutup'}.`);
  renderMerchantsTab();
};

window.openAddMerchantModal = function() {
  document.getElementById('modalMerchantTitle').textContent = 'Tambah Mitra Usaha Baru';
  document.getElementById('editMerchantId').value = '';
  document.getElementById('inputMerchName').value = '';
  document.getElementById('inputMerchPhone').value = '';
  document.getElementById('inputMerchAddress').value = '';
  document.getElementById('inputMerchPricingType').value = 'custom_flat';
  document.getElementById('inputMerchStatus').value = 'true';
  document.getElementById('modalMerchantForm').classList.remove('hidden');
};

window.openEditMerchantModal = function(merchId) {
  const merch = coreState.merchants.find(m => m.id === merchId);
  if (!merch) return;

  document.getElementById('modalMerchantTitle').textContent = `Edit Mitra Usaha: ${merch.name}`;
  document.getElementById('editMerchantId').value = merch.id;
  document.getElementById('inputMerchName').value = merch.name || '';
  document.getElementById('inputMerchPhone').value = merch.phone || '';
  document.getElementById('inputMerchAddress').value = merch.address || '';
  document.getElementById('inputMerchPricingType').value = merch.pricingType || 'custom_flat';
  document.getElementById('inputMerchStatus').value = merch.isOpen !== false ? 'true' : 'false';

  document.getElementById('modalMerchantForm').classList.remove('hidden');
};

function handleSaveMerchant(e) {
  e.preventDefault();
  const id = document.getElementById('editMerchantId').value;
  const name = document.getElementById('inputMerchName').value.trim();
  const phone = document.getElementById('inputMerchPhone').value.trim();
  const address = document.getElementById('inputMerchAddress').value.trim();
  const pricingType = document.getElementById('inputMerchPricingType').value;
  const isOpen = document.getElementById('inputMerchStatus').value === 'true';

  if (!coreState.merchants) coreState.merchants = [];

  if (id) {
    // Edit existing
    const merch = coreState.merchants.find(m => m.id === id);
    if (merch) {
      merch.name = name;
      merch.phone = phone;
      merch.address = address;
      merch.pricingType = pricingType;
      merch.pricingRuleText = pricingType === 'custom_flat'
        ? `Skema Khusus: 0–${coreState.pricingRules.flatMaxKm} km Flat ${formatRp(coreState.pricingRules.flatRate)}`
        : `Skema Reguler: Min ${formatRp(coreState.pricingRules.baseMinFare)}, ${formatRp(coreState.pricingRules.perKmFare)}/km`;
      merch.isOpen = isOpen;
      showToast(`Data mitra ${name} berhasil diperbarui.`);
    }
  } else {
    // Create new
    const newId = 'toko-' + Math.random().toString(36).substring(2, 7);
    const newMerchant = {
      id: newId,
      name: name,
      phone: phone,
      address: address,
      pricingType: pricingType,
      pricingRuleText: pricingType === 'custom_flat'
        ? `Skema Khusus: 0–${coreState.pricingRules.flatMaxKm} km Flat ${formatRp(coreState.pricingRules.flatRate)}`
        : `Skema Reguler: Min ${formatRp(coreState.pricingRules.baseMinFare)}, ${formatRp(coreState.pricingRules.perKmFare)}/km`,
      isOpen: isOpen,
      openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
      openHour: '07:00',
      closeHour: '21:00',
      products: [
        { id: 'p1', name: 'Beras Ramos Super (5 kg)', price: 69000, category: 'Beras', unit: 'Kemasan 5 kg', status: 'Tersedia' }
      ]
    };
    coreState.merchants.push(newMerchant);
    showToast(`Mitra usaha ${name} berhasil didaftarkan ke platform.`);
  }

  saveCoreState();
  document.getElementById('modalMerchantForm').classList.add('hidden');
  renderMerchantsTab();
}

window.deleteMerchant = function(merchId) {
  const merch = coreState.merchants.find(m => m.id === merchId);
  if (!merch) return;

  if (confirm(`Apakah Anda yakin ingin menghapus mitra usaha "${merch.name}"?`)) {
    coreState.merchants = coreState.merchants.filter(m => m.id !== merchId);
    saveCoreState();
    showToast(`Mitra usaha ${merch.name} telah dihapus.`);
    renderMerchantsTab();
  }
};

// =========================================================================
// 4. MODUL 3: CRUD MITRA KURIR (DRIVERS)
// =========================================================================
function renderDriversTab() {
  const drivers = coreState.drivers || [];
  const tbody = document.getElementById('tbodyDriversList');

  if (drivers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted" style="padding: 32px;">
          Belum ada mitra kurir yang terdaftar. Klik "+ Tambah Mitra Kurir" untuk mendaftarkan pengemudi.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = drivers.map(d => {
    const isOnline = d.isOnline !== false;

    return `
      <tr>
        <td class="font-mono text-xs">${d.id}</td>
        <td>
          <div class="font-bold">${d.name}</div>
        </td>
        <td>
          <div class="text-xs font-semibold">${d.phone || '-'}</div>
        </td>
        <td>
          <div class="text-xs">${d.vehicle || 'Sepeda Motor'}</div>
          <div class="font-mono text-xs text-muted font-bold">${d.plateNumber || '-'}</div>
        </td>
        <td>
          <button class="status-pill ${isOnline ? 'status-open' : 'status-closed'}" style="cursor: pointer;" onclick="toggleDriverOnlineStatus('${d.id}')" title="Klik untuk ubah status online/offline">
            ${isOnline ? 'Online (Siap Tugas)' : 'Offline (Istirahat)'}
          </button>
        </td>
        <td class="font-mono font-bold" style="color: #059669;">
          ${formatRp(d.earnings || 0)}
        </td>
        <td class="font-mono font-bold" style="color: #D97706;">
          ${formatRp(d.cashHeld || 0)}
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action" onclick="openEditDriverModal('${d.id}')" title="Ubah data kurir">
              Edit
            </button>
            <button class="btn-icon-action danger" onclick="deleteDriver('${d.id}')" title="Hapus mitra kurir">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleDriverOnlineStatus = function(driverId) {
  const driver = coreState.drivers.find(d => d.id === driverId);
  if (!driver) return;
  driver.isOnline = !driver.isOnline;

  // Sync to primary active driver if matched
  if (coreState.driver && coreState.driver.id === driverId) {
    coreState.driver.isOnline = driver.isOnline;
  }

  saveCoreState();
  showToast(`Status kurir ${driver.name} diubah menjadi ${driver.isOnline ? 'Online' : 'Offline'}.`);
  renderDriversTab();
};

window.openAddDriverModal = function() {
  document.getElementById('modalDriverTitle').textContent = 'Tambah Mitra Kurir Baru';
  document.getElementById('editDriverId').value = '';
  document.getElementById('inputDriverName').value = '';
  document.getElementById('inputDriverPhone').value = '';
  document.getElementById('inputDriverPlate').value = '';
  document.getElementById('inputDriverVehicle').value = '';
  document.getElementById('inputDriverOnline').value = 'true';
  document.getElementById('modalDriverForm').classList.remove('hidden');
};

window.openEditDriverModal = function(driverId) {
  const driver = coreState.drivers.find(d => d.id === driverId);
  if (!driver) return;

  document.getElementById('modalDriverTitle').textContent = `Edit Mitra Kurir: ${driver.name}`;
  document.getElementById('editDriverId').value = driver.id;
  document.getElementById('inputDriverName').value = driver.name || '';
  document.getElementById('inputDriverPhone').value = driver.phone || '';
  document.getElementById('inputDriverPlate').value = driver.plateNumber || '';
  document.getElementById('inputDriverVehicle').value = driver.vehicle || '';
  document.getElementById('inputDriverOnline').value = driver.isOnline !== false ? 'true' : 'false';

  document.getElementById('modalDriverForm').classList.remove('hidden');
};

function handleSaveDriver(e) {
  e.preventDefault();
  const id = document.getElementById('editDriverId').value;
  const name = document.getElementById('inputDriverName').value.trim();
  const phone = document.getElementById('inputDriverPhone').value.trim();
  const plateNumber = document.getElementById('inputDriverPlate').value.trim();
  const vehicle = document.getElementById('inputDriverVehicle').value.trim();
  const isOnline = document.getElementById('inputDriverOnline').value === 'true';

  if (!coreState.drivers) coreState.drivers = [];

  if (id) {
    // Edit existing
    const driver = coreState.drivers.find(d => d.id === id);
    if (driver) {
      driver.name = name;
      driver.phone = phone;
      driver.plateNumber = plateNumber;
      driver.vehicle = vehicle;
      driver.isOnline = isOnline;

      if (coreState.driver && coreState.driver.id === id) {
        coreState.driver.name = name;
        coreState.driver.phone = phone;
        coreState.driver.plateNumber = plateNumber;
        coreState.driver.vehicle = vehicle;
        coreState.driver.isOnline = isOnline;
      }
      showToast(`Data kurir ${name} berhasil diperbarui.`);
    }
  } else {
    // Create new
    const newId = 'drv-' + (coreState.drivers.length + 1).toString().padStart(2, '0');
    const newDriver = {
      id: newId,
      name: name,
      phone: phone,
      plateNumber: plateNumber,
      vehicle: vehicle,
      isOnline: isOnline,
      earnings: 0,
      cashHeld: 0
    };
    coreState.drivers.push(newDriver);
    showToast(`Mitra kurir ${name} berhasil didaftarkan ke armada.`);
  }

  saveCoreState();
  document.getElementById('modalDriverForm').classList.add('hidden');
  renderDriversTab();
}

window.deleteDriver = function(driverId) {
  const driver = coreState.drivers.find(d => d.id === driverId);
  if (!driver) return;

  if (confirm(`Apakah Anda yakin ingin menghapus kurir "${driver.name}"?`)) {
    coreState.drivers = coreState.drivers.filter(d => d.id !== driverId);
    if (coreState.driver && coreState.driver.id === driverId && coreState.drivers.length > 0) {
      coreState.driver = coreState.drivers[0];
    }
    saveCoreState();
    showToast(`Mitra kurir ${driver.name} telah dihapus.`);
    renderDriversTab();
  }
};

// =========================================================================
// 5. MODUL 4: CONFIG DYNAMIC PRICING ENGINE
// =========================================================================
function renderSettingsTab() {
  const rules = coreState.pricingRules || DEFAULT_INITIAL_DATA.pricingRules;
  document.getElementById('cfgPerKmFare').value = rules.perKmFare;
  document.getElementById('cfgBaseMinFare').value = rules.baseMinFare;
  document.getElementById('cfgFlatMaxKm').value = rules.flatMaxKm;
  document.getElementById('cfgFlatRate').value = rules.flatRate;
  document.getElementById('cfgPlatformFee').value = rules.platformFee;
}

function handleSavePricingRules() {
  const perKmFare = parseInt(document.getElementById('cfgPerKmFare').value) || 2000;
  const baseMinFare = parseInt(document.getElementById('cfgBaseMinFare').value) || 8000;
  const flatMaxKm = parseInt(document.getElementById('cfgFlatMaxKm').value) || 10;
  const flatRate = parseInt(document.getElementById('cfgFlatRate').value) || 5000;
  const platformFee = parseInt(document.getElementById('cfgPlatformFee').value) || 1000;

  coreState.pricingRules = {
    perKmFare,
    baseMinFare,
    flatMaxKm,
    flatRate,
    platformFee
  };

  // Update rule text in merchants
  (coreState.merchants || []).forEach(m => {
    if (m.pricingType === 'custom_flat') {
      m.pricingRuleText = `Skema Khusus: 0–${flatMaxKm} km Flat ${formatRp(flatRate)}`;
    } else {
      m.pricingRuleText = `Skema Reguler: Min ${formatRp(baseMinFare)}, ${formatRp(perKmFare)}/km`;
    }
  });

  saveCoreState();
  showToast('Konfigurasi Dynamic Pricing Engine berhasil disimpan & diterapkan.');
  renderTransactionsTab();
  renderMerchantsTab();
}

// =========================================================================
// 6. RENDER ALL & EVENT LISTENERS
// =========================================================================
function renderAllViews() {
  renderTransactionsTab();
  renderMerchantsTab();
  renderDriversTab();
  renderSettingsTab();
}

document.addEventListener('DOMContentLoaded', () => {
  // Check if embedded in Simulator Iframe
  if (window.self !== window.top) {
    const simNavBtn = document.getElementById('btnBackToSimulator');
    if (simNavBtn) simNavBtn.style.display = 'none';
  }

  // Navigation Tabs
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

  // Filter Transaction Listeners
  document.getElementById('filterOrderQuery').addEventListener('input', (e) => {
    filterOrderQuery = e.target.value;
    renderTransactionsTab();
  });

  document.getElementById('filterOrderStatus').addEventListener('change', (e) => {
    filterOrderStatus = e.target.value;
    renderTransactionsTab();
  });

  // Modal Closers
  document.getElementById('btnCloseOrderDetail').addEventListener('click', () => {
    document.getElementById('modalOrderDetail').classList.add('hidden');
  });
  document.getElementById('btnDismissOrderDetail').addEventListener('click', () => {
    document.getElementById('modalOrderDetail').classList.add('hidden');
  });

  document.getElementById('btnOpenAddMerchantModal').addEventListener('click', openAddMerchantModal);
  document.getElementById('btnCloseMerchantModal').addEventListener('click', () => {
    document.getElementById('modalMerchantForm').classList.add('hidden');
  });
  document.getElementById('btnCancelMerchantModal').addEventListener('click', () => {
    document.getElementById('modalMerchantForm').classList.add('hidden');
  });
  document.getElementById('formMerchant').addEventListener('submit', handleSaveMerchant);

  document.getElementById('btnOpenAddDriverModal').addEventListener('click', openAddDriverModal);
  document.getElementById('btnCloseDriverModal').addEventListener('click', () => {
    document.getElementById('modalDriverForm').classList.add('hidden');
  });
  document.getElementById('btnCancelDriverModal').addEventListener('click', () => {
    document.getElementById('modalDriverForm').classList.add('hidden');
  });
  document.getElementById('formDriver').addEventListener('submit', handleSaveDriver);

  // Settings Save
  document.getElementById('btnSavePricingRules').addEventListener('click', handleSavePricingRules);

  // Reset Engine Handlers
  const btnResetTx = document.getElementById('btnAdminResetTransactions');
  if (btnResetTx) {
    btnResetTx.addEventListener('click', () => {
      if (confirm('Kosongkan seluruh data transaksi, pesanan berjalan, dan buku kas COD? (Data mitra toko dan kurir tetap dipertahankan)')) {
        if (typeof window !== 'undefined' && window.resetTransactionsOnly) {
          coreState = window.resetTransactionsOnly();
        } else {
          coreState.orders = [];
          coreState.activeOrderId = null;
          if (coreState.driver) { coreState.driver.earnings = 0; coreState.driver.cashHeld = 0; }
          if (coreState.drivers) coreState.drivers.forEach(d => { d.earnings = 0; d.cashHeld = 0; });
          saveCoreState(true, 'RESET_TRANSACTIONS');
        }
        showToast('Seluruh data transaksi dan saldo kas telah dikosongkan.');
        renderAllViews();
      }
    });
  }

  const btnResetAll = document.getElementById('btnAdminResetAll');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      if (confirm('PERINGATAN: Kembalikan seluruh ekosistem ke konfigurasi standar pabrik (3 toko default, katalog sembako, 3 kurir, dan tanpa transaksi)?')) {
        if (typeof window !== 'undefined' && window.resetAllDataToDefault) {
          coreState = window.resetAllDataToDefault();
        } else {
          localStorage.removeItem('lokalkirim_clean_state');
          coreState = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
          saveCoreState(true, 'RESET_ALL');
        }
        showToast('Seluruh data sistem berhasil dipulihkan ke standar pabrik.');
        renderAllViews();
      }
    });
  }

  const btnResetMerchants = document.getElementById('btnAdminResetMerchants');
  if (btnResetMerchants) {
    btnResetMerchants.addEventListener('click', () => {
      if (confirm('Kembalikan daftar mitra toko ke 3 merchant bawaan (Toko Berkah, Geprek Juara, Apotek Sehat)?')) {
        if (typeof window !== 'undefined' && window.resetMerchantsOnlyToDefault) {
          coreState = window.resetMerchantsOnlyToDefault();
        }
        showToast('Daftar mitra toko berhasil dipulihkan ke default.');
        renderAllViews();
      }
    });
  }

  const btnResetDrivers = document.getElementById('btnAdminResetDrivers');
  if (btnResetDrivers) {
    btnResetDrivers.addEventListener('click', () => {
      if (confirm('Kembalikan armada pengemudi ke 3 mitra kurir standar (Budi, Agus, Dedi)?')) {
        if (typeof window !== 'undefined' && window.resetDriversOnlyToDefault) {
          coreState = window.resetDriversOnlyToDefault();
        }
        showToast('Armada mitra kurir berhasil dipulihkan ke default.');
        renderAllViews();
      }
    });
  }

  // Initial Render
  renderAllViews();

  // Listen to cross-role updates via BroadcastChannel
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        coreState = event.data.payload;
        if (!coreState.drivers || coreState.drivers.length === 0) {
          coreState.drivers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.drivers));
        }
        renderAllViews();
      }
    };
  }

  // Listen via Storage Event
  window.addEventListener('storage', (event) => {
    if (event.key === 'lokalkirim_clean_state' && event.newValue) {
      try {
        coreState = JSON.parse(event.newValue);
        if (!coreState.drivers || coreState.drivers.length === 0) {
          coreState.drivers = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA.drivers));
        }
        renderAllViews();
      } catch (e) {}
    }
  });
});

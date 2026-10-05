/**
 * GoMitra / LokalKirim - Aplikasi Pelanggan (Customer PWA)
 * Mencontoh refrensi style abunawas-store.vercel.app
 * Fitur: Katalog, Filter Kategori, Keranjang Belanja, Input Alamat, Kalkulator Ongkir, & Pembayaran
 */

// =========================================================================
// 1. DATA KATALOG PRODUK SEMBAKO (ABUNAWAS STYLE)
// =========================================================================
const DEFAULT_CATALOG_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Beras Ramos Super Premium',
    category: 'Beras',
    unit: 'Kemasan 5 kg',
    price: 69000,
    status: 'Tersedia',
    iconType: 'rice'
  },
  {
    id: 'prod-02',
    name: 'Beras Pandan Wangi Cianjur',
    category: 'Beras',
    unit: 'Kemasan 5 kg',
    price: 78000,
    status: 'Tersedia',
    iconType: 'rice'
  },
  {
    id: 'prod-03',
    name: 'Minyak Goreng SunCo Pouch',
    category: 'Minyak Goreng',
    unit: 'Kemasan 2 Liter',
    price: 36000,
    status: 'Tersedia',
    iconType: 'oil'
  },
  {
    id: 'prod-04',
    name: 'Minyak Goreng Bimoli Klasik',
    category: 'Minyak Goreng',
    unit: 'Kemasan 2 Liter',
    price: 37500,
    status: 'Tersedia',
    iconType: 'oil'
  },
  {
    id: 'prod-05',
    name: 'Gula Pasir Kristal Putih Gulaku',
    category: 'Gula & Tepung',
    unit: 'Kemasan 1 kg',
    price: 17500,
    status: 'Tersedia',
    iconType: 'sugar'
  },
  {
    id: 'prod-06',
    name: 'Tepung Terigu Segitiga Biru',
    category: 'Gula & Tepung',
    unit: 'Kemasan 1 kg',
    price: 13000,
    status: 'Tersedia',
    iconType: 'flour'
  },
  {
    id: 'prod-07',
    name: 'Telur Ayam Negeri Segar',
    category: 'Kebutuhan Dapur',
    unit: 'Tray / Pack 1 kg',
    price: 28000,
    status: 'Tersedia',
    iconType: 'egg'
  },
  {
    id: 'prod-08',
    name: 'Kecap Manis Bango Botol',
    category: 'Kebutuhan Dapur',
    unit: 'Botol 550 ml',
    price: 23000,
    status: 'Tersedia',
    iconType: 'sauce'
  },
  {
    id: 'prod-09',
    name: 'Garam Dapur Beriodium Daun',
    category: 'Kebutuhan Dapur',
    unit: 'Bungkus 500 gram',
    price: 4500,
    status: 'Tersedia',
    iconType: 'salt'
  },
  {
    id: 'prod-10',
    name: 'Paket Sembako Berkah Dapur Hemat',
    category: 'Paket Hemat',
    unit: 'Beras 5kg + Minyak 2L + Gula 1kg',
    price: 119000,
    status: 'Terlaris',
    iconType: 'package'
  }
];

const CATEGORIES = ['Semua', 'Beras', 'Minyak Goreng', 'Gula & Tepung', 'Kebutuhan Dapur', 'Paket Hemat'];

// SVG Icons Generator for Product Thumbnails
function getProductSvg(type) {
  switch (type) {
    case 'rice':
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a9 9 0 0 0-9 9c0 6 9 11 9 11s9-5 9-11a9 9 0 0 0-9-9z"></path><path d="M12 6v6"></path><path d="M9 9h6"></path></svg>`;
    case 'oil':
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6v3H9z"></path><path d="M6 8h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"></path><line x1="12" y1="12" x2="12" y2="16"></line></svg>`;
    case 'sugar':
    case 'flour':
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="6" width="16" height="15" rx="2"></rect><path d="M8 2h8v4H8z"></path><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="15" x2="13" y2="15"></line></svg>`;
    case 'egg':
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="13" rx="7" ry="9"></ellipse><line x1="12" y1="7" x2="12" y2="19"></line></svg>`;
    case 'sauce':
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2h4v4h-4z"></path><path d="M8 8l1 13h6l1-13H8z"></path></svg>`;
    default:
      return `<svg class="product-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  }
}

// =========================================================================
// 2. CLIENT-SIDE STATE & PRICING ENGINE (COMPATIBLE WITH SIMULATOR)
// =========================================================================
let currentCategory = 'Semua';
let searchQuery = '';
let cart = {}; // { 'prod-01': { product, qty } }
let distanceKm = 3.5;

// Broadcast channel to notify Merchant and Driver in simulator
const channel = window.BroadcastChannel ? new BroadcastChannel('lokalkirim_pwa_sim') : null;

// Pricing Rules (from PRD Section 4)
const PRICING_CONFIG = {
  flatMaxKm: 10,
  flatRate: 5000,
  perKmRate: 2000,
  platformFee: 1000
};

function formatRp(val) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

function calculateOngkir(dist) {
  if (typeof window !== 'undefined' && window.calculateSharedDeliveryFee) {
    const calc = window.calculateSharedDeliveryFee('toko-berkah', dist);
    return {
      fee: calc.ongkir,
      note: calc.calculationNote
    };
  }
  if (dist <= PRICING_CONFIG.flatMaxKm) {
    return {
      fee: PRICING_CONFIG.flatRate,
      note: `Tarif Flat Mitra: 0–${PRICING_CONFIG.flatMaxKm} km hanya ${formatRp(PRICING_CONFIG.flatRate)}`
    };
  } else {
    const extra = dist - PRICING_CONFIG.flatMaxKm;
    const fee = PRICING_CONFIG.flatRate + Math.round(extra * PRICING_CONFIG.perKmRate);
    return {
      fee: fee,
      note: `Flat ${formatRp(PRICING_CONFIG.flatRate)} + (${extra.toFixed(1)} km × ${formatRp(PRICING_CONFIG.perKmRate)}/km)`
    };
  }
}

// =========================================================================
// 3. UI RENDERING
// =========================================================================

// Render Category Filter Pills
function renderCategories() {
  const container = document.getElementById('categoryList');
  container.innerHTML = CATEGORIES.map(cat => `
    <button class="category-pill ${cat === currentCategory ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

window.selectCategory = function(cat) {
  currentCategory = cat;
  renderCategories();
  renderProducts();
};

function getCatalogProducts() {
  const state = (typeof window !== 'undefined' && window.loadSharedState) 
    ? window.loadSharedState() 
    : null;

  if (state && state.merchants && state.merchants[0] && state.merchants[0].products && state.merchants[0].products.length > 0) {
    return state.merchants[0].products.map(p => ({
      ...p,
      iconType: p.iconType || (p.category === 'Beras' ? 'rice' : (p.category === 'Minyak Goreng' ? 'oil' : (p.category === 'Gula & Tepung' ? 'sugar' : (p.category === 'Kebutuhan Dapur' ? (p.name.includes('Telur') ? 'egg' : 'sauce') : 'package'))))
    }));
  }

  const saved = localStorage.getItem('lokalkirim_clean_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.merchants && parsed.merchants[0] && parsed.merchants[0].products && parsed.merchants[0].products.length > 0) {
        return parsed.merchants[0].products.map(p => ({
          ...p,
          iconType: p.iconType || (p.category === 'Beras' ? 'rice' : (p.category === 'Minyak Goreng' ? 'oil' : (p.category === 'Gula & Tepung' ? 'sugar' : (p.category === 'Kebutuhan Dapur' ? (p.name.includes('Telur') ? 'egg' : 'sauce') : 'package'))))
        }));
      }
    } catch (e) {}
  }
  return (typeof window !== 'undefined' && window.LOKALKIRIM_DEFAULT_PRODUCTS) 
    ? window.LOKALKIRIM_DEFAULT_PRODUCTS 
    : DEFAULT_CATALOG_PRODUCTS;
}

// Render Products Grid
function renderProducts() {
  const container = document.getElementById('productGrid');
  const counter = document.getElementById('catalogCounter');
  const products = getCatalogProducts();

  let filtered = products.filter(p => {
    const matchCat = currentCategory === 'Semua' || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  counter.textContent = `Menampilkan ${filtered.length} produk`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-title">Produk Tidak Ditemukan</div>
        <div class="text-xs text-muted">Coba gunakan kata kunci pencarian atau kategori lain.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => {
    const inCartQty = cart[prod.id] ? cart[prod.id].qty : 0;

    let actionBtnHtml = '';
    if (inCartQty === 0) {
      actionBtnHtml = `
        <button class="btn-add-cart" onclick="updateCartItem('${prod.id}', 1)">
          Tambah
        </button>
      `;
    } else {
      actionBtnHtml = `
        <div class="card-qty-controller">
          <button class="card-qty-btn" onclick="updateCartItem('${prod.id}', -1)">&minus;</button>
          <span class="card-qty-number">${inCartQty}</span>
          <button class="card-qty-btn" onclick="updateCartItem('${prod.id}', 1)">&plus;</button>
        </div>
      `;
    }

    return `
      <div class="product-card">
        <div class="product-thumb-container">
          <span class="product-status-tag">${prod.status}</span>
          ${getProductSvg(prod.iconType)}
        </div>
        <div class="product-body">
          <div class="product-cat">${prod.category}</div>
          <h4 class="product-title">${prod.name}</h4>
          <div class="product-unit">${prod.unit}</div>
          <div class="product-footer">
            <div class="product-price-val">${formatRp(prod.price)}</div>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Update Cart
window.updateCartItem = function(prodId, delta) {
  const prod = getCatalogProducts().find(p => p.id === prodId);
  if (!prod) return;

  if (!cart[prodId]) {
    if (delta > 0) {
      cart[prodId] = { product: prod, qty: delta };
    }
  } else {
    cart[prodId].qty += delta;
    if (cart[prodId].qty <= 0) {
      delete cart[prodId];
    }
  }

  saveCart();
  renderProducts();
  updateCartCounters();
  renderDrawerCart();
};

function saveCart() {
  localStorage.setItem('lokalkirim_customer_cart', JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem('lokalkirim_customer_cart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
    } catch (e) {
      cart = {};
    }
  }
}

// Update badges and floating bottom bar
function updateCartCounters() {
  const items = Object.values(cart);
  const totalCount = items.reduce((acc, it) => acc + it.qty, 0);
  const subtotal = items.reduce((acc, it) => acc + (it.product.price * it.qty), 0);

  // Top nav counter badge (desktop & fallback)
  const deskBadge = document.getElementById('cartDeskBadge');
  if (deskBadge) deskBadge.textContent = totalCount;

  const legacyBadge = document.getElementById('cartBadgeCount');
  if (legacyBadge) legacyBadge.textContent = totalCount;

  // Mobile bottom nav counter badge
  const mobileBadge = document.getElementById('cartMobileBadge');
  if (mobileBadge) mobileBadge.textContent = totalCount;

  // Floating bottom bar (Desktop / Tablet fallback)
  const floatCart = document.getElementById('floatingCart');
  if (floatCart) {
    if (totalCount > 0) {
      floatCart.classList.remove('hidden');
      const countEl = document.getElementById('floatCartItemCount');
      if (countEl) countEl.textContent = `${totalCount} Produk Dipilih`;
      const priceEl = document.getElementById('floatCartTotalPrice');
      if (priceEl) priceEl.textContent = formatRp(subtotal);
    } else {
      floatCart.classList.add('hidden');
    }
  }

  // Drawer badge
  const drawerBadge = document.getElementById('drawerItemBadge');
  if (drawerBadge) drawerBadge.textContent = `${totalCount} Item`;

  // Update active order indicator dot on mobile bottom nav
  updateOrderActiveDot();
}

function updateOrderActiveDot() {
  const dot = document.getElementById('orderActiveDot');
  if (!dot) return;
  const state = (typeof window !== 'undefined' && window.loadSharedState)
    ? window.loadSharedState()
    : { orders: [] };
  const hasActive = (state.orders || []).some(o => o.status !== 'COMPLETED');
  if (hasActive) {
    dot.classList.remove('hidden');
  } else {
    dot.classList.add('hidden');
  }
}

// Render Cart Drawer
function renderDrawerCart() {
  const listContainer = document.getElementById('cartItemList');
  const items = Object.values(cart);

  if (items.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state text-xs">
        <div class="empty-title">Keranjang Belanja Kosong</div>
        <div class="text-muted">Pilih produk sembako dari katalog terlebih dahulu.</div>
      </div>
    `;
  } else {
    listContainer.innerHTML = items.map(it => `
      <div class="cart-row-item">
        <div class="cart-row-info">
          <div class="cart-row-title">${it.product.name}</div>
          <div class="cart-row-price">${formatRp(it.product.price)} / ${it.product.unit}</div>
        </div>
        <div class="cart-row-controls">
          <button class="btn-cart-qty" onclick="updateCartItem('${it.product.id}', -1)">&minus;</button>
          <span class="cart-qty-text">${it.qty}</span>
          <button class="btn-cart-qty" onclick="updateCartItem('${it.product.id}', 1)">&plus;</button>
        </div>
      </div>
    `).join('');
  }

  // Recalculate bill summary
  const subtotal = items.reduce((acc, it) => acc + (it.product.price * it.qty), 0);
  const ongkirCalc = calculateOngkir(distanceKm);

  document.getElementById('billSubtotal').textContent = formatRp(subtotal);
  document.getElementById('billOngkir').textContent = formatRp(ongkirCalc.fee);
  document.getElementById('billTotal').textContent = formatRp(subtotal + ongkirCalc.fee);
  document.getElementById('ongkirRuleAlert').textContent = ongkirCalc.note;
}

// Open / Close Drawer
function openCartDrawer() {
  document.getElementById('drawerBackdrop').classList.add('active');
  document.getElementById('cartDrawer').classList.add('open');
  renderDrawerCart();
}

function closeCartDrawer() {
  document.getElementById('drawerBackdrop').classList.remove('active');
  document.getElementById('cartDrawer').classList.remove('open');
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
// 4. CHECKOUT & INTEGRASI SISTEM MITRA / SIMULATOR
// =========================================================================
function handleCheckout(isWhatsAppDirect = false) {
  const items = Object.values(cart);
  if (items.length === 0) {
    showToast('Keranjang masih kosong.');
    return;
  }

  const custName = document.getElementById('inputCustomerName').value.trim();
  const custPhone = document.getElementById('inputCustomerPhone').value.trim();
  const custAddress = document.getElementById('inputCustomerAddress').value.trim();
  const payMethodInput = document.querySelector('input[name="payMethod"]:checked');
  const payMethod = payMethodInput ? payMethodInput.value : 'COD';

  if (!custName || !custAddress) {
    showToast('Harap lengkapi nama penerima dan alamat pengantaran.');
    return;
  }

  const subtotal = items.reduce((acc, it) => acc + (it.product.price * it.qty), 0);
  const ongkir = calculateOngkir(distanceKm).fee;
  const total = subtotal + ongkir;
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  // If WhatsApp direct is requested
  if (isWhatsAppDirect) {
    let waText = `Halo Toko Berkah Kelontong, saya ingin memesan sembako:\n\n`;
    waText += `*Detail Pesanan #${orderId}:*\n`;
    items.forEach((it, idx) => {
      waText += `${idx + 1}. ${it.product.name} (${it.qty}x) = ${formatRp(it.product.price * it.qty)}\n`;
    });
    waText += `\n*Subtotal:* ${formatRp(subtotal)}\n`;
    waText += `*Ongkir (${distanceKm} km):* ${formatRp(ongkir)}\n`;
    waText += `*Total Pembayaran:* ${formatRp(total)}\n`;
    waText += `*Metode:* ${payMethod}\n\n`;
    waText += `*Penerima:* ${custName}\n`;
    waText += `*WhatsApp:* ${custPhone}\n`;
    waText += `*Alamat Pengantaran:* ${custAddress}\n\n`;
    waText += `Mohon konfirmasi ketersediaan dan pengantaran kurir. Terima kasih.`;

    const encoded = encodeURIComponent(waText);
    window.open(`https://wa.me/6281288776655?text=${encoded}`, '_blank');
  }

  // Push Order into Core State (Shared with Merchant Portal & Driver App)
  let coreState = null;
  const savedCore = localStorage.getItem('lokalkirim_clean_state');
  if (savedCore) {
    try {
      coreState = JSON.parse(savedCore);
    } catch (e) {
      coreState = null;
    }
  }

  if (!coreState) {
    coreState = {
      orders: [],
      activeOrderId: null,
      driver: { id: 'drv-01', name: 'Budi Santoso', earnings: 0, cashHeld: 0 }
    };
  }

  const activeMerch = (coreState.merchants && coreState.merchants[0]) ? coreState.merchants[0] : null;

  const newOrder = {
    id: orderId,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    merchantId: activeMerch ? activeMerch.id : 'toko-berkah',
    merchantName: activeMerch ? activeMerch.name : 'Toko Berkah Kelontong',
    merchantAddress: activeMerch ? activeMerch.address : 'Jl. Mawar No. 12, Sektor 4',
    customerName: custName,
    customerPhone: custPhone,
    customerAddress: custAddress,
    distanceKm: distanceKm,
    items: items.map(it => ({
      id: it.product.id,
      name: it.product.name,
      price: it.product.price,
      qty: it.qty
    })),
    subtotal: subtotal,
    deliveryFee: ongkir,
    driverNetEarnings: ongkir - PRICING_CONFIG.platformFee,
    platformFee: PRICING_CONFIG.platformFee,
    totalBill: total,
    paymentMethod: payMethod,
    status: 'PENDING'
  };

  if (!coreState.orders) coreState.orders = [];
  coreState.orders.unshift(newOrder);
  coreState.activeOrderId = newOrder.id;

  localStorage.setItem('lokalkirim_clean_state', JSON.stringify(coreState));

  if (channel) {
    channel.postMessage({ type: 'STATE_UPDATE', payload: coreState });
  }

  // Clear Cart
  cart = {};
  saveCart();
  updateCartCounters();
  renderProducts();
  closeCartDrawer();

  // Show Success Receipt Modal
  document.getElementById('successOrderId').textContent = '#' + orderId;
  document.getElementById('receiptCustomerName').textContent = custName;
  document.getElementById('receiptAddress').textContent = custAddress;
  document.getElementById('receiptTotal').textContent = formatRp(total);
  document.getElementById('receiptPaymentMethod').textContent = payMethod === 'COD' ? 'Bayar di Tempat (COD)' : 'QRIS / Transfer';
  document.getElementById('orderSuccessModal').classList.remove('hidden');
}

// =========================================================================
// 5. EVENT LISTENERS & BOOTSTRAP
// =========================================================================
// 5. TOKO & AUTH MANAGEMENT & ORDER HISTORY
// =========================================================================

// Synchronize Store Identity, Address & Operational Schedule
function updateStoreInfo() {
  const state = (typeof window !== 'undefined' && window.loadSharedState)
    ? window.loadSharedState()
    : null;

  const merchant = (state && state.merchants && state.merchants.length > 0)
    ? state.merchants[0]
    : {
        name: 'Toko Berkah Kelontong',
        address: 'Jl. Mawar No. 12, Sektor 4, Komplek Niaga Mandiri',
        openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        openHour: '07:00',
        closeHour: '21:00',
        isOpen: true
      };

  const nameEl = document.getElementById('storeDisplayName');
  if (nameEl) nameEl.textContent = merchant.name || 'Toko Berkah Kelontong';

  const addrEl = document.getElementById('storeDisplayAddress');
  if (addrEl) addrEl.textContent = merchant.address || '-';

  const schedEl = document.getElementById('storeDisplaySchedule');
  if (schedEl) {
    let daysText = 'Setiap Hari';
    if (merchant.openDays && merchant.openDays.length > 0) {
      if (merchant.openDays.length === 7) {
        daysText = 'Setiap Hari';
      } else if (merchant.openDays.length === 6 && !merchant.openDays.includes('Minggu')) {
        daysText = 'Senin – Sabtu';
      } else {
        daysText = merchant.openDays.join(', ');
      }
    }
    const hoursText = (merchant.openHour && merchant.closeHour)
      ? `${merchant.openHour} – ${merchant.closeHour}`
      : '07:00 – 21:00';
    schedEl.innerHTML = `${daysText} &bull; ${hoursText}`;
  }

  const badgeEl = document.getElementById('storeStatusBadge');
  const textEl = document.getElementById('storeStatusText');
  if (badgeEl && textEl) {
    if (merchant.isOpen !== false) {
      badgeEl.className = 'store-status-badge open';
      textEl.textContent = 'Toko Buka';
    } else {
      badgeEl.className = 'store-status-badge closed';
      textEl.textContent = 'Toko Tutup';
    }
  }
}

// Customer Auth Management (Login / Profile State)
const CUSTOMER_AUTH_KEY = 'lokalkirim_customer_auth';

function getCustomerAuth() {
  const saved = localStorage.getItem(CUSTOMER_AUTH_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    isLoggedIn: false,
    name: 'Ibu Siti Aminah',
    phone: '0812-9876-5432',
    address: 'Jl. Melati Indah No. 18, RT 03/RW 05'
  };
}

function saveCustomerAuth(auth) {
  localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(auth));
  updateCustomerAuthUI();
}

function updateCustomerAuthUI() {
  const auth = getCustomerAuth();
  const btnDeskAuth = document.getElementById('btnDeskAuth');
  const labelMobileAuth = document.getElementById('labelMobileAuth');

  if (auth.isLoggedIn) {
    const shortName = (auth.name || 'Profil').split(' ')[0];
    if (btnDeskAuth) {
      btnDeskAuth.textContent = `Profil (${shortName})`;
      btnDeskAuth.classList.add('active');
    }
    if (labelMobileAuth) labelMobileAuth.textContent = 'Profil';

    const inputName = document.getElementById('inputCustomerName');
    const inputPhone = document.getElementById('inputCustomerPhone');
    const inputAddr = document.getElementById('inputCustomerAddress');
    if (inputName && auth.name) inputName.value = auth.name;
    if (inputPhone && auth.phone) inputPhone.value = auth.phone;
    if (inputAddr && auth.address) inputAddr.value = auth.address;
  } else {
    if (btnDeskAuth) {
      btnDeskAuth.textContent = 'Login';
      btnDeskAuth.classList.remove('active');
    }
    if (labelMobileAuth) labelMobileAuth.textContent = 'Login';
  }
}

function handleCustomerAuthClick() {
  const auth = getCustomerAuth();
  if (auth.isLoggedIn) {
    document.getElementById('profileViewName').textContent = auth.name;
    document.getElementById('profileViewPhone').textContent = auth.phone;
    document.getElementById('profileAvatarText').textContent = ((auth.name && auth.name.charAt(0)) || 'U').toUpperCase();
    document.getElementById('profileEditAddress').value = auth.address || '';
    document.getElementById('modalCustomerProfile').classList.remove('hidden');
  } else {
    document.getElementById('loginInputName').value = auth.name || '';
    document.getElementById('loginInputPhone').value = auth.phone || '';
    document.getElementById('modalCustomerLogin').classList.remove('hidden');
  }
}

// Customer Orders History Modal
function openCustomerOrdersModal() {
  const state = (typeof window !== 'undefined' && window.loadSharedState)
    ? window.loadSharedState()
    : { orders: [] };

  const container = document.getElementById('customerOrdersContainer');
  const orders = state.orders || [];

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 12px; text-align: center;">
        <div class="font-bold text-sm">Belum Ada Transaksi</div>
        <div class="text-xs text-muted mt-1">Pesanan yang Anda buat akan tercatat di sini secara real-time.</div>
      </div>
    `;
  } else {
    const sorted = [...orders].reverse();
    container.innerHTML = sorted.map(order => {
      let statusLabel = 'Menunggu Konfirmasi';
      let statusBg = '#FEF3C7';
      let statusColor = '#B45309';

      switch (order.status) {
        case 'PREPARING':
          statusLabel = 'Sedang Disiapkan Toko';
          statusBg = '#DBEAFE';
          statusColor = '#1D4ED8';
          break;
        case 'READY_FOR_PICKUP':
          statusLabel = 'Siap Diambil Kurir';
          statusBg = '#FEF3C7';
          statusColor = '#B45309';
          break;
        case 'DRIVER_ACCEPTED':
          statusLabel = 'Kurir Menuju Toko';
          statusBg = '#DBEAFE';
          statusColor = '#1D4ED8';
          break;
        case 'ON_THE_WAY':
          statusLabel = 'Dalam Pengantaran Kurir';
          statusBg = '#EDE9FE';
          statusColor = '#6D28D9';
          break;
        case 'COMPLETED':
          statusLabel = 'Selesai Tuntas';
          statusBg = '#DCFCE7';
          statusColor = '#15803D';
          break;
      }

      const itemsSummary = (order.items || []).map(i => `${i.product ? i.product.name : 'Barang'} (${i.qty}x)`).join(', ') || '1x Pesanan Sembako';

      return `
        <div class="cust-order-card">
          <div class="cust-order-header">
            <span class="cust-order-id">#${order.id}</span>
            <span class="cust-order-time">${order.storeName || 'Toko Berkah'}</span>
          </div>
          <span class="cust-order-status" style="background: ${statusBg}; color: ${statusColor};">
            ${statusLabel}
          </span>
          <div class="cust-order-items">
            ${itemsSummary}
          </div>
          <div class="cust-order-footer">
            <div class="cust-order-total">${formatRp(order.totalAmount || (order.subtotal + (order.shippingFee || 5000)))}</div>
            <button class="btn btn-outline-dark btn-sm" onclick="trackSingleOrder('${order.id}')">
              Lacak Pesanan
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('modalCustomerOrders').classList.remove('hidden');
}

window.trackSingleOrder = function(orderId) {
  const state = (typeof window !== 'undefined' && window.loadSharedState)
    ? window.loadSharedState()
    : { orders: [] };

  const order = (state.orders || []).find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modalCustomerOrders').classList.add('hidden');

  document.getElementById('successOrderId').textContent = '#' + order.id;
  document.getElementById('receiptCustomerName').textContent = order.customerName || '-';
  document.getElementById('receiptAddress').textContent = order.customerAddress || '-';
  document.getElementById('receiptTotal').textContent = formatRp(order.totalAmount || (order.subtotal + (order.shippingFee || 5000)));
  document.getElementById('receiptPaymentMethod').textContent = order.paymentMethod === 'COD' ? 'Bayar di Tempat (COD)' : 'QRIS / Transfer';
  updateReceiptTrackingStatus(order);
  document.getElementById('orderSuccessModal').classList.remove('hidden');
};

// =========================================================================
// 6. EVENT LISTENERS & BOOTSTRAP
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderCategories();
  renderProducts();
  updateCartCounters();
  updateStoreInfo();
  updateCustomerAuthUI();

  // Desktop Navbar triggers
  const btnDeskCart = document.getElementById('btnDeskCart');
  if (btnDeskCart) btnDeskCart.addEventListener('click', openCartDrawer);

  const btnDeskOrders = document.getElementById('btnDeskOrders');
  if (btnDeskOrders) btnDeskOrders.addEventListener('click', openCustomerOrdersModal);

  const btnDeskAuth = document.getElementById('btnDeskAuth');
  if (btnDeskAuth) btnDeskAuth.addEventListener('click', handleCustomerAuthClick);

  // Mobile Bottom Nav triggers
  const btnMobileCart = document.getElementById('btnMobileCart');
  if (btnMobileCart) btnMobileCart.addEventListener('click', openCartDrawer);

  const btnMobileOrders = document.getElementById('btnMobileOrders');
  if (btnMobileOrders) btnMobileOrders.addEventListener('click', openCustomerOrdersModal);

  const btnMobileAuth = document.getElementById('btnMobileAuth');
  if (btnMobileAuth) btnMobileAuth.addEventListener('click', handleCustomerAuthClick);

  // Drawer triggers & backdrop
  const btnOpenCart = document.getElementById('btnOpenCart');
  if (btnOpenCart) btnOpenCart.addEventListener('click', openCartDrawer);

  const btnFloatingOpenCart = document.getElementById('btnFloatingOpenCart');
  if (btnFloatingOpenCart) btnFloatingOpenCart.addEventListener('click', openCartDrawer);

  const btnCloseCart = document.getElementById('btnCloseCart');
  if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);

  const drawerBackdrop = document.getElementById('drawerBackdrop');
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeCartDrawer);

  // Modal Orders triggers
  const btnCloseOrdersModal = document.getElementById('btnCloseOrdersModal');
  if (btnCloseOrdersModal) {
    btnCloseOrdersModal.addEventListener('click', () => {
      document.getElementById('modalCustomerOrders').classList.add('hidden');
    });
  }
  const btnDismissOrdersModal = document.getElementById('btnDismissOrdersModal');
  if (btnDismissOrdersModal) {
    btnDismissOrdersModal.addEventListener('click', () => {
      document.getElementById('modalCustomerOrders').classList.add('hidden');
    });
  }

  // Modal Login triggers
  const btnCloseLoginModal = document.getElementById('btnCloseLoginModal');
  if (btnCloseLoginModal) {
    btnCloseLoginModal.addEventListener('click', () => {
      document.getElementById('modalCustomerLogin').classList.add('hidden');
    });
  }
  const btnCancelLoginModal = document.getElementById('btnCancelLoginModal');
  if (btnCancelLoginModal) {
    btnCancelLoginModal.addEventListener('click', () => {
      document.getElementById('modalCustomerLogin').classList.add('hidden');
    });
  }
  const formCustomerLogin = document.getElementById('formCustomerLogin');
  if (formCustomerLogin) {
    formCustomerLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('loginInputName').value.trim();
      const phone = document.getElementById('loginInputPhone').value.trim();
      if (!name || !phone) return;

      const currentAuth = getCustomerAuth();
      currentAuth.name = name;
      currentAuth.phone = phone;
      currentAuth.isLoggedIn = true;
      saveCustomerAuth(currentAuth);

      document.getElementById('modalCustomerLogin').classList.add('hidden');
      showToast(`Selamat datang, ${name}!`);
    });
  }

  // Modal Profile triggers
  const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
  if (btnCloseProfileModal) {
    btnCloseProfileModal.addEventListener('click', () => {
      document.getElementById('modalCustomerProfile').classList.add('hidden');
    });
  }
  const btnCustomerLogout = document.getElementById('btnCustomerLogout');
  if (btnCustomerLogout) {
    btnCustomerLogout.addEventListener('click', () => {
      const currentAuth = getCustomerAuth();
      currentAuth.isLoggedIn = false;
      saveCustomerAuth(currentAuth);
      document.getElementById('modalCustomerProfile').classList.add('hidden');
      showToast('Anda telah keluar dari akun.');
    });
  }
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const currentAuth = getCustomerAuth();
      const newAddr = document.getElementById('profileEditAddress').value.trim();
      if (newAddr) currentAuth.address = newAddr;
      saveCustomerAuth(currentAuth);
      document.getElementById('modalCustomerProfile').classList.add('hidden');
      showToast('Profil dan alamat berhasil diperbarui.');
    });
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  const btnSearchClear = document.getElementById('btnSearchClear');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery.length > 0) {
      btnSearchClear.classList.remove('hidden');
    } else {
      btnSearchClear.classList.add('hidden');
    }
    renderProducts();
  });

  btnSearchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    btnSearchClear.classList.add('hidden');
    renderProducts();
  });

  // Distance Slider
  const distanceSlider = document.getElementById('inputDistance');
  const distanceLabel = document.getElementById('labelDistance');

  distanceSlider.addEventListener('input', (e) => {
    distanceKm = parseFloat(e.target.value);
    distanceLabel.textContent = `${distanceKm.toFixed(1)} km`;
    renderDrawerCart();
  });

  // Payment radio options styling
  const paymentCards = document.querySelectorAll('.payment-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Order Submission
  document.getElementById('btnSubmitOrder').addEventListener('click', () => handleCheckout(false));
  document.getElementById('btnOrderViaWhatsApp').addEventListener('click', () => handleCheckout(true));

  // Close Success Modal
  document.getElementById('btnCloseSuccessModal').addEventListener('click', () => {
    document.getElementById('orderSuccessModal').classList.add('hidden');
  });

  // Check if embedded inside Simulator Iframe
  if (window.self !== window.top) {
    const simNavBtn = document.querySelector('.btn-outline-nav');
    if (simNavBtn) simNavBtn.style.display = 'none';
  }

  // Listen to cross-role updates from Merchant, Driver & Admin
  function handleIncomingStateUpdate(coreState, action) {
    if (action === 'RESET_TRANSACTIONS' || action === 'RESET_ALL' || !coreState.orders || coreState.orders.length === 0) {
      cart = {};
      try {
        localStorage.removeItem('lokalkirim_customer_cart');
      } catch (e) {}
      const successModal = document.getElementById('orderSuccessModal');
      if (successModal) successModal.classList.add('hidden');
    }

    renderProducts();
    updateCartCounters();
    updateStoreInfo();

    if (coreState && coreState.orders && coreState.orders.length > 0) {
      const currentId = document.getElementById('successOrderId').textContent.replace('#', '');
      const currentOrder = coreState.orders.find(o => o.id === currentId) || coreState.orders[0];
      if (currentOrder) {
        updateReceiptTrackingStatus(currentOrder);
      }
    }
  }

  if (channel) {
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'STATE_UPDATE') {
        handleIncomingStateUpdate(event.data.payload, event.data.action);
      }
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'lokalkirim_clean_state' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        handleIncomingStateUpdate(parsed, null);
      } catch (e) {}
    }
  });
});

function updateReceiptTrackingStatus(order) {
  const statusEl = document.getElementById('receiptCurrentStatus');
  if (!statusEl) return;

  switch (order.status) {
    case 'PENDING':
      statusEl.textContent = 'Menunggu Konfirmasi Toko';
      statusEl.style.background = '#FEF3C7';
      statusEl.style.color = '#B45309';
      break;
    case 'PREPARING':
      statusEl.textContent = 'Pesanan Sedang Disiapkan Toko';
      statusEl.style.background = '#DBEAFE';
      statusEl.style.color = '#1D4ED8';
      break;
    case 'READY_FOR_PICKUP':
      statusEl.textContent = 'Menunggu Penjemputan Kurir';
      statusEl.style.background = '#FEF3C7';
      statusEl.style.color = '#B45309';
      break;
    case 'DRIVER_ACCEPTED':
      statusEl.textContent = 'Kurir Menuju Lokasi Toko';
      statusEl.style.background = '#DBEAFE';
      statusEl.style.color = '#1D4ED8';
      break;
    case 'ON_THE_WAY':
      statusEl.textContent = 'Kurir Sedang Mengantar ke Rumah Anda';
      statusEl.style.background = '#EDE9FE';
      statusEl.style.color = '#6D28D9';
      break;
    case 'COMPLETED':
      statusEl.textContent = 'Pesanan Telah Selesai Diantar';
      statusEl.style.background = '#DCFCE7';
      statusEl.style.color = '#15803D';
      break;
  }
}

// Global hook for automated demo triggering from index.html (Fixed & Tested)
window.triggerDemoCustomerOrder = function() {
  const prods = getCatalogProducts();
  cart = {};
  if (prods.length > 0) {
    cart[prods[0].id] = { product: prods[0], qty: 1 };
  }
  if (prods.length > 2) {
    cart[prods[2].id] = { product: prods[2], qty: 1 };
  }
  saveCart();
  updateCartCounters();
  renderProducts();
  handleCheckout(false);
};

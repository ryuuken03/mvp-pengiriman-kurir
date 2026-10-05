/**
 * GoMitra / LokalKirim - Shared State & Master Data Sync Engine
 * Modul terpusat untuk standarisasi state, dynamic pricing, sinkronisasi antar-peran,
 * dan operasi reset data operasional sesuai AGENTS.md
 */

// =========================================================================
// 1. KONSTANTA PENYIMPANAN & CHANNEL
// =========================================================================
const LOKALKIRIM_STORAGE_KEY = 'lokalkirim_clean_state';
const LOKALKIRIM_CART_KEY = 'lokalkirim_customer_cart';
const LOKALKIRIM_CHANNEL_NAME = 'lokalkirim_pwa_sim';

// =========================================================================
// 2. MASTER DATA AWAL KANONIKAL (STANDAR OPERASIONAL)
// =========================================================================
const LOKALKIRIM_DEFAULT_PRODUCTS = [
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

const LOKALKIRIM_INITIAL_DATA = {
  merchants: [
    {
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
      products: JSON.parse(JSON.stringify(LOKALKIRIM_DEFAULT_PRODUCTS))
    },
    {
      id: 'geprek-juara',
      name: 'Ayam Geprek Sambal Bawang',
      phone: '0852-3344-5566',
      address: 'Jl. Melati Ruko No. 5',
      isOpen: true,
      openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      openHour: '09:00',
      closeHour: '22:00',
      pricingType: 'regular_km',
      pricingRuleText: 'Skema Reguler: Min Rp 8.000, Rp 2.000/km',
      products: [
        { id: 'prod-g1', name: 'Paket Ayam Geprek + Nasi', category: 'Kebutuhan Dapur', unit: 'Porsi Komplit', price: 19000, status: 'Terlaris', iconType: 'package' },
        { id: 'prod-g2', name: 'Ayam Geprek Keju Mozzarella', category: 'Kebutuhan Dapur', unit: 'Porsi Komplit', price: 25000, status: 'Tersedia', iconType: 'package' },
        { id: 'prod-g3', name: 'Es Teh Manis Jumbo', category: 'Kebutuhan Dapur', unit: 'Cup 500 ml', price: 5000, status: 'Tersedia', iconType: 'sauce' }
      ]
    },
    {
      id: 'apotek-sehat',
      name: 'Apotek Barokah Sehat',
      phone: '0813-9988-7766',
      address: 'Jl. Pahlawan No. 88',
      isOpen: true,
      openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      openHour: '08:00',
      closeHour: '23:00',
      pricingType: 'regular_km',
      pricingRuleText: 'Skema Reguler: Min Rp 8.000, Rp 2.000/km',
      products: [
        { id: 'prod-a1', name: 'Herbal Masuk Angin (Box 5 Sachet)', category: 'Kebutuhan Dapur', unit: 'Box 5 Sachet', price: 21000, status: 'Tersedia', iconType: 'package' },
        { id: 'prod-a2', name: 'Paracetamol 500mg (Strip 10 Kaplet)', category: 'Kebutuhan Dapur', unit: 'Strip 10 Kaplet', price: 6500, status: 'Tersedia', iconType: 'package' },
        { id: 'prod-a3', name: 'Minyak Kayu Putih 60ml', category: 'Kebutuhan Dapur', unit: 'Botol 60 ml', price: 24500, status: 'Tersedia', iconType: 'oil' }
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
      isOnline: true,
      earnings: 0,
      cashHeld: 0
    },
    {
      id: 'drv-03',
      name: 'Dedi Suryana',
      phone: '0813-7766-5544',
      vehicle: 'Honda Vario 160 (Putih)',
      plateNumber: 'B 6789 PQR',
      isOnline: false,
      earnings: 0,
      cashHeld: 0
    }
  ],
  orders: [],
  activeOrderId: null,
  distanceKm: 3.5,
  currentMerchantId: 'toko-berkah'
};

// =========================================================================
// 3. FUNGSI AKSES & PERSISTENSI STATE
// =========================================================================
let sharedChannelInstance = null;

function getSharedBroadcastChannel() {
  if (!sharedChannelInstance && typeof window !== 'undefined' && window.BroadcastChannel) {
    sharedChannelInstance = new BroadcastChannel(LOKALKIRIM_CHANNEL_NAME);
  }
  return sharedChannelInstance;
}

function loadSharedState() {
  try {
    const raw = localStorage.getItem(LOKALKIRIM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validasi integritas struktur data
      if (!parsed.merchants || parsed.merchants.length === 0) {
        parsed.merchants = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.merchants));
      }
      if (!parsed.drivers || parsed.drivers.length === 0) {
        parsed.drivers = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.drivers));
      }
      if (!parsed.driver && parsed.drivers.length > 0) {
        parsed.driver = parsed.drivers[0];
      }
      if (!parsed.pricingRules) {
        parsed.pricingRules = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.pricingRules));
      }
      if (!parsed.orders) {
        parsed.orders = [];
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Gagal memuat state dari storage:', e);
  }
  return JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA));
}

function saveSharedState(state, broadcast = true, actionType = 'STATE_UPDATE') {
  try {
    localStorage.setItem(LOKALKIRIM_STORAGE_KEY, JSON.stringify(state));
    if (broadcast) {
      const ch = getSharedBroadcastChannel();
      if (ch) {
        ch.postMessage({ type: 'STATE_UPDATE', payload: state, action: actionType });
      }
    }
  } catch (e) {
    console.error('Gagal menyimpan state bersama:', e);
  }
}

// =========================================================================
// 4. FORMATTER & KALKULATOR TARIF
// =========================================================================
function formatRp(val) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

function calculateSharedDeliveryFee(merchantId, distanceKm, state = null) {
  const currentState = state || loadSharedState();
  const merchant = (currentState.merchants || []).find(m => m.id === merchantId) || currentState.merchants[0] || LOKALKIRIM_INITIAL_DATA.merchants[0];
  const rules = currentState.pricingRules || LOKALKIRIM_INITIAL_DATA.pricingRules;

  let ongkir = 0;
  let calculationNote = '';

  if (merchant.pricingType === 'custom_flat') {
    if (distanceKm <= rules.flatMaxKm) {
      ongkir = rules.flatRate;
      calculationNote = `Tarif Flat Mitra (0–${rules.flatMaxKm} km)`;
    } else {
      const extraKm = distanceKm - rules.flatMaxKm;
      ongkir = rules.flatRate + Math.round(extraKm * rules.perKmFare);
      calculationNote = `Flat ${formatRp(rules.flatRate)} + (${extraKm.toFixed(1)} km × ${formatRp(rules.perKmFare)})`;
    }
  } else {
    const distCost = Math.round(distanceKm * rules.perKmFare);
    ongkir = Math.max(rules.baseMinFare, distCost);
    calculationNote = distCost > rules.baseMinFare
      ? `${distanceKm} km × ${formatRp(rules.perKmFare)}/km`
      : 'Tarif Dasar Minimum';
  }

  const platformFee = Math.min(rules.platformFee, Math.round(ongkir * 0.3));
  const driverNetEarnings = ongkir - platformFee;

  return {
    ongkir,
    shippingFee: ongkir,
    calculationNote,
    platformFee,
    driverNetEarnings,
    driverShare: driverNetEarnings
  };
}

// =========================================================================
// 5. ENGINE RESET DATA OPERASIONAL (SESUAI PERMINTAAN USER)
// =========================================================================

/**
 * 1. Reset Transaksi Saja:
 * Mengosongkan antrean pesanan, saldo kas COD kurir, hak pendapatan kurir,
 * omset toko, dan GMV platform ke 0.
 * TETAP MEMPERTAHANKAN master data mitra toko, katalog produk, dan armada kurir.
 */
function resetTransactionsOnly() {
  const currentState = loadSharedState();
  
  currentState.orders = [];
  currentState.activeOrderId = null;

  // Reset saldo kurir aktif
  if (currentState.driver) {
    currentState.driver.earnings = 0;
    currentState.driver.cashHeld = 0;
  }

  // Reset saldo seluruh armada kurir
  if (currentState.drivers && Array.isArray(currentState.drivers)) {
    currentState.drivers.forEach(d => {
      d.earnings = 0;
      d.cashHeld = 0;
    });
  }

  // Bersihkan keranjang belanja pelanggan
  try {
    localStorage.removeItem(LOKALKIRIM_CART_KEY);
  } catch (e) {}

  saveSharedState(currentState, true, 'RESET_TRANSACTIONS');
  return currentState;
}

/**
 * 2. Reset Seluruh Data (Factory Reset):
 * Mengembalikan seluruh ekosistem ke data awal pabrik (3 toko default,
 * 10 produk sembako lengkap, 3 mitra kurir, tarif default, dan tanpa pesanan).
 */
function resetAllDataToDefault() {
  try {
    localStorage.removeItem(LOKALKIRIM_STORAGE_KEY);
    localStorage.removeItem(LOKALKIRIM_CART_KEY);
  } catch (e) {}

  const freshState = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA));
  saveSharedState(freshState, true, 'RESET_ALL');
  return freshState;
}

/**
 * 3. Reset Data Master Produk Saja:
 * Mengembalikan daftar produk Toko Berkah ke 10 produk sembako standar lengkap.
 */
function resetMerchantProductsToDefault(merchantId = 'toko-berkah') {
  const currentState = loadSharedState();
  const merch = (currentState.merchants || []).find(m => m.id === merchantId);
  if (merch) {
    merch.products = JSON.parse(JSON.stringify(LOKALKIRIM_DEFAULT_PRODUCTS));
    saveSharedState(currentState, true, 'RESET_PRODUCTS');
  }
  return currentState;
}

/**
 * 4. Reset Data Master Mitra Usaha Saja:
 * Mengembalikan daftar mitra usaha ke 3 merchant default (Toko Berkah, Geprek Juara, Apotek Sehat).
 */
function resetMerchantsOnlyToDefault() {
  const currentState = loadSharedState();
  currentState.merchants = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.merchants));
  currentState.currentMerchantId = 'toko-berkah';
  saveSharedState(currentState, true, 'RESET_MERCHANTS');
  return currentState;
}

/**
 * 5. Reset Data Master Mitra Kurir Saja:
 * Mengembalikan armada kurir ke 3 driver default.
 */
function resetDriversOnlyToDefault() {
  const currentState = loadSharedState();
  currentState.drivers = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.drivers));
  currentState.driver = JSON.parse(JSON.stringify(LOKALKIRIM_INITIAL_DATA.driver));
  saveSharedState(currentState, true, 'RESET_DRIVERS');
  return currentState;
}

// Ekspor ke window global
if (typeof window !== 'undefined') {
  window.LOKALKIRIM_INITIAL_DATA = LOKALKIRIM_INITIAL_DATA;
  window.LOKALKIRIM_DEFAULT_PRODUCTS = LOKALKIRIM_DEFAULT_PRODUCTS;
  window.LOKALKIRIM_STORAGE_KEY = LOKALKIRIM_STORAGE_KEY;
  window.LOKALKIRIM_CART_KEY = LOKALKIRIM_CART_KEY;
  window.LOKALKIRIM_CHANNEL_NAME = LOKALKIRIM_CHANNEL_NAME;

  window.loadSharedState = loadSharedState;
  window.saveSharedState = saveSharedState;
  window.formatRp = formatRp;
  window.calculateSharedDeliveryFee = calculateSharedDeliveryFee;
  window.getSharedBroadcastChannel = getSharedBroadcastChannel;

  window.resetTransactionsOnly = resetTransactionsOnly;
  window.resetAllDataToDefault = resetAllDataToDefault;
  window.resetMerchantProductsToDefault = resetMerchantProductsToDefault;
  window.resetMerchantsOnlyToDefault = resetMerchantsOnlyToDefault;
  window.resetDriversOnlyToDefault = resetDriversOnlyToDefault;
}

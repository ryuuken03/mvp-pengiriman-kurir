# GoMitra / LokalKirim - Simulator Operasional Multi-Peran (4-in-1 Split Screen)

Dokumen ini menjelaskan cara pengoperasian prototipe antarmuka terintegrasi untuk platform logistik hyperlocal dan marketplace kemitraan (*Customer*, *Merchant*, *Driver*, dan *Admin*).

Prototipe ini dirancang khusus untuk memvalidasi alur operasional, manajemen produk mitra, pengaturan operasional kios, dan skema tarif bersama mitra bisnis tanpa memerlukan backend maupun database server.

---

## 1. Panduan Menjalankan Prototipe

Aplikasi dibangun murni menggunakan teknologi web standar (**HTML5, Vanilla CSS, dan JavaScript modern**).

### A. Simulator Multi-Peran (4 Layar Sekaligus)
- Buka berkas `MVP/index.html` menggunakan peramban web modern (Google Chrome, Microsoft Edge, atau Mozilla Firefox).
- Menampilkan 4 panel peran berdampingan dalam satu layar:
  - **Panel 1:** Aplikasi Pelanggan (*Customer App* bergaya Abunawas Store).
  - **Panel 2:** Portal Mitra Usaha (*Merchant Portal* lengkap dengan CRUD Produk & Pengaturan Kios).
  - **Panel 3:** Aplikasi Mitra Kurir (*Driver PWA*).
  - **Panel 4:** Panel Pengawas Operasional (*Super Admin / Operator*).

### B. Membuka Aplikasi Mandiri (Mode Layar Penuh / Tampilan HP)
Setiap aplikasi peran dapat dibuka langsung secara penuh di tab terpisah atau di peramban ponsel pintar melalui jaringan lokal:
- **Aplikasi Pelanggan (Customer PWA):** Buka berkas `MVP/customer.html`
- **Portal Mitra Usaha (Merchant Portal):** Buka berkas `MVP/merchant.html`
- **Aplikasi Mitra Kurir (Driver PWA):** Buka berkas `MVP/driver.html`
- **Konsol Pengawas Operasional (Super Admin):** Buka berkas `MVP/admin.html`
- **Simulator 4 Panel Terintegrasi:** Buka berkas `MVP/index.html`

Untuk pengujian antar perangkat ponsel melalui Wi-Fi lokal:
```bash
npx serve MVP
```

---

## 2. Fitur Lengkap Portal Mitra Usaha (`merchant.html`)

Portal Mitra Usaha menyediakan 4 modul utama:

### 1. Antrean Pesanan Masuk (*Live Order Queue*)
- Peringatan audio bel otomatis setiap kali pelanggan membuat pesanan baru dari *Customer App*.
- Rincian penerima: Nama pelanggan, nomor WhatsApp, alamat lengkap, dan jarak pengantaran.
- Rincian belanja barang, metode pembayaran (COD / QRIS), dan total omset toko.
- Alur aksi berjenjang:
  - `Terima & Siapkan Pesanan` ➔ status berubah menjadi Sedang Disiapkan.
  - `Siap Diambil (Panggil Kurir)` ➔ menyiarkan penugasan penjemputan barang ke kurir terdekat.

### 2. Manajemen & CRUD Katalog Produk
- **Create (Tambah):** Menambahkan produk baru (Nama, Kategori, Satuan/Ukuran Kemasan, Harga Jual Rp, dan Status Ketersediaan).
- **Read (Daftar):** Tabel katalog barang lengkap dengan pencarian nama dan filter kategori (*Beras, Minyak Goreng, Gula & Tepung, Kebutuhan Dapur, Paket Hemat*).
- **Update (Edit):** Mengubah informasi produk atau harga sewaktu-waktu.
- **Delete (Hapus):** Menghapus produk dari katalog toko.
- **Quick Stock Switch:** Tombol ubah cepat status ketersediaan (*Tersedia* vs *Habis*).
- *Catatan:* Perubahan produk di Portal Mitra langsung tersinkronisasi ke katalog belanja di *Customer App*.

### 3. Pengaturan Kios & Jadwal Buka/Tutup
- **Status Toko Buka/Tutup:** Tombol switch cepat di bilah atas untuk membuka atau menutup penerimaan pesanan.
- **Identitas Usaha:** Pengaturan nama kios/toko, nomor WhatsApp bisnis, dan alamat lengkap penjemputan kurir.
- **Jadwal Hari Operasional:** Pilihan hari buka (*Senin s/d Minggu*).
- **Jam Operasional:** Pengaturan jam buka dan jam tutup harian.
- **Skema Kerjasama Ongkir:** Pilihan skema tarif flat khusus mitra (0–10 km Rp 5.000) vs skema reguler per km.

### 4. Rekapitulasi Penjualan
- Akumulasi omset bersih barang toko (100% hak milik pedagang tanpa potongan sepihak).
- Jumlah pesanan sukses dan rata-rata nilai transaksi belanja.
- Riwayat transaksi tuntas.

---

## 3. Alur Sinkronisasi Real-Time (Tanpa Database)

Semua aplikasi menggunakan mekanisme **Client-Side State Synchronization**:
1. **`BroadcastChannel` API:** Mengirimkan mutasi pesanan dan status secara instan antar tab dan antar frame.
2. **`localStorage` (Kunci: `lokalkirim_clean_state`):** Menyimpan status operasional, antrean pesanan, dan katalog produk.
3. **`window.addEventListener('storage')`:** Memastikan pembaruan data antar tab atau peramban berbeda tetap tersinkronisasi tanpa memerlukan *page refresh*.

---

## 4. Alur Integrasi Panggil Kurir ke Mitra Kurir (`driver.html`)

1. **Pemicu Penjemputan Toko:**
   - Setelah Mitra Usaha menerima pesanan dan selesai mengemas barang, mitra menekan tombol **Siap Diambil (Panggil Kurir Penjemput)** di Portal Toko (`merchant.html`).
   - Status pesanan berubah menjadi `READY_FOR_PICKUP`.
2. **Penerimaan Penawaran di Aplikasi Kurir:**
   - Aplikasi Kurir membunyikan nada dering peringatan (*driver ping audio*).
   - Muncul kartu merah **Penawaran Penjemputan Baru** yang memuat seluruh data transaksi:
     - Nomor Pesanan (`#ORD-XXXX`).
     - Titik Jemput: Nama Toko dan Alamat Lengkap.
     - Titik Antar: Nama Pelanggan, No. Telepon, Alamat Lengkap, dan Jarak (km).
     - Rincian Muatan: Daftar nama barang dan kuantitas.
     - Metode Pembayaran: Penanda jelas apakah **COD (Wajib tagih tunai)** atau **QRIS / Non-Tunai (Lunas)**.
     - Hak Pendapatan Bersih Kurir: Ongkir dikurangi biaya platform tetap Rp 1.000.
3. **Fase Operasional Kurir:**
   - **Fase 1 (Menuju Toko):** Kurir menekan *Terima & Jalankan*, lalu mengonfirmasi fisik muatan dan menekan *Konfirmasi Pengambilan Barang di Toko*.
   - **Fase 2 (Menuju Pelanggan):** Kurir membawa barang, dapat menghubungi nomor pelanggan via tautan langsung WhatsApp, dan menagih kas tunai jika metode COD.
   - **Fase 3 (Selesai):** Kurir menekan *Konfirmasi Selesai & Kas COD Diterima*. Saldo pendapatan bersih kurir bertambah otomatis dan kas COD tercatat di Buku Kas Operasional.

---

## 5. Fitur Konsol Pengawas Operasional & Super Admin (`admin.html`)

Konsol Admin dirancang dengan terminologi formal industri logistik dan operasional:
1. **Monitoring Transaksi Real-time:**
   - Metrik KPI Utama: Volume GMV, Kas Pendapatan Platform (Rp 1.000 / order), Saldo Kas Tunai COD yang Dipegang Kurir, dan Rasio Pesanan Tuntas.
   - Tabel Buku Besar Transaksi: Menampilkan log lengkap seluruh pesanan (ID, Waktu, Mitra Toko, Pelanggan, Kurir, Nilai Belanja, Ongkir, Fee Platform, Total Bayar, Metode, Status Semantik, dan Modal Detail Barang).
   - Filter Pencarian: Pencarian nomor pesanan, nama pembeli, nama toko, serta filter status operasional.
2. **Manajemen & CRUD Mitra Usaha (Merchant Management):**
   - Daftar seluruh toko/kios mitra terdaftar beserta alamat, kontak WhatsApp, jumlah produk, dan status toko (*Buka/Tutup*).
   - Tambah Toko Baru (*Create*), Edit Data Toko (*Update*), Ubah Cepat Status Buka/Tutup (*Switch*), dan Hapus Toko (*Delete*).
3. **Manajemen & CRUD Mitra Kurir (Driver Management):**
   - Daftar seluruh pengemudi armada logistik beserta jenis kendaraan, nomor plat polisi, status ketersediaan (*Online/Offline*), akumulasi pendapatan bersih, dan kas tunai COD.
   - Tambah Kurir Baru (*Create*), Edit Profil & Plat Kendaraan (*Update*), Ubah Cepat Status Kehadiran (*Switch*), dan Hapus Kurir (*Delete*).
4. **Dynamic Pricing Engine:**
   - Pengaturan tarif dasar minimum, tarif per kilometer, batas kilometer tarif flat khusus kemitraan, nominal tarif flat, dan biaya jasa platform.
5. **Modul Reset Data Operasional:**
   - Menu Reset Transaksi & Kas Tunai COD, Reset Seluruh Ekosistem ke Standar Pabrik, Pulihkan Mitra Toko, dan Pulihkan Mitra Kurir.

---

## 6. Modul Sentral `shared.js` & Mekanisme Reset Granular

Untuk menjamin konsistensi data antar 4 peran dan mencegah desinkronisasi master data, MVP kini dilengkapi modul sentral [`shared.js`](file:///MVP/shared.js):

1. **Master Data Kanonikal Terpadu:**
   - **Mitra Toko:** 3 Merchant (`Toko Berkah Kelontong`, `Ayam Geprek Sambal Bawang`, `Apotek Barokah Sehat`).
   - **Katalog Produk:** 10 produk sembako standar lengkap dengan foto icon SVG, kategori, ukuran kemasan, harga, dan stok.
   - **Mitra Kurir:** 3 Pengemudi armada (`Budi Santoso`, `Agus Priyanto`, `Dedi Suryana`) dengan sinkronisasi dompet dan kas COD.
   - **Aturan Tarif:** Tarif flat mitra (0–10 km Rp 5.000) dan tarif reguler per km.

2. **Opsi Reset Granular:**
   - **Reset Transaksi Saja (`resetTransactionsOnly`):**
     Mengosongkan antrean pesanan, saldo kas COD kurir, hak pendapatan kurir, omset toko, dan GMV platform ke Rp 0. Data toko, katalog produk, dan armada kurir **tetap dipertahankan**.
   - **Reset Total Standar Pabrik (`resetAllDataToDefault`):**
     Mengembalikan seluruh ekosistem ke data awal pabrik.
   - **Pulihkan Produk Bawaan (`resetMerchantProductsToDefault`):**
     Mengembalikan katalog produk Toko Berkah ke 10 produk sembako standar.
   - **Pulihkan Mitra Toko (`resetMerchantsOnlyToDefault`):**
     Mengembalikan daftar toko ke 3 mitra standar.
   - **Pulihkan Mitra Kurir (`resetDriversOnlyToDefault`):**
     Mengembalikan armada pengemudi ke 3 driver standar.

3. **Simulasi Alur Penuh (Automated Walkthrough):**
   - Menjalankan 1 siklus transaksi lengkap dari pembuatan pesanan oleh Pelanggan -> diterima Toko -> dipanggil Kurir -> diterima Kurir -> diambil di Toko -> diantar ke Pelanggan -> konfirmasi serah terima & kas COD selesai.



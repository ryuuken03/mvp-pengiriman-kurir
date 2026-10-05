# GoMitra / LokalKirim - Simulator Operasional Multi-Peran (4-in-1 Hyperlocal Ecosystem)

[![GitHub Repository](https://img.shields.io/badge/GitHub-ryuuken03%2Fmvp--pengiriman--kurir-blue?logo=github)](https://github.com/ryuuken03/mvp-pengiriman-kurir)
[![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20Vanilla%20CSS%20%7C%20ES6%2B%20JS-green)](#teknologi)
[![Standard](https://img.shields.io/badge/UX%20Standard-AGENTS.md%20Compliant-purple)](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/AGENTS.md)

Prototipe antarmuka terintegrasi untuk platform logistik hyperlocal dan marketplace kemitraan (*Customer*, *Merchant*, *Driver*, dan *Admin*). Dirancang khusus untuk memvalidasi alur operasional, manajemen produk mitra, pengaturan operasional toko, dan skema pembagian tarif bersama mitra bisnis **tanpa memerlukan backend maupun database server**.

---

## 1. Panduan Menjalankan Aplikasi

Aplikasi dibangun murni menggunakan teknologi web standar (**HTML5, Vanilla CSS, dan JavaScript modern**).

### A. Simulator Multi-Peran (4 Layar Berdampingan)
Buka berkas [MVP/index.html](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/index.html) menggunakan peramban web modern (Google Chrome, Microsoft Edge, Mozilla Firefox, dsb.):
- **Panel 1 (Kiri Atas):** [Aplikasi Pelanggan](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/customer.html) (*Customer App* bergaya Abunawas Store).
- **Panel 2 (Kanan Atas):** [Portal Mitra Usaha](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/merchant.html) (*Merchant Portal* lengkap dengan CRUD Produk & Pengaturan Kios).
- **Panel 3 (Kiri Bawah):** [Aplikasi Mitra Kurir](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/driver.html) (*Driver PWA* lengkap dengan alur jemput-antar dan kas COD).
- **Panel 4 (Kanan Bawah):** [Konsol Pengawas Operasional](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/admin.html) (*Super Admin / Operator*).

### B. Mode Mandiri (Standalone / Layar Penuh Ponsel)
Setiap aplikasi peran dapat dibuka secara mandiri pada tab peramban terpisah atau melalui smartphone di jaringan lokal:
- **Pelanggan:** [MVP/customer.html](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/customer.html)
- **Mitra Usaha:** [MVP/merchant.html](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/merchant.html)
- **Mitra Kurir:** [MVP/driver.html](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/driver.html)
- **Konsol Admin:** [MVP/admin.html](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/admin.html)

Untuk menjalankan server lokal dan menguji lintas perangkat via Wi-Fi:
```bash
npx serve MVP
```

---

## 2. Fitur Utama Masing-Masing Peran

### 1. Aplikasi Pelanggan (`customer.html`)
- **Identitas Toko Dinamis:** Menampilkan nama toko, alamat, jadwal hari buka, dan jam operasional yang tersinkronisasi otomatis dari pengaturan Portal Mitra.
- **Navigasi Ergonomis & Responsif:**
  - **Tampilan Desktop:** Bilah navigasi atas (*Top Command Bar*) memuat tombol *Keranjang Belanja*, *Daftar Transaksi*, dan *Profil / Masuk*.
  - **Tampilan Ponsel (Mobile-First):** Bilah atas dibuat ringkas, menu navigasi beralih ke *Bottom Navigation Bar* tetap di bagian bawah layar (*Keranjang*, *Transaksi*, *Profil / Masuk*).
- **Katalog Belanja Sembako:** Filter kategori, kartu produk dengan tombol kuantitas (*Plus/Minus*), dan pembaruan stok real-time.
- **Checkout & Pilihan Pembayaran:** Opsi bayar tunai di tempat (**COD**) dan non-tunai (**QRIS**), pemilihan radius jarak pengantaran dengan kalkulasi ongkos kirim otomatis.
- **Pelacakan Status Pesanan Real-Time:** Notifikasi status pesanan interaktif mulai dari konfirmasi toko hingga barang sampai di tujuan.

### 2. Portal Mitra Usaha (`merchant.html`)
- **Transparansi Seluruh Status Pesanan:**
  - Antrean pesanan operasional menampilkan **seluruh transaksi tanpa disembunyikan** (*Status apapun tetap tampil: Pesanan Dibuat, Sedang Disiapkan, Menunggu Kurir, Kurir Menuju Toko, Dalam Pengantaran, Pesanan Selesai, dan Dibatalkan*).
  - Dilengkapi pil filter status operasional: **Semua**, **Aktif**, dan **Selesai**.
- **Aksi Operasional Toko Berjenjang:**
  - `Terima & Siapkan Pesanan`: Mengubah status pesanan menjadi sedang dikemas.
  - `Siap Diambil (Panggil Kurir)`: Menyiarkan penawaran penjemputan barang ke kurir terdekat.
- **Manajemen & CRUD Produk:** Tambah produk baru, edit harga/satuan, hapus produk, switch cepat stok (*Tersedia / Habis*), dan tombol pemulihan 10 produk bawaan.
- **Pengaturan Profil Toko:** Nama toko, nomor kontak WhatsApp, alamat penjemputan, saklar Buka/Tutup kios, jadwal hari buka, dan jam operasional.
- **Buku Rekap Penjualan:** Akumulasi total omset bersih toko (100% hak pedagang).

### 3. Aplikasi Mitra Kurir (`driver.html`)
- **Penawaran Penjemputan Langsung (*Offer Card*):**
  - Kartu penawaran berkedip saat toko memanggil kurir (`READY_FOR_PICKUP`), memuat rincian titik jemput (toko), titik antar (pelanggan), muatan barang, metode bayar (COD / QRIS), dan hak pendapatan bersih kurir.
  - Tombol aksi stabil: **Terima & Jalankan** dan **Lewati**.
- **Daftar Seluruh Transaksi & Status Transparan:**
  - Kurir dapat memantau **seluruh pesanan di ekosistem** dengan status apapun (termasuk pesanan yang masih disiapkan toko, pesanan aktif, hingga pesanan tuntas).
  - Dilengkapi filter status (*Semua*, *Aktif*, *Selesai*).
  - Tombol aksi cepat *Terima & Jalankan Penjemputan* langsung tersedia di setiap kartu pesanan yang siap dijemput.
- **Fase Pengantaran Terpandu (*Active Trip*):**
  - **Fase 1 (Menuju Toko):** Verifikasi barang di kios dan konfirmasi pengambilan muatan.
  - **Fase 2 (Menuju Pelanggan):** Fitur WhatsApp langsung ke pembeli, peringatan tagihan kas COD, dan konfirmasi serah terima barang.
- **Buku Kas & Dompet Kurir:** Catatan akumulasi hak pendapatan bersih kurir (+Rp 4.000 per trip) dan pemisahan saldo kas tunai COD yang dipegang.

### 4. Konsol Pengawas Operasional (`admin.html`)
- **Buku Besar Transaksi (Ledger):** Log audit menyeluruh untuk seluruh pesanan di ekosistem platform.
- **Manajemen Mitra Usaha & Mitra Kurir:** CRUD lengkap data mitra toko dan pengemudi armada logistik.
- **Dynamic Pricing Engine:** Konfigurasi tarif per kilometer, tarif dasar minimum, skema flat kemitraan (0–10 km), dan potongan jasa platform (Rp 1.000 / transaksi).

### 5. Simulator Terintegrasi (`index.html`)
- **Pengendali Simulasi Alur Penuh (*Automated Walkthrough*):** Mengotomatisasi satu siklus penuh mulai dari order pelanggan -> disiapkan toko -> diambil kurir -> diantar -> kas COD tuntas diterima.
- **Modal Reset Data Terpusat:**
  - **Reset Transaksi & Buku Kas:** Mengosongkan pesanan dan saldo kas ke Rp 0 dengan tetap mempertahankan katalog produk dan profil mitra.
  - **Reset Total (Standar Pabrik):** Memulihkan seluruh konfigurasi ke kondisi awal bawaan.
  - **Pemulihan Parsial:** Memulihkan katalog produk, daftar toko, atau daftar kurir secara spesifik.
  - *Dilengkapi auto-reload serentak ke-4 iframe tanpa dialog konfirmasi yang memblokir.*

---

## 3. Sinkronisasi Real-Time Tanpa Database

Aplikasi menerapkan arsitektur *Decoupled Client-Side State Synchronization*:
1. **`BroadcastChannel` API (`lokalkirim_pwa_sim`):** Menyiarkan mutasi status transaksi secara instan antar frame dan tab peramban.
2. **`localStorage` (`lokalkirim_clean_state`):** Persistensi data lokal yang konsisten dan tahan muat ulang (*reload*).
3. **`window.addEventListener('storage')`:** Mekanisme fallback reaktif untuk sinkronisasi antar jendela peramban.
4. **Modul Sentral [MVP/shared.js](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/MVP/shared.js):** Pusat data kanonikal, fungsi kalkulasi tarif, dan fungsi reset granular yang dipakai seragam oleh seluruh peran.

---

## 4. Standar Desain & Copywriting (Sesuai `AGENTS.md`)

Seluruh tampilan dan teks pada prototipe ini mengacu pada standar pengembangan [AGENTS.md](file:///c:/Project/solusi.toriq/Zulfiar%20Ryan/Project%20Kurir%20Mirip%20Gojek/AGENTS.md):
- **Bebas Polusi Ikon & Emoji:** Tanpa emoji dekoratif (seperti 🚀, 🔥, 👨‍🍳). Seluruh elemen mengandalkan tipografi modern (*Plus Jakarta Sans* & *JetBrains Mono*) dan ikon SVG monokrom fungsional.
- **Anti-Redudansi Teks:** Menghilangkan kalimat pengantar basa-basi atau paragraf instruksional yang tidak bernilai operasional.
- **Bahasa Indonesia Baku & Lugas:** Menggunakan terminologi resmi industri logistik/finansial (*Pesanan Dibuat*, *Sedang Disiapkan Toko*, *Menunggu Kurir*, *Dalam Pengantaran*, *Pesanan Selesai*).
- **Mobile-First & Ergonomis:** Target sentuh tombol minimal 44px × 44px, bilah aksi cepat, dan navigasi bawah yang mudah dijangkau satu tangan.

---

## 5. Repositori Git

Repositori proyek ini telah dikonfigurasi secara lokal dan terhubung ke GitHub:
- **Remote URL:** `git@github.com:ryuuken03/mvp-pengiriman-kurir.git`
- **Branch Utama:** `main`
- **Akun Pemilik:** `ryuuken03`

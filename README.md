# OptiPic — Kompresor & Konverter Gambar Privat

Aplikasi web modern untuk mengompres, mengubah resolusi, dan mengonversi format gambar secara instan langsung di sisi pengguna (*client-side*).

---

## Keunggulan Utama & Privasi

1. **100% Client-Side (Privasi Terjaga):**
   - Gambar diproses langsung di peramban menggunakan **HTML5 Canvas API**.
   - Tidak ada satu pun byte foto yang dikirim ke server luar atau internet. Sangat aman untuk dokumen privat (KTP, SIM, ijazah, struk, atau foto rahasia).
2. **Responsif & Dioptimalkan untuk Mobile (Chrome Android & iOS):**
   - Mendukung tinggi viewport dinamis (`100dvh`) agar tidak tertutup address bar Chrome HP.
   - Ukuran elemen sentuh (*touch target*) minimal 44px ramah jari jempol.
   - Dilengkapi *floating action bar* di bagian bawah layar HP saat gambar selesai diproses.
3. **Fitur Lengkap & Unggulan:**
   - **Target Ukuran Otomatis (Auto-Fit KB):** Cukup pilih batas ukuran (misal 200 KB untuk CPNS/BUMN), sistem secara otomatis menjalankan algoritma *binary search* untuk mencari kualitas dan skala resolusi yang pas.
   - **Watermark Pengaman Dokumen:** Menambahkan teks cap pengaman diagonal semi-transparan untuk melindungi KTP/SIM dari penyalahgunaan pinjol atau kejahatan identitas.
   - **Rotasi Foto 90° Searah Jarum Jam:** Memutar foto miring/terbalik langsung di kartu tanpa perlu upload ulang.
   - **Pemotong Rasio Aspek (Crop Pas Foto):** Pilihan crop instan 1:1 (Persegi/Avatar), 3:4 (Pas Foto Formal CPNS/Ijazah), 4:6 (Cetak), dan 16:9 (Lanskap).
   - **Salin ke Papan Klip (Copy to Clipboard):** Menyalin gambar terkompresi langsung ke clipboard untuk ditempel di WhatsApp Web, Telegram, Word, atau email.
   - **Preset Cepat Sekali Klik:** Berkas CPNS 200 KB, KTP & Dokumen Aman, Pas Foto JPEG 3:4, Web & SEO 1280px, dan Kualitas Penuh PNG.
   - **Pembersih Metadata EXIF Otomatis:** Menghapus koordinat GPS dan info kamera demi privasi total.
   - **Progressive Web App (PWA) & 100% Offline:** Dilengkapi file `jszip.min.js` lokal sehingga aplikasi bisa di-install ke layar utama HP Android/iOS dan dapat dijalankan tanpa koneksi internet sama sekali.
   - **Toggle Tema Gelap / Terang:** Mendukung tema dark/light mode dengan deteksi preferensi sistem otomatis.
   - **Konversi Format:** WebP (kompresi modern tertinggi), JPEG, atau PNG.
   - **Modal Komparasi & Zoom 2x:** Slider perbandingan Before vs After interaktif dengan fitur Zoom 2x untuk memeriksa ketajaman detail teks/garis.
   - **Download Semua ZIP:** Mengompres dan mengunduh seluruh file sekaligus dalam arsip ZIP otomatis via JSZip (dengan proteksi duplikasi nama file).

---

## Cara Menjalankan Secara Lokal

1. Buka folder `image-compressor`.
2. **Cara Paling Mudah:** Klik ganda file **`start.bat`**. Browser akan otomatis terbuka di `http://localhost:8000`.
3. Atau klik ganda langsung file `index.html`.

---

## Cara Deploy ke Netlify (Gratis Tanpa Biaya)

Project ini sangat ideal untuk Netlify karena 100% statis dan sudah dilengkapi file `_headers` untuk performa caching optimal:

### Metode 1: Drag & Drop (Paling Cepat, 1 Menit)
1. Masuk ke akun [Netlify](https://app.netlify.com/).
2. Masuk ke menu **Sites** &rarr; cari area **"Drag & drop your site output folder here"**.
3. Tarik folder `image-compressor` langsung ke browser Anda.
4. Netlify akan langsung memberikan URL live aktif (misal: `https://optipic-xyz.netlify.app`).

### Metode 2: Hubungkan ke GitHub
1. Buat repository baru di GitHub (misal: `optipic-image-compressor`).
2. Masukkan file `index.html`, `style.css`, dan `app.js` ke repository tersebut.
3. Di Netlify, pilih **"Add new site"** &rarr; **"Import an existing project"** &rarr; pilih repository GitHub Anda.
4. Kosongkan *Build command* dan set *Publish directory* ke root (`.`).
5. Klik **Deploy site**. Setiap kali Anda melakukan `git push`, website akan otomatis diperbarui.

---

## Struktur File

```text
image-compressor/
├── index.html        # Struktur HTML5 semantik & SVG ikon vektor
├── style.css         # Desain modern (Dark/Light mode) & optimasi mobile Chrome
├── app.js            # Logika Canvas, binary search target KB, watermark, rotasi, & crop
├── jszip.min.js      # Library JSZip lokal (100% offline bundle)
├── _headers          # Konfigurasi caching & security headers Netlify
├── start.bat         # Peluncur server lokal otomatis sekali klik
├── sw.js             # Service Worker untuk dukungan 100% offline
├── manifest.json     # Konfigurasi PWA (Web App Manifest)
├── icon-192.png      # Ikon aplikasi PWA resolusi 192x192
├── icon-512.png      # Ikon aplikasi PWA resolusi 512x512
└── README.md         # Dokumentasi project & panduan deploy
```

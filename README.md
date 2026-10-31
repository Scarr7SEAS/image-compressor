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
   - **Preset Cepat Sekali Klik:** Berkas CPNS 200 KB, KTP & Dokumen Aman, Pas Foto JPEG, Web & SEO 1280px, dan Kualitas Penuh PNG.
   - **Pembersih Metadata EXIF Otomatis:** Menghapus koordinat GPS dan info kamera demi privasi total.
   - **Progressive Web App (PWA) & 100% Offline:** Bisa di-install ke layar utama HP Android/iOS dan dapat dijalankan tanpa koneksi internet sama sekali.
   - **Toggle Tema Gelap / Terang:** Mendukung tema dark/light mode dengan deteksi preferensi sistem otomatis.
   - **Konversi Format:** WebP (kompresi modern tertinggi), JPEG, atau PNG.
   - **Modal Komparasi:** Slider perbandingan Before vs After secara interaktif.
   - **Download Semua ZIP:** Mengompres dan mengunduh seluruh file sekaligus dalam arsip ZIP via JSZip.

---

## Cara Menjalankan Secara Lokal

Karena project ini murni dibuat menggunakan **HTML, CSS, dan JavaScript vanilla**, tidak diperlukan proses *build* atau instalasi Node.js/Python:

1. Buka folder `image-compressor`.
2. Klik ganda file `index.html` untuk langsung membukanya di browser (Chrome, Edge, Firefox, atau Safari).
3. *(Opsional)* Jika ingin menjalankan via local server sederhana:
   ```bash
   # Menggunakan Python
   python -m http.server 8000
   # Lalu buka di browser: http://localhost:8000
   ```

---

## Cara Deploy ke Netlify (Gratis Tanpa Biaya)

Project ini sangat ideal untuk Netlify karena 100% statis:

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
├── app.js            # Logika Canvas, binary search target KB, watermark, & JSZip
├── sw.js             # Service Worker untuk dukungan 100% offline
├── manifest.json     # Konfigurasi PWA (Web App Manifest)
├── icon-192.png      # Ikon aplikasi PWA resolusi 192x192
├── icon-512.png      # Ikon aplikasi PWA resolusi 512x512
└── README.md         # Dokumentasi project & panduan deploy
```

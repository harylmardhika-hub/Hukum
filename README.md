# AdvokaID — Platform Konsultasi Hukum & Tinjauan Kontrak Real-Time Indonesia

**AdvokaID** adalah aplikasi web konsultasi hukum dan peninjauan pasal kontrak (*contract review*) secara *real-time* yang menghubungkan **Klien** dengan **Advokat Terverifikasi PERADI**.

---

## Fitur Utama

1. **Portal Login Ganda & Sesi Terisolasi (`sessionStorage`)**
   - Mendukung login terpisah sebagai **Klien** maupun **Advokat (NIA PERADI)**.
   - Setiap tab browser memiliki sesi login mandiri sehingga Anda dapat membuka 2 tab sekaligus (Tab 1 sebagai Klien, Tab 2 sebagai Advokat) untuk menguji diskusi *real-time*.
   - Mendukung pendaftaran akun Klien baru secara langsung.

2. **Direktori Advokat Spesialis (5 Bidang Hukum Indonesia)**
   - **Hukum Bisnis & Korporasi** (PKS Distribusi, Merger & Akuisisi, Sengketa BANI)
   - **Hukum Ketenagakerjaan** (Kontrak Kerja PKWT/PKWTT, PP No. 35/2021, Sengketa PHI)
   - **Hukum Perdata** (Akta PPJB Tanah/SHM, Wanprestasi, Perbuatan Melawan Hukum)
   - **Hukum Keluarga & Waris** (Waris Perdata/Islam, Perjanjian Pranikah, Harta Bersama)
   - **Hukum Pidana** (Pendampingan BAP Kepolisian, UU ITE, Pidana Korporasi)

3. **Ruang Konsultasi & Meja Tinjauan Kontrak Seimbang (50:50)**
   - **Panel Kiri (Ruang Chat Hukum)**: Diskusi langsung Klien & Advokat, indikator sedang mengetik (*typing indicator*), rujukan pasal otomatis, serta ringkasan opini hukum.
   - **Panel Kanan (Meja Tinjauan Kontrak)**: Pemeriksaan pasal demi pasal dengan penanda status risiko (**Aman**, **Perlu Revisi**, **Risiko Tinggi**), catatan hukum advokat, dan usulan perbaikan pasal.
   - **Unggah Kontrak**: Mendukung unggah dari draf kontrak standar maupun menempelkan (*paste*) teks pasal kontrak sendiri.

---

## Struktur Folder Proyek

```text
AdvokaID/
├── index.html                        # Entry point HTML & metadata SEO Bahasa Indonesia
├── package.json                      # Konfigurasi paket & skrip npm
├── server.ts                         # Server Express + WebSocket (Port 3000)
├── tsconfig.json                     # Konfigurasi TypeScript
├── vite.config.ts                    # Konfigurasi bundler Vite
├── .env.example                      # Contoh variabel environment
├── README.md                         # Dokumentasi lengkap proyek
├── public/
│   ├── icon.svg                      # Ikon & lambang perisai hukum AdvokaID
│   └── manifest.json                 # Manifest aplikasi web
└── src/
    ├── main.tsx                      # Bootstrap React DOM
    ├── index.css                     # Konfigurasi Tailwind CSS & tipografi
    ├── App.tsx                       # Navigasi utama, direktori advokat & manajemen sesi
    ├── types/
    │   └── legal.ts                  # Definisi tipe data TypeScript (Klien, Advokat, Kontrak, WS)
    ├── data/
    │   └── initialLegalData.ts       # Data awal advokat, klien, sesi perkara & draf kontrak
    └── components/
        ├── AdvokaIdLogo.tsx          # Komponen logo & emblem perisai hukum AdvokaID
        ├── LawyerAvatar.tsx          # Ilustrasi potret vektor advokat
        ├── LoginPage.tsx             # Halaman login Klien & Advokat + registrasi klien
        ├── LawyerDashboard.tsx       # Dashboard antrean perkara khusus Advokat
        ├── ConsultationRoom.tsx      # Ruang konsultasi & diskusi 2 arah (50:50 split)
        └── ContractReviewerPanel.tsx # Panel tinjauan pasal kontrak & anotasi risiko
```

---

## Daftar Akun Demo (Siap Pakai)

### Akun Klien
| Nama Klien | Email Login | Perusahaan / Keperluan |
| :--- | :--- | :--- |
| **Budi Santoso** | `budi.santoso@nusantarapangan.co.id` | PT Nusantara Pangan Sejahtera |
| **Nadia Karina Putri** | `nadia.karina@techcorp.id` | Manajer Produk — Perusahaan Teknologi |
| **Hendra Wijaya** | `hendra.wijaya@cilandakproperti.id` | Pembelian Ruko Komersial Cilandak |

### Akun Advokat (PERADI)
| Nama Advokat | NIA PERADI | Spesialisasi |
| :--- | :--- | :--- |
| **Rendra Mahendra, S.H., LL.M.** | `NIA. 12.04819` | Hukum Bisnis & Korporasi |
| **Anindya Pramesti, S.H., M.H., C.L.A.** | `NIA. 15.08342` | Hukum Ketenagakerjaan |
| **Dr. Bagaskara Wibisono, S.H., M.Kn.** | `NIA. 09.01924` | Hukum Perdata |
| **Larasati Kusumawardhani, S.H., M.H.** | `NIA. 13.06210` | Hukum Keluarga & Waris |
| **Tegar Prawira Negara, S.H., M.H.** | `NIA. 11.03385` | Hukum Pidana |

---

## Cara Menjalankan di Komputer Lokal (Localhost)

1. Pastikan **Node.js** (versi 18 atau lebih baru) sudah terpasang.
2. Ekstrak berkas arsip kode sumber ini ke dalam satu folder.
3. Buka terminal di folder proyek, lalu jalankan perintah instalasi paket:
   ```bash
   npm install
   ```
4. Jalankan server pengembangan (Express + WebSocket + Vite):
   ```bash
   npm run dev
   ```
5. Buka browser di alamat:
   ```text
   http://localhost:3000
   ```

---

## Cara Build untuk Hosting Statis / GitHub Pages

Jika ingin menghasilkan folder statis `dist/` untuk diunggah ke GitHub Pages, Netlify, atau Vercel:

```bash
npm run build
```

Hasil kompilasi akan berada di dalam folder `dist/`. Aplikasi sudah dilengkapi *fallback* autentikasi lokal sehingga tetap dapat dijalankan pada hosting statis seperti GitHub Pages (`github.io`).

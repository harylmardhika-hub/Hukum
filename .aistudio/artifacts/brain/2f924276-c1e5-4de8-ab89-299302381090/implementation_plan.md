# AdvokaID — Sinkronisasi Real-Time Lintas Tab & Pembukaan Konsultasi 1-Klik

Pembaruan ini memastikan setiap konsultasi baru, pengiriman pesan chat, unggahan kontrak, dan revisi pasal tersinkronisasi **secara instan (real-time)** antara tab **Klien** dan tab **Advokat** baik di server lokal/preview maupun di **GitHub Pages (`github.io`)**, serta mengganti formulir panjang menjadi pembukaan ruang chat langsung **1-klik**.

---

## User Review & Keputusan Utama

> [!IMPORTANT]
> Berdasarkan konfirmasi Anda pada tahap klarifikasi, berikut dua peningkatan utama yang akan diterapkan:

- **Keputusan 1 (Sinkronisasi Real-Time Antar Tab di Semua Lingkungan)**: Menggabungkan koneksi **WebSocket Server** dengan **`BroadcastChannel` API + `localStorage` Storage Event Listener** sehingga ketika Klien di Tab 1 memulai konsultasi atau mengirim pesan, halaman Dashboard/Ruang Konsultasi Advokat di Tab 2 langsung terperbarui seketika tanpa perlu *refresh* halaman—termasuk saat dibuka dari GitHub Pages.
- **Keputusan 2 (Masuk Ruang Chat 1-Klik Tanpa Form Panjang)**: Menekan tombol **"Mulai Chat"** pada kartu Advokat langsung membuat/membuka ruang konsultasi aktif bersama Advokat tersebut dan mengarahkan Klien ke ruang chat seketika tanpa harus mengisi formulir pendaftaran perkara terlebih dahulu.

---

## 1. Gambaran Umum & Konsep Inti

- **Apa yang Dilakukan**:
  1. Menghilangkan hambatan form manual saat Klien ingin berkonsultasi dengan Advokat pilihan.
  2. Menyediakan jalur komunikasi *dual-engine* (*WebSocket* + *Cross-Tab BroadcastChannel & Storage Sync*) agar seluruh perubahan state (`sessions`, `messages`, `documents`, `clients`, dan `typingInfo`) selalu identik di semua tab browser secara *real-time*.
- **Target Pengguna**: Klien yang ingin langsung berdiskusi dengan Advokat pilihannya di satu tab, dan Advokat yang memantau antrean perkara/chat masuk secara langsung di tab lain.
- **Nilai Utama**: Pengalaman konsultasi hukum yang benar-benar instan, responsif, dan tetap berjalan *real-time* meskipun di-deploy ke hosting statis seperti GitHub Pages.

---

## 2. Pengalaman Pengguna & Desain Visual

- **Alur Pengguna Baru (1-Klik Mulai Chat)**:
  1. **Klien** memilih Advokat di Direktori lalu menekan tombol **"Mulai Chat"**.
  2. Jika belum ada sesi perkara antara Klien tersebut dan Advokat yang dipilih, sistem otomatis membuka sesi konsultasi baru secara instan dan langsung menampilkan **Ruang Konsultasi (50:50 Chat & Kontrak)** tanpa pop-up form panjang.
  3. Di **Tab Advokat** yang sedang login dengan akun Advokat tersebut, perkara baru dan pesan dari Klien langsung muncul secara *real-time* di daftar antrean maupun di ruang chat.
  4. Jika Klien ingin melampirkan kontrak, Klien cukup menekan tombol **"Unggah Kontrak"** langsung di panel kanan ruang konsultasi.
- **Identitas Visual & Anti-Slop Swiss Editorial**:
  - **Palet Warna (60-30-10)**: Kanvas netral terang `#F8FAFC` (60%), permukaan kartu putih `#FFFFFF` dengan garis batas tegas `1px solid #E2E8F0` (30%), serta aksen utama `#0F172A` (Slate-900) dan `#B45309` (Amber-700) (10%).
  - **Tipografi & Hierarki**: Kombinasi *serif* editorial untuk judul utama, *Plus Jakarta Sans* untuk keterbacaan antarmuka, dan *JetBrains Mono* (`tabular-nums`) untuk nomor registrasi perkara, NIA PERADI, dan metrik pasal.
  - **Disiplin Anti-Slop**: Tanpa *pill badge* berlebihan pada metadata statis, tanpa garis aksen tebal di sisi kiri kartu, tanpa *glow/blur* dekoratif, dan tata letak 2 kolom seimbang (`lg:col-span-6` + `lg:col-span-6`).

---

## 3. Keputusan Produk & Pertimbangan Teknis

- **Keputusan 1: Arsitektur Sinkronisasi Hibrida (WebSocket + BroadcastChannel + LocalStorage)**
  - *Pendekatan*: Setiap aksi (`session:create`, `chat:send`, `chat:typing`, `contract:annotate_clause`, `contract:upload_document`, `session:update_opinion`, dan registrasi klien) dikirim ke WebSocket server **sekaligus** disimpan ke penyimpanan lokal bersama dan disiarkan melalui `BroadcastChannel('advokaid_realtime_channel')` serta event `storage`.
  - *Alasan*: Di GitHub Pages tidak ada server Node.js/WebSocket yang berjalan di latar belakang. Dengan *engine* hibrida ini, komunikasi antar-tab Klien dan Advokat tetap berjalan 100% *real-time* di GitHub Pages maupun di server lokal.
- **Keputusan 2: Pembuatan Sesi Instan 1-Klik (`startInstantConsultation`)**
  - *Pendekatan*: Mengganti modal form panjang saat klik "Mulai Chat" dengan pembuatan sesi otomatis yang langsung mengarahkan pengguna ke `ConsultationRoom` dan menyiarkan sesi baru tersebut ke tab Advokat.
  - *Alasan*: Pengguna tidak perlu mengetik manual judul dan kronologi panjang hanya untuk memulai percakapan.

---

## 4. Arsitektur Teknis & Strategi Data

### Diagram Arsitektur Sinkronisasi Real-Time

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    TAB 1: SESI KLIEN (sessionStorage)                   │
│  [Klik "Mulai Chat" / Kirim Pesan / Unggah Kontrak / Kutip Pasal]       │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
      (Jalur Server Lokal / Preview)     (Jalur Instan Lintas Tab & GitHub Pages)
                    ▼                                 ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│   Express + WebSocket (/ws:3000)  │ │  BroadcastChannel + localStorage  │
│  Broadcast event ke semua klien   │ │  ('advokaid_realtime_sync_v1')    │
└───────────────────┬───────────────┘ └───────────────┬───────────────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   TAB 2: SESI ADVOKAT (sessionStorage)                  │
│  [Reconcile State Idempoten -> Antrean & Ruang Chat Update Real-Time]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pemetaan Interaksi Komponen & State
- **Direktori Advokat (`Mulai Chat` 1-Klik)**:
  - Memeriksa apakah Klien sudah memiliki sesi dengan Advokat tersebut; jika belum, langsung membuat objek `ConsultationSession` baru beserta pesan pembuka otomatis, menyimpannya ke state bersama, menyiarkannya ke WebSocket & `BroadcastChannel`, dan langsung membuka tampilan `ConsultationRoom`.
- **Ruang Konsultasi (`ConsultationRoom`) & Tinjauan Kontrak (`ContractReviewerPanel`)**:
  - Pengiriman pesan chat, indikator sedang mengetik (*typing*), unggahan dokumen kontrak baru, revisi/anotasi pasal, dan pembaruan opini hukum langsung memicu sinkronisasi dua arah yang idempoten (mencegah duplikasi ID pesan/dokumen) sehingga tab lawan bicara langsung memperbarui layar dalam hitungan milidetik.
- **Pembaruan Paket Unduhan (`.RAR` & `.ZIP`)**:
  - Setelah kode selesai diperbarui dan dikompilasi ke `dist/`, paket `AdvokaID-SourceCode.rar` dan `AdvokaID-SourceCode.zip` ikut diperbarui otomatis.

# AdvokaID — Platform Konsultasi Hukum & Tinjauan Kontrak Real-Time

Platform konsultasi hukum digital yang menghubungkan masyarakat dan pelaku usaha di Indonesia langsung dengan advokat berlisensi (PERADI) melalui ruang diskusi real-time, dilengkapi fitur berbagi dokumen dan peninjauan pasal kontrak secara kolaboratif.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan utama yang telah dikonfirmasi dari jawaban Anda serta arsitektur yang direkomendasikan sebelum pembangunan aplikasi dimulai:

- **Keputusan Terkonfirmasi 1 — Simulasi Dua Peran (Klien & Dashboard Pengacara)**: Aplikasi menyediakan pengalih peran instan (*Role Switcher*) di area toolbar ruang kerja sehingga pengguna dapat merasakan alur lengkap sebagai **Klien** (mencari advokat, memulai konsultasi, mengunggah draf kontrak) maupun sebagai **Advokat/Pengacara** (menerima antrean kasus, membalas chat secara langsung, dan memberikan anotasi revisi pasal kontrak).
- **Keputusan Terkonfirmasi 2 — Berbagi Dokumen & Peninjauan Kontrak Hukum**: Setiap ruang konsultasi memiliki panel kolaborasi dokumen berdampingan dengan chat. Klien dapat melampirkan dokumen kontrak (mis. Perjanjian Kerja Sama, PKWT, Akta Jual Beli), dan Pengacara dapat menandai pasal berisiko, memberi catatan hukum, serta mengubah status klausul (*Aman*, *Perlu Revisi*, *Berisiko Tinggi*) secara real-time.
- **Keputusan Terkonfirmasi 3 — Cakupan Spesialisasi Hukum Indonesia Lengkap**: Direktori mencakup 5 bidang utama hukum Indonesia: **Hukum Perdata**, **Hukum Pidana**, **Hukum Bisnis & Korporasi**, **Hukum Keluarga & Waris**, serta **Hukum Ketenagakerjaan (PHI)** lengkap dengan nomor izin advokat (NIA PERADI), pengalaman, dan tarif transparan.

---

## 1. Overview & Core Concept

- **Apa yang Dilakukan Aplikasi**: Menyediakan ekosistem bantuan hukum terpadu tempat klien memilih pengacara berdasarkan bidang perkara, berdiskusi secara real-time melalui koneksi WebSocket aktif, dan meninjau dokumen hukum pasal demi pasal tanpa harus berpindah aplikasi.
- **Target Pengguna / Persona**:
  - **Klien (Individu & UMKM/Perusahaan)**: Membutuhkan kepastian hukum cepat, peninjauan surat perjanjian, atau pendampingan perkara perdata/pidana/ketenagakerjaan.
  - **Advokat / Konsultan Hukum**: Membutuhkan meja kerja digital (*command center*) yang rapi untuk mengelola antrean konsultasi klien, meninjau klausul kontrak secara terstruktur, dan menerbitkan ringkasan opini hukum (*Legal Opinion*).
- **Nilai Utama (Key Value)**: Menghilangkan hambatan birokrasi konsultasi hukum tradisional dengan transparansi keahlian advokat, komunikasi instan tersinkronisasi, dan telaah dokumen hukum yang presisi dalam satu layar.

---

## 2. User Experience & Visual Design

### Alur Pengguna Utama (Key User Flows)

1. **Eksplorasi & Pemilihan Advokat (Sisi Klien)**:
   - Pengguna melihat direktori advokat terverifikasi, memfilter berdasarkan 5 bidang hukum Indonesia, ketersediaan, atau mencari kata kunci kasus (mis. *"Sengketa tanah waris"*, *"Review kontrak vendor"*, *"PHK sepihak"*).
   - Membuka profil mendalam advokat (latar belakang pendidikan, yurisdiksi pengadilan, NIA PERADI, ulasan kasus) dan menekan **"Mulai Konsultasi"** untuk masuk ke ruang sesi.
2. **Ruang Konsultasi Real-Time & Peninjauan Kontrak (Layar Terbagi)**:
   - **Panel Kiri/Tengah (Chat Hukum Real-Time)**: Pertukaran pesan langsung dengan indikator kehadiran (*online/typing*), referensi cepat ke pasal dokumen yang sedang dibahas, dan pengiriman lampiran berkas.
   - **Panel Kanan (Meja Tinjauan Kontrak & Dokumen)**: Menampilkan isi dokumen per pasal/klausul. Klien dan Pengacara dapat mengklik pasal tertentu untuk melihat atau menambahkan catatan hukum (*Legal Annotation*), usulan redaksi pengganti (*Redlining*), dan status risiko klausul.
3. **Meja Kerja Advokat (Dashboard Pengacara)**:
   - Saat beralih ke mode **Dashboard Pengacara**, tampilan berubah menjadi meja kerja profesional yang memuat daftar sesi konsultasi aktif, antrean dokumen kontrak yang menunggu ditinjau, editor anotasi klausul, serta formulir penerbitan kesimpulan/rekomendasi hukum akhir.

### Identitas Visual & Tema

- **Aesthetic Direction**: *Institutional Legal Authority & Modern Workspace* — memadukan kewibawaan firma hukum korporat dengan kejelasan aplikasi produktivitas modern. Bersih, terstruktur, tanpa ornamen berlebihan.
- **Palet Warna & Atmosfer (60-30-10 Rule)**:
  - **60% Kanvas Netral Dominan**: Putih bersih (`#FFFFFF`) dan abu-abu batu tulis sangat lembut (`#F8FAFC`) untuk menjaga keterbacaan dokumen kontrak panjang.
  - **30% Permukaan Struktural**: Slate gelap (`#0F172A`) untuk sidebar navigasi dan struktur ruang kerja, dengan garis batas rambut (`#E2E8F0`) untuk memisahkan panel tanpa kartu bertumpuk (*single-elevation depth*).
  - **10% Aksen Fokus**: *Warm Legal Amber / Bronze* (`#B45309` / `#D97706`) untuk aksi utama dan penanda fokus, dipadukan warna semantik tegas + label teks untuk status klausul kontrak: Hijau Zamrud (`#15803D` - *Klausul Aman*), Amber (`#B45309` - *Perlu Revisi*), dan Merah Kirmizi (`#B91C1C` - *Risiko Hukum Tinggi*).
- **Tipografi & Hierarki (2+1 Font Rule)**:
  - **Display & Judul Editorial**: `Fraunces` atau `Playfair Display` untuk judul bagian utama dan identitas brand guna memancarkan kredibilitas institusi hukum.
  - **Antarmuka & Teks Kontrak**: `Plus Jakarta Sans` untuk keterbacaan tinggi pada ruang chat, daftar advokat, dan naskah pasal perjanjian.
  - **Data Numerik & Nomor Perkara**: `JetBrains Mono` (`tabular-nums`) khusus untuk nomor registrasi perkara, NIA PERADI, cap waktu (*timestamp*), dan rincian biaya konsultasi.
- **Disiplin Anti-Slop & Zero-Pill Metadata**:
  - Informasi metadata advokat (spesialisasi, pengalaman, yurisdiksi, nomor izin) ditampilkan sebagai teks bersih dengan pemisah tipografis (`Hukum Bisnis · 12 Tahun Pengalaman · NIA. 14.02891`), tanpa tumpukan lencana kapsul warna-warni.
  - Navigasi atas mematuhi kontrak 3-zona satu baris: Nama Brand di kiri, tautan navigasi teks di tengah, dan satu tombol aksi utama di kanan.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Infrastruktur Komunikasi Real-Time Sesungguhnya (WebSocket Server)**
  - *Pendekatan Terpilih*: Menggunakan server Express + WebSocket (`ws`) pada port yang sama (Port 3000) sebagai *single source of truth* untuk pesan chat, status ketikan (*typing*), unggahan dokumen kontrak, dan anotasi klausul.
  - *Mengapa*: Memastikan perubahan yang dilakukan pada mode Pengacara (misalnya menandai Pasal 4 sebagai *Berisiko Tinggi* atau mengirim pesan advis hukum) langsung muncul seketika di layar Klien (termasuk jika dibuka di dua tab browser berbeda).
  - *Alternatif yang Ditolak*: Menyimpan state hanya di memori lokal browser tanpa sinkronisasi server, karena tidak mencerminkan arsitektur aplikasi kolaborasi real-time yang sesungguhnya.
- **Keputusan 2: Peninjauan Kontrak Berbasis Klausul Terstruktur (Structured Clause Redlining)**
  - *Pendekatan Terpilih*: Dokumen kontrak direpresentasikan sebagai daftar pasal/klausul terstruktur yang dapat diklik, dikomentari, dan diajukan revisi redaksinya (*original text* vs *proposed legal revision*) serta ditautkan langsung ke gelembung chat.
  - *Mengapa*: Jauh lebih fungsional dan mudah ditindaklanjuti oleh klien awam maupun pengacara dibandingkan sekadar menampilkan lampiran file statis yang tidak bisa dianotasi di dalam aplikasi.

---

## 4. Technical Architecture & Data Strategy

### Diagram Arsitektur & Hirarki Komponen

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER (React 19 + Vite)                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Top Navigation Bar (3-Zone Contract: Brand | Nav Links | Primary CTA)  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Workspace Toolbar (Role Switcher: Mode Klien <-> Mode Dashboard Advokat│  │
│  │ + Active Lawyer Profile Selector + Connection Sync Status)             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│               │                                              │               │
│               ▼ (Mode Klien)                                 ▼ (Mode Advokat)│
│  ┌─────────────────────────────┐              ┌───────────────────────────┐  │
│  │   DIRECTORY & CASE INTAKE   │              │  LAWYER COMMAND DASHBOARD │  │
│  │ • Filter 5 Bidang Hukum     │              │ • Antrean Klien Aktif     │  │
│  │ • Pencarian Kasus & Advokat │              │ • Daftar Kontrak Menunggu │  │
│  │ • Modal Profil & Mulai Sesi │              │ • Ringkasan Beban Perkara │  │
│  └──────────────┬──────────────┘              └─────────────┬─────────────┘  │
│                 │                                           │                │
│                 └─────────────────────┬─────────────────────┘                │
│                                       ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │            SPLIT-SCREEN REAL-TIME CONSULTATION & REVIEW ROOM           │  │
│  │  ┌─────────────────────────────────┬────────────────────────────────┐  │  │
│  │  │   Real-Time Legal Chat Panel    │  Interactive Contract Reviewer │  │  │
│  │  │ • Aliran Pesan WebSocket        │ • Pemilih Dokumen / Unggah Baru│  │  │
│  │  │ • Kutipan Pasal (#Pasal-3)      │ • Daftar Klausul & Status Risiko│ │  │
│  │  │ • Indikator Mengetik            │ • Editor Anotasi & Usulan Revisi│ │  │
│  │  └─────────────────────────────────┴────────────────────────────────┘  │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │ WebSocket (ws://) & REST (/api/*)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS + WEBSOCKET SERVER (Port 3000)                   │
│                                                                              │
│  • Authoritative State Store: Advokat, Sesi Konsultasi, Pesan, & Kontrak     │
│  • Event Broadcast Engine:                                                   │
│    - chat:message_created     - contract:document_uploaded                   │
│    - chat:typing_status       - contract:clause_annotated                    │
│    - session:created          - session:legal_summary_published              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Model Data & Entitas Utama

- **Advokat (`Lawyer`)**: ID, Nama & Gelar Hukum (S.H., M.H., C.L.A.), Nomor Induk Advokat (NIA PERADI), Spesialisasi Utama (Perdata, Pidana, Bisnis, Keluarga, Ketenagakerjaan), Pengalaman (Tahun), Yurisdiksi/Kota, Tarif Konsultasi, Bio Keahlian, dan Status Ketersediaan.
- **Sesi Konsultasi (`ConsultationSession`)**: ID Sesi, ID Klien, ID Advokat, Judul Perkara, Kategori Hukum, Status Sesi (*Aktif*, *Menunggu Tinjauan Kontrak*, *Selesai*), Waktu Mulai, dan Kesimpulan Hukum (*Legal Opinion Summary*).
- **Pesan Chat (`ChatMessage`)**: ID Pesan (idempoten), ID Sesi, Pengirim (*client* / *lawyer*), Nama Pengirim, Isi Pesan, Referensi Klausul Opsional (`clauseId`), Lampiran Dokumen Opsional, dan Cap Waktu.
- **Dokumen & Klausul Kontrak (`LegalDocument` & `ContractClause`)**:
  - Dokumen memiliki Judul, Jenis Akta/Perjanjian, Tanggal Unggah, dan Status Tinjauan Keseluruhan.
  - Setiap Dokumen memuat daftar `ContractClause` (Nomor Pasal, Judul Pasal, Teks Asli, Status Risiko: `safe` | `warning` | `critical`, Catatan Hukum Pengacara, dan Usulan Redaksi Revisi).

### Pemetaan Interaksi & State (Interactive Component Mapping)

- **Filter & Pencarian Direktori**: Mengubah state filter spesialisasi (`Semua`, `Perdata`, `Pidana`, `Bisnis`, `Keluarga`, `Ketenagakerjaan`) dan kata kunci secara instan dengan penanganan *empty state* (tombol reset filter jika pencarian tidak ditemukan).
- **Inisiasi Konsultasi Baru**: Memilih advokat dan mengisi deskripsi singkat perkara akan mengirim event `session:create` ke server, membuat ruang konsultasi baru, dan langsung mengarahkan pengguna ke ruang chat tersebut.
- **Unggah & Buat Draf Dokumen Kontrak**: Klien dapat memilih dari templat kontrak nyata Indonesia (mis. *Perjanjian Kerja Waktu Tertentu / PKWT*, *Perjanjian Sewa Menyewa Properti*, *Perjanjian Pemegang Saham & Investasi*) atau menempelkan teks klausul kontrak sendiri untuk langsung dipecah menjadi pasal-pasal yang siap ditinjau.
- **Anotasi Klausul & Tautan Chat**: Saat Pengacara mengubah status pasal atau menyimpan usulan revisi redaksi pada panel kontrak, server menyiarkan `contract:clause_annotated` ke seluruh klien yang terhubung dan secara otomatis menyisipkan kartu pembaruan klausul di aliran chat agar mudah didiskusikan.

# AdvokaID — Mesin Advokat Otomatis (Respon Chat & Rombak Kontrak Real-Time)

Pembaruan ini menghadirkan **Mesin Advokat Otomatis Pintar** yang membuat Advokat pendamping langsung merespons setiap pesan dan permintaan Klien secara otomatis—termasuk **merombak bunyi pasal kontrak, memperbarui catatan hukum, mengubah status risiko pasal (Risiko Tinggi / Perlu Revisi / Aman), menambahkan pasal baru jika diminta, serta memperbarui ringkasan Opini Hukum** secara *real-time*, sambil tetap mengizinkan balasan atau revisi manual dari tab Advokat kapan saja.

---

## User Review & Keputusan Utama

> [!IMPORTANT]
> Berdasarkan pilihan yang Anda konfirmasi pada tahap klarifikasi:

- **Keputusan 1 (Otomatis Merombak Pasal, Catatan Hukum & Membalas Chat Sekaligus)**: Setiap kali Klien mengirim pesan di ruang chat (misalnya: *"Tolong rombak Pasal 2 agar denda 40% dihapus"*, *"Ubah jangka waktu bayar Pasal 3 jadi 30 hari"*, *"Tambahkan pasal kerahasiaan data"*, atau bertanya hukum), Advokat langsung membalas di chat **sekaligus memperbarui teks pasal/revisi di panel Tinjauan Kontrak sebelah kanan** secara otomatis.
- **Keputusan 2 (Selalu Aktif Otomatis + Tetap Bisa Manual dari Tab Advokat)**: Fitur respon dan rombak otomatis selalu aktif setiap kali Klien mengirim pesan, dan seluruh hasilnya langsung tersinkronisasi ke tab Advokat maupun tab Klien (termasuk di GitHub Pages `github.io`). Jika Anda membuka tab Advokat, Anda juga tetap bisa mengetik balasan atau mengedit pasal secara manual.

---

## 1. Gambaran Umum & Konsep Inti

- **Apa yang Dilakukan**:
  1. Ketika Klien mengirim pesan atau mengutip suatu pasal kontrak di ruang chat, indikator *"Advokat sedang mengetik..."* langsung menyala.
  2. Sistem menganalisis isi permintaan Klien beserta seluruh daftar pasal kontrak yang sedang aktif pada sesi tersebut.
  3. Dalam waktu singkat (~1,2 detik), Advokat:
     - Mengirimkan balasan konsultasi hukum yang spesifik sesuai yurisdiksi hukum Indonesia (KUHPerdata, UU Ketenagakerjaan/PP 35/2021, UU PT, Hukum Pertanahan, Pidana/UU ITE, atau Waris).
     - **Merombak langsung pasal terkait** di panel kanan (`originalText` / `proposedRevision`, `lawyerNote`, dan `riskStatus`) serta menyorot (*highlight*) pasal yang baru saja dirombak.
     - **Menambahkan pasal baru** ke dokumen kontrak apabila Klien meminta penambahan pasal (contoh: *"Tolong tambahkan pasal Force Majeure / Kerahasiaan"*).
     - **Memperbarui Ringkasan Opini Hukum** perkara jika terjadi perubahan substansi kontrak.
- **Target Pengguna**: Klien yang ingin merasakan pengalaman konsultasi dan negosiasi/rombak kontrak interaktif tanpa harus berpindah tab, maupun pengguna yang menguji kolaborasi dua arah.
- **Nilai Utama**: Simulasi dan asistensi hukum yang hidup—setiap instruksi Klien di chat benar-benar mengubah isi dokumen kontrak di meja tinjauan secara *real-time*.

---

## 2. Pengalaman Pengguna & Desain Visual

- **Alur Interaksi Rombak & Konsultasi Otomatis**:
  1. **Klien Mengirim Instruksi**: Klien mengetik bebas di chat (misal: *"Pak Rendra, tolong rombak Pasal 2 supaya tidak ada denda 40% dan ubah jadi evaluasi bersama"* atau klik tombol cepat).
  2. **Status Mengetik Real-Time**: Muncul indikator bahwa Advokat sedang menelaah dan menyusun revisi pasal.
  3. **Eksekusi Rombak Kontrak + Balasan Chat**:
     - Panel kanan otomatis memperbarui kartu pasal yang dimaksud: menampilkan **Usulan Perbaikan Pasal** yang baru, memperbarui **Catatan Hukum Advokat**, dan mengubah status pasal menjadi **Aman** atau **Perlu Revisi** sesuai hasil rombakan.
     - Pesan balasan Advokat muncul di ruang chat lengkap dengan tombol **Rujukan Pasal** yang bila diklik langsung menggulir (*scroll* & *highlight*) ke pasal yang baru dirombak di panel kanan.
- **Tombol Instruksi Cepat (Quick Prompts) Lebih Kaya**:
  - Menyediakan pintasan permintaan rombak kontrak bagi Klien seperti:
    - *"Tolong rombak pasal berisiko tinggi agar aman bagi kami"*
    - *"Hapus sanksi denda sepihak pada pasal ini"*
    - *"Tambahkan pasal Force Majeure & Penyelesaian Sengketa"*
    - *"Berikan pendapat hukum atas keseluruhan kontrak ini"*
- **Identitas Visual**: Tetap konsisten dengan gaya **Anti-Slop Swiss Editorial** (`1px solid` *hairline border*, tata letak simetris 50:50 antara Ruang Chat dan Meja Tinjauan Kontrak).

---

## 3. Keputusan Produk & Pertimbangan Teknis

- **Keputusan 1: Mesin Hibrida (Server-Side `@google/genai` + Mesin Hukum Kontekstual Client-Side)**
  - *Pendekatan*:
    1. Pada lingkungan server (`server.ts`), menyediakan endpoint `/api/advocate/auto-respond` menggunakan SDK `@google/genai` (`gemini-3.8-flash` dengan `responseSchema` terstruktur) yang mengembalikan JSON berisi balasan chat Advokat, daftar pasal yang dirombak (`clauseUpdates`), pasal baru (`newClause`), dan pembaruan opini hukum (`updatedOpinion`).
    2. Dilengkapi **Mesin Analisis & Rombak Kontrak Kontekstual Pintar** di sisi aplikasi yang memahami instruksi Bahasa Indonesia (deteksi nomor pasal, kata kunci *rombak/ubah/hapus/ganti/denda/hari/persen/tambah pasal/force majeure/kerahasiaan/pesangon/kuasa menjual/waris/pidana*) sehingga **meskipun dibuka di GitHub Pages (`github.io`) tanpa server backend, fitur rombak pasal & balasan otomatis tetap berjalan 100% cerdas dan instan!**
- **Keputusan 2: Sinkronisasi Penuh ke Tab Advokat & Video Remotion**
  - *Pendekatan*: Semua hasil rombakan pasal dan balasan otomatis Advokat disimpan ke state bersama (`BroadcastChannel` + `localStorage` + WebSocket) sehingga tab Advokat dan **Video Ringkasan (Remotion)** langsung menampilkan jumlah pasal aman/revisi terbaru secara *real-time*.

---

## 4. Arsitektur Teknis & Strategi Data

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        KLIEN MENGIRIM PESAN CHAT                        │
│   Contoh: "Tolong rombak Pasal 2 agar denda 40% dihapus & jadi aman"    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             MESIN ADVOKAT OTOMATIS (HYBRID AI + LEGAL ENGINE)           │
│  1. Nyalakan indikator "Advokat sedang mengetik..."                     │
│  2. Panggil /api/advocate/auto-respond (Gemini 3.8 Flash Structured)    │
│     ATAU Kontekstual Legal Parser Engine (saat di GitHub Pages)         │
└───────────────┬───────────────────────────────────┬─────────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│   PANEL KIRI: RUANG CHAT HUKUM    │ │ PANEL KANAN: TINJAUAN KONTRAK     │
│ • Balasan Advokat sesuai keahlian │ │ • Rombak bunyi Usulan Perbaikan   │
│ • Tautan Rujukan Pasal otomatis   │ │ • Update Catatan Hukum & Status   │
│ • Update Ringkasan Opini Hukum    │ │ • Tambah Pasal Baru (jika diminta)│
└───────────────┬───────────────────┘ └─────────────┬─────────────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│        SINKRONISASI REAL-TIME (WebSocket + BroadcastChannel)            │
│   Tersinkronisasi otomatis ke Tab Advokat & Video Ringkasan Remotion    │
└─────────────────────────────────────────────────────────────────────────┘
```

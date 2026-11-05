# Rencana Implementasi: Penambahan Klien Aisyah Unardi & Sesi Konsultasi Aktif

## 1. Profil Akun Klien Baru (`src/data/initialLegalData.ts`)
- Menambahkan akun klien **Aisyah Unardi** ke dalam `INITIAL_CLIENTS`:
  - **ID**: `cli-4`
  - **Nama Lengkap**: `Aisyah Unardi`
  - **Email**: `aisyah.unardi@mahkotaniaga.co.id`
  - **Jabatan / Perusahaan**: `Direktur Operasional — PT Mahkota Niaga Nusantara`
  - **Telepon**: `0811-9284-550`
- Menampilkan kartu login cepat (**Aisyah Unardi**) di halaman **Portal Klien** (`LoginPage.tsx`) agar dapat langsung dipilih dengan 1 klik.

## 2. Sesi Konsultasi & Draf Kontrak Siap Pakai (`src/data/initialLegalData.ts`)
- Menambahkan 1 sesi konsultasi aktif (`ses-4`, Nomor Perkara `REG/2026/ADV-0912`) untuk **Aisyah Unardi** bersama Advokat **Rendra Mahendra, S.H., LL.M.** (*Hukum Bisnis & Korporasi*).
- Menyertakan riwayat pesan pembuka yang natural di `INITIAL_MESSAGES` serta 1 dokumen kontrak komersial siap tinjau di `INITIAL_DOCUMENTS` (*Perjanjian Kerja Sama Pasokan & Kemitraan Strategis B2B* — 4 pasal mencakup klausul berisiko tinggi, perlu revisi, dan aman) sehingga Aisyah dapat langsung mengobrol dan meminta rombak pasal otomatis.

## 3. Pembaruan Kunci Penyimpanan Real-Time (`src/utils/realtimeSync.ts`)
- Memperbarui versi penyimpanan lokal (`SHARED_STATE_STORAGE_KEY`) agar akun **Aisyah Unardi** beserta sesi dan kontraknya langsung muncul tanpa tertimpa cache lama di browser maupun GitHub Pages.

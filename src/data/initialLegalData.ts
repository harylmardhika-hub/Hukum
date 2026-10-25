import {
  ClientAccount,
  Lawyer,
  ConsultationSession,
  ChatMessage,
  LegalDocument,
  ContractTemplate,
} from '../types/legal';

export const INITIAL_CLIENTS: ClientAccount[] = [
  {
    id: 'cli-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@nusantarapangan.co.id',
    company: 'PT Nusantara Pangan Sejahtera',
    phone: '0811-8420-910',
  },
  {
    id: 'cli-2',
    name: 'Nadia Karina Putri',
    email: 'nadia.karina@techcorp.id',
    company: 'VP Product — Perusahaan Teknologi',
    phone: '0812-9031-442',
  },
  {
    id: 'cli-3',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@cilandakproperti.id',
    company: 'Akuisisi Ruko Komersial Cilandak',
    phone: '0813-1128-705',
  },
];

export const INITIAL_LAWYERS: Lawyer[] = [
  {
    id: 'lw-1',
    name: 'Rendra Mahendra, S.H., LL.M.',
    email: 'rendra.mahendra@advokaid.id',
    title: 'Managing Partner — Hukum Korporasi & Kontrak Komersial',
    niaPeradi: 'NIA. 12.04819',
    specialty: 'Hukum Bisnis & Korporasi',
    secondarySpecialties: [
      'Merger & Akuisisi',
      'Kontrak Distribusi & Lisensi',
      'Sengketa Pemegang Saham',
    ],
    experienceYears: 14,
    jurisdiction: 'PN Jakarta Selatan & BANI',
    almaMater: 'Fakultas Hukum Universitas Indonesia & Leiden University',
    consultationFee: 450000,
    rating: 4.95,
    casesHandled: 318,
    responseTimeMinutes: 2,
    isOnline: true,
    bio: 'Berfokus pada penyusunan dan peninjauan kontrak bisnis strategis, perjanjian pemegang saham (SHA), investasi startup, serta penyelesaian sengketa komersial melalui Badan Arbitrase Nasional Indonesia (BANI).',
    notableCredentials: [
      'Terdaftar Resmi PERADI & Asosiasi Kurator dan Pengurus Indonesia (AKPI)',
      'Konsultan Hukum Pasar Modal Tersertifikasi (HKHPM)',
      'Mediator Terakreditasi Mahkamah Agung RI',
    ],
    avatarStyle: {
      bgGradient: 'from-slate-800 to-slate-950',
      suitColor: '#0F172A',
      accentColor: '#D97706',
      initials: 'RM',
      gender: 'male',
    },
  },
  {
    id: 'lw-2',
    name: 'Anindya Pramesti, S.H., M.H., C.L.A.',
    email: 'anindya.pramesti@advokaid.id',
    title: 'Senior Counsel — Hukum Ketenagakerjaan & Hubungan Industrial',
    niaPeradi: 'NIA. 15.08342',
    specialty: 'Hukum Ketenagakerjaan',
    secondarySpecialties: [
      'Perjanjian Kerja (PKWT/PKWTT)',
      'Sengketa PHK & Pesangon',
      'Peraturan Perusahaan & PKB',
    ],
    experienceYears: 11,
    jurisdiction: 'Pengadilan Hubungan Industrial (PHI) Jakarta Pusat',
    almaMater: 'Fakultas Hukum Universitas Gadjah Mada',
    consultationFee: 350000,
    rating: 4.92,
    casesHandled: 274,
    responseTimeMinutes: 3,
    isOnline: true,
    bio: 'Ahli hukum ketenagakerjaan dan auditor hukum bersertifikat (C.L.A.) yang mendampingi pekerja eksekutif maupun korporasi dalam negosiasi bipartit, tripartit Disnaker, hingga litigasi di Pengadilan Hubungan Industrial sesuai UU Cipta Kerja & PP No. 35/2021.',
    notableCredentials: [
      'Certified Legal Auditor (C.L.A.) — Jimly School of Law',
      'Kuasa Hukum Khusus Pengadilan Hubungan Industrial (PHI)',
      'Anggota Komite Advokasi Ketenagakerjaan PERADI Jakarta',
    ],
    avatarStyle: {
      bgGradient: 'from-stone-800 to-slate-900',
      suitColor: '#1E293B',
      accentColor: '#B45309',
      initials: 'AP',
      gender: 'female',
    },
  },
  {
    id: 'lw-3',
    name: 'Dr. Bagaskara Wibisono, S.H., M.Kn.',
    email: 'bagaskara.wibisono@advokaid.id',
    title: 'Partner — Hukum Perdata, Pertanahan & Wanprestasi',
    niaPeradi: 'NIA. 09.01924',
    specialty: 'Hukum Perdata',
    secondarySpecialties: [
      'Sengketa Tanah & SHM/SHGB',
      'Gugatan Wanprestasi & PMH',
      'Akta PPJB & Sewa Komersial',
    ],
    experienceYears: 17,
    jurisdiction: 'PN Jakarta Barat & PN Tangerang',
    almaMater: 'Fakultas Hukum Universitas Padjadjaran',
    consultationFee: 400000,
    rating: 4.96,
    casesHandled: 412,
    responseTimeMinutes: 4,
    isOnline: true,
    bio: 'Spesialis sengketa perdata umum, uji tuntas pertanahan (legal due diligence properti), akta Perjanjian Pengikatan Jual Beli (PPJB), serta gugatan Wanprestasi dan Perbuatan Melawan Hukum (Pasal 1365 KUHPerdata).',
    notableCredentials: [
      'Doktor Ilmu Hukum Keperdataan Universitas Padjadjaran',
      'Magister Kenotariatan (M.Kn.) dengan Keahlian Agraria & Pertanahan',
      '17 Tahun Praktik Litigasi Perdata & Eksekusi Jaminan',
    ],
    avatarStyle: {
      bgGradient: 'from-slate-900 to-zinc-900',
      suitColor: '#18181B',
      accentColor: '#D97706',
      initials: 'BW',
      gender: 'male',
      glasses: true,
    },
  },
  {
    id: 'lw-4',
    name: 'Larasati Kusumawardhani, S.H., M.H.',
    email: 'larasati.kusuma@advokaid.id',
    title: 'Senior Partner — Hukum Keluarga, Waris & Harta Bersama',
    niaPeradi: 'NIA. 13.06210',
    specialty: 'Hukum Keluarga & Waris',
    secondarySpecialties: [
      'Pembagian Waris (Perdata & Islam)',
      'Perjanjian Pranikah & Pisah Harta',
      'Hak Asuh & Harta Gono-Gini',
    ],
    experienceYears: 12,
    jurisdiction: 'PN Jakarta Selatan & Pengadilan Agama',
    almaMater: 'Fakultas Hukum Universitas Airlangga',
    consultationFee: 325000,
    rating: 4.94,
    casesHandled: 289,
    responseTimeMinutes: 2,
    isOnline: true,
    bio: 'Menangani penyelesaian sengketa keluarga dengan pendekatan humanis dan kerahasiaan tinggi, meliputi fatwa dan pembagian waris (KUHPerdata maupun Kompilasi Hukum Islam), perjanjian perkawinan (prenuptial/postnuptial agreement), serta mediasi harta bersama.',
    notableCredentials: [
      'Mediator Keluarga Bersertifikat Mahkamah Agung RI',
      'Spesialis Hukum Waris Perdata Barat & Hukum Kewarisan Islam',
      'Penasihat Hukum Perwalian & Perlindungan Aset Keluarga',
    ],
    avatarStyle: {
      bgGradient: 'from-neutral-800 to-stone-950',
      suitColor: '#27272A',
      accentColor: '#B45309',
      initials: 'LK',
      gender: 'female',
    },
  },
  {
    id: 'lw-5',
    name: 'Tegar Prawira Negara, S.H., M.H.',
    email: 'tegar.prawira@advokaid.id',
    title: 'Managing Litigator — Hukum Pidana Khusus & Siber',
    niaPeradi: 'NIA. 11.03385',
    specialty: 'Hukum Pidana',
    secondarySpecialties: [
      'Tindak Pidana Ekonomi & Korporasi',
      'UU ITE & Kejahatan Siber',
      'Pendampingan BAP Kepolisian',
    ],
    experienceYears: 15,
    jurisdiction: 'Bareskrim Polri, Polda Metro Jaya & PN Se-Jabodetabek',
    almaMater: 'Fakultas Hukum Universitas Diponegoro',
    consultationFee: 475000,
    rating: 4.91,
    casesHandled: 340,
    responseTimeMinutes: 5,
    isOnline: true,
    bio: 'Advokat litigasi pidana berpengalaman dalam pendampingan saksi maupun tersangka pada tahap penyelidikan/penyidikan (BAP Kepolisian), praperadilan, pidana penipuan/penggelapan bisnis (Pasal 372/378 KUHP), serta delik UU ITE.',
    notableCredentials: [
      'Ketua Tim Pembela Litigasi Pidana Korporasi & Kejahatan Siber',
      'Ahli Hukum Acara Pidana & Strategi Praperadilan',
      'Anggota Perhimpunan Advokat Indonesia (PERADI) Sejak 2011',
    ],
    avatarStyle: {
      bgGradient: 'from-slate-900 to-slate-950',
      suitColor: '#09090B',
      accentColor: '#D97706',
      initials: 'TP',
      gender: 'male',
      glasses: true,
    },
  },
];

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tpl-pks-distribusi',
    title: 'Perjanjian Kerja Sama (PKS) Distribusi & Lisensi Eksklusif',
    documentType: 'Kontrak Komersial B2B',
    category: 'Hukum Bisnis & Korporasi',
    description:
      'Draf kontrak penunjukan distributor eksklusif mencakup target kuota pembelian, HKI, denda keterlambatan, dan klausul pengakhiran.',
    clauses: [
      {
        clauseNumber: 'Pasal 1',
        title: 'Penunjukan & Wilayah Eksklusivitas',
        originalText:
          'PIHAK PERTAMA dengan ini menunjuk PIHAK KEDUA sebagai Distributor Tunggal untuk memasarkan produk di wilayah Provinsi DKI Jakarta dan Jawa Barat selama jangka waktu 3 (tiga) tahun sejak ditandatanganinya Perjanjian ini.',
        riskStatus: 'safe',
        lawyerNote:
          'Rumusan wilayah dan durasi 3 tahun sudah jelas dan memenuhi asas kepastian hukum Pasal 1320 KUHPerdata.',
        proposedRevision: '',
      },
      {
        clauseNumber: 'Pasal 2',
        title: 'Target Pembelian Minimum & Sanksi Kuota',
        originalText:
          'Apabila PIHAK KEDUA gagal mencapai target pembelian minimum sebesar Rp 1.500.000.000 per kuartal dalam kondisi apa pun termasuk gangguan rantai pasok dari PIHAK PERTAMA, maka PIHAK KEDUA wajib membayar kompensasi kekurangan kuota sebesar 40% secara tunai seketika.',
        riskStatus: 'critical',
        lawyerNote:
          'BERISIKO TINGGI: Membebankan denda 40% kepada Pihak Kedua bahkan ketika kegagalan pasokan berasal dari Pihak Pertama sangat berat sebelah dan berpotensi batal demi hukum karena penyalahgunaan keadaan (misbruik van omstandigheden).',
        proposedRevision:
          'Kewajiban pencapaian target pembelian minimum dikecualikan apabila terjadi keterlambatan pengiriman atau kelangkaan stok dari PIHAK PERTAMA. Apabila kekurangan kuota murni disebabkan oleh kelalaian PIHAK KEDUA selama 2 (dua) kuartal berturut-turut, sanksi berupa evaluasi status eksklusivitas tanpa denda tunai sepihak.',
      },
      {
        clauseNumber: 'Pasal 3',
        title: 'Jangka Waktu Pembayaran & Denda Keterlambatan',
        originalText:
          'Pembayaran tagihan wajib dilunasi paling lambat 14 (empat belas) hari kalender sejak tanggal faktur diterbitkan. Keterlambatan pembayaran dikenakan denda sebesar 1% (satu persen) per hari tanpa batas maksimum.',
        riskStatus: 'warning',
        lawyerNote:
          'PERLU REVISI: Denda 1% per hari (setara 365% per tahun) tanpa batas atas (cap) terlalu eksesif dalam praktik hukum dagang Indonesia.',
        proposedRevision:
          'Pembayaran tagihan wajib dilunasi paling lambat 30 (tiga puluh) hari kalender sejak barang diterima lengkap (Berita Acara Serah Terima). Keterlambatan pembayaran dikenakan denda sebesar 0,1% per hari dengan batas maksimum akumulasi denda 5% dari nilai faktur terkait.',
      },
      {
        clauseNumber: 'Pasal 4',
        title: 'Pengakhiran Sepihak & Pengesampingan Pasal 1266 KUHPerdata',
        originalText:
          'PIHAK PERTAMA berhak mengakhiri Perjanjian ini secara sepihak sewaktu-waktu dengan pemberitahuan tertulis 3 (tiga) hari sebelumnya tanpa kewajiban membeli kembali sisa stok barang yang telah dibayar oleh PIHAK KEDUA.',
        riskStatus: 'critical',
        lawyerNote:
          'BERISIKO TINGGI: Pemberitahuan 3 hari tanpa buyback stok membuat Pihak Kedua menanggung kerugian modal kerja yang besar.',
        proposedRevision:
          'Pengakhiran Perjanjian sebelum berakhirnya jangka waktu hanya dapat dilakukan atas dasar pelanggaran material yang tidak diperbaiki dalam 30 hari setelah surat teguran (somasi), dan wajib disertai pemberitahuan 60 hari sebelumnya serta kewajiban PIHAK PERTAMA membeli kembali (buyback) stok barang layak jual pada harga beli awal.',
      },
    ],
  },
  {
    id: 'tpl-pkwt-eksekutif',
    title: 'Perjanjian Kerja Waktu Tertentu (PKWT) & Klausul Non-Kompetisi',
    documentType: 'Kontrak Ketenagakerjaan (PP 35/2021)',
    category: 'Hukum Ketenagakerjaan',
    description:
      'Naskah kontrak kerja profesional dengan klausul uang kompensasi PKWT, kerahasiaan dagang, dan pembatasan pindah ke kompetitor.',
    clauses: [
      {
        clauseNumber: 'Pasal 1',
        title: 'Jangka Waktu PKWT & Masa Percobaan (Probation)',
        originalText:
          'Perjanjian Kerja Waktu Tertentu (PKWT) ini berlaku selama 24 (dua puluh empat) bulan dengan masa percobaan (probation) selama 3 (tiga) bulan pertama di mana Perusahaan dapat memutuskan hubungan kerja tanpa kompensasi.',
        riskStatus: 'critical',
        lawyerNote:
          'MELANGGAR UNDANG-UNDANG: Berdasarkan Pasal 58 ayat (1) UU Ketenagakerjaan jo. UU Cipta Kerja dan PP No. 35 Tahun 2021, PKWT DILARANG mensyaratkan masa percobaan. Jika disyaratkan, masa percobaan batal demi hukum dan masa kerja tetap dihitung.',
        proposedRevision:
          'Perjanjian Kerja Waktu Tertentu (PKWT) ini berlaku selama 24 (dua puluh empat) bulan terhitung sejak tanggal efektif bekerja tanpa adanya masa percobaan (probation), sesuai ketentuan PP No. 35 Tahun 2021.',
      },
      {
        clauseNumber: 'Pasal 2',
        title: 'Hak Uang Kompensasi Berakhirnya PKWT',
        originalText:
          'Pada saat PKWT berakhir sesuai jangka waktu yang diperjanjikan, Pekerja tidak berhak menuntut uang pesangon, uang penghargaan masa kerja, ataupun uang kompensasi dalam bentuk apa pun.',
        riskStatus: 'critical',
        lawyerNote:
          'MELANGGAR PP 35/2021: Pengusaha wajib memberikan Uang Kompensasi kepada Pekerja PKWT yang memiliki masa kerja minimal 1 bulan secara terus-menerus (sebesar 1 bulan upah untuk tiap 12 bulan masa kerja).',
        proposedRevision:
          'Pada saat berakhirnya jangka waktu PKWT, Perusahaan wajib membayarkan Uang Kompensasi PKWT kepada Pekerja yang dihitung secara proporsional sesuai Pasal 15 dan Pasal 16 Peraturan Pemerintah Nomor 35 Tahun 2021.',
      },
      {
        clauseNumber: 'Pasal 3',
        title: 'Klausul Non-Kompetisi (Non-Compete Clause)',
        originalText:
          'Pekerja dilarang bekerja pada perusahaan sejenis atau mendirikan usaha di bidang teknologi informasi di seluruh wilayah Republik Indonesia selama 5 (lima) tahun setelah berakhirnya hubungan kerja.',
        riskStatus: 'warning',
        lawyerNote:
          'PERLU REVISI: Larangan bekerja selama 5 tahun di seluruh Indonesia bertentangan dengan Pasal 27 ayat (2) UUD 1945 dan Pasal 31 UU Ketenagakerjaan tentang hak memilih pekerjaan. Batasi maksimal 6–12 bulan pada kompetitor langsung yang spesifik.',
        proposedRevision:
          'Selama 6 (enam) bulan sejak berakhirnya hubungan kerja, Pekerja sepakat untuk tidak membocorkan rahasia dagang Perusahaan kepada 3 (tiga) perusahaan kompetitor langsung yang tercantum dalam Lampiran Khusus Perjanjian ini.',
      },
    ],
  },
  {
    id: 'tpl-ppjb-properti',
    title: 'Akta Pengikatan Jual Beli (PPJB) Tanah & Bangunan Komersial',
    documentType: 'Akta & Perjanjian Properti',
    category: 'Hukum Perdata',
    description:
      'Draf PPJB properti mencakup jaminan keaslian Sertifikat Hak Milik (SHM), jadwal pembayaran bertahap, dan penandatanganan AJB di PPAT.',
    clauses: [
      {
        clauseNumber: 'Pasal 1',
        title: 'Jaminan Status Hukum Objek Tanah & Bangunan',
        originalText:
          'PIHAK PENJUAL menjamin bahwa sebidang tanah Sertifikat Hak Milik (SHM) Nomor 04192/Cilandak seluas 450 m2 adalah sah milik Penjual, bebas dari sita jaminan, sengketa waris, maupun hak tanggungan bank.',
        riskStatus: 'safe',
        lawyerNote:
          'Rumusan jaminan (representations & warranties) sudah tepat. Pastikan dilakukan pengecekan fisik sertifikat (plotting BPN) sebelum pembayaran uang muka.',
        proposedRevision: '',
      },
      {
        clauseNumber: 'Pasal 2',
        title: 'Pajak Penjual (PPh Final) & Pajak Pembeli (BPHTB)',
        originalText:
          'Seluruh pajak, bea perolehan hak atas tanah dan bangunan (BPHTB), Pajak Penghasilan (PPh) pengalihan hak atas tanah, serta tunggakan PBB tahun-tahun sebelumnya ditanggung sepenuhnya oleh PIHAK PEMBELI.',
        riskStatus: 'warning',
        lawyerNote:
          'PERLU REVISI: Secara normatif (PP No. 34 Tahun 2016), PPh Final (2,5%) adalah kewajiban Penjual dan tunggakan PBB sebelum transaksi adalah tanggung jawab Penjual.',
        proposedRevision:
          'Pajak Penghasilan (PPh Final 2,5%) atas pengalihan hak serta pelunasan PBB hingga tahun berjalan ditanggung oleh PIHAK PENJUAL, sedangkan Bea Perolehan Hak atas Tanah dan Bangunan (BPHTB 5%) dan biaya balik nama SHM ditanggung oleh PIHAK PEMBELI.',
      },
      {
        clauseNumber: 'Pasal 3',
        title: 'Kuasa Menjual & Penandatanganan AJB di Hadapan PPAT',
        originalText:
          'Apabila PIHAK PEMBELI telah melunasi 100% harga jual beli namun PIHAK PENJUAL berhalangan hadir untuk menandatangani Akta Jual Beli (AJB), maka penandatanganan AJB ditunda sampai PIHAK PENJUAL bersedia hadir.',
        riskStatus: 'critical',
        lawyerNote:
          'BERISIKO TINGGI: Tanpa klausul Kuasa Menjual mutlak pada PPJB Lunas, Pembeli yang sudah membayar 100% berisiko tersandera jika Penjual mangkir atau sulit dihubungi saat akan balik nama di PPAT.',
        proposedRevision:
          'Dengan lunasnya 100% harga jual beli, PPJB ini sekaligus berlaku sebagai Kuasa Menjual yang tidak dapat ditarik kembali (onherroepelijke volmacht) dari PIHAK PENJUAL kepada PIHAK PEMBELI untuk menghadap PPAT dan menandatangani Akta Jual Beli (AJB).',
      },
    ],
  },
];

export const INITIAL_SESSIONS: ConsultationSession[] = [
  {
    id: 'ses-101',
    caseNumber: 'REG/2026/BIZ-0841',
    clientId: 'cli-1',
    clientName: 'Budi Santoso',
    clientCompany: 'PT Nusantara Pangan Sejahtera',
    lawyerId: 'lw-1',
    title: 'Peninjauan Kontrak Distribusi Eksklusif & Klausul Denda Kuota',
    category: 'Hukum Bisnis & Korporasi',
    status: 'Aktif',
    startedAt: '14:10 WIB',
    legalOpinionSummary:
      'Berdasarkan telaah awal atas Draf PKS Distribusi PT Nusantara Pangan, terdapat 2 klausul berisiko tinggi (Pasal 2 mengenai Denda Kuota 40% dan Pasal 4 mengenai Pengakhiran Sepihak 3 Hari tanpa Buyback) yang perlu direvisi sebelum penandatanganan agar posisi hukum Klien terlindungi dari potensi sengketa wanprestasi.',
    recommendedNextSteps: [
      'Ajukan usulan redaksi pengganti (counter-draft) pada Pasal 2 dan Pasal 4 kepada pihak prinsipal.',
      'Tambahkan batas maksimum (cap) denda keterlambatan sebesar 5% pada Pasal 3.',
      'Pastikan klausul penyelesaian sengketa menunjuk BANI Jakarta atau PN Jakarta Selatan secara tegas.',
    ],
    unreadClientCount: 0,
    unreadLawyerCount: 1,
  },
  {
    id: 'ses-102',
    caseNumber: 'REG/2026/PHI-0319',
    clientId: 'cli-2',
    clientName: 'Nadia Karina Putri',
    clientCompany: 'VP Product — Perusahaan Teknologi',
    lawyerId: 'lw-2',
    title: 'Evaluasi Kontrak PKWT Eksekutif & Hak Uang Kompensasi PP 35/2021',
    category: 'Hukum Ketenagakerjaan',
    status: 'Menunggu Tinjauan Kontrak',
    startedAt: '15:05 WIB',
    legalOpinionSummary:
      'Klausul masa percobaan (probation) 3 bulan di dalam kontrak PKWT batal demi hukum berdasarkan Pasal 58 UU Ketenagakerjaan jo. PP No. 35 Tahun 2021. Selain itu, Klien tetap berhak atas Uang Kompensasi PKWT secara proporsional.',
    recommendedNextSteps: [
      'Minta HR/Perusahaan menghapus Pasal 1 terkait masa percobaan 3 bulan pada kontrak PKWT.',
      'Cantumkan hak Uang Kompensasi PKWT sesuai Pasal 15 PP No. 35 Tahun 2021.',
      'Persempit cakupan klausul Non-Kompetisi (Pasal 3) menjadi maksimal 6 bulan pada kompetitor langsung.',
    ],
    unreadClientCount: 1,
    unreadLawyerCount: 0,
  },
  {
    id: 'ses-103',
    caseNumber: 'REG/2026/PDT-0592',
    clientId: 'cli-3',
    clientName: 'Hendra Wijaya',
    clientCompany: 'Akuisisi Ruko Komersial Cilandak',
    lawyerId: 'lw-3',
    title: 'Uji Tuntas & Peninjauan Akta PPJB Tanah SHM Cilandak',
    category: 'Hukum Perdata',
    status: 'Opini Hukum Terbit',
    startedAt: '11:30 WIB',
    legalOpinionSummary:
      'Draf PPJB memerlukan penambahan klausul Kuasa Menjual Mutlak (Pasal 3) setelah pelunasan 100% serta pemisahan beban pajak PPh Final 2,5% kepada Penjual dan BPHTB 5% kepada Pembeli (Pasal 2).',
    recommendedNextSteps: [
      'Lakukan pengecekan bersih (clean check) SHM No. 04192 di Kantor Pertanahan (BPN) Jakarta Selatan melalui PPAT.',
      'Gunakan rumusan revisi Pasal 2 dan Pasal 3 sebelum membayar uang muka (down payment).',
    ],
    unreadClientCount: 0,
    unreadLawyerCount: 0,
  },
];

export const INITIAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'doc-201',
    sessionId: 'ses-101',
    title: 'Draf_PKS_Distribusi_Nusantara_Pangan_2026.pdf',
    documentType: 'Kontrak Komersial B2B',
    uploadedBy: 'client',
    uploadedAt: '14:12 WIB',
    overallStatus: 'Sedang Ditinjau',
    clauses: CONTRACT_TEMPLATES[0].clauses.map((c, idx) => ({
      ...c,
      id: `cl-201-${idx + 1}`,
      lastUpdatedBy: 'Rendra Mahendra, S.H., LL.M.',
      lastUpdatedAt: '14:25 WIB',
    })),
  },
  {
    id: 'doc-202',
    sessionId: 'ses-102',
    title: 'Kontrak_PKWT_VP_Product_2026.pdf',
    documentType: 'Kontrak Ketenagakerjaan (PP 35/2021)',
    uploadedBy: 'client',
    uploadedAt: '15:08 WIB',
    overallStatus: 'Sedang Ditinjau',
    clauses: CONTRACT_TEMPLATES[1].clauses.map((c, idx) => ({
      ...c,
      id: `cl-202-${idx + 1}`,
      lastUpdatedBy: 'Anindya Pramesti, S.H., M.H., C.L.A.',
      lastUpdatedAt: '15:18 WIB',
    })),
  },
  {
    id: 'doc-203',
    sessionId: 'ses-103',
    title: 'Draf_Akta_PPJB_SHM_04192_Cilandak.pdf',
    documentType: 'Akta & Perjanjian Properti',
    uploadedBy: 'client',
    uploadedAt: '11:35 WIB',
    overallStatus: 'Selesai Ditinjau',
    clauses: CONTRACT_TEMPLATES[2].clauses.map((c, idx) => ({
      ...c,
      id: `cl-203-${idx + 1}`,
      lastUpdatedBy: 'Dr. Bagaskara Wibisono, S.H., M.Kn.',
      lastUpdatedAt: '12:05 WIB',
    })),
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sessionId: 'ses-101',
    senderRole: 'client',
    senderName: 'Budi Santoso',
    content:
      'Selamat siang Pak Rendra. Kami baru saja menerima draf Perjanjian Kerja Sama (PKS) Distribusi Eksklusif dari pihak prinsipal. Mohon bantuan Bapak untuk meninjau apakah pasal-pasal denda dan pengakhiran di dalamnya cukup aman bagi perusahaan kami.',
    timestamp: '14:11 WIB',
    attachedDocumentId: 'doc-201',
    attachedDocumentTitle: 'Draf_PKS_Distribusi_Nusantara_Pangan_2026.pdf',
  },
  {
    id: 'msg-2',
    sessionId: 'ses-101',
    senderRole: 'lawyer',
    senderName: 'Rendra Mahendra, S.H., LL.M.',
    content:
      'Selamat siang Pak Budi. Saya sudah membuka dan menelaah draf PKS tersebut. Perhatian utama kita ada pada Pasal 2 dan Pasal 4 yang saat ini sangat memberatkan posisi PT Nusantara Pangan.',
    timestamp: '14:16 WIB',
    referencedClauseId: 'cl-201-2',
    referencedClauseLabel: 'Pasal 2 — Target Pembelian Minimum & Sanksi Kuota',
  },
  {
    id: 'msg-3',
    sessionId: 'ses-101',
    senderRole: 'lawyer',
    senderName: 'Rendra Mahendra, S.H., LL.M.',
    content:
      'Pada Pasal 2, Anda diwajibkan membayar denda tunai 40% meskipun kegagalan kuota disebabkan oleh keterlambatan pasokan dari pihak prinsipal sendiri. Saya telah menandai Pasal 2 sebagai Berisiko Tinggi di panel Tinjauan Kontrak sebelah kanan beserta usulan redaksi penggantinya.',
    timestamp: '14:25 WIB',
    referencedClauseId: 'cl-201-4',
    referencedClauseLabel: 'Pasal 4 — Pengakhiran Sepihak & Buyback Stok',
  },
  {
    id: 'msg-4',
    sessionId: 'ses-101',
    senderRole: 'client',
    senderName: 'Budi Santoso',
    content:
      'Terima kasih Pak Rendra, catatan revisi di Pasal 2 dan Pasal 4 sangat jelas. Bagaimana dengan denda keterlambatan 1% per hari di Pasal 3? Apakah lazim dalam kontrak distribusi?',
    timestamp: '14:29 WIB',
    referencedClauseId: 'cl-201-3',
    referencedClauseLabel: 'Pasal 3 — Jangka Waktu Pembayaran & Denda',
  },
  {
    id: 'msg-5',
    sessionId: 'ses-102',
    senderRole: 'client',
    senderName: 'Nadia Karina Putri',
    content:
      'Halo Bu Anindya, saya baru menerima penawaran kontrak PKWT selama 2 tahun untuk posisi VP Product, namun di Pasal 1 tertulis ada masa probation 3 bulan dan di Pasal 2 disebutkan tidak ada uang kompensasi saat kontrak selesai. Apakah ini sesuai aturan?',
    timestamp: '15:08 WIB',
    attachedDocumentId: 'doc-202',
    attachedDocumentTitle: 'Kontrak_PKWT_VP_Product_2026.pdf',
  },
  {
    id: 'msg-6',
    sessionId: 'ses-102',
    senderRole: 'lawyer',
    senderName: 'Anindya Pramesti, S.H., M.H., C.L.A.',
    content:
      'Selamat sore Ibu Nadia. Berdasarkan Pasal 58 UU Ketenagakerjaan jo. PP No. 35 Tahun 2021, kontrak PKWT sama sekali tidak boleh memuat syarat masa percobaan (probation). Jika tetap dicantumkan, masa percobaan tersebut batal demi hukum. Silakan cek anotasi hukum dan draf revisi yang sudah saya siapkan pada Pasal 1 dan Pasal 2 di panel kanan.',
    timestamp: '15:18 WIB',
    referencedClauseId: 'cl-202-1',
    referencedClauseLabel: 'Pasal 1 — Jangka Waktu PKWT & Masa Percobaan',
  },
  {
    id: 'msg-7',
    sessionId: 'ses-103',
    senderRole: 'client',
    senderName: 'Hendra Wijaya',
    content:
      'Siang Pak Doktor Bagaskara, mohon tinjauan akhir untuk draf PPJB ruko Cilandak sebelum saya jadwalkan penandatanganan di kantor Notaris/PPAT besok pagi.',
    timestamp: '11:36 WIB',
    attachedDocumentId: 'doc-203',
    attachedDocumentTitle: 'Draf_Akta_PPJB_SHM_04192_Cilandak.pdf',
  },
  {
    id: 'msg-8',
    sessionId: 'ses-103',
    senderRole: 'lawyer',
    senderName: 'Dr. Bagaskara Wibisono, S.H., M.Kn.',
    content:
      'Siang Pak Hendra. Saya telah menyelesaikan telaah seluruh klausul PPJB dan menerbitkan Ringkasan Opini Hukum. Pastikan Pasal 3 memuat Kuasa Menjual mutlak saat pelunasan dan Pasal 2 memisahkan pajak PPh Final (tanggungan Penjual) dari BPHTB (tanggungan Pembeli).',
    timestamp: '12:05 WIB',
    referencedClauseId: 'cl-203-3',
    referencedClauseLabel: 'Pasal 3 — Kuasa Menjual & AJB di PPAT',
  },
];

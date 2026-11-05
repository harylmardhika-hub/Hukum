import {
  ConsultationSession,
  Lawyer,
  LegalDocument,
  ContractClause,
  ClauseRiskStatus,
  ChatMessage,
} from '../types/legal';
import { getNowWIB } from './realtimeSync';

export interface AutoAdvocateClauseUpdate {
  clauseId: string;
  riskStatus: ClauseRiskStatus;
  lawyerNote: string;
  proposedRevision: string;
  replaceOriginalText?: string;
}

export interface AutoAdvocateNewClause {
  clauseNumber: string;
  title: string;
  originalText: string;
  riskStatus: ClauseRiskStatus;
  lawyerNote: string;
  proposedRevision: string;
}

export interface AutoAdvocateResult {
  replyText: string;
  referencedClauseId?: string;
  referencedClauseLabel?: string;
  clauseUpdates: AutoAdvocateClauseUpdate[];
  newClause?: AutoAdvocateNewClause;
  updatedOpinionSummary?: string;
  updatedNextSteps?: string[];
  updatedSessionStatus?: ConsultationSession['status'];
}

/**
 * Calls the server-side Gemini endpoint (/api/advocate/auto-respond) first.
 * Falls back seamlessly to the local Contextual Legal & Contract Revision Engine
 * when hosted statically (e.g. GitHub Pages) or if the server is offline.
 */
export async function generateAdvocateAutoResponse(params: {
  clientMessage: string;
  quotedClauseId?: string;
  session: ConsultationSession;
  lawyer: Lawyer;
  document?: LegalDocument;
  recentMessages: ChatMessage[];
}): Promise<AutoAdvocateResult> {
  try {
    const res = await fetch('/api/advocate/auto-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = (await res.json()) as AutoAdvocateResult;
      if (data && typeof data.replyText === 'string' && data.replyText.trim()) {
        return data;
      }
    }
  } catch {
    // Static host (GitHub Pages) or offline fallback
  }

  return runLocalContextualLegalEngine(params);
}

/**
 * Deterministic & contextual Indonesian legal engine that understands client
 * requests to revise/rombak clauses, add new clauses, change numbers/penalties/days,
 * or consult on Indonesian law.
 */
export function runLocalContextualLegalEngine(params: {
  clientMessage: string;
  quotedClauseId?: string;
  session: ConsultationSession;
  lawyer: Lawyer;
  document?: LegalDocument;
  recentMessages: ChatMessage[];
}): AutoAdvocateResult {
  const { clientMessage, quotedClauseId, session, lawyer, document } = params;
  const q = clientMessage.toLowerCase().trim();
  const clauses = document?.clauses || [];
  const nowWib = getNowWIB();

  // 1. Check if client wants to ADD a brand new clause ("tambah pasal", "klausul baru", "force majeure", "kerahasiaan", "sengketa")
  const wantsAddClause =
    /(tambah|masukkan|buatkan|sisipkan)\s+(pasal|klausul)/i.test(clientMessage) ||
    (/(force majeure|keadaan kahar|kerahasiaan|nda|penyelesaian sengketa|arbitrase|bani)/i.test(
      clientMessage
    ) &&
      /(tambah|masukkan|buat|rombak)/i.test(clientMessage));

  if (wantsAddClause && document) {
    const nextNum = clauses.length + 1;
    const isForceMajeure = /(force majeure|keadaan kahar|bencana)/i.test(q);
    const isConfidentiality = /(rahasia|kerahasiaan|nda|data)/i.test(q);
    const isDispute = /(sengketa|arbitrase|bani|pengadilan)/i.test(q);

    let newClause: AutoAdvocateNewClause;

    if (isForceMajeure) {
      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Keadaan Kahar (Force Majeure) & Pembebasan Sanksi',
        originalText:
          'Tidak satu pun Pihak dikenakan denda atau sanksi wanprestasi apabila keterlambatan atau kegagalan pelaksanaan kewajiban disebabkan oleh Keadaan Kahar (bencana alam, kebijakan pemerintah, gangguan rantai pasok nasional, atau keadaan darurat lainnya) yang diberitahukan secara tertulis dalam waktu 7 (tujuh) hari kalender.',
        riskStatus: 'safe',
        lawyerNote: `Pasal Keadaan Kahar ditambahkan sesuai permintaan Klien pada ${nowWib} untuk melindungi dari risiko sanksi di luar kendali (Pasal 1244 & 1245 KUHPerdata).`,
        proposedRevision:
          'Klausul ini telah disusun secara seimbang oleh Advokat dan siap disepakati bersama pihak lawan.',
      };
    } else if (isConfidentiality) {
      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Kerahasiaan Informasi & Perlindungan Data',
        originalText:
          'Para Pihak wajib menjaga kerahasiaan seluruh informasi komersial, teknis, dan data pribadi yang dipertukarkan selama masa Perjanjian hingga 2 (dua) tahun setelah berakhirnya Perjanjian sesuai UU Perlindungan Data Pribadi.',
        riskStatus: 'safe',
        lawyerNote: `Pasal Kerahasiaan ditambahkan oleh ${lawyer.name} untuk menjamin perlindungan rahasia dagang dan data Klien.`,
        proposedRevision:
          'Rumusan pasal kerahasiaan ini sudah aman dan melindungi kepentingan hukum kedua belah pihak.',
      };
    } else if (isDispute) {
      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Hukum yang Berlaku & Penyelesaian Sengketa',
        originalText:
          'Segala perselisihan yang timbul dari Perjanjian ini diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari kalender. Apabila tidak tercapai kesepakatan, Para Pihak sepakat menyelesaikannya melalui Pengadilan Negeri atau Badan Arbitrase Nasional Indonesia (BANI).',
        riskStatus: 'safe',
        lawyerNote: `Klausul penyelesaian sengketa ditambahkan oleh ${lawyer.name} untuk memberikan kepastian forum hukum.`,
        proposedRevision:
          'Rumusan forum penyelesaian sengketa sudah jelas dan memberikan kepastian hukum.',
      };
    } else {
      const cleanTopic = clientMessage
        .replace(/^(tolong|mohon|pak|bu|bang)?\s*(tambahkan|tambah|buatkan|masukkan)\s*(pasal|klausul)?\s*/i, '')
        .trim();
      const topicTitle =
        cleanTopic.length > 3 && cleanTopic.length <= 60
          ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)
          : 'Ketentuan Tambahan & Perlindungan Hak Klien';

      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: topicTitle,
        originalText: `Para Pihak sepakat bahwa pelaksanaan terkait ${topicTitle.toLowerCase()} wajib dilakukan secara tertulis berdasarkan kesepakatan bersama dan tidak dapat diubah atau dibebankan secara sepihak tanpa persetujuan tertulis dari PIHAK KEDUA.`,
        riskStatus: 'safe',
        lawyerNote: `Pasal tambahan disusun oleh ${lawyer.name} sesuai instruksi Klien untuk memperkuat perlindungan kontrak.`,
        proposedRevision:
          'Naskah pasal baru ini telah disesuaikan dengan asas keseimbangan berkontrak (Pasal 1338 KUHPerdata).',
      };
    }

    return {
      replyText: `Siap, saya sudah menambahkan **${newClause.clauseNumber} — ${newClause.title}** secara langsung ke dalam dokumen kontrak di panel kanan dengan status **Aman**. Silakan periksa bunyi pasalnya.`,
      referencedClauseLabel: `${newClause.clauseNumber} — ${newClause.title}`,
      clauseUpdates: [],
      newClause,
      updatedOpinionSummary: `Dokumen kontrak telah diperkuat dengan penambahan ${newClause.clauseNumber} (${newClause.title}) guna melindungi posisi hukum Klien.`,
    };
  }

  // 2. Identify target clause(s) if the client mentions "Pasal X" or quoted a clause
  const pasalMatch = clientMessage.match(/pasal\s*(\d+)/i);
  let targetClause: ContractClause | undefined;

  if (pasalMatch && clauses.length > 0) {
    const requestedNumber = `pasal ${pasalMatch[1]}`.toLowerCase();
    targetClause = clauses.find(
      (c) => c.clauseNumber.toLowerCase() === requestedNumber
    );
  }
  if (!targetClause && quotedClauseId && clauses.length > 0) {
    targetClause = clauses.find((c) => c.id === quotedClauseId);
  }

  // Check if client is asking to revise/rombak/update clauses
  const isRevisionIntent =
    /(rombak|revisi|ubah|ganti|hapus|perbaiki|amankan|turunkan|naikkan|sesuaikan|negosiasi|batalkan|hilangkan|kurangi|buatkan usulan)/i.test(
      clientMessage
    ) || Boolean(pasalMatch && /(jadi|menjadi|tanpa|jangan|maksimal|hari|%)/i.test(clientMessage));

  // 2A. If client asks to revise ALL risky clauses ("rombak semua", "amankan semua pasal", "rombak kontrak ini")
  const wantsBulkRevision =
    isRevisionIntent &&
    !targetClause &&
    /(semua|seluruh|kontrak ini|pasal berisiko|pasal yang berat)/i.test(clientMessage);

  if (wantsBulkRevision && clauses.length > 0) {
    const riskyClauses = clauses.filter((c) => c.riskStatus !== 'safe');
    const targets = riskyClauses.length > 0 ? riskyClauses : [clauses[0]];

    const updates: AutoAdvocateClauseUpdate[] = targets.map((c) => {
      const newText =
        c.proposedRevision && c.proposedRevision.trim().length > 10
          ? c.proposedRevision
          : `Pelaksanaan ketentuan pada ${c.clauseNumber} (${c.title}) wajib didasarkan pada kesepakatan tertulis Para Pihak secara proporsional tanpa sanksi sepihak yang memberatkan salah satu pihak.`;

      return {
        clauseId: c.id,
        riskStatus: 'safe',
        replaceOriginalText: newText,
        lawyerNote: `DIROMBAK & DIAMANKAN (${nowWib}): Klausul ini telah direvisi oleh ${lawyer.name} sesuai permintaan Klien sehingga bebas dari risiko sepihak.`,
        proposedRevision: `Telah diterapkan ke naskah kontrak: "${newText}"`,
      };
    });

    const firstTarget = targets[0];
    return {
      replyText: `Saya telah merombak **${updates.length} pasal** yang sebelumnya berisiko (${targets
        .map((t) => t.clauseNumber)
        .join(', ')}) menjadi rumusan yang seimbang dan mengubah statusnya menjadi **Aman** di panel kanan. Ringkasan Opini Hukum juga sudah saya perbarui.`,
      referencedClauseId: firstTarget.id,
      referencedClauseLabel: `${firstTarget.clauseNumber} — ${firstTarget.title}`,
      clauseUpdates: updates,
      updatedOpinionSummary: `Seluruh klausul krusial (${targets
        .map((t) => t.clauseNumber)
        .join(', ')}) pada kontrak telah dirombak oleh ${lawyer.name} sesuai instruksi Klien dan kini berstatus Aman untuk ditandatangani.`,
      updatedSessionStatus: 'Opini Hukum Terbit',
    };
  }

  // 2B. If client wants to revise a specific clause (or the highest-risk clause if none specified)
  if (isRevisionIntent && clauses.length > 0) {
    const clauseToRevise =
      targetClause ||
      clauses.find((c) => c.riskStatus === 'critical') ||
      clauses.find((c) => c.riskStatus === 'warning') ||
      clauses[0];

    // Check if client specified custom numbers (e.g., "jadi 45 hari", "denda 2%", "hapus denda")
    const daysMatch = clientMessage.match(/(\d+)\s*hari/i);
    const percentMatch = clientMessage.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const wantsNoPenalty = /(hapus denda|tanpa denda|hilangkan denda|bebas denda)/i.test(
      clientMessage
    );

    let customDraft = clauseToRevise.proposedRevision;

    if (wantsNoPenalty) {
      customDraft = `Segala bentuk keterlambatan atau ketidaktercapaian target pada ${clauseToRevise.clauseNumber} diselesaikan melalui evaluasi tertulis bersama oleh Para Pihak tanpa pengenaan denda finansial sepihak.`;
    } else if (daysMatch || percentMatch) {
      const daysText = daysMatch ? `${daysMatch[1]} hari kalender` : '30 hari kalender';
      const pctText = percentMatch ? `${percentMatch[1]}%` : '2%';
      customDraft = `Pelaksanaan kewajiban pada ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) diberikan jangka waktu toleransi selama ${daysText}, dengan batas maksimum penyesuaian atau denda terkendali sebesar ${pctText} berdasarkan kesepakatan tertulis Para Pihak.`;
    } else if (!customDraft || customDraft.trim().length === 0) {
      customDraft = `Ketentuan dalam ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) dilaksanakan berdasarkan asas keseimbangan dan iktikad baik (Pasal 1338 KUHPerdata), di mana setiap perubahan atau pengakhiran wajib memperoleh persetujuan tertulis dari kedua belah pihak.`;
    } else {
      // Incorporate client's specific instruction nuance into the draft
      customDraft = `${clauseToRevise.proposedRevision} (Diperbarui sesuai permintaan Klien: "${clientMessage.trim()}")`;
    }

    const update: AutoAdvocateClauseUpdate = {
      clauseId: clauseToRevise.id,
      riskStatus: 'safe',
      replaceOriginalText: customDraft,
      lawyerNote: `DIROMBAK OLEH ADVOKAT (${nowWib}): Pasal ini telah diperbarui langsung mengikuti instruksi Klien dan kini berstatus Aman.`,
      proposedRevision: customDraft,
    };

    return {
      replyText: `Baik, saya sudah merombak langsung **${clauseToRevise.clauseNumber} — ${clauseToRevise.title}** di panel kanan sesuai permintaan Anda dan memperbarui status risikonya menjadi **Aman**. Silakan klik rujukan di atas untuk melihat bunyi pasal barunya.`,
      referencedClauseId: clauseToRevise.id,
      referencedClauseLabel: `${clauseToRevise.clauseNumber} — ${clauseToRevise.title}`,
      clauseUpdates: [update],
      updatedOpinionSummary: `${clauseToRevise.clauseNumber} (${clauseToRevise.title}) telah berhasil dirombak sesuai permintaan Klien pada ${nowWib} sehingga posisi hukum Klien terlindungi.`,
    };
  }

  // 3. If client asks a question about a specific clause or general legal consultation
  const relevantClause =
    targetClause ||
    clauses.find((c) => c.riskStatus === 'critical') ||
    clauses[0];

  if (/(denda|kuota|batal|wanprestasi|sepihak)/i.test(q)) {
    return {
      replyText: `Menurut Pasal 1320 dan Pasal 1338 KUHPerdata, klausul denda atau pengakhiran sepihak yang terlalu memberatkan dapat dimintakan revisi sebelum kontrak ditandatangani.${
        relevantClause
          ? ` Pada **${relevantClause.clauseNumber} (${relevantClause.title})**, saya menyarankan agar sanksi sepihak tersebut diubah menjadi mekanisme evaluasi bersama. Ketik **"Rombak ${relevantClause.clauseNumber}"** jika Anda ingin saya langsung mengubah bunyi pasalnya sekarang.`
          : ''
      }`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/(pkwt|percobaan|probation|pesangon|kompensasi|phk|kerja)/i.test(q)) {
    return {
      replyText: `Berdasarkan Pasal 58 UU Ketenagakerjaan jo. PP No. 35 Tahun 2021, kontrak kerja PKWT tidak boleh memuat masa percobaan (batal demi hukum) dan pekerja tetap berhak atas Uang Kompensasi saat kontrak berakhir.${
        relevantClause
          ? ` Saya dapat langsung merombak **${relevantClause.clauseNumber}** di panel kanan agar sesuai dengan PP 35/2021.`
          : ''
      }`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/(tanah|shm|ppjb|ajb|ppat|bphtb|pph|properti|ruko)/i.test(q)) {
    return {
      replyText: `Dalam transaksi jual beli tanah/bangunan (PPJB), pastikan pajak PPh Final 2,5% ditanggung Penjual (PP No. 34/2016), BPHTB 5% oleh Pembeli, serta wajib mencantumkan klausul Kuasa Menjual mutlak saat pembayaran lunas 100%.`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  // Default tailored consultation response + proactive offer to revise
  return {
    replyText: `Terima kasih atas penyampaiannya. Sebagai Advokat pendamping di bidang **${session.category}**, saya telah mencatat poin Anda: *"${clientMessage.trim()}"*.${
      relevantClause
        ? ` Saat ini perhatian utama pada dokumen kita ada di **${relevantClause.clauseNumber} (${relevantClause.title})**. Apabila Anda ingin saya langsung mengubah bunyi pasal tersebut, cukup balas **"Tolong rombak ${relevantClause.clauseNumber}"** atau sebutkan perubahan yang Anda inginkan.`
        : ' Silakan sampaikan pasal atau ketentuan yang ingin Anda rombak, saya akan langsung memperbaruinya di panel kontrak.'
    }`,
    referencedClauseId: relevantClause?.id,
    referencedClauseLabel: relevantClause
      ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
      : undefined,
    clauseUpdates: [],
  };
}

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
  additionalNewClauses?: AutoAdvocateNewClause[];
  updatedOpinionSummary?: string;
  updatedNextSteps?: string[];
  updatedSessionStatus?: ConsultationSession['status'];
}

function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .trim();
}

function getClientShortName(fullName: string): string {
  const cleaned = fullName.replace(/^(Bpk\.|Ibu|Sdr\.|Sdri\.|Dr\.|Ir\.)\s*/i, '').trim();
  const first = cleaned.split(/\s+/)[0];
  return first || fullName;
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
        return {
          ...data,
          replyText: stripMarkdownFormatting(data.replyText),
        };
      }
    }
  } catch {
    // Static host (GitHub Pages) or offline fallback
  }

  const local = runLocalContextualLegalEngine(params);
  return {
    ...local,
    replyText: stripMarkdownFormatting(local.replyText),
  };
}

/**
 * Natural, human-like Indonesian conversational & contract revision engine.
 * Responds like normal everyday chat for greetings, small talk, and questions,
 * while automatically revising/adding contract clauses when requested.
 */
export function runLocalContextualLegalEngine(params: {
  clientMessage: string;
  quotedClauseId?: string;
  session: ConsultationSession;
  lawyer: Lawyer;
  document?: LegalDocument;
  recentMessages: ChatMessage[];
}): AutoAdvocateResult {
  const {
    clientMessage,
    quotedClauseId,
    session,
    lawyer,
    document,
    recentMessages,
  } = params;
  const q = clientMessage.toLowerCase().trim();
  const clauses = document?.clauses || [];
  const nowWib = getNowWIB();
  const clientFirst = getClientShortName(session.clientName);
  const lawyerShort = lawyer.name.split(',')[0].trim();
  const turnSeed = (recentMessages?.length || 0) % 3;

  // Identify if a specific existing Pasal number is mentioned (e.g., "Pasal 2")
  const pasalMatch = clientMessage.match(/\bpasal\s*(\d+)\b/i);
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

  const mentionsContractAction =
    /\b(rombak|revisi|ubah|ganti|hapus|tambah|tambahkan|masukkan|pasal|klausul|denda|kontrak)\b/i.test(
      q
    );

  // 1. Islamic Greeting ("assalamualaikum")
  if (/\b(assalamualaikum|assalamu'alaikum|salam)\b/i.test(q) && !mentionsContractAction) {
    return {
      replyText: `Waalaikumsalam ${clientFirst}, silakan. Ada yang lagi ingin diobrolkan atau dikonsultasikan hari ini?`,
      clauseUpdates: [],
    };
  }

  // 2. Asking "How are you?" ("apa kabar", "sehat pak", "gimana kabarnya")
  if (/\b(apa kabar|kabarnya gimana|gimana kabar|sehat pak|sehat bu|bapak sehat)\b/i.test(q) && !mentionsContractAction) {
    return {
      replyText: `Alhamdulillah kabar baik, ${clientFirst}. Semoga Anda di sana juga sehat dan lancar terus kegiatannya ya. Gimana, ada hal yang lagi ingin didiskusikan?`,
      clauseUpdates: [],
    };
  }

  // 3. Pure Everyday Greetings ("halo pak", "halo", "pagi pak", "siang", "sore", "malam", "permisi", "tes", "p")
  const isCasualGreeting =
    /^(halo|hai|hi|pagi|selamat pagi|siang|selamat siang|sore|selamat sore|malam|selamat malam|permisi|punten|tes|test|ping|p|halo pak|halo bu|halo bang|halo kak|pak|bu|bang)\b/i.test(
      q
    ) &&
    q.split(/\s+/).length <= 6 &&
    !mentionsContractAction &&
    !/\b(tanya|nanya|sibuk|bantu|bingung|masalah|kasus)\b/i.test(q);

  if (isCasualGreeting) {
    if (/\b(pagi)\b/i.test(q)) {
      return {
        replyText: `Selamat pagi ${clientFirst}, iya silakan. Ada yang bisa saya bantu pagi ini?`,
        clauseUpdates: [],
      };
    }
    if (/\b(siang)\b/i.test(q)) {
      return {
        replyText: `Selamat siang ${clientFirst}, hadir. Mau ngobrol atau diskusi soal apa nih kita?`,
        clauseUpdates: [],
      };
    }
    if (/\b(sore|malam)\b/i.test(q)) {
      return {
        replyText: `Halo ${clientFirst}, selamat ${/\bmalam\b/i.test(q) ? 'malam' : 'sore'}. Silakan, ada yang sedang ingin dikonsultasikan?`,
        clauseUpdates: [],
      };
    }

    const greetingVariants = [
      `Halo ${clientFirst}, iya silakan. Ada yang bisa saya bantu hari ini?`,
      `Halo juga ${clientFirst}, hadir. Silakan kalau ada yang mau diceritakan atau ditanyakan ya.`,
      `Iya halo ${clientFirst}, silakan. Mau diskusi soal perkara atau ada bagian kontrak yang ingin kita bahas?`,
    ];
    return {
      replyText: greetingVariants[turnSeed],
      clauseUpdates: [],
    };
  }

  // 4. Asking if lawyer is busy / asking permission to ask ("lagi sibuk ga pak?", "boleh tanya?", "mau nanya dong", "bisa bantu saya?")
  if (
    /\b(lagi sibuk|sibuk ga|sibuk nggak|ada waktu|boleh tanya|boleh nanya|mau tanya|mau nanya|numpang tanya|bisa bantu|minta tolong|bisa konsul|mau konsul)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    const askVariants = [
      `Boleh banget, ${clientFirst}. Kebetulan saya lagi luang kok. Mau tanya atau cerita soal apa? Santai saja.`,
      `Silakan ${clientFirst}, saya tidak sedang di persidangan kok. Ceritakan saja apa yang sedang dihadapi.`,
      `Tentu bisa, ${clientFirst}. Langsung sampaikan saja apa yang mengganjal, kita bahas pelan-pelan ya.`,
    ];
    return {
      replyText: askVariants[turnSeed],
      clauseUpdates: [],
    };
  }

  // 5. Asking about the lawyer's profile / office / experience ("kantor bapak di mana?", "pengalaman berapa lama?", "siapa nama bapak?")
  if (
    /\b(kantor bapak|kantornya di mana|lokasi mana|domisili mana|pengalaman berapa|sudah berapa lama|spesialis apa|siapa nama bapak|nama ibu siapa)\b/i.test(
      q
    )
  ) {
    return {
      replyText: `Saya ${lawyerShort}, sehari-hari praktik di wilayah ${lawyer.jurisdiction} dan fokus menangani ${lawyer.specialty} sudah sekitar ${lawyer.experienceYears} tahun. Jadi santai saja ${clientFirst}, anggap saja lagi ngobrol sama rekan sendiri.`,
      clauseUpdates: [],
    };
  }

  // 6. Acknowledgements & Thanks ("makasih pak", "terima kasih", "oke pak", "siap", "mantap", "baik pak", "setuju")
  if (
    /^(makasih|terima kasih|trims|thanks|thank you|matur nuwun)/i.test(q) &&
    !mentionsContractAction
  ) {
    return {
      replyText: `Sama-sama, ${clientFirst}. Senang bisa membantu. Kalau nanti ada yang kepikiran lagi atau mau tanya-tanya, langsung chat saja ya.`,
      clauseUpdates: [],
    };
  }

  if (
    /^(oke|ok|okay|siap|mantap|sip|baik|setuju|paham|mengerti|sudah jelas|lanjut|boleh|gas)\b/i.test(
      q
    ) &&
    q.split(/\s+/).length <= 5 &&
    !mentionsContractAction
  ) {
    const ackVariants = [
      `Siap, ${clientFirst}. Kabari saja kalau ada hal lain yang mau ditanyakan atau dirombak ya.`,
      `Oke mantap, ${clientFirst}. Kalau ada bagian lain yang ingin kita bedah lagi, tinggal ketik saja di sini.`,
      `Baik ${clientFirst}. Saya tetap standby di ruang chat ini kalau Anda butuh perubahan tambahan.`,
    ];
    return {
      replyText: ackVariants[turnSeed],
      clauseUpdates: [],
    };
  }

  // 7. Expressing worry, confusion, or asking for general advice ("saya bingung nih", "takut rugi", "ragu", "gimana menurut bapak?")
  if (
    /\b(bingung|takut|ragu|khawatir|masalah|problem|solusi|menurut bapak|menurut ibu|saran bapak|pendapat bapak|gimana bagusnya|baiknya gimana)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    return {
      replyText: `Tenang dulu ${clientFirst}, wajar kok kalau merasa ragu—justru bagus kita cek sekarang sebelum tanda tangan. Coba ceritakan bagian mana yang paling bikin Anda keberatan, atau kalau mau saya cek dan rombakkan pasal yang rawan di sebelah kanan juga bisa langsung saya kerjakan.`,
      clauseUpdates: [],
    };
  }

  // 8. Check if client wants to ADD a brand new clause ("tambahkan pasal...", "tambah klausul...", "masukkan pasal...")
  const wantsAddClause =
    !pasalMatch &&
    (/\b(tambah|tambahkan|masukkan|sisipkan)\b/i.test(clientMessage) ||
      /\b(pasal baru|klausul baru)\b/i.test(clientMessage));

  if (wantsAddClause && document) {
    const nextNum = clauses.length + 1;
    const isForceMajeure = /\b(force majeure|keadaan kahar|bencana)\b/i.test(q);
    const isConfidentiality = /\b(rahasia|kerahasiaan|nda|data pribadi)\b/i.test(q);
    const isDispute = /\b(sengketa|arbitrase|bani|pengadilan)\b/i.test(q);

    if (isForceMajeure && isDispute) {
      const fmClause: AutoAdvocateNewClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Keadaan Kahar (Force Majeure) & Pembebasan Sanksi',
        originalText:
          'Tidak satu pun Pihak dikenakan denda atau sanksi wanprestasi apabila keterlambatan atau kegagalan pelaksanaan kewajiban disebabkan oleh Keadaan Kahar (bencana alam, kebijakan pemerintah, gangguan rantai pasok nasional, atau keadaan darurat lainnya) yang diberitahukan secara tertulis dalam waktu 7 (tujuh) hari kalender.',
        riskStatus: 'safe',
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}): Melindungi Klien dari tuntutan ganti rugi akibat keadaan di luar kendali (Pasal 1244 & 1245 KUHPerdata).`,
        proposedRevision:
          'Rumusan Force Majeure ini sudah seimbang dan siap disepakati.',
      };

      const disputeClause: AutoAdvocateNewClause = {
        clauseNumber: `Pasal ${nextNum + 1}`,
        title: 'Hukum yang Berlaku & Penyelesaian Sengketa',
        originalText:
          'Segala perselisihan yang timbul dari Perjanjian ini diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari kalender. Apabila tidak tercapai kesepakatan, Para Pihak sepakat menyelesaikannya melalui Pengadilan Negeri setempat atau Badan Arbitrase Nasional Indonesia (BANI).',
        riskStatus: 'safe',
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}): Memberikan kepastian mekanisme musyawarah dan forum penyelesaian sengketa.`,
        proposedRevision:
          'Rumusan penyelesaian sengketa ini sudah jelas dan melindungi kedua belah pihak.',
      };

      return {
        replyText: `Siap ${clientFirst}, saya sudah langsung menambahkan dua pasal baru sekaligus di panel kanan: ${fmClause.clauseNumber} tentang Force Majeure dan ${disputeClause.clauseNumber} tentang Penyelesaian Sengketa. Keduanya sudah berstatus Aman, silakan dicek ya.`,
        referencedClauseLabel: `${fmClause.clauseNumber} & ${disputeClause.clauseNumber}`,
        clauseUpdates: [],
        newClause: fmClause,
        additionalNewClauses: [disputeClause],
        updatedOpinionSummary: `Kontrak telah dilengkapi dengan ${fmClause.clauseNumber} (Force Majeure) dan ${disputeClause.clauseNumber} (Penyelesaian Sengketa) oleh ${lawyer.name}.`,
      };
    }

    let newClause: AutoAdvocateNewClause;

    if (isForceMajeure) {
      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Keadaan Kahar (Force Majeure) & Pembebasan Sanksi',
        originalText:
          'Tidak satu pun Pihak dikenakan denda atau sanksi wanprestasi apabila keterlambatan atau kegagalan pelaksanaan kewajiban disebabkan oleh Keadaan Kahar (bencana alam, kebijakan pemerintah, gangguan rantai pasok nasional, atau keadaan darurat lainnya) yang diberitahukan secara tertulis dalam waktu 7 (tujuh) hari kalender.',
        riskStatus: 'safe',
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}): Melindungi Klien dari risiko sanksi di luar kendali sesuai Pasal 1244 & 1245 KUHPerdata.`,
        proposedRevision:
          'Klausul Keadaan Kahar ini telah disusun secara seimbang dan siap disepakati.',
      };
    } else if (isConfidentiality) {
      newClause = {
        clauseNumber: `Pasal ${nextNum}`,
        title: 'Kerahasiaan Informasi & Perlindungan Data',
        originalText:
          'Para Pihak wajib menjaga kerahasiaan seluruh informasi komersial, teknis, dan data pribadi yang dipertukarkan selama masa Perjanjian hingga 2 (dua) tahun setelah berakhirnya Perjanjian sesuai UU Perlindungan Data Pribadi.',
        riskStatus: 'safe',
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}): Menjamin perlindungan rahasia dagang dan data Klien.`,
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
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}): Memberikan kepastian forum hukum jika terjadi perselisihan.`,
        proposedRevision:
          'Rumusan forum penyelesaian sengketa sudah jelas dan memberikan kepastian hukum.',
      };
    } else {
      const cleanTopic = clientMessage
        .replace(
          /^(tolong|mohon|pak|bu|bang|kak)?\s*(tambahkan|tambah|buatkan|masukkan|sisipkan)\s*(pasal|klausul)?\s*(baru)?\s*(tentang|mengenai|soal)?\s*/i,
          ''
        )
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
        lawyerNote: `Ditambahkan oleh ${lawyerShort} (${nowWib}) sesuai permintaan Klien untuk memperkuat perlindungan kontrak.`,
        proposedRevision:
          'Naskah pasal baru ini telah disesuaikan dengan asas keseimbangan berkontrak (Pasal 1338 KUHPerdata).',
      };
    }

    return {
      replyText: `Siap ${clientFirst}, saya sudah menambahkan ${newClause.clauseNumber} tentang ${newClause.title} langsung ke dokumen kontrak di sebelah kanan. Silakan dicek bunyi pasalnya, kalau ada yang mau dipoles lagi tinggal beri tahu saya ya.`,
      referencedClauseLabel: `${newClause.clauseNumber} — ${newClause.title}`,
      clauseUpdates: [],
      newClause,
      updatedOpinionSummary: `Dokumen kontrak telah diperkuat dengan penambahan ${newClause.clauseNumber} (${newClause.title}) guna melindungi posisi hukum Klien.`,
    };
  }

  // 9. Check if client asks whether the contract is safe to sign ("apakah kontrak ini sudah aman?", "sudah aman ditandatangani?", "boleh tanda tangan?")
  const asksContractSafety =
    /\b(apakah|udah|sudah)\b.*\b(aman|siap|bisa|boleh)\b/i.test(q) ||
    /\b(aman ditandatangani|siap tanda tangan|layak ditandatangani)\b/i.test(q);

  if (asksContractSafety && clauses.length > 0 && !/\b(rombak|revisi|ubah|hapus)\b/i.test(q)) {
    const riskyClauses = clauses.filter((c) => c.riskStatus !== 'safe');
    if (riskyClauses.length === 0) {
      return {
        replyText: `Sudah aman untuk ditandatangani, ${clientFirst}. Seluruh ${clauses.length} pasal di panel kanan sudah berstatus Aman dan tidak ada lagi sanksi sepihak yang menjebak posisi Anda.`,
        clauseUpdates: [],
      };
    }
    const firstRisky = riskyClauses[0];
    const riskyList = riskyClauses.map((c) => c.clauseNumber).join(' dan ');
    return {
      replyText: `Saran saya jangan ditandatangani dulu ya, ${clientFirst}. Masih ada ${riskyClauses.length} pasal yang berisiko bagi posisi Anda (${riskyList}), terutama di ${firstRisky.clauseNumber} mengenai ${firstRisky.title}. Kalau Anda setuju, ketik saja "Rombak semua pasal berisiko" biar langsung saya amankan semuanya sekarang.`,
      referencedClauseId: firstRisky.id,
      referencedClauseLabel: `${firstRisky.clauseNumber} — ${firstRisky.title}`,
      clauseUpdates: [],
    };
  }

  // 10. Check if client is asking to REVISE / ROMBAK clauses
  const isRevisionIntent =
    /\b(rombak|rombakkan|revisi|ubah|ganti|hapus|perbaiki|amankan|turunkan|naikkan|sesuaikan|batalkan|hilangkan|kurangi|buatkan usulan)\b/i.test(
      clientMessage
    ) ||
    Boolean(
      pasalMatch && /\b(jadi|menjadi|tanpa|jangan|maksimal|hari|%|hapus|hilangkan)\b/i.test(clientMessage)
    );

  // 10A. Bulk revision of all risky clauses ("rombak semua", "amankan semua pasal", "rombak kontrak ini")
  const wantsBulkRevision =
    isRevisionIntent &&
    !targetClause &&
    /\b(semua|seluruh|kontrak ini|pasal berisiko|pasal yang berat|semuanya)\b/i.test(
      clientMessage
    );

  if (wantsBulkRevision && clauses.length > 0) {
    const riskyClauses = clauses.filter((c) => c.riskStatus !== 'safe');

    if (riskyClauses.length === 0) {
      return {
        replyText: `Semua pasal di kontrak ini (${clauses.length} pasal) sebenarnya sudah berstatus Aman, ${clientFirst}. Tapi kalau ada pasal tertentu yang ingin Anda ubah lagi bunyi kalimat atau angkanya, sebutkan saja nomor pasalnya ya.`,
        clauseUpdates: [],
      };
    }

    const updates: AutoAdvocateClauseUpdate[] = riskyClauses.map((c) => {
      const newText =
        c.proposedRevision &&
        c.proposedRevision.trim().length > 10 &&
        !c.proposedRevision.startsWith('Telah diterapkan')
          ? c.proposedRevision
          : `Pelaksanaan ketentuan pada ${c.clauseNumber} (${c.title}) wajib didasarkan pada kesepakatan tertulis Para Pihak secara proporsional tanpa pengenaan denda atau sanksi sepihak.`;

      return {
        clauseId: c.id,
        riskStatus: 'safe',
        replaceOriginalText: newText,
        lawyerNote: `Sudah dirombak oleh ${lawyerShort} (${nowWib}): Klausul ini telah diamankan sehingga bebas dari sanksi sepihak.`,
        proposedRevision: newText,
      };
    });

    const firstTarget = riskyClauses[0];
    const revisedList = riskyClauses.map((t) => t.clauseNumber).join(', ');
    return {
      replyText: `Siap ${clientFirst}, sudah saya rombak semuanya! Sebanyak ${updates.length} pasal yang tadinya memberatkan (${revisedList}) di panel kanan sudah saya ganti dengan rumusan yang seimbang dan statusnya sekarang sudah Aman semua. Silakan dicek hasilnya di sebelah kanan.`,
      referencedClauseId: firstTarget.id,
      referencedClauseLabel: `${firstTarget.clauseNumber} — ${firstTarget.title}`,
      clauseUpdates: updates,
      updatedOpinionSummary: `Seluruh klausul krusial (${revisedList}) pada kontrak telah dirombak oleh ${lawyer.name} sesuai permintaan Klien dan kini berstatus Aman untuk ditandatangani.`,
      updatedSessionStatus: 'Opini Hukum Terbit',
    };
  }

  // 10B. Specific clause revision (e.g., "Tolong rombak Pasal 2 agar denda dihapus" or "Rombak pasal ini")
  if (isRevisionIntent && clauses.length > 0) {
    const clauseToRevise =
      targetClause ||
      clauses.find((c) => c.riskStatus === 'critical') ||
      clauses.find((c) => c.riskStatus === 'warning') ||
      clauses[0];

    const daysMatch = clientMessage.match(/(\d+)\s*hari/i);
    const percentMatch = clientMessage.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const wantsNoPenalty =
      /\b(hapus denda|denda dihapus|tanpa denda|hilangkan denda|bebas denda|jangan ada denda|hapus sanksi)\b/i.test(
        clientMessage
      );

    let customDraft = clauseToRevise.proposedRevision;
    let naturalExplanation = '';

    if (wantsNoPenalty) {
      customDraft = `Kewajiban pada ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) dikecualikan apabila terdapat kendala pasokan atau keadaan di luar kendali PIHAK KEDUA. Setiap ketidaktercapaian target diselesaikan melalui evaluasi tertulis bersama oleh Para Pihak tanpa pengenaan denda tunai maupun sanksi finansial sepihak.`;
      naturalExplanation = `Klausul denda sepihaknya sudah saya hapus dan saya ganti dengan mekanisme evaluasi bersama tanpa penalti finansial.`;
    } else if (daysMatch || percentMatch) {
      const daysText = daysMatch ? `${daysMatch[1]} hari kalender` : '30 hari kalender';
      const pctText = percentMatch ? `${percentMatch[1]}%` : '2%';
      customDraft = `Pelaksanaan kewajiban pada ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) diberikan jangka waktu selama ${daysText} sejak diterimanya dokumen lengkap, dengan batas maksimum penyesuaian atau denda keterlambatan terkendali sebesar ${pctText} berdasarkan kesepakatan tertulis Para Pihak.`;
      naturalExplanation = `Jangka waktunya sudah saya sesuaikan menjadi ${daysText} dengan batas ketentuan ${pctText} agar tetap terkendali.`;
    } else if (
      !customDraft ||
      customDraft.trim().length === 0 ||
      customDraft === clauseToRevise.originalText
    ) {
      customDraft = `Ketentuan dalam ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) dilaksanakan berdasarkan asas keseimbangan dan iktikad baik (Pasal 1338 KUHPerdata), di mana setiap perubahan kuota, denda, atau pengakhiran wajib memperoleh persetujuan tertulis dari kedua belah pihak.`;
      naturalExplanation = `Rumusannya sudah saya ubah agar tidak bisa diputuskan sepihak dan wajib melalui persetujuan bersama.`;
    } else {
      naturalExplanation = `Bunyi pasalnya sudah saya ganti mengikuti draf perlindungan hukum yang seimbang bagi posisi Anda.`;
    }

    const update: AutoAdvocateClauseUpdate = {
      clauseId: clauseToRevise.id,
      riskStatus: 'safe',
      replaceOriginalText: customDraft,
      lawyerNote: `Dirombak oleh ${lawyerShort} (${nowWib}) sesuai permintaan Klien: Klausul kini sudah seimbang dan berstatus Aman.`,
      proposedRevision: customDraft,
    };

    return {
      replyText: `Siap ${clientFirst}, ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) sudah langsung saya rombak di panel kanan ya. ${naturalExplanation} Status pasalnya sekarang sudah berubah menjadi Aman.`,
      referencedClauseId: clauseToRevise.id,
      referencedClauseLabel: `${clauseToRevise.clauseNumber} — ${clauseToRevise.title}`,
      clauseUpdates: [update],
      updatedOpinionSummary: `${clauseToRevise.clauseNumber} (${clauseToRevise.title}) telah dirombak oleh ${lawyer.name} sesuai permintaan Klien pada ${nowWib} sehingga posisi hukum Klien terlindungi.`,
    };
  }

  // 11. Specific legal topics & negotiation chat
  const relevantClause =
    targetClause ||
    clauses.find((c) => c.riskStatus === 'critical') ||
    clauses.find((c) => c.riskStatus === 'warning');

  if (/\b(negosiasi|pihak lawan|vendor|mereka nolak|tidak mau|keberatan)\b/i.test(q)) {
    return {
      replyText: `Kalau pihak lawan keberatan pasalnya dihapus total, trik negosiasinya kita tawarkan jalan tengah, ${clientFirst}. Misalnya sanksi dendanya kita ganti jadi evaluasi berkala atau batas maksimal dendanya dibatasi 2% saja. Biasanya lawan transaksi jauh lebih mudah menerima opsi jalan tengah seperti itu.`,
      clauseUpdates: [],
    };
  }

  if (/\b(denda|kuota|sanksi|penalti)\b/i.test(q)) {
    return {
      replyText: `Soal denda atau target kuota itu memang harus hati-hati, ${clientFirst}. Dalam hukum perjanjian kita, sanksi tidak boleh berat sebelah apalagi kalau kendalanya bukan dari pihak Anda.${
        relevantClause
          ? ` Kalau mau, bilang saja "Rombak ${relevantClause.clauseNumber} agar denda dihapus", nanti langsung saya ubah pasalnya di kanan.`
          : ''
      }`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/\b(wanprestasi|ingkar janji|gagal bayar|somasi|telat|terlambat)\b/i.test(q)) {
    return {
      replyText: `Kalau pihak lawan yang wanprestasi atau terlambat memenuhi kewajibannya, Anda berhak melayangkan teguran tertulis (somasi) dan menunda pembayaran Anda, ${clientFirst}. Mau sekalian saya tambahkan pasal Penyelesaian Sengketa di kontrak kanan supaya posisi Anda makin kuat?`,
      clauseUpdates: [],
    };
  }

  if (/\b(putus|pengakhiran|batal|sepihak|terminasi|stok)\b/i.test(q)) {
    return {
      replyText: `Pengakhiran kontrak secara sepihak dengan pemberitahuan mendadak jelas merugikan Anda, ${clientFirst}. Idealnya harus ada pemberitahuan minimal 30-60 hari sebelumnya dan kewajiban membeli kembali sisa stok. Mau langsung saya rombakkan klausul pengakhirannya di sebelah kanan?`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/\b(pkwt|percobaan|probation|pesangon|kompensasi|phk|kerja|karyawan|gaji)\b/i.test(q)) {
    return {
      replyText: `Kalau untuk kontrak kerja PKWT, aturan PP No. 35 Tahun 2021 tegas melarang adanya masa percobaan (probation)—jadi kalau dicantumkan, masa percobaannya batal demi hukum dan pekerja tetap wajib dapat Uang Kompensasi, ${clientFirst}. Mau langsung saya rombak pasalnya di panel kanan?`,
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/\b(tanah|shm|ppjb|ajb|ppat|bphtb|pph|properti|ruko|sertifikat)\b/i.test(q)) {
    return {
      replyText: `Dalam jual beli properti atau PPJB, pastikan pajak PPh Final 2,5% ditanggung Penjual dan BPHTB 5% oleh Pembeli, plus wajib ada klausul Kuasa Menjual mutlak saat pembayaran lunas 100%, ${clientFirst}. Kalau ada pasal di draf kanan yang mau disesuaikan, tinggal sebutkan saja ya.`,
      clauseUpdates: [],
    };
  }

  if (/\b(biaya|tarif|harga|bayar|fee)\b/i.test(q)) {
    return {
      replyText: `Untuk sesi konsultasi dan perombakan draf kontrak di ruang ini sudah termasuk dalam layanan pendampingan kita, ${clientFirst}. Jadi Anda bebas ngobrol atau meminta saya merombak pasal mana pun sampai drafnya benar-benar aman.`,
      clauseUpdates: [],
    };
  }

  // 12. General human-like chat fallback (does NOT force Pasal 2 unless the user mentioned clauses/contracts)
  const conversationalFallbacks = [
    `Iya ${clientFirst}, saya tangkap maksudnya. Coba ceritakan lebih detail lagi bagian mana yang paling ingin Anda amankan, atau kalau mau saya langsung rombakkan pasal di kontrak sebelah kanan juga siap.`,
    `Paham, ${clientFirst}. Dalam praktik sehari-hari hal seperti itu memang sering jadi titik krusial. Menurut Anda sendiri, skema yang paling nyaman buat posisi Anda seperti apa? Nanti saya tuangkan ke dalam bunyi pasalnya.`,
    `Betul sekali, ${clientFirst}. Kita pastikan saja semua kesepakatan tertulisnya jelas di awal supaya tidak jadi celah di kemudian hari. Ada poin spesifik yang mau kita ubah sekarang?`,
  ];

  return {
    replyText: conversationalFallbacks[turnSeed],
    clauseUpdates: [],
  };
}

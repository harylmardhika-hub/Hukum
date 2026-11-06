import {
  ConsultationSession,
  Lawyer,
  LegalDocument,
  ContractClause,
  ClauseRiskStatus,
  ChatMessage,
} from '../types/legal';
import { getNowWIB } from './realtimeSync';

export type AdvocateReplyStyle =
  | 'Formal & Profesional'
  | 'Ramah & Mendukung'
  | 'Singkat & To-the-point';

export type CaseUrgencyLevel = 'tinggi' | 'sedang' | 'santai';

export interface StyleSelectionContext {
  style: AdvocateReplyStyle;
  urgency: CaseUrgencyLevel;
  reason: string;
}

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
  appliedStyle?: AdvocateReplyStyle;
  detectedUrgency?: CaseUrgencyLevel;
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
  const cleaned = fullName
    .replace(/^(Bpk\.|Ibu|Sdr\.|Sdri\.|Dr\.|Ir\.)\s*/i, '')
    .trim();
  const first = cleaned.split(/\s+/)[0];
  return first || fullName;
}

/**
 * Automatically selects the Advocate's reply style ('Formal & Profesional',
 * 'Ramah & Mendukung', or 'Singkat & To-the-point') based on detected case urgency,
 * message tone, and clause risk profile.
 */
export function selectAdvocateReplyStyle(params: {
  clientMessage: string;
  document?: LegalDocument;
  preferredStyle?: 'auto' | AdvocateReplyStyle;
}): StyleSelectionContext {
  const { clientMessage, document, preferredStyle } = params;
  const q = clientMessage.toLowerCase().trim();
  const clauses = document?.clauses || [];
  const criticalCount = clauses.filter((c) => c.riskStatus === 'critical').length;

  // Allow explicit override if chosen by the user
  if (preferredStyle && preferredStyle !== 'auto') {
    const isUrgent =
      /\b(cepat|segera|urgent|darurat|sekarang|langsung|hari ini|deadline)\b/i.test(q) ||
      criticalCount >= 2;
    return {
      style: preferredStyle,
      urgency: isUrgent ? 'tinggi' : 'sedang',
      reason: `Gaya dipilih: ${preferredStyle}`,
    };
  }

  // 1. Casual small talk, greetings, weather, how-are-you, or emotional worry -> 'Ramah & Mendukung'
  const isCasualOrSupportive =
    /\b(halo|hai|pagi|siang|sore|malam|assalamualaikum|kabar|kabarnya|sehat|cuaca|hujan|panas|mendung|gerimis|macet|banjir|dingin|makan|ngopi|kopi|sibuk|bingung|takut|ragu|khawatir|curhat|cemas|makasih|terima kasih)\b/i.test(
      q
    ) && !/\b(somasi|gugatan|pidana|pengadilan|arbitrase|pasal \d+)\b/i.test(q);

  if (isCasualOrSupportive) {
    return {
      style: 'Ramah & Mendukung',
      urgency: 'santai',
      reason: 'Sapaan santai / percakapan sehari-hari / dukungan klien',
    };
  }

  // 2. High-urgency / rapid action / direct revision command -> 'Singkat & To-the-point'
  const isHighUrgencyDirect =
    /\b(cepat|segera|urgent|darurat|sekarang|langsung|intinya|singkat|buruan|deadline|tolong rombak|rombak semua|hapus denda|ubah pasal)\b/i.test(
      q
    ) ||
    (q.split(/\s+/).length <= 7 &&
      /\b(rombak|revisi|ubah|ganti|hapus|tambah|tambahkan)\b/i.test(q));

  if (isHighUrgencyDirect) {
    return {
      style: 'Singkat & To-the-point',
      urgency: 'tinggi',
      reason: 'Instruksi tindakan cepat / urgensi tinggi',
    };
  }

  // 3. Formal legal analysis, high-stakes dispute, statutory questions -> 'Formal & Profesional'
  const isFormalLegal =
    /\b(kuhperdata|undang-undang|uu|pp|peraturan|somasi|wanprestasi|pengadilan|gugatan|arbitrase|bani|legal opinion|opini hukum|keabsahan|batal demi hukum|sah|ditandatangani)\b/i.test(
      q
    ) || criticalCount > 0;

  if (isFormalLegal) {
    return {
      style: 'Formal & Profesional',
      urgency: criticalCount > 0 ? 'tinggi' : 'sedang',
      reason: 'Telaah hukum formal & mitigasi risiko kontrak',
    };
  }

  // Default balanced style
  return {
    style: 'Ramah & Mendukung',
    urgency: 'sedang',
    reason: 'Diskusi konsultasi pendampingan klien',
  };
}

/**
 * Formats a response variant according to the selected AdvocateReplyStyle.
 */
function pickStyledVariant(
  style: AdvocateReplyStyle,
  variants: {
    formal: string;
    friendly: string;
    concise: string;
  }
): string {
  switch (style) {
    case 'Formal & Profesional':
      return variants.formal;
    case 'Singkat & To-the-point':
      return variants.concise;
    case 'Ramah & Mendukung':
    default:
      return variants.friendly;
  }
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
  preferredStyle?: 'auto' | AdvocateReplyStyle;
}): Promise<AutoAdvocateResult> {
  const styleCtx = selectAdvocateReplyStyle({
    clientMessage: params.clientMessage,
    document: params.document,
    preferredStyle: params.preferredStyle,
  });

  try {
    const res = await fetch('/api/advocate/auto-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        selectedStyle: styleCtx.style,
        detectedUrgency: styleCtx.urgency,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as AutoAdvocateResult;
      if (data && typeof data.replyText === 'string' && data.replyText.trim()) {
        return {
          ...data,
          appliedStyle: data.appliedStyle || styleCtx.style,
          detectedUrgency: data.detectedUrgency || styleCtx.urgency,
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
    appliedStyle: local.appliedStyle || styleCtx.style,
    detectedUrgency: local.detectedUrgency || styleCtx.urgency,
    replyText: stripMarkdownFormatting(local.replyText),
  };
}

/**
 * Natural, human-like Indonesian conversational & contract revision engine
 * with dynamic reply style selection ('Formal & Profesional', 'Ramah & Mendukung',
 * 'Singkat & To-the-point').
 */
export function runLocalContextualLegalEngine(params: {
  clientMessage: string;
  quotedClauseId?: string;
  session: ConsultationSession;
  lawyer: Lawyer;
  document?: LegalDocument;
  recentMessages: ChatMessage[];
  preferredStyle?: 'auto' | AdvocateReplyStyle;
}): AutoAdvocateResult {
  const {
    clientMessage,
    quotedClauseId,
    session,
    lawyer,
    document,
    preferredStyle,
  } = params;
  const q = clientMessage.toLowerCase().trim();
  const clauses = document?.clauses || [];
  const nowWib = getNowWIB();
  const clientFirst = getClientShortName(session.clientName);
  const lawyerShort = lawyer.name.split(',')[0].trim();

  const styleCtx = selectAdvocateReplyStyle({
    clientMessage,
    document,
    preferredStyle,
  });
  const { style, urgency } = styleCtx;

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

  // 1. Weather / Traffic / Atmosphere small talk ("cuaca gimana", "hujan", "panas", "mendung", "macet", "banjir")
  if (
    /\b(cuaca|hujan|gerimis|mendung|panas|terik|dingin|angin|banjir|macet)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    const isRain = /\b(hujan|gerimis|mendung|banjir)\b/i.test(q);
    const isHot = /\b(panas|terik|gerah)\b/i.test(q);
    const isTraffic = /\b(macet)\b/i.test(q);

    if (isRain) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Di daerah kantor saya di ${lawyer.jurisdiction} juga lagi mendung dan sempat hujan nih, ${clientFirst}. Memang cuaca belakangan ini sering berubah-ubah, jaga kesehatan ya! Ngomong-ngomong, ada hal yang lagi ingin kita obrolkan santai hari ini?`,
          formal: `Cuaca di wilayah ${lawyer.jurisdiction} saat ini juga sedang turun hujan, ${clientFirst}. Semoga aktivitas Anda tetap berjalan lancar. Silakan sampaikan apabila ada hal yang ingin didiskusikan.`,
          concise: `Di ${lawyer.jurisdiction} juga sedang hujan, ${clientFirst}. Semoga tetap aman di perjalanan. Ada yang ingin kita bahas sekarang?`,
        }),
        clauseUpdates: [],
      };
    }

    if (isHot) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Iya nih ${clientFirst}, di ${lawyer.jurisdiction} hari ini juga lumayan terik cuacanya. Jangan lupa banyak minum air putih ya. Gimana, sambil ngadem ada yang mau kita diskusikan?`,
          formal: `Benar ${clientFirst}, cuaca hari ini di ${lawyer.jurisdiction} cukup terik. Semoga aktivitas Anda tetap nyaman. Silakan jika ada pokok bahasan yang ingin kita tinjau.`,
          concise: `Di sini juga cukup panas hari ini, ${clientFirst}. Silakan kalau ada poin yang mau langsung kita bahas.`,
        }),
        clauseUpdates: [],
      };
    }

    if (isTraffic) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Wah, hati-hati di jalan ya ${clientFirst}. Jam-jam segini memang lalu lintas sering padat. Santai saja, kabari lagi kalau sudah sampai atau mau lanjut ngobrol di sini.`,
          formal: `Semoga perjalanan Anda tetap lancar, ${clientFirst}. Kita dapat melanjutkan diskusi ini kapan saja saat Anda sudah nyaman.`,
          concise: `Hati-hati di jalan, ${clientFirst}. Kabari saja saat siap lanjut diskusi.`,
        }),
        clauseUpdates: [],
      };
    }

    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Cuaca di sekitar ${lawyer.jurisdiction} hari ini cukup bersahabat kok, ${clientFirst}. Di tempat Anda sendiri gimana cuacanya? Semoga hari ini lancar terus ya kegiatannya.`,
        formal: `Cuaca di wilayah ${lawyer.jurisdiction} hari ini cukup kondusif, ${clientFirst}. Semoga kegiatan Anda juga berjalan lancar hari ini.`,
        concise: `Cuaca di ${lawyer.jurisdiction} cukup cerah hari ini, ${clientFirst}. Ada yang bisa saya bantu?`,
      }),
      clauseUpdates: [],
    };
  }

  // 2. Asking "How are you?" / Daily activity / Meals / Coffee ("gimana kabarnya", "apa kabar", "sehat pak", "udah makan", "ngopi", "lagi ngapain")
  if (
    /\b(apa kabar|kabarnya gimana|gimana kabar|gimana kabarnya|kabar bapak|kabar ibu|sehat pak|sehat bu|bapak sehat|udah makan|sudah makan|ngopi|minum kopi|lagi ngapain|sedang apa)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    if (/\b(makan|ngopi|kopi)\b/i.test(q)) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Kebetulan baru saja selesai ngopi sambil baca berkas nih, ${clientFirst}. Anda sendiri sudah makan belum? Jangan sampai telat makan ya di tengah kesibukan kerjaan.`,
          formal: `Terima kasih perhatiannya, ${clientFirst}, saya baru saja beristirahat sejenak. Semoga Anda juga dalam kondisi prima untuk beraktivitas hari ini.`,
          concise: `Sudah, terima kasih ${clientFirst}. Saya sedang siap di meja kerja, silakan jika ingin mulai diskusi.`,
        }),
        clauseUpdates: [],
      };
    }

    if (/\b(lagi ngapain|sedang apa)\b/i.test(q)) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Lagi santai memeriksa beberapa draf dokumen di ruang kerja saja kok, ${clientFirst}. Jadi pas banget kalau Anda mau ngobrol atau tanya-tanya sekarang.`,
          formal: `Saat ini saya sedang meninjau berkas perkara di kantor, ${clientFirst}, dan siap mendampingi sesi konsultasi Anda.`,
          concise: `Sedang meninjau berkas di meja kerja, ${clientFirst}. Silakan sampaikan hal yang ingin dibahas.`,
        }),
        clauseUpdates: [],
      };
    }

    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Alhamdulillah kabar saya baik dan sehat, ${clientFirst}. Terima kasih sudah menanyakan ya! Gimana kabar Anda sendiri hari ini? Semoga sehat dan urusan kerjaannya lancar terus.`,
        formal: `Kabar saya sangat baik, terima kasih ${clientFirst}. Semoga Anda beserta rekan-rekan juga senantiasa dalam keadaan sehat dan lancar.`,
        concise: `Kabar baik, terima kasih ${clientFirst}. Semoga Anda juga sehat. Ada yang ingin kita bahas?`,
      }),
      clauseUpdates: [],
    };
  }

  // 3. Islamic Greeting ("assalamualaikum")
  if (
    /\b(assalamualaikum|assalamu'alaikum|salam)\b/i.test(q) &&
    !mentionsContractAction
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Waalaikumsalam warahmatullahi wabarakatuh, ${clientFirst}. Silakan masuk, ada yang lagi ingin diobrolkan atau dikonsultasikan hari ini?`,
        formal: `Waalaikumsalam warahmatullahi wabarakatuh, ${clientFirst}. Selamat datang di ruang konsultasi, silakan sampaikan hal yang ingin kita bahas.`,
        concise: `Waalaikumsalam, ${clientFirst}. Silakan, ada yang bisa saya bantu?`,
      }),
      clauseUpdates: [],
    };
  }

  // 4. Pure Everyday Greetings ("halo pak", "halo", "pagi pak", "siang", "sore", "malam", "permisi", "tes", "p")
  const isCasualGreeting =
    /^(halo|hai|hi|pagi|selamat pagi|siang|selamat siang|sore|selamat sore|malam|selamat malam|permisi|punten|tes|test|ping|p|halo pak|halo bu|halo bang|halo kak|pak|bu|bang)\b/i.test(
      q
    ) &&
    q.split(/\s+/).length <= 6 &&
    !mentionsContractAction &&
    !/\b(tanya|nanya|sibuk|bantu|bingung|masalah|kasus)\b/i.test(q);

  if (isCasualGreeting) {
    const timeGreeting = /\bpagi\b/i.test(q)
      ? 'Selamat pagi'
      : /\bsiang\b/i.test(q)
        ? 'Selamat siang'
        : /\bsore\b/i.test(q)
          ? 'Selamat sore'
          : /\bmalam\b/i.test(q)
            ? 'Selamat malam'
            : 'Halo';

    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `${timeGreeting} ${clientFirst}, iya saya hadir. Gimana, lagi mau ngobrol santai dulu atau ada hal yang ingin ditanyakan?`,
        formal: `${timeGreeting} ${clientFirst}. Saya ${lawyerShort} siap mendampingi Anda pada sesi ini. Silakan sampaikan hal yang memerlukan bantuan.`,
        concise: `${timeGreeting} ${clientFirst}, silakan. Ada yang bisa saya bantu sekarang?`,
      }),
      clauseUpdates: [],
    };
  }

  // 5. Asking if lawyer is busy / asking permission to ask ("lagi sibuk ga pak?", "boleh tanya?", "mau nanya dong", "bisa bantu saya?")
  if (
    /\b(lagi sibuk|sibuk ga|sibuk nggak|ada waktu|boleh tanya|boleh nanya|mau tanya|mau nanya|numpang tanya|bisa bantu|minta tolong|bisa konsul|mau konsul)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Boleh banget, ${clientFirst}. Kebetulan saya lagi luang dan tidak sedang sidang kok. Mau tanya atau cerita soal apa? Santai saja.`,
        formal: `Tentu, ${clientFirst}. Saat ini waktu saya sepenuhnya tersedia untuk sesi konsultasi Anda. Silakan sampaikan pertanyaan atau duduk perkaranya.`,
        concise: `Bisa ${clientFirst}, saya sedang luang. Silakan langsung sampaikan pertanyaannya.`,
      }),
      clauseUpdates: [],
    };
  }

  // 6. Asking about the lawyer's profile / office / experience ("kantor bapak di mana?", "pengalaman berapa lama?", "siapa nama bapak?")
  if (
    /\b(kantor bapak|kantornya di mana|lokasi mana|domisili mana|pengalaman berapa|sudah berapa lama|spesialis apa|siapa nama bapak|nama ibu siapa|profil bapak)\b/i.test(
      q
    )
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Kenalkan lagi ya ${clientFirst}, saya ${lawyerShort}. Sehari-hari saya praktik di wilayah ${lawyer.jurisdiction} fokus di bidang ${lawyer.specialty}, sudah sekitar ${lawyer.experienceYears} tahun menangani perkara seperti ini. Jadi santai saja, anggap lagi ngobrol sama rekan sendiri.`,
        formal: `Perkenalkan, saya ${lawyer.name} (${lawyer.niaPeradi}), berpraktik di wilayah hukum ${lawyer.jurisdiction} dengan spesialisasi ${lawyer.specialty} selama ${lawyer.experienceYears} tahun.`,
        concise: `Saya ${lawyerShort}, Advokat spesialis ${lawyer.specialty} di ${lawyer.jurisdiction} (${lawyer.experienceYears} tahun pengalaman).`,
      }),
      clauseUpdates: [],
    };
  }

  // 7. Acknowledgements & Thanks ("makasih pak", "terima kasih", "oke pak", "siap", "mantap", "baik pak", "setuju")
  if (
    /^(makasih|terima kasih|trims|thanks|thank you|matur nuwun)/i.test(q) &&
    !mentionsContractAction
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Sama-sama, ${clientFirst}! Senang bisa bantu. Kalau nanti ada yang kepikiran lagi atau sekadar mau tanya pendapat, langsung chat saja ya.`,
        formal: `Sama-sama, ${clientFirst}. Merupakan kewajiban kami untuk memastikan kepentingan hukum Anda terlindungi dengan baik.`,
        concise: `Sama-sama, ${clientFirst}. Kabari saja jika butuh bantuan lagi.`,
      }),
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
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Siap mantap, ${clientFirst}. Kalau ada hal lain yang mau diobrolkan atau dirombak lagi, tinggal ketik saja kapan pun ya.`,
        formal: `Baik, ${clientFirst}. Saya tetap bersiaga di ruang konsultasi ini apabila terdapat klausul tambahan yang perlu ditinjau.`,
        concise: `Siap, ${clientFirst}. Silakan lanjut kapan saja.`,
      }),
      clauseUpdates: [],
    };
  }

  // 8. Expressing worry, confusion, or asking for general advice ("saya bingung nih", "takut rugi", "ragu", "gimana menurut bapak?")
  if (
    /\b(bingung|takut|ragu|khawatir|cemas|masalah|problem|solusi|menurut bapak|menurut ibu|saran bapak|pendapat bapak|gimana bagusnya|baiknya gimana)\b/i.test(
      q
    ) &&
    !mentionsContractAction
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Tenang dulu ${clientFirst}, tarik napas dulu. Wajar banget kok kalau merasa ragu—justru untung kita bahas sekarang sebelum ada yang ditandatangani. Coba ceritakan pelan-pelan bagian mana yang paling bikin Anda nggak nyaman?`,
        formal: `Kekhawatiran Anda sangat beralasan secara hukum, ${clientFirst}. Langkah paling tepat saat ini adalah mengidentifikasi poin kewajiban yang memberatkan agar dapat kita mitigasi sebelum penandatanganan.`,
        concise: `Jangan khawatir, ${clientFirst}. Sebutkan poin yang paling merugikan Anda, nanti langsung saya amankan pasalnya.`,
      }),
      clauseUpdates: [],
    };
  }

  // 9. Check if client wants to ADD a brand new clause ("tambahkan pasal...", "tambah klausul...", "masukkan pasal...")
  const wantsAddClause =
    !pasalMatch &&
    (/\b(tambah|tambahkan|masukkan|sisipkan)\b/i.test(clientMessage) ||
      /\b(pasal baru|klausul baru)\b/i.test(clientMessage));

  if (wantsAddClause && document) {
    const nextNum = clauses.length + 1;
    const isForceMajeure = /\b(force majeure|keadaan kahar|bencana)\b/i.test(q);
    const isConfidentiality = /\b(rahasia|kerahasiaan|nda|data pribadi)\b/i.test(
      q
    );
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
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Siap ${clientFirst}, saya sudah langsung menambahkan dua pasal baru sekaligus di panel kanan: ${fmClause.clauseNumber} tentang Force Majeure dan ${disputeClause.clauseNumber} tentang Penyelesaian Sengketa. Keduanya sudah berstatus Aman, silakan dicek ya.`,
          formal: `Sesuai instruksi Anda, ${clientFirst}, saya telah menyisipkan ${fmClause.clauseNumber} (Keadaan Kahar) dan ${disputeClause.clauseNumber} (Penyelesaian Sengketa) ke dalam naskah kontrak sesuai standar KUHPerdata.`,
          concise: `Selesai, ${clientFirst}. ${fmClause.clauseNumber} (Force Majeure) & ${disputeClause.clauseNumber} (Sengketa) sudah ditambahkan di panel kanan dengan status Aman.`,
        }),
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
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Siap ${clientFirst}, saya sudah menambahkan ${newClause.clauseNumber} tentang ${newClause.title} langsung ke dokumen kontrak di sebelah kanan. Silakan dicek bunyi pasalnya, kalau ada yang mau dipoles lagi tinggal beri tahu saya ya.`,
        formal: `Telah ditambahkan ${newClause.clauseNumber} mengenai ${newClause.title} ke dalam dokumen kontrak di panel kanan dengan status risiko Aman, ${clientFirst}.`,
        concise: `Selesai, ${clientFirst}. ${newClause.clauseNumber} (${newClause.title}) sudah ditambahkan ke kontrak di panel kanan.`,
      }),
      referencedClauseLabel: `${newClause.clauseNumber} — ${newClause.title}`,
      clauseUpdates: [],
      newClause,
      updatedOpinionSummary: `Dokumen kontrak telah diperkuat dengan penambahan ${newClause.clauseNumber} (${newClause.title}) guna melindungi posisi hukum Klien.`,
    };
  }

  // 10. Check if client asks whether the contract is safe to sign ("apakah kontrak ini sudah aman?", "sudah aman ditandatangani?", "boleh tanda tangan?")
  const asksContractSafety =
    /\b(apakah|udah|sudah)\b.*\b(aman|siap|bisa|boleh)\b/i.test(q) ||
    /\b(aman ditandatangani|siap tanda tangan|layak ditandatangani)\b/i.test(q);

  if (
    asksContractSafety &&
    clauses.length > 0 &&
    !/\b(rombak|revisi|ubah|hapus)\b/i.test(q)
  ) {
    const riskyClauses = clauses.filter((c) => c.riskStatus !== 'safe');
    if (riskyClauses.length === 0) {
      return {
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Sudah aman untuk ditandatangani, ${clientFirst}. Seluruh ${clauses.length} pasal di panel kanan sudah berstatus Aman dan tidak ada lagi sanksi sepihak yang menjebak posisi Anda.`,
          formal: `Berdasarkan hasil telaah akhir, seluruh ${clauses.length} klausul pada dokumen kontrak ini telah memenuhi asas keseimbangan hukum dan berstatus Aman untuk ditandatangani, ${clientFirst}.`,
          concise: `Sudah Aman, ${clientFirst}. Seluruh ${clauses.length} pasal siap ditandatangani.`,
        }),
        clauseUpdates: [],
      };
    }
    const firstRisky = riskyClauses[0];
    const riskyList = riskyClauses.map((c) => c.clauseNumber).join(' dan ');
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Saran saya jangan ditandatangani dulu ya, ${clientFirst}. Masih ada ${riskyClauses.length} pasal yang berisiko bagi posisi Anda (${riskyList}), terutama di ${firstRisky.clauseNumber} mengenai ${firstRisky.title}. Kalau Anda setuju, ketik saja "Rombak semua pasal berisiko" biar langsung saya amankan semuanya sekarang.`,
        formal: `Secara hukum, dokumen ini belum layak ditandatangani karena masih terdapat ${riskyClauses.length} klausul berisiko (${riskyList}), khususnya ${firstRisky.clauseNumber} (${firstRisky.title}). Balas "Rombak semua pasal berisiko" agar saya perbarui seluruhnya.`,
        concise: `Belum aman, ${clientFirst}. Masih ada ${riskyClauses.length} pasal berisiko (${riskyList}). Ketik "Rombak semua pasal berisiko" untuk saya amankan sekarang.`,
      }),
      referencedClauseId: firstRisky.id,
      referencedClauseLabel: `${firstRisky.clauseNumber} — ${firstRisky.title}`,
      clauseUpdates: [],
    };
  }

  // 11. Check if client is asking to REVISE / ROMBAK clauses
  const isRevisionIntent =
    /\b(rombak|rombakkan|revisi|ubah|ganti|hapus|perbaiki|amankan|turunkan|naikkan|sesuaikan|batalkan|hilangkan|kurangi|buatkan usulan)\b/i.test(
      clientMessage
    ) ||
    Boolean(
      pasalMatch &&
        /\b(jadi|menjadi|tanpa|jangan|maksimal|hari|%|hapus|hilangkan)\b/i.test(
          clientMessage
        )
    );

  // 11A. Bulk revision of all risky clauses ("rombak semua", "amankan semua pasal", "rombak kontrak ini")
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
        appliedStyle: style,
        detectedUrgency: urgency,
        replyText: pickStyledVariant(style, {
          friendly: `Semua pasal di kontrak ini (${clauses.length} pasal) sebenarnya sudah berstatus Aman, ${clientFirst}. Tapi kalau ada pasal tertentu yang ingin Anda ubah lagi bunyi kalimat atau angkanya, sebutkan saja nomor pasalnya ya.`,
          formal: `Seluruh ${clauses.length} pasal dalam dokumen kontrak saat ini telah berstatus Aman, ${clientFirst}. Silakan sebutkan nomor pasal spesifik apabila Anda menghendaki penyesuaian redaksional lebih lanjut.`,
          concise: `Seluruh ${clauses.length} pasal sudah Aman, ${clientFirst}. Sebutkan nomor pasal jika ingin ubah detail tertentu.`,
        }),
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
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Siap ${clientFirst}, sudah saya rombak semuanya! Sebanyak ${updates.length} pasal yang tadinya memberatkan (${revisedList}) di panel kanan sudah saya ganti dengan rumusan yang seimbang dan statusnya sekarang sudah Aman semua. Silakan dicek hasilnya di sebelah kanan.`,
        formal: `Telah dilakukan perombakan menyeluruh terhadap ${updates.length} klausul berisiko (${revisedList}) sesuai asas proporsionalitas Pasal 1338 KUHPerdata. Seluruh klausul kini berstatus Aman dan Opini Hukum telah diperbarui.`,
        concise: `Selesai, ${clientFirst}. ${updates.length} pasal berisiko (${revisedList}) telah dirombak menjadi Aman di panel kanan.`,
      }),
      referencedClauseId: firstTarget.id,
      referencedClauseLabel: `${firstTarget.clauseNumber} — ${firstTarget.title}`,
      clauseUpdates: updates,
      updatedOpinionSummary: `Seluruh klausul krusial (${revisedList}) pada kontrak telah dirombak oleh ${lawyer.name} sesuai permintaan Klien dan kini berstatus Aman untuk ditandatangani.`,
      updatedSessionStatus: 'Opini Hukum Terbit',
    };
  }

  // 11B. Specific clause revision (e.g., "Tolong rombak Pasal 2 agar denda dihapus" or "Rombak pasal ini")
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
      naturalExplanation = `Klausul denda sepihaknya sudah saya hapus dan diganti mekanisme evaluasi bersama tanpa penalti finansial.`;
    } else if (daysMatch || percentMatch) {
      const daysText = daysMatch ? `${daysMatch[1]} hari kalender` : '30 hari kalender';
      const pctText = percentMatch ? `${percentMatch[1]}%` : '2%';
      customDraft = `Pelaksanaan kewajiban pada ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) diberikan jangka waktu selama ${daysText} sejak diterimanya dokumen lengkap, dengan batas maksimum penyesuaian atau denda keterlambatan terkendali sebesar ${pctText} berdasarkan kesepakatan tertulis Para Pihak.`;
      naturalExplanation = `Jangka waktunya sudah disesuaikan menjadi ${daysText} dengan batas ketentuan ${pctText} agar tetap terkendali.`;
    } else if (
      !customDraft ||
      customDraft.trim().length === 0 ||
      customDraft === clauseToRevise.originalText
    ) {
      customDraft = `Ketentuan dalam ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) dilaksanakan berdasarkan asas keseimbangan dan iktikad baik (Pasal 1338 KUHPerdata), di mana setiap perubahan kuota, denda, atau pengakhiran wajib memperoleh persetujuan tertulis dari kedua belah pihak.`;
      naturalExplanation = `Rumusannya sudah diubah agar tidak bisa diputuskan sepihak dan wajib melalui persetujuan bersama.`;
    } else {
      naturalExplanation = `Bunyi pasalnya sudah diganti mengikuti draf perlindungan hukum yang seimbang bagi posisi Anda.`;
    }

    const update: AutoAdvocateClauseUpdate = {
      clauseId: clauseToRevise.id,
      riskStatus: 'safe',
      replaceOriginalText: customDraft,
      lawyerNote: `Dirombak oleh ${lawyerShort} (${nowWib}) sesuai permintaan Klien: Klausul kini sudah seimbang dan berstatus Aman.`,
      proposedRevision: customDraft,
    };

    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Siap ${clientFirst}, ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) sudah langsung saya rombak di panel kanan ya. ${naturalExplanation} Status pasalnya sekarang sudah berubah menjadi Aman.`,
        formal: `Perombakan pada ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) telah diterapkan di panel kanan, ${clientFirst}. ${naturalExplanation} Status klausul kini dinyatakan Aman.`,
        concise: `Selesai, ${clientFirst}. ${clauseToRevise.clauseNumber} (${clauseToRevise.title}) sudah dirombak menjadi Aman. ${naturalExplanation}`,
      }),
      referencedClauseId: clauseToRevise.id,
      referencedClauseLabel: `${clauseToRevise.clauseNumber} — ${clauseToRevise.title}`,
      clauseUpdates: [update],
      updatedOpinionSummary: `${clauseToRevise.clauseNumber} (${clauseToRevise.title}) telah dirombak oleh ${lawyer.name} sesuai permintaan Klien pada ${nowWib} sehingga posisi hukum Klien terlindungi.`,
    };
  }

  // 12. Specific legal topics & negotiation chat
  const relevantClause =
    targetClause ||
    clauses.find((c) => c.riskStatus === 'critical') ||
    clauses.find((c) => c.riskStatus === 'warning');

  if (
    /\b(negosiasi|pihak lawan|vendor|mereka nolak|tidak mau|keberatan)\b/i.test(q)
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Kalau pihak lawan keberatan pasalnya dihapus total, trik negosiasinya kita tawarkan jalan tengah, ${clientFirst}. Misalnya sanksi dendanya kita ganti jadi evaluasi berkala atau batas maksimal dendanya dibatasi 2% saja. Biasanya lawan transaksi jauh lebih mudah menerima opsi jalan tengah seperti itu.`,
        formal: `Dalam strategi negosiasi kontrak komersial, apabila pihak lawan menolak penghapusan klausul secara penuh, kita dapat mengajukan klausul jalan tengah berupa pembatasan plafon denda maksimal (capping) 2% atau mekanisme evaluasi kuartalan.`,
        concise: `Solusi negosiasinya: tawarkan jalan tengah berupa batas maksimal denda 2% atau evaluasi bersama, ${clientFirst}.`,
      }),
      clauseUpdates: [],
    };
  }

  if (/\b(denda|kuota|sanksi|penalti)\b/i.test(q)) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Soal denda atau target kuota itu memang harus hati-hati, ${clientFirst}. Dalam hukum perjanjian kita, sanksi tidak boleh berat sebelah apalagi kalau kendalanya bukan dari pihak Anda.${
          relevantClause
            ? ` Kalau mau, bilang saja "Rombak ${relevantClause.clauseNumber} agar denda dihapus", nanti langsung saya ubah pasalnya di kanan.`
            : ''
        }`,
        formal: `Berdasarkan asas iktikad baik dan kepatutan Pasal 1338 KUHPerdata, klausul denda sepihak yang tidak proporsional dapat dimintakan revisi sebelum penandatanganan.${
          relevantClause
            ? ` Ketik "Rombak ${relevantClause.clauseNumber} agar denda dihapus" untuk menerapkan perbaikan pada kontrak.`
            : ''
        }`,
        concise: `Klausul denda sepihak berisiko tinggi, ${clientFirst}.${
          relevantClause
            ? ` Ketik "Rombak ${relevantClause.clauseNumber} agar denda dihapus" agar langsung saya ubah.`
            : ''
        }`,
      }),
      referencedClauseId: relevantClause?.id,
      referencedClauseLabel: relevantClause
        ? `${relevantClause.clauseNumber} — ${relevantClause.title}`
        : undefined,
      clauseUpdates: [],
    };
  }

  if (/\b(wanprestasi|ingkar janji|gagal bayar|somasi|telat|terlambat)\b/i.test(q)) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Kalau pihak lawan yang wanprestasi atau terlambat memenuhi kewajibannya, Anda berhak melayangkan teguran tertulis (somasi) dan menunda pembayaran Anda, ${clientFirst}. Mau sekalian saya tambahkan pasal Penyelesaian Sengketa di kontrak kanan supaya posisi Anda makin kuat?`,
        formal: `Mengacu pada Pasal 1266 dan 1267 KUHPerdata, apabila pihak lawan melakukan wanprestasi, Anda berhak melayangkan somasi serta menuntut pemenuhan perjanjian atau pembatalan disertai ganti rugi.`,
        concise: `Jika lawan wanprestasi, Anda berhak melayangkan somasi dan menunda kewajiban pembayaran (Pasal 1267 KUHPerdata), ${clientFirst}.`,
      }),
      clauseUpdates: [],
    };
  }

  if (
    /\b(hafal|hapal|menghafal|menghapal|hafalan|hapalan|unsika|kuliah|mahasiswa|kampus|ujian|skripsi|pasal berapa|pasal penting|kuhperdata)\b/i.test(
      q
    )
  ) {
    return {
      appliedStyle: style,
      detectedUrgency: urgency,
      replyText: pickStyledVariant(style, {
        friendly: `Semangat terus kuliahnya di UNSIKA sambil pegang posisi di perusahaan ya, ${clientFirst}! Biar gampang dihafal buat ujian sekaligus kerjaan kontrak: ingat 4 pilar KUHPerdata ini—Pasal 1320 (4 syarat sah perjanjian), Pasal 1338 (kebebasan berkontrak & iktikad baik), Pasal 1243 & 1267 (ganti rugi wanprestasi), serta Pasal 1244-1245 (Force Majeure). Mau kita tes hafalan pasal lain atau lanjut bedah draf di kanan?`,
        formal: `Untuk mendukung studi hukum Anda di UNSIKA sekaligus tugas korporasi, berikut pasal kunci Hukum Perikatan KUHPerdata yang wajib dikuasai: Pasal 1320 (syarat sahnya perjanjian), Pasal 1338 (asas pacta sunt servanda & iktikad baik), Pasal 1243 jo. 1267 (akibat wanprestasi), Pasal 1244-1245 (keadaan kahar), dan Pasal 1365 (perbuatan melawan hukum).`,
        concise: `Rangkuman cepat hafalan KUHPerdata untuk ${clientFirst}: Pasal 1320 (Syarat Sah), Pasal 1338 (Iktikad Baik), Pasal 1243/1267 (Wanprestasi), dan Pasal 1244-1245 (Force Majeure).`,
      }),
      clauseUpdates: [],
    };
  }

  // 13. General human-like chat fallback adapted to the selected style
  return {
    appliedStyle: style,
    detectedUrgency: urgency,
    replyText: pickStyledVariant(style, {
      friendly: `Iya ${clientFirst}, saya tangkap maksudnya. Coba ceritakan saja lebih lanjut bagian mana yang lagi Anda pikirkan, atau kalau mau saya bantu bereskan pasal di sebelah kanan juga tinggal bilang ya.`,
      formal: `Baik ${clientFirst}, poin yang Anda sampaikan telah saya perhatikan. Silakan informasikan apabila terdapat klausul kontrak atau aspek hukum spesifik yang ingin segera kita tindak lanjuti.`,
      concise: `Baik ${clientFirst}, poin Anda sudah jelas. Sebutkan bagian yang ingin langsung saya tindak lanjuti.`,
    }),
    clauseUpdates: [],
  };
}

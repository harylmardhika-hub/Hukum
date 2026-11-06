import { jsPDF } from 'jspdf';
import {
  ConsultationSession,
  Lawyer,
  LegalDocument,
  ChatMessage,
} from '../types/legal';
import { getNowWIB } from './realtimeSync';

export function exportConsultationAndContractPdf(params: {
  session: ConsultationSession;
  lawyer: Lawyer;
  documents: LegalDocument[];
  messages?: ChatMessage[];
}): void {
  const { session, lawyer, documents, messages = [] } = params;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  let y = 18;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }
  };

  // 1. Official Top Institutional Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ADVOKAID — SALINAN RESMI TELAAH HUKUM & KONTRAK', marginX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text(
    `Nomor Perkara: ${session.caseNumber}  |  Status: ${session.status}  |  Dicetak: ${getNowWIB()}`,
    marginX,
    21
  );

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    'Dokumen Rahasia Klien & Advokat — Dilindungi Pasal 19 UU No. 18 Tahun 2003 tentang Advokat',
    marginX,
    27
  );

  y = 43;

  // 2. Case Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(session.title, contentWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 6 + 3;

  // 3. Identity Box (Client & Advocate)
  ensureSpace(32);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, y, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('IDENTITAS KLIEN', marginX + 4, y + 6);
  doc.text('ADVOKAT PEMERIKSA (PERADI)', marginX + contentWidth / 2 + 2, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(session.clientName, marginX + 4, y + 12);
  doc.text(lawyer.name, marginX + contentWidth / 2 + 2, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const clientSub = doc.splitTextToSize(
    session.clientCompany || 'Klien Terverifikasi',
    contentWidth / 2 - 8
  );
  doc.text(clientSub.slice(0, 2), marginX + 4, y + 17);

  const lawyerSub = `${lawyer.niaPeradi} · ${lawyer.specialty}\n${lawyer.jurisdiction}`;
  const lawyerSubLines = doc.splitTextToSize(lawyerSub, contentWidth / 2 - 8);
  doc.text(lawyerSubLines.slice(0, 2), marginX + contentWidth / 2 + 2, y + 17);

  y += 35;

  // 4. Section I: Legal Opinion Summary
  ensureSpace(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('I. RINGKASAN OPINI HUKUM (LEGAL OPINION)', marginX, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const opinionLines = doc.splitTextToSize(
    session.legalOpinionSummary || 'Belum ada ringkasan opini hukum.',
    contentWidth
  );
  ensureSpace(opinionLines.length * 5 + 6);
  doc.text(opinionLines, marginX, y);
  y += opinionLines.length * 4.8 + 4;

  if (session.recommendedNextSteps && session.recommendedNextSteps.length > 0) {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Rekomendasi Langkah Hukum Selanjutnya:', marginX, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    session.recommendedNextSteps.forEach((step, idx) => {
      const stepLines = doc.splitTextToSize(
        `${idx + 1}. ${step}`,
        contentWidth - 4
      );
      ensureSpace(stepLines.length * 4.5 + 3);
      doc.text(stepLines, marginX + 2, y);
      y += stepLines.length * 4.5 + 1.5;
    });
    y += 4;
  }

  // 5. Section II: Reviewed Contract Draft & Clauses
  ensureSpace(20);
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9);
  doc.text(
    'II. NASKAH KONTRAK & RINCIAN TELAAH PASAL DEMI PASAL',
    marginX,
    y
  );
  y += 6;

  if (documents.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Tidak ada dokumen kontrak yang dilampirkan pada sesi ini.', marginX, y);
    y += 8;
  } else {
    documents.forEach((legalDoc, docIdx) => {
      const safeCount = legalDoc.clauses.filter(
        (c) => c.riskStatus === 'safe'
      ).length;
      const warnCount = legalDoc.clauses.filter(
        (c) => c.riskStatus === 'warning'
      ).length;
      const critCount = legalDoc.clauses.filter(
        (c) => c.riskStatus === 'critical'
      ).length;

      ensureSpace(18);
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, y, contentWidth, 13, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Dokumen ${docIdx + 1}: ${legalDoc.title} (${legalDoc.documentType})`,
        marginX + 3,
        y + 5.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Status: ${legalDoc.overallStatus}  |  Rekapitulasi: ${safeCount} Aman · ${warnCount} Perlu Revisi · ${critCount} Risiko Tinggi`,
        marginX + 3,
        y + 10.5
      );
      y += 17;

      legalDoc.clauses.forEach((clause) => {
        const statusLabel =
          clause.riskStatus === 'critical'
            ? 'RISIKO TINGGI'
            : clause.riskStatus === 'warning'
              ? 'PERLU REVISI'
              : 'AMAN';

        const origLines = doc.splitTextToSize(
          `Bunyi Pasal: "${clause.originalText}"`,
          contentWidth - 8
        );
        const noteLines = clause.lawyerNote
          ? doc.splitTextToSize(
              `Catatan Hukum Advokat: ${clause.lawyerNote}`,
              contentWidth - 8
            )
          : [];
        const revLines =
          clause.proposedRevision &&
          clause.proposedRevision.trim() !== clause.originalText.trim()
            ? doc.splitTextToSize(
                `Usulan Rumusan Revisi: "${clause.proposedRevision}"`,
                contentWidth - 8
              )
            : [];

        const boxHeight =
          10 +
          origLines.length * 4.3 +
          (noteLines.length > 0 ? noteLines.length * 4.3 + 3 : 0) +
          (revLines.length > 0 ? revLines.length * 4.3 + 3 : 0) +
          4;

        ensureSpace(boxHeight + 4);

        // Clause border box
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(marginX, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

        // Clause Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `${clause.clauseNumber} — ${clause.title}`,
          marginX + 4,
          y + 6
        );

        // Risk Badge Text on Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        if (clause.riskStatus === 'critical') {
          doc.setTextColor(185, 28, 28); // Red 700
        } else if (clause.riskStatus === 'warning') {
          doc.setTextColor(180, 83, 9); // Amber 700
        } else {
          doc.setTextColor(4, 120, 87); // Emerald 700
        }
        doc.text(
          `[${statusLabel}]`,
          pageWidth - marginX - 4,
          y + 6,
          { align: 'right' }
        );

        let cy = y + 11.5;

        // Original / Current Clause Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(30, 41, 59);
        doc.text(origLines, marginX + 4, cy);
        cy += origLines.length * 4.3 + 2;

        // Lawyer Note
        if (noteLines.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(noteLines, marginX + 4, cy);
          cy += noteLines.length * 4.3 + 2;
        }

        // Proposed Revision
        if (revLines.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(4, 120, 87);
          doc.text(revLines, marginX + 4, cy);
        }

        y += boxHeight + 4;
      });
    });
  }

  // 6. Section III: Recent Consultation Chat Transcript
  if (messages.length > 0) {
    ensureSpace(22);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(180, 83, 9);
    doc.text('III. RIWAYAT DISKUSI & KONSULTASI HUKUM', marginX, y);
    y += 6;

    const recentMessages = messages.slice(-10);
    recentMessages.forEach((msg) => {
      const roleLabel = msg.senderRole === 'lawyer' ? 'Advokat' : 'Klien';
      const headerLine = `${msg.senderName} (${roleLabel}) · ${msg.timestamp}`;
      const bodyLines = doc.splitTextToSize(msg.content, contentWidth - 6);

      ensureSpace(bodyLines.length * 4.2 + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(headerLine, marginX + 2, y);
      y += 4.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(bodyLines, marginX + 2, y);
      y += bodyLines.length * 4.2 + 3.5;
    });
  }

  // 7. Page Numbers & Official Footer on Every Page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `AdvokaID · Salinan Fisik Hasil Telaah Hukum (${session.caseNumber})`,
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Halaman ${p} dari ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: 'right' }
    );
  }

  const safeCaseNum = session.caseNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeClient = session.clientName
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`Telaah_Hukum_Kontrak_${safeCaseNum}_${safeClient}.pdf`);
}

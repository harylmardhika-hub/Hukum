import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  MessageSquareQuote,
  Upload,
  Plus,
  Check,
  Edit3,
  X,
} from 'lucide-react';
import {
  LegalDocument,
  ContractClause,
  ClauseRiskStatus,
  ContractTemplate,
} from '../types/legal';
import { CONTRACT_TEMPLATES } from '../data/initialLegalData';

interface ContractReviewerPanelProps {
  sessionId: string;
  documents: LegalDocument[];
  activeRole: 'client' | 'lawyer';
  lawyerName: string;
  highlightedClauseId?: string | null;
  onQuoteClauseToChat: (clause: ContractClause) => void;
  onAnnotateClause: (payload: {
    documentId: string;
    sessionId: string;
    clauseId: string;
    riskStatus: ClauseRiskStatus;
    lawyerNote: string;
    proposedRevision: string;
    updatedBy: string;
    postToChat?: boolean;
  }) => void;
  onUploadDocument: (payload: {
    id: string;
    sessionId: string;
    title: string;
    documentType: string;
    uploadedBy: 'client' | 'lawyer';
    clauses: Omit<ContractClause, 'id'>[];
  }) => void;
}

export const ContractReviewerPanel: React.FC<ContractReviewerPanelProps> = ({
  sessionId,
  documents,
  activeRole,
  lawyerName,
  highlightedClauseId,
  onQuoteClauseToChat,
  onAnnotateClause,
  onUploadDocument,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [riskFilter, setRiskFilter] = useState<'all' | ClauseRiskStatus>('all');
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<ClauseRiskStatus>('warning');
  const [editNote, setEditNote] = useState<string>('');
  const [editRevision, setEditRevision] = useState<string>('');
  const [postAnnotationToChat, setPostAnnotationToChat] = useState<boolean>(true);

  // Upload new document modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    CONTRACT_TEMPLATES[0].id
  );
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customType, setCustomType] = useState<string>('Kontrak Komersial');
  const [customRawText, setCustomRawText] = useState<string>(
    'Pasal 1 - Ruang Lingkup Pekerjaan\nPIHAK KEDUA wajib menyelesaikan pengembangan sistem perangkat lunak sesuai spesifikasi dalam waktu 90 hari kalender.\n\nPasal 2 - Tanggung Jawab Tanpa Batas\nPIHAK KEDUA bertanggung jawab penuh atas segala kerugian langsung maupun tidak langsung tanpa batas maksimum nilai ganti rugi.'
  );

  useEffect(() => {
    if (documents.length > 0 && !documents.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  useEffect(() => {
    if (highlightedClauseId) {
      const parentDoc = documents.find((d) =>
        d.clauses.some((c) => c.id === highlightedClauseId)
      );
      if (parentDoc && parentDoc.id !== selectedDocId) {
        setSelectedDocId(parentDoc.id);
      }
      setRiskFilter('all');
    }
  }, [highlightedClauseId, documents, selectedDocId]);

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const startEditingClause = (clause: ContractClause) => {
    setEditingClauseId(clause.id);
    setEditStatus(clause.riskStatus);
    setEditNote(clause.lawyerNote);
    setEditRevision(clause.proposedRevision);
  };

  const handleSaveClauseAnnotation = (clauseId: string) => {
    if (!currentDoc) return;
    onAnnotateClause({
      documentId: currentDoc.id,
      sessionId,
      clauseId,
      riskStatus: editStatus,
      lawyerNote: editNote.trim(),
      proposedRevision: editRevision.trim(),
      updatedBy: activeRole === 'lawyer' ? lawyerName : 'Klien (Catatan Diskusi)',
      postToChat: postAnnotationToChat,
    });
    setEditingClauseId(null);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const newDocId = `doc-${Date.now()}`;

    if (uploadMode === 'template') {
      const tpl: ContractTemplate | undefined = CONTRACT_TEMPLATES.find(
        (t) => t.id === selectedTemplateId
      );
      if (!tpl) return;
      onUploadDocument({
        id: newDocId,
        sessionId,
        title: `${tpl.title.replace(/\s+/g, '_')}.pdf`,
        documentType: tpl.documentType,
        uploadedBy: activeRole,
        clauses: tpl.clauses,
      });
    } else {
      if (!customTitle.trim() || !customRawText.trim()) return;
      const blocks = customRawText
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);

      const parsedClauses: Omit<ContractClause, 'id'>[] = blocks.map(
        (block, index) => {
          const lines = block.split('\n');
          const firstLine = lines[0].trim();
          const bodyLines = lines.slice(1).join(' ').trim();
          const hasHeader = /^pasal\s+\d+/i.test(firstLine) && bodyLines.length > 0;

          return {
            clauseNumber: `Pasal ${index + 1}`,
            title: hasHeader
              ? firstLine.replace(/^pasal\s+\d+\s*[-—:]?\s*/i, '') ||
                `Ketentuan Pasal ${index + 1}`
              : `Klausul Kontrak ${index + 1}`,
            originalText: hasHeader ? bodyLines : block,
            riskStatus: 'warning',
            lawyerNote: 'Menunggu peninjauan dan catatan hukum dari Advokat.',
            proposedRevision: '',
          };
        }
      );

      onUploadDocument({
        id: newDocId,
        sessionId,
        title: customTitle.endsWith('.pdf')
          ? customTitle.trim()
          : `${customTitle.trim()}.pdf`,
        documentType: customType,
        uploadedBy: activeRole,
        clauses: parsedClauses,
      });
    }

    setSelectedDocId(newDocId);
    setShowUploadModal(false);
  };

  const renderRiskIndicator = (status: ClauseRiskStatus) => {
    if (status === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Risiko Hukum Tinggi</span>
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Perlu Revisi</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Klausul Aman</span>
      </span>
    );
  };

  const filteredClauses =
    currentDoc?.clauses.filter((c) =>
      riskFilter === 'all' ? true : c.riskStatus === riskFilter
    ) || [];

  const criticalCount =
    currentDoc?.clauses.filter((c) => c.riskStatus === 'critical').length || 0;
  const warningCount =
    currentDoc?.clauses.filter((c) => c.riskStatus === 'warning').length || 0;
  const safeCount =
    currentDoc?.clauses.filter((c) => c.riskStatus === 'safe').length || 0;

  return (
    <div className="flex flex-col h-full bg-white lg:border-l border-slate-200">
      {/* Header Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              Meja Tinjauan Kontrak & Dokumen
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Telaah pasal demi pasal (Redlining)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Kontrak</span>
          </button>
        </div>

        {/* Document Selector & Summary Metrics */}
        {documents.length > 0 && currentDoc ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700 shrink-0" />
              <select
                value={currentDoc.id}
                onChange={(e) => setSelectedDocId(e.target.value)}
                aria-label="Pilih dokumen kontrak"
                className="w-full min-h-[40px] text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.clauses.length} Pasal)
                  </option>
                ))}
              </select>
            </div>

            {/* Clean unboxed summary & interactive segmented filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 font-mono tabular-nums">
                <span className="text-red-700 font-medium">
                  {criticalCount} Risiko Tinggi
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-medium">
                  {warningCount} Revisi
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">{safeCount} Aman</span>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'critical', label: 'Risiko Tinggi' },
                    { id: 'warning', label: 'Revisi' },
                    { id: 'safe', label: 'Aman' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRiskFilter(tab.id)}
                    className={`min-h-[32px] px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      riskFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Clause List Viewport */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
        {!currentDoc ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-300 rounded-lg">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">
              Belum Ada Dokumen Kontrak pada Sesi Ini
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Unggah draf kontrak kerja sama, PKWT, atau akta PPJB untuk ditinjau pasal demi pasal bersama Advokat.
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-4 min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lampirkan Draf Kontrak Pertama</span>
            </button>
          </div>
        ) : filteredClauses.length === 0 ? (
          <div className="text-center py-10 px-4 border border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-800">
              Tidak ada pasal dengan filter status tersebut.
            </p>
            <button
              type="button"
              onClick={() => setRiskFilter('all')}
              className="mt-2 min-h-[40px] text-xs font-semibold text-amber-700 hover:underline"
            >
              Tampilkan Semua Pasal
            </button>
          </div>
        ) : (
          filteredClauses.map((clause) => {
            const isHighlighted = highlightedClauseId === clause.id;
            const isEditing = editingClauseId === clause.id;

            return (
              <div
                key={clause.id}
                id={`clause-card-${clause.id}`}
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors ${
                  isHighlighted
                    ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Clause Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {clause.clauseNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      {renderRiskIndicator(clause.riskStatus)}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mt-1">
                      {clause.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onQuoteClauseToChat(clause)}
                      title="Kutip pasal ini ke ruang chat"
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      <span>Kutip ke Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        isEditing
                          ? setEditingClauseId(null)
                          : startEditingClause(clause)
                      }
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {activeRole === 'lawyer' ? 'Tinjau Pasal' : 'Beri Catatan'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Original Clause Text */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                  <div className="text-[11px] font-medium text-slate-500 mb-1">
                    Naskah Asli Kontrak:
                  </div>
                  {clause.originalText}
                </div>

                {/* Lawyer Legal Note & Proposed Redline */}
                {!isEditing && (
                  <div className="mt-3 space-y-2.5">
                    {clause.lawyerNote && (
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">
                          Analisis & Catatan Hukum:{' '}
                        </span>
                        {clause.lawyerNote}
                      </div>
                    )}

                    {clause.proposedRevision && (
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                        <div className="text-[11px] font-semibold text-emerald-800 mb-1">
                          Usulan Redaksi Pengganti (Counter-Draft Advokat):
                        </div>
                        {clause.proposedRevision}
                      </div>
                    )}

                    {clause.lastUpdatedBy && (
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Ditinjau oleh {clause.lastUpdatedBy} · {clause.lastUpdatedAt}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Clause Annotation & Redlining Editor */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                        Status Risiko Hukum Pasal
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { value: 'safe', label: 'Aman' },
                            { value: 'warning', label: 'Perlu Revisi' },
                            { value: 'critical', label: 'Risiko Tinggi' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEditStatus(opt.value)}
                            className={`min-h-[40px] px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                              editStatus === opt.value
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Catatan Hukum / Analisis Klausul
                      </label>
                      <textarea
                        rows={2}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Tuliskan dasar hukum (KUHPerdata / UU terkait) atau potensi risiko pasal ini..."
                        className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Usulan Redaksi Pengganti (Redline / Counter-Draft)
                      </label>
                      <textarea
                        rows={3}
                        value={editRevision}
                        onChange={(e) => setEditRevision(e.target.value)}
                        placeholder="Tuliskan bunyi rumusan pasal yang direkomendasikan..."
                        className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer min-h-[36px]">
                        <input
                          type="checkbox"
                          checked={postAnnotationToChat}
                          onChange={(e) => setPostAnnotationToChat(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
                        />
                        <span>Kirim pembaruan pasal ini ke ruang chat</span>
                      </label>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingClauseId(null)}
                          className="min-h-[40px] px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveClauseAnnotation(clause.id)}
                          className="min-h-[40px] inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Tinjauan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload / Attach New Contract Modal (Mobile Bottom-Sheet Ready) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Unggah & Lampirkan Dokumen Kontrak
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih templat draf kontrak Indonesia atau tempelkan naskah pasal perjanjian Anda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="mt-4 space-y-4">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadMode('template')}
                  className={`flex-1 min-h-[40px] py-1.5 text-xs font-medium rounded-md transition-colors ${
                    uploadMode === 'template'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Draf Kontrak Standar
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('custom')}
                  className={`flex-1 min-h-[40px] py-1.5 text-xs font-medium rounded-md transition-colors ${
                    uploadMode === 'custom'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tempel Teks Sendiri
                </button>
              </div>

              {uploadMode === 'template' ? (
                <div className="space-y-3">
                  {CONTRACT_TEMPLATES.map((tpl) => (
                    <label
                      key={tpl.id}
                      className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedTemplateId === tpl.id
                          ? 'border-amber-700 bg-amber-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="contractTemplate"
                          value={tpl.id}
                          checked={selectedTemplateId === tpl.id}
                          onChange={() => setSelectedTemplateId(tpl.id)}
                          className="mt-1 w-4 h-4 text-amber-700 focus:ring-amber-600"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            {tpl.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {tpl.documentType} · {tpl.clauses.length} Pasal Lengkap
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {tpl.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Nama Berkas Dokumen
                    </label>
                    <input
                      type="text"
                      required
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Mis: Perjanjian_Sewa_Ruko_Senopati_2026.pdf"
                      className="w-full min-h-[44px] text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Jenis Dokumen Hukum
                    </label>
                    <input
                      type="text"
                      required
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Mis: Perjanjian Sewa Menyewa / Kontrak Vendor"
                      className="w-full min-h-[44px] text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Isi Pasal Kontrak (Pisahkan antar pasal dengan baris kosong)
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={customRawText}
                      onChange={(e) => setCustomRawText(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-3 font-mono focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800"
                >
                  Lampirkan ke Konsultasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

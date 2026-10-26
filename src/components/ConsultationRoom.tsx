import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Scale,
  FileText,
  BookmarkCheck,
  X,
  ArrowUpRight,
  Edit3,
  Check,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import {
  ConsultationSession,
  Lawyer,
  ChatMessage,
  LegalDocument,
  ContractClause,
  ClauseRiskStatus,
} from '../types/legal';
import { LawyerAvatar } from './LawyerAvatar';
import { ContractReviewerPanel } from './ContractReviewerPanel';

interface ConsultationRoomProps {
  session: ConsultationSession;
  allSessions: ConsultationSession[];
  lawyer: Lawyer;
  messages: ChatMessage[];
  documents: LegalDocument[];
  activeRole: 'client' | 'lawyer';
  authenticatedUserName: string;
  typingInfo: {
    sessionId: string;
    senderRole: 'client' | 'lawyer';
    senderName: string;
    isTyping: boolean;
  } | null;
  onSelectSession: (sessionId: string) => void;
  onSendMessage: (payload: {
    sessionId: string;
    senderRole: 'client' | 'lawyer';
    senderName: string;
    content: string;
    referencedClauseId?: string;
    referencedClauseLabel?: string;
  }) => void;
  onTypingChange: (isTyping: boolean) => void;
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
  onUpdateOpinion: (payload: {
    sessionId: string;
    legalOpinionSummary: string;
    recommendedNextSteps: string[];
    status: ConsultationSession['status'];
  }) => void;
}

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  session,
  allSessions,
  lawyer,
  messages,
  documents,
  activeRole,
  typingInfo,
  onSelectSession,
  onSendMessage,
  onTypingChange,
  onAnnotateClause,
  onUploadDocument,
  onUpdateOpinion,
}) => {
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'contract'>('chat');

  const [inputContent, setInputContent] = useState<string>('');
  const [quotedClause, setQuotedClause] = useState<ContractClause | null>(null);
  const [highlightedClauseId, setHighlightedClauseId] = useState<string | null>(null);
  const [showOpinionModal, setShowOpinionModal] = useState<boolean>(false);
  const [opinionText, setOpinionText] = useState<string>(session.legalOpinionSummary);
  const [stepsText, setStepsText] = useState<string>(
    session.recommendedNextSteps.join('\n')
  );
  const [opinionStatus, setOpinionStatus] = useState<ConsultationSession['status']>(
    session.status
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpinionText(session.legalOpinionSummary);
    setStepsText(session.recommendedNextSteps.join('\n'));
    setOpinionStatus(session.status);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, mobilePanel]);

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const senderName =
      activeRole === 'client' ? session.clientName : lawyer.name;
    onSendMessage({
      sessionId: session.id,
      senderRole: activeRole,
      senderName,
      content: inputContent.trim(),
      referencedClauseId: quotedClause?.id,
      referencedClauseLabel: quotedClause
        ? `${quotedClause.clauseNumber} — ${quotedClause.title}`
        : undefined,
    });

    setInputContent('');
    setQuotedClause(null);
    onTypingChange(false);
  };

  const handleQuoteClauseToChat = (clause: ContractClause) => {
    setQuotedClause(clause);
    setHighlightedClauseId(clause.id);
    setMobilePanel('chat');
  };

  const handleJumpToClause = (clauseId: string) => {
    setHighlightedClauseId(clauseId);
    setMobilePanel('contract');
    setTimeout(() => {
      const el = document.getElementById(`clause-card-${clauseId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSaveOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdateOpinion({
      sessionId: session.id,
      legalOpinionSummary: opinionText.trim(),
      recommendedNextSteps: steps,
      status: opinionStatus,
    });
    setShowOpinionModal(false);
  };

  const totalClausesCount = documents.reduce((acc, d) => acc + d.clauses.length, 0);

  const quickPrompts =
    activeRole === 'client'
      ? [
          'Apakah klausul denda ini dapat dibatalkan?',
          'Mohon buatkan rumusan counter-draft.',
          'Apa langkah jika pihak lawan wanprestasi?',
        ]
      : [
          'Catatan revisi pasal sudah saya perbarui di panel kanan.',
          'Klausul ini perlu diseimbangkan sesuai Pasal 1338 KUHPerdata.',
          'Silakan gunakan draf revisi di kanan untuk negosiasi.',
        ];

  return (
    <div className="space-y-3">
      {/* Unified Top Case Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <LawyerAvatar lawyer={lawyer} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {session.caseNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>Klien: {session.clientName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-800">{session.status}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
              {session.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {allSessions.length > 1 && (
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={session.id}
                onChange={(e) => onSelectSession(e.target.value)}
                aria-label="Pilih Perkara"
                className="w-full min-h-[38px] appearance-none pl-3 pr-8 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {allSessions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.caseNumber} — {item.title.slice(0, 38)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowOpinionModal(true)}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Scale className="w-3.5 h-3.5 text-amber-700" />
            <span>Opini Hukum</span>
          </button>
        </div>
      </div>

      {/* Mobile 2-Tab Switcher (Hidden on lg+ desktop where both panels sit 50/50 side-by-side) */}
      <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setMobilePanel('chat')}
          className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            mobilePanel === 'chat'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span>Ruang Chat ({messages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePanel('contract')}
          className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            mobilePanel === 'contract'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Tinjauan Kontrak ({totalClausesCount} Pasal)</span>
        </button>
      </div>

      {/* Balanced 50/50 Split Workspace on Desktop (lg:grid-cols-12 -> 6 cols Chat + 6 cols Contract Reviewer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel (6 Cols / 50% Width): Real-Time Legal Chat */}
        <section
          className={`${
            mobilePanel === 'chat' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-6 flex-col h-[640px] lg:h-[calc(100vh-13.5rem)] min-h-[540px] bg-white border border-slate-200 rounded-xl overflow-hidden`}
        >
          {/* Chat Panel Subheader */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                Diskusi Hukum · {lawyer.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {lawyer.specialty} · <span className="font-mono">{lawyer.niaPeradi}</span>
              </div>
            </div>

            {activeRole === 'lawyer' && (
              <button
                type="button"
                onClick={() => setShowOpinionModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Opini</span>
              </button>
            )}
          </div>

          {/* Compact Legal Opinion Banner */}
          <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-200/70 flex items-start justify-between gap-3">
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
              <strong className="text-amber-950">Ringkasan Opini:</strong>{' '}
              {session.legalOpinionSummary}
            </p>
            <button
              type="button"
              onClick={() => setShowOpinionModal(true)}
              className="text-[11px] font-semibold text-amber-800 hover:underline whitespace-nowrap shrink-0 mt-0.5"
            >
              Detail
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
            {messages.map((msg) => {
              const isOwnRole = msg.senderRole === activeRole;
              const isLawyerMsg = msg.senderRole === 'lawyer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnRole ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                    <span className="font-semibold text-slate-700">
                      {msg.senderName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{isLawyerMsg ? 'Advokat' : 'Klien'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed border ${
                      isOwnRole
                        ? 'bg-slate-900 text-white border-slate-900'
                        : isLawyerMsg
                          ? 'bg-amber-50/80 text-slate-900 border-amber-200'
                          : 'bg-white text-slate-900 border-slate-200'
                    }`}
                  >
                    {msg.referencedClauseId && msg.referencedClauseLabel && (
                      <button
                        type="button"
                        onClick={() => handleJumpToClause(msg.referencedClauseId!)}
                        className={`mb-2 w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 text-[11px] font-medium transition-colors ${
                          isOwnRole
                            ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/60'
                        }`}
                      >
                        <span className="truncate">
                          Rujukan: {msg.referencedClauseLabel}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                    {msg.attachedDocumentTitle && (
                      <button
                        type="button"
                        onClick={() => setMobilePanel('contract')}
                        className={`mb-2 w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-mono ${
                          isOwnRole
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span className="truncate">{msg.attachedDocumentTitle}</span>
                      </button>
                    )}

                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {typingInfo &&
              typingInfo.sessionId === session.id &&
              typingInfo.isTyping &&
              typingInfo.senderRole !== activeRole && (
                <div className="text-xs text-slate-500 italic px-2">
                  {typingInfo.senderName} sedang mengetik...
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3.5 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputContent(prompt)}
                className="px-2.5 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Quoted Clause Banner */}
          {quotedClause && (
            <div className="mx-3.5 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2">
              <div className="text-xs text-amber-950 truncate">
                <span className="font-semibold">
                  Mengutip {quotedClause.clauseNumber}:
                </span>{' '}
                {quotedClause.title}
              </div>
              <button
                type="button"
                onClick={() => setQuotedClause(null)}
                className="text-amber-800 hover:text-amber-950 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Composer */}
          <form
            onSubmit={handleSubmitChat}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputContent}
              onChange={(e) => {
                setInputContent(e.target.value);
                onTypingChange(e.target.value.length > 0);
              }}
              placeholder={
                activeRole === 'client'
                  ? 'Tulis pertanyaan hukum atau tanggapan...'
                  : 'Tulis advis hukum untuk Klien...'
              }
              className="flex-1 min-h-[42px] text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-600"
            />
            <button
              type="submit"
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </form>
        </section>

        {/* Right Panel (6 Cols / 50% Width): Interactive Contract Reviewer */}
        <section
          className={`${
            mobilePanel === 'contract' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-6 flex-col h-[640px] lg:h-[calc(100vh-13.5rem)] min-h-[540px] bg-white border border-slate-200 rounded-xl overflow-hidden`}
        >
          <ContractReviewerPanel
            sessionId={session.id}
            documents={documents}
            activeRole={activeRole}
            lawyerName={lawyer.name}
            highlightedClauseId={highlightedClauseId}
            onQuoteClauseToChat={handleQuoteClauseToChat}
            onAnnotateClause={onAnnotateClause}
            onUploadDocument={onUploadDocument}
          />
        </section>
      </div>

      {/* Legal Opinion Modal */}
      {showOpinionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-slate-500 tabular-nums">
                  {session.caseNumber} · {session.category}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  Ringkasan Opini Hukum & Rekomendasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOpinionModal(false)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeRole === 'lawyer' ? (
              <form onSubmit={handleSaveOpinion} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Status Perkara
                  </label>
                  <select
                    value={opinionStatus}
                    onChange={(e) =>
                      setOpinionStatus(
                        e.target.value as ConsultationSession['status']
                      )
                    }
                    className="w-full min-h-[42px] text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Menunggu Tinjauan Kontrak">
                      Menunggu Tinjauan Kontrak
                    </option>
                    <option value="Opini Hukum Terbit">Opini Hukum Terbit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Kesimpulan Analisis Hukum (Legal Opinion)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={opinionText}
                    onChange={(e) => setOpinionText(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Rekomendasi Tindakan Hukum (Satu per baris)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={stepsText}
                    onChange={(e) => setStepsText(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowOpinionModal(false)}
                    className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Opini Hukum</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-900 mb-1">
                    Pendapat Hukum ({lawyer.name}):
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {session.legalOpinionSummary}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">
                    Langkah Tindak Lanjut:
                  </div>
                  <ul className="space-y-2">
                    {session.recommendedNextSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-700"
                      >
                        <BookmarkCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowOpinionModal(false)}
                    className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

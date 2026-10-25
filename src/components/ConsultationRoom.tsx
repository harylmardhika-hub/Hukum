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
  UserCheck,
  MessageSquare,
  FolderKanban,
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
  authenticatedUserName,
  typingInfo,
  onSelectSession,
  onSendMessage,
  onTypingChange,
  onAnnotateClause,
  onUploadDocument,
  onUpdateOpinion,
}) => {
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'contract' | 'sessions'>('chat');

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
          'Apakah klausul denda di kontrak ini dapat dibatalkan?',
          'Mohon buatkan rumusan counter-draft yang lebih melindungi kami.',
          'Apa langkah hukum jika pihak lawan wanprestasi?',
        ]
      : [
          'Saya telah memperbarui catatan redlining pada pasal berisiko tinggi di panel kanan.',
          'Secara hukum keperdataan (Pasal 1320 & 1338 KUHPerdata), klausul ini perlu diseimbangkan.',
          'Silakan gunakan draf revisi yang telah saya susun untuk negosiasi dengan pihak lawan.',
        ];

  return (
    <div className="space-y-3">
      {/* Mobile & Tablet Ergonomic Sub-View Switcher */}
      <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-1.5 grid grid-cols-3 gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setMobilePanel('chat')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            mobilePanel === 'chat'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span>Chat ({messages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePanel('contract')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            mobilePanel === 'contract'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Kontrak ({totalClausesCount} Pasal)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePanel('sessions')}
          className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            mobilePanel === 'sessions'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5 shrink-0" />
          <span>Perkara ({allSessions.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-11rem)] bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Left Sidebar: Isolated Active Sessions List */}
        <aside
          className={`${
            mobilePanel === 'sessions' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 flex-col max-h-[75vh] lg:max-h-[calc(100vh-8.5rem)]`}
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900">
              {activeRole === 'client'
                ? `Perkara Milik ${authenticatedUserName} (${allSessions.length})`
                : `Perkara Ditugaskan pada Anda (${allSessions.length})`}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sesi terisolasi sesuai akun yang sedang login
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80">
            {allSessions.map((item) => {
              const isSelected = item.id === session.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSession(item.id);
                    setMobilePanel('chat');
                  }}
                  className={`w-full text-left p-4 min-h-[64px] transition-colors ${
                    isSelected
                      ? 'bg-amber-50/70 font-medium'
                      : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span className={isSelected ? 'text-amber-900 font-semibold' : ''}>
                      {item.caseNumber}
                    </span>
                    <span>{item.startedAt}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1.5">
                    <span className="truncate">{item.clientName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-800 font-medium truncate">
                      {item.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Panel: Real-Time Legal Chat Stream */}
        <section
          className={`${
            mobilePanel === 'chat' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-5 flex-col h-[calc(100vh-14.5rem)] min-h-[520px] lg:h-[calc(100vh-8.5rem)] bg-white`}
        >
          {/* Session Context Header */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <LawyerAvatar lawyer={lawyer} size="md" />
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {lawyer.name}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 truncate">
                  <span className="truncate">{lawyer.specialty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums shrink-0">
                    {lawyer.niaPeradi}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowOpinionModal(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Scale className="w-3.5 h-3.5 text-amber-700" />
                <span>Opini Hukum</span>
              </button>
            </div>
          </div>

          {/* Legal Opinion Summary Collapsible Strip */}
          <div className="px-4 sm:px-5 py-2.5 bg-amber-50/60 border-b border-amber-200/80 flex items-start justify-between gap-3">
            <div className="text-xs text-slate-800 leading-relaxed min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-amber-900 mb-0.5">
                <span className="font-mono tabular-nums">{session.caseNumber}</span>
                <span aria-hidden="true">·</span>
                <span>{session.status}</span>
              </div>
              <p className="line-clamp-2 text-[11px] sm:text-xs">
                {session.legalOpinionSummary}
              </p>
            </div>
            {activeRole === 'lawyer' && (
              <button
                type="button"
                onClick={() => setShowOpinionModal(true)}
                className="min-h-[36px] inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Real-Time Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/40">
            {messages.map((msg) => {
              const isOwnRole = msg.senderRole === activeRole;
              const isLawyerMsg = msg.senderRole === 'lawyer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnRole ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                    <span className="font-semibold text-slate-700">
                      {msg.senderName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{isLawyerMsg ? 'Advokat' : 'Klien'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[92%] sm:max-w-[86%] rounded-2xl px-3.5 sm:px-4 py-3 text-xs leading-relaxed border ${
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
                        className={`mb-2 w-full min-h-[40px] text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 text-[11px] font-medium transition-colors ${
                          isOwnRole
                            ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/60'
                        }`}
                      >
                        <span className="truncate">
                          Lihat Klausul: {msg.referencedClauseLabel}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                    {msg.attachedDocumentTitle && (
                      <button
                        type="button"
                        onClick={() => setMobilePanel('contract')}
                        className={`mb-2 w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 text-[11px] font-mono ${
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
                  {typingInfo.senderName} sedang menyusun tanggapan hukum...
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Authenticated Session Indicator & Quick Prompts */}
          <div className="px-3.5 sm:px-4 pt-2.5 pb-1 bg-white border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 min-w-0">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  Sesi Login Aktif:{' '}
                  <strong className="text-slate-900">
                    {authenticatedUserName} (
                    {activeRole === 'client' ? 'Klien' : 'Advokat Pendamping'})
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputContent(prompt)}
                  className="min-h-[34px] px-2.5 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Quoted Clause Banner */}
          {quotedClause && (
            <div className="mx-3.5 sm:mx-4 mt-1 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-2">
              <div className="text-xs text-amber-950 truncate">
                <span className="font-semibold">
                  Mengutip {quotedClause.clauseNumber}:
                </span>{' '}
                {quotedClause.title}
              </div>
              <button
                type="button"
                onClick={() => setQuotedClause(null)}
                className="text-amber-800 hover:text-amber-950 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Composer */}
          <form
            onSubmit={handleSubmitChat}
            className="p-3 sm:p-4 bg-white flex items-center gap-2"
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
              className="flex-1 min-h-[44px] text-xs sm:text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-600"
            />
            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </form>
        </section>

        {/* Right Panel: Interactive Contract Reviewer */}
        <section
          className={`${
            mobilePanel === 'contract' ? 'block' : 'hidden lg:block'
          } lg:col-span-4 h-[calc(100vh-14.5rem)] min-h-[520px] lg:h-[calc(100vh-8.5rem)]`}
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

      {/* Legal Opinion Summary & Recommendations Modal */}
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
                  Ringkasan Opini Hukum & Langkah Rekomendasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOpinionModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeRole === 'lawyer' ? (
              <form onSubmit={handleSaveOpinion} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Status Perkara / Konsultasi
                  </label>
                  <select
                    value={opinionStatus}
                    onChange={(e) =>
                      setOpinionStatus(
                        e.target.value as ConsultationSession['status']
                      )
                    }
                    className="w-full min-h-[44px] text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
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
                    Kesimpulan Analisis Hukum (Legal Opinion Summary)
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
                    Rekomendasi Tindakan Hukum (Satu poin per baris)
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
                    className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Terbitkan Opini Hukum</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-900 mb-1">
                    Pendapat Hukum Advokat ({lawyer.name}):
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {session.legalOpinionSummary}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">
                    Langkah Tindak Lanjut yang Direkomendasikan:
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
                    className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    Mengerti
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

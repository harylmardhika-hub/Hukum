import React from 'react';
import {
  FileText,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import {
  Lawyer,
  ConsultationSession,
  LegalDocument,
  ChatMessage,
} from '../types/legal';
import { LawyerAvatar } from './LawyerAvatar';

interface LawyerDashboardProps {
  currentLawyer: Lawyer;
  sessions: ConsultationSession[];
  documents: LegalDocument[];
  messages: ChatMessage[];
  onOpenSessionAsLawyer: (sessionId: string) => void;
}

export const LawyerDashboard: React.FC<LawyerDashboardProps> = ({
  currentLawyer,
  sessions,
  documents,
  messages,
  onOpenSessionAsLawyer,
}) => {
  const assignedSessions = sessions.filter(
    (s) => s.lawyerId === currentLawyer.id
  );
  const assignedSessionIds = new Set(assignedSessions.map((s) => s.id));
  const assignedDocuments = documents.filter((d) =>
    assignedSessionIds.has(d.sessionId)
  );

  const totalHighRiskClauses = assignedDocuments.reduce(
    (sum, doc) =>
      sum + doc.clauses.filter((c) => c.riskStatus === 'critical').length,
    0
  );

  const totalPendingDocs = assignedDocuments.filter(
    (d) => d.overallStatus !== 'Selesai Ditinjau'
  ).length;

  return (
    <div className="space-y-6">
      {/* Advocate Command Header (Locked to Authenticated Advocate Session) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <LawyerAvatar lawyer={currentLawyer} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-800 font-semibold">
                <span>Sesi Advokat Terautentikasi</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {currentLawyer.niaPeradi}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 font-display">
                {currentLawyer.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {currentLawyer.title} · Yurisdiksi {currentLawyer.jurisdiction}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold text-slate-900">
              Bidang Spesialisasi Utama: {currentLawyer.specialty}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Email Resmi: {currentLawyer.email}
            </div>
          </div>
        </div>

        {/* Key Operational Metrics (Tabular Numerals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Perkara Klien Anda</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {assignedSessions.length} Perkara
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Kontrak Dalam Telaah</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {totalPendingDocs} Dokumen
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Klausul Risiko Tinggi</div>
            <div className="text-xl sm:text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
              {totalHighRiskClauses} Pasal
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Target Respons Chat</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              &lt; {currentLawyer.responseTimeMinutes} Menit
            </div>
          </div>
        </div>
      </div>

      {/* Active Client Queue & Contract Redlining Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Antrean Konsultasi Klien & Peninjauan Pasal Kontrak Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar perkara yang ditugaskan khusus pada sesi {currentLawyer.name}
            </p>
          </div>
        </div>

        {assignedSessions.length === 0 ? (
          <div className="p-10 text-center">
            <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">
              Belum ada antrean perkara aktif untuk sesi Advokat ini
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Ketika Klien memulai sesi konsultasi baru dan memilih Anda sebagai Advokat pendamping, perkara tersebut akan langsung muncul secara real-time di layar ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {assignedSessions.map((session) => {
              const sessionDocs = documents.filter(
                (d) => d.sessionId === session.id
              );
              const sessionMessages = messages.filter(
                (m) => m.sessionId === session.id
              );
              const lastMessage = sessionMessages[sessionMessages.length - 1];
              const highRiskCount = sessionDocs.reduce(
                (acc, d) =>
                  acc +
                  d.clauses.filter((c) => c.riskStatus === 'critical').length,
                0
              );

              return (
                <div
                  key={session.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {session.caseNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{session.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-800">
                        {session.status}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      {session.title}
                    </h3>

                    <div className="text-xs text-slate-600">
                      Klien:{' '}
                      <strong className="text-slate-900">
                        {session.clientName}
                      </strong>
                      {session.clientCompany
                        ? ` (${session.clientCompany})`
                        : ''}
                    </div>

                    {lastMessage && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">
                          Pesan Terakhir ({lastMessage.senderName} ·{' '}
                          {lastMessage.timestamp}):{' '}
                        </span>
                        {lastMessage.content}
                      </div>
                    )}

                    {/* Attached Documents & Risk Breakdown */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono tabular-nums">
                          {sessionDocs.length} Dokumen Kontrak
                        </span>
                      </span>

                      {highRiskCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            {highRiskCount} Pasal Berisiko Tinggi
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Klausul Terkendali</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono tabular-nums">
                          {sessionMessages.length} Pesan Diskusi
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenSessionAsLawyer(session.id)}
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl sm:rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Buka Meja Sidang & Tinjau Kontrak</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

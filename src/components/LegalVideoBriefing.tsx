import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { Player } from '@remotion/player';
import { X, Film } from 'lucide-react';
import {
  ConsultationSession,
  Lawyer,
  LegalDocument,
} from '../types/legal';

export interface LegalBriefingVideoProps {
  caseNumber: string;
  caseTitle: string;
  category: string;
  status: string;
  clientName: string;
  clientCompany: string;
  lawyerName: string;
  lawyerNia: string;
  documentTitle: string;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
  topCriticalClauseTitle: string;
  legalOpinionSummary: string;
  recommendedNextSteps: string[];
}

export const LegalBriefingComposition: React.FC<LegalBriefingVideoProps> = ({
  caseNumber,
  caseTitle,
  category,
  status,
  clientName,
  clientCompany,
  lawyerName,
  lawyerNia,
  documentTitle,
  criticalCount,
  warningCount,
  safeCount,
  topCriticalClauseTitle,
  legalOpinionSummary,
  recommendedNextSteps,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 1 animations (0 - 90)
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const introOpacity = interpolate(frame, [0, 15, 76, 90], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scene 2 animations (90 - 180)
  const scene2Frame = Math.max(0, frame - 90);
  const scene2Opacity = interpolate(frame, [90, 104, 166, 180], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const metricSpring = spring({
    frame: scene2Frame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  // Scene 3 animations (180 - 270)
  const scene3Frame = Math.max(0, frame - 180);
  const scene3Opacity = interpolate(frame, [180, 194, 260, 270], [0, 1, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slideOffset = interpolate(scene3Frame, [0, 18], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progressPercent = Math.min(100, (frame / 270) * 100);

  return (
    <AbsoluteFill className="bg-[#FAF8F5] text-[#0F172A] font-sans overflow-hidden select-none p-10 flex flex-col justify-between">
      {/* Architectural Swiss Grid Frame (1px solid exposed hairlines, zero blur/glow slop) */}
      <div className="border border-slate-300 bg-white flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Top Editorial Masthead */}
        <div className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold tracking-tight font-display text-slate-900">
              Advoka<span className="text-amber-700">ID</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Ikhtisar Perkara &amp; Kontrak
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
            <span className="font-semibold text-slate-900">{caseNumber}</span>
            <span className="text-slate-300">|</span>
            <span>{category}</span>
          </div>
        </div>

        {/* SCENE 1: Identitas Perkara, Klien & Advokat (Frames 0 - 90) */}
        <Sequence from={0} durationInFrames={90}>
          <AbsoluteFill
            className="px-8 pt-16 pb-12 flex flex-col justify-between"
            style={{
              opacity: introOpacity,
              transform: `translateY(${(1 - introProgress) * 14}px)`,
            }}
          >
            <div className="space-y-3 max-w-3xl">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-800 font-semibold">
                01 / Pokok Perkara · Status: {status}
              </div>
              <h1 className="text-3xl font-bold font-display text-slate-900 leading-tight">
                {caseTitle}
              </h1>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-200 pt-5 gap-8">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Pihak Klien
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {clientName}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {clientCompany}
                </div>
              </div>

              <div className="border-l border-slate-200 pl-8">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-800">
                  Advokat Pendamping (PERADI)
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {lawyerName}
                </div>
                <div className="text-xs font-mono text-slate-600 mt-0.5 tabular-nums">
                  {lawyerNia}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* SCENE 2: Audit Klausul Kontrak (Frames 90 - 180) */}
        <Sequence from={90} durationInFrames={90}>
          <AbsoluteFill
            className="px-8 pt-16 pb-12 flex flex-col justify-between"
            style={{ opacity: scene2Opacity }}
          >
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-800 font-semibold">
                02 / Audit Risiko Klausul Kontrak
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900 mt-1 truncate">
                {documentTitle}
              </h2>
            </div>

            {/* 3-Column Swiss Hairline Metric Grid */}
            <div className="grid grid-cols-3 border-y border-slate-200 divide-x divide-slate-200">
              <div className="py-4 pr-6">
                <div className="text-xs font-semibold text-red-700">
                  Risiko Hukum Tinggi
                </div>
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {Math.round(criticalCount * metricSpring)} Pasal
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Wajib direvisi sebelum tanda tangan
                </div>
              </div>

              <div className="py-4 px-6">
                <div className="text-xs font-semibold text-amber-700">
                  Perlu Revisi
                </div>
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {Math.round(warningCount * metricSpring)} Pasal
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Perlu penyeimbangan klausul
                </div>
              </div>

              <div className="py-4 pl-6">
                <div className="text-xs font-semibold text-emerald-700">
                  Klausul Aman
                </div>
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {Math.round(safeCount * metricSpring)} Pasal
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sesuai KUHPerdata / UU terkait
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4 text-xs">
              <span className="font-mono uppercase text-slate-500 shrink-0">
                Prioritas Revisi:
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {topCriticalClauseTitle}
              </span>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* SCENE 3: Ringkasan Opini Hukum & Langkah Tindak Lanjut (Frames 180 - 270) */}
        <Sequence from={180} durationInFrames={90}>
          <AbsoluteFill
            className="px-8 pt-16 pb-12 flex flex-col justify-between"
            style={{
              opacity: scene3Opacity,
              transform: `translateY(${slideOffset}px)`,
            }}
          >
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-800 font-semibold">
                03 / Ringkasan Opini Hukum Advokat
              </div>
              <p className="text-sm text-slate-800 leading-relaxed line-clamp-3 border-l-2 border-amber-700 pl-4">
                {legalOpinionSummary}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Rekomendasi Tindak Lanjut:
              </div>
              <div className="space-y-1.5">
                {recommendedNextSteps.slice(0, 3).map((step, index) => {
                  const rowOpacity = interpolate(
                    scene3Frame,
                    [8 + index * 8, 18 + index * 8],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  );
                  return (
                    <div
                      key={index}
                      style={{ opacity: rowOpacity }}
                      className="flex items-baseline gap-3 text-xs text-slate-800"
                    >
                      <span className="font-mono font-bold text-amber-800 tabular-nums shrink-0">
                        0{index + 1}.
                      </span>
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* Bottom Architectural Timeline Bar */}
        <div className="border-t border-slate-200 bg-[#F8FAFC] px-8 py-2.5 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
          <span> AdvokaID · Tayangan Ringkasan Hukum</span>
          <div className="flex items-center gap-3">
            <div className="w-28 h-1 bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-amber-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{(frame / fps).toFixed(1)}s / 9.0s</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

interface LegalVideoBriefingModalProps {
  session: ConsultationSession;
  lawyer: Lawyer;
  documents: LegalDocument[];
  onClose: () => void;
}

export const LegalVideoBriefingModal: React.FC<LegalVideoBriefingModalProps> = ({
  session,
  lawyer,
  documents,
  onClose,
}) => {
  const primaryDoc = documents[0];
  const criticalClauses =
    primaryDoc?.clauses.filter((c) => c.riskStatus === 'critical') || [];
  const warningClauses =
    primaryDoc?.clauses.filter((c) => c.riskStatus === 'warning') || [];
  const safeClauses =
    primaryDoc?.clauses.filter((c) => c.riskStatus === 'safe') || [];

  const topCritical = criticalClauses[0]
    ? `${criticalClauses[0].clauseNumber} — ${criticalClauses[0].title}`
    : primaryDoc?.clauses[0]
      ? `${primaryDoc.clauses[0].clauseNumber} — ${primaryDoc.clauses[0].title}`
      : 'Seluruh pasal kontrak telah diperiksa oleh Advokat';

  const inputProps: LegalBriefingVideoProps = {
    caseNumber: session.caseNumber,
    caseTitle: session.title,
    category: session.category,
    status: session.status,
    clientName: session.clientName,
    clientCompany: session.clientCompany || 'Klien Perseorangan',
    lawyerName: lawyer.name,
    lawyerNia: lawyer.niaPeradi,
    documentTitle: primaryDoc?.title || 'Dokumen Kontrak Perkara',
    criticalCount: criticalClauses.length,
    warningCount: warningClauses.length,
    safeCount: safeClauses.length,
    topCriticalClauseTitle: topCritical,
    legalOpinionSummary: session.legalOpinionSummary,
    recommendedNextSteps: session.recommendedNextSteps,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Film className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Tayangan Ringkasan Perkara &amp; Kontrak (Remotion)
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Visualisasi otomatis dari data perkara {session.caseNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 bg-slate-100">
          <div className="rounded-lg overflow-hidden border border-slate-300 aspect-video w-full bg-[#FAF8F5]">
            <Player
              component={LegalBriefingComposition}
              inputProps={inputProps}
              durationInFrames={270}
              compositionWidth={960}
              compositionHeight={540}
              fps={30}
              controls
              autoPlay
              loop
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Dirender secara terprogram menggunakan <strong>Remotion</strong> sesuai status revisi pasal &amp; opini hukum perkara ini.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

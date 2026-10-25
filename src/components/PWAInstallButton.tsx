import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PUBLIC_SHARED_URL =
  'https://ais-pre-gyu62mx4on3e6ps3dasckf-731548929894.asia-northeast1.run.app';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareUrl = PUBLIC_SHARED_URL || window.location.origin;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowModal(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AdvokaID — Konsultasi Hukum & Kontrak',
          text: 'Akses ruang konsultasi hukum real-time dan tinjauan kontrak AdvokaID:',
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    handleCopyUrl();
  };

  const handleDownloadCapacitorConfig = () => {
    const config = {
      appId: 'id.advokaid.legal',
      appName: 'AdvokaID',
      webDir: 'dist',
      server: {
        url: shareUrl,
        cleartext: true,
      },
      android: {
        allowMixedContent: true,
        backgroundColor: '#0F172A',
      },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
      >
        <Share2 className="w-3.5 h-3.5 text-amber-700" />
        <span>Bagikan & Install APK</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-left">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bagikan Link & Install APK AdvokaID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              {/* Public Share Link Section */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="font-semibold text-slate-900">
                  Link Publik untuk Dibagikan ke Orang Lain:
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 min-h-[38px] text-[11px] font-mono bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan ke WhatsApp / Aplikasi Lain</span>
                </button>
              </div>

              {!isInstalled && isInstallable && (
                <button
                  type="button"
                  onClick={install}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Pasang Langsung ke Layar Utama HP</span>
                </button>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  {isIOS
                    ? 'Cara Pasang di iPhone / iPad (Safari):'
                    : 'Cara Pasang di HP Android (WebAPK):'}
                </div>
                {isIOS ? (
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Buka Link Publik di atas melalui Safari.</li>
                    <li>Ketuk ikon <strong>Share (Bagikan)</strong>.</li>
                    <li>Pilih <strong>Add to Home Screen</strong>.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Buka Link Publik di atas melalui Chrome di HP.</li>
                    <li>Ketuk titik tiga di pojok kanan atas Chrome.</li>
                    <li>Pilih <strong>Instal Aplikasi (Install App)</strong>.</li>
                  </ol>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Export File .APK Mandiri</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCapacitorConfig}
                  className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh capacitor.config.json</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

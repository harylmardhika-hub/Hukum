import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building2,
  Wallet,
  Copy,
  Check,
  ArrowRight,
  Lock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { Lawyer, AuthSession } from '../types/legal';
import { LawyerAvatar } from './LawyerAvatar';

interface PaymentSimulationModalProps {
  lawyer: Lawyer;
  authSession: AuthSession;
  onClose: () => void;
  onPaymentSuccess: (paymentInfo: {
    invoiceNumber: string;
    paymentMethodLabel: string;
    totalPaid: number;
    lawyer: Lawyer;
  }) => void;
}

type PaymentMethodType = 'qris' | 'va_bca' | 'va_mandiri' | 'ewallet';

export const PaymentSimulationModal: React.FC<PaymentSimulationModalProps> = ({
  lawyer,
  authSession,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>('qris');
  const [copiedVa, setCopiedVa] = useState(false);
  const [paymentStage, setPaymentStage] = useState<
    'checkout' | 'processing' | 'paid'
  >('checkout');

  const [invoiceNumber] = useState(
    () => `INV/2026/ADV-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [virtualAccountNumber] = useState(
    () => `88019 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
  );

  const isUnsikaStudent =
    authSession.email.toLowerCase().includes('unsika') ||
    authSession.subtitle.toLowerCase().includes('unsika');

  const baseFee = lawyer.consultationFee;
  const escrowFee = 15000;
  const studentDiscount = isUnsikaStudent ? 75000 : 0;
  const totalAmount = Math.max(0, baseFee + escrowFee - studentDiscount);

  const formatRupiah = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  const methodLabels: Record<PaymentMethodType, string> = {
    qris: 'QRIS Instan (Semua Bank & E-Wallet)',
    va_bca: 'BCA Virtual Account',
    va_mandiri: 'Mandiri Virtual Account',
    ewallet: 'GoPay / OVO / Dana Korporasi',
  };

  const handleCopyVa = () => {
    try {
      navigator.clipboard.writeText(virtualAccountNumber.replace(/\s+/g, ''));
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 1800);
    } catch {
      setCopiedVa(true);
    }
  };

  const handleConfirmPayment = () => {
    setPaymentStage('processing');
    setTimeout(() => {
      setPaymentStage('paid');
      setTimeout(() => {
        onPaymentSuccess({
          invoiceNumber,
          paymentMethodLabel: methodLabels[selectedMethod],
          totalPaid: totalAmount,
          lawyer,
        });
      }, 1100);
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Simulasi Pembayaran Sesi Konsultasi"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-auto">
        {/* Top Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>CHECKOUT ESCROW RESMI · {invoiceNumber}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Pembayaran Sesi Konsultasi & Rombak Kontrak
            </h3>
          </div>
          {paymentStage === 'checkout' && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {paymentStage === 'processing' ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="w-7 h-7 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Memverifikasi Pembayaran Anda...
              </h4>
              <p className="text-xs text-slate-500">
                Menghubungkan gateway pembayaran & menyiapkan ruang konsultasi privat bersama {lawyer.name}
              </p>
            </div>
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-md font-mono text-xs text-slate-700 tabular-nums">
              {invoiceNumber} · {formatRupiah(totalAmount)}
            </div>
          </div>
        ) : paymentStage === 'paid' ? (
          <div className="p-8 sm:p-10 text-center space-y-4 bg-emerald-50/40">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                PEMBAYARAN LUNAS & TERVERIFIKASI
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {formatRupiah(totalAmount)} Berhasil Dibayarkan
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Dana telah dijamin di rekening Escrow AdvokaID. Anda langsung diarahkan ke ruang chat bersama <strong>{lawyer.name}</strong>.
              </p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-3.5 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Kuitansi:</span>
                <span className="font-semibold text-slate-900">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-semibold text-slate-900">
                  {methodLabels[selectedMethod]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-700">LUNAS (AKTIF)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Lawyer & Client Summary Card */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <LawyerAvatar lawyer={lawyer} size="md" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-amber-800">
                  {lawyer.specialty} · {lawyer.niaPeradi}
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {lawyer.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Klien: {authSession.name} ({authSession.email})
                </div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Metode Pembayaran (Simulasi Instan)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('qris')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    selectedMethod === 'qris'
                      ? 'border-amber-600 bg-amber-50/60 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">QRIS Instan</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      GoPay, OVO, m-BCA, Livin
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('va_bca')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    selectedMethod === 'va_bca'
                      ? 'border-amber-600 bg-amber-50/60 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">BCA Virtual Account</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Verifikasi Otomatis
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('va_mandiri')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    selectedMethod === 'va_mandiri'
                      ? 'border-amber-600 bg-amber-50/60 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">Mandiri / BNI VA</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Transfer Antar Bank
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('ewallet')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                    selectedMethod === 'ewallet'
                      ? 'border-amber-600 bg-amber-50/60 text-slate-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">Saldo Korporasi</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Retainer Perusahaan
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Payment Instruction Preview */}
            {selectedMethod === 'qris' ? (
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                {/* Simulated crisp SVG QR Code */}
                <div className="w-20 h-20 bg-white p-1.5 border border-slate-300 rounded-lg shrink-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 64 64"
                    className="w-full h-full text-slate-900"
                    fill="currentColor"
                  >
                    <rect x="4" y="4" width="18" height="18" rx="2" />
                    <rect x="8" y="8" width="10" height="10" fill="white" />
                    <rect x="10" y="10" width="6" height="6" />
                    <rect x="42" y="4" width="18" height="18" rx="2" />
                    <rect x="46" y="8" width="10" height="10" fill="white" />
                    <rect x="48" y="10" width="6" height="6" />
                    <rect x="4" y="42" width="18" height="18" rx="2" />
                    <rect x="8" y="46" width="10" height="10" fill="white" />
                    <rect x="10" y="48" width="6" height="6" />
                    <rect x="26" y="6" width="4" height="4" />
                    <rect x="32" y="10" width="6" height="4" />
                    <rect x="26" y="18" width="4" height="8" />
                    <rect x="6" y="26" width="8" height="4" />
                    <rect x="18" y="28" width="6" height="6" />
                    <rect x="28" y="28" width="8" height="8" rx="1" />
                    <rect x="40" y="26" width="4" height="8" />
                    <rect x="48" y="28" width="10" height="4" />
                    <rect x="26" y="40" width="6" height="4" />
                    <rect x="36" y="42" width="8" height="6" />
                    <rect x="48" y="40" width="6" height="8" />
                    <rect x="28" y="50" width="6" height="8" />
                    <rect x="40" y="52" width="18" height="6" />
                  </svg>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-900">
                    Kode QRIS Nasional (NMID: ID1026048192)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Untuk keperluan simulasi, Anda tidak perlu memindai dengan ponsel. Cukup klik tombol <strong>Konfirmasi & Bayar Sekarang</strong> di bawah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-[11px] text-slate-500">
                    Nomor Virtual Account ({methodLabels[selectedMethod]})
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                    {virtualAccountNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVa}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  {copiedVa ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin VA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>
                  Biaya Konsultasi & Rombak Kontrak Sepuasnya (1 Perkara)
                </span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatRupiah(baseFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Biaya Proteksi Rekening Bersama (Escrow PERADI)</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatRupiah(escrowFee)}
                </span>
              </div>
              {isUnsikaStudent && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Potongan Khusus Sivitas Akademika UNSIKA</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    - {formatRupiah(studentDiscount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Pembayaran</span>
                <span className="text-base font-mono tabular-nums text-amber-800">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl sm:rounded-lg hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-xl sm:rounded-lg hover:bg-amber-300 transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>
                  Konfirmasi & Bayar Sekarang ({formatRupiah(totalAmount)})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

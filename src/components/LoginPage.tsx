import React, { useState } from 'react';
import {
  Scale,
  Users,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Lock,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { AuthSession, ClientAccount, Lawyer } from '../types/legal';
import { LawyerAvatar } from './LawyerAvatar';
import { AdvokaIdLogo } from './AdvokaIdLogo';

interface LoginPageProps {
  clients: ClientAccount[];
  lawyers: Lawyer[];
  onAuthenticated: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  clients,
  lawyers,
  onAuthenticated,
}) => {
  const [portalRole, setPortalRole] = useState<'client' | 'lawyer'>('client');
  const [clientAuthMode, setClientAuthMode] = useState<'login' | 'register'>('login');

  const [identifierInput, setIdentifierInput] = useState<string>(
    clients[0]?.email || ''
  );
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regCompany, setRegCompany] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Client-side fallback authentication so the app also works on static hosts like GitHub Pages (github.io)
  const fallbackLocalLogin = (
    role: 'client' | 'lawyer',
    opts: { userId?: string; identifier?: string }
  ): AuthSession | null => {
    const q = (opts.identifier || '').toLowerCase().trim();
    if (role === 'client') {
      const client = opts.userId
        ? clients.find((c) => c.id === opts.userId)
        : clients.find(
            (c) =>
              c.email.toLowerCase() === q || c.name.toLowerCase().includes(q)
          );
      if (!client) return null;
      return {
        token: `tok-cli-${client.id}-${Date.now()}`,
        role: 'client',
        userId: client.id,
        name: client.name,
        email: client.email,
        subtitle: client.company || 'Klien Perseorangan',
      };
    } else {
      const lawyer = opts.userId
        ? lawyers.find((l) => l.id === opts.userId)
        : lawyers.find(
            (l) =>
              l.email.toLowerCase() === q ||
              l.niaPeradi.toLowerCase().includes(q) ||
              l.name.toLowerCase().includes(q)
          );
      if (!lawyer) return null;
      return {
        token: `tok-lw-${lawyer.id}-${Date.now()}`,
        role: 'lawyer',
        userId: lawyer.id,
        name: lawyer.name,
        email: lawyer.email,
        subtitle: `${lawyer.niaPeradi} · ${lawyer.specialty}`,
      };
    }
  };

  const handlePortalSwitch = (role: 'client' | 'lawyer') => {
    setPortalRole(role);
    setErrorMsg(null);
    if (role === 'client') {
      setIdentifierInput(clients[0]?.email || '');
    } else {
      setIdentifierInput(lawyers[0]?.niaPeradi || '');
    }
  };

  const handleQuickLogin = async (role: 'client' | 'lawyer', userId: string) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        onAuthenticated(data as AuthSession);
        return;
      }
    } catch {
      // Static hosting fallback (GitHub Pages)
    } finally {
      setIsLoading(false);
    }

    const fallback = fallbackLocalLogin(role, { userId });
    if (fallback) {
      onAuthenticated(fallback);
    } else {
      setErrorMsg('Akun tidak ditemukan.');
    }
  };

  const handleManualLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: portalRole,
          identifier: identifierInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAuthenticated(data as AuthSession);
        return;
      }
    } catch {
      // Static hosting fallback (GitHub Pages)
    } finally {
      setIsLoading(false);
    }

    const fallback = fallbackLocalLogin(portalRole, {
      identifier: identifierInput,
    });
    if (fallback) {
      onAuthenticated(fallback);
    } else {
      setErrorMsg('Kredensial tidak ditemukan.');
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          company: regCompany,
          phone: regPhone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAuthenticated(data as AuthSession);
        return;
      }
    } catch {
      // Static hosting fallback (GitHub Pages)
    } finally {
      setIsLoading(false);
    }

    if (regName.trim() && regEmail.trim()) {
      onAuthenticated({
        token: `tok-cli-${Date.now()}`,
        role: 'client',
        userId: `cli-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        subtitle: regCompany.trim() || 'Klien Perseorangan',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200">
        <AdvokaIdLogo size="md" showTagline />
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-600">
          <span>Konsultasi Hukum &amp; Kontrak</span>
          <span aria-hidden="true">·</span>
          <span>UU Advokat No. 18/2003</span>
        </div>
        <div className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap shrink-0">
          PERADI
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
          <section className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-slate-800">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
                <AdvokaIdLogo size="sm" theme="dark" />
                <span className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider">
                  Terdaftar PERADI
                </span>
              </div>
              <div className="text-xs font-semibold text-amber-400">
                Layanan Bantuan Hukum Digital
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
                Konsultasi Hukum &amp; Tinjauan Kontrak Real-Time.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hubungi advokat berlisensi untuk pendampingan perkara Perdata, Pidana, Bisnis, Keluarga, dan Ketenagakerjaan.
              </p>

              <div className="pt-4 space-y-2.5 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Advokat Terverifikasi PERADI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Tinjauan & Revisi Pasal Kontrak</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Kerahasiaan Klien Dijamin</span>
              </span>
              <span className="font-mono tabular-nums">Pasal 19</span>
            </div>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('client')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      portalRole === 'client'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Masuk Klien</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('lawyer')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      portalRole === 'lawyer'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Masuk Advokat</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              {portalRole === 'client' ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                      {clientAuthMode === 'login' ? 'Akun Klien' : 'Daftar Klien Baru'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setClientAuthMode(
                          clientAuthMode === 'login' ? 'register' : 'login'
                        );
                        setErrorMsg(null);
                      }}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 whitespace-nowrap shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>
                        {clientAuthMode === 'login' ? 'Daftar Baru' : 'Login'}
                      </span>
                    </button>
                  </div>

                  {clientAuthMode === 'login' ? (
                    <>
                      <form onSubmit={handleManualLoginSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Email Klien
                          </label>
                          <input
                            type="text"
                            required
                            value={identifierInput}
                            onChange={(e) => setIdentifierInput(e.target.value)}
                            placeholder="Masukkan email..."
                            className="w-full min-h-[44px] text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Kata Sandi
                          </label>
                          <input
                            type="password"
                            required
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full min-h-[44px] text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Masuk</span>
                        </button>
                      </form>

                      <div className="pt-4 border-t border-slate-200">
                        <div className="text-xs font-semibold text-slate-600 mb-2">
                          Akun Klien:
                        </div>
                        <div className="space-y-2">
                          {clients.map((cli) => (
                            <button
                              key={cli.id}
                              type="button"
                              onClick={() => handleQuickLogin('client', cli.id)}
                              className="w-full min-h-[50px] text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {cli.name}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {cli.company}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-amber-800 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleRegisterClient} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Nama Lengkap
                          </label>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full min-h-[44px] text-xs border border-slate-300 rounded-xl px-3.5 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full min-h-[44px] text-xs border border-slate-300 rounded-xl px-3.5 py-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            Perusahaan (Opsional)
                          </label>
                          <input
                            type="text"
                            value={regCompany}
                            onChange={(e) => setRegCompany(e.target.value)}
                            className="w-full min-h-[44px] text-xs border border-slate-300 rounded-xl px-3.5 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-1">
                            No. Telepon
                          </label>
                          <input
                            type="text"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full min-h-[44px] text-xs border border-slate-300 rounded-xl px-3.5 py-2"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Daftar & Masuk</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                      Portal Advokat (PERADI)
                    </h2>
                  </div>

                  <form onSubmit={handleManualLoginSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        NIA PERADI / Email
                      </label>
                      <input
                        type="text"
                        required
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        className="w-full min-h-[44px] text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Kata Sandi
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full min-h-[44px] text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Masuk Dashboard</span>
                    </button>
                  </form>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-600 mb-2">
                      Akun Advokat:
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {lawyers.map((lw) => (
                        <button
                          key={lw.id}
                          type="button"
                          onClick={() => handleQuickLogin('lawyer', lw.id)}
                          className="w-full min-h-[54px] text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <LawyerAvatar lawyer={lw} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {lw.name}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {lw.specialty} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {lw.niaPeradi}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-amber-800 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
        <AdvokaIdLogo size="sm" />
        <span>— Platform Konsultasi Hukum &amp; Kontrak Indonesia.</span>
      </footer>
    </div>
  );
};

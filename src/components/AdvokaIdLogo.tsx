import React from 'react';

interface AdvokaIdLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
}

export const AdvokaIdLogo: React.FC<AdvokaIdLogoProps> = ({
  size = 'md',
  theme = 'light',
  showTagline = false,
}) => {
  const iconDimensions =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-10 h-10 sm:w-11 sm:h-11'
      : 'w-8 h-8 sm:w-9 sm:h-9';

  const textClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';

  const primaryTextColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const accentTextColor = theme === 'dark' ? 'text-amber-400' : 'text-amber-700';
  const taglineColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0 group">
      {/* Bespoke Legal Crest SVG Emblem: Shield + Classical Pillar + Scales of Justice */}
      <div
        className={`${iconDimensions} relative flex items-center justify-center rounded-xl bg-slate-900 shadow-xs ring-1 ring-amber-500/40 group-hover:ring-amber-500/70 transition-all shrink-0 overflow-hidden`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="advokaBgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="advokaGoldGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width="64" height="64" rx="14" fill="url(#advokaBgGrad)" />

          {/* Outer Shield Contour */}
          <path
            d="M32 7L51 14.5V30.5C51 43.2 42.9 52.8 32 57C21.1 52.8 13 43.2 13 30.5V14.5L32 7Z"
            fill="#0F172A"
            stroke="url(#advokaGoldGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inner Shield Hairline */}
          <path
            d="M32 10.5L47.5 16.8V30.2C47.5 40.8 40.8 49.1 32 52.9C23.2 49.1 16.5 40.8 16.5 30.2V16.8L32 10.5Z"
            stroke="#F59E0B"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Central Pillar & Pedestal ("A" / Pillar motif) */}
          <path
            d="M32 16V44"
            stroke="url(#advokaGoldGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M24 44.5H40"
            stroke="url(#advokaGoldGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M27 48H37"
            stroke="#F8FAFC"
            strokeOpacity="0.7"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Balance Beam */}
          <path
            d="M19 23.5L32 21L45 23.5"
            stroke="#F8FAFC"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Left Scale Pan */}
          <path
            d="M21 23.5L17.5 32.5H24.5L21 23.5Z"
            fill="url(#advokaGoldGrad)"
            stroke="#F8FAFC"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M16.8 32.8C16.8 34.8 18.7 36.2 21 36.2C23.3 36.2 25.2 34.8 25.2 32.8H16.8Z"
            fill="url(#advokaGoldGrad)"
          />

          {/* Right Scale Pan */}
          <path
            d="M43 23.5L39.5 32.5H46.5L43 23.5Z"
            fill="url(#advokaGoldGrad)"
            stroke="#F8FAFC"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M38.8 32.8C38.8 34.8 40.7 36.2 43 36.2C45.3 36.2 47.2 34.8 47.2 32.8H38.8Z"
            fill="url(#advokaGoldGrad)"
          />

          {/* Crown Jewel / Finial */}
          <circle cx="32" cy="16" r="2.6" fill="#FBBF24" stroke="#0F172A" strokeWidth="1" />
        </svg>
      </div>

      {/* Wordmark + Optional Subtitle */}
      <div className="flex flex-col leading-none">
        <div className={`${textClass} font-bold tracking-tight font-display flex items-baseline`}>
          <span className={primaryTextColor}>Advoka</span>
          <span className={`${accentTextColor} font-extrabold`}>ID</span>
          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 self-center" />
        </div>
        {showTagline && (
          <span
            className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${taglineColor}`}
          >
            Konsultasi Hukum &amp; Kontrak
          </span>
        )}
      </div>
    </div>
  );
};

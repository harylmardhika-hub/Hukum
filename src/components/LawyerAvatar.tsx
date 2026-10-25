import React from 'react';
import { Lawyer } from '../types/legal';

interface LawyerAvatarProps {
  lawyer: Lawyer;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LawyerAvatar: React.FC<LawyerAvatarProps> = ({ lawyer, size = 'md' }) => {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  const { suitColor, accentColor, gender, glasses } = lawyer.avatarStyle;

  return (
    <div
      className={`relative ${dimensions} rounded-lg overflow-hidden bg-slate-900 border border-slate-300 shrink-0 select-none flex items-center justify-center`}
      title={lawyer.name}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        role="img"
        aria-label={`Potret Advokat ${lawyer.name}`}
      >
        <defs>
          <linearGradient id={`bg-${lawyer.id}`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* Studio Backdrop */}
        <rect width="120" height="120" fill={`url(#bg-${lawyer.id})`} />
        <circle cx="60" cy="48" r="46" fill="#334155" fillOpacity="0.28" />

        {/* Shoulders & Formal Attire */}
        <path
          d="M16 120C16 94 34 80 60 80C86 80 104 94 104 120H16Z"
          fill={suitColor}
        />

        {/* Crisp White Shirt & Legal Tie / Collar */}
        <path d="M46 80L60 108L74 80H46Z" fill="#F8FAFC" />
        {gender === 'male' ? (
          <path d="M57 84H63L65 114L60 120L55 114L57 84Z" fill={accentColor} />
        ) : (
          <path d="M52 82L60 95L68 82" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Suit Lapels */}
        <path d="M45 80L36 105L56 112L46 80Z" fill="#334155" fillOpacity="0.45" />
        <path d="M75 80L84 105L64 112L74 80Z" fill="#334155" fillOpacity="0.45" />

        {/* Neck */}
        <rect x="52" y="66" width="16" height="18" rx="6" fill="#D6A884" />

        {/* Hair Back (Female) */}
        {gender === 'female' && (
          <path
            d="M34 48C34 30 45 20 60 20C75 20 86 30 86 48C86 64 82 76 76 78H44C38 76 34 64 34 48Z"
            fill="#18181B"
          />
        )}

        {/* Head Silhouette */}
        <rect x="39" y="26" width="42" height="48" rx="21" fill="#E4B996" />

        {/* Hair Top */}
        {gender === 'male' ? (
          <path
            d="M39 42C39 28 47 21 60 21C73 21 81 28 81 42C77 35 70 32 60 32C50 32 43 35 39 42Z"
            fill="#1E293B"
          />
        ) : (
          <path
            d="M38 45C38 28 48 21 60 21C72 21 82 28 82 45C76 34 66 31 54 33C46 34 41 39 38 45Z"
            fill="#18181B"
          />
        )}

        {/* Facial Features */}
        <circle cx="51" cy="48" r="2.2" fill="#0F172A" />
        <circle cx="69" cy="48" r="2.2" fill="#0F172A" />
        <path d="M46 43C48 41.5 52 41.5 54 42.5" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M66 42.5C68 41.5 72 41.5 74 43" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />

        {/* Optional Glasses */}
        {glasses && (
          <g stroke="#B45309" strokeWidth="1.6">
            <rect x="44" y="43" width="13" height="9" rx="2.5" fill="#F8FAFC" fillOpacity="0.12" />
            <rect x="63" y="43" width="13" height="9" rx="2.5" fill="#F8FAFC" fillOpacity="0.12" />
            <line x1="57" y1="47" x2="63" y2="47" />
          </g>
        )}

        {/* Nose & Confident Smile */}
        <path d="M60 49V55L58 56.5" stroke="#B68663" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M54 62C57 64.5 63 64.5 66 62" stroke="#8C583A" strokeWidth="1.8" strokeLinecap="round" />

        {/* Subtle Legal Lapel Pin */}
        <circle cx="74" cy="96" r="2.5" fill={accentColor} />
      </svg>
    </div>
  );
};

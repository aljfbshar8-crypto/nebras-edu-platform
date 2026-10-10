import React from 'react';

interface CompanyBrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  darkMode?: boolean;
}

export const CompanyBrandLogo: React.FC<CompanyBrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  darkMode = true,
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Exact Hexagonal Tech Logo from the Image */}
      <div className={`relative ${iconSize} shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow(0 2px 8px rgba(249,115,22,0.35))">
          {/* Outer Hexagon in Orange */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            stroke="#f97316"
            strokeWidth="7"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Outer Corner Nodes */}
          <circle cx="50" cy="4" r="4.5" fill="#ea580c" />
          <circle cx="92" cy="74" r="4" fill="#ea580c" />
          <circle cx="8" cy="74" r="4" fill="#ea580c" />

          {/* Inner Hexagon in Dark Navy / Carbon */}
          <polygon
            points="50,22 80,38 80,70 50,86 20,70 20,38"
            fill="#0f172a"
          />

          {/* Central Connecting Node & Angled Connector Legs */}
          <line x1="50" y1="52" x2="28" y2="72" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="52" x2="72" y2="72" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="11" fill="#f97316" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          <span
            className={`font-black tracking-tight leading-tight ${
              size === 'sm'
                ? 'text-xs'
                : size === 'lg'
                ? 'text-lg sm:text-xl'
                : 'text-sm sm:text-base'
            } ${darkMode ? 'text-white' : 'text-slate-900'}`}
          >
            شركة النظم الذكية
          </span>
          <span
            className={`font-bold tracking-normal leading-tight text-[#f97316] ${
              size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs sm:text-sm' : 'text-xs'
            }`}
          >
            للحلول البرمجية المتطورة
          </span>
        </div>
      )}
    </div>
  );
};

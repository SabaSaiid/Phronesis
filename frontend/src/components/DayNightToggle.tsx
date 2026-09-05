import React from 'react';

export interface DayNightToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const DayNightToggle: React.FC<DayNightToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  className = '',
  id,
  ariaLabel,
}) => {
  // Dimensions mapping
  const dimensions = {
    sm: { width: 54, height: 26 },
    md: { width: 74, height: 35 },
    lg: { width: 96, height: 45 },
  }[size];

  const handleToggle = () => {
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const label = ariaLabel || (checked ? 'Switch to light mode' : 'Switch to dark mode');

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
      className={`
        relative inline-flex items-center justify-center p-0 rounded-full cursor-pointer select-none
        transition-all duration-300 transform-gpu active:scale-95 shrink-0
        focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-verdigris)] focus-visible:ring-offset-2
        ${checked ? 'day-night-toggle-dark' : 'day-night-toggle-light'}
        ${className}
      `}
    >
      {/* 3D Beveled Outer Groove Track */}
      <div className="absolute inset-0 rounded-full overflow-hidden shadow-inner pointer-events-none day-night-bevel-groove">
        <svg
          viewBox="0 0 180 84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full block"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* ══ Day Sky Gradient ══ */}
            <linearGradient id="daySkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4392e2" />
              <stop offset="50%" stopColor="#5aa5ea" />
              <stop offset="100%" stopColor="#8cc1f8" />
            </linearGradient>

            {/* ══ Night Sky Gradient ══ */}
            <linearGradient id="nightSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#101726" />
              <stop offset="55%" stopColor="#182234" />
              <stop offset="100%" stopColor="#253346" />
            </linearGradient>

            {/* ══ Sun Gradients & Filters ══ */}
            <radialGradient id="sunGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="45%" stopColor="#F5B318" />
              <stop offset="100%" stopColor="#E0880B" />
            </radialGradient>

            <radialGradient id="sunHighlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#FFEAA7" stopOpacity="0" />
            </radialGradient>

            {/* ══ Moon Gradients ══ */}
            <radialGradient id="moonGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#DDE3EA" />
              <stop offset="100%" stopColor="#B4BFCB" />
            </radialGradient>

            <radialGradient id="moonHighlight" cx="30%" cy="30%" r="45%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#E2E8F0" stopOpacity="0" />
            </radialGradient>

            {/* ══ Moon Crater Gradients (Realistic Bevel Inset) ══ */}
            <linearGradient id="craterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8795A5" />
              <stop offset="40%" stopColor="#96A4B4" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <linearGradient id="craterShadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748B" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
            </linearGradient>

            {/* ══ Knob Drop Shadow Filter ══ */}
            <filter id="knobDropShadow" x="-30%" y="-30%" width="170%" height="170%">
              <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.32" />
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
            </filter>

            {/* ══ Inset Track Bevel Inner Shadow ══ */}
            <filter id="trackInnerShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feOffset dx="0" dy="3" />
              <feGaussianBlur stdDeviation="3" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="#000000" floodOpacity="0.45" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>

            {/* Clip path for rounded pill */}
            <clipPath id="pillClip">
              <rect x="0" y="0" width="180" height="84" rx="42" ry="42" />
            </clipPath>
          </defs>

          {/* Group clipped to pill shape */}
          <g clipPath="url(#pillClip)">
            {/* ── Sky Background Layer: Day ── */}
            <rect
              x="0"
              y="0"
              width="180"
              height="84"
              fill="url(#daySkyGrad)"
              className="transition-opacity duration-500 ease-in-out"
              style={{ opacity: checked ? 0 : 1 }}
            />

            {/* ── Sky Background Layer: Night ── */}
            <rect
              x="0"
              y="0"
              width="180"
              height="84"
              fill="url(#nightSkyGrad)"
              className="transition-opacity duration-500 ease-in-out"
              style={{ opacity: checked ? 1 : 0 }}
            />

            {/* ── Night Sky Stars & Sparkles ── */}
            <g
              className="transition-all duration-500 ease-in-out"
              style={{
                opacity: checked ? 1 : 0,
                transform: checked ? 'translateY(0)' : 'translateY(-6px)',
              }}
            >
              {/* Star 1 - Twinkle small */}
              <circle cx="28" cy="22" r="1.5" fill="#FFFFFF" opacity="0.85" />
              {/* Star 2 - Bright pinpoint */}
              <circle cx="56" cy="18" r="1.8" fill="#FFFFFF" opacity="0.9" />
              {/* Star 3 - Subtle glimmer */}
              <circle cx="78" cy="30" r="1.2" fill="#E2E8F0" opacity="0.65" />
              {/* Star 4 - Sparkle diamond */}
              <path
                d="M 40 36 Q 40 33 42 33 Q 40 33 40 30 Q 40 33 38 33 Q 40 33 40 36 Z"
                fill="#FFFFFF"
                opacity="0.8"
              />
              {/* Star 5 */}
              <circle cx="94" cy="19" r="1.4" fill="#FFFFFF" opacity="0.7" />
              {/* Star 6 */}
              <circle cx="68" cy="46" r="1.1" fill="#CBD5E1" opacity="0.5" />
              {/* Star 7 */}
              <circle cx="24" cy="52" r="1.3" fill="#FFFFFF" opacity="0.75" />
            </g>

            {/* ── Day Clouds (Back Layer) ── */}
            <g
              className="transition-all duration-500 ease-in-out"
              style={{
                opacity: checked ? 0 : 0.55,
                transform: checked ? 'translateX(18px)' : 'translateX(0)',
              }}
            >
              <ellipse cx="118" cy="58" rx="26" ry="18" fill="#D7E8FB" />
              <ellipse cx="144" cy="50" rx="22" ry="16" fill="#D7E8FB" />
              <ellipse cx="168" cy="44" rx="20" ry="16" fill="#D7E8FB" />
            </g>

            {/* ── Day Clouds (Mid/Fore Layer) ── */}
            <g
              className="transition-all duration-500 ease-in-out"
              style={{
                opacity: checked ? 0 : 1,
                transform: checked ? 'translateX(12px) translateY(4px)' : 'translateX(0) translateY(0)',
              }}
            >
              {/* Puffy clouds framing the right & bottom edge (Matching Frame 1 in Reference) */}
              <path
                d="
                  M 74 84
                  C 82 72, 98 70, 106 75
                  C 114 62, 134 60, 142 68
                  C 150 54, 172 54, 180 64
                  L 180 84
                  Z
                "
                fill="#FFFFFF"
                fillOpacity="0.94"
              />
              {/* Distinct Billowing Cloud Arcs */}
              <ellipse cx="88" cy="80" rx="18" ry="12" fill="#FFFFFF" fillOpacity="0.96" />
              <ellipse cx="116" cy="74" rx="22" ry="15" fill="#FFFFFF" />
              <ellipse cx="146" cy="65" rx="25" ry="18" fill="#FFFFFF" />
              <ellipse cx="172" cy="58" rx="20" ry="16" fill="#FFFFFF" />
            </g>

            {/* ── Night Clouds (Subtle Nocturnal Slate Clouds - Frame 2) ── */}
            <g
              className="transition-all duration-500 ease-in-out"
              style={{
                opacity: checked ? 0.9 : 0,
                transform: checked ? 'translateX(0) translateY(0)' : 'translateX(-16px) translateY(8px)',
              }}
            >
              {/* Deep midnight slate cloud billows on bottom-left / middle */}
              <ellipse cx="38" cy="82" rx="26" ry="16" fill="#1C273A" />
              <ellipse cx="64" cy="76" rx="22" ry="14" fill="#24334A" />
              <ellipse cx="90" cy="72" rx="24" ry="15" fill="#2A3C56" />
              <ellipse cx="120" cy="78" rx="26" ry="14" fill="#202E44" />
              <ellipse cx="152" cy="82" rx="24" ry="14" fill="#182335" />

              {/* Edge highlight along top rim of night clouds */}
              <path
                d="
                  M 12 84
                  C 24 74, 46 72, 58 76
                  C 70 66, 96 66, 108 72
                  C 120 68, 142 70, 158 78
                  L 180 84
                  Z
                "
                fill="#364964"
                fillOpacity="0.3"
              />
            </g>

            {/* ── Inset Vignette & Track Depth Shadow Overlay ── */}
            <rect
              x="0"
              y="0"
              width="180"
              height="84"
              rx="42"
              ry="42"
              fill="none"
              stroke="rgba(0, 0, 0, 0.22)"
              strokeWidth="3"
            />
          </g>

          {/* ═════════════════════════════════════════════════════════════════
              SLIDING KNOB (Sun / Moon)
              Translates horizontally: 
              - Day (checked=false): X=42 (sun on left)
              - Night (checked=true): X=138 (moon on right)
              Translation delta = 96px
             ═════════════════════════════════════════════════════════════════ */}
          <g
            className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            style={{
              transform: checked ? 'translateX(96px)' : 'translateX(0px)',
            }}
          >
            {/* Knob Group centered at (42, 42) */}
            <g transform="translate(42, 42)" filter="url(#knobDropShadow)">
              {/* ── Sun Sphere (Day) ── */}
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="url(#sunGrad)"
                className="transition-opacity duration-400 ease-in-out"
                style={{ opacity: checked ? 0 : 1 }}
              />
              {/* Sun 3D Top-Left Highlight */}
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="url(#sunHighlight)"
                className="transition-opacity duration-400 ease-in-out"
                style={{ opacity: checked ? 0 : 1 }}
              />

              {/* ── Moon Sphere (Night) ── */}
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="url(#moonGrad)"
                className="transition-opacity duration-400 ease-in-out"
                style={{ opacity: checked ? 1 : 0 }}
              />
              {/* Moon 3D Top-Left Highlight */}
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="url(#moonHighlight)"
                className="transition-opacity duration-400 ease-in-out"
                style={{ opacity: checked ? 1 : 0 }}
              />

              {/* ── Moon Craters (Authentic 3 Craters from Reference Frame 2) ── */}
              <g
                className="transition-all duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
                style={{
                  opacity: checked ? 1 : 0,
                  transform: checked ? 'rotate(0deg) scale(1)' : 'rotate(-45deg) scale(0.3)',
                  transformOrigin: '0 0',
                }}
              >
                {/* Crater 1 (Large - bottom-left) */}
                <g transform="translate(-8, 7)">
                  <circle cx="0" cy="0" r="7" fill="url(#craterGrad)" />
                  <circle cx="0" cy="0" r="7" fill="url(#craterShadow)" />
                  {/* Subtle rim highlight on crater's bottom-right edge */}
                  <circle cx="0.5" cy="0.5" r="6.6" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.45" />
                </g>

                {/* Crater 2 (Medium - top-right) */}
                <g transform="translate(8, -8)">
                  <circle cx="0" cy="0" r="5" fill="url(#craterGrad)" />
                  <circle cx="0" cy="0" r="5" fill="url(#craterShadow)" />
                  <circle cx="0.4" cy="0.4" r="4.6" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.45" />
                </g>

                {/* Crater 3 (Small - bottom-right) */}
                <g transform="translate(12, 7)">
                  <circle cx="0" cy="0" r="3.5" fill="url(#craterGrad)" />
                  <circle cx="0" cy="0" r="3.5" fill="url(#craterShadow)" />
                  <circle cx="0.3" cy="0.3" r="3.2" fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.4" />
                </g>
              </g>

              {/* Subtle 3D Edge Bevel Ring on the Knob Sphere */}
              <circle
                cx="0"
                cy="0"
                r="27.6"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1.2"
              />
            </g>
          </g>
        </svg>
      </div>
    </button>
  );
};

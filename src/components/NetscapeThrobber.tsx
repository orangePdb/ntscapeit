import React from 'react';

interface NetscapeThrobberProps {
  loading: boolean;
  onClick: () => void;
}

export const NetscapeThrobber: React.FC<NetscapeThrobberProps> = ({ loading, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Go to Netscapeit Netcenter (Home)"
      aria-label="Netscapeit Home Throbber"
      className="relative w-[38px] h-[38px] shrink-0 overflow-hidden bg-[#001429] bevel-out flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {/* Subtle 1999 horizon glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: loading
            ? 'radial-gradient(circle at 50% 75%, #1d4ed8 0%, #091e42 55%, #020817 100%)'
            : 'linear-gradient(180deg, #071936 0%, #0d3b66 75%, #1b5e7a 100%)',
        }}
      />

      {/* Animated star shower when loading */}
      {loading && (
        <svg
          className="absolute inset-0 w-full h-full animate-throbber-stars pointer-events-none"
          viewBox="0 0 38 38"
          aria-hidden="true"
        >
          <circle cx="8" cy="7" r="1.1" fill="#ffffff" />
          <circle cx="29" cy="6" r="1" fill="#93c5fd" />
          <circle cx="33" cy="18" r="1.2" fill="#fde047" />
          <circle cx="15" cy="12" r="0.9" fill="#ffffff" />
          <line x1="28" y1="6" x2="34" y2="2" stroke="#93c5fd" strokeWidth="0.9" />
          <line x1="8" y1="7" x2="13" y2="3" stroke="#ffffff" strokeWidth="0.8" />
        </svg>
      )}

      {/* Classic Serif "N" Mark */}
      <span
        className="relative z-10 text-white font-bold text-[22px] leading-none select-none"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          textShadow: '1px 1px 0 #000000',
        }}
      >
        N
      </span>
    </button>
  );
};

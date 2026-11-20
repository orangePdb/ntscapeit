import React from 'react';

interface IconProps {
  className?: string;
}

export const BackIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#2e8b57" stroke="#003300" strokeWidth="1.2" />
    <circle cx="11.5" cy="11.5" r="8.5" fill="none" stroke="#8fbc8f" strokeWidth="1" />
    <path d="M13.5 7L7.5 12L13.5 17V14H17.5V10H13.5V7Z" fill="#ffffff" stroke="#003300" strokeWidth="0.9" />
  </svg>
);

export const ForwardIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#2e8b57" stroke="#003300" strokeWidth="1.2" />
    <circle cx="11.5" cy="11.5" r="8.5" fill="none" stroke="#8fbc8f" strokeWidth="1" />
    <path d="M10.5 7L16.5 12L10.5 17V14H6.5V10H10.5V7Z" fill="#ffffff" stroke="#003300" strokeWidth="0.9" />
  </svg>
);

export const ReloadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M18.5 9.5A7 7 0 0 0 6.2 7.8L4 6V12H10L7.8 9.8A4.8 4.8 0 0 1 16.5 11H19Z"
      fill="#1e6fb8"
      stroke="#002244"
      strokeWidth="0.9"
    />
    <path
      d="M5.5 14.5A7 7 0 0 0 17.8 16.2L20 18V12H14L16.2 14.2A4.8 4.8 0 0 1 7.5 13H5Z"
      fill="#3aa655"
      stroke="#003300"
      strokeWidth="0.9"
    />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M3 11L12 3L21 11H18.5V20H5.5V11H3Z" fill="#f5e6b3" stroke="#000000" strokeWidth="1.1" />
    <path d="M2 11.5L12 2.5L22 11.5L20 12.5L12 5L4 12.5Z" fill="#b22222" stroke="#4a0000" strokeWidth="0.8" />
    <rect x="10" y="13" width="4" height="7" fill="#8b4513" stroke="#000000" strokeWidth="0.8" />
    <rect x="6.8" y="13" width="2.2" height="2.2" fill="#87ceeb" stroke="#000000" strokeWidth="0.6" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" fill="#4682b4" stroke="#001f3f" strokeWidth="1.2" />
    <ellipse cx="10.5" cy="10.5" rx="3.2" ry="6.2" fill="none" stroke="#b0e0e6" strokeWidth="0.8" />
    <line x1="4.5" y1="10.5" x2="16.5" y2="10.5" stroke="#b0e0e6" strokeWidth="0.8" />
    <circle cx="13.5" cy="13.5" r="4.5" fill="#ffffcc" fillOpacity="0.6" stroke="#b8860b" strokeWidth="1.3" />
    <line x1="16.8" y1="16.8" x2="21" y2="21" stroke="#8b4513" strokeWidth="2.6" />
  </svg>
);

export const MyNetscapeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="7.5" fill="none" stroke="#8b5a2b" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="2.2" fill="#daa520" stroke="#4a2e00" strokeWidth="0.8" />
    <line x1="12" y1="2" x2="12" y2="22" stroke="#8b5a2b" strokeWidth="1.6" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="#8b5a2b" strokeWidth="1.6" />
    <line x1="5" y1="5" x2="19" y2="19" stroke="#8b5a2b" strokeWidth="1.3" />
    <line x1="19" y1="5" x2="5" y2="19" stroke="#8b5a2b" strokeWidth="1.3" />
  </svg>
);

export const PrintIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="6" y="3" width="12" height="6" fill="#ffffff" stroke="#000000" strokeWidth="1" />
    <rect x="3" y="8" width="18" height="9" fill="#d4d0c8" stroke="#000000" strokeWidth="1" />
    <rect x="6" y="13" width="12" height="8" fill="#ffffff" stroke="#000000" strokeWidth="1" />
    <line x1="8" y1="15.5" x2="16" y2="15.5" stroke="#000080" strokeWidth="1" />
    <line x1="8" y1="18" x2="14" y2="18" stroke="#000080" strokeWidth="1" />
    <rect x="16" y="10" width="2" height="1.5" fill="#00aa00" />
  </svg>
);

export const SecurityIcon: React.FC<IconProps & { locked?: boolean }> = ({
  className = 'w-5 h-5',
  locked = false,
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d={locked ? 'M8 10V7A4 4 0 0 1 16 7V10' : 'M8 10V7A4 4 0 0 1 16 7'}
      fill="none"
      stroke="#555555"
      strokeWidth="2.2"
    />
    <rect x="5" y="10" width="14" height="10" fill="#ffd700" stroke="#664400" strokeWidth="1.2" />
    <circle cx="12" cy="14.5" r="1.4" fill="#000000" />
    <line x1="12" y1="15.5" x2="12" y2="18" stroke="#000000" strokeWidth="1.4" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon
      points="8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8"
      fill="#cc0000"
      stroke="#440000"
      strokeWidth="1.2"
    />
    <polygon
      points="8.8,4.4 15.2,4.4 19.6,8.8 19.6,15.2 15.2,19.6 8.8,19.6 4.4,15.2 4.4,8.8"
      fill="none"
      stroke="#ff8888"
      strokeWidth="0.9"
    />
    <rect x="7" y="10.5" width="10" height="3" fill="#ffffff" />
  </svg>
);

export const YouTubeRetroIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" fill="#cc0000" stroke="#330000" strokeWidth="1.2" />
    <rect x="4" y="7" width="16" height="10" fill="#ffffff" stroke="#660000" strokeWidth="0.8" />
    <polygon points="10,9 16,12 10,15" fill="#cc0000" />
  </svg>
);

export const XserverIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" fill="#d4d0c8" stroke="#000000" strokeWidth="1.2" />
    <rect x="7" y="5" width="10" height="3" fill="#334455" />
    <rect x="7" y="10" width="10" height="3" fill="#334455" />
    <rect x="8" y="15" width="2" height="2" fill="#00cc00" />
    <rect x="11" y="15" width="2" height="2" fill="#ffcc00" />
  </svg>
);

export const ComposerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="5,3 15,3 19,7 19,21 5,21" fill="#ffffff" stroke="#000000" strokeWidth="1.1" />
    <line x1="7" y1="9" x2="15" y2="9" stroke="#003366" strokeWidth="1.1" />
    <line x1="7" y1="12.5" x2="13" y2="12.5" stroke="#003366" strokeWidth="1.1" />
    <path d="M12 18L19.5 10.5L21.5 12.5L14 20L11 21Z" fill="#ffcc00" stroke="#000000" strokeWidth="0.9" />
  </svg>
);

export const BookmarksRibbonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <rect x="2" y="2" width="11" height="12" fill="#ffffff" stroke="#000000" strokeWidth="1" />
    <polygon points="8,2 12,2 12,11 10,9 8,11" fill="#008040" stroke="#003300" strokeWidth="0.7" />
  </svg>
);

export const FolderSmallIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path d="M1 4H6L7.5 6H15V13.5H1V4Z" fill="#f5cc4c" stroke="#664400" strokeWidth="1" />
  </svg>
);

export const PageSmallIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <polygon points="3,1 10,1 13,4 13,15 3,15" fill="#ffffff" stroke="#000080" strokeWidth="1" />
    <line x1="5" y1="6" x2="11" y2="6" stroke="#008080" strokeWidth="1" />
    <line x1="5" y1="9" x2="11" y2="9" stroke="#000080" strokeWidth="1" />
  </svg>
);

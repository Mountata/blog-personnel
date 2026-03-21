// Icons.jsx — Système d'icônes unifié, strokeWidth=1.75, currentColor
// Remplace heroicons partout dans le projet

export const Icon = ({ d, size = 20, className = '', strokeWidth = 1.75 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} d={path} />)
      : <path d={d} />}
  </svg>
);

// ── Navigation ─────────────────────────────────────────────────
export const HomeIcon     = ({ size, className }) => <Icon size={size} className={className} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />;
export const FriendsIcon  = ({ size, className }) => <Icon size={size} className={className} d={["M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"]} />;
export const BellIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"]} />;
export const BookmarkIcon = ({ size, className }) => <Icon size={size} className={className} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />;
export const ChatIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"]} />;
export const SettingsIcon = ({ size, className }) => <Icon size={size} className={className} d={["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"]} />;
export const ChartIcon    = ({ size, className }) => <Icon size={size} className={className} d={["M18 20V10", "M12 20V4", "M6 20v-6"]} />;
export const CircleIcon   = ({ size, className }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <line x1="12" y1="3" x2="12" y2="8.5" />
    <line x1="12" y1="15.5" x2="12" y2="21" />
    <line x1="3" y1="12" x2="8.5" y2="12" />
    <line x1="15.5" y1="12" x2="21" y2="12" />
  </svg>
);

// ── Actions ────────────────────────────────────────────────────
export const PlusIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M12 5v14", "M5 12h14"]} />;
export const SearchIcon    = ({ size, className }) => <Icon size={size} className={className} d={["M21 21l-4.35-4.35", "M17 11A6 6 0 115 11a6 6 0 0112 0z"]} />;
export const EditIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]} />;
export const TrashIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M3 6h18", "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"]} />;
export const ShareIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8", "M16 6l-4-4-4 4", "M12 2v13"]} />;
export const EyeIcon       = ({ size, className }) => <Icon size={size} className={className} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 100 6 3 3 0 000-6z"]} />;
export const LockIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z", "M7 11V7a5 5 0 0110 0v4"]} />;
export const GlobeIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M12 2a10 10 0 100 20A10 10 0 0012 2z", "M2 12h20", "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"]} />;
export const CloseIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M18 6L6 18", "M6 6l12 12"]} />;
export const ArrowLeftIcon = ({ size, className }) => <Icon size={size} className={className} d={["M19 12H5", "M12 5l-7 7 7 7"]} />;
export const CheckIcon     = ({ size, className }) => <Icon size={size} className={className} d="M20 6L9 17l-5-5" />;
export const SparklesIcon  = ({ size, className }) => <Icon size={size} className={className} d={["M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"]} />;
export const MoonIcon      = ({ size, className }) => <Icon size={size} className={className} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;
export const SunIcon       = ({ size, className }) => <Icon size={size} className={className} d={["M12 1v2", "M12 21v2", "M4.22 4.22l1.42 1.42", "M18.36 18.36l1.42 1.42", "M1 12h2", "M21 12h2", "M4.22 19.78l1.42-1.42", "M18.36 5.64l1.42-1.42", "M12 5a7 7 0 100 14A7 7 0 0012 5z"]} />;
export const MenuIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M3 12h18", "M3 6h18", "M3 18h18"]} />;
export const PhotoIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z", "M12 13a3 3 0 100 6 3 3 0 000-6z"]} />;
export const TagIcon       = ({ size, className }) => <Icon size={size} className={className} d={["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z", "M7 7h.01"]} />;
export const SendIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M22 2L11 13", "M22 2L15 22l-4-9-9-4 20-7z"]} />;
export const LogoutIcon    = ({ size, className }) => <Icon size={size} className={className} d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />;
export const UserIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"]} />;
export const UserPlusIcon  = ({ size, className }) => <Icon size={size} className={className} d={["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M8.5 11a4 4 0 100-8 4 4 0 000 8z", "M20 8v6", "M23 11h-6"]} />;
export const UserMinusIcon = ({ size, className }) => <Icon size={size} className={className} d={["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M8.5 11a4 4 0 100-8 4 4 0 000 8z", "M23 11h-6"]} />;
export const DotsIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M12 5h.01", "M12 12h.01", "M12 19h.01"]} strokeWidth={2.5} />;
export const HeartIcon     = ({ size, className }) => <Icon size={size} className={className} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />;
export const HeartSolidIcon = ({ size, className }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
export const BookmarkSolidIcon = ({ size, className }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
  </svg>
);
export const LinkIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]} />;
export const CopyIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z", "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"]} />;
export const RefreshIcon   = ({ size, className }) => <Icon size={size} className={className} d={["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"]} />;
export const ShieldIcon    = ({ size, className }) => <Icon size={size} className={className} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
export const CogIcon       = ({ size, className }) => <SettingsIcon size={size} className={className} />;
export const PaperPlaneIcon = ({ size, className }) => <SendIcon size={size} className={className} />;
export const MapPinIcon    = ({ size, className }) => <Icon size={size} className={className} d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", "M12 7a3 3 0 100 6 3 3 0 000-6z"]} />;
export const BriefcaseIcon = ({ size, className }) => <Icon size={size} className={className} d={["M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z", "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"]} />;
export const ExternalLinkIcon = ({ size, className }) => <Icon size={size} className={className} d={["M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6", "M15 3h6v6", "M10 14L21 3"]} />;
export const NoIcon        = ({ size, className }) => <Icon size={size} className={className} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M4.93 4.93l14.14 14.14"]} />;
export const FireIcon      = ({ size, className }) => <Icon size={size} className={className} d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm-2 11a2 2 0 004 0c0-2-2-4-2-4s-2 2-2 4z" />;
export const ClockIcon     = ({ size, className }) => <Icon size={size} className={className} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 6v6l4 2"]} />;
export const CalendarIcon  = ({ size, className }) => <Icon size={size} className={className} d={["M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z", "M16 2v4", "M8 2v4", "M3 10h18"]} />;
export const TrendUpIcon   = ({ size, className }) => <Icon size={size} className={className} d={["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]} />;
export const TrendDownIcon = ({ size, className }) => <Icon size={size} className={className} d={["M23 18l-9.5-9.5-5 5L1 6", "M17 18h6v-6"]} />;
export const DocIcon       = ({ size, className }) => <Icon size={size} className={className} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} />;
export const InfoIcon      = ({ size, className }) => <Icon size={size} className={className} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 8h.01", "M11 12h1v4h1"]} />;
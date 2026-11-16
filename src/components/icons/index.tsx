/**
 * Conjunto de ícones autoral da King's Barber.
 *
 * Todos os traços foram desenhados para a marca (grade 24×24, traço 1.6,
 * terminações arredondadas) e não dependem de bibliotecas de ícones.
 */
import { forwardRef, type ReactNode, type SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  title?: string;
};

export type IconComponent = ReturnType<typeof createIcon>;

function createIcon(displayName: string, body: ReactNode, options: { filled?: boolean } = {}) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, strokeWidth = 1.6, className, title, ...props },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={options.filled ? "currentColor" : "none"}
        stroke={options.filled ? "none" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        focusable="false"
        className={["kb-icon", className].filter(Boolean).join(" ")}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {body}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

/* ───────────────────────── Navegação e ações ───────────────────────── */

export const ArrowRight = createIcon(
  "ArrowRight",
  <>
    <path d="M4 12h15" />
    <path d="M13.5 6.5 19 12l-5.5 5.5" />
  </>,
);

export const ArrowLeft = createIcon(
  "ArrowLeft",
  <>
    <path d="M20 12H5" />
    <path d="M10.5 6.5 5 12l5.5 5.5" />
  </>,
);

export const ArrowUpRight = createIcon(
  "ArrowUpRight",
  <>
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </>,
);

export const ChevronLeft = createIcon("ChevronLeft", <path d="m14.5 6-6 6 6 6" />);
export const ChevronRight = createIcon("ChevronRight", <path d="m9.5 6 6 6-6 6" />);
export const ChevronDown = createIcon("ChevronDown", <path d="m6 9.5 6 6 6-6" />);

export const Menu = createIcon(
  "Menu",
  <>
    <path d="M4 7h16" />
    <path d="M4 12h11" />
    <path d="M4 17h16" />
  </>,
);

export const X = createIcon(
  "X",
  <>
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </>,
);

export const Plus = createIcon(
  "Plus",
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const Check = createIcon("Check", <path d="m5 12.5 4.2 4.2L19 7" />);

export const CheckCircle2 = createIcon(
  "CheckCircle2",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.2 12.3 2.6 2.6 5-5.4" />
  </>,
);

export const Circle = createIcon("Circle", <circle cx="12" cy="12" r="8.5" />);

export const MoreHorizontal = createIcon(
  "MoreHorizontal",
  <>
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
  </>,
);

export const Search = createIcon(
  "Search",
  <>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </>,
);

export const RefreshCw = createIcon(
  "RefreshCw",
  <>
    <path d="M19.5 9A8 8 0 0 0 5.2 7.4L4 9" />
    <path d="M4 4.5V9h4.5" />
    <path d="M4.5 15a8 8 0 0 0 14.3 1.6L20 15" />
    <path d="M20 19.5V15h-4.5" />
  </>,
);

export const Loader2 = createIcon(
  "Loader2",
  <>
    <path d="M12 3a9 9 0 1 0 9 9" />
    <path d="M12 3a9 9 0 0 1 9 9" opacity=".25" />
  </>,
);

export const Download = createIcon(
  "Download",
  <>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M5 19.5h14" />
  </>,
);

export const Save = createIcon(
  "Save",
  <>
    <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
    <path d="M8 4v4.5h7V4" />
    <rect x="8" y="13" width="8" height="5" rx=".6" />
  </>,
);

export const Trash2 = createIcon(
  "Trash2",
  <>
    <path d="M4 7h16" />
    <path d="M9.5 7V4.8h5V7" />
    <path d="M6.5 7 7.4 19a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7" />
    <path d="M10.2 11v5" />
    <path d="M13.8 11v5" />
  </>,
);

export const Pencil = createIcon(
  "Pencil",
  <>
    <path d="M15.5 4.5 19.5 8.5 9 19l-5 1 1-5Z" />
    <path d="m13.5 6.5 4 4" />
  </>,
);

export const Edit3 = createIcon(
  "Edit3",
  <>
    <path d="M12.5 20H20" />
    <path d="M15.8 4.2a1.9 1.9 0 0 1 2.7 2.7L8.3 17.1 4.5 18l.9-3.8Z" />
  </>,
);

export const Play = createIcon("Play", <path d="M8 5.5v13l10.5-6.5Z" />);

export const LogIn = createIcon(
  "LogIn",
  <>
    <path d="M14 4h4a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-4" />
    <path d="M3.5 12h11" />
    <path d="m10.5 8 4 4-4 4" />
  </>,
);

export const LogOut = createIcon(
  "LogOut",
  <>
    <path d="M10 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h4" />
    <path d="M9.5 12h11" />
    <path d="m16.5 8 4 4-4 4" />
  </>,
);

/* ───────────────────────── Agenda e tempo ───────────────────────── */

export const Calendar = createIcon(
  "Calendar",
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </>,
);

export const CalendarDays = createIcon(
  "CalendarDays",
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <circle cx="8.5" cy="14" r=".6" fill="currentColor" />
    <circle cx="12" cy="14" r=".6" fill="currentColor" />
    <circle cx="15.5" cy="14" r=".6" fill="currentColor" />
    <circle cx="8.5" cy="17.3" r=".6" fill="currentColor" />
    <circle cx="12" cy="17.3" r=".6" fill="currentColor" />
  </>,
);

export const CalendarX2 = createIcon(
  "CalendarX2",
  <>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="m10 13.2 4 4" />
    <path d="m14 13.2-4 4" />
  </>,
);

export const Clock = createIcon(
  "Clock",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

export const Clock3 = Clock;

export const History = createIcon(
  "History",
  <>
    <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6" />
    <path d="M4 4.5v4.1h4.1" />
    <path d="M12 8v4.3l2.8 1.7" />
  </>,
);

/* ───────────────────────── Pessoas ───────────────────────── */

export const UserRound = createIcon(
  "UserRound",
  <>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </>,
);

export const User2 = UserRound;

export const Users = createIcon(
  "Users",
  <>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.8 19.5c.9-3.1 3.2-4.8 6.2-4.8s5.3 1.7 6.2 4.8" />
    <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4" />
    <path d="M17.5 14.9c1.8.6 3 2.1 3.7 4.6" />
  </>,
);

export const ContactRound = createIcon(
  "ContactRound",
  <>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <circle cx="12" cy="10.3" r="2.6" />
    <path d="M7.5 17c.8-1.9 2.4-2.9 4.5-2.9s3.7 1 4.5 2.9" />
    <path d="M8 2.5v2.5" />
    <path d="M16 2.5v2.5" />
  </>,
);

export const Crown = createIcon(
  "Crown",
  <>
    <path d="M4 8.5 7.8 12 12 5l4.2 7L20 8.5 18.5 18h-13Z" />
    <path d="M5.5 21h13" />
  </>,
);

export const Star = createIcon(
  "Star",
  <path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.6l-5.1 2.8L8 13.6l-4.3-4 5.8-.7Z" />,
);

export const Gift = createIcon(
  "Gift",
  <>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12" />
    <path d="M12 8v12.5" />
    <path d="M12 8C10.5 4.5 7 4.3 7 6.3 7 7.6 9 8 12 8Z" />
    <path d="M12 8c1.5-3.5 5-3.7 5-1.7C17 7.6 15 8 12 8Z" />
  </>,
);

/* ───────────────────────── Barbearia ───────────────────────── */

export const Scissors = createIcon(
  "Scissors",
  <>
    <circle cx="6.5" cy="6.5" r="2.8" />
    <circle cx="6.5" cy="17.5" r="2.8" />
    <path d="M8.8 8.2 20 18" />
    <path d="M8.8 15.8 20 6" />
  </>,
);

export const Razor = createIcon(
  "Razor",
  <>
    <path d="M3.5 14.5 14 4l3 3-10.5 10.5Z" />
    <path d="m14 10 6.5 6.5-2 2L12 12" />
  </>,
);

export const Sparkles = createIcon(
  "Sparkles",
  <>
    <path d="M10 3.5 11.6 8.4 16.5 10l-4.9 1.6L10 16.5 8.4 11.6 3.5 10l4.9-1.6Z" />
    <path d="M18 14.5l.8 2 2 .7-2 .8-.8 2-.7-2-2-.8 2-.7Z" />
  </>,
);

export const Package = createIcon(
  "Package",
  <>
    <path d="M12 3 20 7.2v9.6L12 21l-8-4.2V7.2Z" />
    <path d="M4 7.2 12 11.5l8-4.3" />
    <path d="M12 11.5V21" />
    <path d="m8 5.1 8 4.3" />
  </>,
);

export const PackageOpen = createIcon(
  "PackageOpen",
  <>
    <path d="M12 10.5 4.5 7 12 3.5 19.5 7Z" />
    <path d="M4.5 7v9.5L12 20.5l7.5-4V7" />
    <path d="M12 10.5v10" />
    <path d="m4.5 7-2 3 7.5 3.5 2-3" />
    <path d="m19.5 7 2 3-7.5 3.5-2-3" />
  </>,
);

export const ShoppingBag = createIcon(
  "ShoppingBag",
  <>
    <path d="M5 7.5h14l-1.1 12a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9Z" />
    <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" />
  </>,
);

export const ShoppingCart = createIcon(
  "ShoppingCart",
  <>
    <path d="M2.5 3.5h2.4l2.4 11.2a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8l1.6-7.2H6" />
    <circle cx="9" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </>,
);

export const ImagePlus = createIcon(
  "ImagePlus",
  <>
    <path d="M20.5 12.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5h6.5" />
    <path d="m3.8 16.5 4.7-4.5 4 3.8 2.3-2 5.5 4.7" />
    <path d="M18 3v6" />
    <path d="M15 6h6" />
  </>,
);

export const Camera = createIcon(
  "Camera",
  <>
    <path d="M4.5 7.5h3l1.6-2.5h5.8l1.6 2.5h3a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" />
    <circle cx="12" cy="13" r="3.5" />
  </>,
);

/* ───────────────────────── Finanças e dados ───────────────────────── */

export const DollarSign = createIcon(
  "DollarSign",
  <>
    <path d="M12 3v18" />
    <path d="M16.5 7.2C15.6 6 14 5.5 12 5.5c-2.6 0-4.3 1.2-4.3 3.1 0 4.4 8.8 2.4 8.8 6.9 0 2-1.9 3.2-4.5 3.2-2.1 0-3.8-.7-4.7-2" />
  </>,
);

export const Wallet = createIcon(
  "Wallet",
  <>
    <path d="M19 7.5V6a1.5 1.5 0 0 0-1.5-1.5H5.5a2 2 0 0 0 0 4H19a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 20H5.5A2 2 0 0 1 3.5 18V6.5" />
    <path d="M20.5 12H17a2 2 0 0 0 0 4h3.5" />
  </>,
);

export const ReceiptText = createIcon(
  "ReceiptText",
  <>
    <path d="M5.5 3.5h13v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4-2.2 1.4Z" />
    <path d="M9 8.5h6" />
    <path d="M9 12h6" />
    <path d="M9 15.5h3.5" />
  </>,
);

export const TrendingUp = createIcon(
  "TrendingUp",
  <>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
);

export const BarChart3 = createIcon(
  "BarChart3",
  <>
    <path d="M3.5 20.5h17" />
    <rect x="5.5" y="11" width="3" height="6.5" rx=".8" />
    <rect x="10.5" y="5" width="3" height="12.5" rx=".8" />
    <rect x="15.5" y="8.5" width="3" height="9" rx=".8" />
  </>,
);

export const LayoutDashboard = createIcon(
  "LayoutDashboard",
  <>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.6" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.6" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.6" />
  </>,
);

export const Settings = createIcon(
  "Settings",
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    <circle cx="12" cy="12" r="6.6" />
  </>,
);

export const Building2 = createIcon(
  "Building2",
  <>
    <path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14.5 5v15.5" />
    <path d="M14.5 9.5H18a1.5 1.5 0 0 1 1.5 1.5v9.5" />
    <path d="M3 20.5h18" />
    <path d="M8 7.5h3M8 11h3M8 14.5h3" />
    <path d="M10 20.5v-2.5" />
  </>,
);

/* ───────────────────────── Segurança ───────────────────────── */

export const Lock = createIcon(
  "Lock",
  <>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </>,
);

export const KeyRound = createIcon(
  "KeyRound",
  <>
    <circle cx="8" cy="15.5" r="4.5" />
    <path d="m11.3 12.3 8.2-8.3" />
    <path d="m16.5 7 2.5 2.5" />
    <path d="m14.3 9.2 2 2" />
  </>,
);

export const ShieldCheck = createIcon(
  "ShieldCheck",
  <>
    <path d="M12 3 19.5 6v5.5c0 4.6-3.1 8.1-7.5 9.5-4.4-1.4-7.5-4.9-7.5-9.5V6Z" />
    <path d="m8.8 12 2.3 2.3 4.2-4.6" />
  </>,
);

export const AlertTriangle = createIcon(
  "AlertTriangle",
  <>
    <path d="M10.6 4.3a1.6 1.6 0 0 1 2.8 0l7.6 13.4A1.6 1.6 0 0 1 19.6 20H4.4A1.6 1.6 0 0 1 3 17.7Z" />
    <path d="M12 9.5v4" />
    <circle cx="12" cy="16.6" r=".7" fill="currentColor" />
  </>,
);

/* ───────────────────────── Contato e lugar ───────────────────────── */

export const Phone = createIcon(
  "Phone",
  <path d="M7.4 3.5H5.2A1.7 1.7 0 0 0 3.5 5.3C3.9 13.4 10.6 20.1 18.7 20.5a1.7 1.7 0 0 0 1.8-1.7v-2.2a1.2 1.2 0 0 0-.9-1.2l-3.1-.9a1.2 1.2 0 0 0-1.2.3l-1.4 1.4a12 12 0 0 1-5.4-5.4l1.4-1.4a1.2 1.2 0 0 0 .3-1.2l-.9-3.1a1.2 1.2 0 0 0-1.2-.9Z" />,
);

export const Mail = createIcon(
  "Mail",
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 6.5 8 6 8-6" />
  </>,
);

export const MessageCircle = createIcon(
  "MessageCircle",
  <path d="M20.5 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 20.5 11.5Z" />,
);

export const MapPin = createIcon(
  "MapPin",
  <>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </>,
);

export const Instagram = createIcon(
  "Instagram",
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r=".9" fill="currentColor" stroke="none" />
  </>,
);

/** Glifo do WhatsApp em versão preenchida para leitura imediata em botões. */
export const WhatsApp = createIcon(
  "WhatsApp",
  <path d="M12.04 2.5a9.42 9.42 0 0 0-8.1 14.24L2.5 21.5l4.9-1.4a9.42 9.42 0 1 0 4.64-17.6Zm0 17.2a7.8 7.8 0 0 1-3.98-1.09l-.28-.17-2.9.83.85-2.82-.19-.3a7.79 7.79 0 1 1 6.5 3.55Zm4.28-5.83c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.16.23-.6.76-.74.91-.14.16-.27.18-.5.06a6.4 6.4 0 0 1-1.88-1.16 7.06 7.06 0 0 1-1.3-1.62c-.14-.23-.02-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.24.23-.4.08-.15.04-.29-.02-.4-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.4-.53-.4h-.45a.86.86 0 0 0-.62.29 2.6 2.6 0 0 0-.82 1.94 4.52 4.52 0 0 0 .95 2.4 10.34 10.34 0 0 0 3.97 3.5c.55.24.99.38 1.32.49.56.18 1.06.15 1.46.09.45-.07 1.38-.56 1.57-1.1.2-.55.2-1.01.14-1.11-.06-.1-.21-.16-.44-.28Z" />,
  { filled: true },
);

/* ───────────────────────── Tema ───────────────────────── */

export const Sun = createIcon(
  "Sun",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </>,
);

export const Moon = createIcon(
  "Moon",
  <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" />,
);

export const Laptop = createIcon(
  "Laptop",
  <>
    <rect x="4.5" y="5" width="15" height="10.5" rx="1.6" />
    <path d="M2.5 19h19" />
  </>,
);

/**
 * Conjunto de ícones profissionais do painel (traço 24×24, sem dependências).
 * Substitui os emojis do menu (§3). Uso: <Icon name="wallet" />.
 */

const PATHS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 8.5a2.8 2.8 0 1 0 0-5.6M17.5 14.6c2.1.6 3.5 2.3 3.5 4.9" />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21c.8-3.4 3.1-5 6-5s5.2 1.6 6 5" />
      <path d="M9.5 7.5h.01M14.5 7.5h.01" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="2.5" />
      <path d="M4 11h16M8 20v-3M16 20v-3" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.3-2h7.4L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.6" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v3a1 1 0 0 0 1 1h2l3 4v-14l-3 4H4a1 1 0 0 0-1 1z" />
      <path d="M13 8c1.5 1 1.5 6 0 7M16.5 5.5c3 2.5 3 9.5 0 12" />
    </>
  ),
  heart: <path d="M12 20.5s-7.5-4.7-9.3-9.2C1.3 7.7 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.7 3.2 4.3 6.8-1.8 4.5-9.3 9.2-9.3 9.2z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  puzzle: (
    <>
      <path d="M9 4h6v4.2a2 2 0 1 0 0 3.6V16H4v-4.2a2 2 0 1 1 0-3.6V4h5z" transform="translate(2.5 2)" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4h16v16H4z" opacity="0" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5z" />,
  sparkles: (
    <>
      <path d="M12 4.5 13.6 9l4.4 1.5-4.4 1.6L12 16.5l-1.6-4.4L6 10.5 10.4 9z" />
      <path d="M19 3v3M17.5 4.5h3M5 17v3M3.5 18.5h3" />
    </>
  ),
  "check-badge": (
    <>
      <path d="M12 3.5 14 5.6l2.9-.4.5 2.9 2.6 1.4-1.2 2.7 1.2 2.7-2.6 1.4-.5 2.9-2.9-.4-2 2.1-2-2.1-2.9.4-.5-2.9-2.6-1.4L4.2 12 3 9.5l2.6-1.4.5-2.9 2.9.4z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" />,
  rings: (
    <>
      <circle cx="9.5" cy="13.5" r="5.5" />
      <circle cx="15" cy="10.5" r="5.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  suit: (
    <>
      <path d="M12 3 8 7l2 2-2 10h8L14 9l2-2z" />
      <path d="M8 7 5 9l1.5 3M16 7l3 2-1.5 3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 10v4.5M12 17.4h.01" />
    </>
  ),
  tasks: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="m8 12 2.5 2.5L16.5 9M8 17h5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12" />
      <path d="M12 8c-4.5 0-5.5-4.5-2.5-4.5C11.5 3.5 12 6 12 8c0-2 .5-4.5 2.5-4.5 3 0 2 4.5-2.5 4.5z" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 14.5h4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11a1 1 0 0 1 1 1v1.5" />
      <rect x="4" y="7.5" width="16.5" height="12" rx="2" />
      <path d="M16 13.5h4.5" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 19h.01M12 19h.01M15.5 19h.01" />
    </>
  ),
  "file-text": (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  "calendar-check": (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M9 14.5l2 2 4-4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path d="M3 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M21 10v7" />
    </>
  ),
  "plus-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 4v4h-4M4 20v-4h4" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  tag: (
    <>
      <path d="m3.5 12.5 8-9H20v8.5l-9 8.5a1.5 1.5 0 0 1-2.1 0l-5.4-5.9a1.5 1.5 0 0 1 0-2.1z" />
      <circle cx="16" cy="8" r="1.2" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  handshake: (
    <>
      <path d="m8 12-3-3 4.5-4.5L12 6l2.5-1.5L19 9l-3 3" />
      <path d="m8 12 4 4 1.5-1.5M13.5 14.5 15 13M12 16l-1.5 1.5a1.4 1.4 0 0 1-2-2L10 14" />
    </>
  ),
  folder: <path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  edit: (
    <>
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="m13 7 4 4" />
    </>
  ),
  rain: (
    <>
      <path d="M7 15a5 5 0 1 1 .8-9.9A6 6 0 0 1 19 8a4 4 0 0 1-1 7.9" />
      <path d="M8 18.5v2M12 17.5v2M16 18.5v2" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.6-4.6" />
    </>
  ),
  bank: (
    <>
      <path d="m3 9 9-5.5L21 9" />
      <path d="M5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 20h18M3 17h18" />
    </>
  ),
};

export function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const paths = PATHS[name] ?? PATHS.list;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths}
    </svg>
  );
}

import type { ReactElement, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const DocIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const DocTextIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

export const PlusCircleIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

export const MinusCircleIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12h7" />
  </svg>
);

export const BranchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="5" r="2.2" />
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="12" r="2.2" />
    <path d="M6 7.2v9.6M8.2 5.6c5 .6 7.6 2.4 7.8 5.4M8.2 18.4c5-.6 7.6-2.4 7.8-5.4" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l7 2.6v5.7c0 4.3-2.9 7.6-7 9.7-4.1-2.1-7-5.4-7-9.7V5.6z" />
    <path d="M9.2 12.1l2 2 3.6-3.8" />
  </svg>
);

export const HourglassIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3h10M7 21h10M8 3c0 4 2.5 5.6 4 7-1.5 1.4-4 3-4 7M16 3c0 4-2.5 5.6-4 7 1.5 1.4 4 3 4 7" />
  </svg>
);

export const FolderIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 7.5A2 2 0 0 1 5 5.5h3.6l1.6 2H19a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const ScalesIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v17M6.5 20h11M4 8h16M4 8l-2.2 5a3.2 3.2 0 0 0 4.4 0zM20 8l2.2 5a3.2 3.2 0 0 1-4.4 0zM6.5 8h11" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const ChevronRight = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m5 9 7 7 7-7" />
  </svg>
);

export const ArrowRight = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
  </svg>
);

export const ArrowLeft = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M20 12H5m0 0 5.5-5.5M5 12l5.5 5.5" />
  </svg>
);

export const SortIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4v13m0 0-3-3m3 3 3-3M13 6h8M13 12h5.5M13 18h3" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10m0 0 4-4m-4 4-4-4M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 19v-1.5" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M12 15.5v-7m0 0-3 3m3-3 3 3" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.6" />
  </svg>
);

export const HelpIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.6c-.7.3-1 .8-1 1.6M12 16.4v.4" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={1.9}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const SparklesIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5 13.4 9 18 10.4 13.4 11.8 12 16.3 10.6 11.8 6 10.4 10.6 9zM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7zM5.5 3.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7L3.2 6l1.7-.6z" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.1}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const XIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const FilePlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9z" />
    <path d="M13 3v6h6M12 12.5v5M9.5 15h5" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 11.3A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.7L17.5 7M10 11v5M14 11v5" />
  </svg>
);

export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.8v2.1M12 19.1v2.1M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5" />
  </svg>
);

export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
  </svg>
);

const map: Record<string, (p: P) => ReactElement> = {
  doc: DocIcon,
  user: UserIcon,
  plus: PlusCircleIcon,
  minus: MinusCircleIcon,
  branch: BranchIcon,
  shield: ShieldIcon,
  hourglass: HourglassIcon,
  folder: FolderIcon,
  scales: ScalesIcon,
};

export function SectionIcon({ name, className }: { name: string; className?: string }) {
  const C = map[name] ?? DocIcon;
  return <C className={className} />;
}

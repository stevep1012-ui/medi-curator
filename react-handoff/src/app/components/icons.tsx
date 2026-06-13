import type { ReactNode } from "react";

type IconProps = { className?: string };

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      {children}
    </svg>
  );
}

export const PulseIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 12h4l2-6 4 14 2-8h6" />
  </Svg>
);

export const PillIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="8" width="18" height="8" rx="4" />
    <path d="M12 8v8" />
  </Svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
);

export const InfoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </Svg>
);

export const AlertIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const HeartIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z" />
  </Svg>
);

export const LeafIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16Z" />
    <path d="M8 16C12 12 14 9 18 7" />
  </Svg>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </Svg>
);

export const PinIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const HistoryIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 12a9 9 0 1 0 2.6-6.3M3 5v4h4" />
    <path d="M12 8v4l3 2" />
  </Svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </Svg>
);

export const NavIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m3 11 19-9-9 19-2-8-8-2Z" />
  </Svg>
);

export const StarIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8-5.1-4.6 6.9-.7L12 2Z" />
  </svg>
);

export const SunIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
  </Svg>
);

export const MoonIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Svg>
);

export const AutoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m5 12 4.5 4.5L19 7" />
  </Svg>
);

export const ShieldCheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

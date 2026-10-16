import type { ReactNode } from "react";

export type ServiceIconName =
  | "radiography"
  | "ultrasound"
  | "penetrant"
  | "magnetic"
  | "visual"
  | "thickness"
  | "coating"
  | "roughness"
  | "hardness"
  | "certified";

// One small, consistent outline family, used only by the service interiors.
const paths: Record<ServiceIconName, () => ReactNode> = {
  radiography: () => <>
    <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
    <circle className="accent" cx="12" cy="12" r="4" />
  </>,
  ultrasound: () => <>
    <path d="M3 12h3l2-6 4 12 4-12 2 6h3" />
    <path className="accent" d="m8 6 4 12 4-12" />
  </>,
  penetrant: () => <>
    <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z" />
    <path className="accent" d="M9 14a3 3 0 0 0 3 3" />
  </>,
  magnetic: () => <>
    <path d="M5 4v10a7 7 0 0 0 14 0V4h-4v10a3 3 0 0 1-6 0V4Z" />
    <path className="accent" d="M5 8h4m6 0h4" />
  </>,
  visual: () => <>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
    <circle className="accent" cx="12" cy="12" r="3" />
  </>,
  thickness: () => <>
    <rect x="7" y="3" width="10" height="18" rx="1" />
    <path d="M7 7h4m-4 10h4" />
    <path className="accent" d="M7 12h6" />
  </>,
  coating: () => <>
    <rect className="accent" x="3" y="4" width="14" height="6" rx="1" />
    <path d="M17 7h4v6h-9v3m-2 0h4v5h-4Z" />
  </>,
  roughness: () => <>
    <path d="m3 13 3-4 3 6 3-8 3 8 3-6 3 4" />
    <path className="accent" d="M3 20h18" />
  </>,
  hardness: () => <>
    <path d="m12 3 9 9-9 9-9-9Z" />
    <path className="accent" d="M8 12h8m-4-4v8" />
  </>,
  certified: () => <>
    <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
    <path className="accent" d="m8 12 3 3 5-6" />
  </>,
};

export default function ServiceIcon({ name, className = "" }: { name: ServiceIconName; className?: string }) {
  return (
    <svg className={`service-icon ${className}`} viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]()}
    </svg>
  );
}

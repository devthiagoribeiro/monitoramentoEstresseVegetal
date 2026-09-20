import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const LeafIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 3.2 21 4 21 4s.8 5.5-2.1 11.2A7 7 0 0 1 11 20Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.44 12.9 12.4 12 16 12" /></svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M12 5v14M5 12h14" /></svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m15 18-6-6 6-6" /></svg>
);

export const MapPinIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

export const RadioIcon = (props: IconProps) => (
  <svg {...base(props)}><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 16.24a6 6 0 0 1 0-8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" /></svg>
);

export const LogOutIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>
);

export const ActivityIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M3 12h4l2.5-7 5 14 2.5-7h4" /></svg>
);

export const DropletsIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M7 16.5A4 4 0 0 0 11 20c2.2 0 4-1.8 4-4 0-2.5-4-7-4-7s-4 4.5-4 7.5Z" /><path d="M14 7.5C14 5.6 17 2 17 2s3 3.6 3 5.5a3 3 0 0 1-4.2 2.75" /></svg>
);

export const ThermometerIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M14 14.76V5a4 4 0 0 0-8 0v9.76a6 6 0 1 0 8 0Z" /><path d="M10 9v7" /></svg>
);

export const BatteryIcon = (props: IconProps) => (
  <svg {...base(props)}><rect x="2" y="7" width="18" height="10" rx="2" /><path d="M22 11v2M6 11v2M10 11v2M14 11v2" /></svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6" /></svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...base(props)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
);

import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

interface IconBaseProps extends IconProps {
  readonly children: ReactNode;
}

function Icon({ children, ...props }: IconBaseProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </Icon>
  );
}

export function TestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ReloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 4v5h-5" />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10.5 13.5" />
      <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function RotateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 3.5 20.5 7 17 10.5" />
      <path d="M20.5 7H9a5.5 5.5 0 0 0 0 11h1" />
      <path d="M7 20.5 3.5 17 7 13.5" />
      <path d="M3.5 17H15a5.5 5.5 0 0 0 0-11h-1" />
    </Icon>
  );
}

export function SmartphoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </Icon>
  );
}

export function TabletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </Icon>
  );
}

export function LaptopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="10.5" rx="1.5" />
      <path d="M2 19h20" />
    </Icon>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
      <path d="M9 20.5h6" />
      <path d="M12 16.5v4" />
    </Icon>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5h17v7h-17z" />
      <path d="M7 8.5v3" />
      <path d="M11 8.5v4" />
      <path d="M15 8.5v3" />
      <path d="M19 8.5v4" />
    </Icon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h5" />
      <path d="M15 7h5" />
      <path d="M4 17h11" />
      <path d="M19 17h1" />
      <circle cx="12" cy="7" r="2.25" />
      <circle cx="17.5" cy="17" r="2.25" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M18 7l-1 13.5H7L6 7" />
      <path d="M10.5 11v6" />
      <path d="M13.5 11v6" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 6.5 9.5 17 4 11.5" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.6 3.9 2.5 18.2A1.6 1.6 0 0 0 3.9 20.5h16.2a1.6 1.6 0 0 0 1.4-2.3L13.4 3.9a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.5V17" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5 12 15.5l6-6" />
    </Icon>
  );
}

export function FrameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.5H5A1.5 1.5 0 0 0 3.5 5v2" />
      <path d="M17 3.5h2A1.5 1.5 0 0 1 20.5 5v2" />
      <path d="M20.5 17v2a1.5 1.5 0 0 1-1.5 1.5h-2" />
      <path d="M7 20.5H5A1.5 1.5 0 0 1 3.5 19v-2" />
    </Icon>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 9V5A1.5 1.5 0 0 1 5 3.5h4" />
      <path d="M15 3.5h4A1.5 1.5 0 0 1 20.5 5v4" />
      <path d="M20.5 15v4a1.5 1.5 0 0 1-1.5 1.5h-4" />
      <path d="M9 20.5H5A1.5 1.5 0 0 1 3.5 19v-4" />
    </Icon>
  );
}

export function ShrinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3.5V9H3.5" />
      <path d="M15 3.5V9h5.5" />
      <path d="M15 20.5V15h5.5" />
      <path d="M9 20.5V15H3.5" />
    </Icon>
  );
}

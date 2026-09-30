import { useId } from 'react';
import './model-preview-backdrop.css';

/** Decorative inspection field. It never intercepts model controls or encodes gameplay range. */
export function ModelPreviewBackdrop({ animated = true }: { animated?: boolean }) {
  const id = useId().replaceAll(':', '');
  const floor = `${id}-floor`, wall = `${id}-wall`, light = `${id}-light`, clip = `${id}-clip`;
  return <div className="ui-model-backdrop" data-animated={animated} aria-hidden="true">
    <svg viewBox="0 0 1200 720" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id={wall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ui-surface)" />
          <stop offset="1" stopColor="var(--ui-raised)" />
        </linearGradient>
        <linearGradient id={floor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ui-raised)" />
          <stop offset="1" stopColor="var(--ui-surface)" />
        </linearGradient>
        <radialGradient id={light} cx="50%" cy="42%" r="58%">
          <stop offset="0" stopColor="var(--ui-accent)" stopOpacity=".1" />
          <stop offset="1" stopColor="var(--ui-accent)" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}><path d="M210 450H990L1200 650V720H0V650Z" /></clipPath>
      </defs>
      <path d="M0 0H1200V720H0Z" fill="var(--ui-raised)" />
      <path d="M180 50H1020L990 450H210Z" fill={`url(#${wall})`} />
      <path d="M0 0L180 50L210 450L0 650Z M1200 0L1020 50L990 450L1200 650Z" fill="var(--ui-border)" opacity=".16" />
      <path d="M210 450H990L1200 650V720H0V650Z" fill={`url(#${floor})`} />
      <g className="ui-model-backdrop__structure">
        <path d="M0 0L180 50H1020L1200 0 M180 50L210 450H990L1020 50 M210 450L0 650 M990 450L1200 650" />
        <path d="M320 60V430 M460 60V430 M600 60V430 M740 60V430 M880 60V430 M200 150H1000 M205 250H995 M210 350H990" opacity=".35" />
        <g clipPath={`url(#${clip})`}>
          <path d="M600 330L-500 900 M600 330L-100 900 M600 330L240 900 M600 330V900 M600 330L960 900 M600 330L1300 900 M600 330L1700 900" />
          <path d="M0 486H1200 M0 532H1200 M0 592H1200 M0 672H1200" />
        </g>
      </g>
      <path d="M0 0H1200V720H0Z" fill={`url(#${light})`} />
      <g className="ui-model-backdrop__field">
        <ellipse cx="600" cy="535" rx="252" ry="78" />
        <ellipse cx="600" cy="535" rx="195" ry="60" opacity=".45" />
        <path d="M320 535H350 M850 535H880 M600 440V457 M600 613V630" />
      </g>
      <g className="ui-model-backdrop__flow">
        <path d="M180 50L210 450L0 650 M1020 50L990 450L1200 650" />
        <ellipse cx="600" cy="535" rx="252" ry="78" />
      </g>
    </svg>
  </div>;
}

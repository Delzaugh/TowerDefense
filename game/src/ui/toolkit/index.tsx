import { useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react';
import { useTheme } from './ThemeProvider';
import type { ThemePreference } from './theme';
import './toolkit.css';

export { ThemeProvider, useTheme } from './ThemeProvider';
export { GameTopBar, type GameTopBarProps } from './GameTopBar';
export { ModelPreviewBackdrop } from './ModelPreviewBackdrop';
export { PageAtmosphere } from './PageAtmosphere';
export type { ThemePreference, ResolvedTheme } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; ref?: Ref<HTMLButtonElement> };
const classes = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');

export function Button({ variant = 'secondary', className, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} className={classes('ui-button', `ui-button--${variant}`, className)} />;
}

export function IconButton({ variant = 'secondary', className, ...props }: ButtonProps & { 'aria-label': string }) {
  return <Button {...props} variant={variant} className={classes('ui-icon-button', className)} />;
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return <div {...props} className={classes('ui-surface', className)} />;
}

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input {...props} type={type} className={classes(type === 'checkbox' || type === 'radio' ? 'ui-checkbox' : 'ui-input', className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select {...props} className={classes('ui-input', className)} />;
}

interface SegmentedControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string; icon?: ReactNode; disabled?: boolean }[];
  disabled?: boolean;
  className?: string;
}
export function SegmentedControl({ label, value, onChange, options, disabled, className }: SegmentedControlProps) {
  return <div role="group" aria-label={label} className={classes('ui-segments', className)}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={option.value === value}
      disabled={disabled || option.disabled} onClick={() => onChange(option.value)}>
      {option.icon && <span aria-hidden="true">{option.icon}</span>}{option.label}
    </button>)}
  </div>;
}

export function StatGauge({ label, value, max = 100, caption, tone = 'accent', icon, className, showValue = true, segments, valueText }: {
  label: string; value: number; max?: number; caption?: string; tone?: 'accent' | 'positive' | 'attention'; icon?: ReactNode; className?: string;
  showValue?: boolean; segments?: number; valueText?: string;
}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const segmentCount = segments && Number.isFinite(segments) ? Math.min(100, Math.max(1, Math.floor(segments))) : 0;
  return <div className={classes('ui-gauge', `ui-gauge--${tone}`, className)}>
    <div className="ui-gauge__heading"><span>{icon && <span aria-hidden="true">{icon}</span>}{label}</span>{showValue && <strong>{Number.isFinite(value) ? value : 0}</strong>}</div>
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue} aria-valuetext={valueText} className={classes('ui-gauge__track', segmentCount ? 'ui-gauge__track--segments' : undefined)}>
      {segmentCount ? Array.from({ length: segmentCount }, (_, index) => <span key={index} data-filled={index < Math.round(safeValue / safeMax * segmentCount)} />) : <span style={{ width: `${safeValue / safeMax * 100}%` }} />}
    </div>
    {caption && <div className="ui-gauge__caption">{caption}</div>}
  </div>;
}

export function StatusBadge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'attention' | 'danger'; className?: string }) {
  return <span className={classes('ui-badge', `ui-badge--${tone}`, className)}>{children}</span>;
}

export function ThemePicker({ className }: { className?: string }) {
  const { preference, setPreference, notice } = useTheme();
  const id = useId();
  return <div className={classes('ui-field', className)}>
    <label htmlFor={id}>Appearance</label>
    <Select id={id} value={preference} onChange={event => setPreference(event.target.value as ThemePreference)} aria-describedby={notice ? `${id}-notice` : undefined}>
      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
    </Select>
    {notice && <p id={`${id}-notice`} role="status" className="ui-field__notice">{notice}</p>}
  </div>;
}

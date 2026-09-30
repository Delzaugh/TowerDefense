import type { HTMLAttributes, ReactNode } from 'react';
import './game-top-bar.css';

export interface GameTopBarProps extends HTMLAttributes<HTMLElement> {
  leading: ReactNode;
  location: string;
  context?: string;
  trailing?: ReactNode;
  presentation?: 'surface' | 'world';
}

/** Screen chrome only: callers supply real actions and current game context. */
export function GameTopBar({ leading, location, context, trailing, presentation = 'surface', className, ...props }: GameTopBarProps) {
  return <header {...props} className={['ui-game-topbar', `ui-game-topbar--${presentation}`, className].filter(Boolean).join(' ')}>
    <div className="ui-game-topbar__leading">{leading}</div>
    <div className="ui-game-topbar__context"><strong>{location}</strong>{context && <span>{context}</span>}</div>
    <div className="ui-game-topbar__trailing">{trailing}</div>
  </header>;
}

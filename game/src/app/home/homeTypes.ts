import type { RefCallback, RefObject } from 'react';
import type { CampusView, CampusViewState } from '../../rendering/campus/types';
import type { HomePreferences } from '../../persistence/homePreferences';
export type { HomePreferences } from '../../persistence/homePreferences';

export interface HomeStatus {
  readonly phase: 'loading' | 'ready' | 'error' | 'fallback';
  readonly loaded: number;
  readonly total: number;
  readonly message: string;
  readonly reloadRequired?: boolean;
}

export interface HomeViewProps {
  readonly canvasKey: number;
  readonly canvasRef: RefCallback<HTMLCanvasElement>;
  readonly status: HomeStatus;
  readonly view: CampusViewState;
  readonly preferences: HomePreferences;
  readonly systemReducedMotion: boolean;
  readonly preferenceNotice: string;
  readonly onRetry: () => void;
  readonly onFallback: () => void;
  readonly onView: (view: CampusView) => void;
  readonly onZoom: (factor: number) => void;
  readonly onReset: () => void;
  readonly onPreferences: (preferences: HomePreferences) => void;
  readonly browserOpen: boolean;
  readonly browserEntering: boolean;
  readonly browserReturning: boolean;
  readonly inspectButtonRef: RefObject<HTMLButtonElement | null>;
  readonly onInspectTowers: () => void;
  readonly onInspectFocus: (focused: boolean) => void;
  readonly hoveredBuildingPoint: { readonly x: number; readonly y: number } | null;
}

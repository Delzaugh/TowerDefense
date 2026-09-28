export type CampusView = 'home' | 'top';
export interface CampusViewState { readonly view: CampusView; readonly zoom: number }
export interface CampusLoadProgress { readonly loaded: number; readonly total: number }
export type CampusBuildingId = 'copilot-lab';

export interface CampusScene {
  selectView(view: CampusView): void;
  zoomBy(factor: number): void;
  resetView(): void;
  setPaused(paused: boolean): void;
  setReducedMotion(reduced: boolean): void;
  setInteractionEnabled?(enabled: boolean): void;
  setBuildingFocus?(building: CampusBuildingId | null): void;
  playBuildingReveal?(): Promise<boolean>;
  playBuildingReturn?(): Promise<boolean>;
  restoreBuildingReveal?(): void;
  resize(): void;
  dispose(): void;
}

export interface CampusSceneOptions {
  readonly signal: AbortSignal;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly onProgress: (progress: CampusLoadProgress) => void;
  readonly onError: (error: Error) => void;
  readonly onViewChange: (state: CampusViewState) => void;
  readonly onBuildingActivate?: (building: CampusBuildingId) => void;
  readonly onBuildingHover?: (building: CampusBuildingId | null, point?: { readonly x: number; readonly y: number }) => void;
}

export type CampusSceneFactory = (canvas: HTMLCanvasElement, options: CampusSceneOptions) => Promise<CampusScene>;

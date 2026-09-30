/** This standalone player has no simulation, campaign or save dependencies. */
export interface StoryFrame {
  readonly time: number;
  readonly duration: number;
  readonly shot: string;
  readonly speaker: string | null;
  readonly caption: string;
  readonly finished: boolean;
}

export interface StorySceneOptions {
  readonly signal: AbortSignal;
  readonly reducedMotion: boolean;
  readonly paused: boolean;
  readonly onProgress: (loaded: number, total: number) => void;
  readonly onFrame: (frame: StoryFrame) => void;
  readonly onError: (error: Error) => void;
}

export interface StoryScene {
  setPaused(paused: boolean): void;
  setReducedMotion(reduced: boolean): void;
  seek(seconds: number): void;
  resize(): void;
  dispose(): void;
}

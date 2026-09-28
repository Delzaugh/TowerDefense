export type AnimationChoice = 'rest' | 'idle' | 'work' | 'move' | 'place' | 'hit' | 'resolve';

export type ShowcaseStatus = {
  phase: 'loading' | 'resolving' | 'placing' | 'ready' | 'missing' | 'error';
  animations: readonly AnimationChoice[];
  message?: string;
};

export interface TowerShowcaseScene {
  setTower(id: string): void;
  selectAnimation(choice: AnimationChoice): void;
  orbit(horizontal: number, vertical: number): void;
  zoomBy(factor: number): void;
  resetView(): void;
  resize(): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

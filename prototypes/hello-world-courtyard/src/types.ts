export type Persona = 'base' | 'developer' | 'tester';
export type Mode = 'auto' | 'build' | 'defend';
export type Phase = 'preparation' | 'active' | 'paused' | 'cleared' | 'failed' | 'complete';
export interface Point { x: number; z: number }
export interface TowerView extends Point { id: number; persona: Persona; mode: Mode; range: number; targetId: number | null }
export interface EntityView extends Point { id: number; kind: 'work' | 'problem'; facing: number; remaining: number; maximum: number; progress: number; slowed: boolean }
export interface DraftState { phase: Phase; round: number; roundCount: number; roundName: string; roundHint: string; workCount: number; bugCount: number; compute: number; health: number; maxHealth: number; completed: number; resolved: number; missed: number; debt: number; time: number; speed: 1 | 2; towers: readonly TowerView[]; entities: readonly EntityView[] }
export interface Result { accepted: boolean; reason?: string }
export interface DraftEvent { type: string; towerId?: number; entityId?: number; amount?: number; compute?: number }
export interface DraftController { state(): DraftState; update(timestamp: number): void; place(point: Point): Result; preview(point: Point): Result; specialize(id: number, persona: 'developer' | 'tester'): Result; setMode(id: number, mode: Mode): Result; start(): Result; pause(): Result; next(): Result; reset(): void; setSpeed(speed: 1 | 2): Result; coverage(point: Point, target: Point): boolean; events(): DraftEvent[] }
export type UIAction = { type: 'place' } | { type: 'cancel' } | { type: 'start' } | { type: 'pause' } | { type: 'next' } | { type: 'reset' } | { type: 'suggested' } | { type: 'camera'; view: 'iso' | 'top' } | { type: 'zoom'; direction: 'in' | 'out' | 'fit' } | { type: 'specialize'; persona: 'developer' | 'tester' } | { type: 'mode'; mode: Mode } | { type: 'speed'; speed: 1 | 2 } | { type: 'coverage'; enabled: boolean };
export interface UIState { game: DraftState; selected: TowerView | null; placing: boolean; coverage: boolean; camera: 'iso' | 'top'; loading: number; loadError?: string; notice: string }
export interface DraftUI { update(state: UIState): void; toast(message: string): void; destroy(): void }

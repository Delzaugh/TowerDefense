/** Runtime-only shared effect, also used by the Asset Inspector. */
declare module 'tower-presentation' {
  import type * as THREE from 'three';
  export interface ResolveBudget {
    readonly used: number;
    readonly maxFragments: number;
    acquire(owner: object, requested: number): number;
    release(owner: object): void;
  }
  export function createResolveBudget(maxFragments?: number): ResolveBudget;
  export function createDigitalResolve(three: typeof THREE, model: THREE.Object3D, options: { budget: ResolveBudget }): {
    object: THREE.Group;
    prepare(): void;
    setState(clip: string | null, time?: number, duration?: number): void;
    dispose(): void;
  } | null;
}

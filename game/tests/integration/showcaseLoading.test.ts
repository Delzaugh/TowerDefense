import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchShowcaseModel } from '../../src/rendering/showcase/loadModel';
import { withDeadline } from '../../src/app/boot/withDeadline';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('bounded showcase loading', () => {
  it('times out a stalled download and aborts its request', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_url, options: RequestInit) => { signal = options.signal!; return new Promise(() => {}); }));
    const pending = fetchShowcaseModel({ url: '/model.glb' }, new AbortController().signal, { parseAsync: vi.fn() }, 100);
    const rejected = expect(pending).rejects.toThrow('too long');
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('disposes a late decode after its deadline and permits a fresh request', async () => {
    vi.useFakeTimers();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const dispose = vi.spyOn(geometry, 'dispose');
    const scene = new THREE.Group(); scene.add(new THREE.Mesh(geometry, material));
    const model = { scene, scenes: [scene], animations: [] } as unknown as GLTF;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ArrayBuffer(0))));
    let resolve!: (model: GLTF) => void;
    const parseAsync = vi.fn(() => new Promise<GLTF>(done => { resolve = done; }));
    const pending = fetchShowcaseModel({ url: '/model.glb' }, new AbortController().signal, { parseAsync }, 100);
    const rejected = expect(pending).rejects.toThrow('too long');
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    resolve(model);
    await vi.advanceTimersByTimeAsync(0);
    expect(dispose).toHaveBeenCalledOnce();
    const fresh = { scene: new THREE.Group(), scenes: [], animations: [] } as unknown as GLTF;
    expect(await fetchShowcaseModel({ url: '/model.glb' }, new AbortController().signal, { parseAsync: async () => fresh })).toBe(fresh);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors cancellation and bounds a stalled screen import', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    controller.abort(new Error('Closed'));
    await expect(fetchShowcaseModel({ url: '/model.glb' }, controller.signal, { parseAsync: vi.fn() })).rejects.toThrow('Closed');
    const pending = withDeadline(new Promise(() => {}), 100);
    const rejected = expect(pending).rejects.toThrow('reload');
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});

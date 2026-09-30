import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTowerShowcaseScene } from '../../src/rendering/showcase/createTowerShowcaseScene';
import type { ShowcaseStatus } from '../../src/rendering/showcase/types';

const { cameras, subjects } = vi.hoisted(() => ({ cameras: [] as THREE.OrthographicCamera[], subjects: [] as THREE.Scene[] }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof THREE>();
  return { ...actual, WebGLRenderer: class {
    shadowMap = {};
    info = { autoReset: true, reset() {} };
    setPixelRatio() {} setClearColor() {} setSize() {} setScissorTest() {}
    setViewport() {} setScissor() {} clear() {} clearDepth() {} dispose() {}
    render(scene: THREE.Scene, camera: THREE.OrthographicCamera) { cameras.push(camera.clone()); subjects.push(scene); }
  } };
});
vi.mock('../../src/rendering/showcase/assets', () => {
  const clips = [{ name: 'idle', playback: 'loop' }, { name: 'place', playback: 'once' }, { name: 'resolve', playback: 'once' }];
  return {
    SHOWCASE_TOWERS: { small: { url: '/small.glb', clips }, tall: { url: '/tall.glb', clips } },
  };
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); cameras.length = 0; subjects.length = 0; });

function fixture(tall: boolean): GLTF {
  const scene = new THREE.Group();
  const height = tall ? 3.5 : 1.08;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, height, 2.5), new THREE.MeshStandardMaterial());
  body.name = 'body'; body.position.y = height / 2; scene.add(body);
  const animations = ['place', 'resolve', 'idle'].map(name => new THREE.AnimationClip(name, .15,
    [new THREE.NumberKeyframeTrack('body.position[x]', [0, .15], [0, 0])]));
  return { scene, scenes: [scene], animations } as unknown as GLTF;
}

async function setup(reducedMotion: boolean) {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 0, time = 100;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++next, callback); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
  vi.stubGlobal('window', Object.assign(new EventTarget(), { devicePixelRatio: 1 }));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(new Uint8Array([url.includes('tall') ? 1 : 0]))));
  vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockImplementation(async data => fixture(new Uint8Array(data as ArrayBuffer)[0] === 1));
  const canvas = Object.assign(new EventTarget(), {
    clientWidth: 1280, clientHeight: 720,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  }) as unknown as HTMLCanvasElement;
  const viewport = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 290, top: 220, width: 560, height: 400 }),
  }) as unknown as HTMLElement;
  const statuses: ShowcaseStatus['phase'][] = [];
  const scene = await createTowerShowcaseScene(canvas, { viewport, reducedMotion,
    onStatus: status => statuses.push(status.phase), onAnimationChange: vi.fn() });
  const draw = () => {
    time += 60;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(time));
  };
  const select = async (id: string) => {
    scene.setTower(id);
    await vi.waitFor(() => {
      draw();
      expect(statuses.at(-1)).toBe(id === 'missing' ? 'missing' : 'ready');
    });
    draw();
  };
  const view = () => {
    const camera = cameras.at(-1)!;
    return { projection: camera.projectionMatrix.toArray(), pose: camera.matrixWorld.toArray(), zoom: camera.zoom };
  };
  return { scene, select, draw, view, statuses };
}

describe('shared Tower preview framing', () => {
  it.each([false, true])('preserves metre scale and manual orbit/zoom across Tower swaps (reduced motion: %s)', async reducedMotion => {
    const { scene, select, draw, view, statuses } = await setup(reducedMotion);
    try {
      await select('small');
      const initial = view();
      await select('tall');
      expect(view().projection).toEqual(initial.projection);
      expect(view().zoom).toBe(initial.zoom);
      expect(subjects.at(-1)!.getObjectByName('preview_plinth')).toBeUndefined();
      expect(subjects.at(-1)!.getObjectByName('showcase_tall')!.children[0]!.scale.toArray()).toEqual([1, 1, 1]);

      scene.orbit(.6, .24); scene.zoomBy(1.15); draw();
      const adjusted = view();
      expect(adjusted).not.toEqual(initial);
      cameras.length = 0;
      await select('small');
      expect(view().projection).toEqual(adjusted.projection);
      expect(view().zoom).toBe(adjusted.zoom);
      // Projection remains stable through Resolve / Place; the rest-centre pivot
      // follows the incoming subject, keeping close inspection on the model.
      for (let index = 0; index < cameras.length; index++) {
        expect(cameras[index]!.projectionMatrix.toArray()).toEqual(adjusted.projection);
      }
      const small = view();
      await select('missing');
      expect(view()).toEqual(small);
      await select('tall');
      expect(view()).toEqual(adjusted);
      scene.resetView(); draw();
      expect(view().projection).toEqual(initial.projection);
      expect(view().zoom).toBe(initial.zoom);
      if (!reducedMotion) expect(statuses).toEqual(expect.arrayContaining(['resolving', 'placing']));
    } finally { scene.dispose(); }
  });

  it('allows close inspection past the old fit limit and keeps the rest centre in view', async () => {
    const { scene, select, draw, view } = await setup(true);
    try {
      await select('small');
      const original = view();
      scene.zoomBy(100); draw();
      expect(view().zoom).toBe(6);
      expect(view().pose).toEqual(original.pose);
      const centre = new THREE.Vector3(0, 1.08 / 2, 0).project(cameras.at(-1)!);
      expect(centre.x).toBeCloseTo(0);
      expect(centre.y).toBeCloseTo(0);
      scene.zoomBy(0); scene.zoomBy(NaN); draw();
      expect(view().zoom).toBe(6);
      scene.zoomBy(.001); draw();
      expect(view().zoom).toBe(.65);
      scene.resetView(); draw();
      expect(view()).toEqual(original);
      expect(fetch).not.toHaveBeenCalledWith('/room.glb', expect.anything());
    } finally { scene.dispose(); }
  });
});

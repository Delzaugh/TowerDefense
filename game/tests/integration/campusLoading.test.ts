import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCampusModels } from '../../src/rendering/campus/loadModels';
import { disposeSceneResources } from '../../src/rendering/campus/resources';

vi.mock('../../src/rendering/campus/assets', () => ({
  CAMPUS_ASSETS: Object.fromEntries(Array.from({ length: 25 }, (_, index) => [
    `test_${index}`, { id: `test_${index}`, version: 'v01', url: `/test_${index}.glb` },
  ])),
  COPILOT_ASSET: { id: 'copilot_base', version: 'v02', url: '/copilot.glb' },
  RESIDENT_ASSETS: [],
}));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function parsedModel() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(geometry, material));
  const disposeGeometry = vi.spyOn(geometry, 'dispose');
  const disposeMaterial = vi.spyOn(material, 'dispose');
  return { gltf: { scene, scenes: [scene], animations: [] } as unknown as GLTF, disposeGeometry, disposeMaterial };
}

describe('campus model loading', () => {
  it('reports each completed asset and returns the full pinned set', async () => {
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockImplementation(async () => parsedModel().gltf);
    const fetchMock = vi.fn(async () => new Response(new ArrayBuffer(0)));
    vi.stubGlobal('fetch', fetchMock);
    const progress: Array<[number, number]> = [];
    const models = await loadCampusModels(new AbortController().signal, ({ loaded, total }) => progress.push([loaded, total]));
    expect(fetchMock).toHaveBeenCalledTimes(26);
    expect(models.size).toBe(26);
    expect(progress).toEqual(Array.from({ length: 27 }, (_, loaded) => [loaded, 26]));
    disposeSceneResources([], models.values());
  });

  it('bounds fetch/parse work and discards completed and late models after abort', async () => {
    const pending: Array<(model: GLTF) => void> = [];
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockImplementation(() => new Promise(resolve => pending.push(resolve)));
    const fetchMock = vi.fn(async () => new Response(new ArrayBuffer(0)));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const progress: Array<[number, number]> = [];
    const loading = loadCampusModels(controller.signal, ({ loaded, total }) => progress.push([loaded, total]));
    await vi.waitFor(() => expect(pending).toHaveLength(4));
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const first = parsedModel();
    pending[0]!(first.gltf);
    await vi.waitFor(() => expect(pending).toHaveLength(5));
    expect(progress).toEqual([[0, 26], [1, 26]]);
    const late = Array.from({ length: 4 }, parsedModel);
    controller.abort();
    for (let index = 1; index < pending.length; index++) pending[index]!(late[index - 1]!.gltf);
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    expect(progress).toEqual([[0, 26], [1, 26]]);
    expect(first.disposeGeometry).toHaveBeenCalledTimes(1);
    expect(first.disposeMaterial).toHaveBeenCalledTimes(1);
    for (const model of late) {
      expect(model.disposeGeometry).toHaveBeenCalledTimes(1);
      expect(model.disposeMaterial).toHaveBeenCalledTimes(1);
    }
  });
});

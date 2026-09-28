import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { RuntimeAsset } from '../runtimeAsset';
import { CAMPUS_ASSETS, COPILOT_ASSET, RESIDENT_ASSETS } from './assets';
import { disposeSceneResources } from './resources';
import type { CampusLoadProgress } from './types';

const MAX_CONCURRENT_LOADS = 4;

function cancelled(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new DOMException('Campus loading was cancelled.', 'AbortError');
}

function assertActive(signal: AbortSignal): void {
  if (signal.aborted) throw cancelled(signal);
}

/** Fetch the exact pinned asset set with bounded work and real completed-asset progress. */
export async function loadCampusModels(
  signal: AbortSignal,
  onProgress: (progress: CampusLoadProgress) => void,
): Promise<Map<string, GLTF>> {
  const assets: RuntimeAsset[] = [...Object.values(CAMPUS_ASSETS), COPILOT_ASSET, ...RESIDENT_ASSETS];
  const models = new Map<string, GLTF>();
  const loader = new GLTFLoader();
  let next = 0;
  let loaded = 0;
  let firstError: unknown;
  assertActive(signal);
  onProgress({ loaded, total: assets.length });

  async function worker(): Promise<void> {
    while (!signal.aborted && !firstError) {
      const index = next++;
      const asset = assets[index];
      if (!asset) return;
      try {
        const response = await fetch(asset.url, { signal });
        if (!response.ok) throw new Error(`Could not load ${asset.id}@${asset.version} (HTTP ${response.status}).`);
        const bytes = await response.arrayBuffer();
        assertActive(signal);
        const baseUrl = asset.url.slice(0, asset.url.lastIndexOf('/') + 1);
        const model = await loader.parseAsync(bytes, baseUrl);
        if (signal.aborted || firstError) {
          disposeSceneResources([], [model]);
          assertActive(signal);
          return;
        }
        models.set(asset.id, model);
        loaded += 1;
        onProgress({ loaded, total: assets.length });
      } catch (error) {
        if (!firstError) firstError = error;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_LOADS, assets.length) }, () => worker()));
  if (signal.aborted || firstError) {
    disposeSceneResources([], models.values());
    throw signal.aborted ? cancelled(signal) : firstError;
  }
  return models;
}

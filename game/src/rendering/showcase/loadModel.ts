import type { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeSceneResources } from '../campus/resources';

/** Bounds download and decoding; cancelled/late decodes never retain GPU resources. */
export async function fetchShowcaseModel(asset: { url: string }, signal: AbortSignal,
  loader: Pick<GLTFLoader, 'parseAsync'>, timeoutMs = 20_000,
  onLoaded?: (timings: { fetchMs: number; parseMs: number }) => void): Promise<GLTF> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  let rejectAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(controller.signal.reason ?? new DOMException('Cancelled', 'AbortError'));
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
    if (controller.signal.aborted) rejectAbort();
  });
  const deadline = setTimeout(() => controller.abort(new Error('The model took too long to load. Please retry.')), timeoutMs);
  const download = async () => {
    controller.signal.throwIfAborted();
    const fetchedAt = performance.now();
    const response = await fetch(asset.url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Model download failed (HTTP ${response.status}).`);
    const bytes = await response.arrayBuffer();
    const parsedAt = performance.now();
    controller.signal.throwIfAborted();
    const model = await loader.parseAsync(bytes, asset.url.slice(0, asset.url.lastIndexOf('/') + 1));
    const finishedAt = performance.now();
    if (controller.signal.aborted) {
      disposeSceneResources([], [model]);
      controller.signal.throwIfAborted();
    }
    onLoaded?.({ fetchMs: parsedAt - fetchedAt, parseMs: finishedAt - parsedAt });
    return model;
  };
  try { return await Promise.race([download(), aborted]); }
  finally {
    clearTimeout(deadline);
    signal.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', rejectAbort);
  }
}

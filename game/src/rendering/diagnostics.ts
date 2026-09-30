import type { WebGLRenderer } from 'three';
import { registerPerformanceSource } from '../diagnostics/performance';

interface DiagnosticsEntry {
  sample(): { calls: number; triangles: number; geometries: number; textures: number; pixelRatio: number; state: unknown };
}
declare global { interface Window { __TOWER_DIAGNOSTICS__?: Record<string, DiagnosticsEntry> } }

/** Shared read-only counters also consumed by the performance test scene. */
export function rendererMetrics(renderer: WebGLRenderer, state: () => unknown = () => undefined) {
  return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0, pixelRatio: renderer.getPixelRatio(),
    bufferWidth: renderer.domElement.width, bufferHeight: renderer.domElement.height, state: state() };
}

/** Explicit opt-in, read-only sampling; no renderer objects or mutation hooks escape. */
export function registerRendererDiagnostics(name: string, renderer: WebGLRenderer, state: () => unknown): () => void {
  if (!new URLSearchParams(window.location?.search ?? '').has('diagnostics')) return () => undefined;
  const registry = window.__TOWER_DIAGNOSTICS__ ??= {};
  const entry: DiagnosticsEntry = { sample: () => ({
    calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    pixelRatio: renderer.getPixelRatio(), state: state(),
  }) };
  registry[name] = entry;
  return () => {
    if (registry[name] === entry) delete registry[name];
    if (!Object.keys(registry).length && window.__TOWER_DIAGNOSTICS__ === registry) delete window.__TOWER_DIAGNOSTICS__;
  };
}

export function trackRendererPerformance(name: string, renderer: WebGLRenderer, state: () => unknown) {
  return registerPerformanceSource(name, 'renderer', () => rendererMetrics(renderer, state));
}

import type { WebGLRenderer } from 'three';

interface DiagnosticsEntry {
  sample(): { calls: number; triangles: number; geometries: number; textures: number; pixelRatio: number; state: unknown };
}
declare global { interface Window { __TOWER_DIAGNOSTICS__?: Record<string, DiagnosticsEntry> } }

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

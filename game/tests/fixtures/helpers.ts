import { foundationProbe } from '../../src/content/definitions/foundationProbe';
import { parseScenario } from '../../src/content/schemas/scenario';
import type { FrameHost } from '../../src/session/createSession';

export const scenario = (durationTicks = 600) => parseScenario({ ...foundationProbe, durationTicks });

export function fakeHost() {
  let id = 0;
  let hidden = false;
  const frames = new Map<number, (time: number) => void>();
  const visibility = new Set<() => void>();
  const host: FrameHost = {
    requestFrame(callback) { frames.set(++id, callback); return id; },
    cancelFrame(key) { frames.delete(key); },
    isHidden: () => hidden,
    onVisibilityChange(callback) { visibility.add(callback); return () => { visibility.delete(callback); }; },
  };
  return {
    host,
    frame(time: number) {
      const current = [...frames.values()]; frames.clear();
      for (const callback of current) callback(time);
    },
    hide(value: boolean) { hidden = value; for (const callback of visibility) callback(); },
    frameCount: () => frames.size,
    listenerCount: () => visibility.size,
  };
}

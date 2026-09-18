import type { FrameHost } from './createSession';

export const browserHost: FrameHost = {
  requestFrame: callback => window.requestAnimationFrame(callback),
  cancelFrame: id => window.cancelAnimationFrame(id),
  isHidden: () => document.hidden,
  onVisibilityChange(callback) {
    document.addEventListener('visibilitychange', callback);
    return () => document.removeEventListener('visibilitychange', callback);
  },
};

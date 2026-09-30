export type AppRoute = 'home' | 'lab' | 'stress' | 'not-found';
export function resolveAppRoute(href: string, stressEnabled = typeof __STRESS_MAP_ENABLED__ !== 'undefined' && __STRESS_MAP_ENABLED__): AppRoute {
  const url = new URL(href);
  if (url.hash === '#/' || url.hash === '#/home') return 'home';
  if (url.hash === '#/lab') return 'lab';
  if (url.hash === '#/stress') return stressEnabled ? 'stress' : 'not-found';
  if (url.hash && url.hash !== '#') return 'not-found';
  return url.searchParams.has('lab') || url.searchParams.has('preset') || url.searchParams.has('fixture') ? 'lab' : 'home';
}

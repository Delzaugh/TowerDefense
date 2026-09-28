export type AppRoute = 'home' | 'lab' | 'not-found';
export function resolveAppRoute(href: string): AppRoute {
  const url = new URL(href);
  if (url.hash === '#/' || url.hash === '#/home') return 'home';
  if (url.hash === '#/lab') return 'lab';
  if (url.hash && url.hash !== '#') return 'not-found';
  return url.searchParams.has('lab') || url.searchParams.has('preset') || url.searchParams.has('fixture') ? 'lab' : 'home';
}

import { Component, Suspense, lazy, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { resolveAppRoute } from './routes';
import { Button } from '../ui/toolkit';

const HomeScreen = lazy(async () => ({ default: (await import('./home/HomeScreen')).HomeScreen }));
const LabScreen = lazy(async () => ({ default: (await import('./LabScreen')).LabScreen }));
const getRoute = () => resolveAppRoute(window.location.href);
function subscribeRoute(changed: () => void) {
  window.addEventListener('hashchange', changed); window.addEventListener('popstate', changed);
  return () => { window.removeEventListener('hashchange', changed); window.removeEventListener('popstate', changed); };
}

export function StartupNotice({ children }: { children: ReactNode }) {
  return <main className="startup-screen"><span className="startup-brand">COPILOT <small>TOWER DEFENSE</small></span>{children}</main>;
}
class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <StartupNotice><h1>Let’s try that again.</h1><p>The application couldn’t finish opening.</p><Button variant="primary" onClick={() => window.location.reload()}>Reload app</Button><a href="#/">Return home</a></StartupNotice> : this.props.children;
  }
}
export function App() {
  const route = useSyncExternalStore(subscribeRoute, getRoute);
  return <ScreenBoundary key={route}><Suspense fallback={<StartupNotice><p role="status">Opening your campus…</p></StartupNotice>}>
    {route === 'home' ? <HomeScreen /> : route === 'lab' ? <LabScreen /> : <StartupNotice><h1>This place isn’t on the map.</h1><a href="#/">Return home</a></StartupNotice>}
  </Suspense></ScreenBoundary>;
}

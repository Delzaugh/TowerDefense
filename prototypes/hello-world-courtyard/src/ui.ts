import type { DraftUI, UIAction, UIState } from './types';

const phaseNames = {
  preparation: 'Planning', active: 'Round in progress', paused: 'Paused',
  cleared: 'Round cleared', failed: 'Product lost', complete: 'Draft complete',
} as const;
const personaNames = { base: 'Base Copilot', developer: 'Developer', tester: 'Tester' } as const;

/** Persistent DOM; reading state and dispatching intents never changes the simulation. */
export function createUI(root: HTMLElement, onAction: (action: UIAction) => void): DraftUI {
  const ui = document.createElement('div');
  ui.className = 'draft-ui';
  ui.innerHTML = `
    <header class="draft-header">
      <div class="identity"><span class="brand-mark" aria-hidden="true">H<span>W</span></span><div><h1>Hello World Courtyard</h1><p>Interactive map draft</p></div></div>
      <div class="hud" aria-label="Game status">
        <div class="hud-stat compute-stat"><span class="hud-label">Compute</span><strong data-ref="compute">100</strong></div>
        <div class="hud-stat health-stat"><span class="hud-label">Product health</span><strong data-ref="health">100 / 100</strong><span class="health-track" aria-hidden="true"><span data-ref="health-fill"></span></span></div>
        <div class="hud-stat round-stat"><span class="hud-label">Round</span><strong data-ref="round">1 / 3</strong></div>
      </div>
    </header>
    <div class="workspace">
      <div id="viewport" class="viewport" aria-label="Interactive courtyard map"><div class="scene-caption"><span class="route-key"><i></i> Shared route</span><span>Gate → Product</span></div><div class="loading-banner" data-ref="loading" role="status">Preparing courtyard…</div></div>
      <aside class="tools" aria-label="Map draft controls">
        <div class="tools-heading"><span class="phase-label" data-ref="phase">Planning</span><button type="button" class="tools-toggle" data-action="toggle-tools" aria-expanded="true" aria-controls="tools-body">Hide controls <span aria-hidden="true">⌄</span></button></div>
        <div id="tools-body" class="tools-body">
          <section class="round-brief" aria-labelledby="round-title"><h2 id="round-title" data-ref="round-name">First steps</h2><p class="wave-preview" data-ref="wave">6 Work · 2 Bugs</p><p class="round-hint" data-ref="hint">Place a few Copilots to cover the route.</p></section>
          <div class="result-banner" data-ref="result" hidden><strong data-ref="result-title"></strong><p data-ref="result-copy"></p></div>
          <div class="primary-controls"><button type="button" class="primary-button" data-action="main" data-ref="main-button">Start round</button><div class="placement-row"><button type="button" class="place-button" data-action="place" data-ref="place-button"><span>Place Base</span><span class="button-cost">30</span></button><button type="button" class="cancel-button" data-action="cancel" data-ref="cancel-button" hidden>Cancel</button></div><button type="button" class="suggested-button" data-action="suggested" data-ref="suggested-button">Try suggested team</button><p class="placement-help" data-ref="placement-help">Place on the lawns. Click a Copilot to inspect it.</p></div>
          <section class="inspector" aria-labelledby="inspector-title"><div class="section-label">Selected Copilot</div><h3 id="inspector-title" data-ref="selected-name">No Copilot selected</h3><p class="inspector-empty" data-ref="selection-help">Choose one on the map to change its focus.</p><div data-ref="selection-options" hidden><div class="mode-switch" role="group" aria-label="Copilot focus"><button type="button" data-action="mode" data-mode="auto">Auto</button><button type="button" data-action="mode" data-mode="build">Build</button><button type="button" data-action="mode" data-mode="defend">Defend</button></div><p class="mode-help" data-ref="mode-help"></p><div class="specializations" data-ref="specializations"><div class="section-label">Specialize · permanent</div><button type="button" data-action="specialize" data-persona="developer"><span>Developer</span><span class="button-cost">20</span></button><button type="button" data-action="specialize" data-persona="tester"><span>Tester</span><span class="button-cost">20</span></button></div></div></section>
          <section class="view-controls" aria-label="View controls"><div class="section-label">Explore the layout</div><div class="control-row"><div class="segmented" role="group" aria-label="Camera view"><button type="button" data-action="camera" data-view="iso">Isometric</button><button type="button" data-action="camera" data-view="top">Top view</button></div><div class="segmented speed-switch" role="group" aria-label="Simulation speed"><button type="button" data-action="speed" data-speed="1">1×</button><button type="button" data-action="speed" data-speed="2">2×</button></div></div><div class="zoom-controls" role="group" aria-label="Map zoom"><button type="button" data-action="zoom" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-action="zoom" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-action="zoom" data-zoom="fit">Fit map</button></div><label class="coverage-toggle"><input type="checkbox" data-ref="coverage" checked><span>Show coverage</span></label></section>
          <div class="outcomes" aria-label="Round outcomes"><div><strong data-ref="completed">0</strong><span>Work built</span></div><div><strong data-ref="resolved">0</strong><span>Bugs fixed</span></div><div><strong data-ref="missed">0</strong><span>Missed</span></div></div>
          <button type="button" class="reset-button" data-action="reset">Reset draft</button>
        </div>
      </aside>
    </div>
    <footer class="draft-footer"><p>Three layout test rounds; balance is provisional.</p><p class="notice" data-ref="notice" role="status" aria-live="polite" aria-atomic="true">Pick a lawn and try a placement.</p></footer>
  `;
  root.append(ui);
  const refs = new Map<string, HTMLElement>();
  ui.querySelectorAll<HTMLElement>('[data-ref]').forEach(el => refs.set(el.dataset.ref!, el));
  const ref = (name: string) => refs.get(name)!;
  const buttons = [...ui.querySelectorAll<HTMLButtonElement>('button[data-action]')];
  let state: UIState | null = null;
  let collapsed = false;
  let lastNotice = '';
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function setText(name: string, value: string | number) {
    const el = ref(name); const text = String(value);
    if (el.textContent !== text) el.textContent = text;
  }
  function show(name: string, visible: boolean) {
    const el = ref(name);
    if (el.hidden === visible) el.hidden = !visible;
  }
  function pressed(button: HTMLButtonElement, value: boolean) {
    const next = String(value);
    if (button.getAttribute('aria-pressed') !== next) button.setAttribute('aria-pressed', next);
  }
  function toast(message: string) {
    setText('notice', message);
    ref('notice').classList.toggle('has-notice', Boolean(message));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      setText('notice', state?.notice || 'Pick a lawn and try a placement.');
      ref('notice').classList.remove('has-notice');
      toastTimer = undefined;
    }, 5000);
  }
  function click(event: MouseEvent) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || !ui.contains(button) || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'toggle-tools') {
      collapsed = !collapsed;
      ui.classList.toggle('tools-collapsed', collapsed);
      button.setAttribute('aria-expanded', String(!collapsed));
      button.innerHTML = `${collapsed ? 'Show' : 'Hide'} controls <span aria-hidden="true">${collapsed ? '⌃' : '⌄'}</span>`;
      return;
    }
    if (!state) return;
    if (action === 'main') {
      const phase = state.game.phase;
      onAction({ type: phase === 'active' || phase === 'paused' ? 'pause' : phase === 'cleared' ? 'next' : phase === 'failed' || phase === 'complete' ? 'reset' : 'start' });
    } else if (action === 'mode') onAction({ type: 'mode', mode: button.dataset.mode as 'auto' | 'build' | 'defend' });
    else if (action === 'camera') onAction({ type: 'camera', view: button.dataset.view as 'iso' | 'top' });
    else if (action === 'zoom') onAction({ type: 'zoom', direction: button.dataset.zoom as 'in' | 'out' | 'fit' });
    else if (action === 'speed') onAction({ type: 'speed', speed: Number(button.dataset.speed) as 1 | 2 });
    else if (action === 'specialize') onAction({ type: 'specialize', persona: button.dataset.persona as 'developer' | 'tester' });
    else if (action === 'place' || action === 'cancel' || action === 'suggested' || action === 'reset') onAction({ type: action });
  }
  function change(event: Event) {
    if (event.target === ref('coverage')) onAction({ type: 'coverage', enabled: (event.target as HTMLInputElement).checked });
  }
  ui.addEventListener('click', click);
  ui.addEventListener('change', change);

  function update(next: UIState) {
    state = next;
    const game = next.game;
    const loading = next.loading < 1;
    const editable = !loading && (game.phase === 'preparation' || game.phase === 'active');
    const ended = game.phase === 'failed' || game.phase === 'complete';
    setText('compute', Math.floor(game.compute));
    setText('health', `${game.health} / ${game.maxHealth}`);
    setText('round', `${Math.min(game.round, game.roundCount)} / ${game.roundCount}`);
    const fill = `${Math.max(0, Math.min(100, game.health / game.maxHealth * 100))}%`;
    if (ref('health-fill').style.width !== fill) ref('health-fill').style.width = fill;
    ref('health-fill').classList.toggle('low-health', game.health <= game.maxHealth * .3);
    setText('phase', loading ? 'Loading the map' : phaseNames[game.phase]);
    ui.dataset.phase = game.phase;
    setText('round-name', game.roundName);
    setText('wave', `${game.workCount} Work · ${game.bugCount} Bugs`);
    setText('hint', game.roundHint);
    const primary = loading ? 'Preparing map…' : ({ preparation: 'Start round', active: 'Pause round', paused: 'Resume round', cleared: 'Next round', failed: 'Retry draft', complete: 'Play again' } as const)[game.phase];
    setText('main-button', primary);
    show('loading', loading);
    if (loading) setText('loading', next.loadError ?? `Preparing courtyard… ${Math.round(Math.max(0, next.loading) * 100)}%`);
    show('cancel-button', next.placing);
    show('suggested-button', game.phase === 'preparation' && game.towers.length === 0);
    ref('place-button').classList.toggle('is-placing', next.placing);
    ref('place-button').setAttribute('aria-pressed', String(next.placing));
    setText('placement-help', next.placing ? 'Click a valid lawn to place a Base Copilot. Esc cancels.' : game.phase === 'paused' ? 'Resume to place or adjust Copilots.' : ended ? 'Reset to test another team or placement.' : game.phase === 'cleared' ? 'Continue to the next round to adjust your team.' : 'Place on the lawns. Click a Copilot to inspect it.');
    show('result', ended || game.phase === 'cleared');
    if (ended || game.phase === 'cleared') {
      setText('result-title', game.phase === 'complete' ? 'Courtyard tested!' : game.phase === 'failed' ? 'Try a new arrangement' : 'Ready for the next test');
      setText('result-copy', game.phase === 'complete' ? `All ${game.roundCount} rounds complete. ${game.completed} Work built and ${game.resolved} Bugs fixed. Try another layout.` : game.phase === 'failed' ? `${game.completed} Work built · ${game.resolved} Bugs fixed · ${game.missed} missed. Cover the last bend for a second chance.` : `${game.entities.length === 0 ? 'Route clear.' : 'Round finished.'} ${game.completed} Work built and ${game.resolved} Bugs fixed so far.`);
    }
    const selected = next.selected;
    setText('selected-name', selected ? `${personaNames[selected.persona]} #${selected.id}` : 'No Copilot selected');
    show('selection-help', !selected);
    show('selection-options', Boolean(selected));
    show('specializations', selected?.persona === 'base');
    if (selected) setText('mode-help', selected.mode === 'auto' ? 'Auto balances Work and Bugs in range.' : selected.mode === 'build' ? 'Build focuses on completing Work.' : 'Defend focuses on fixing Bugs.');
    const coverage = ref('coverage') as HTMLInputElement;
    if (coverage.checked !== next.coverage) coverage.checked = next.coverage;
    coverage.disabled = loading;
    setText('completed', game.completed);
    setText('resolved', game.resolved);
    setText('missed', game.missed);
    buttons.forEach(button => {
      const action = button.dataset.action;
      let disabled = loading && action !== 'toggle-tools';
      if (action === 'place') disabled = !editable || game.compute < 30;
      else if (action === 'cancel') disabled = !next.placing;
      else if (action === 'suggested') disabled = loading || game.phase !== 'preparation' || game.towers.length > 0;
      else if (action === 'mode') {
        disabled = !editable || !selected;
        pressed(button, selected?.mode === button.dataset.mode);
      } else if (action === 'specialize') disabled = !editable || selected?.persona !== 'base' || game.compute < 20;
      else if (action === 'camera') pressed(button, next.camera === button.dataset.view);
      else if (action === 'speed') {
        disabled = loading || ended || game.phase === 'cleared' || game.phase === 'paused';
        pressed(button, String(game.speed) === button.dataset.speed);
      }
      if (button.disabled !== disabled) button.disabled = disabled;
    });
    if (next.notice !== lastNotice) {
      lastNotice = next.notice;
      if (next.notice) toast(next.notice);
      else if (!toastTimer) setText('notice', 'Pick a lawn and try a placement.');
    }
  }
  return { update, toast, destroy() { if (toastTimer) clearTimeout(toastTimer); ui.removeEventListener('click', click); ui.removeEventListener('change', change); ui.remove(); } };
}

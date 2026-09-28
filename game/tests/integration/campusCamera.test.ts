import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CAMPUS_HOME_FOCUS } from '../../src/content/maps/campusHome';
import { createCampusCamera } from '../../src/rendering/campus/camera';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup(reduced = false) {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++next, callback); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
  const captured = new Set<number>();
  const canvas = Object.assign(new EventTarget(), {
    style: { touchAction: 'auto' }, clientWidth: 1200, clientHeight: 800,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }),
    setPointerCapture: (id: number) => captured.add(id),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  }) as unknown as HTMLCanvasElement;
  const camera = new THREE.OrthographicCamera(-15, 15, 11, -11, .1, 160);
  const draw = vi.fn();
  const controls = createCampusCamera(canvas, { setSize: vi.fn() } as unknown as THREE.WebGLRenderer, camera, draw, vi.fn(), reduced);
  const advance = (time: number) => {
    now = time;
    const pending = [...callbacks.values()]; callbacks.clear();
    pending.forEach(callback => callback(now));
  };
  return { controls, camera, callbacks, advance, draw, canvas, captured };
}

describe('campus camera transitions', () => {
  it('pinches and pans around the fingers, continues one-finger pan, and clears cancellation', () => {
    const { controls, camera, canvas, captured } = setup(true);
    const emit = (type: string, id: number, x: number, y: number) => canvas.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
      pointerId: id, clientX: x, clientY: y, button: 0, pointerType: 'touch', isPrimary: id === 1,
    }));
    emit('pointerdown', 1, 500, 400); emit('pointerdown', 2, 700, 400);
    emit('pointermove', 2, 800, 400);
    expect(camera.zoom).toBeCloseTo(1.5);
    const zoomed = camera.position.clone();
    emit('pointermove', 1, 550, 430); emit('pointermove', 2, 850, 430);
    expect(camera.zoom).toBeCloseTo(1.5);
    expect(camera.position.equals(zoomed)).toBe(false);
    emit('pointerup', 2, 850, 430);
    const before = camera.position.clone();
    emit('pointermove', 1, 570, 430);
    expect(camera.position.equals(before)).toBe(false);
    emit('pointercancel', 1, 570, 430);
    expect(captured.size).toBe(0);
    const cancelled = camera.position.clone();
    emit('pointermove', 1, 900, 430);
    expect(camera.position.equals(cancelled)).toBe(true);
    controls.dispose();
  });

  it('eases orientation and framing around a fixed focus without an initial jump', () => {
    const { controls, camera, advance, callbacks } = setup();
    const home = camera.position.clone();
    const homeRotation = camera.quaternion.clone();
    const startSpan = camera.top;
    controls.selectView('top');
    expect(camera.position.equals(home)).toBe(true);
    advance(350);
    expect(camera.quaternion.angleTo(homeRotation)).toBeGreaterThan(.1);
    expect(camera.position.distanceTo(new THREE.Vector3(...CAMPUS_HOME_FOCUS))).toBeCloseTo(80);
    expect(camera.top).toBeGreaterThan(startSpan);
    expect(camera.top).toBeLessThan(90);
    advance(700);
    expect(camera.position.y).toBeCloseTo(81.6);
    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.z).toBeCloseTo(CAMPUS_HOME_FOCUS[2]);
    expect(camera.top).toBeCloseTo(90);
    expect(callbacks.size).toBe(0);
    controls.dispose();
  });

  it('retargets from the current pose and cancels pending work on disposal', () => {
    const { controls, camera, advance, callbacks, draw, canvas } = setup();
    controls.selectView('top'); advance(200);
    const midway = camera.quaternion.clone();
    controls.selectView('home');
    expect(camera.quaternion.angleTo(midway)).toBeCloseTo(0);
    expect(callbacks.size).toBe(1);
    controls.dispose();
    const draws = draw.mock.calls.length;
    advance(900);
    expect(draw).toHaveBeenCalledTimes(draws);
    expect(callbacks.size).toBe(0);
    expect(canvas.style.touchAction).toBe('auto');
  });

  it('honors reduced motion initially and when enabled during a transition', () => {
    const { controls, camera, advance, callbacks } = setup(true);
    controls.selectView('top');
    expect(camera.position.y).toBeCloseTo(81.6);
    expect(callbacks.size).toBe(0);
    controls.setReducedMotion(false);
    controls.selectView('home'); advance(200);
    controls.setReducedMotion(true);
    expect(camera.position.y).toBeCloseTo(1.6 + 80 * Math.sin(.64));
    expect(callbacks.size).toBe(0);
    controls.zoomBy(2);
    controls.resetView();
    expect(camera.zoom).toBe(1);
    controls.dispose();
  });

  it('suspends a running camera transition without changing the current pose', () => {
    const { controls, camera, advance, callbacks } = setup();
    controls.selectView('top'); advance(250);
    const position = camera.position.clone();
    const rotation = camera.quaternion.clone();
    controls.setInteractionEnabled(false);
    expect(callbacks.size).toBe(0);
    advance(800);
    controls.zoomBy(2);
    controls.resetView();
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    controls.setInteractionEnabled(true);
    expect(camera.position.equals(position)).toBe(true);
    controls.dispose();
  });
});

describe('campus building gesture ownership', () => {
  function setupBuilding() {
    const { controls: original, canvas, draw, camera, callbacks } = setup(true);
    original.dispose();
    const hitAt = vi.fn<(x: number, y: number) => 'copilot-lab' | null>(() => 'copilot-lab');
    const onHover = vi.fn();
    const onActivate = vi.fn();
    const controls = createCampusCamera(canvas, { setSize: vi.fn() } as unknown as THREE.WebGLRenderer,
      camera, draw, vi.fn(), true, { hitAt, onHover, onActivate });
    const emit = (type: string, x = 600, y = 400, id = 1, primary = true) => {
      const event = Object.assign(new Event(type, { cancelable: true }),
        { clientX: x, clientY: y, pointerId: id, isPrimary: primary, button: 0 });
      canvas.dispatchEvent(event);
    };
    return { controls, canvas, callbacks, hitAt, onHover, onActivate, emit };
  }

  it('activates only after primary down and up on the same building within four pixels', () => {
    const { controls, emit, hitAt, onActivate } = setupBuilding();
    emit('pointermove'); emit('pointerdown'); emit('pointerup', 603, 400);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith('copilot-lab');
    hitAt.mockReturnValueOnce('copilot-lab').mockReturnValueOnce(null);
    emit('pointerdown'); emit('pointerup');
    expect(onActivate).toHaveBeenCalledTimes(1);
    emit('pointerdown', 600, 400, 2, false); emit('pointerup', 600, 400, 2, false);
    expect(onActivate).toHaveBeenCalledTimes(1);
    controls.dispose();
  });

  it('cancels activation on pan, cancellation, second contact, or suspension', () => {
    const { controls, emit, onActivate, callbacks } = setupBuilding();
    emit('pointerdown'); emit('pointermove', 605, 400); emit('pointerup', 605, 400);
    emit('pointerdown'); emit('pointercancel');
    emit('pointerdown'); emit('pointerdown', 610, 400, 2, false); emit('pointerup');
    emit('pointerdown'); controls.setInteractionEnabled(false); emit('pointerup');
    controls.selectView('top');
    expect(onActivate).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
    controls.setInteractionEnabled(true);
    emit('pointerdown'); emit('pointerup');
    expect(onActivate).toHaveBeenCalledOnce();
    controls.dispose();
  });
});

describe('Lab reveal camera transition', () => {
  function revealSetup(reduced = false) {
    const { controls: original, canvas, camera, draw, advance, callbacks } = setup(reduced);
    original.dispose();
    const controls = createCampusCamera(canvas, { setSize: vi.fn() } as unknown as THREE.WebGLRenderer,
      camera, draw, vi.fn(), reduced, {
        hitAt: () => null, onHover: vi.fn(), onActivate: vi.fn(),
        focusAt: () => new THREE.Vector3(-2, 5, -2),
      });
    return { controls, camera, advance, callbacks };
  }

  it('pushes toward the Lab then restores the exact pre-entry pose and zoom', async () => {
    const { controls, camera, advance, callbacks } = revealSetup();
    controls.zoomBy(1.4);
    const position = camera.position.clone();
    const rotation = camera.quaternion.clone();
    const up = camera.up.clone();
    const zoom = camera.zoom;
    controls.setInteractionEnabled(false);
    const finished = controls.playBuildingReveal();
    advance(300);
    expect(camera.zoom).toBeGreaterThan(zoom);
    expect(camera.position.equals(position)).toBe(false);
    advance(600);
    expect(await finished).toBe(true);
    expect(callbacks.size).toBe(0);
    controls.restoreBuildingReveal();
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    expect(camera.up.equals(up)).toBe(true);
    expect(camera.zoom).toBe(zoom);
    controls.dispose();
  });

  it('cancels pending frames and restores on interruption or disposal', async () => {
    const { controls, camera, advance, callbacks } = revealSetup();
    const position = camera.position.clone();
    const pending = controls.playBuildingReveal();
    advance(200);
    controls.restoreBuildingReveal();
    expect(await pending).toBe(false);
    expect(callbacks.size).toBe(0);
    expect(camera.position.equals(position)).toBe(true);
    const second = controls.playBuildingReveal();
    controls.dispose();
    expect(await second).toBe(false);
    expect(callbacks.size).toBe(0);
  });

  it('uses an immediate reveal when motion is reduced', async () => {
    const { controls, camera, callbacks } = revealSetup(true);
    const position = camera.position.clone();
    expect(await controls.playBuildingReveal()).toBe(true);
    expect(camera.position.equals(position)).toBe(true);
    expect(callbacks.size).toBe(0);
    controls.restoreBuildingReveal();
    controls.dispose();
  });

  it('finishes an active reveal when reduced motion turns on', async () => {
    const { controls, camera, advance, callbacks } = revealSetup();
    const position = camera.position.clone();
    const pending = controls.playBuildingReveal();
    advance(150);
    controls.setReducedMotion(true);
    expect(await pending).toBe(true);
    expect(callbacks.size).toBe(0);
    controls.restoreBuildingReveal();
    expect(camera.position.equals(position)).toBe(true);
    controls.dispose();
  });

  it('animates back to the exact saved camera pose', async () => {
    const { controls, camera, advance, callbacks } = revealSetup();
    controls.zoomBy(1.3);
    const position = camera.position.clone();
    const rotation = camera.quaternion.clone();
    const up = camera.up.clone();
    const zoom = camera.zoom;
    const entering = controls.playBuildingReveal();
    advance(600);
    expect(await entering).toBe(true);
    const approachedZoom = camera.zoom;
    const returning = controls.playBuildingReturn();
    advance(875);
    expect(camera.zoom).toBeLessThan(approachedZoom);
    expect(camera.zoom).toBeGreaterThan(zoom);
    advance(1150);
    expect(await returning).toBe(true);
    expect(callbacks.size).toBe(0);
    expect(camera.position.equals(position)).toBe(true);
    expect(camera.quaternion.equals(rotation)).toBe(true);
    expect(camera.up.equals(up)).toBe(true);
    expect(camera.zoom).toBe(zoom);
    controls.dispose();
  });

  it('snaps home when return is cancelled, hidden, or motion becomes reduced', async () => {
    const { controls, camera, advance, callbacks } = revealSetup();
    const position = camera.position.clone();
    let entering = controls.playBuildingReveal();
    advance(600); await entering;
    let returning = controls.playBuildingReturn();
    advance(750);
    controls.restoreBuildingReveal();
    expect(await returning).toBe(false);
    expect(camera.position.equals(position)).toBe(true);
    expect(callbacks.size).toBe(0);
    entering = controls.playBuildingReveal();
    advance(1350); await entering;
    returning = controls.playBuildingReturn();
    advance(1450);
    controls.setReducedMotion(true);
    expect(await returning).toBe(true);
    expect(camera.position.equals(position)).toBe(true);
    expect(callbacks.size).toBe(0);
    controls.dispose();
  });
});

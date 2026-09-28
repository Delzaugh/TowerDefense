import * as THREE from 'three';
import { CAMPUS_HOME_FOCUS } from '../../content/maps/campusHome';
import type { CampusBuildingId, CampusScene, CampusView, CampusViewState } from './types';

type CameraControls = Pick<CampusScene, 'selectView' | 'zoomBy' | 'resetView' | 'resize' | 'dispose' | 'setReducedMotion'> & {
  setInteractionEnabled(enabled: boolean): void;
  playBuildingReveal(): Promise<boolean>;
  playBuildingReturn(): Promise<boolean>;
  restoreBuildingReveal(): void;
};
interface BuildingControls {
  readonly hitAt: (x: number, y: number) => CampusBuildingId | null;
  readonly onHover: (building: CampusBuildingId | null, point?: { readonly x: number; readonly y: number }) => void;
  readonly onActivate: (building: CampusBuildingId) => void;
  readonly focusAt?: () => THREE.Vector3 | null;
}
interface CameraPose {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly up: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly zoom: number;
  readonly span: number;
  readonly framingWidth: number;
  readonly view: CampusView;
}
type ViewSpec = { readonly azimuth?: number; readonly elevation?: number; readonly span: number; readonly width: number; readonly top?: true };

const VIEWS: Readonly<Record<CampusView, ViewSpec>> = {
  home: { azimuth: .78, elevation: .64, span: 124, width: 176 },
  top: { top: true, span: 180, width: 102 },
};

export function createCampusCamera(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  camera: THREE.OrthographicCamera,
  draw: () => void,
  onViewChange: (view: CampusViewState) => void,
  initiallyReducedMotion = false,
  buildings?: BuildingControls,
): CameraControls {
  const target = new THREE.Vector3(...CAMPUS_HOME_FOCUS);
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2);
  const originalTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';
  let view: CampusView = 'home';
  let disposed = false;
  let interactionEnabled = true;
  let reducedMotion = initiallyReducedMotion;
  let span = VIEWS.home.span;
  let framingWidth = VIEWS.home.width;
  let frame = 0;
  let hovered: CampusBuildingId | null = null;
  const setHover = (building: CampusBuildingId | null, point?: { readonly x: number; readonly y: number }) => {
    if (hovered === building) return;
    hovered = building;
    buildings?.onHover(building, point);
  };
  let finishTransition: (() => void) | undefined;
  let revealFrame = 0;
  let revealResolve: ((completed: boolean) => void) | null = null;
  let finishReveal: (() => void) | null = null;
  let returnFrame = 0;
  let returnResolve: ((completed: boolean) => void) | null = null;
  let finishReturn: (() => void) | null = null;
  let savedPose: CameraPose | null = null;
  const stopTransition = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    finishTransition = undefined;
  };
  const pointers = new Map<number, { x: number; y: number }>();
  const ownerDocument = canvas.ownerDocument;
  const hostWindow = ownerDocument?.defaultView;
  let drag: { id: number; point: THREE.Vector3; x: number; y: number; moved: boolean; building: CampusBuildingId | null } | null = null;

  const report = () => onViewChange({ view, zoom: camera.zoom });
  const groundAt = (x: number, y: number): THREE.Vector3 | null => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), camera);
    return raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
  };
  const panBy = (delta: THREE.Vector3) => {
    const next = target.clone().add(delta);
    next.set(THREE.MathUtils.clamp(next.x, -55, 55), 1.6, THREE.MathUtils.clamp(next.z, -85, 85));
    camera.position.add(next.clone().sub(target));
    target.copy(next);
    camera.updateMatrixWorld();
  };
  const setZoom = (zoom: number, pointer?: { x: number; y: number }) => {
    if (disposed || !interactionEnabled || !Number.isFinite(zoom)) return;
    setHover(null);
    stopTransition();
    const before = pointer ? groundAt(pointer.x, pointer.y) : null;
    const next = THREE.MathUtils.clamp(zoom, .7, 10);
    if (next === camera.zoom) return;
    camera.zoom = next;
    camera.updateProjectionMatrix();
    if (before && pointer) {
      const after = groundAt(pointer.x, pointer.y);
      if (after) panBy(before.sub(after));
    }
    report();
    draw();
  };
  const updateProjection = () => {
    if (disposed) return;
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    const aspect = width / height;
    const fittedSpan = Math.max(span, framingWidth / aspect);
    camera.left = -fittedSpan * aspect / 2;
    camera.right = fittedSpan * aspect / 2;
    camera.top = fittedSpan / 2;
    camera.bottom = -fittedSpan / 2;
    camera.updateProjectionMatrix();
  };
  const restoreBuildingReveal = () => {
    if (revealFrame) cancelAnimationFrame(revealFrame);
    if (returnFrame) cancelAnimationFrame(returnFrame);
    revealFrame = 0;
    returnFrame = 0;
    const resolve = revealResolve;
    const resolveReturn = returnResolve;
    revealResolve = null;
    returnResolve = null;
    finishReveal = null;
    finishReturn = null;
    resolve?.(false);
    resolveReturn?.(false);
    if (!savedPose) return;
    const pose = savedPose;
    savedPose = null;
    view = pose.view;
    target.copy(pose.target);
    camera.position.copy(pose.position);
    camera.quaternion.copy(pose.quaternion);
    camera.up.copy(pose.up);
    camera.zoom = pose.zoom;
    span = pose.span;
    framingWidth = pose.framingWidth;
    camera.updateMatrixWorld();
    updateProjection();
    if (!disposed) { report(); draw(); }
  };
  const playBuildingReveal = (): Promise<boolean> => {
    if (disposed || revealResolve || returnResolve || savedPose) return Promise.resolve(false);
    stopTransition();
    const focus = buildings?.focusAt?.();
    if (!focus) return Promise.resolve(true);
    savedPose = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone(),
      target: target.clone(), zoom: camera.zoom, span, framingWidth, view };
    if (reducedMotion) return Promise.resolve(true);
    const start = savedPose;
    const destinationZoom = Math.min(10, start.zoom * 4.2);
    const offset = focus.clone().sub(start.target);
    const apply = (fraction: number) => {
      const eased = fraction * fraction * (3 - 2 * fraction);
      target.copy(start.target).addScaledVector(offset, eased);
      camera.position.copy(start.position).addScaledVector(offset, eased);
      camera.zoom = THREE.MathUtils.lerp(start.zoom, destinationZoom, eased);
      camera.updateMatrixWorld();
      updateProjection();
      draw();
    };
    return new Promise<boolean>(resolve => {
      revealResolve = resolve;
      const complete = () => {
        if (revealFrame) cancelAnimationFrame(revealFrame);
        revealFrame = 0;
        finishReveal = null;
        apply(1);
        revealResolve = null;
        resolve(true);
      };
      finishReveal = complete;
      const started = performance.now();
      const animate = (now: number) => {
        revealFrame = 0;
        if (disposed || !revealResolve) return;
        const fraction = Math.min(1, Math.max(0, (now - started) / 600));
        if (fraction >= 1) { complete(); return; }
        apply(fraction);
        revealFrame = requestAnimationFrame(animate);
      };
      revealFrame = requestAnimationFrame(animate);
    });
  };
  const playBuildingReturn = (): Promise<boolean> => {
    if (disposed || returnResolve) return Promise.resolve(false);
    if (!savedPose) return Promise.resolve(true);
    if (revealResolve) { restoreBuildingReveal(); return Promise.resolve(true); }
    if (reducedMotion) { restoreBuildingReveal(); return Promise.resolve(true); }
    const destination = savedPose;
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone(),
      up: camera.up.clone(), target: target.clone(), zoom: camera.zoom, span, framingWidth };
    const apply = (fraction: number) => {
      const eased = fraction * fraction * (3 - 2 * fraction);
      target.lerpVectors(from.target, destination.target, eased);
      camera.position.lerpVectors(from.position, destination.position, eased);
      camera.quaternion.slerpQuaternions(from.quaternion, destination.quaternion, eased);
      camera.up.lerpVectors(from.up, destination.up, eased);
      camera.zoom = THREE.MathUtils.lerp(from.zoom, destination.zoom, eased);
      span = THREE.MathUtils.lerp(from.span, destination.span, eased);
      framingWidth = THREE.MathUtils.lerp(from.framingWidth, destination.framingWidth, eased);
      camera.updateMatrixWorld();
      updateProjection();
      draw();
    };
    return new Promise<boolean>(resolve => {
      returnResolve = resolve;
      const complete = () => {
        if (returnFrame) cancelAnimationFrame(returnFrame);
        returnFrame = 0;
        returnResolve = null;
        finishReturn = null;
        restoreBuildingReveal();
        resolve(true);
      };
      finishReturn = complete;
      const started = performance.now();
      const animate = (now: number) => {
        returnFrame = 0;
        if (disposed || !returnResolve) return;
        const fraction = Math.min(1, Math.max(0, (now - started) / 550));
        if (fraction >= 1) { complete(); return; }
        apply(fraction);
        returnFrame = requestAnimationFrame(animate);
      };
      returnFrame = requestAnimationFrame(animate);
    });
  };
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    updateProjection();
    renderer.setSize(width, height, false);
    draw();
  };
  const moveTo = (name: CampusView, reset = false, immediate = false) => {
    if (disposed || !interactionEnabled) return;
    setHover(null);
    const spec = VIEWS[name];
    if (!spec) return;
    stopTransition();
    view = name;
    const destination = camera.clone();
    const endTarget = reset ? new THREE.Vector3(...CAMPUS_HOME_FOCUS) : target.clone();
    destination.up.set(0, spec.top ? 0 : 1, spec.top ? -1 : 0);
    if (spec.top) destination.position.set(endTarget.x, endTarget.y + 80, endTarget.z);
    else {
      const azimuth = spec.azimuth ?? 0;
      const elevation = spec.elevation ?? 0;
      destination.position.set(
        endTarget.x + 80 * Math.cos(elevation) * Math.sin(azimuth),
        endTarget.y + 80 * Math.sin(elevation),
        endTarget.z + 80 * Math.cos(elevation) * Math.cos(azimuth),
      );
    }
    destination.lookAt(endTarget);
    const startRotation = camera.quaternion.clone();
    const startTarget = target.clone();
    const startSpan = span;
    const startWidth = framingWidth;
    const startZoom = camera.zoom;
    const endZoom = reset ? 1 : startZoom;
    const apply = (t: number) => {
      target.lerpVectors(startTarget, endTarget, t);
      camera.quaternion.slerpQuaternions(startRotation, destination.quaternion, t);
      // Orbit around the focus at a constant distance, including at the top pole.
      camera.position.set(0, 0, 80).applyQuaternion(camera.quaternion).add(target);
      camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camera.zoom = THREE.MathUtils.lerp(startZoom, endZoom, t);
      span = THREE.MathUtils.lerp(startSpan, spec.span, t);
      framingWidth = THREE.MathUtils.lerp(startWidth, spec.width, t);
      camera.updateMatrixWorld();
      updateProjection();
      report();
      draw();
    };
    report();
    if (immediate || reducedMotion) { apply(1); return; }
    const started = performance.now();
    finishTransition = () => { stopTransition(); apply(1); };
    const animate = (now: number) => {
      frame = 0;
      if (disposed || !interactionEnabled) return;
      const t = Math.min(1, Math.max(0, (now - started) / 700));
      apply(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(animate);
      else finishTransition = undefined;
    };
    frame = requestAnimationFrame(animate);
  };
  const selectView = (name: CampusView) => moveTo(name);
  const resetView = () => {
    if (disposed || !interactionEnabled) return;
    moveTo(view, true);
  };
  const zoomBy = (factor: number) => {
    if (factor > 0) setZoom(camera.zoom * factor);
  };
  const onWheel = (event: WheelEvent) => {
    if (!interactionEnabled || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    setZoom(camera.zoom * Math.exp(-THREE.MathUtils.clamp(delta, -200, 200) * .0018), { x: event.clientX, y: event.clientY });
  };
  const resetGesture = () => {
    const ids = [...pointers.keys()];
    pointers.clear();
    drag = null;
    setHover(null);
    for (const id of ids) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  };
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) } : null;
  };
  const onPointerDown = (event: PointerEvent) => {
    if (!interactionEnabled || event.button !== 0 || (!event.isPrimary && event.pointerType !== 'touch' && !pointers.size)) return;
    if (pointers.size >= 2) { resetGesture(); return; }
    stopTransition();
    const point = groundAt(event.clientX, event.clientY);
    if (!point) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      drag = { id: event.pointerId, point, x: event.clientX, y: event.clientY, moved: false, building: buildings?.hitAt(event.clientX, event.clientY) ?? null };
    } else { drag = null; setHover(null); }
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!interactionEnabled) return;
    if (!pointers.has(event.pointerId)) {
      if (!pointers.size && event.pointerType !== 'touch') setHover(buildings?.hitAt(event.clientX, event.clientY) ?? null, { x: event.clientX, y: event.clientY });
      return;
    }
    const before = pair();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = pair();
    if (before && after) {
      const anchor = groundAt(before.x, before.y);
      if (before.distance > 0 && after.distance > 0) setZoom(camera.zoom * after.distance / before.distance, before);
      const point = groundAt(after.x, after.y);
      if (anchor && point) panBy(anchor.sub(point));
      draw();
    } else if (drag?.id === event.pointerId) {
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
      drag.moved = true;
      setHover(null);
      const point = groundAt(event.clientX, event.clientY);
      if (point) panBy(drag.point.clone().sub(point));
      draw();
    }
    event.preventDefault();
  };
  const onPointerEnd = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    if (event.type !== 'pointerup') { resetGesture(); return; }
    const activated = interactionEnabled && drag?.id === event.pointerId && !drag.moved && drag.building &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4 && buildings?.hitAt(event.clientX, event.clientY) === drag.building
      ? drag.building : null;
    pointers.delete(event.pointerId);
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    // Continue panning with the remaining finger, but never turn a pinch into a tap.
    const remaining = [...pointers.entries()][0];
    if (remaining) {
      const [id, position] = remaining;
      const point = groundAt(position.x, position.y);
      if (point) drag = { id, point, ...position, moved: true, building: null };
    }
    if (activated) buildings?.onActivate(activated);
  };
  const onPointerLeave = () => { if (!pointers.size) setHover(null); };
  const onVisibilityChange = () => { if (ownerDocument?.hidden) resetGesture(); };
  // The first draw can fail during WebGL startup; attach input only after it succeeds.
  try { moveTo('home', false, true); resize(); }
  catch (error) { canvas.style.touchAction = originalTouchAction; throw error; }
  hostWindow?.addEventListener('blur', resetGesture);
  ownerDocument?.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  canvas.addEventListener('lostpointercapture', onPointerEnd);
  canvas.addEventListener('pointerleave', onPointerLeave);
  return {
    selectView, zoomBy, resetView, resize,
    setReducedMotion(value) { reducedMotion = value; if (value) { finishTransition?.(); finishReveal?.(); finishReturn?.(); } },
    playBuildingReveal,
    playBuildingReturn,
    restoreBuildingReveal,
    setInteractionEnabled(value) {
      interactionEnabled = value;
      if (!value) {
        stopTransition();
        resetGesture();
        draw();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopTransition();
      restoreBuildingReveal();
      hostWindow?.removeEventListener('blur', resetGesture);
      ownerDocument?.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      canvas.removeEventListener('lostpointercapture', onPointerEnd);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      resetGesture();
      canvas.style.touchAction = originalTouchAction;
    },
  };
}

import * as THREE from 'three';

const GRID = 34;
const CURRENT_COUNT = 6;
const PERIOD = 36;
const DURATION = 10;
const angle = 31 * Math.PI / 180;
const cos = Math.cos(angle), sin = Math.sin(angle);
const origins = [[.13, .23], [.78, .15], [.12, .68], [.73, .79], [.4, .13], [.88, .51]] as const;

/** Each route rests for 26 seconds; no more than two currents run together. */
export function digitalCurrentState(index: number, time: number) {
  const phase = ((time + 2 - index * PERIOD / CURRENT_COUNT) % PERIOD + PERIOD) % PERIOD;
  return {
    distance: phase < DURATION ? phase / DURATION * GRID * 10 : -1,
    opacity: phase < DURATION ? Math.min(1, phase, DURATION - phase) : 0,
  };
}

/** Screen-space currents sit behind the floating world; all motion uses the scene clock. */
export function createCampusAtmosphere(island: THREE.Group, initiallyReduced = false) {
  let elapsed = 0, reduced = initiallyReduced, disposed = false;
  const restPosition = island.position.clone();
  const restRotation = island.quaternion.clone();
  const tilt = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const uniforms = {
    resolution: { value: new THREE.Vector2(1, 1) },
    routes: { value: origins.map(() => new THREE.Vector4()) },
    heads: { value: new Float32Array(CURRENT_COUNT) },
    fades: { value: new Float32Array(CURRENT_COUNT) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    vertexShader: `
      varying vec2 screenUv;
      void main() {
        screenUv = uv;
        // Far depth keeps opaque campus geometry in front in every camera view.
        gl_Position = vec4(position.xy, 0.99999, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec2 resolution;
      uniform vec4 routes[6];
      uniform float heads[6];
      uniform float fades[6];
      varying vec2 screenUv;
      const float grid = 34.0;
      const float leg = grid * 5.0;
      const float branch = grid * 3.0;

      float trail(float distanceToLine, float behind) {
        float tail = step(0.0, behind) * (1.0 - smoothstep(0.0, grid * 2.0, behind));
        float core = 1.0 - smoothstep(0.45, 1.1, distanceToLine);
        float glow = exp(-distanceToLine * distanceToLine / 13.0);
        return tail * (core * 0.27 + glow * 0.065);
      }

      void main() {
        vec2 screen = vec2(screenUv.x, 1.0 - screenUv.y) * resolution;
        vec2 centred = screen - resolution * 0.5;
        vec2 p = vec2(${cos.toFixed(8)} * centred.x - ${sin.toFixed(8)} * centred.y,
                      ${sin.toFixed(8)} * centred.x + ${cos.toFixed(8)} * centred.y);
        vec2 cell = abs(mod(p + grid * 0.5, grid) - grid * 0.5);
        float gridLine = 1.0 - smoothstep(0.3, 0.9, min(cell.x, cell.y));
        float light = 0.0;
        for (int i = 0; i < 6; i++) {
          if (heads[i] < 0.0 || fades[i] <= 0.0) continue;
          vec2 local = (p - routes[i].xy) * routes[i].zw;
          if (mod(float(i), 2.0) > 0.5) local = local.yx;
          float alongA = clamp(local.x, 0.0, leg);
          float alongB = clamp(local.y, 0.0, branch);
          float stream = max(
            trail(length(local - vec2(alongA, 0.0)), heads[i] - alongA),
            trail(length(local - vec2(leg, alongB)), heads[i] - leg - alongB)
          );
          vec2 head = heads[i] < leg ? vec2(heads[i], 0.0) : vec2(leg, heads[i] - leg);
          float tip = heads[i] <= leg + branch ? exp(-dot(local - head, local - head) / 4.0) * 0.45 : 0.0;
          // Intersections briefly retain a soft square glow after a packet passes.
          vec2 node = floor(local / grid + 0.5) * grid;
          float onRoute = max(step(abs(node.y), 0.1) * step(0.0, node.x) * step(node.x, leg),
                              step(abs(node.x - leg), 0.1) * step(0.0, node.y) * step(node.y, branch));
          float age = heads[i] - (node.x + node.y);
          float afterglow = onRoute * step(0.0, age) * (1.0 - smoothstep(0.0, grid * 1.2, age));
          vec2 d = abs(local - node);
          float junction = (1.0 - smoothstep(1.0, 2.5, max(d.x, d.y))) * afterglow * 0.27;
          light += (stream + tip + junction) * fades[i];
        }
        float edge = 1.0 - smoothstep(0.32, 0.8, length(screenUv - 0.5));
        float alpha = gridLine * mix(0.015, 0.045, edge) + light * 0.8;
        vec3 color = mix(vec3(0.58, 0.75, 0.82), vec3(0.62, 0.94, 0.89), clamp(light * 5.0, 0.0, 1.0));
        gl_FragColor = vec4(color, min(alpha, 0.65));
      }
    `,
  });
  const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  background.name = 'Quiet digital currents';
  background.frustumCulled = false;
  background.renderOrder = -100;

  const pose = () => {
    // A common transform keeps tile edges, crossings, residents and effects aligned.
    island.position.copy(restPosition);
    island.position.y += .6 + Math.sin(elapsed * Math.PI * 2 / 16) * .28 + Math.sin(elapsed * Math.PI * 2 / 25) * .07;
    euler.set(Math.sin(elapsed * Math.PI * 2 / 27) * .0012, 0, Math.sin(elapsed * Math.PI * 2 / 22) * .0015);
    island.quaternion.copy(restRotation).multiply(tilt.setFromEuler(euler));
    for (let i = 0; i < CURRENT_COUNT; i++) {
      const state = digitalCurrentState(i, elapsed);
      uniforms.heads.value[i] = state.distance;
      uniforms.fades.value[i] = reduced ? 0 : state.opacity;
    }
  };
  pose();
  return {
    background,
    resize(width: number, height: number) {
      if (disposed) return;
      width = Math.max(1, width); height = Math.max(1, height);
      if (uniforms.resolution.value.x === width && uniforms.resolution.value.y === height) return;
      uniforms.resolution.value.set(width, height);
      for (const [i, origin] of origins.entries()) {
        const x = (origin[0] - .5) * width, y = (origin[1] - .5) * height;
        uniforms.routes.value[i]!.set(Math.round((cos * x - sin * y) / GRID) * GRID,
          Math.round((sin * x + cos * y) / GRID) * GRID, i % 3 === 1 ? -1 : 1, i % 3 === 2 ? -1 : 1);
      }
    },
    update(delta: number) {
      if (disposed || reduced || !Number.isFinite(delta) || delta <= 0) return;
      elapsed += delta;
      pose();
    },
    setReducedMotion(value: boolean) {
      if (disposed) return;
      reduced = value;
      for (let i = 0; i < CURRENT_COUNT; i++) uniforms.fades.value[i] = value ? 0 : digitalCurrentState(i, elapsed).opacity;
    },
    // The scene owner disposes the background's geometry/material with other resources.
    dispose() { disposed = true; },
  };
}

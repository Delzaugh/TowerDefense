import { parseScenario } from '../schemas/scenario';

// Engineering fixture only. These values do not define Level 1 balance or art.
export const foundationProbe = parseScenario({
  schemaVersion: 1,
  id: 'foundation_probe', version: 'v02',
  map: {
    id: 'foundation_map', version: 'v02',
    buildable: { min: { x: -10, z: -6 }, max: { x: 10, z: 6 } },
    routes: [{ id: 'main_route', width: 0.8, points: [
      { x: -8, z: 3 }, { x: -4, z: 3 }, { x: -4, z: -3 }, { x: 4, z: -3 }, { x: 4, z: 3 }, { x: 8, z: 3 },
    ] }],
    obstacles: [{ id: 'server_footprint', footprint: { min: { x: -2, z: -1 }, max: { x: 2, z: 2 } }, blocksSight: true }],
  },
  routeId: 'main_route', durationTicks: 600,
});

import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CAMPUS_HOME_PLACEMENTS, type CampusPlacement } from '../../src/content/maps/campusHome';

interface GlbNode {
  name?: string; children?: number[]; matrix?: number[];
  translation?: [number, number, number]; rotation?: [number, number, number, number]; scale?: [number, number, number];
}

function anchors(placement: CampusPlacement, pattern: RegExp) {
  const bytes = readFileSync(new URL(`../../../assets/runtime/environment/${placement.id}_v01.glb`, import.meta.url));
  const data = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) as {
    nodes: GlbNode[]; scenes: Array<{ nodes: number[] }>; scene?: number;
  };
  const result: Array<{ name: string; position: THREE.Vector3 }> = [];
  const instance = new THREE.Matrix4().compose(new THREE.Vector3(...placement.position),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), placement.rotation), new THREE.Vector3(1, 1, 1));
  const visit = (index: number, parent: THREE.Matrix4) => {
    const node = data.nodes[index]!;
    const local = node.matrix ? new THREE.Matrix4().fromArray(node.matrix) : new THREE.Matrix4().compose(
      new THREE.Vector3(...node.translation ?? [0, 0, 0]), new THREE.Quaternion(...node.rotation ?? [0, 0, 0, 1]), new THREE.Vector3(...node.scale ?? [1, 1, 1]));
    const world = parent.clone().multiply(local);
    if (node.name && pattern.test(node.name)) result.push({ name: node.name, position: new THREE.Vector3().setFromMatrixPosition(world) });
    for (const child of node.children ?? []) visit(child, world);
  };
  for (const root of data.scenes[data.scene ?? 0]!.nodes) visit(root, instance);
  return result;
}

describe('exported campus connections', () => {
  it('keeps exposed canyon floor and water normals facing upward under game shadows', () => {
    const bytes = readFileSync(new URL('../../../assets/runtime/environment/campus_tile_canyon_v01.glb', import.meta.url));
    const jsonLength = bytes.readUInt32LE(12);
    const data = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as {
      meshes: Array<{ primitives: Array<{ attributes: { POSITION: number; NORMAL: number } }> }>;
      accessors: Array<{ bufferView: number; byteOffset?: number; count: number }>;
      bufferViews: Array<{ byteOffset?: number; byteStride?: number }>;
    };
    const binary = bytes.subarray(28 + jsonLength);
    const primitive = data.meshes[0]!.primitives[0]!;
    const positions = data.accessors[primitive.attributes.POSITION]!;
    const normals = data.accessors[primitive.attributes.NORMAL]!;
    const positionView = data.bufferViews[positions.bufferView]!;
    const normalView = data.bufferViews[normals.bufferView]!;
    let exposedVertices = 0;
    for (let i = 0; i < positions.count; i++) {
      const y = binary.readFloatLE((positionView.byteOffset ?? 0) + (positions.byteOffset ?? 0) + i * (positionView.byteStride ?? 12) + 4);
      const ny = binary.readFloatLE((normalView.byteOffset ?? 0) + (normals.byteOffset ?? 0) + i * (normalView.byteStride ?? 12) + 4);
      if ((Math.abs(y - .15) < .00001 || Math.abs(y - .175) < .00001) && Math.abs(ny) > .999) {
        expect(ny).toBeGreaterThan(.999);
        exposedVertices++;
      }
    }
    expect(exposedVertices).toBeGreaterThan(20);
  });

  it('joins every occupied hex neighbor at matching exported edge anchors', () => {
    const tiles = CAMPUS_HOME_PLACEMENTS.filter(item => item.tile);
    let joins = 0;
    for (let a = 0; a < tiles.length; a++) {
      const first = anchors(tiles[a]!, /^anchor_edge_/);
      expect(first).toHaveLength(6);
      for (let b = a + 1; b < tiles.length; b++) {
        const p = tiles[a]!.position, q = tiles[b]!.position;
        if (Math.abs(Math.hypot(p[0] - q[0], p[2] - q[2]) - Math.sqrt(3) * 18) > .001) continue;
        const second = anchors(tiles[b]!, /^anchor_edge_/);
        const pairs = first.flatMap(x => second.filter(y => x.position.distanceTo(y.position) < .0001).map(() => x));
        expect(pairs, `${tiles[a]!.id} → ${tiles[b]!.id}`).toHaveLength(1);
        expect(pairs[0]!.position.y).toBeCloseTo(1.2, 5);
        joins++;
      }
    }
    expect(joins).toBe(14);
  });

  it('connects all exported walkway ports including both canyon bridge ends', () => {
    const ports = CAMPUS_HOME_PLACEMENTS.flatMap(item => {
      const pattern = item.id.startsWith('campus_walk_') ? /^anchor_(start|end|branch)$/
        : item.id === 'campus_canyon_decor' ? /^anchor_route_(north|south)$/ : null;
      return pattern ? anchors(item, pattern).map(anchor => ({ ...anchor, asset: item.id })) : [];
    });
    const open = ports.filter((port, index) => !ports.some((other, otherIndex) => index !== otherIndex && port.position.distanceTo(other.position) < .0001));
    // The sole intentionally open end enters the lab's front doorway.
    expect(open.map(port => ({ asset: port.asset, x: Math.round(port.position.x * 1000) / 1000, z: Math.round(port.position.z * 1000) / 1000 })))
      .toEqual([{ asset: 'campus_walk_straight', x: -4, z: 1 }]);
    expect(ports.filter(port => port.asset === 'campus_canyon_decor')).toHaveLength(2);
  });
});

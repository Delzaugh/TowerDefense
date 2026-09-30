"""Read-only animation, contact, rest-art and retained-action audit."""
import bpy, json, hashlib
from pathlib import Path
from mathutils import Vector

p = Path(__file__).resolve().parent
source = p/'copilot_mona_v01.blend'

def digest(value):
    return hashlib.sha256(json.dumps(value, separators=(',', ':')).encode()).hexdigest()

def action_snapshot(action):
    return sorted((curve.data_path, curve.array_index,
        [(list(k.co), list(k.handle_left), list(k.handle_right), k.interpolation) for k in curve.keyframe_points])
        for layer in action.layers for strip in layer.strips
        for bag in strip.channelbags for curve in bag.fcurves)

def art_snapshot():
    root = bpy.data.objects['root']
    meshes = {}
    for o in root.children_recursive:
        if o.type != 'MESH': continue
        meshes[o.name] = digest({
            'vertices': [list(v.co) for v in o.data.vertices],
            'faces': [(list(f.vertices), f.use_smooth, f.material_index) for f in o.data.polygons],
            'uvs': [[list(e.uv) for e in layer.data] for layer in o.data.uv_layers],
            'weights': [[(o.vertex_groups[w.group].name, w.weight) for w in v.groups] for v in o.data.vertices],
            'transform': [list(row) for row in o.matrix_world],
            'materials': [m.name for m in o.data.materials],
        })
    images = {im.name: digest(list(im.pixels[:])) for im in bpy.data.images if im.type == 'IMAGE' and im.users}
    return {'meshes': meshes, 'images': images}

bpy.ops.wm.open_mainfile(filepath=str(p/'revisions/r6_animation_model_baseline/copilot_mona_v01.blend'))
baseline_art = art_snapshot()
bpy.ops.wm.open_mainfile(filepath=str(p/'references/classic_lowpoly_base_r8.blend'))
retained = {n: action_snapshot(bpy.data.actions[n]) for n in ['idle', 'move', 'wave', 'celebrate']}
bpy.ops.wm.open_mainfile(filepath=str(source))
assert art_snapshot() == baseline_art, 'Reviewed rest art changed'
assert all(action_snapshot(bpy.data.actions[n]) == a for n, a in retained.items()), 'Classic action changed'
rig = bpy.data.objects['octocat_rig']; body = bpy.data.objects['body_five_tentacles']
scene = bpy.context.scene; root = bpy.data.objects['root']; restroot = root.matrix_world.copy()
assert rig.animation_data.action is None and all(t.mute for t in rig.animation_data.nla_tracks)
assert all(b.matrix_basis.is_identity for b in rig.pose.bones)
manifest = json.loads((p/'asset.json').read_text(encoding='utf-8'))
assert root['resolve_effect'].to_dict() == manifest['presentation']['resolve']
contacts = {}
for sign, label in [(-1, 'left'), (1, 'right')]:
    for rear in [False, True]:
        ids = [v.index for v in body.data.vertices if v.co.z < .003 and v.co.x*sign > 0 and (v.co.y > .05 if rear else v.co.y < -.20)]
        assert ids
        contacts[('rear_' if rear else 'front_')+label] = ids
result = {'sourceHash': hashlib.sha256(source.read_bytes()).hexdigest(), 'restArtUnchanged': True,
    'classicActionsUnchanged': list(retained), 'savedRestPose': True, 'effectExtrasMatch': True, 'clips': {}}
poses = {}
for name, frames in [('idle', 60), ('move', 32), ('wave', 60), ('celebrate', 48), ('work', 48), ('hit', 18), ('place', 30), ('resolve', 30)]:
    action = bpy.data.actions[name]
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    minz = 1e9; max_drift = 0; max_planted_drift = 0; heights = []; start = None; end = None; samples = []
    for f in range(frames+1):
        scene.frame_set(f+1); bpy.context.view_layer.update()
        ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); mesh = ev.to_mesh()
        coords = [ev.matrix_world@v.co for v in mesh.vertices]
        minz = min(minz, min(v.z for v in coords))
        motion = rig.pose.bones['motion'].location.y
        for label, ids in contacts.items():
            for i in ids:
                foot = rig.pose.bones['foot_'+label].location
                expected = body.data.vertices[i].co+Vector((foot.x, -foot.z, motion+foot.y))
                max_drift = max(max_drift, (coords[i]-expected).length)
                if name in ['idle', 'work', 'hit', 'wave', 'place', 'resolve']:
                    max_planted_drift = max(max_planted_drift, (coords[i]-body.data.vertices[i].co).length)
        heights.append(min(v.z for v in coords))
        if f == 0: start = [v.copy() for v in coords]
        if f == frames: end = [v.copy() for v in coords]
        assert all(abs(root.matrix_world[i][j]-restroot[i][j]) < 1e-7 for i in range(4) for j in range(4))
        samples.append([[list(b.location), list(b.rotation_euler), list(b.scale)] for b in rig.pose.bones])
        ev.to_mesh_clear()
    delta = max((a-b).length for a, b in zip(start, end))
    variation = max(abs(a-b) for pose in samples[1:] for bone, initial in zip(pose, samples[0]) for prop, initialprop in zip(bone, initial) for a, b in zip(prop, initialprop))
    result['clips'][name] = {'duration': frames/24, 'minimum_body_z': minz,
        'maximum_contact_drift_relative_to_motion': max_drift, 'maximum_planted_drift': max_planted_drift,
        'endpoint_body_delta': delta, 'maximum_floor_clearance': max(heights), 'channel_variation': variation}
    assert minz >= -.002 and max_drift <= .002 and max_planted_drift <= .002 and delta <= .002 and variation > .001, name
    poses[name] = samples
    rig.animation_data.action = None
assert max(abs(a-b) for pa, pb in zip(poses['place'], reversed(poses['resolve']))
    for ba, bb in zip(pa, pb) for va, vb in zip(ba, bb) for a, b in zip(va, vb)) < 1e-6
result['placeResolveExactReverse'] = True
result['passed'] = True
(p/'validation/animation_source_audit.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result))

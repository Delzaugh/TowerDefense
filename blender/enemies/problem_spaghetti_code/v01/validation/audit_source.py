"""Read-only audit of the delivered Blender source's saved animation state."""
import bpy
import hashlib
import json
from pathlib import Path

folder = Path(__file__).resolve().parent.parent
manifest = json.loads((folder / 'asset.json').read_text(encoding='utf-8-sig'))
asset_id = manifest['id']
rig_name = {'problem_lag_spike': 'lag_spike_rig',
            'problem_spaghetti_code': 'spaghetti_rig'}[asset_id]
source = folder / (asset_id + '_v01.blend')
runtime = folder.parents[3] / 'assets' / 'runtime' / 'enemies' / (asset_id + '_v01.glb')
bpy.ops.wm.open_mainfile(filepath=str(source))
rig = bpy.data.objects[rig_name]
root = bpy.data.objects['root']
tracks = {track.name: track for track in rig.animation_data.nla_tracks}
expected = {clip['name'] for clip in manifest['clips']}
assert set(tracks) == expected, (set(tracks), expected)
assert rig.animation_data.action is None
assert all(track.mute for track in tracks.values())
assert all(len(track.strips) == 1 and track.strips[0].action.name == name
           for name, track in tracks.items())
assert all(abs(value - target) < 1e-6
           for bone in rig.pose.bones
           for values, targets in ((bone.location, (0, 0, 0)),
                                   (bone.rotation_euler, (0, 0, 0)),
                                   (bone.scale, (1, 1, 1)))
           for value, target in zip(values, targets))
assert all(abs(value - target) < 1e-6
           for values, targets in ((root.location, (0, 0, 0)),
                                   (root.rotation_euler, (0, 0, 0)),
                                   (root.scale, (1, 1, 1)))
           for value, target in zip(values, targets))
effect = manifest['presentation']['lifecycle']
assert dict(root['lifecycle_effect']) == effect
assert effect['spawnPortal'] is False
assert all(tuple(tracks[name].strips[0].action.frame_range) == (0, 30)
           for name in ('spawn', 'resolve'))

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

report = {
    'passed': True,
    'asset': asset_id,
    'sourceHash': sha256(source),
    'sha256': sha256(runtime),
    'tracks': sorted(tracks),
    'allTracksMuted': True,
    'activeAction': None,
    'bonesInRest': True,
    'rootIdentity': True,
    'lifecycleExtrasMatchManifest': True,
    'lifecycleFrames': [0, 30],
}
output = folder / 'validation' / 'lifecycle' / 'source_audit.json'
output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))

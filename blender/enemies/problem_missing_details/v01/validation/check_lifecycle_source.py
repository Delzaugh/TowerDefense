"""Read-only audit of the delivered Blender lifecycle source."""

import bpy
import hashlib
import json
from pathlib import Path


folder = Path(__file__).resolve().parents[1]
source = folder / 'problem_missing_details_v01.blend'
rig = bpy.data.objects['missing_details_rig']
root = bpy.data.objects['root']
tracks = {track.name: track for track in rig.animation_data.nla_tracks}
expected = {'idle', 'move', 'hit', 'sit_down', 'seated', 'spawn', 'resolve'}
assert set(tracks) == expected, sorted(tracks)
assert rig.animation_data.action is None
assert all(track.mute for track in tracks.values())
assert all(len(track.strips) == 1 and track.strips[0].action.name == name
           for name, track in tracks.items())
assert all(all(abs(v) < 1e-7 for v in bone.location)
           and all(abs(v) < 1e-7 for v in bone.rotation_euler)
           and all(abs(v - 1) < 1e-7 for v in bone.scale)
           for bone in rig.pose.bones)
assert root.get('lifecycle_effect', {}).get('spawnPortal') is False
assert root['lifecycle_effect']['maxFragments'] == 10
assert [root.location.x, root.location.y, root.location.z] == [0, 0, 0]
assert bpy.context.scene.render.fps == 24
for name in ('anchor_ui', 'anchor_target'):
    assert bpy.data.objects[name].parent == root

result = {
    'sourceHash': hashlib.sha256(source.read_bytes()).hexdigest(),
    'tracks': sorted(tracks),
    'allNlaMuted': True,
    'activeAction': None,
    'restPose': True,
    'rootStationary': True,
    'anchorsParentedToRoot': ['anchor_ui', 'anchor_target'],
    'lifecycle': dict(root['lifecycle_effect']),
    'fps': bpy.context.scene.render.fps,
}
(folder / 'validation' / 'lifecycle' / 'source_audit.json').write_text(
    json.dumps(result, indent=2) + '\n', encoding='utf-8')
print('SOURCE_AUDIT', json.dumps(result))

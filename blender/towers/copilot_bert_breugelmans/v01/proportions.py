"""Ground-preserving leg/shoe refinement, with an unchanged upper assembly."""
import bpy

HIP = 1.34
NEW_HIP = HIP * .90
SHOE_TOP = .265
NEW_SHOE_TOP = SHOE_TOP * .80
UPPER_SHIFT = NEW_HIP - HIP

def height(z):
    if z <= SHOE_TOP: return z * .80
    if z >= HIP: return z + UPPER_SHIFT
    return NEW_SHOE_TOP + (z-SHOE_TOP)*(NEW_HIP-NEW_SHOE_TOP)/(HIP-SHOE_TOP)

def apply(rig):
    if rig.get('proportion_revision') == 'shorter_legs_slimmer_shoes': return
    rig.animation_data.action=None
    for track in rig.animation_data.nla_tracks: track.mute=True
    for p in rig.pose.bones: p.matrix_basis.identity()
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH' and any(m.type=='ARMATURE' and m.object==rig for m in obj.modifiers):
            hand_groups={g.index for g in obj.vertex_groups if g.name.startswith(('hand_','fingers_','digits_','thumb_'))}
            for v in obj.data.vertices:
                # New hand geometry remains rigid in its local rest frame,
                # including fingertips that extend below hip height.
                v.co.z=v.co.z+UPPER_SHIFT if any(w.group in hand_groups and w.weight>0 for w in v.groups) else height(v.co.z)
            obj.data.update()
        elif obj.name.startswith('anchor_'):
            obj.location.z=height(obj.location.z)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for bone in rig.data.edit_bones:
        if bone.name.startswith(('hand_','fingers_','digits_','thumb_')):
            bone.head.z+=UPPER_SHIFT;bone.tail.z+=UPPER_SHIFT
        else:
            bone.head.z=height(bone.head.z);bone.tail.z=height(bone.tail.z)
    bpy.ops.object.mode_set(mode='OBJECT')
    rig['proportion_revision']='shorter_legs_slimmer_shoes'
    bpy.context.view_layer.update()

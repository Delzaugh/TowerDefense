"""Quick local lighting check for the isolated Blender source, never runtime delivery."""
import os
from pathlib import Path
import bpy
from mathutils import Vector

source=Path(os.environ['VISITOR_PREVIEW_SOURCE'])
out=Path(os.environ['VISITOR_PREVIEW_DIR'])
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=480
scene.render.resolution_y=620
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('preview_world')
scene.world.color=(.38,.38,.38)

def aim(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

for name,loc,power,size in [('key',(2,-3,4),450,3),('fill',(-2,-2,2),200,4),
                            ('rim',(1,2,3),350,2)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    aim(obj,(0,0,1))
cam_data=bpy.data.cameras.new('preview_camera');cam=bpy.data.objects.new('preview_camera',cam_data)
scene.collection.objects.link(cam);scene.camera=cam
cam_data.type='ORTHO';cam_data.ortho_scale=2.18
scene.view_settings.view_transform='AgX'
for name,loc in [('front',(0,-3,1.32)),('side',(3,0,1.33)),
                 ('iso',(2.5,-3.5,2.7)),('rear',(0,3,1.33))]:
    cam.location=loc;aim(cam,(0,0,.95))
    scene.render.filepath=str(out/(name+'.png'))
    bpy.ops.render.render(write_still=True)

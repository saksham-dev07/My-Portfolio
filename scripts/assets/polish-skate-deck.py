"""Dress the existing continuous skate ramp without changing its driving surface."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
template=(ROOT/'scripts/assets/create-refined-props.py').read_text()
header=template.split("begin('bed',")[0]
header=header.replace('refined-props.blend','skate-deck.blend').replace('Saksham Refined World Props','Saksham Skate Deck').replace('refined_prop','skate_prop').replace('Refined /','Skate /')
exec(compile(header,__file__,'exec'))
asset=ROOT/'experiments/saksham-driving-world/static/saksham/models/ramp-deck.glb'
# Repeatable input is the untouched baseline, retained locally on the first run.
baseline=ROOT/'.local-history/blender-models/ramp-deck.baseline.glb'
baseline.parent.mkdir(parents=True,exist_ok=True)
if not baseline.exists():baseline.write_bytes(asset.read_bytes())
bpy.ops.import_scene.gltf(filepath=str(baseline))
original=list(bpy.context.selected_objects)
for obj in original:
    obj['skate_prop']=True
    if obj.type=='MESH':
        obj.data.materials.clear();obj.data.materials.append(materials['green' if obj.name=='RampFrame' else 'woodlight'])
def bounds(obj):
    return [obj.matrix_world@Vector(corner) for corner in obj.bound_box]
slope=bpy.data.objects.get('Ramp_Continuous_Teak_Top')
deck=bpy.data.objects.get('Deck_Continuous_Teak_Top')
bpy.context.view_layer.update()
s=bounds(slope);d=bounds(deck)
near=min(v.y for v in s);join=min(v.y for v in d);end=max(v.y for v in d)
height=max(v.z for v in d);ground=min(v.z for v in s)
begin('deck-detail',[])
incline=math.atan2(height-ground,join-near)
for i in range(1,17):
    y=near+(join-near)*i/17;z=ground+(y-near)*(height-ground)/(join-near)
    mesh('thin flush plank joint',[(-1.36,y-.006,z-.006*math.tan(incline)+.003),(1.36,y-.006,z-.006*math.tan(incline)+.003),(1.36,y+.006,z+.006*math.tan(incline)+.003),(-1.36,y+.006,z+.006*math.tan(incline)+.003)],[(0,1,2,3)],'wood')
for i in range(1,7):
    y=join+(end-join)*i/7
    mesh('landing plank joint',[(-1.36,y-.006,height+.003),(1.36,y-.006,height+.003),(1.36,y+.006,height+.003),(-1.36,y+.006,height+.003)],[(0,1,2,3)],'wood')
for x in [-1.28,1.28]:
    for i in range(1,6):
        y=near+(join-near)*i/6;z=ground+(y-near)*(height-ground)/(join-near)
        cylinder('countersunk fastener',(x,y,z+.009),.02,.009,'brass',4)
for x in [-1.47,1.47]:
    for y in [join-.6,join-1.8]:
        z=ground+(y-near)*(height-ground)/(join-near)
        beam('side panel rib',(x,y,.045),(x,y,z-.055),.015,'cream',4)
    beam('diagonal dressed side panel',(x,near+.5,.06),(x,join-.3,height-.14),.015,'brass',4)
bpy.ops.object.select_all(action='DESELECT')
for obj in original+kit['deck-detail']['parts']:obj.select_set(True)
bpy.context.view_layer.objects.active=original[0]
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),copy=True)
print({'raw':str(OUTPUT),'bytes':OUTPUT.stat().st_size,'source':str(SOURCE),'surface':{'near':near,'join':join,'end':end,'height':height}})

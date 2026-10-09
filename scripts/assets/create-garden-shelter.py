"""Editable study shelter; compact, untextured GLB for the western garden."""
import bpy
import math
import random
import json
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/garden-shelter.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\garden-shelter.blend')
scene = bpy.data.scenes.get('Saksham Garden Shelter') or bpy.data.scenes.new('Saksham Garden Shelter')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Garden Shelter Sources')
if collection is None:
    collection = bpy.data.collections.new('Garden Shelter Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

mat = bpy.data.materials.get('Garden shelter / vertex palette') or bpy.data.materials.new('Garden shelter / vertex palette')
mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .82
color_node = next((n for n in mat.node_tree.nodes if n.type == 'VERTEX_COLOR'), None) or mat.node_tree.nodes.new('ShaderNodeVertexColor')
color_node.layer_name = 'Color'
mat.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Base Color'])

STONE = (.63, .51, .36)
STONE_EDGE = (.43, .34, .25)
TIMBER = (.29, .15, .065)
TIMBER_LIGHT = (.46, .26, .11)
COPPER = (.53, .24, .10)
JOINT = (.12, .16, .15)
sources = []

def object_mesh(name, vertices, faces, color, bevel=0):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    mesh.materials.append(mat)
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    rng = random.Random(name)
    for poly in mesh.polygons:
        shade = (1 if poly.normal.z > .4 else .86 if poly.normal.z > -.3 else .72) * (.97 + .06*rng.random())
        for loop in poly.loop_indices:
            attr.data[loop].color = (*[c*shade for c in color], 1)
    if bevel:
        mod = obj.modifiers.new('Soft crafted edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        methods = [i.identifier for i in mod.bl_rna.properties['limit_method'].enum_items]
        mod.limit_method = next(i for i in methods if i == 'ANGLE')
        mod.angle_limit = math.radians(30)
    sources.append(obj)
    return obj

def prism(name, outline, z0, z1, color, bevel=0):
    count = len(outline)
    vertices = [(x,y,z0) for x,y in outline] + [(x,y,z1) for x,y in outline]
    faces = [tuple(reversed(range(count))), tuple(range(count,2*count))]
    faces.extend((i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count))
    return object_mesh(name, vertices, faces, color, bevel)

def box(name, center, size, color, bevel=.025):
    x,y,z = center
    sx,sy,sz = (v*.5 for v in size)
    return object_mesh(name, [(x+ix*sx,y+iy*sy,z+iz*sz) for iz in [-1,1] for iy in [-1,1] for ix in [-1,1]],
                       [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)], color, bevel)

def beam(name, start, end, width, depth, color, bevel=.02):
    start,end = Vector(start),Vector(end)
    direction=(end-start).normalized()
    across=Vector((0,1,0)) if abs(direction.dot(Vector((0,1,0))))<.9 else Vector((1,0,0))
    axis=direction.cross(across).normalized()
    across=axis.cross(direction).normalized()
    vertices=[]
    for p in [start,end]:
        for v,u in [(-1,-1),(-1,1),(1,1),(1,-1)]:
            vertices.append(tuple(p+across*u*width*.5+axis*v*depth*.5))
    return object_mesh(name,vertices,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],color,bevel)

def rounded_rect(width, depth, radius, steps=4):
    points=[]
    for cx,cy,start in [(width*.5-radius,depth*.5-radius,0),(-width*.5+radius,depth*.5-radius,90),(-width*.5+radius,-depth*.5+radius,180),(width*.5-radius,-depth*.5+radius,270)]:
        for n in range(steps+1):
            a=math.radians(start+n*90/steps)
            points.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
    return points

# A low, rounded terrace reads as landscape architecture rather than a box base.
prism('Terrace / dark recessed toe', rounded_rect(6.98,4.80,.62),0,.10,STONE_EDGE,.025)
prism('Terrace / dressed warm stone', rounded_rect(7.20,5.00,.72),.075,.235,STONE,.035)
prism('Terrace / front tread', [(-1.35,-2.66),(1.35,-2.66),(1.45,-2.28),(-1.45,-2.28)],0,.11,STONE,.025)

def roof_height(y):
    return 3.30 + .22*(y/2.25)**2 + .05*y

# Splayed slender supports, collar joints, and knee braces anchor the open canopy.
for ix in [-1,1]:
    for iy in [-1,1]:
        base=(ix*2.63,iy*1.72,.235)
        top=(ix*2.91,iy*1.88,roof_height(iy*1.88)-.15)
        box('Foot / %s %s'%(ix,iy),(base[0],base[1],.32),(.37,.37,.18),JOINT,.035)
        beam('Splayed timber / %s %s'%(ix,iy),base,top,.19,.25,TIMBER,.025)
        beam('Knee brace / %s %s'%(ix,iy),(ix*2.84,iy*1.83,2.72),(ix*2.27,iy*1.88,roof_height(iy*1.88)-.18),.11,.15,TIMBER_LIGHT,.018)
        beam('Copper collar / %s %s'%(ix,iy),(ix*2.89,iy*1.87,3.07),(ix*2.90,iy*1.88,3.18),.23,.29,COPPER,.015)

# Two tie beams and nineteen individually bowed ribs; the daylight gaps stay open.
for y in [-1.88,1.88]:
    beam('Roof / transverse tie %.2f'%y,(-3.10,y,roof_height(y)-.16),(3.10,y,roof_height(y)-.16),.17,.19,TIMBER,.025)

def bowed_rib(name, x, width, color, thickness=.105):
    vertices=[]
    count=5
    for index in range(count):
        y=-2.25+4.5*index/(count-1)
        z=roof_height(y)
        vertices.extend([(x-width*.5,y,z-thickness*.5),(x+width*.5,y,z-thickness*.5),(x+width*.5,y,z+thickness*.5),(x-width*.5,y,z+thickness*.5)])
    faces=[(0,3,2,1),tuple(4*(count-1)+i for i in range(4))]
    for index in range(count-1):
        a=4*index;b=a+4
        faces.extend((a+i,a+(i+1)%4,b+(i+1)%4,b+i) for i in range(4))
    # Small roof ribs retain their bowed outline; distant edge bevels add no value.
    return object_mesh(name,vertices,faces,color)

for index in range(19):
    bowed_rib('Roof / curved timber rib %02d'%index,-3.15+index*.35,.19,TIMBER_LIGHT if index%3 else TIMBER)
for x in [-3.41,3.41]:
    bowed_rib('Roof / copper edge %.2f'%x,x,.065,COPPER,.17)
for y in [-2.25,2.25]:
    beam('Roof / copper end %.2f'%y,(-3.42,y,roof_height(y)),(3.42,y,roof_height(y)),.06,.17,COPPER,.01)

# A single rear seat belongs to the shelter; no disconnected decorative benches.
for x in [-2.18,0,2.18]:
    box('Seat / stone foot %.2f'%x,(x,1.56,.395),(.29,.44,.32),STONE_EDGE,.03)
for index in range(4):
    box('Seat / timber slat %s'%index,(0,1.36+index*.135,.60),(5.24,.105,.13),TIMBER_LIGHT,.023)
for x in [-2.22,2.22]:
    beam('Seat / back upright %.2f'%x,(x,1.84,.55),(x,1.89,1.06),.075,.11,TIMBER,.015)
for height in [.82,1.0]:
    box('Seat / back slat %.2f'%height,(0,1.89,height),(5.12,.07,.13),TIMBER_LIGHT,.018)

# Export evaluated, colored geometry as one mesh; source modifiers remain editable.
vertices,faces,colors=[],[],[]
depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in sources:
    evaluated=obj.evaluated_get(depsgraph)
    mesh=bpy.data.meshes.new_from_object(evaluated)
    mesh.calc_loop_triangles()
    offset=len(vertices)
    vertices.extend(tuple(obj.matrix_world @ v.co) for v in mesh.vertices)
    attr=mesh.color_attributes.get('Color')
    for triangle in mesh.loop_triangles:
        faces.append(tuple(offset+i for i in triangle.vertices))
        colors.extend(tuple(attr.data[i].color) for i in triangle.loops)
    bpy.data.meshes.remove(mesh)
mesh=bpy.data.meshes.new('Garden shelter / export geometry')
mesh.from_pydata(vertices,[],faces)
mesh.materials.append(mat)
mesh.update()
attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
for index,color in enumerate(colors): attr.data[index].color=color
export=bpy.data.objects.new('garden-shelter',mesh)
scene.collection.objects.link(export)
bpy.ops.object.select_all(action='DESELECT')
export.select_set(True)
bpy.context.view_layer.objects.active=export
formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    enum=ExportGLTF2_Base.__annotations__['export_format'].keywords['items']
    formats=[item[0] for item in enum(None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(i for i in formats if i=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)

# glTF supports normalized 8-bit colors natively. Repack only COLOR_0 views,
# preserving position/normal precision and requiring no runtime decoder.
payload=OUTPUT.read_bytes()
json_length=struct.unpack_from('<I',payload,12)[0]
document=json.loads(payload[20:20+json_length])
binary_start=20+json_length+8
binary=payload[binary_start:]
color_accessors={primitive['attributes']['COLOR_0'] for item in document['meshes'] for primitive in item['primitives']}
color_views={document['accessors'][index]['bufferView']:index for index in color_accessors}
repacked=bytearray()
for index,view in enumerate(document['bufferViews']):
    offset=view.get('byteOffset',0)
    data=binary[offset:offset+view['byteLength']]
    if index in color_views:
        accessor=document['accessors'][color_views[index]]
        assert accessor['componentType']==5126 and accessor.get('byteOffset',0)==0 and 'byteStride' not in view
        channels=3 if accessor['type']=='VEC3' else 4
        values=struct.unpack('<%sf'%(accessor['count']*channels),data)
        data=bytes(max(0,min(255,round(value*255))) for value in values)
        accessor['componentType']=5121
        accessor['normalized']=True
    while len(repacked)%4: repacked.append(0)
    view['byteOffset']=len(repacked)
    view['byteLength']=len(data)
    repacked.extend(data)
document['buffers'][0]['byteLength']=len(repacked)
encoded=json.dumps(document,separators=(',',':')).encode()
encoded+=b' ' *((-len(encoded))%4)
repacked+=b'\x00' *((-len(repacked))%4)
length=12+8+len(encoded)+8+len(repacked)
OUTPUT.write_bytes(struct.pack('<III',0x46546C67,2,length)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(repacked),0x004E4942)+repacked)
minimum=[min(v[i] for v in vertices) for i in range(3)]
maximum=[max(v[i] for v in vertices) for i in range(3)]
print({'bytes':OUTPUT.stat().st_size,'triangles':len(faces),'editable_parts':len(sources),'bounds':{'min':minimum,'max':maximum},'palette':{'stone':STONE,'timber':TIMBER,'timber_light':TIMBER_LIGHT,'copper':COPPER,'joint':JOINT}})
bpy.data.objects.remove(export,do_unlink=True)
for obj in sources: obj.select_set(True)
bpy.context.view_layer.objects.active=sources[0]
BLEND.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),copy=True)

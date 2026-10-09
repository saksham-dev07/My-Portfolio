"""Author a compact, editable Indian chai cart in Blender; no image textures."""
import bpy
import math
import json
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/chai-cart.glb'
WORK = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e')
scene = bpy.data.scenes.get('Saksham Crafted Chai Cart') or bpy.data.scenes.new('Saksham Crafted Chai Cart')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Chai Cart / editable parts')
if collection is None:
    collection = bpy.data.collections.new('Chai Cart / editable parts')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

mat = bpy.data.materials.get('Crafted chai / vertex palette') or bpy.data.materials.new('Crafted chai / vertex palette')
mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .72
node = next((n for n in mat.node_tree.nodes if n.type == 'VERTEX_COLOR'), None) or mat.node_tree.nodes.new('ShaderNodeVertexColor')
node.layer_name = 'Color'
mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
GREEN = (.025, .095, .062)
GREEN_LIGHT = (.05, .16, .10)
CREAM = (.78, .71, .56)
RUST = (.39, .12, .055)
BRASS = (.50, .31, .085)
BRASS_LIGHT = (.74, .51, .19)
TEAK = (.23, .11, .045)
BLACK = (.016, .024, .022)
STEEL = (.24, .30, .27)
CLAY = (.36, .13, .065)
sources = []

def mesh(name, vertices, faces, color, bevel=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    data.materials.append(mat)
    attr = data.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for face in data.polygons:
        # Facet shading is baked as a restrained palette, not extra materials.
        shade = .94 if face.normal.z < -.2 else 1
        for loop in face.loop_indices:
            attr.data[loop].color = (*(c*shade for c in color), 1)
    if bevel:
        modifier = obj.modifiers.new('Hand-finished edge', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        modifier.limit_method = next(i.identifier for i in modifier.bl_rna.properties['limit_method'].enum_items if i.identifier == 'ANGLE')
        modifier.angle_limit = math.radians(35)
    sources.append(obj)
    return obj

def box(name, center, size, color, bevel=0):
    x,y,z = center
    a,b,c = (v/2 for v in size)
    return mesh(name, [(x+dx*a,y+dy*b,z+dz*c) for dz in [-1,1] for dy in [-1,1] for dx in [-1,1]],
                [(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)], color, bevel)

def lathe(name, center, rings, color, segments=12, axis='Z'):
    vertices=[]
    for radius,height in rings:
        for i in range(segments):
            angle=2*math.pi*i/segments
            p=(radius*math.cos(angle),radius*math.sin(angle),height)
            if axis=='X': p=(height,p[0],p[1])
            vertices.append(tuple(center[j]+p[j] for j in range(3)))
    faces=[tuple(reversed(range(segments))),tuple(range((len(rings)-1)*segments,len(rings)*segments))]
    for row in range(len(rings)-1):
        for i in range(segments):
            j=(i+1)%segments
            faces.append((row*segments+i,row*segments+j,(row+1)*segments+j,(row+1)*segments+i))
    return mesh(name,vertices,faces,color)

def tube(name, path, radius, color, sides=5, closed=False):
    points=[Vector(p) for p in path]
    vertices=[]
    for i,p in enumerate(points):
        before=points[(i-1)%len(points)] if closed or i else points[0]
        after=points[(i+1)%len(points)] if closed or i<len(points)-1 else points[-1]
        direction=(after-before).normalized()
        reference=Vector((0,0,1)) if abs(direction.z)<.85 else Vector((0,1,0))
        u=direction.cross(reference).normalized();v=direction.cross(u).normalized()
        for j in range(sides):
            a=2*math.pi*j/sides
            vertices.append(tuple(p+radius*(u*math.cos(a)+v*math.sin(a))))
    faces=[]
    for i in range(len(points) if closed else len(points)-1):
        nxt=(i+1)%len(points)
        for j in range(sides):
            faces.append((i*sides+j,i*sides+(j+1)%sides,nxt*sides+(j+1)%sides,nxt*sides+j))
    if not closed:
        faces.extend([tuple(reversed(range(sides))),tuple(range((len(points)-1)*sides,len(points)*sides))])
    return mesh(name,vertices,faces,color)

# Grounded pushcart silhouette: two genuine open spoked wheels and stable feet.
for side in [-1,1]:
    x=side*1.31
    path=[(x,.18+.35*math.cos(i*math.tau/12),.405+.35*math.sin(i*math.tau/12)) for i in range(12)]
    tube('Wheel / rubber %s'%side,path,.060,BLACK,6,True)
    lathe('Wheel / brass hub %s'%side,(x,.18,.405),[(.072,-.09),(.072,.09)],BRASS_LIGHT,10,'X')
    for i in range(6):
        a=i*math.tau/6
        tube('Wheel / spoke %s %s'%(side,i),[(x,.18,.405),(x,.18+.29*math.cos(a),.405+.29*math.sin(a))],.018,BRASS,4)
    box('Front / foot %s'%side,(side*1.05,-.49,.17),(.13,.16,.34),TEAK,.015)
    box('Front / shoe %s'%side,(side*1.05,-.49,.04),(.20,.22,.08),BLACK,.015)
box('Body / crafted green cabinet',(0,0,.77),(2.46,1.22,.90),GREEN,.045)
box('Body / recessed serving plaque',(0,-.625,.82),(1.36,.035,.39),CREAM,.02)
box('Body / brass kick rail',(0,-.644,.39),(2.31,.026,.07),BRASS,.008)
for side in [-1,1]:
    for i in range(3):
        box('Body / teak grille %s %s'%(side,i),(side*(.85+i*.105),-.627,.87),(.055,.025,.53),TEAK,.006)
    box('Body / brass corner %s'%side,(side*1.195,-.61,.83),(.037,.032,.67),BRASS_LIGHT,.006)
box('Counter / pale stone serving edge',(0,0,1.255),(2.68,1.42,.13),CREAM,.035)
box('Counter / teak worktop',(0,.10,1.328),(2.41,1.12,.025),TEAK,.012)

for side in [-1,1]:
    for y in [-.49,.49]:
        box('Canopy / timber upright %s %.2f'%(side,y),(side*1.09,y,1.89),(.075,.075,1.15),TEAK,.012)
        box('Canopy / brass collar %s %.2f'%(side,y),(side*1.09,y,1.57),(.095,.095,.085),BRASS,.008)

# One continuous bowed fabric canopy, with joined stripe boundaries and scallops.
def roof_z(y): return 2.62-.19*(y/.93)**2
for stripe in range(8):
    x0=-1.58+stripe*.395;x1=x0+.395
    vertices=[]
    for j in range(5):
        y=-.93+j*.465
        vertices.extend([(x0,y,roof_z(y)),(x1,y,roof_z(y)),(x0,y,roof_z(y)-.035),(x1,y,roof_z(y)-.035)])
    faces=[]
    for j in range(4):
        n=4*j; m=n+4
        faces.extend([(n,n+1,m+1,m),(n+2,m+2,m+3,n+3),(n,m,m+2,n+2),(n+1,n+3,m+3,m+1)])
    faces.extend([(0,2,3,1),(16,17,19,18)])
    color=CREAM if stripe%2==0 else RUST
    mesh('Canopy / woven stripe %02d'%stripe,vertices,faces,color)
    for side in [-1,1]:
        y=side*.93
        outline=[(x0,roof_z(y)),(x1,roof_z(y)),(x1,roof_z(y)-.13)]
        outline.extend((x0+.395*(1-i/6),roof_z(y)-.13-.08*math.sin(math.pi*i/6)) for i in range(1,7))
        # The valance shares only its seam with the roof; no coplanar slabs.
        vs=[(x,y+dy,z) for dy in [-.012,.012] for x,z in outline]
        count=len(outline)
        fs=[tuple(reversed(range(count))),tuple(range(count,2*count))]
        fs.extend((i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count))
        mesh('Canopy / scallop %02d %s'%(stripe,side),vs,fs,color)
for side in [-1,1]:
    box('Canopy / green side rail %s'%side,(side*1.585,0,2.37),(.045,1.89,.09),GREEN,.012)
    tube('Push handle / %s'%side,[(side*1.22,.57,1.15),(side*1.22,.89,1.14),(side*1.22,.97,.98)],.035,TEAK,6)

# Chai urn: stepped brass shoulder, lid and a real outward tap.
lathe('Tea / brass urn',(-.59,.20,1.345),[(.22,0),(.25,.04),(.25,.38),(.20,.43),(.19,.45)],BRASS,16)
lathe('Tea / urn lid',(-.59,.20,1.345),[(.205,.45),(.21,.47),(.08,.51),(.035,.52),(.035,.56)],BRASS_LIGHT,12)
tube('Tea / tap',[(-.59,-.04,1.49),(-.59,-.19,1.49),(-.59,-.22,1.43)],.025,BRASS_LIGHT,6)
box('Tea / tap lever',(-.59,-.17,1.55),(.08,.018,.023),BLACK,.006)
lathe('Tea / kettle',(.01,.20,1.345),[(.11,0),(.18,.07),(.20,.16),(.17,.24),(.08,.27),(.09,.29)],BRASS,12)
lathe('Tea / kettle lid',(.01,.20,1.345),[(.1,.29),(.035,.32),(.025,.35)],BRASS_LIGHT,10)
tube('Tea / kettle spout',[(.16,.20,1.50),(.29,.20,1.55),(.33,.20,1.65)],.035,BRASS_LIGHT,6)
tube('Tea / kettle handle',[(.01,.20+.19*math.cos(a),1.60+.24*math.sin(a)) for a in [math.pi*i/8 for i in range(9)]],.025,BLACK,6)
box('Serving / tray',(.48,-.32,1.36),(.82,.38,.04),BRASS,.01)
for row in range(2):
    for i in range(3):
        lathe('Serving / kulhad %s %s'%(row,i),(.24+i*.23,-.42+row*.18,1.383),[(.050,0),(.064,.095),(.054,.095),(.042,.027)],CLAY,8)
box('Menu / framed green panel',(.77,.45,1.65),(.49,.045,.53),BRASS,.014)
box('Menu / slate',(.77,.421,1.65),(.425,.014,.458),GREEN,.008)
for i,width in enumerate([.26,.19,.23]):
    box('Menu / chalk line %s'%i,(.77,.411,1.79-i*.095),(width,.006,.017),CREAM)

# Merge evaluated geometry for one runtime draw call; preserve the editable parts.
vertices,faces,colors=[],[],[]
depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in sources:
    data=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    data.calc_loop_triangles()
    offset=len(vertices);vertices.extend(tuple(obj.matrix_world@v.co) for v in data.vertices)
    color=data.color_attributes.get('Color')
    for triangle in data.loop_triangles:
        faces.append(tuple(offset+i for i in triangle.vertices))
        colors.extend(tuple(color.data[i].color) for i in triangle.loops)
    bpy.data.meshes.remove(data)
data=bpy.data.meshes.new('chai-cart / shipping geometry')
data.from_pydata(vertices,[],faces);data.materials.append(mat);data.update()
attribute=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
for i,color in enumerate(colors): attribute.data[i].color=color
export=bpy.data.objects.new('chai-cart',data);scene.collection.objects.link(export)
bpy.ops.object.select_all(action='DESELECT');export.select_set(True);bpy.context.view_layer.objects.active=export
try:
    formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
except Exception:
    formats=[]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    formats=[i[0] for i in ExportGLTF2_Base.__annotations__['export_format'].keywords['items'](None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(i for i in formats if i=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)

# Native normalized byte colors save bandwidth without adding a decoder.
payload=OUTPUT.read_bytes();json_length=struct.unpack_from('<I',payload,12)[0]
doc=json.loads(payload[20:20+json_length]);binary=payload[20+json_length+8:]
accessors={p['attributes']['COLOR_0'] for m in doc['meshes'] for p in m['primitives']}
color_views={doc['accessors'][i]['bufferView']:i for i in accessors}
repacked=bytearray()
for i,view in enumerate(doc['bufferViews']):
    offset=view.get('byteOffset',0);block=binary[offset:offset+view['byteLength']]
    if i in color_views:
        accessor=doc['accessors'][color_views[i]]
        assert accessor['componentType']==5126 and accessor.get('byteOffset',0)==0 and 'byteStride' not in view
        channels=3 if accessor['type']=='VEC3' else 4
        values=struct.unpack('<%sf'%(accessor['count']*channels),block)
        block=bytes(max(0,min(255,round(c*255))) for c in values)
        accessor['componentType']=5121;accessor['normalized']=True
    repacked.extend(b'\0'*((-len(repacked))%4));view['byteOffset']=len(repacked);view['byteLength']=len(block);repacked.extend(block)
doc['buffers'][0]['byteLength']=len(repacked)
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
repacked+=b'\0'*((-len(repacked))%4)
length=12+8+len(encoded)+8+len(repacked)
OUTPUT.write_bytes(struct.pack('<III',0x46546C67,2,length)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(repacked),0x004E4942)+repacked)
minimum=[min(v[i] for v in vertices) for i in range(3)]
maximum=[max(v[i] for v in vertices) for i in range(3)]
print({'bytes':OUTPUT.stat().st_size,'triangles':len(faces),'parts':len(sources),'bounds':{'min':minimum,'max':maximum}})
bpy.data.objects.remove(export,do_unlink=True)
for obj in sources: obj.select_set(True)
bpy.context.view_layer.objects.active=sources[0]
WORK.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'crafted-chai-cart.blend'),copy=True)

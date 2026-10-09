"""Authored botanical silhouettes and pond coping; editable parts, five compact meshes."""
import bpy
import bmesh
import json
import math
import random
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/botanical-kit.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\botanical-kit.blend')
scene = bpy.data.scenes.get('Saksham Botanical Kit') or bpy.data.scenes.new('Saksham Botanical Kit')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Botanical Kit Sources')
if collection is None:
    collection = bpy.data.collections.new('Botanical Kit Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

mat = bpy.data.materials.get('Botanical / vertex palette') or bpy.data.materials.new('Botanical / vertex palette')
mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .86
color_node = next((n for n in mat.node_tree.nodes if n.type == 'VERTEX_COLOR'), None) or mat.node_tree.nodes.new('ShaderNodeVertexColor')
color_node.layer_name = 'Color'
mat.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Base Color'])

def color(hex_value):
    channels = [int(hex_value[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in channels)

TRUNK = color('85624B')
TRUNK_LIGHT = color('A47D57')
LEAF = color('41964E')
GREEN = [color(v) for v in ['68B756','7FC568','489F51','86C56A']]
COPPER = [color(v) for v in ['DC9066','EFAB79','C9775F','F2BC87']]
CORAL = [color('F27D81'),color('FFC0A0')]
LILAC = [color('A89CE0'),color('D9CEE9'),color('F5EFCC')]
CENTER = color('EAC767')

def ico(subdivisions):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    vertices = [tuple(v.co) for v in bm.verts]
    faces = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    return vertices, faces

sources = {}
def part(asset, label, vertices, faces, base_color, variation=.06, soft=False):
    mesh = bpy.data.meshes.new(asset+' / '+label)
    mesh.from_pydata(vertices,[],faces)
    mesh.materials.append(mat)
    mesh.update()
    obj = bpy.data.objects.new(asset+' / '+label,mesh)
    collection.objects.link(obj)
    obj['runtime_name'] = asset
    attr = mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT' if soft else 'CORNER')
    rng = random.Random(asset+label)
    if soft:
        for poly in mesh.polygons: poly.use_smooth=True
        for vertex in mesh.vertices:
            light=.94+rng.uniform(-variation,variation)
            attr.data[vertex.index].color=(*[max(0,min(1,c*light)) for c in base_color],1)
    else:
        for poly in mesh.polygons:
            light = .91 + .09*max(0,poly.normal.z) + rng.uniform(-variation,variation)
            rgba = (*[max(0,min(1,c*light)) for c in base_color],1)
            for loop in poly.loop_indices:
                attr.data[loop].color = rgba
    sources.setdefault(asset,[]).append(obj)
    return obj

def tapered_branch(asset,label,points,radii,base_color,sides=7):
    points = [Vector(p) for p in points]
    vertices,faces = [],[]
    for index,p in enumerate(points):
        direction = (points[min(index+1,len(points)-1)]-points[max(0,index-1)]).normalized()
        basis = Vector((0,1,0))
        if abs(direction.dot(basis)) > .9: basis = Vector((1,0,0))
        u = direction.cross(basis).normalized()
        v = direction.cross(u).normalized()
        for side in range(sides):
            angle = 2*math.pi*side/sides
            vertices.append(tuple(p+radii[index]*(math.cos(angle)*u+math.sin(angle)*v)))
    faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+n for n in range(sides))])
    for ring in range(len(points)-1):
        for n in range(sides):
            a=ring*sides+n;b=ring*sides+(n+1)%sides
            faces.append((a,b,b+sides,a+sides))
    return part(asset,label,vertices,faces,base_color,.035)

def crown(asset,label,center,scale,base_color,seed):
    unit_vertices,faces=ico(2)
    rng=random.Random(seed)
    vertices=[]
    angle=seed*.67
    for x,y,z in unit_vertices:
        # Slightly pinched undersides and off-center shoulders avoid repeated spheres.
        wobble=.91+rng.random()*.15
        x,y=x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle)
        vertices.append((center[0]+(x+.09*z)*scale[0]*wobble,center[1]+y*scale[1]*wobble,center[2]+z*scale[2]*(.86 if z<0 else 1)*wobble))
    return part(asset,label,vertices,faces,base_color,.045,soft=True)

# The forked trunks are visible beneath an asymmetric, layered umbrella crown.
asset='tree-broadleaf'
tapered_branch(asset,'leaning trunk',[(0,0,0),(-.09,.02,.95),(.04,-.035,1.9),(.16,.04,2.65),(.29,.05,3.6)],[.22,.16,.135,.10,.035],TRUNK)
for index,(end,middle) in enumerate([
    ((-1.18,.13,3.60),(-.65,.09,2.8)),((1.14,.18,3.76),(.72,.10,3.0)),
    ((-.31,-1.03,3.73),(-.18,-.60,2.95)),((.14,.95,3.87),(.1,.56,3.17)),
    ((-.66,.74,4.13),(-.34,.41,3.1))]):
    tapered_branch(asset,'fork %02d'%index,[(.07,.02,2.1+index*.10),middle,end],[.085,.047,.016],TRUNK_LIGHT)
lobes=[
    (-1.00,.04,3.51,.77,.64,.62),(.95,.08,3.68,.77,.66,.60),(-.23,-.91,3.63,.79,.71,.63),
    (.11,.81,3.80,.79,.75,.68),(-.57,.60,3.87,.80,.65,.65),(.61,-.59,3.96,.81,.67,.68),
    (-.49,-.47,4.02,.86,.78,.65),(.27,.12,4.17,.91,.88,.63),(-.23,.28,4.22,.75,.63,.61),
    (-1.03,-.45,3.29,.55,.48,.40),(.99,.59,3.45,.53,.56,.46),(.25,-1.00,3.30,.55,.49,.39),
    (-.43,.99,3.60,.62,.52,.46),(.67,.17,4.29,.54,.47,.49)]
for index,(x,y,z,sx,sy,sz) in enumerate(lobes):
    crown(asset,'leaf tier %02d'%index,(x,y,z),(sx,sy,sz),GREEN[index%len(GREEN)],110+index)

asset='tree-copper'
tapered_branch(asset,'bifurcating trunk',[(0,0,0),(.065,-.025,.85),(-.09,.055,1.65),(-.12,.075,2.38),(-.17,.11,3.29)],[.17,.135,.10,.075,.025],TRUNK)
for index,(end,middle) in enumerate([
    ((-1.03,-.01,3.04),(-.59,.0,2.39)),((.90,-.04,3.14),(.47,-.06,2.45)),
    ((.04,-.85,3.37),(.07,-.43,2.62)),((.10,.74,3.43),(.12,.43,2.7))]):
    tapered_branch(asset,'open fork %02d'%index,[(-.045,.025,1.67+index*.15),middle,end],[.075,.048,.013],TRUNK_LIGHT)
lobes=[
    (-.99,.06,3.0,.67,.60,.54),(.85,-.05,3.10,.69,.57,.61),(-.08,-.78,3.23,.66,.60,.57),
    (.16,.71,3.31,.68,.62,.62),(-.56,.55,3.44,.67,.59,.62),(.47,-.54,3.54,.68,.56,.60),
    (-.36,-.28,3.59,.69,.57,.59),(.18,.16,3.76,.76,.68,.54),(-.17,.38,3.74,.55,.49,.49),
    (.57,.43,3.66,.61,.56,.48),(-1.02,-.39,2.92,.47,.45,.37)]
for index,(x,y,z,sx,sy,sz) in enumerate(lobes):
    crown(asset,'flowering tier %02d'%index,(x,y,z),(sx,sy,sz),COPPER[index%len(COPPER)],210+index)

def leaf(asset,label,stem,angle,length=.16):
    center=Vector(stem)
    direction=Vector((math.cos(angle),math.sin(angle),.38)).normalized()
    across=Vector((-math.sin(angle),math.cos(angle),0))
    midpoint=center+direction*length*.55
    tip=center+direction*length
    vertices=[tuple(center),tuple(midpoint+across*length*.28),tuple(tip),tuple(midpoint-across*length*.28),tuple(midpoint+Vector((0,0,.025))),tuple(midpoint-Vector((0,0,.012)))]
    faces=[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,5),(2,1,5),(3,2,5),(0,3,5)]
    part(asset,label,vertices,faces,LEAF,.03)

def petal(asset,label,center,angle,length,width,base_color):
    c=Vector(center)
    d=Vector((math.cos(angle),math.sin(angle),.14))
    across=Vector((-math.sin(angle),math.cos(angle),0))
    middle=c+d*length*.63
    tip=c+d*length+Vector((0,0,.016))
    vertices=[tuple(c),tuple(middle+across*width),tuple(tip),tuple(middle-across*width),tuple(middle+Vector((0,0,.028))),tuple(middle-Vector((0,0,.012)))]
    faces=[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,5),(2,1,5),(3,2,5),(0,3,5)]
    part(asset,label,vertices,faces,base_color,.025)

for asset,palette,max_height in [('flowers-coral',CORAL,.6),('flowers-lilac',LILAC,.7)]:
    for n in range(6):
        angle=n*2.399
        radius=.31 if n else .04
        x,y=math.cos(angle)*radius,math.sin(angle)*radius
        height=max_height*(.68+.25*((n*3)%5)/4)
        tip=(x+.035*math.cos(angle+.4),y+.035*math.sin(angle+.4),height)
        tapered_branch(asset,'stem %02d'%n,[(x,y,0),tip],[.019,.011],LEAF,sides=5)
        leaf(asset,'leaf %02d A'%n,(x,y,height*.37),angle+.65,.17)
        leaf(asset,'leaf %02d B'%n,(x,y,height*.62),angle+3.3,.14)
        for p in range(5):
            petal(asset,'bloom %02d petal %02d'%(n,p),tip,angle+p*2*math.pi/5,.133 if asset=='flowers-coral' else .12,.065,palette[(n+p//3)%len(palette)])
        unit_vertices,faces=ico(1)
        vertices=[(tip[0]+v[0]*.041,tip[1]+v[1]*.041,tip[2]+.028+v[2]*.025) for v in unit_vertices]
        part(asset,'gold pollen %02d'%n,vertices,faces,CENTER,.025)

# Twenty-four dressed stone pieces: a stepped oval coping with tiny deliberate joints.
asset='pond-basin'
for segment in range(24):
    a=segment*2*math.pi/24+.005
    b=(segment+1)*2*math.pi/24-.005
    # Cross-section travels from outer sole over the beveled top to inner reveal.
    profile=[(3.2,2.1,0),(3.2,2.1,.14),(3.13,2.03,.24),(2.87,1.77,.24),(2.8,1.7,.17),(2.8,1.7,0)]
    vertices=[]
    for angle in [a,b]:
        vertices.extend((rx*math.cos(angle),ry*math.sin(angle),z) for rx,ry,z in profile)
    faces=[tuple(reversed(range(6))),tuple(range(6,12))]
    faces.extend((n,(n+1)%6,(n+1)%6+6,n+6) for n in range(6))
    # The cross-section runs counter-clockwise in radius/Z. Reverse the
    # extrusion faces so the coping top faces up and its bottom faces down.
    faces=[tuple(reversed(face)) for face in faces]
    part(asset,'dressed coping %02d'%segment,vertices,faces,color('C5B49B') if segment%4 else color('BBA789'),.02)

exports=[]
stats={}
for index,(asset,parts) in enumerate(sources.items()):
    vertices,faces,colors,smoothing=[],[],[],[]
    for obj in parts:
        mesh=obj.data
        mesh.calc_loop_triangles()
        offset=len(vertices)
        vertices.extend(tuple(v.co) for v in mesh.vertices)
        attr=mesh.color_attributes['Color']
        for triangle in mesh.loop_triangles:
            faces.append(tuple(offset+i for i in triangle.vertices))
            colors.extend(tuple(attr.data[i].color) for i in (triangle.vertices if attr.domain=='POINT' else triangle.loops))
            smoothing.append(mesh.polygons[triangle.polygon_index].use_smooth)
    radius_limit=1.98 if asset=='tree-broadleaf' else 1.73 if asset=='tree-copper' else 3.3 if asset=='pond-basin' else .69
    factor=min(1,radius_limit/max(math.hypot(v[0],v[1]) for v in vertices))
    floor=min(v[2] for v in vertices)
    roof=max(v[2] for v in vertices)
    target_height={'tree-broadleaf':4.8,'tree-copper':4.2,'flowers-coral':.6,'flowers-lilac':.7,'pond-basin':.24}[asset]
    vertical_scale=target_height/(roof-floor)
    # Preserve editable component proportions; the same horizontal fit is used for export.
    vertices=[(x*factor,y*factor,(z-floor)*vertical_scale) for x,y,z in vertices]
    mesh=bpy.data.meshes.new(asset+' / export')
    mesh.from_pydata(vertices,[],faces)
    mesh.materials.append(mat)
    mesh.update()
    for polygon,soft in zip(mesh.polygons,smoothing): polygon.use_smooth=soft
    attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    for i,rgba in enumerate(colors): attr.data[i].color=rgba
    export=bpy.data.objects.new(asset,mesh)
    scene.collection.objects.link(export)
    exports.append(export)
    stats[asset]={'triangles':len(faces),'parts':len(parts),'radius':max(math.hypot(v[0],v[1]) for v in vertices),'min':[min(v[a] for v in vertices) for a in range(3)],'max':[max(v[a] for v in vertices) for a in range(3)]}
    for obj in parts:
        obj.location=(index%2*5.8,index//2*4.0,0)
        obj.scale.x=obj.scale.y=factor
        obj.scale.z=vertical_scale
        obj.location.z=-floor*vertical_scale
        obj.hide_render=True

bpy.ops.object.select_all(action='DESELECT')
for obj in exports: obj.select_set(True)
bpy.context.view_layer.objects.active=exports[0]
formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    enum=ExportGLTF2_Base.__annotations__['export_format'].keywords['items']
    formats=[item[0] for item in enum(None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(i for i in formats if i=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False)

# Normalized byte vertex colors: standard glTF, no image download or runtime decoder.
payload=OUTPUT.read_bytes()
json_length=struct.unpack_from('<I',payload,12)[0]
document=json.loads(payload[20:20+json_length])
binary=payload[20+json_length+8:]
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
print(json.dumps({'bytes':OUTPUT.stat().st_size,'meshes':stats}))
for obj in exports: bpy.data.objects.remove(obj,do_unlink=True)
for parts in sources.values():
    for obj in parts:
        obj.hide_render=False
        obj.select_set(True)
bpy.context.view_layer.objects.active=next(iter(sources.values()))[0]
scene['asset_pipeline']='Authored layered ico crowns, tapered forks, solid folded petals. Standard GLB, normalized vertex colors; no textures.'
BLEND.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),copy=True)

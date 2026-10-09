"""India Gate inspired sandstone landmark, authored as editable Blender pieces.

Reference: https://www.delhitourism.gov.in/tourist_place/india_gate.html
Artistic proportions in metres, not an architectural reconstruction. Z-up authoring.
"""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/indian-landmark.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\indian-landmark.blend')
scene = bpy.data.scenes.get('Saksham Indian Landmark') or bpy.data.scenes.new('Saksham Indian Landmark')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Indian Landmark Sources')
if collection is None:
    collection = bpy.data.collections.new('Indian Landmark Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in list(scene.collection.objects):
    if obj.get('indian_landmark_export'):
        bpy.data.objects.remove(obj, do_unlink=True)

material = bpy.data.materials.get('Indian landmark / sandstone vertex palette') or bpy.data.materials.new('Indian landmark / sandstone vertex palette')
material.use_nodes = True
bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .90
vertex_color = next((node for node in material.node_tree.nodes if node.type == 'VERTEX_COLOR'), None) or material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex_color.layer_name = 'Color'
material.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])

def color(value):
    channels = [int(value[n:n+2],16)/255 for n in (0,2,4)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in channels)

BASE = color('B98764')
STONE = color('DBB487')
STONE_LIGHT = color('E7C79C')
ARCH_STONE = color('EDD1AC')
RECESS = color('AD8464')
ENGRAVING = color('896C52')
sources = []
collisions = []

def part(name, vertices, faces, shade):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    mesh.materials.append(material)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    collection.objects.link(obj)
    obj['indian_landmark_source']=True
    attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    for polygon in mesh.polygons:
        illumination=.94+.06*max(0,polygon.normal.z)
        for loop in polygon.loop_indices:
            attr.data[loop].color=(*[min(1,c*illumination) for c in shade],1)
    sources.append(obj)
    return obj

def ring_rect(width,depth,chamfer):
    w,d=width/2,depth/2
    return [(-w+chamfer,-d),(w-chamfer,-d),(w,-d+chamfer),(w,d-chamfer),(w-chamfer,d),(-w+chamfer,d),(-w,d-chamfer),(-w,-d+chamfer)]

def stepped_prism(name,profiles,shade,x=0):
    vertices=[]
    for width,depth,height,chamfer in profiles:
        vertices.extend((px+x,py,height) for px,py in ring_rect(width,depth,chamfer))
    faces=[tuple(reversed(range(8))),tuple((len(profiles)-1)*8+n for n in range(8))]
    faces.extend((ring*8+n,ring*8+(n+1)%8,(ring+1)*8+(n+1)%8,(ring+1)*8+n) for ring in range(len(profiles)-1) for n in range(8))
    return part(name,vertices,faces,shade)

def xz_extrusion(name,outline,y0,y1,shade):
    # Positive X-Z area points toward -Y. Ensure all caps and side walls face out.
    area=sum(outline[n][0]*outline[(n+1)%len(outline)][1]-outline[(n+1)%len(outline)][0]*outline[n][1] for n in range(len(outline)))
    if area<0: outline=list(reversed(outline))
    count=len(outline)
    vertices=[(x,y0,z) for x,z in outline]+[(x,y1,z) for x,z in outline]
    faces=[tuple(range(count)),tuple(reversed(range(count,count*2)))]
    faces.extend((n,n+count,(n+1)%count+count,(n+1)%count) for n in range(count))
    return part(name,vertices,faces,shade)

def proxy(center,size):
    collisions.append({'center':list(center),'size':list(size),'angle':0})

# Broad red-sandstone plinth, restrained dressed steps, feet grounded at z=0.
stepped_prism('Base / low red sandstone step',[(3.50,2.50,0,.08),(3.50,2.50,.075,.08),(3.38,2.38,.105,.08)],BASE)
stepped_prism('Base / middle tread',[(3.26,2.16,.10,.06),(3.26,2.16,.205,.06),(3.16,2.06,.235,.06)],STONE)
stepped_prism('Base / upper tread',[(3.04,1.86,.23,.04),(3.04,1.86,.325,.04),(2.94,1.76,.355,.04)],STONE_LIGHT)
proxy((0,0,.055),(3.5,2.5,.11))
proxy((0,0,.230),(3.10,1.90,.25))

for side in [-1,1]:
    x=side*.965
    stepped_prism('Pier / %s plinth'%side,[(.88,1.45,.355,.03),(.88,1.45,.435,.03),(.82,1.35,.475,.03)],BASE,x)
    stepped_prism('Pier / %s tapered sandstone body'%side,[(.79,1.28,.47,.02),(.76,1.23,1.45,.02),(.73,1.20,2.31,.02)],STONE,x)
    stepped_prism('Pier / %s capital reveal'%side,[(.82,1.34,2.27,.022),(.82,1.34,2.34,.022)],STONE_LIGHT,x)
    # Shallow corner pilasters belong to the masonry silhouette, not extra pillars.
    for edge in [-1,1]:
        xx=x+edge*.29
        stepped_prism('Pier / %s corner band %s'%(side,edge),[(.075,1.315,.49,.015),(.075,1.26,2.25,.015)],STONE_LIGHT,xx)
    proxy((x,0,1.39),(.79,1.29,1.88))

# One actual through-opening; the concave outline contains no hidden filling plane.
spring=2.30
radius=.58
outline=[(-1.35,spring),(-1.35,3.22),(1.35,3.22),(1.35,spring)]
outline.extend((radius*math.cos(n*math.pi/12),spring+radius*math.sin(n*math.pi/12)) for n in range(13))
xz_extrusion('Arch / continuous spandrel with open passage',outline,-.625,.625,STONE)
for side in [-1,1]:
    y0,y1=(-.664,-.629) if side<0 else (.629,.664)
    for n in range(12):
        a=n*math.pi/12+.008
        b=(n+1)*math.pi/12-.008
        segment=[(.58*math.cos(a),spring+.58*math.sin(a)),(.58*math.cos(b),spring+.58*math.sin(b)),(.795*math.cos(b),spring+.795*math.sin(b)),(.795*math.cos(a),spring+.795*math.sin(a))]
        xz_extrusion('Arch / %s faceted voussoir %02d'%(side,n),segment,y0,y1,ARCH_STONE if n%3 else STONE_LIGHT)

stepped_prism('Cornice / lower shadow reveal',[(2.80,1.34,3.155,.024),(2.91,1.43,3.225,.028)],RECESS)
stepped_prism('Cornice / projecting sandstone moulding',[(2.91,1.43,3.222,.028),(3.15,1.57,3.305,.038),(3.15,1.57,3.365,.038),(2.87,1.39,3.412,.028)],STONE_LIGHT)
stepped_prism('Attic / inscription mass',[(2.82,1.25,3.402,.022),(2.82,1.25,3.795,.022)],STONE)
stepped_prism('Crest / recessed top line',[(2.88,1.34,3.772,.028),(2.88,1.34,3.832,.028)],RECESS)
stepped_prism('Crest / upper cap',[(2.89,1.36,3.819,.03),(3.03,1.49,3.866,.035),(3.03,1.49,3.905,.035)],STONE_LIGHT)
proxy((0,0,3.445),(3.14,1.55,1.11))

glyphs={
    'I':[(0,1,.60,1),(.30,1,.30,0),(0,0,.60,0)],
    'N':[(0,0,0,1),(0,1,.70,0),(.70,0,.70,1)],
    'D':[(0,0,0,1),(0,1,.44,1),(.44,1,.70,.75),(.70,.75,.70,.25),(.70,.25,.44,0),(.44,0,0,0)],
    'A':[(0,0,.35,1),(.35,1,.70,0),(.15,.40,.55,.40)],
}
height=.205
spacing=.045
word='INDIA'
widths={'I':.60,'N':.70,'D':.70,'A':.70}
word_width=sum(widths[letter]*height for letter in word)+spacing*(len(word)-1)
for side in [-1,1]:
    cursor=-word_width/2
    # Subtle brown inset-style lettering: geometry, not a texture or floating billboard.
    for index,letter in enumerate(word):
        for n,(ax,az,bx,bz) in enumerate(glyphs[letter]):
            a=Vector((cursor+ax*height,3.496+az*height))
            b=Vector((cursor+bx*height,3.496+bz*height))
            delta=(b-a).normalized()
            across=Vector((-delta.y,delta.x))*.008
            stroke=[tuple(a-across),tuple(b-across),tuple(b+across),tuple(a+across)]
            if side>0: stroke=[(-x,z) for x,z in stroke]
            y0,y1=(-.639,-.628) if side<0 else (.628,.639)
            xz_extrusion('Lettering / %s INDIA %02d %s stroke %02d'%(side,index,letter,n),stroke,y0,y1,ENGRAVING)
        cursor+=widths[letter]*height+spacing
    for x in [-1.07,1.07]:
        disc=[(x+.065*math.cos(n*2*math.pi/12),3.597+.065*math.sin(n*2*math.pi/12)) for n in range(12)]
        y0,y1=(-.641,-.629) if side<0 else (.629,.641)
        xz_extrusion('Attic / %s sandstone roundel %.2f'%(side,x),disc,y0,y1,STONE_LIGHT)

# A small shallow bowl completes the landmark's stepped roof silhouette.
profile=[(.285,3.902),(.350,3.950),(.320,4.000),(.250,4.000),(.250,3.957)]
vertices=[(radius*math.cos(n*math.pi/6),radius*math.sin(n*math.pi/6),z) for radius,z in profile for n in range(12)]
faces=[tuple(reversed(range(12))),tuple((len(profile)-1)*12+n for n in range(12))]
faces.extend((ring*12+n,ring*12+(n+1)%12,(ring+1)*12+(n+1)%12,(ring+1)*12+n) for ring in range(len(profile)-1) for n in range(12))
part('Crest / shallow faceted memorial bowl',vertices,faces,STONE_LIGHT)

vertices,faces,colors=[],[],[]
for obj in sources:
    mesh=obj.data
    mesh.calc_loop_triangles()
    offset=len(vertices)
    vertices.extend(tuple(vertex.co) for vertex in mesh.vertices)
    attr=mesh.color_attributes['Color']
    for triangle in mesh.loop_triangles:
        faces.append(tuple(offset+n for n in triangle.vertices))
        colors.extend(tuple(attr.data[n].color) for n in triangle.loops)
mesh=bpy.data.meshes.new('indian-landmark / export')
mesh.from_pydata(vertices,[],faces)
mesh.materials.append(material)
mesh.update()
attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
for index,rgba in enumerate(colors):attr.data[index].color=rgba
export=bpy.data.objects.new('indian-landmark',mesh)
scene.collection.objects.link(export)
export['indian_landmark_export']=True
export['collisionBoxes']=collisions
export['opening']={'width':1.16,'springHeight':2.30,'apexHeight':2.88,'floorHeight':.355}
bpy.ops.object.select_all(action='DESELECT')
export.select_set(True)
bpy.context.view_layer.objects.active=export
formats=[item.identifier for item in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    enum=ExportGLTF2_Base.__annotations__['export_format'].keywords['items']
    formats=[item[0] for item in enum(None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(item for item in formats if item=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)

# Standard normalized byte vertex colors; full-precision positions and normals.
payload=OUTPUT.read_bytes()
json_length=struct.unpack_from('<I',payload,12)[0]
document=json.loads(payload[20:20+json_length])
binary=payload[20+json_length+8:]
for node in document['nodes']:
    if 'mesh' in node:document['meshes'][node['mesh']]['name']=node['name']
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
    while len(repacked)%4:repacked.append(0)
    view['byteOffset']=len(repacked)
    view['byteLength']=len(data)
    repacked.extend(data)
document['buffers'][0]['byteLength']=len(repacked)
encoded=json.dumps(document,separators=(',',':')).encode()
encoded+=b' '*((-len(encoded))%4)
repacked+=b'\x00'*((-len(repacked))%4)
length=12+8+len(encoded)+8+len(repacked)
OUTPUT.write_bytes(struct.pack('<III',0x46546C67,2,length)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(repacked),0x004E4942)+repacked)
minimum=[min(vertex[n] for vertex in vertices) for n in range(3)]
maximum=[max(vertex[n] for vertex in vertices) for n in range(3)]
print(json.dumps({'bytes':OUTPUT.stat().st_size,'triangles':len(faces),'sourceParts':len(sources),'min':minimum,'max':maximum,'colliders':len(collisions)}))
bpy.data.objects.remove(export,do_unlink=True)
for obj in sources:obj.select_set(True)
bpy.context.view_layer.objects.active=sources[0]
scene['asset_pipeline']='Authored sandstone masses, actual open arch, faceted voussoirs, cornice profiles, geometric INDIA lettering and shallow roof bowl. One byte vertex-color GLB mesh; no image textures.'
BLEND.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),copy=True)

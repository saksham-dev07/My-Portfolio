"""Blender source kit + compact GLB. Only rebuild the owned environment scene."""
import bpy
import bmesh
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/environment-kit.glb'
scene = bpy.data.scenes.get('Saksham Environment Kit') or bpy.data.scenes.new('Saksham Environment Kit')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Environment Kit Sources')
if collection is None:
    collection = bpy.data.collections.new('Environment Kit Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

mat = bpy.data.materials.get('Environment / vertex palette') or bpy.data.materials.new('Environment / vertex palette')
mat.use_nodes = True
bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .9
color_node = next((n for n in mat.node_tree.nodes if n.type == 'VERTEX_COLOR'), None) or mat.node_tree.nodes.new('ShaderNodeVertexColor')
color_node.layer_name = 'Color'
mat.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Base Color'])

def ico(subdivisions):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    vertices = [tuple(v.co) for v in bm.verts]
    faces = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    return vertices, faces

def mesh_object(name, vertices, faces, palette, radius):
    # Normalize the footprint to the same envelope used by runtime clearance.
    factor = min(1, radius / max(math.hypot(v[0],v[1]) for v in vertices))
    vertices = [(x*factor,y*factor,z) for x,y,z in vertices]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('Source / '+name, mesh)
    collection.objects.link(obj)
    mesh.materials.append(mat)
    colors = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    rng = random.Random(name)
    for poly in mesh.polygons:
        tint = palette[0 if poly.normal.z > .35 else 1]
        variation = .91+rng.random()*.16
        for index in poly.loop_indices:
            colors.data[index].color = (*[c*variation for c in tint],1)
    obj['runtime_name'] = name
    obj['footprint_radius'] = radius
    return obj

sources = []
for index, (sx,sy,sz) in enumerate([(1.4,.86,1.5),(1.5,.72,.85),(1.05,.95,1.15)]):
    vertices, faces = ico(3)
    rng = random.Random(90+index)
    carved = []
    for x,y,z in vertices:
        # Faceted shoulder, sloping cap, grounded sole: three distinct silhouettes.
        noise = .94+rng.random()*.12
        height = max(0,min(1,(z+1)*.5))
        px = max(-.82,min(.91,x))*sx*noise + .22*height
        py = y*sy*noise
        cap = (.67+.28*x) if index==0 else (.70+.12*y) if index==1 else (.83-.18*x)
        pz = max(0,min(height*sz,sz*cap))
        carved.append((px,py,pz))
    obj = mesh_object('rock-'+str(index),carved,faces,[(.46,.40,.34),(.29,.27,.28)],1.48)
    bevel = obj.modifiers.new('Worn major edges', 'BEVEL')
    bevel.width = .025
    bevel.segments = 1
    angle_items = [i.identifier for i in bevel.bl_rna.properties['limit_method'].enum_items]
    bevel.limit_method = next(i for i in angle_items if i == 'ANGLE')
    bevel.angle_limit = math.radians(48)
    sources.append(obj)

for index in range(2):
    vertices, faces = [],[]
    leaf_vertices,leaf_faces = ico(2)
    count = 5 if index == 0 else 4
    for n in range(count):
        angle = n*2.399
        cx,cy = math.cos(angle)*.35,math.sin(angle)*.35
        size = .52 if n else .67
        offset = len(vertices)
        for x,y,z in leaf_vertices:
            vertices.append((cx+x*size,cy+y*size*.72,max(0,(z+1)*(.22 if index else .28)+(.11 if n==0 else 0))))
        faces.extend(tuple(i+offset for i in f) for f in leaf_faces)
    palette = [(.24,.34,.15),(.12,.21,.09)] if index == 0 else [(.34,.39,.19),(.19,.27,.11)]
    sources.append(mesh_object('shrub-'+str(index),vertices,faces,palette,.87))

vertices,faces = [],[]
for n in range(7):
    angle=n*2.399
    length=.35+(n%3)*.14
    cx,cy=math.cos(angle)*.1,math.sin(angle)*.1
    offset=len(vertices)
    for t in [0,.55,1]:
        width=.045*(1-t)+.004
        for side in range(3):
            a=angle+side*math.pi*2/3
            vertices.append((cx+math.cos(angle)*t*t*.3+math.cos(a)*width,cy+math.sin(angle)*t*t*.3+math.sin(a)*width,length*t))
    for ring in range(2):
        for side in range(3):
            a=offset+ring*3+side;b=offset+ring*3+(side+1)%3
            faces.extend([(a,b,b+3),(a,b+3,a+3)])
    faces.extend([(offset+2,offset+1,offset),(offset+6,offset+7,offset+8)])
sources.append(mesh_object('grass',vertices,faces,[(.38,.40,.19),(.20,.28,.12)],.52))

exports = []
depsgraph=bpy.context.evaluated_depsgraph_get()
for index,obj in enumerate(sources):
    evaluated=obj.evaluated_get(depsgraph)
    mesh=bpy.data.meshes.new_from_object(evaluated)
    export=bpy.data.objects.new(obj['runtime_name'],mesh)
    scene.collection.objects.link(export)
    exports.append(export)
    # Source variants are arranged as a contact sheet; exports retain origin pivots.
    obj.location=(index%3*3.6,(index//3)*3.5,0)
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
print({'bytes':OUTPUT.stat().st_size,'assets':{obj.name:sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in exports}})
for obj in exports: bpy.data.objects.remove(obj,do_unlink=True)
for obj in sources:
    obj.hide_render=False
    obj.select_set(True)
bpy.context.view_layer.objects.active=sources[0]

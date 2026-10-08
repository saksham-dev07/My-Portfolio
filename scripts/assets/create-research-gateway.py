"""Rebuild the lightweight research portal in Blender; preserve other scenes."""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/research-gateway.glb'
scene = bpy.data.scenes.get('Saksham Research Gateway')
if scene is None:
    scene = bpy.data.scenes.new('Saksham Research Gateway')
    collection = bpy.data.collections.new('Research Gateway Asset')
    scene.collection.children.link(collection)
else:
    collection = scene.collection.children.get('Research Gateway Asset')
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.context.window.scene = scene

def material(name, color, metallic=0, roughness=.65, emission=0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metallic
    node.inputs['Roughness'].default_value = roughness
    if emission:
        node.inputs['Emission Color'].default_value = (*color, 1)
        node.inputs['Emission Strength'].default_value = emission
    mat.diffuse_color = (*color, 1)
    return mat

stone = material('Gateway / warm limestone', (.72,.65,.51))
dark = material('Gateway / ink ceramic', (.035,.047,.066))
copper = material('Gateway / brushed copper', (.55,.25,.105), .35, .42)
light = material('Gateway / mint inlay', (.35,.84,.69), .1, .4, .65)

def own(obj, name, mat):
    obj.name = name
    for c in list(obj.users_collection): c.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def cube(name, position, scale, mat, bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = own(bpy.context.object, name, mat)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Rounded stone edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        weighted = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=weighted.name)
    return obj

def ribbon(name, points, depth, mat, bevel=.09):
    verts = [(x,y,z) for y in [-depth/2,depth/2] for x,z in points]
    n = len(points)
    faces = [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new('Machined edge', 'BEVEL')
    modifier.width = bevel
    modifier.segments = 3
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    weighted = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=weighted.name)
    obj.select_set(False)
    return obj

# A single continuous folded silhouette. The opening stays clear below 4.6m.
outline = [(-5.25,.15),(-5.25,5.5),(-4.5,6.3),(4.55,6.3),(5.2,5.65),
           (5.2,.15),(4.4,.15),(4.4,5.05),(4.08,5.35),(-4.03,5.35),
           (-4.38,4.95),(-4.38,.15)]
ribbon('Limestone portal', outline, 1.15, stone, .12)
for side in [-1,1]:
    cube('Foundation shoe', (side*4.8,0,.17), (1.55,1.9,.34), dark, .10)
    cube('Copper footing', (side*4.8,0,.38), (1.2,1.55,.10), copper, .035)
    cube('Inner guide inlay', (side*4.34,-.59,2.5), (.045,.045,4.15), light, .018)
cube('Floating lintel fascia',(0,-.61,5.8),(8.9,.11,.65),dark,.09)
cube('Underside luminous seam',(0,0,5.30),(8.1,.58,.045),light,.015)
# Short roof ribs articulate the canopy when seen from the map camera.
for x in [-3.5,-1.75,0,1.75,3.5]:
    cube('Copper roof rib',(x,0,6.36),(.065,1.26,.12),copper,.02)

def lettering(body, name, position, size, mat, reverse=False):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.extrude = .006
    curve.bevel_depth = .002
    curve.bevel_resolution = 1
    curve.resolution_u = 4
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (math.pi/2,0,math.pi if reverse else 0)
    curve.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')

lettering('R E S E A R C H', 'Front dimensional lettering', (0,-.679,5.82), .48, light)
cube('Back lintel fascia',(0,.61,5.8),(8.9,.11,.65),dark,.09)
lettering('R E S E A R C H', 'Back dimensional lettering', (0,.679,5.82), .48, light, True)
cube('Entry marker',(-4.8,-.61,3.55),(.55,.07,.9),dark,.06)
lettering('01', 'Entry number', (-4.8,-.66,3.6), .33, light)

# Consolidate by material: four small primitives, no textures or separate glyph draws.
for mat in [stone,dark,copper,light]:
    objects = [obj for obj in collection.objects if obj.type == 'MESH' and obj.data.materials[0] == mat]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = mat.name
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects: obj.select_set(True)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
export_properties = bpy.ops.export_scene.gltf.get_rna_type().properties
formats = [item.identifier for item in export_properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    enum_source = ExportGLTF2_Base.__annotations__['export_format'].keywords['items']
    formats = [item[0] for item in enum_source(None, bpy.context)]
binary_format = next(value for value in formats if value == 'GLB')
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format=binary_format, use_selection=True, use_active_scene=True, export_yup=True, export_animations=False, export_cameras=False, export_lights=False)
triangles = sum(sum(len(face.vertices)-2 for face in obj.data.polygons) for obj in collection.objects)
print({'file': str(OUTPUT), 'bytes': OUTPUT.stat().st_size, 'triangles': triangles, 'materials': 4, 'road_clearance': 8.7})

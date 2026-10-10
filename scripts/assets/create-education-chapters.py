"""Three editable education chapter dioramas; Blender Z-up metres, front -Y.

School desk and book, science atom and flask, and an entering-campus gateway
with laptop. One palette, no textures, three named runtime meshes.
"""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/education-chapters.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\education-chapters.blend')
scene = bpy.data.scenes.get('Saksham Education Chapters') or bpy.data.scenes.new('Saksham Education Chapters')
bpy.context.window.scene = scene
for child in list(scene.collection.children):
    if child.get('education_chapter_sources'):
        for obj in list(child.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(child)
for obj in list(scene.collection.objects):
    if obj.get('education_chapter_export'):
        bpy.data.objects.remove(obj, do_unlink=True)

material = bpy.data.materials.get('Education chapters / stone emerald brass palette') or bpy.data.materials.new('Education chapters / stone emerald brass palette')
material.use_nodes = True
bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .76
vertex_color = next((node for node in material.node_tree.nodes if node.type == 'VERTEX_COLOR'), None) or material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex_color.layer_name = 'Color'
material.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])

def color(value):
    channels = [int(value[n:n+2], 16) / 255 for n in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels)

STONE = color('D8CBAF')
STONE_LIGHT = color('EEE3CB')
TEAK = color('73513B')
TEAK_LIGHT = color('B6875B')
EMERALD = color('205442')
INK = color('17372F')
BRASS = color('D4AE61')
BRASS_LIGHT = color('F0D793')
COPPER = color('C97D55')
SKY = color('90CBBE')
CREAM = color('F7ECD6')
chapters = {}
collection = None
sources = None

def begin(chapter):
    global collection, sources
    collection = bpy.data.collections.new('Education / %s source pieces' % chapter)
    collection['education_chapter_sources'] = True
    scene.collection.children.link(collection)
    sources = []
    chapters[chapter] = {'sources': sources}

def part(name, vertices, faces, shade):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for polygon in mesh.polygons:
        light = .88 + .12 * max(0, polygon.normal.z)
        for loop in polygon.loop_indices:
            attr.data[loop].color = (*[min(1, c * light) for c in shade], 1)
    sources.append(obj)
    return obj

def rectangle(width, depth, chamfer):
    w, d = width / 2, depth / 2
    return [(-w + chamfer, -d), (w - chamfer, -d), (w, -d + chamfer), (w, d - chamfer),
            (w - chamfer, d), (-w + chamfer, d), (-w, d - chamfer), (-w, -d + chamfer)]

def stepped(name, profiles, shade):
    vertices = [(x, y, z) for w, d, z, c in profiles for x, y in rectangle(w, d, c)]
    faces = [tuple(reversed(range(8))), tuple((len(profiles) - 1) * 8 + n for n in range(8))]
    faces.extend((ring * 8 + n, ring * 8 + (n + 1) % 8, (ring + 1) * 8 + (n + 1) % 8, (ring + 1) * 8 + n)
                 for ring in range(len(profiles) - 1) for n in range(8))
    return part(name, vertices, faces, shade)

def box(name, center, size, shade):
    x, y, z = center
    sx, sy, sz = (v / 2 for v in size)
    vertices = [(x + ix * sx, y + iy * sy, z + iz * sz) for iz in [-1, 1] for iy in [-1, 1] for ix in [-1, 1]]
    return part(name, vertices, [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)], shade)

def beam(name, start, end, width, shade):
    start, end = Vector(start), Vector(end)
    direction = (end - start).normalized()
    seed = Vector((0, 1, 0)) if abs(direction.y) < .9 else Vector((1, 0, 0))
    across = direction.cross(seed).normalized()
    other = across.cross(direction).normalized()
    vertices = [tuple(p + across * a * width / 2 + other * b * width / 2) for p in [start, end] for a, b in [(-1, -1), (-1, 1), (1, 1), (1, -1)]]
    return part(name, vertices, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], shade)

def lathe(name, profiles, shade, center=(0, 0, 0), sides=16):
    cx, cy, cz = center
    vertices = [(cx + r * math.cos(n * 2 * math.pi / sides), cy + r * math.sin(n * 2 * math.pi / sides), cz + z)
                for r, z in profiles for n in range(sides)]
    faces = [tuple(reversed(range(sides))), tuple((len(profiles) - 1) * sides + n for n in range(sides))]
    faces.extend((ring * sides + n, ring * sides + (n + 1) % sides, (ring + 1) * sides + (n + 1) % sides, (ring + 1) * sides + n)
                 for ring in range(len(profiles) - 1) for n in range(sides))
    return part(name, vertices, faces, shade)

def sphere(name, center, radius, shade, sides=12, rings=6):
    profiles = [(max(.002, radius * math.sin(n * math.pi / rings)), radius * math.cos(n * math.pi / rings)) for n in range(rings, -1, -1)]
    return lathe(name, profiles, shade, center, sides)

def orbit(name, center, axis_a, axis_b, radius, shade, segments=32):
    center, axis_a, axis_b = Vector(center), Vector(axis_a).normalized(), Vector(axis_b).normalized()
    normal = axis_a.cross(axis_b).normalized()
    vertices = []
    for n in range(segments):
        a = n * 2 * math.pi / segments
        radial = axis_a * math.cos(a) + axis_b * math.sin(a)
        for k in range(6):
            b = k * 2 * math.pi / 6
            vertices.append(tuple(center + radial * (radius + .025 * math.cos(b)) + normal * .025 * math.sin(b)))
    faces = [(n * 6 + k, n * 6 + (k + 1) % 6, ((n + 1) % segments) * 6 + (k + 1) % 6, ((n + 1) % segments) * 6 + k)
             for n in range(segments) for k in range(6)]
    return part(name, vertices, faces, shade)

def stand(chapter):
    stepped('%s / dark emerald toe' % chapter, [(2.08, 2.66, 0, .15), (2.08, 2.66, .07, .15)], EMERALD)
    stepped('%s / stone lower tread' % chapter, [(2.20, 2.80, .045, .19), (2.20, 2.80, .15, .19), (2.10, 2.70, .20, .16)], STONE)
    stepped('%s / light dressed upper tread' % chapter, [(1.98, 2.56, .18, .16), (1.98, 2.56, .29, .16), (1.88, 2.46, .33, .14)], STONE_LIGHT)
    box('%s / front brass trim' % chapter, (0, -1.286, .26), (1.56, .012, .045), BRASS)

begin('school')
stand('school')
# A small vintage classroom arrangement: inset teak desktop, visible legs,
# upright board and large open pages all read at the normal driving zoom.
for side in [-1, 1]:
    for row in [-1, 1]:
        box('School / %s %s emerald desk leg' % (side, row), (side * .68, row * .40 - .13, .67), (.085, .085, .68), EMERALD)
box('School / front brass stretcher', (0, -.53, .50), (1.45, .055, .055), BRASS)
box('School / crafted teak desktop', (0, -.13, 1.035), (1.74, 1.13, .11), TEAK)
box('School / lighter desk inset', (0, -.13, 1.095), (1.58, .99, .016), TEAK_LIGHT)
for side in [-1, 1]:
    for row in [-1, 1]:
        box('School / %s %s chair leg' % (side, row), (side * .27, row * .25 + .81, .60), (.055, .055, .54), EMERALD)
box('School / chair seat', (0, .81, .89), (.65, .62, .075), TEAK_LIGHT)
box('School / chair back', (0, 1.085, 1.25), (.65, .075, .65), TEAK)

# Two slightly raised page halves form an actual open book; graphite lines
# are geometry, not text textures. Deep blue cover peeks beneath the pages.
for side in [-1, 1]:
    outline = [(0, -.42, 1.115), (side * .51, -.40, 1.18), (side * .51, .21, 1.18), (0, .23, 1.115)]
    part('School / %s book emerald cover' % side, outline, [(0, 1, 2, 3) if side > 0 else (3, 2, 1, 0)], EMERALD)
    page = [(0, -.39, 1.128), (side * .46, -.37, 1.195), (side * .46, .18, 1.195), (0, .20, 1.128)]
    part('School / %s cream page surface' % side, page, [(0, 1, 2, 3) if side > 0 else (3, 2, 1, 0)], CREAM)
    for n in range(5):
        y = -.29 + n * .085
        beam('School / %s page line %02d' % (side, n), (side * .07, y, 1.143), (side * .38, y, 1.189), .010, TEAK_LIGHT)
beam('School / oversized brass pencil', (.54, -.38, 1.12), (.73, .19, 1.12), .042, BRASS)
beam('School / graphite pencil tip', (.73, .19, 1.12), (.756, .265, 1.12), .025, INK)
box('School / chalkboard timber frame', (0, 1.11, 1.86), (1.72, .10, 1.05), TEAK)
box('School / chalkboard emerald face', (0, 1.049, 1.86), (1.54, .018, .87), INK)
box('School / chalk tray', (0, 1.012, 1.36), (1.69, .17, .06), TEAK_LIGHT)
# Quiet chalk marks: simple arithmetic without invented academic performance.
chalk_strokes = [
    ((-.60, 1.88), (-.60, 2.13)), ((-.67, 2.07), (-.60, 2.13)),
    ((-.45, 1.99), (-.25, 1.99)), ((-.35, 1.89), (-.35, 2.09)),
    ((-.10, 1.88), (-.10, 2.13)), ((-.17, 2.07), (-.10, 2.13)),
    ((.12, 1.95), (.30, 1.95)), ((.12, 2.04), (.30, 2.04)),
    ((.45, 2.13), (.64, 2.13)), ((.64, 2.13), (.45, 1.88)),
    ((.45, 1.88), (.66, 1.88)), ((-.67, 1.62), (.67, 1.62)),
]
for n, (a, b) in enumerate(chalk_strokes):
    beam('School / chalk stroke %02d' % n, (a[0], 1.034, a[1]), (b[0], 1.034, b[1]), .027, CREAM)
chapters['school']['boxes'] = [
    {'center': [0, 0, .165], 'size': [2.2, 2.8, .33]},
    {'center': [0, -.13, .735], 'size': [1.74, 1.13, .81]},
    {'center': [0, .81, .955], 'size': [.65, .62, 1.25]},
    {'center': [0, 1.11, 1.86], 'size': [1.72, .12, 1.05]},
]
chapters['school']['design'] = {'chapter': 'school', 'openBook': True, 'pencil': True, 'year': '2020'}

begin('science')
stand('science')
box('Science / stone experiment table', (0, -.12, .83), (1.73, 1.20, .09), STONE_LIGHT)
for side in [-1, 1]:
    box('Science / %s emerald table support' % side, (side * .68, -.12, .59), (.12, .97, .52), EMERALD)
box('Science / brass table edge', (0, -.729, .83), (1.73, .018, .045), BRASS)
lathe('Science / atom sculpture foot', [(.30, .875), (.31, .915), (.23, .955), (.06, .955), (.06, 1.04)], BRASS, (-.34, .20, 0), 16)
center = (-.34, .20, 1.55)
sphere('Science / copper nucleus', center, .15, COPPER)
for n, (a, b) in enumerate([((1, 0, 0), (0, 0, 1)), ((.5, .866, 0), (0, 0, 1)), ((.5, -.866, 0), (0, 0, 1))]):
    orbit('Science / brass orbital %02d' % n, center, a, b, .65, BRASS_LIGHT)
    p = Vector(center) + Vector(a) * .65
    sphere('Science / teal electron %02d' % n, tuple(p), .075, SKY, 10, 4)
# A broad opaque glasslike silhouette uses teal facets, without transparency
# sorting or expensive transmission. A copper collar shows the flask neck.
lathe('Science / teal conical flask', [(.22, .875), (.24, .92), (.23, 1.03), (.10, 1.38), (.085, 1.49), (.085, 1.63), (.11, 1.66)], SKY, (.57, -.28, 0), 16)
lathe('Science / brass flask collar', [(.115, 1.58), (.115, 1.65)], BRASS, (.57, -.28, 0), 16)
lathe('Science / dark mouth inset', [(.08, 1.654), (.08, 1.668)], INK, (.57, -.28, 0), 16)
box('Science / copper lab notebook', (-.22, -.47, .898), (.64, .34, .046), COPPER)
box('Science / notebook cream page edge', (-.22, -.47, .922), (.59, .30, .014), CREAM)
for n in range(4):
    box('Science / flask measurement %02d' % n, (.57, -.511 + n * .036, 1.02 + n * .075), (.075, .012, .015), CREAM)
chapters['science']['boxes'] = [
    {'center': [0, 0, .165], 'size': [2.2, 2.8, .33]},
    {'center': [0, -.12, .62], 'size': [1.73, 1.20, .58]},
    {'center': [-.34, .20, 1.55], 'size': [1.35, 1.20, 1.35]},
    {'center': [.57, -.28, 1.275], 'size': [.48, .48, .80]},
]
chapters['science']['design'] = {'chapter': 'science', 'orbitCount': 3, 'flask': True, 'year': '2022'}

begin('campus')
stand('campus')
# A welcoming contemporary campus portal marks starting college, not graduation.
for side in [-1, 1]:
    stepped('Campus / %s warm stone portal pier' % side, [(.30, .43, .33, .035), (.30, .43, 1.91, .035)], STONE)
    for obj in sources[-1:]:
        for vertex in obj.data.vertices:
            vertex.co.x += side * .69
            vertex.co.y += .74
    box('Campus / %s dark emerald portal inset' % side, (side * .69, .508, 1.16), (.12, .019, 1.20), EMERALD)
box('Campus / broad stone portal header', (0, .74, 1.96), (1.75, .50, .20), STONE_LIGHT)
box('Campus / brass portal reveal', (0, .74, 1.838), (1.54, .46, .035), BRASS)
box('Campus / emerald welcome fascia', (0, .476, 1.965), (1.05, .021, .12), EMERALD)
for n in range(6):
    box('Campus / arrival stone tile %02d' % n, ((n % 2 - .5) * .32, .53 + (n // 2) * .21, .343), (.27, .16, .020), BRASS if n == 0 else STONE_LIGHT)
box('Campus / compact teak work table', (0, -.58, .86), (1.52, .80, .09), TEAK_LIGHT)
for side in [-1, 1]:
    box('Campus / %s emerald work-table support' % side, (side * .57, -.58, .59), (.085, .65, .52), EMERALD)
box('Campus / dark laptop base', (0, -.58, .928), (1.10, .59, .055), INK)
box('Campus / brushed brass laptop palm rest', (0, -.63, .962), (.92, .38, .014), BRASS)
box('Campus / emerald keyboard inset', (0, -.48, .973), (.81, .20, .010), EMERALD)
box('Campus / trackpad', (0, -.72, .976), (.24, .085, .011), INK)
box('Campus / upright laptop lid', (0, -.315, 1.345), (1.10, .055, .77), INK)
box('Campus / teal laptop screen', (0, -.347, 1.345), (.94, .016, .63), SKY)
for n, length in enumerate([.42, .55, .32, .46]):
    box('Campus / cream screen code line %02d' % n, (-.07 + .05 * (n % 2), -.362, 1.51 - n * .10), (length, .009, .025), CREAM)
box('Campus / small brass notebook', (.61, -.58, .948), (.18, .46, .067), BRASS)
chapters['campus']['boxes'] = [
    {'center': [0, 0, .165], 'size': [2.2, 2.8, .33]},
    {'center': [0, -.58, 1.03], 'size': [1.52, .80, 1.4]},
    {'center': [-.69, .74, 1.12], 'size': [.30, .43, 1.58]},
    {'center': [.69, .74, 1.12], 'size': [.30, .43, 1.58]},
    {'center': [0, .74, 1.96], 'size': [1.75, .50, .20]},
]
chapters['campus']['design'] = {'chapter': 'campus', 'gatewayOpenWidth': 1.08, 'laptop': True, 'year': '2023', 'graduation': False}

exports = []
report = []
for chapter, item in chapters.items():
    vertices, faces, colors = [], [], []
    for obj in item['sources']:
        mesh = obj.data
        mesh.calc_loop_triangles()
        offset = len(vertices)
        vertices.extend(tuple(vertex.co) for vertex in mesh.vertices)
        attr = mesh.color_attributes['Color']
        for triangle in mesh.loop_triangles:
            faces.append(tuple(offset + n for n in triangle.vertices))
            colors.extend(tuple(attr.data[n].color) for n in triangle.loops)
    mesh = bpy.data.meshes.new('education-chapter-%s / export' % chapter)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for index, rgba in enumerate(colors):
        attr.data[index].color = rgba
    export = bpy.data.objects.new(chapter, mesh)
    scene.collection.objects.link(export)
    export['education_chapter_export'] = True
    export['assetVersion'] = 1
    export['collisionBoxes'] = item['boxes']
    export['design'] = item['design']
    exports.append(export)
    report.append({'chapter': chapter, 'triangles': len(faces), 'sourceParts': len(item['sources']),
                   'min': [min(vertex[n] for vertex in vertices) for n in range(3)], 'max': [max(vertex[n] for vertex in vertices) for n in range(3)]})
bpy.ops.object.select_all(action='DESELECT')
for export in exports:
    export.select_set(True)
bpy.context.view_layer.objects.active = exports[0]
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
formats = [i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    formats = [i[0] for i in ExportGLTF2_Base.__annotations__['export_format'].keywords['items'](None, bpy.context)]
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format=next(i for i in formats if i == 'GLB'), use_selection=True, use_active_scene=True,
                          export_yup=True, export_animations=False, export_cameras=False, export_lights=False, export_extras=True)

# Standard byte vertex-colours: compact shipping without a decoder or textures.
payload = OUTPUT.read_bytes()
json_length = struct.unpack_from('<I', payload, 12)[0]
document = json.loads(payload[20:20 + json_length])
binary = payload[20 + json_length + 8:]
for node in document['nodes']:
    if 'mesh' in node:
        document['meshes'][node['mesh']]['name'] = node['name']
color_accessors = {primitive['attributes']['COLOR_0'] for item in document['meshes'] for primitive in item['primitives']}
color_views = {document['accessors'][index]['bufferView']: index for index in color_accessors}
repacked = bytearray()
for index, view in enumerate(document['bufferViews']):
    offset = view.get('byteOffset', 0)
    data = binary[offset:offset + view['byteLength']]
    if index in color_views:
        accessor = document['accessors'][color_views[index]]
        assert accessor['componentType'] == 5126 and accessor.get('byteOffset', 0) == 0 and 'byteStride' not in view
        channels = 3 if accessor['type'] == 'VEC3' else 4
        values = struct.unpack('<%sf' % (accessor['count'] * channels), data)
        data = bytes(max(0, min(255, round(value * 255))) for value in values)
        accessor['componentType'] = 5121
        accessor['normalized'] = True
    while len(repacked) % 4:
        repacked.append(0)
    view['byteOffset'] = len(repacked)
    view['byteLength'] = len(data)
    repacked.extend(data)
document['buffers'][0]['byteLength'] = len(repacked)
encoded = json.dumps(document, separators=(',', ':')).encode()
encoded += b' ' * ((-len(encoded)) % 4)
repacked += b'\x00' * ((-len(repacked)) % 4)
length = 12 + 8 + len(encoded) + 8 + len(repacked)
OUTPUT.write_bytes(struct.pack('<III', 0x46546C67, 2, length) + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
                   + struct.pack('<II', len(repacked), 0x004E4942) + repacked)
print(json.dumps({'bytes': OUTPUT.stat().st_size, 'chapters': report, 'triangles': sum(item['triangles'] for item in report)}))
for export in exports:
    bpy.data.objects.remove(export, do_unlink=True)
# Spread the editable source collections for comfortable Blender inspection.
for index, item in enumerate(chapters.values()):
    for obj in item['sources']:
        obj.location.x = (index - 1) * 3.1
        obj.select_set(True)
bpy.context.view_layer.objects.active = chapters['school']['sources'][0]
scene['asset_pipeline'] = 'Three low-poly education chapter dioramas: school desk and open book, science atom and flask, entering-campus portal and laptop. Three meshes share one byte vertex palette. No images or animation.'
BLEND.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), copy=True)

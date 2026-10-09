"""Editable brass cup and sandstone award podium, authored in Blender.

Z-up metres, ground-centred origin, front faces -Y. No image textures.
The named source parts are retained in the .blend; export is one palette mesh.
"""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/highlights-podium.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\highlights-podium.blend')
scene = bpy.data.scenes.get('Saksham Highlights Podium') or bpy.data.scenes.new('Saksham Highlights Podium')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Highlights Podium Sources')
if collection is None:
    collection = bpy.data.collections.new('Highlights Podium Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in list(scene.collection.objects):
    if obj.get('highlights_podium_export'):
        bpy.data.objects.remove(obj, do_unlink=True)

material = bpy.data.materials.get('Highlights / brass stone and emerald palette') or bpy.data.materials.new('Highlights / brass stone and emerald palette')
material.use_nodes = True
bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .64
vertex_color = next((node for node in material.node_tree.nodes if node.type == 'VERTEX_COLOR'), None) or material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex_color.layer_name = 'Color'
material.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])

def color(value):
    channels = [int(value[n:n+2], 16) / 255 for n in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels)

STONE = color('DDD1B1')
STONE_LIGHT = color('EFE5CA')
STONE_DARK = color('B3A183')
TEAK = color('695443')
EMERALD = color('174839')
BRASS = color('CEA450')
BRASS_LIGHT = color('F4D78B')
BRASS_DARK = color('AA7835')
sources = []

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

def lathe(name, profiles, shade, sides=20, closed=False):
    vertices = [(r * math.cos(n * 2 * math.pi / sides), r * math.sin(n * 2 * math.pi / sides), z)
                for r, z in profiles for n in range(sides)]
    faces = [] if closed else [tuple(reversed(range(sides))), tuple((len(profiles) - 1) * sides + n for n in range(sides))]
    faces.extend((ring * sides + n, ring * sides + (n + 1) % sides, ((ring + 1) % len(profiles)) * sides + (n + 1) % sides, ((ring + 1) % len(profiles)) * sides + n)
                 for ring in range(len(profiles) if closed else len(profiles) - 1) for n in range(sides))
    return part(name, vertices, faces, shade)

def extrude_xz(name, outline, y0, y1, shade):
    area = sum(outline[n][0] * outline[(n + 1) % len(outline)][1] - outline[(n + 1) % len(outline)][0] * outline[n][1]
               for n in range(len(outline)))
    if area < 0:
        outline = list(reversed(outline))
    count = len(outline)
    vertices = [(x, y0, z) for x, z in outline] + [(x, y1, z) for x, z in outline]
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces.extend((n, n + count, (n + 1) % count + count, (n + 1) % count) for n in range(count))
    return part(name, vertices, faces, shade)

def tube(name, path, radius, shade, sides=8):
    points = [Vector(point) for point in path]
    vertices = []
    for n, point in enumerate(points):
        tangent = (points[min(n + 1, len(points) - 1)] - points[max(n - 1, 0)]).normalized()
        front = Vector((0, 1, 0))
        across = tangent.cross(front).normalized()
        for k in range(sides):
            a = k * 2 * math.pi / sides
            vertices.append(tuple(point + radius * (front * math.cos(a) + across * math.sin(a))))
    faces = [tuple(reversed(range(sides))), tuple((len(points) - 1) * sides + k for k in range(sides))]
    faces.extend((n * sides + k, n * sides + (k + 1) % sides, (n + 1) * sides + (k + 1) % sides, (n + 1) * sides + k)
                 for n in range(len(points) - 1) for k in range(sides))
    return part(name, vertices, faces, shade)

# Broad dressed-stone terrace: three crafted treads rather than one tall cylinder.
stepped('Podium / recessed teak toe', [(5.02, 3.62, 0, .25), (5.02, 3.62, .11, .25)], TEAK)
stepped('Podium / broad lower sandstone tread', [(5.20, 3.80, .08, .28), (5.20, 3.80, .24, .28), (5.08, 3.68, .30, .25)], STONE)
stepped('Podium / second limestone tread', [(4.76, 3.36, .28, .22), (4.76, 3.36, .44, .22), (4.62, 3.22, .50, .20)], STONE_LIGHT)
stepped('Podium / emerald reveal', [(3.70, 2.60, .49, .18), (3.70, 2.60, .58, .18)], EMERALD)
stepped('Podium / tapered warm stone body', [(3.60, 2.50, .57, .16), (3.42, 2.34, 1.48, .16)], STONE)
stepped('Podium / brushed brass crown band', [(3.54, 2.46, 1.45, .16), (3.54, 2.46, 1.54, .16)], BRASS)
stepped('Podium / chamfered upper slab', [(3.70, 2.62, 1.53, .18), (3.70, 2.62, 1.69, .18), (3.56, 2.48, 1.75, .16)], STONE_LIGHT)
stepped('Trophy / dark emerald square foot', [(1.56, 1.42, 1.75, .12), (1.56, 1.42, 1.89, .12), (1.40, 1.26, 1.96, .10)], EMERALD)
stepped('Trophy / brass foot inset', [(1.29, 1.16, 1.96, .10), (1.29, 1.16, 2.035, .10)], BRASS_LIGHT)
lathe('Trophy / fluted stem and broad saucer', [(.60, 2.03), (.64, 2.10), (.50, 2.17), (.24, 2.30), (.23, 2.77), (.38, 2.90), (.49, 2.98)], BRASS, 16)

# The open inner wall and actual recessed bowl remain visible in top and side views.
lathe('Trophy / hollow faceted brass cup', [(.42, 2.94), (.53, 3.16), (.78, 3.37), (1.18, 3.78), (1.46, 4.40),
      (1.54, 4.72), (1.37, 4.72), (1.30, 4.40), (1.03, 3.82), (.66, 3.46), (.34, 3.30)], BRASS, 24)
lathe('Trophy / rolled light brass rim', [(1.53, 4.69), (1.58, 4.74), (1.58, 4.80), (1.53, 4.85), (1.37, 4.85),
      (1.34, 4.80), (1.34, 4.74), (1.38, 4.69)], BRASS_LIGHT, 24, closed=True)
lathe('Trophy / lower engraved collar', [(.57, 3.14), (.61, 3.18), (.61, 3.23), (.58, 3.26)], BRASS_DARK, 20)

# Continuous symmetrical handles: wide silhouette, short tube chains, no modifiers.
handle = [(1.33, 0, 4.48), (1.58, 0, 4.57), (1.86, 0, 4.55), (2.09, 0, 4.40), (2.19, 0, 4.18),
          (2.17, 0, 3.95), (2.06, 0, 3.74), (1.84, 0, 3.55), (1.58, 0, 3.44), (1.28, 0, 3.44), (1.04, 0, 3.57)]
for side in [-1, 1]:
    tube('Trophy / %s continuous brass handle' % side, [(side * x, y, z) for x, y, z in handle], .135, BRASS_LIGHT)

# A restrained faceted laurel motif frames the foot without hiding the cup.
for side in [-1, 1]:
    branch = [(side * x, -.76, z) for x, z in [(.20, 2.03), (.51, 2.14), (.76, 2.35), (.90, 2.58), (.93, 2.81)]]
    tube('Trophy / %s laurel branch' % side, branch, .027, BRASS_DARK, 6)
    for n in range(5):
        z = 2.15 + n * .13
        x = side * (.40 + .105 * n)
        for direction in [-1, 1]:
            outline = [(x, z), (x + side * direction * .11, z + .16), (x + side * direction * .23, z + .22),
                       (x + side * direction * .20, z + .10), (x + side * direction * .09, z + .02)]
            extrude_xz('Trophy / %s laurel %02d %s' % (side, n, direction), outline, -.80, -.745, BRASS_LIGHT)

# Both front and reverse plaques are readable. Lettering denotes the section,
# rather than inventing awards or implying any specific challenge was won.
glyphs = {
    'H': [(0, 0, 0, 1), (.60, 0, .60, 1), (0, .5, .60, .5)],
    'I': [(0, 1, .55, 1), (.275, 1, .275, 0), (0, 0, .55, 0)],
    'G': [(.60, .90, .44, 1), (.44, 1, .16, 1), (.16, 1, 0, .82), (0, .82, 0, .18), (0, .18, .16, 0), (.16, 0, .60, 0), (.60, 0, .60, .47), (.60, .47, .32, .47)],
    'L': [(0, 1, 0, 0), (0, 0, .60, 0)],
    'T': [(0, 1, .60, 1), (.30, 1, .30, 0)],
    'S': [(.60, .90, .44, 1), (.44, 1, .14, 1), (.14, 1, 0, .84), (0, .84, 0, .63), (0, .63, .60, .37), (.60, .37, .60, .16), (.60, .16, .44, 0), (.44, 0, .14, 0), (.14, 0, 0, .10)],
}
word = 'HIGHLIGHTS'
height = .23
spacing = .075
word_width = sum((.55 if letter == 'I' else .60) * height for letter in word) + spacing * (len(word) - 1)
for side in [-1, 1]:
    outline = [(-1.36, .76), (1.36, .76), (1.43, .83), (1.43, 1.27), (1.36, 1.34), (-1.36, 1.34), (-1.43, 1.27), (-1.43, .83)]
    y0, y1 = (-1.278, -1.25) if side < 0 else (1.25, 1.278)
    extrude_xz('Plaque / %s dark emerald inset' % side, outline, y0, y1, EMERALD)
    cursor = -word_width / 2
    for index, letter in enumerate(word):
        for n, (ax, az, bx, bz) in enumerate(glyphs[letter]):
            a = Vector((cursor + ax * height, .94 + az * height))
            b = Vector((cursor + bx * height, .94 + bz * height))
            delta = (b - a).normalized()
            across = Vector((-delta.y, delta.x)) * .011
            stroke = [tuple(a - across), tuple(b - across), tuple(b + across), tuple(a + across)]
            if side > 0:
                stroke = [(-x, z) for x, z in stroke]
            y0, y1 = (-1.288, -1.28) if side < 0 else (1.28, 1.288)
            extrude_xz('Plaque / %s HIGHLIGHTS %02d %s stroke %02d' % (side, index, letter, n), stroke, y0, y1, BRASS_LIGHT)
        cursor += (.55 if letter == 'I' else .60) * height + spacing
    for x in [-1.31, 1.31]:
        outline = [(x + .03 * math.cos(n * math.pi / 4), 1.05 + .03 * math.sin(n * math.pi / 4)) for n in range(8)]
        y0, y1 = (-1.29, -1.28) if side < 0 else (1.28, 1.29)
        extrude_xz('Plaque / %s brass rivet %.2f' % (side, x), outline, y0, y1, BRASS)

# Bake the source palette into one triangle mesh while keeping sources editable.
vertices, faces, colors = [], [], []
for obj in sources:
    mesh = obj.data
    mesh.calc_loop_triangles()
    offset = len(vertices)
    vertices.extend(tuple(vertex.co) for vertex in mesh.vertices)
    attr = mesh.color_attributes['Color']
    for triangle in mesh.loop_triangles:
        faces.append(tuple(offset + n for n in triangle.vertices))
        colors.extend(tuple(attr.data[n].color) for n in triangle.loops)
mesh = bpy.data.meshes.new('highlights-podium / export')
mesh.from_pydata(vertices, [], faces)
mesh.materials.append(material)
mesh.update()
attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
for index, rgba in enumerate(colors):
    attr.data[index].color = rgba
export = bpy.data.objects.new('highlights-podium', mesh)
scene.collection.objects.link(export)
export['highlights_podium_export'] = True
export['assetVersion'] = 2
export['collisionBoxes'] = [
    {'center': [0, 0, .25], 'size': [5.2, 3.8, .5]},
    {'center': [0, 0, 1.125], 'size': [3.7, 2.62, 1.25]},
    {'center': [0, 0, 2.22], 'size': [1.56, 1.42, .94]},
    {'center': [0, 0, 3.75], 'size': [3.0, 2.8, 2.12]},
]
export['design'] = {'frontAxis': '-Y', 'openCup': True, 'cupRimHeight': 4.85, 'innerFloorHeight': 3.30,
                    'handleCount': 2, 'plaques': ['front', 'back'], 'baseWidth': 5.2, 'baseDepth': 3.8}
bpy.ops.object.select_all(action='DESELECT')
export.select_set(True)
bpy.context.view_layer.objects.active = export
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', use_selection=True, use_active_scene=True,
                          export_yup=True, export_animations=False, export_cameras=False, export_lights=False, export_extras=True)

# Normalize palette bytes, with no decoder, textures or runtime compression cost.
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
minimum = [min(vertex[n] for vertex in vertices) for n in range(3)]
maximum = [max(vertex[n] for vertex in vertices) for n in range(3)]
print(json.dumps({'bytes': OUTPUT.stat().st_size, 'triangles': len(faces), 'sourceParts': len(sources),
                  'min': minimum, 'max': maximum, 'colliders': 4}))
bpy.data.objects.remove(export, do_unlink=True)
for obj in sources:
    obj.select_set(True)
bpy.context.view_layer.objects.active = sources[0]
scene['asset_pipeline'] = 'Crafted stepped sandstone podium, hollow 24-side brass cup, symmetric tubular handles, laurel accents and two geometric HIGHLIGHTS plaques. One byte vertex-colour mesh, no images.'
BLEND.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), copy=True)

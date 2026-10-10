"""Editable arrival pergola and maker workbench, Blender Z-up metres, front -Y.

Run in Blender. The two named meshes share one byte vertex palette and use
structural collision metadata, without textures, a decoder, or a floor slab.
"""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/courtyard-kit.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\courtyard-kit.blend')
scene = bpy.data.scenes.get('Saksham Arrival and Maker Courtyards') or bpy.data.scenes.new('Saksham Arrival and Maker Courtyards')
bpy.context.window.scene = scene
for child in list(scene.collection.children):
    if child.get('courtyard_kit_sources'):
        for obj in list(child.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(child)
for obj in list(scene.collection.objects):
    if obj.get('courtyard_kit_export'):
        bpy.data.objects.remove(obj, do_unlink=True)

material = bpy.data.materials.get('Courtyards / sandstone emerald terracotta palette') or bpy.data.materials.new('Courtyards / sandstone emerald terracotta palette')
material.use_nodes = True
bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .78
vertex_color = next((node for node in material.node_tree.nodes if node.type == 'VERTEX_COLOR'), None) or material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex_color.layer_name = 'Color'
material.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])


def color(value):
    channels = [int(value[n:n + 2], 16) / 255 for n in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels)


STONE = color('D7C5A2')
CREAM = color('EEE3CB')
TEAK = color('73513B')
TEAK_LIGHT = color('AD7C51')
EMERALD = color('245644')
INK = color('19372F')
BRASS = color('D4AE61')
TERRACOTTA = color('C56F51')
COPPER = color('D98950')
SKY = color('80BCAF')
RUBBER = color('363936')
KIT = {}
collection = None
sources = None


def begin(name):
    global collection, sources
    collection = bpy.data.collections.new('Courtyards / %s source pieces' % name)
    collection['courtyard_kit_sources'] = True
    scene.collection.children.link(collection)
    sources = []
    KIT[name] = {'sources': sources}


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
    vertices = [tuple(p + across * a * width / 2 + other * b * width / 2)
                for p in [start, end] for a, b in [(-1, -1), (-1, 1), (1, 1), (1, -1)]]
    return part(name, vertices, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], shade)


def lathe(name, profiles, shade, center=(0, 0, 0), sides=12):
    cx, cy, cz = center
    vertices = [(cx + r * math.cos(n * 2 * math.pi / sides), cy + r * math.sin(n * 2 * math.pi / sides), cz + z)
                for r, z in profiles for n in range(sides)]
    faces = [tuple(reversed(range(sides))), tuple((len(profiles) - 1) * sides + n for n in range(sides))]
    faces.extend((ring * sides + n, ring * sides + (n + 1) % sides, (ring + 1) * sides + (n + 1) % sides, (ring + 1) * sides + n)
                 for ring in range(len(profiles) - 1) for n in range(sides))
    return part(name, vertices, faces, shade)


def ring(name, center, outer, inner, depth, shade, sides=16):
    # A hollow wheel parallel to XZ, its axle points along Y.
    cx, cy, cz = center
    vertices = [(cx + radius * math.cos(n * 2 * math.pi / sides), cy + y, cz + radius * math.sin(n * 2 * math.pi / sides))
                for y, radius in [(-depth / 2, outer), (depth / 2, outer), (-depth / 2, inner), (depth / 2, inner)]
                for n in range(sides)]
    faces = []
    for n in range(sides):
        following = (n + 1) % sides
        faces.extend([(n, following, sides + following, sides + n),
                      (2 * sides + n, 3 * sides + n, 3 * sides + following, 2 * sides + following),
                      (n, 2 * sides + n, 2 * sides + following, following),
                      (sides + n, sides + following, 3 * sides + following, 3 * sides + n)])
    return part(name, vertices, faces, shade)


def glyph_strokes(name, strokes, center, scale, shade, width=.035):
    x, y, z = center
    for index, (a, b) in enumerate(strokes):
        beam('%s / stroke %02d' % (name, index), (x + a[0] * scale, y, z + a[1] * scale),
             (x + b[0] * scale, y, z + b[1] * scale), width, shade)


begin('arrival')
arrival_boxes = []
# The four dressed stone feet provide a tangible base without a raised floor.
# Their generous separation leaves a straight eight-metre central opening.
for side in [-1, 1]:
    for row in [-1, 1]:
        x, y = side * 4.65, row * 1.48
        prefix = 'Arrival / %s %s' % (side, row)
        box(prefix + ' sandstone foot', (x, y, .09), (.60, .60, .18), STONE)
        box(prefix + ' cream foot cap', (x, y, .21), (.45, .45, .06), CREAM)
        box(prefix + ' emerald slender post', (x, y, 1.86), (.20, .20, 3.24), EMERALD)
        box(prefix + ' brass post collar', (x, y, .36), (.222, .222, .10), BRASS)
        box(prefix + ' cream capital', (x, y, 3.48), (.36, .36, .12), CREAM)
        beam(prefix + ' inward knee brace', (x, y, 2.91), (x - side * .54, y, 3.48), .09, TEAK_LIGHT)
        arrival_boxes.extend([
            {'center': [x, y, .12], 'size': [.60, .60, .24]},
            {'center': [x, y, 1.89], 'size': [.20, .20, 3.30]},
        ])
for row in [-1, 1]:
    box('Arrival / %s underside teak beam' % row, (0, row * 1.48, 3.55), (9.72, .22, .20), TEAK)
box('Arrival / quiet cream canopy', (0, 0, 3.785), (9.80, 3.80, .19), CREAM)
# Slim terracotta perimeter and visible repeated timber ends give the canopy
# character while keeping every part inside the precise 10 x 4 metre bounds.
box('Arrival / rear terracotta canopy edge', (0, 1.90, 3.79), (10, .20, .26), TERRACOTTA)
for side in [-1, 1]:
    box('Arrival / %s front terracotta canopy edge' % side, (side * 2.80, -1.90, 3.79), (4.40, .20, .26), TERRACOTTA)
for side in [-1, 1]:
    box('Arrival / %s terracotta side edge' % side, (side * 4.91, 0, 3.79), (.18, 3.60, .26), TERRACOTTA)
for index in range(15):
    x = -4.2 + index * .6
    box('Arrival / roof batten %02d' % index, (x, 0, 3.65), (.12, 3.66, .08), TEAK_LIGHT)
    box('Arrival / front brass batten end %02d' % index, (x, -1.945, 3.67), (.12, .025, .055), BRASS)
arrival_boxes.append({'center': [0, 0, 3.78], 'size': [10, 4, .28]})
box('Arrival / welcome emblem emerald field', (0, -1.929, 3.78), (1.17, .09, .235), EMERALD)
# Bespoke monogram instead of a generated font or texture; both letters face -Y.
glyph_strokes('Arrival / S monogram', [((.66, 1), (0, 1)), ((0, 1), (0, .5)), ((0, .5), (.66, .5)),
                                      ((.66, .5), (.66, 0)), ((.66, 0), (0, 0))], (-.32, -1.988, 3.70), .16, CREAM, .024)
glyph_strokes('Arrival / A monogram', [((0, 0), (.35, 1)), ((.35, 1), (.70, 0)), ((.14, .42), (.56, .42))],
              (.12, -1.988, 3.70), .16, CREAM, .024)

# A sheltered rear seat and tool counter read as a miniature garage forecourt.
for side in [-1, 1]:
    box('Arrival / seat %s sandstone leg' % side, (-2.9 + side * .93, 1.08, .23), (.22, .59, .46), STONE)
box('Arrival / sheltered teak seat', (-2.9, 1.08, .51), (2.60, .70, .10), TEAK_LIGHT)
for index in range(3):
    box('Arrival / seat inset slat %02d' % index, (-2.9, .84 + index * .24, .568), (2.46, .19, .012), TEAK)
arrival_boxes.append({'center': [-2.9, 1.08, .28], 'size': [2.60, .70, .56]})
for side in [-1, 1]:
    box('Arrival / counter %s emerald trestle' % side, (2.8 + side * 1.10, .87, .61), (.14, .98, 1.22), EMERALD)
box('Arrival / counter lower shelf', (2.8, .87, .27), (2.56, .90, .08), TEAK)
box('Arrival / counter teak top', (2.8, .87, 1.235), (2.80, 1.10, .10), TEAK_LIGHT)
box('Arrival / counter brass edge', (2.8, .312, 1.235), (2.80, .016, .047), BRASS)
box('Arrival / rear tool panel', (2.8, 1.425, 1.83), (2.20, .075, .95), EMERALD)
for index in range(5):
    box('Arrival / panel brass peg %02d' % index, (1.93 + index * .42, 1.372, 2.12), (.055, .040, .055), BRASS)
beam('Arrival / large hanging wrench handle', (2.0, 1.355, 1.60), (2.0, 1.355, 2.02), .065, CREAM)
beam('Arrival / wrench left jaw', (2.0, 1.355, 2.00), (1.90, 1.355, 2.07), .065, CREAM)
beam('Arrival / wrench right jaw', (2.0, 1.355, 2.00), (2.10, 1.355, 2.07), .065, CREAM)
beam('Arrival / hanging screwdriver', (2.42, 1.355, 1.55), (2.42, 1.355, 1.95), .025, BRASS)
box('Arrival / screwdriver terracotta grip', (2.42, 1.355, 2.015), (.075, .065, .15), TERRACOTTA)
lathe('Arrival / faceted cream driving helmet', [(.25, 0), (.29, .09), (.27, .23), (.18, .34), (.025, .40)], CREAM, (2.12, .76, 1.285), 12)
box('Arrival / dark helmet visor', (2.12, .487, 1.427), (.37, .032, .105), INK)
box('Arrival / helmet copper stripe', (2.12, .76, 1.68), (.047, .16, .015), TERRACOTTA)
ring('Arrival / spare rubber wheel', (3.58, .81, 1.613), .32, .185, .14, RUBBER)
ring('Arrival / spare brass wheel rim', (3.58, .73, 1.613), .185, .13, .018, BRASS)
for index in range(4):
    angle = index * math.pi / 4
    dx, dz = math.cos(angle) * .145, math.sin(angle) * .145
    beam('Arrival / wheel spoke %02d' % index, (3.58 - dx, .71, 1.613 - dz), (3.58 + dx, .71, 1.613 + dz), .027, CREAM)
arrival_boxes.extend([
    {'center': [2.8, .87, .6425], 'size': [2.80, 1.10, 1.285]},
    {'center': [2.8, 1.425, 1.83], 'size': [2.20, .075, .95]},
])
KIT['arrival']['boxes'] = arrival_boxes
KIT['arrival']['design'] = {'kind': 'arrival', 'front': '-Y', 'openFront': True, 'floorSlab': False,
                            'postCount': 4, 'shelteredBench': True, 'helmetAndTools': True}

begin('maker')
# A real work station rather than a flat reset marker. The front controls stay
# on the open side of the scene; this model occupies only its rack footprint.
for side in [-1, 1]:
    for row in [-1, 1]:
        x, y = side * 1.13, -.32 + row * .49
        box('Maker / %s %s stone foot' % (side, row), (x, y, .04), (.20, .20, .08), STONE)
        box('Maker / %s %s emerald leg' % (side, row), (x, y, .635), (.09, .09, 1.19), EMERALD)
box('Maker / inset lower teak shelf', (0, -.32, .28), (2.35, 1.03, .075), TEAK)
box('Maker / crafted teak top', (0, -.32, 1.27), (2.60, 1.25, .13), TEAK_LIGHT)
box('Maker / darker top inset', (0, -.32, 1.342), (2.43, 1.08, .014), TEAK)
box('Maker / brass workbench edge', (0, -.955, 1.27), (2.60, .023, .054), BRASS)
box('Maker / left drawer cabinet', (-.63, -.32, .815), (1.10, 1.03, .79), EMERALD)
for index in range(3):
    z = .56 + index * .255
    box('Maker / drawer %02d inset' % index, (-.63, -.846, z), (.97, .025, .207), INK)
    box('Maker / drawer %02d brass handle' % index, (-.63, -.880, z), (.30, .035, .035), BRASS)
for side in [-1, 1]:
    # Posts meet the header underside at 2.33 m. Their old 2.40 m caps
    # overlapped the exposed brass top, causing depth fights at oblique views.
    box('Maker / %s tall rear rack post' % side, (side * 1.16, .82, 1.165), (.12, .12, 2.33), EMERALD)
    box('Maker / %s rack sandstone foot' % side, (side * 1.16, .82, .06), (.24, .26, .12), STONE)
box('Maker / upright emerald tool panel', (0, .82, 1.81), (2.46, .10, 1.00), EMERALD)
box('Maker / brass rack header', (0, .82, 2.365), (2.64, .14, .07), BRASS)
for row in range(3):
    for col in range(7):
        box('Maker / peg %02d %02d' % (row, col), (-1.03 + col * .34, .757, 1.51 + row * .26), (.025, .019, .025), BRASS)
beam('Maker / hammer wood handle', (-.83, .725, 1.58), (-.83, .725, 2.06), .064, TEAK_LIGHT)
box('Maker / hammer brass head', (-.83, .725, 2.105), (.31, .085, .13), BRASS)
beam('Maker / screwdriver blade', (-.36, .725, 1.52), (-.36, .725, 1.88), .023, CREAM)
box('Maker / screwdriver terracotta handle', (-.36, .725, 1.986), (.065, .065, .19), TERRACOTTA)
beam('Maker / hanging wrench handle', (.21, .725, 1.56), (.21, .725, 2.02), .058, CREAM)
beam('Maker / wrench jaw left', (.21, .725, 2.02), (.10, .725, 2.09), .058, CREAM)
beam('Maker / wrench jaw right', (.21, .725, 2.02), (.32, .725, 2.09), .058, CREAM)
for index in range(3):
    box('Maker / hanging copper grip %02d' % index, (.67 + index * .12, .725, 1.98), (.04, .055, .25 - index * .04), COPPER)
    box('Maker / hanging steel shaft %02d' % index, (.67 + index * .12, .725, 1.725), (.018, .04, .26), CREAM)

box('Maker / blueprint teal sheet', (-.38, -.33, 1.354), (.94, .74, .014), SKY)
for row in [-1, 1]:
    box('Maker / blueprint %s border' % row, (-.38, -.33 + row * .315, 1.365), (.84, .012, .008), CREAM)
for side in [-1, 1]:
    box('Maker / blueprint %s side' % side, (-.38 + side * .414, -.33, 1.365), (.012, .63, .008), CREAM)
box('Maker / blueprint model plan', (-.43, -.33, 1.368), (.43, .012, .007), CREAM)
for side in [-1, 1]:
    box('Maker / blueprint %s plan upright' % side, (-.43 + side * .21, -.33, 1.369), (.012, .27, .007), CREAM)
box('Maker / brass pencil', (-.27, -.74, 1.378), (.63, .028, .028), BRASS)
box('Maker / pencil dark tip', (.06, -.74, 1.378), (.04, .021, .021), INK)
# Oversized vice silhouette: bench-mounted jaw and visible winding handle.
box('Maker / vice copper foot', (.80, -.39, 1.396), (.42, .40, .084), COPPER)
box('Maker / vice emerald body', (.80, -.39, 1.53), (.27, .27, .22), EMERALD)
box('Maker / vice rear copper jaw', (.80, -.24, 1.67), (.34, .10, .18), TERRACOTTA)
box('Maker / vice front copper jaw', (.80, -.52, 1.67), (.34, .10, .18), TERRACOTTA)
box('Maker / vice cream jaw edge', (.80, -.581, 1.735), (.33, .021, .040), CREAM)
beam('Maker / vice brass winding shaft', (.80, -.53, 1.53), (.80, -.78, 1.53), .039, BRASS)
beam('Maker / vice handle', (.65, -.78, 1.53), (.95, -.78, 1.53), .039, CREAM)
for index, center in enumerate([(.52, -.22, .365), (.91, -.22, .365), (.70, -.20, .51)]):
    box('Maker / spare terracotta brick %02d' % index, center, (.35, .23, .13), TERRACOTTA if index != 1 else STONE)
box('Maker / small green toolbox', (.69, .72, .32), (.59, .37, .41), INK)
box('Maker / toolbox copper lid', (.69, .72, .54), (.62, .40, .035), COPPER)
box('Maker / toolbox handle', (.69, .72, .589), (.22, .045, .06), BRASS)
KIT['maker']['boxes'] = [
    {'center': [0, -.32, .675], 'size': [2.60, 1.25, 1.35]},
    {'center': [-1.16, .82, 1.165], 'size': [.12, .12, 2.33]},
    {'center': [1.16, .82, 1.165], 'size': [.12, .12, 2.33]},
    {'center': [0, .82, 1.81], 'size': [2.46, .10, 1.00]},
    {'center': [0, .82, 2.365], 'size': [2.64, .14, .07]},
]
KIT['maker']['design'] = {'kind': 'maker', 'front': '-Y', 'floorSlab': False, 'drawerCount': 3,
                          'blueprint': True, 'vice': True, 'toolRack': True, 'spareBricks': 3}

exports, report = [], []
for name, item in KIT.items():
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
    mesh = bpy.data.meshes.new('courtyard-%s / export' % name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for index, rgba in enumerate(colors):
        attr.data[index].color = rgba
    export = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(export)
    export['courtyard_kit_export'] = True
    export['assetVersion'] = 1
    export['collisionBoxes'] = item['boxes']
    export['design'] = item['design']
    exports.append(export)
    bounds_min = [min(vertex[n] for vertex in vertices) for n in range(3)]
    bounds_max = [max(vertex[n] for vertex in vertices) for n in range(3)]
    limits = (10, 4, 4) if name == 'arrival' else (2.8, 2.6, 2.4)
    assert abs(bounds_min[2]) < .0001, '%s is not grounded at zero' % name
    assert all(bounds_max[n] - bounds_min[n] <= limits[n] + .0001 for n in range(3)), '%s exceeds its authored placement bounds' % name
    report.append({'mesh': name, 'triangles': len(faces), 'sourceParts': len(item['sources']),
                   'collisionBoxes': len(item['boxes']), 'min': bounds_min, 'max': bounds_max})
assert sum(item['triangles'] for item in report) <= 5000, 'Courtyard kit triangle budget exceeded'
bpy.ops.object.select_all(action='DESELECT')
for export in exports:
    export.select_set(True)
bpy.context.view_layer.objects.active = exports[0]
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
formats = [i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    formats = [i[0] for i in ExportGLTF2_Base.__annotations__['export_format'].keywords['items'](None, bpy.context)]
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format=next(i for i in formats if i == 'GLB'),
                          use_selection=True, use_active_scene=True, export_yup=True,
                          export_animations=False, export_cameras=False, export_lights=False, export_extras=True)

# Repack standard vertex colours as normalized bytes, with no custom extension.
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
assert OUTPUT.stat().st_size <= 350 * 1024, 'Courtyard kit shipping byte budget exceeded'
print(json.dumps({'bytes': OUTPUT.stat().st_size, 'meshes': report, 'triangles': sum(item['triangles'] for item in report)}))
for export in exports:
    bpy.data.objects.remove(export, do_unlink=True)
# Keep editable assemblies apart in the source file; GLB geometry stays local.
for index, item in enumerate(KIT.values()):
    for obj in item['sources']:
        obj.location.x = index * 13
        obj.select_set(True)
bpy.context.view_layer.objects.active = KIT['arrival']['sources'][0]
scene['asset_pipeline'] = 'Arrival garage pergola and maker workbench: two low-poly named meshes, shared byte palette, grounded structural collision boxes, no images, no animation, no floor slab.'
BLEND.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), copy=True)

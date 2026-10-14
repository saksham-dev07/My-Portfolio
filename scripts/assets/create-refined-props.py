"""Blender-authored replacement kit. Z-up metres, front -Y, single vertex palette.

Run through live Blender MCP. Original scenes remain intact; editable parts live
in a dedicated scene, and the GLB contains one named mesh per reusable prop.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.local-history/blender-models/refined-props.blend'
OUTPUT = SOURCE.with_suffix('.raw.glb')
scene = bpy.data.scenes.get('Saksham Refined World Props') or bpy.data.scenes.new('Saksham Refined World Props')
bpy.context.window.scene = scene
for obj in list(scene.objects):
    if obj.get('refined_prop'):
        data=obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        if isinstance(data,bpy.types.Mesh) and data.users==0: bpy.data.meshes.remove(data)
P = {'green':'285545', 'ink':'173B31', 'cream':'E6D9BD', 'white':'F5EBD6', 'copper':'B96E50',
     'wood':'936044', 'woodlight':'B47F54', 'brass':'C9AA70', 'metal':'7E8D89', 'dark':'333F3B',
     'leaf':'3D7550', 'leaflight':'689354', 'soil':'493C2F', 'flower':'DFAC56', 'blue':'73A6A5'}

def linear(value):
    cs = [int(value[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in cs)

materials = {}
for key, value in P.items():
    mat = bpy.data.materials.get('Refined / '+key) or bpy.data.materials.new('Refined / '+key)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*linear(value),1)
    bsdf.inputs['Roughness'].default_value = .75
    materials[key] = mat
palette = bpy.data.materials.get('Refined / export vertex palette') or bpy.data.materials.new('Refined / export vertex palette')
palette.use_nodes = True
bsdf = next(node for node in palette.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .8
attribute = next((n for n in palette.node_tree.nodes if n.type == 'VERTEX_COLOR'),None) or palette.node_tree.nodes.new('ShaderNodeVertexColor')
attribute.layer_name = 'Color'; palette.node_tree.links.new(attribute.outputs['Color'],bsdf.inputs['Base Color'])
kit = {}; current = None

def begin(kind, boxes, **design):
    global current
    current = kind; kit[kind] = {'parts':[], 'boxes':boxes, 'design':dict(kind=kind,version=2,front='-Y',**design)}

def finish(obj, name, color, bevel=0):
    obj.name = current+' / '+name; obj['refined_prop']=True; obj['palette']=color
    obj.data.materials.clear(); obj.data.materials.append(materials[color])
    if bevel:
        modifier=obj.modifiers.new('Small dressed edges','BEVEL'); modifier.width=bevel; modifier.segments=2
        modifier.harden_normals=True
        for poly in obj.data.polygons: poly.use_smooth=True
        weighted=obj.modifiers.new('Weighted face normals','WEIGHTED_NORMAL'); weighted.keep_sharp=True
    kit[current]['parts'].append(obj)
    return obj

def box(name, p, size, color, bevel=.012, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p)
    obj=bpy.context.object; obj.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if rotation: obj.rotation_euler=rotation
    return finish(obj,name,color,bevel)

def cylinder(name,p,radius,height,color,sides=12,rotation=None,radius_top=None):
    bpy.ops.mesh.primitive_cone_add(vertices=sides,radius1=radius,radius2=radius if radius_top is None else radius_top,depth=height,location=p)
    obj=bpy.context.object
    for poly in obj.data.polygons: poly.use_smooth=len(poly.vertices)==4
    if rotation: obj.rotation_euler=rotation
    return finish(obj,name,color)

def beam(name,a,b,radius,color,sides=8):
    a,b=Vector(a),Vector(b); obj=cylinder(name,(a+b)/2,radius,(b-a).length,color,sides)
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return obj

def mesh(name,vertices,faces,color,bevel=0):
    data=bpy.data.meshes.new(current+' / '+name); data.from_pydata(vertices,[],faces); data.update()
    obj=bpy.data.objects.new(current+' / '+name,data); scene.collection.objects.link(obj)
    return finish(obj,name,color,bevel)

def taper(name,z0,z1,w0,d0,w1,d1,color,open_top=False):
    verts=[(x*w/2,y*d/2,z) for z,w,d in [(z0,w0,d0),(z1,w1,d1)] for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]]
    faces=[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    if not open_top: faces.append((4,5,6,7))
    return mesh(name,verts,faces,color,.015)

def leaf(name,root,angle,length,width,color,rise=.16):
    # Curved, folded leaves with a raised midrib and a real underside.
    outline=[(0,0,0),(.45*width,.25*length,.35*rise),(.5*width,.64*length,.80*rise),(0,length,rise),(-.5*width,.64*length,.80*rise),(-.45*width,.25*length,.35*rise)]
    verts=outline+[(0,.53*length,.88*rise)]+[(x,y,z-.008) for x,y,z in outline]+[(0,.53*length,.88*rise-.008)]
    faces=[(i,(i+1)%6,6) for i in range(6)]+[(7+(i+1)%6,7+i,13) for i in range(6)]+[(i,7+i,7+(i+1)%6,(i+1)%6) for i in range(6)]
    c,s=math.cos(angle),math.sin(angle)
    return mesh(name,[(root[0]+x*c-y*s,root[1]+x*s+y*c,root[2]+z) for x,y,z in verts],faces,color)

def text(name,value,p,size,color,back=False):
    data=bpy.data.curves.new(name,'FONT'); data.body=value; data.align_x='CENTER'; data.size=size; data.extrude=.016; data.bevel_depth=.003; data.bevel_resolution=1; data.resolution_u=3
    data.font=bpy.data.fonts.load(r'C:/Windows/Fonts/segoeuib.ttf',check_existing=True)
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj)
    obj.location=p; obj.rotation_euler=(math.pi/2,0,math.pi if back else 0)
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,name,color)

def proxy(center,size): return {'center':list(center),'size':list(size)}

begin('bed',[proxy((0,0,.275),(2.46,.95,.55))],leaves=True,flowers=True,recessedSoil=True)
taper('tapered terracotta vessel',.04,.44,2.16,.70,2.36,.84,'copper',open_top=True)
box('stone sole',(0,0,.04),(2.40,.90,.08),'cream',.02)
for y in [-.425,.425]: box('open coping long side',(0,y,.47),(2.46,.10,.10),'cream',.015)
for x in [-1.18,1.18]: box('open coping end',(x,0,.47),(.10,.77,.10),'cream',.015)
box('recessed soil',(0,0,.425),(2.19,.70,.025),'soil',.004)
for x in [-.7,0,.7]: box('drainage slit',(x,-.426,.16),(.17,.011,.045),'dark',.008)
for i,x in enumerate([-.88,-.44,0,.44,.88]):
    y=.09 if i%2 else -.08
    beam('plant stem',(x,y,.44),(x,y,.61),.012,'leaf')
    for j in range(5): leaf('curved herb leaf',(x,y,.52),j*math.tau/5+i*.7,.21,.14,'leaflight' if j%2 else 'leaf',.18)
for i,x in enumerate([-.63,.05,.67]):
    y=-.14; beam('flower stalk',(x,y,.45),(x+.025,y,.78),.009,'leaf')
    for side in [-1,1]: leaf('flower stem leaf',(x,y,.59),side*1.35,.14,.075,'leaflight',.06)
    for j in range(6): leaf('folded blossom petal',(x+.025,y,.78),j*math.tau/6,.082,.075,'white' if i!=1 else 'flower',.036)
    cylinder('pollen centre',(x+.025,y,.806),.031,.014,'brass',10)

begin('chest',[proxy((0,-.01,.56),(1.47,.92,1.12))],drawers=4,casters=4,handles=True)
for x in [-.52,.52]:
    for y in [-.27,.27]:
        cylinder('rubber caster',(x,y,.105),.105,.08,'dark',12,(0,math.pi/2,0))
        cylinder('caster hub',(x-.042,y,.105),.035,.012,'metal',10,(0,math.pi/2,0))
box('rounded cabinet shell',(0,0,.60),(1.31,.75,.81),'copper',.035)
box('recessed drawer reveal',(0,-.383,.59),(1.17,.025,.74),'ink',.009)
for z in [.32,.51,.70,.89]:
    box('individual drawer face',(0,-.409,z),(1.12,.040,.163),'woodlight',.014)
    beam('drawer pull',(-.26,-.447,z+.01),(.26,-.447,z+.01),.018,'cream')
    for x in [-.27,.27]: box('pull spacer',(x,-.432,z+.01),(.038,.035,.044),'brass',.006)
box('capped worktop',(0,0,1.055),(1.46,.88,.10),'dark',.027)
for x in [-.645,.645]: box('side corner guard',(x,0,.60),(.04,.76,.79),'green',.01)

begin('rack',[proxy((0,0,.85),(1.9,.80,1.7))],tools=['hammer','wrench','screwdriver'],openFrame=True)
for x in [-.83,.83]:
    for y in [-.31,.31]: box('powder coated upright',(x,y,.84),(.055,.055,1.68),'green',.012)
for z in [.17,.76]: box('rounded oak shelf',(0,0,z),(1.86,.78,.075),'wood',.018)
box('pegboard timber cap',(0,.32,1.64),(1.86,.12,.075),'wood',.015)
box('front frame tie',(0,-.31,1.62),(1.70,.055,.055),'green',.010)
box('pegboard backing',(0,.32,1.16),(1.62,.055,.84),'green',.016)
for x in [-.65,-.39,-.13,.13,.39,.65]:
    for z in [.90,1.12,1.34,1.56]: cylinder('pegboard perforation',(x,.283,z),.015,.012,'ink',8,(math.pi/2,0,0))
beam('hammer handle',(-.55,.19,1.0),(-.55,.19,1.43),.031,'woodlight')
box('hammer head',(-.55,.19,1.47),(.27,.12,.10),'metal',.018)
beam('wrench shank',(.05,.19,1.02),(.05,.19,1.40),.022,'cream')
for sign in [-1,1]: beam('wrench open jaw',(.05,.19,1.38),(.05+sign*.08,.19,1.47),.022,'cream')
cylinder('screwdriver grip',(.58,.19,1.40),.040,.23,'copper',12)
beam('screwdriver steel shaft',(.58,.19,1.01),(.58,.19,1.285),.010,'metal')
for x,z in [(-.52,.38),(.43,.38)]:
    box('parts case',(x,-.02,z),(.55,.49,.30),'green',.027)
    box('case seam',(x,-.27,z),(.47,.02,.025),'brass',.004)
    box('case latch',(x,-.29,z+.07),(.07,.035,.07),'cream',.007)
for i,x in enumerate([-.60,-.43,-.25]): box('manual spine',(x,.06,.94),(.12,.39,.30),'cream' if i%2 else 'blue',.008)

begin('bench',[proxy((0,-.02,.46),(2.08,.66,.92))],slattedSeat=True,armrests=True)
for x in [-.76,.76]:
    box('cast leg',(x,0,.25),(.13,.55,.50),'green',.024)
    box('leg foot',(x,0,.025),(.25,.60,.05),'dark',.012)
for y in [-.20,0,.20]: box('rounded seat slat',(0,y,.52),(2.06,.16,.075),'woodlight',.024)
for x in [-.91,.91]: box('back upright',(x,-.28,.72),(.065,.07,.38),'green',.012)
for z in [.69,.85]: box('backrest slat',(0,-.30,z),(2.04,.075,.12),'woodlight',.024)
for x in [-.96,.96]:
    beam('armrest support',(x,.16,.56),(x,.16,.71),.025,'green')
    box('rounded armrest',(x,-.02,.73),(.08,.58,.06),'cream',.025)

begin('lamp',[proxy((0,0,1.25),(.20,.20,2.5))],pitchedRoof=True,frostedLantern=True)
box('dressed stone foot',(0,0,.065),(.43,.43,.13),'cream',.030)
box('foot shoulder',(0,0,.155),(.28,.28,.06),'brass',.015)
cylinder('tapered post',(0,0,1.02),.077,1.69,'green',12,radius_top=.052)
for z in [.24,1.79]: cylinder('post collar',(0,0,z),.089,.06,'brass',12)
box('lower lantern sill',(0,0,1.88),(.45,.45,.07),'green',.016)
box('frosted lamp body',(0,0,2.10),(.34,.34,.37),'white',.015)
for x in [-.19,.19]:
    for y in [-.19,.19]: box('lantern mullion',(x,y,2.10),(.03,.03,.41),'green',.008)
box('upper lantern cornice',(0,0,2.31),(.46,.46,.06),'brass',.014)
taper('pitched lantern roof',2.34,2.46,.60,.60,.08,.08,'green')
cylinder('roof finial',(0,0,2.48),.034,.04,'brass',10)

begin('workshop-lamp',[proxy((0,0,1.15),(.20,.20,2.30))],angledTaskHead=True)
box('cast weighted foot',(0,0,.055),(.44,.44,.11),'dark',.040)
cylinder('industrial upright',(0,0,1.02),.055,1.91,'green',12)
beam('angled task arm',(0,0,1.96),(.23,0,2.18),.044,'green')
cylinder('domed task hood',(.23,0,2.20),.25,.20,'green',16,radius_top=.12)
cylinder('ivory diffuser',(.23,0,2.097),.205,.018,'white',16)
cylinder('hood trim',(.23,0,2.115),.25,.045,'brass',16)

begin('banner-stand',[proxy((0,0,1.925),(.18,.18,3.85))],collaredMast=True)
box('chamfered square foot',(0,0,.065),(.46,.46,.13),'cream',.035)
box('raised plinth shoulder',(0,0,.165),(.30,.30,.07),'brass',.018)
cylinder('tapered mast',(0,0,2.0),.065,3.60,'green',12,radius_top=.045)
for z in [.25,3.61]: cylinder('mast collar',(0,0,z),.078,.07,'brass',12)
beam('hanging rail',(-.04,0,3.73),(1.34,0,3.73),.037,'brass',12)
cylinder('mast cap',(0,0,3.83),.064,.04,'brass',12)

def icon_base():
    box('dressed stone pedestal',(0,0,.085),(1.13,1.13,.17),'cream',.045)
    box('stepped green shoulder',(0,0,.20),(.92,.86,.08),'green',.025)
    box('brass top inlay',(0,0,.258),(.87,.81,.035),'brass',.012)
    cylinder('short mounting stem',(0,0,.40),.07,.25,'green',12)

begin('link-portfolio',[proxy((0,0,.15),(1.13,1.13,.30)),proxy((0,0,1.00),(.94,.30,1.04))],symbol='open-book',twoSided=True)
icon_base()
for side in [-1,1]:
    angle=side*.12
    box('book emerald cover',(side*.225,0,1.02),(.48,.18,1.03),'green',.027,(0,angle,0))
    box('bound ivory pages',(side*.225,-.105,1.035),(.405,.065,.92),'white',.015,(0,angle,0))
    for z in [.88,1.02,1.16,1.30]: beam('embossed page rule',(side*.225-.13,-.15,z),(side*.225+.13,-.15,z),.006,'brass')
    box('back cover inset',(side*.225,.105,1.035),(.40,.025,.90),'woodlight',.014,(0,angle,0))
beam('book spine',(0,-.03,.52),(0,-.03,1.51),.026,'brass')
box('ribbon bookmark',(.27,-.155,.74),(.045,.016,.40),'copper',.005)

begin('link-github',[proxy((0,0,.15),(1.13,1.13,.30)),proxy((0,0,1.04),(.96,.32,.96))],symbol='cat-medallion',twoSided=True)
icon_base()
cylinder('brass medallion',(0,0,1.04),.48,.15,'brass',32,(math.pi/2,0,0))
for sign in [-1,1]:
    cylinder('emerald round face',(0,sign*.081,1.04),.435,.020,'green',32,(math.pi/2,0,0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=(0,sign*.13,1.07))
    obj=bpy.context.object; obj.scale=(.30,.058,.225); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for poly in obj.data.polygons: poly.use_smooth=True
    finish(obj,'smooth cat relief','white')
    for side in [-1,1]:
        verts=[(side*.13,sign*.13,1.22),(side*.29,sign*.13,1.20),(side*.23,sign*.13,1.40),(side*.13,sign*.17,1.22),(side*.29,sign*.17,1.20),(side*.23,sign*.17,1.40)]
        mesh('cat ear',verts,[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],'white',.008)
        cylinder('cat eye',(side*.10,sign*.191,1.10),.027,.012,'green',12,(math.pi/2,0,0))
    box('cat shoulders',(0,sign*.126,.85),(.32,.055,.20),'white',.04)

begin('link-linkedin',[proxy((0,0,.15),(1.13,1.13,.30)),proxy((0,0,1.06),(.97,.25,.98))],symbol='in',twoSided=True)
icon_base()
box('rounded brass badge',(0,0,1.06),(.97,.20,.97),'brass',.075)
for sign in [-1,1]:
    box('emerald badge face',(0,sign*.109,1.06),(.89,.025,.89),'green',.070)
    text('readable in relief','in',(0,sign*.133,.80),.72,'white',back=sign>0)

begin('link-mail',[proxy((0,0,.15),(1.13,1.13,.30)),proxy((0,0,1.02),(1.02,.23,.75))],symbol='envelope',twoSided=True)
icon_base()
box('brass envelope casing',(0,0,1.02),(1.02,.21,.75),'brass',.04)
for sign in [-1,1]:
    box('ivory paper face',(0,sign*.117,1.02),(.95,.045,.68),'white',.025)
    for side in [-1,1]:
        beam('folded upper flap',(side*.43,sign*.153,1.30),(0,sign*.153,.99),.012,'copper')
        beam('folded lower corner',(side*.43,sign*.153,.72),(side*.10,sign*.153,.98),.009,'cream')
    cylinder('round wax seal',(0,sign*.158,.99),.055,.018,'green',16,(math.pi/2,0,0))

exports=[]; report=[]; depsgraph=bpy.context.evaluated_depsgraph_get()
for kind,item in kit.items():
    verts=[]; faces=[]; colors=[]; normals=[]
    for obj in item['parts']:
        evaluated=obj.evaluated_get(depsgraph); data=bpy.data.meshes.new_from_object(evaluated); data.calc_loop_triangles()
        offset=len(verts); transform=obj.matrix_world; normal_matrix=transform.to_3x3().inverted().transposed()
        verts.extend(tuple(transform@v.co) for v in data.vertices)
        shade=linear(P[obj['palette']])
        for triangle in data.loop_triangles:
            faces.append(tuple(offset+v for v in triangle.vertices))
            for loop in triangle.loops:
                colors.append((*shade,1)); normals.append(tuple((normal_matrix@data.corner_normals[loop].vector).normalized()))
        bpy.data.meshes.remove(data)
    data=bpy.data.meshes.new(kind+' / shipping'); data.from_pydata(verts,[],faces); data.update(); data.materials.append(palette)
    for poly in data.polygons: poly.use_smooth=True
    data.normals_split_custom_set(normals)
    attr=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    for i,rgba in enumerate(colors): attr.data[i].color=rgba
    obj=bpy.data.objects.new(kind,data); scene.collection.objects.link(obj); obj['refined_prop']=True
    obj['assetVersion']=2; obj['design']=item['design']; obj['collisionBoxes']=item['boxes']; exports.append(obj)
    report.append({'kind':kind,'triangles':len(faces),'parts':len(item['parts']),'min':[min(v[a] for v in verts) for a in range(3)],'max':[max(v[a] for v in verts) for a in range(3)]})

bpy.ops.object.select_all(action='DESELECT')
for obj in exports: obj.select_set(True)
bpy.context.view_layer.objects.active=exports[0]
formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    formats=[item[0] for item in ExportGLTF2_Base.__annotations__['export_format'].keywords['items'](None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(v for v in formats if v=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
for obj in exports: bpy.data.objects.remove(obj,do_unlink=True)
for index,(kind,item) in enumerate(kit.items()):
    parent=bpy.data.objects.new('Preview / '+kind,None); parent['refined_prop']=True; scene.collection.objects.link(parent)
    for obj in item['parts']:
        obj.location.x+=(index%4)*3.4; obj.location.y+=(index//4)*4.6
        obj.parent=parent
        obj.select_set(True)
scene['pipeline']='11 grounded Blender meshes, preserved weighted normals, shared palette, two-sided link reliefs, collision metadata.'
SOURCE.parent.mkdir(parents=True,exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE),copy=True)
print(json.dumps({'path':str(OUTPUT),'bytes':OUTPUT.stat().st_size,'source':str(SOURCE),'meshes':report}))

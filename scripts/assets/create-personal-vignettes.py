"""Five deliberately faceted Saksham activity scenes, authored in Blender.

Photo is a local facial reference only. No photograph or texture is exported.
Z-up metres; each exported vignette has its own origin, looking towards -Y.
"""
import bpy
import bmesh
import json
import math
import struct
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'experiments/saksham-driving-world/static/saksham/models/personal-vignettes.glb'
BLEND = Path(r'C:\Users\agarw\.codex\visualizations\2026\10\08\01a11b9f-5064-7930-aa57-1dcb0a1f368e\personal-vignettes.blend')
MANIFEST = BLEND.with_suffix('.json')
REFERENCE = Path(r'C:\Users\agarw\Downloads\profile-studio.jpg')

scene = bpy.data.scenes.get('Saksham Personal Vignettes') or bpy.data.scenes.new('Saksham Personal Vignettes')
bpy.context.window.scene = scene
collection = scene.collection.children.get('Personal Vignette Sources')
if collection is None:
    collection = bpy.data.collections.new('Personal Vignette Sources')
    scene.collection.children.link(collection)
for obj in list(collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in list(scene.collection.objects):
    if obj.get('personal_vignette_export'):
        bpy.data.objects.remove(obj, do_unlink=True)

# A named local reference stays editable in the blend and is not in the GLB.
reference = next((image for image in bpy.data.images if image.filepath == str(REFERENCE)), None)
if reference is None and REFERENCE.exists():
    reference = bpy.data.images.load(str(REFERENCE), check_existing=True)
    reference.name = 'Saksham / face reference / do not export'

material = bpy.data.materials.get('Personal vignettes / vertex palette') or bpy.data.materials.new('Personal vignettes / vertex palette')
material.use_nodes = True
bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Roughness'].default_value = .82
vertex_color = next((node for node in material.node_tree.nodes if node.type == 'VERTEX_COLOR'), None) or material.node_tree.nodes.new('ShaderNodeVertexColor')
vertex_color.layer_name = 'Color'
material.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])

def color(value):
    channels = [int(value[n:n+2], 16) / 255 for n in (0, 2, 4)]
    return tuple(c / 12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in channels)

SKIN = color('BC7E55')
SKIN_LIGHT = color('D49A6E')
HAIR = color('232127')
BEARD = color('4D3930')
SHIRT = color('303342')
PANTS = color('596B86')
SOLE = color('E4DCCC')
SHOES = color('323440')
SILVER = color('C5D0D1')
WOOD = color('B98D66')
CREAM = color('E9DDC1')
TEAL = color('559B93')
DARK = color('303B50')
CORAL = color('DC836B')
GOLD = color('D8AD5F')
DISPLAY = color('8ED5CB')
sources, collisions, pose_landmarks = {}, {}, {}
head_frame = Matrix.Identity(4)

def part(asset, label, vertices, faces, shade, face=False):
    if face:
        vertices = [tuple(head_frame @ Vector(vertex)) for vertex in vertices]
    mesh = bpy.data.meshes.new(asset+' / '+label)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    mesh.update()
    obj = bpy.data.objects.new(asset+' / '+label, mesh)
    collection.objects.link(obj)
    obj['runtime_name'] = asset
    obj['component'] = label
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    for polygon in mesh.polygons:
        illumination = .94 + .06*max(0, polygon.normal.z)
        for loop in polygon.loop_indices:
            attr.data[loop].color = (*[min(1, c*illumination) for c in shade], 1)
    sources.setdefault(asset, []).append(obj)
    return obj

def box(asset, label, center, size, shade, rotation=0, face=False, collider=False, tilt=0):
    center = Vector(center)
    rotate = Matrix.Rotation(rotation, 3, 'Z') @ Matrix.Rotation(tilt, 3, 'X')
    vertices = [tuple(center+rotate@Vector((x*size[0]/2, y*size[1]/2, z*size[2]/2))) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    faces = [(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)]
    obj = part(asset, label, vertices, faces, shade, face)
    if collider:
        collisions.setdefault(asset, []).append({'name': label, 'center': list(center), 'size': list(size), 'rotationZ': rotation})
    return obj

def beam(asset, label, a, b, radius, shade, radius_b=None, sides=5, face=False):
    a, b = Vector(a), Vector(b)
    axis = (b-a).normalized()
    seed = Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))
    u = axis.cross(seed).normalized()
    v = axis.cross(u).normalized()
    vertices = []
    for point, r in [(a, radius), (b, radius if radius_b is None else radius_b)]:
        for n in range(sides):
            angle = 2*math.pi*n/sides+math.pi/4
            vertices.append(tuple(point+r*(u*math.cos(angle)+v*math.sin(angle))))
    faces = [tuple(reversed(range(sides))), tuple(range(sides, 2*sides))]
    faces.extend((n,(n+1)%sides,(n+1)%sides+sides,n+sides) for n in range(sides))
    return part(asset, label, vertices, faces, shade, face)

def octa(asset, label, center, size, shade, face=False):
    x,y,z = center
    sx,sy,sz = size
    vertices = [(x+sx,y,z),(x-sx,y,z),(x,y+sy,z),(x,y-sy,z),(x,y,z+sz),(x,y,z-sz)]
    faces = [(4,0,2),(4,2,1),(4,1,3),(4,3,0),(5,2,0),(5,1,2),(5,3,1),(5,0,3)]
    return part(asset, label, vertices, faces, shade, face)

def cylinder(asset, label, center, radius, depth, shade, sides=8, axis=(0,0,1), collider=False):
    direction=Vector(axis).normalized()*depth/2
    beam(asset,label,Vector(center)-direction,Vector(center)+direction,radius,shade,sides=sides)
    if collider:
        # These exports use only vertical collidable cylinders; box proxy encloses trunk.
        collisions.setdefault(asset,[]).append({'name':label,'center':list(center),'size':[radius*2,radius*2,depth],'rotationZ':0})

def sphere(asset, label, center, radius, shade):
    bm=bmesh.new()
    bmesh.ops.create_icosphere(bm,subdivisions=2,radius=radius)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    vertices=[tuple(v.co+Vector(center)) for v in bm.verts]
    faces=[tuple(v.index for v in polygon.verts) for polygon in bm.faces]
    bm.free()
    return part(asset,label,vertices,faces,shade)

def bent_limb(asset, label, points, radii, shade, sides=5):
    points=[Vector(point) for point in points]
    vertices=[]
    for n,(center,radius) in enumerate(zip(points,radii)):
        axis=(points[min(n+1,len(points)-1)]-points[max(n-1,0)]).normalized()
        seed=Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))
        u=axis.cross(seed).normalized()
        v=axis.cross(u).normalized()
        for side in range(sides):
            angle=2*math.pi*side/sides+math.pi/4
            vertices.append(tuple(center+radius*(u*math.cos(angle)+v*math.sin(angle))))
    faces=[tuple(reversed(range(sides))),tuple((len(points)-1)*sides+n for n in range(sides))]
    faces.extend((ring*sides+n,ring*sides+(n+1)%sides,(ring+1)*sides+(n+1)%sides,(ring+1)*sides+n) for ring in range(len(points)-1) for n in range(sides))
    return part(asset,label,vertices,faces,shade)

def head(asset, center, yaw=0, pitch=0):
    global head_frame
    head_frame=Matrix.Translation(Vector(center)) @ Matrix.Rotation(yaw,4,'Z') @ Matrix.Rotation(pitch,4,'X')
    # Eight-sided horizontal rings make the cheekbones/jaw legible with 44 triangles.
    perimeter=[(-.105,-.070),(-.077,-.110),(.077,-.110),(.105,-.070),(.110,.045),(.073,.087),(-.073,.087),(-.110,.045)]
    vertices=[]
    for height,scale in [(-.145,.73),(-.07,.99),(.135,1.0)]:
        vertices.extend((x*scale,y*scale,height) for x,y in perimeter)
    faces=[tuple(reversed(range(8))),tuple(range(16,24))]
    faces.extend((ring*8+n,ring*8+(n+1)%8,(ring+1)*8+(n+1)%8,(ring+1)*8+n) for ring in range(2) for n in range(8))
    part(asset,'angular jaw and face',vertices,faces,SKIN_LIGHT,True)
    # Hair has a swept, slightly asymmetric ridge and a visible tapered hairline.
    bottom=[(x*1.045,y*1.045,.100 if y<-.06 else -.010 if abs(x)>.10 else .045) for x,y in perimeter]
    upper=[(-.10,-.070,.172),(-.072,-.105,.185),(.080,-.10,.151),(.109,-.064,.130),(.113,.045,.147),(.066,.095,.171),(-.073,.095,.194),(-.112,.04,.185)]
    vertices=bottom+upper+[(-.047,.015,.203)]
    faces=[(n,(n+1)%8,(n+1)%8+8,n+8) for n in range(8)]
    faces.extend((n+8,(n+1)%8+8,16) for n in range(8))
    part(asset,'swept hair silhouette',vertices,faces,HAIR,True)
    octa(asset,'left ear',(-.113,.005,-.018),(.025,.024,.043),SKIN,True)
    octa(asset,'right ear',(.113,.005,-.018),(.025,.024,.043),SKIN,True)
    nose=[(-.018,-.112,.03),(.018,-.112,.03),(-.020,-.120,-.045),(.020,-.120,-.045),(0,-.153,-.034)]
    part(asset,'simple nose bridge',nose,[(0,1,4),(1,3,4),(3,2,4),(2,0,4),(0,2,3,1)],SKIN,True)
    part(asset,'short beard and chin',[(-.076,-.094,-.082),(.076,-.094,-.082),(.058,-.087,-.139),(-.058,-.087,-.139),(0,-.111,-.124)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],BEARD,True)
    part(asset,'thin moustache',[(-.044,-.118,-.057),(0,-.123,-.048),(.044,-.118,-.057),(.038,-.119,-.068),(0,-.124,-.059),(-.038,-.119,-.068)],[(0,1,4,5),(1,2,3,4)],BEARD,True)
    part(asset,'quiet mouth',[(-.030,-.116,-.079),(.030,-.116,-.079),(.021,-.119,-.084),(-.021,-.119,-.084)],[(0,1,2,3)],SKIN,True)
    for side in [-1,1]:
        cx=.052*side
        # Fine octagonal wire frames, open lenses, no opaque discs covering the eyes.
        outline=[(-.038,-.017),(-.026,-.029),(.027,-.029),(.040,-.015),(.040,.020),(.027,.032),(-.027,.032),(-.040,.017)]
        for n in range(8):
            a,b=outline[n],outline[(n+1)%8]
            beam(asset,('left' if side<0 else 'right')+' glasses wire %02d'%n,(cx+a[0],-.120,a[1]+.029),(cx+b[0],-.120,b[1]+.029),.0037,SILVER,sides=3,face=True)
        box(asset,('left' if side<0 else 'right')+' eye',(cx,-.113,.030),(.024,.005,.012),HAIR,face=True)
        beam(asset,('left' if side<0 else 'right')+' eyebrow',(cx-.024,-.115,.068),(cx+.025,-.115,.071),.005,HAIR,sides=3,face=True)
        beam(asset,('left' if side<0 else 'right')+' glasses temple',(side*.091,-.113,.045),(side*.114,.033,.021),.004,HAIR,sides=3,face=True)
    beam(asset,'glasses bridge',(-.013,-.122,.039),(.013,-.122,.039),.004,SILVER,sides=3,face=True)

def torso(asset, pelvis, shoulders, shirt=SHIRT, heading=0):
    px,py,pz=pelvis
    sx,sy,sz=shoulders
    rotation=Matrix.Rotation(heading,3,'Z')
    vertices=[]
    for center,width,depth in [(Vector(pelvis),.145,.092),(Vector(pelvis).lerp(Vector(shoulders),.54),.176,.108),(Vector(shoulders),.225,.108)]:
        # Chamfered side seams and a waist/chest transition avoid a cardboard torso.
        ring=[(-width+.032,-depth),(width-.032,-depth),(width,-depth+.032),(width,depth-.032),(width-.032,depth),(-width+.032,depth),(-width,depth-.032),(-width,-depth+.032)]
        vertices.extend(tuple(center+rotation@Vector((x,y,0))) for x,y in ring)
    faces=[tuple(reversed(range(8))),tuple(range(16,24))]
    faces.extend((ring*8+n,ring*8+(n+1)%8,(ring+1)*8+(n+1)%8,(ring+1)*8+n) for ring in range(2) for n in range(8))
    part(asset,'shaped crew-neck shirt with side seams',vertices,faces,shirt)
    beam(asset,'neck',(sx,sy,sz-.01),(sx,sy,sz+.09),.063,SKIN,sides=5)
    collisions.setdefault(asset,[]).append({'name':'torso','center':[(px+sx)/2,(py+sy)/2,(pz+sz)/2],'size':[.39,.24,sz-pz+.08],'rotationZ':heading})

def body(asset, pelvis=(0,0,.9), shoulders=(0,0,1.43), arms=None, legs=None, yaw=0, shirt=SHIRT, heading=0, head_pitch=0, foot_tilts=(0,0)):
    torso(asset,pelvis,shoulders,shirt,heading)
    box(asset,'trouser waist',pelvis,(.29,.21,.19),PANTS,rotation=heading)
    sx,sy,sz=shoulders
    if arms is None:
        arms=[((- .22,sy,sz-.035),(-.27,sy-.03,1.10),(-.24,sy-.05,.88)),((.22,sy,sz-.035),(.27,sy-.03,1.10),(.24,sy-.05,.88))]
    for n,(shoulder,elbow,wrist) in enumerate(arms):
        label='left' if n==0 else 'right'
        sleeve_end=Vector(shoulder).lerp(Vector(elbow),.44)
        beam(asset,label+' short sleeve',shoulder,sleeve_end,.095,shirt,radius_b=.084,sides=5)
        bent_limb(asset,label+' connected upper arm and forearm',[sleeve_end,elbow,wrist],[.063,.056,.040],SKIN)
        octa(asset,label+' hand',wrist,(.052,.042,.062),SKIN_LIGHT)
    px,py,pz=pelvis
    if legs is None:
        legs=[((px-.085,py,pz-.02),(px-.11,py,.48),(px-.13,py,.10)),((px+.085,py,pz-.02),(px+.11,py,.48),(px+.13,py,.10))]
    for n,(hip,knee,ankle) in enumerate(legs):
        label='left' if n==0 else 'right'
        bent_limb(asset,label+' connected thigh knee and lower leg',[hip,knee,ankle],[.093,.079,.053],PANTS)
        # Feet follow ankle height and body heading, including lifted dunk feet.
        rotation=Matrix.Rotation(heading,3,'Z') @ Matrix.Rotation(foot_tilts[n],3,'X')
        shoe_center=Vector(ankle)+rotation@Vector((0,-.04,-.025))
        sole_center=Vector(ankle)+rotation@Vector((0,-.04,-.084))
        box(asset,label+' sneaker',shoe_center,(.15,.27,.12),SHOES,rotation=heading,tilt=foot_tilts[n])
        box(asset,label+' sneaker sole',sole_center,(.155,.275,.032),SOLE,rotation=heading,tilt=foot_tilts[n])
        for segment,a,b,radius in [('thigh',hip,knee,.09),('shin',knee,ankle,.065)]:
            center=Vector(a).lerp(Vector(b),.5)
            # Narrow per-limb solids preserve the gap between the legs.
            collisions.setdefault(asset,[]).append({'name':label+' '+segment,'center':list(center),'size':[abs(b[0]-a[0])+radius*2,abs(b[1]-a[1])+radius*2,abs(b[2]-a[2])+radius*2],'rotationZ':0})
    head(asset,(sx,sy,sz+.236),yaw,head_pitch)

def chair(asset, center, seat=.48, shade=TEAL):
    x,y=center
    box(asset,'chair seat',(x,y,seat),(.50,.48,.10),shade,collider=True)
    box(asset,'chair back',(x,y+.22,seat+.27),(.5,.075,.48),shade,collider=True)
    for xx,yy in [(-.19,-.16),(.19,-.16),(-.19,.17),(.19,.17)]:
        beam(asset,'chair timber leg',(x+xx,y+yy,.03),(x+xx,y+yy,seat-.03),.026,WOOD,sides=4)

# Frozen just before a one-handed dunk: raised ball, torso leaning into the rim,
# one knee folded back and the other leg trailing, both feet clearly airborne.
asset='activity-basketball'
body(asset,pelvis=(-.11,-.09,1.55),shoulders=(.15,.20,2.13),
     arms=[((.233,-.009,2.095),(.08,-.32,1.97),(-.20,-.43,2.08)),((.067,.409,2.095),(.30,.51,2.415),(.60,.53,2.78))],
     legs=[((-.08,-.17,1.53),(-.43,-.37,1.10),(-.80,-.43,1.39)),((-.14,-.01,1.53),(-.06,-.48,1.16),(-.34,-.73,.77))],
     shirt=color('3D586C'),heading=1.95,yaw=2.20,head_pitch=-.49,foot_tilts=(-.35,.24))
sphere(asset,'orange basketball entering rim',(.66,.56,2.90),.145,color('D38B43'))
for x in [.62,.70]:
    beam(asset,'basketball dark seam',(x,.426,2.84),(x,.426,2.96),.005,DARK,sides=3)
box(asset,'hoop weighted foot',(.74,.98,.06),(.58,.50,.12),DARK,collider=True)
cylinder(asset,'hoop post',(.74,1.03,1.53),.042,3.0,DARK,sides=6,collider=True)
box(asset,'backboard frame',(.74,.96,2.92),(.90,.07,.62),TEAL,collider=True)
box(asset,'backboard white face',(.74,.918,2.92),(.81,.018,.53),CREAM)
for center,size in [((.74,.903,2.97),(.34,.007,.015)),((.74,.903,2.79),(.34,.007,.015)),((.57,.903,2.88),(.015,.007,.18)),((.91,.903,2.88),(.015,.007,.18))]:
    box(asset,'backboard target',center,size,CORAL)
for n in range(12):
    angle=n*math.pi/6
    other=(n+1)*math.pi/6
    beam(asset,'hoop rim %02d'%n,(.74+.20*math.cos(angle),.63+.20*math.sin(angle),2.75),(.74+.20*math.cos(other),.63+.20*math.sin(other),2.75),.013,CORAL,sides=3)
for n in range(6):
    angle=n*math.pi/3
    beam(asset,'simplified hoop net %02d'%n,(.74+.19*math.cos(angle),.63+.19*math.sin(angle),2.74),(.74+.10*math.cos(angle+.28),.63+.10*math.sin(angle+.28),2.48),.004,CREAM,sides=3)
pose_landmarks[asset]={'rightHand':[.60,.53,2.78],'ballCenter':[.66,.56,2.90],'ballRadius':.145,'rimCenter':[.74,.63,2.75],'rimRadius':.20,'ankles':[[-.80,-.43,1.39],[-.34,-.73,.77]],'headYaw':2.20,'headPitch':-.49}

asset='activity-coding'
chair(asset,(0,.35),seat=.48)
body(asset,pelvis=(0,.34,.59),shoulders=(0,.27,1.06),
     arms=[((-.22,.27,1.025),(-.26,-.12,.86),(-.20,-.44,.82)),((.22,.27,1.025),(.26,-.12,.86),(.20,-.44,.82))],
     legs=[((-.085,.34,.58),(-.16,-.07,.49),(-.16,-.15,.10)),((.085,.34,.58),(.16,-.07,.49),(.16,-.15,.10))])
box(asset,'slender desk top',(0,-.58,.77),(1.25,.60,.075),WOOD,collider=True)
for xx in [-.54,.54]:
    for yy in [-.81,-.35]:
        box(asset,'desk leg',(xx,yy,.36),(.045,.045,.72),DARK,collider=True)
box(asset,'laptop keyboard',(0,-.59,.829),(.55,.33,.035),DARK)
box(asset,'laptop screen frame',(0,-.745,.98),(.48,.035,.285),DARK)
box(asset,'laptop luminous display',(0,-.721,.98),(.425,.008,.23),DISPLAY)
for n,length in enumerate([.23,.31,.17,.28]):
    box(asset,'editor line %02d'%n,(-.035,-.714,1.045-n*.033),(length,.005,.008),CREAM)
cylinder(asset,'tea mug',(.47,-.54,.88),.048,.16,CREAM,sides=6)

asset='activity-tv'
box(asset,'sofa lower body',(-.36,.36,.31),(1.54,.71,.36),TEAL,collider=True)
box(asset,'sofa back',(-.36,.68,.63),(1.54,.17,.61),TEAL,collider=True)
for x in [-1.02,.30]:
    box(asset,'sofa arm',(x,.36,.49),(.18,.73,.39),TEAL,collider=True)
for x in [-.90,.19]:
    for y in [.1,.61]:
        box(asset,'sofa short foot',(x,y,.073),(.075,.075,.146),WOOD)
box(asset,'spare sofa cushion',(.03,.34,.52),(.38,.52,.09),color('77B3A5'))
body(asset,pelvis=(-.55,.27,.57),shoulders=(-.54,.38,1.03),
     arms=[((-.76,.38,.995),(-.82,.16,.72),(-.82,-.08,.64)),((-.32,.38,.995),(-.25,.12,.76),(-.20,-.10,.65))],
     legs=[((-.635,.27,.56),(-.71,-.16,.48),(-.76,-.45,.10)),((-.465,.27,.56),(-.42,-.13,.48),(-.40,-.40,.10))],yaw=1.45)
# TV is offset to the side, keeping the figure's complete legs visible in the main view.
box(asset,'TV console',(1.02,.25,.28),(.93,.40,.48),WOOD,rotation=1.5,collider=True)
box(asset,'TV screen body',(1.02,.25,.96),(1.02,.095,.66),DARK,rotation=1.5,collider=True)
box(asset,'TV screen colour',(.966,.254,.96),(.92,.008,.56),DISPLAY,rotation=1.5)
box(asset,'TV screen broad graphic',(.959,.254,.97),(.72,.008,.055),color('E3C786'),rotation=1.5)
beam(asset,'TV neck',(1.02,.25,.51),(1.02,.25,.66),.029,DARK,sides=4)
box(asset,'TV remote',(-.21,-.11,.669),(.05,.11,.023),DARK)

asset='activity-gym'
body(asset,pelvis=(0,0,.92),shoulders=(0,0,1.43),
     arms=[((-.22,0,1.40),(-.41,-.05,1.16),(-.39,-.31,1.32)),((.22,0,1.40),(.41,-.05,1.16),(.39,-.31,1.32))],
     legs=[((-.085,0,.90),(-.17,.01,.48),(-.20,-.02,.10)),((.085,0,.90),(.17,.01,.48),(.20,-.02,.10))],shirt=color('3B5555'))
for x in [-.39,.39]:
    cylinder(asset,'dumbbell silver grip',(x,-.32,1.32),.022,.27,SILVER,sides=6,axis=(1,0,0))
    for xx in [x-.12,x+.12]:
        cylinder(asset,'dumbbell faceted weight',(xx,-.32,1.32),.083,.045,DARK,sides=8,axis=(1,0,0))
box(asset,'exercise mat',(0,-.17,.012),(1.10,1.12,.024),color('788B75'))
# Compact workout station: two loose weights flanking the mat, one by the bench.
floor_weights=[(-.78,-.55,.21),(.78,-.61,-.18),(.89,.79,.08)]
for n,(x,y,angle) in enumerate(floor_weights):
    axis=(math.cos(angle),math.sin(angle),0)
    cylinder(asset,'floor dumbbell %02d grip'%n,(x,y,.108),.026,.29,SILVER,sides=6,axis=axis)
    for end in [-1,1]:
        xx=x+end*.145*axis[0];yy=y+end*.145*axis[1]
        cylinder(asset,'floor dumbbell %02d plate'%n,(xx,yy,.108),.105,.048,DARK,sides=8,axis=axis)
    collisions.setdefault(asset,[]).append({'name':'floor dumbbell %02d'%n,'center':[x,y,.108],'size':[.34,.21,.21],'rotationZ':angle})
box(asset,'gym bench cushion',(0,.96,.46),(1.10,.36,.12),TEAL,collider=True)
for x in [-.43,.43]:
    for y in [.84,1.08]:
        beam(asset,'bench splayed foot',(x*1.13,y,.025),(x,y,.41),.029,DARK,sides=4)
box(asset,'folded towel on bench',(-.30,.96,.556),(.35,.23,.072),CREAM)
cylinder(asset,'water flask by towel',(-.53,.96,.70),.061,.36,TEAL,sides=6)
pose_landmarks[asset]={'floorDumbbells':[[x,y,.108] for x,y,_ in floor_weights],'benchCenter':[0,.96,.46]}

asset='activity-gaming'
# Centred directly before the controls, looking into the machine; both hands work.
body(asset,pelvis=(.505,-.90,.90),shoulders=(.505,-.86,1.42),
     arms=[((.725,-.86,1.385),(.75,-.65,1.16),(.66,-.33,1.00)),((.285,-.86,1.385),(.26,-.57,1.23),(.34,-.34,1.09))],
     legs=[((.59,-.90,.88),(.61,-.91,.48),(.64,-.88,.10)),((.42,-.90,.88),(.40,-.95,.48),(.37,-.96,.10))],
     heading=math.pi,yaw=math.pi-.08,head_pitch=.18)
vertices=[(.12,-.37,0),(.89,-.37,0),(.89,.35,0),(.12,.35,0),(.12,-.32,.88),(.89,-.32,.88),(.89,.35,1.79),(.12,.35,1.79),(.12,-.07,1.55),(.89,-.07,1.55),(.12,-.31,1.79),(.89,-.31,1.79)]
part(asset,'arcade shaped cabinet',vertices,[(0,3,2,1),(0,1,5,4),(4,5,9,8),(8,9,11,10),(10,11,6,7),(3,7,6,2),(0,4,8,10,7,3),(1,2,6,11,9,5)],CORAL)
collisions.setdefault(asset,[]).append({'name':'arcade cabinet lower','center':[.505,-.01,.44],'size':[.77,.72,.88],'rotationZ':0})
collisions.setdefault(asset,[]).append({'name':'arcade cabinet upper','center':[.505,.13,1.33],'size':[.77,.44,.92],'rotationZ':0})
box(asset,'arcade screen frame',(.505,-.17,1.325),(.64,.034,.43),DARK,tilt=-.357)
box(asset,'arcade game display',(.505,-.192,1.333),(.54,.012,.335),DISPLAY,tilt=-.357)
for x,z in [(.34,1.32),(.48,1.41),(.61,1.27)]:
    box(asset,'game blocks',(x,-.199+(z-1.333)*.373,z),(.08,.005,.045),GOLD,tilt=-.357)
box(asset,'arcade control deck',(.505,-.305,.94),(.83,.29,.075),DARK)
cylinder(asset,'joystick stem',(.34,-.34,1.04),.012,.14,SILVER,sides=5)
octa(asset,'joystick knob',(.34,-.34,1.12),(.040,.040,.040),CORAL)
for x in [.55,.66]:
    cylinder(asset,'arcade action button',(x,-.33,.99),.028,.025,GOLD,sides=6)
box(asset,'arcade marquee',(.505,-.338,1.688),(.55,.012,.12),CREAM)
for x in [.33,.44,.55,.66]:
    box(asset,'marquee light',(x,-.347,1.688),(.045,.008,.045),TEAL)
pose_landmarks[asset]={'playerCenter':[.505,-.90,.90],'cabinetCenter':[.505,-.01,.44],'rightHand':[.34,-.34,1.09],'joystickKnob':[.34,-.34,1.12],'leftHand':[.66,-.33,1.00],'actionButton':[.66,-.33,.99],'bodyHeading':math.pi}

exports=[]
stats={}
for index,(asset,parts) in enumerate(sources.items()):
    vertices,faces,colors=[],[],[]
    for obj in parts:
        mesh=obj.data
        mesh.calc_loop_triangles()
        offset=len(vertices)
        vertices.extend(tuple(vertex.co) for vertex in mesh.vertices)
        attr=mesh.color_attributes['Color']
        for triangle in mesh.loop_triangles:
            faces.append(tuple(offset+i for i in triangle.vertices))
            colors.extend(tuple(attr.data[i].color) for i in triangle.loops)
    mesh=bpy.data.meshes.new(asset+' / export')
    mesh.from_pydata(vertices,[],faces)
    mesh.materials.append(material)
    mesh.update()
    attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    for n,rgba in enumerate(colors): attr.data[n].color=rgba
    obj=bpy.data.objects.new(asset,mesh)
    scene.collection.objects.link(obj)
    obj['personal_vignette_export']=True
    obj['collisionBoxes']=[{'center':box['center'],'size':box['size'],'angle':box['rotationZ']} for box in collisions.get(asset,[])]
    if asset in pose_landmarks: obj['poseLandmarks']=pose_landmarks[asset]
    exports.append(obj)
    stats[asset]={'triangles':len(faces),'parts':len(parts),'min':[min(v[a] for v in vertices) for a in range(3)],'max':[max(v[a] for v in vertices) for a in range(3)],'colliders':collisions.get(asset,[])}
    for part_obj in parts:
        part_obj.location=(index*3.5,0,0)
        part_obj.hide_render=True

bpy.ops.object.select_all(action='DESELECT')
for obj in exports: obj.select_set(True)
bpy.context.view_layer.objects.active=exports[0]
formats=[item.identifier for item in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
if not formats:
    from io_scene_gltf2 import ExportGLTF2_Base
    enum=ExportGLTF2_Base.__annotations__['export_format'].keywords['items']
    formats=[item[0] for item in enum(None,bpy.context)]
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format=next(item for item in formats if item=='GLB'),use_selection=True,use_active_scene=True,export_yup=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)

# Byte normalized colors work in ordinary GLTFLoader with no additional decoder.
payload=OUTPUT.read_bytes()
json_length=struct.unpack_from('<I',payload,12)[0]
document=json.loads(payload[20:20+json_length])
binary=payload[20+json_length+8:]
for node in document['nodes']:
    if 'mesh' in node: document['meshes'][node['mesh']]['name']=node['name']
color_accessors={primitive['attributes']['COLOR_0'] for mesh in document['meshes'] for primitive in mesh['primitives']}
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
encoded+=b' '*((-len(encoded))%4)
repacked+=b'\x00'*((-len(repacked))%4)
length=12+8+len(encoded)+8+len(repacked)
OUTPUT.write_bytes(struct.pack('<III',0x46546C67,2,length)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(repacked),0x004E4942)+repacked)
MANIFEST.parent.mkdir(parents=True,exist_ok=True)
MANIFEST.write_text(json.dumps({'schema':1,'authoringUp':'Z','front':'-Y','characterApproximateHeight':1.87,'triangleCount':sum(item['triangles'] for item in stats.values()),'meshes':stats},indent=2)+'\n')
print(json.dumps({'bytes':OUTPUT.stat().st_size,'meshes':stats}))
for obj in exports: bpy.data.objects.remove(obj,do_unlink=True)
for parts in sources.values():
    for obj in parts:
        obj.hide_render=False
        obj.select_set(True)
bpy.context.view_layer.objects.active=next(iter(sources.values()))[0]
scene['asset_pipeline']='Faceted personalised figures from geometric jaw/hair/glasses; hand-posed segmented full bodies. Local portrait used only as visual reference. Shared byte vertex-colour GLB; no image textures.'
scene['body_assumption']='Slim adult proportions inferred only from the visible shoulders; the portrait does not show exact full-body proportions.'
BLEND.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),copy=True)

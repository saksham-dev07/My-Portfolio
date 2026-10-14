"""Blender-authored route furniture and playground replacements; metres, Z-up.
Shares the tested mesh/palette exporter with the refined kit, in a separate scene.
"""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
template = (ROOT / 'scripts/assets/create-refined-props.py').read_text()
header = template.split("begin('bed',")[0]
header = header.replace('refined-props.blend', 'scenic-kit.blend').replace('Saksham Refined World Props', 'Saksham Scenic Route Kit').replace('refined_prop', 'scenic_prop').replace('Refined /', 'Scenic /')
exec(compile(header, __file__, 'exec'))
P['lemon']='F1D451'
fruit_material=bpy.data.materials.get('Scenic / lemon') or bpy.data.materials.new('Scenic / lemon')
fruit_material.use_nodes=True
next(n for n in fruit_material.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(*linear(P['lemon']),1)
materials['lemon']=fruit_material

def ramp(kind,width,length,height):
    near=-length/2; join=length/2-.4; end=length/2; ground=.02
    begin(kind,[],rampProfile={'width':width,'near':near,'join':join,'end':end,'height':height,'ground':ground},continuousDeck=True)
    w=width/2
    mesh('continuous timber wedge',[(-w,near,0),(w,near,0),(w,end,0),(-w,end,0),(-w,near,ground),(w,near,ground),(w,join,height),(-w,join,height),(-w,end,height),(w,end,height)],[(0,3,2,1),(0,1,5,4),(1,2,9,6,5),(2,3,8,9),(3,0,4,7,8),(4,5,6,7),(7,6,9,8)],'wood')
    slope=(height-ground)/(join-near)
    for i in range(1,8):
        y=near+(join-near)*i/8; z=ground+(y-near)*slope
        box('flush plank joint',(0,y,z+.004),(width-.12,.014,.008),'woodlight',0,(math.atan(slope),0,0))
    for x in [-w+.045,w-.045]:
        beam('ramp side edging',(x,near,ground+.012),(x,join,height+.012),.026,'brass',6)
        beam('landing side edging',(x,join,height+.012),(x,end,height+.012),.026,'brass',6)
        for y in [near+.25,join-.2]:
            z=ground+(y-near)*slope
            cylinder('flush deck fastener',(x,y,z+.011),.019,.01,'metal',8)
        for y in [join-.15,join-.8]:
            z=ground+(y-near)*slope
            box('dark support leg',(x,y,z/2),( .07,.10,z),'green',.008)
    for side in [-1,1]:
        x=side*(w+.003)
        beam('visible side brace',(x,near+.35,.05),(x,join-.20,height-.14),.026,'cream',6)
        beam('support cross brace',(x,join-.8,.08),(x,join-.18,height-.15),.026,'green',6)

ramp('ramp-large',3,3.5,1.25)
ramp('ramp-small',2.1,1.6,.60)
begin('goal-post',[proxy((0,0,.55),(.22,.3,1.1)),proxy((0,0,1.57),(2.55,.18,.18)),proxy((-1.18,0,2.45),(.2,.2,1.65)),proxy((1.18,0,2.45),(.2,.2,1.65))],stripedPosts=True)
box('socket',(0,0,.07),(.4,.48,.14),'cream',.018)
box('center support',(0,0,.86),(.16,.18,1.58),'green',.015)
box('crossbar',(0,0,1.63),(2.58,.18,.18),'brass',.014)
for x in [-1.18,1.18]:
    box('padded upright',(x,0,2.45),(.22,.24,1.64),'copper',.018)
    for z in [2.03,2.83]: box('white upright stripe',(x,0,z),(.229,.249,.15),'cream',.009)
    box('upright cap',(x,0,3.31),(.25,.27,.09),'green',.018)

begin('ridge-arch',[proxy((-6,0,1.25),(1.10,1.6,2.5)),proxy((6,0,1.25),(1.10,1.6,2.5))],openingRadius=5.45,stoneCourses=24)
for i in range(24):
    a=math.pi*i/24+.006; b=math.pi*(i+1)/24-.006
    vertices=[(r*math.cos(t),y,r*math.sin(t)+.08) for y in [-.70,.70] for r,t in [(5.45,a),(6.5,a),(6.5,b),(5.45,b)]]
    stone=mesh('dressed radial stone',vertices,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],'cream' if i%3 else 'woodlight',.014)
    stone.modifiers.get('Small dressed edges').segments=1
    for side in [-1,1]:
        beam('inner copper bead',(5.51*math.cos(a),side*.715,5.51*math.sin(a)+.08),(5.51*math.cos(b),side*.715,5.51*math.sin(b)+.08),.035,'brass',6)
for x in [-6,6]:
    box('stone foundation',(x,0,.09),(1.38,1.88,.18),'cream',.025)
    box('base copper collar',(x,0,.23),(1.22,1.66,.11),'copper',.012)
box('crown keystone',(0,0,6.49),(.54,1.52,.43),'green',.025)
for side in [-1,1]:
    cylinder('crown route medallion',(0,side*.78,6.49),.14,.025,'brass',12,(math.pi/2,0,0))

begin('channel',[],openChannel=True,length=6)
box('recessed dark water bed',(0,0,.028),(.72,6,.056),'dark',.005)
box('shallow water glint',(0,0,.06),(.42,5.94,.009),'blue',0)
for x in [-.48,.48]:
    box('stone drainage curb',(x,0,.13),(.20,6,.26),'cream',.014)
    for y in [-2,-1,0,1,2]: box('curb expansion seam',(x,y,.265),(.204,.025,.01),'wood',0)
for y in [-2.4,0,2.4]:
    for i in range(5): box('drain grate',(0,y+(i-2)*.06,.087),(.69,.035,.024),'metal',.002)

begin('bridge',[proxy((0,0,.08),(1.8,1.94,.16)),proxy((-.82,0,.48),(.12,1.72,.8)),proxy((.82,0,.48),(.12,1.72,.8))],openWalkingWidth=1.52)
for i in range(11):
    y=(i-5)*.17
    box('timber crossing plank',(0,y,.13),(1.82,.155,.075),'woodlight' if i%3 else 'wood',.008)
for x in [-.82,.82]:
    box('side sill',(x,0,.06),(.15,1.95,.12),'green',.009)
    for y in [-.73,.73]:
        box('bridge upright',(x,y,.48),(.09,.09,.80),'green',.010)
        cylinder('capped rail post',(x,y,.91),.069,.07,'brass',8)
    beam('handrail',(x,-.82,.86),(x,.82,.86),.04,'cream',8)
    beam('lower handrail',(x,-.74,.46),(x,.74,.46),.021,'green',6)

begin('border',[proxy((0,0,.14),(4.6,.72,.28))],recessedSoil=True,lowPlanting=True)
box('long recessed soil',(0,0,.15),(4.44,.56,.18),'soil',.007)
for y in [-.33,.33]: box('sandstone edge',(0,y,.15),(4.6,.10,.30),'cream',.015)
for x in [-2.25,2.25]: box('end return',(x,0,.15),(.10,.56,.30),'cream',.015)
for i in range(11):
    x=(i-5)*.4; y=.05 if i%2 else -.05
    for n in range(4): leaf('folded roadside foliage',(x,y,.26),n*math.pi/2+i*.5,.22,.15,'leaflight' if n%2 else 'leaf',.20)
    if i%3==1:
        for n in range(5): leaf('gold border blossom',(x,y,.43),n*math.tau/5,.07,.06,'flower',.025)

begin('bollard',[proxy((0,0,.45),(.18,.18,.9))],reflectiveBand=True)
box('flush stone foot',(0,0,.05),(.32,.32,.1),'cream',.013)
cylinder('roadside post',(0,0,.46),.07,.82,'green',8)
cylinder('reflector collar',(0,0,.77),.076,.13,'cream',8)
cylinder('brass cap',(0,0,.90),.082,.055,'brass',8)

begin('lemon',[],dynamicArtwork=True)
# Tapered fruit with pointed ends, rather than the old featureless sphere.
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1)
obj=bpy.context.object
for v in obj.data.vertices:
    x,y,z=v.co; pinch=.72+.28*math.sqrt(max(0,1-x*x));v.co=(x*.62,y*.42*pinch,z*.43*pinch)
for poly in obj.data.polygons: poly.use_smooth=True
finish(obj,'tapered lemon flesh','lemon')
cylinder('lemon stem',(0,0,.46),.028,.10,'wood',8)
leaf('lemon leaf',(.015,0,.47),.3,.28,.16,'leaf',.07)
# Shift to a grounded reusable mesh; runtime recenters it on the original body.
for obj in kit['lemon']['parts']: obj.location.z+=.43

footer=template[template.index('exports=[]; report=[];'):]
footer=footer.replace('refined_prop','scenic_prop').replace('11 grounded Blender meshes','9 grounded Blender designs')
exec(compile(footer, __file__, 'exec'))

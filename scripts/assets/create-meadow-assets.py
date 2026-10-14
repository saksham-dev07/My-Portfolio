"""New low-poly environment kit. Existing models/scenes remain untouched.
MEADOW_PREVIEW=True exports only the first tree for a scale/orientation check.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
preview=globals().get('MEADOW_PREVIEW',False)
template=(ROOT/'scripts/assets/create-refined-props.py').read_text()
header=template.split("begin('bed',")[0]
header=header.replace('refined-props.blend','meadow-preview.blend' if preview else 'meadow-environment.blend')
header=header.replace("scene = bpy.data.scenes.get('Saksham Refined World Props') or bpy.data.scenes.new('Saksham Refined World Props')","scene = bpy.data.scenes.new('Saksham Meadow Environment')")
header=header.replace('refined_prop','meadow_asset').replace('Refined /','Meadow /')
exec(compile(header,__file__,'exec'))
P.update({'leaf':'507E43','leaflight':'799B57','green':'345A40','wood':'886348','woodlight':'A68157','flower':'EACA66','pink':'D894A1'})
for key in ['leaf','leaflight','green','wood','woodlight','flower','pink']:
    mat=bpy.data.materials.get('Meadow / '+key) or bpy.data.materials.new('Meadow / '+key);mat.use_nodes=True
    next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(*linear(P[key]),1)
    materials[key]=mat
def cube(name,p,size,color):return box(name,p,size,color,0)
def crown(name,p,size,color):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=p)
    obj=bpy.context.object;obj.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,color)
def tree(kind):
    begin(kind,[proxy((0,0,.8),(.24,.24,1.6))],maxTriangles=500,baseOrigin=True)
    cylinder('rooted trunk',(0,0,.95),.15,1.90,'wood',8,radius_top=.105)
    for i in range(3):
        a=i*math.tau/3
        beam('root flare',(0,0,.25),(.28*math.cos(a),.28*math.sin(a),.08),.06,'wood',4)
    if kind=='tree-round':
        for p,size,c in [((0,0,3.35),(1.43,1.40,1.45),'leaflight'),((-.65,.1,2.9),(.8,.9,.95),'leaf'),((.6,-.1,3.2),(.9,.8,1.05),'leaf')]:crown('round canopy',p,size,c)
    elif kind=='tree-pine':
        for z,r,h in [(2.15,1.35,1.9),(3.15,1.02,1.8),(4.0,.7,1.6)]:cylinder('pine tier',(0,0,z),r,h,'leaf' if z<3 else 'leaflight',8,radius_top=0)
    elif kind=='tree-bushy':
        for i in range(5):
            a=i*math.tau/5;beam('open branch',(0,0,1.4),(.7*math.cos(a),.7*math.sin(a),2.6),.06,'wood',4)
            crown('bushy canopy',(.7*math.cos(a),.7*math.sin(a),2.8+i*.12),(.9,.9,1.05),'leaflight' if i%2 else 'leaf')
    else:
        crown('small crown',(0,0,2.25),(.95,.9,.96),'leaflight');crown('small secondary crown',(.4,0,1.9),(.58,.58,.65),'leaf')
tree('tree-round')
if not preview:
    for kind in ['tree-pine','tree-bushy','tree-small']:tree(kind)
    for i,(r,h) in enumerate([(.36,.30),(.72,.62),(1.08,.9)]):
        begin('rock-'+str(i),[proxy((0,0,h*.45),(r*1.45,r*1.15,h*.85))],baseOrigin=True,maxTriangles=500)
        obj=crown('weathered faceted stone',(0,0,h/2),(r,r*.79,h/2),'metal' if i==0 else 'cream')
        for v in obj.data.vertices:v.co.x+=.04*math.sin(v.co.z*12+i);v.co.y+=.03*math.sin(v.co.x*13+i)
    begin('bush',[],baseOrigin=True,maxTriangles=500)
    for x,y,z in [(-.25,0,.40),(.25,.05,.40),(0,-.15,.4)]:crown('low bush',(x,y,z),(.42,.42,.4),'leaf' if x<0 else 'leaflight')
    begin('grass',[],baseOrigin=True,maxTriangles=8)
    for i in range(3):
        a=i*math.tau/3;c,s=math.cos(a),math.sin(a)
        verts=[(-.045*c,-.045*s,0),(.045*c,.045*s,0),(.035*c+.02*s,.035*s-.02*c,.19+i*.035),(.075*c+.02*s,.075*s-.02*c,.33+i*.025)]
        mesh('bent grass blade',verts,[(0,1,2),(1,3,2)],'leaflight' if i==1 else 'leaf')
    begin('flower',[],baseOrigin=True,maxTriangles=500)
    cylinder('flower stalk',(0,0,.16),.01,.32,'leaf',4)
    for i in range(5):
        a=i*math.tau/5
        mesh('flower petal',[(0,0,.32),(.085*math.cos(a-.35),.085*math.sin(a-.35),.34),(.12*math.cos(a),.12*math.sin(a),.33),(.085*math.cos(a+.35),.085*math.sin(a+.35),.34)],[(0,1,2),(0,2,3)],'white')
    cylinder('flower pollen',(0,0,.335),.025,.017,'flower',6)
    begin('log',[proxy((0,0,.2),(1.4,.36,.4))],baseOrigin=True,maxTriangles=500)
    cylinder('fallen log',(0,0,.21),.21,1.5,'wood',8,(0,math.pi/2,0))
    for x in [-.751,.751]:
        cylinder('cut end grain',(x,0,.22),.17,.012,'woodlight',8,(0,math.pi/2,0))
        cylinder('end growth ring',(x*1.01,0,.22),.09,.012,'cream',8,(0,math.pi/2,0))
    begin('stump',[proxy((0,0,.23),(.5,.5,.46))],baseOrigin=True,maxTriangles=500)
    cylinder('tree stump',(0,0,.24),.32,.48,'wood',8,radius_top=.25)
    cylinder('cut stump top',(0,0,.485),.235,.016,'woodlight',8)
    cylinder('growth ring',(0,0,.495),.15,.009,'cream',8)
    begin('bench',[proxy((0,0,.4),(1.95,.62,.80))],baseOrigin=True,maxTriangles=500)
    for x in [-.68,.68]:
        cube('iron bench foot',(x,0,.20),(.10,.60,.4),'green');cube('back support',(x,.21,.57),(.07,.08,.7),'green')
    for y in [-.20,0,.20]:cube('seat slat',(0,y,.44),(1.95,.15,.07),'woodlight')
    for z in [.65,.85]:cube('back slat',(0,.25,z),(1.95,.065,.14),'woodlight')
    begin('fountain',[proxy((0,0,.2),(1.9,1.9,.4))],baseOrigin=True,maxTriangles=500)
    # Hollow octagonal basin, one small central tier; water is a runtime disc.
    n=8;verts=[(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for r,z in [(.98,0),(.98,.35),(.76,.35),(.76,.12)] for i in range(n)]
    faces=[]
    for ring in range(3):
        for i in range(n):j=(i+1)%n;faces.append((ring*n+i,ring*n+j,(ring+1)*n+j,(ring+1)*n+i))
    mesh('hollow fountain basin',verts,faces,'cream')
    cylinder('fountain stem',(0,0,.60),.13,.96,'green',8)
    cylinder('small tier',(0,0,1.06),.45,.09,'cream',8)
    cylinder('fountain finial',(0,0,1.19),.095,.2,'brass',8)
    begin('fence',[proxy((0,0,.5),(2,.16,1))],baseOrigin=True,maxTriangles=500)
    for x in [-.91,.91]:cube('fence post',(x,0,.5),(.11,.13,1),'green')
    for z in [.3,.76]:cube('fence rail',(0,0,z),(2,.07,.09),'woodlight')

# Use the same normal/color export contract as the existing scene loaders.
footer=template[template.index('exports=[]; report=[];'):].replace('refined_prop','meadow_asset')
footer=footer.replace('11 grounded Blender meshes, preserved weighted normals, shared palette, two-sided link reliefs, collision metadata.', 'Grounded low-poly meadow assets, base pivots, shared palette, clean normals and collision metadata.')
footer=footer.replace("obj['assetVersion']=2;", "obj['assetVersion']=2;")
footer=footer.replace("len(faces),'parts'", "len(faces),'parts'")
exec(compile(footer,__file__,'exec'))
# Preserve the temporary raw export and ship to a new, separately named asset.
target=ROOT/'experiments/saksham-driving-world/static/saksham/models'/('meadow-tree-preview.glb' if preview else 'environment-refresh.glb')
target.write_bytes(OUTPUT.read_bytes())
print({'new_asset':str(target),'preview':preview,'triangles':[{'kind':r['kind'],'triangles':r['triangles']} for r in report]})

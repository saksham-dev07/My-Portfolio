import {expect,test} from 'bun:test'
import * as THREE from 'three'
import {retainPlaygroundScene,retiredPlaygroundMeshes} from '../src/javascript/World/ScenicRouteLayout.js'

const panels=['025','008','014','020','023','028','031','034','037','040','043','046']
const posts=['007','026','012','013','017','019','021','022','024','027','029','030','032','033','035','036','038','039','041','042','044','045','047','048']
const fenceNames=[...panels,...posts].map(n=>`shadeBrown.${n}`)
const bytes=await Bun.file(new URL('../static/models/playground/static/base.glb',import.meta.url)).arrayBuffer()
const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,new DataView(bytes).getUint32(12,true))))

test('shipping playground retains all twelve fence panels and twenty-four original posts',()=>{
    const names=new Set(json.nodes.map(n=>n.name))
    const missing=fenceNames.filter(name=>!names.has(name))
    expect(missing).toEqual([])
})

test('runtime retirement distinguishes ramp underscores from Blender fence suffixes',()=>{
    // Three's GLTFLoader strips periods, but preserves underscores.
    const source=new THREE.Group()
    for(const name of [...fenceNames,'shadeBrown_014','shadeBrown_020','shadeBrown_023']){
        const mesh=new THREE.Mesh();mesh.name=name.replace(/\./g,'');source.add(mesh)
    }
    const retained=retainPlaygroundScene(source,retiredPlaygroundMeshes)
    for(const name of fenceNames)expect(retained.getObjectByName(name.replace(/\./g,''))).toBeDefined()
    for(const name of ['shadeBrown_014','shadeBrown_020','shadeBrown_023'])expect(retained.getObjectByName(name)).toBeUndefined()
    expect(source.children).toHaveLength(39)
})

import * as THREE from 'three'
import { buildHubStatic, hubSignBacks } from '../HubWayfinding.js'
import PersonalVignettes from '../PersonalVignettes.js'
import { hubSignRelocations } from '../HubLayout.js'

export default class CrossroadsSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.camera = _options.camera
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        // Preserve a clean copy before the original static geometry is merged.
        const signNodes = this.resources.items.crossroadsStaticBase.scene.children.filter(node => ['shadeBrown004', 'shadeWhite084'].includes(node.name))
        this.signTemplate = this.objects.getConvertedMesh(signNodes, { duplicated: true })
        this.signTemplate.children.forEach(node => { if (node.isMesh) node.geometry = node.geometry.clone() })

        this.setStatic()
        const signBase = this.objects.getConvertedMesh(this.hubBase.children.filter(node => hubSignRelocations.some(sign => sign.board === node.name)), { duplicated: true })
        this.signBacks = hubSignBacks(signBase, new THREE.Vector3(this.x, this.y, 0))
        this.container.add(...this.signBacks)
        this.vignettes = new PersonalVignettes({ container: this.container, objects: this.objects, camera: this.camera, time: this.time })
    }

    setStatic()
    {
        const { base, collision } = buildHubStatic(
            this.resources.items.crossroadsStaticBase.scene,
            this.resources.items.crossroadsStaticCollision.scene
        )
        // Objects.add transfers mesh ownership while converting its materials.
        // Keep measurement nodes for both lettering faces before that transfer.
        this.hubBase = base.clone(true)
        this.objects.add({
            base,
            collision,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
    }

}

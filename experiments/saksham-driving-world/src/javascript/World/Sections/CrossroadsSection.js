import * as THREE from 'three'
import { buildHubStatic } from '../HubWayfinding.js'
import PersonalVignettes from '../PersonalVignettes.js'

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
        this.tiles = _options.tiles
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
        this.setTiles()
        this.vignettes = new PersonalVignettes({ container: this.container, objects: this.objects, camera: this.camera, time: this.time })
    }

    setStatic()
    {
        const { base, collision } = buildHubStatic(
            this.resources.items.crossroadsStaticBase.scene,
            this.resources.items.crossroadsStaticCollision.scene
        )
        this.objects.add({
            base,
            collision,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
    }

    setTiles()
    {
        // To intro
        this.tiles.add({
            start: new THREE.Vector2(this.x, - 10),
            delta: new THREE.Vector2(0, this.y + 14)
        })

        // Landscape's continuous approach now leads into the research terraces.

        // To projects
        this.tiles.add({
            start: new THREE.Vector2(this.x - 13, this.y),
            delta: new THREE.Vector2(- 5, 0)
        })
    }
}

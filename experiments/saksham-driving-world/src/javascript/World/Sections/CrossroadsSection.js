import * as THREE from 'three'

export default class CrossroadsSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
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
    }

    setStatic()
    {
        this.objects.add({
            base: this.resources.items.crossroadsStaticBase.scene,
            collision: this.resources.items.crossroadsStaticCollision.scene,
            floorShadowTexture: this.resources.items.crossroadsStaticFloorShadowTexture,
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

        // To projects
        // Approach the project from below its title; stop before OPEN.
        for (const [from, to] of [[[12.5, -30], [18, -30]], [[18, -30], [18, -41]], [[18, -41], [30, -41]]]) {
            this.tiles.add({ start: new THREE.Vector2(...from), delta: new THREE.Vector2(to[0] - from[0], to[1] - from[1]) })
        }

        // To projects
        this.tiles.add({
            start: new THREE.Vector2(this.x - 13, this.y),
            delta: new THREE.Vector2(- 5, 0)
        })
    }
}

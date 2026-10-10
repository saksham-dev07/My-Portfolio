import { labelTexture } from '../../StudioLabels.js'
import * as THREE from 'three'
import { buildInformationStatic, informationLandmark, retiredInformationShadows } from '../InformationLayout.js'
import { vignetteGeometry } from '../PersonalVignettes.js'
import { groundLayer } from '../GroundLayers.js'

export default class InformationSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setStatic()
        this.setFlag()
        this.setLandmark()
        this.setLinks()
        this.setActivities()
    }

    setStatic()
    {
        const { base, collision } = buildInformationStatic(this.resources.items.informationStaticBase.scene, this.resources.items.informationStaticCollision.scene)
        const object = this.objects.add({
            base,
            collision,
            floorShadowTexture: this.resources.items.informationStaticFloorShadowTexture,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
        const floorMeshes = object.container?.children.filter(node => node.material?.uniforms?.tShadow) || []
        this.retiredShadowAnchors = retiredInformationShadows.map(p => ({ ...p, x: this.x + p.x, y: this.y + p.y, floorMeshes }))
    }

    setFlag()
    {
        const gltf = this.resources.items.informationFlagIndia
        if(!gltf || !gltf.scene) return

        const flagContainer = new THREE.Group()
        flagContainer.name = 'flagIndia'

        const raw = gltf.scene.clone(true)
        raw.traverse(node => {
            if (!node.isMesh) return
            const prepare = material => {
                const copy = material.clone()
                if ('metalness' in copy) copy.metalness = Math.min(copy.metalness, 0.2)
                if ('roughness' in copy) copy.roughness = Math.max(copy.roughness, 0.5)
                return copy
            }
            node.material = Array.isArray(node.material) ? node.material.map(prepare) : prepare(node.material)
        })

        // Pole alignment in raw GLTF: center (1.3106, 0.8654), base Y: 0.254, height: 1.6938
        const scale = 2.066
        const poleCenterX = 1.3106
        const poleBaseY = 0.254
        const poleCenterZ = 0.8654

        raw.position.set(-poleCenterX, -poleBaseY, -poleCenterZ)

        const rotGroup = new THREE.Group()
        rotGroup.rotation.set(-Math.PI / 2, 0, -Math.PI)
        rotGroup.scale.setScalar(scale)
        rotGroup.add(raw)

        flagContainer.add(rotGroup)

        // Exact position of the flagpole in InformationSection local coords: (-4.23059, 5.06061)
        flagContainer.position.set(this.x - 4.23059, this.y + 5.06061, 0)
        this.container.add(flagContainer)

        // Floor shadow under base stand
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(0.75, 32),
            new THREE.MeshBasicMaterial({ color: '#343052', transparent: true, opacity: 0.18, depthWrite: false })
        )
        shadow.position.set(this.x - 4.23059, this.y + 5.06061, 0.02)
        this.container.add(shadow)
    }

    setLandmark()
    {
        const gltf = this.resources.items.informationLandmarkIndia
        if (!gltf?.scene) return
        gltf.scene.updateMatrixWorld(true)
        const landmark = new THREE.Group(), solids = []
        landmark.name = 'Indian identity / sandstone arch'
        landmark.position.set(this.x + informationLandmark.x, this.y + informationLandmark.y, .01)
        landmark.scale.setScalar(informationLandmark.scale)
        const material = new THREE.MeshMatcapMaterial({ matcap: this.objects.materials.shades.items.white.uniforms.matcap.value, vertexColors: true })
        landmark.updateMatrix()
        gltf.scene.traverse(node => {
            if (!node.isMesh) return
            const mesh = new THREE.Mesh(vignetteGeometry(node), material)
            mesh.name = 'India Gate inspired landmark'
            landmark.add(mesh)
            for (const box of node.userData.collisionBoxes || []) {
                const solid = new THREE.Object3D(); solid.name = 'box'
                solid.position.fromArray(box.center).applyMatrix4(landmark.matrix)
                solid.scale.fromArray(box.size).multiplyScalar(informationLandmark.scale)
                solid.rotation.z = box.angle || 0
                solids.push(solid)
            }
        })
        this.container.add(landmark)
        this.landmark = landmark
        if (solids.length) this.landmarkCollision = this.objects.physics.addObjectFromThree({ meshes: solids, offset: new THREE.Vector3(), rotation: new THREE.Euler(), mass: 0, sleep: true })
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#2c4230', transparent: true, opacity: .18, depthWrite: false }))
        shadow.position.set(landmark.position.x, landmark.position.y, 0)
        shadow.scale.set(2.2, 1.7, 1)
        groundLayer(shadow, 'shadow')
        this.container.add(shadow)
    }

    setLinks()
    {
        // Set up
        this.links = {}
        this.links.x = 1.95
        this.links.y = - 1.5
        this.links.halfExtents = {}
        this.links.halfExtents.x = 1
        this.links.halfExtents.y = 1
        this.links.distanceBetween = 2.4
        this.links.labelWidth = 2.1
        this.links.labelGeometry = new THREE.PlaneGeometry(this.links.labelWidth, this.links.labelWidth * 200 / 512, 1, 1)
        this.links.labelOffset = - 1.85
        this.links.items = []

        this.links.container = new THREE.Object3D()
        this.links.container.matrixAutoUpdate = false
        this.container.add(this.links.container)

        // Options
        this.links.options = [
            {
                href: '/',
                labelTexture: labelTexture(['PORTFOLIO'], 512, 200)
            },
            {
                href: 'https://github.com/saksham-dev07',
                labelTexture: labelTexture(['GITHUB'], 512, 200)
            },
            {
                href: 'https://www.linkedin.com/in/saksham-agarwal-b44910289/',
                labelTexture: labelTexture(['LINKEDIN'], 512, 200)
            },
            {
                href: 'mailto:sakmmm07@gmail.com',
                labelTexture: labelTexture(['MAIL', 'sakmmm07@gmail.com'], 512, 200)
            }
        ]

        // Create each link
        let i = 0
        for(const _option of this.links.options)
        {
            // Set up
            const item = {}
            item.x = this.x + this.links.x + this.links.distanceBetween * i
            item.y = this.y + this.links.y
            item.href = _option.href

            // Create area
            item.area = this.areas.add({
                position: new THREE.Vector2(item.x, item.y),
                halfExtents: new THREE.Vector2(this.links.halfExtents.x, this.links.halfExtents.y)
            })
            item.area.on('interact', () =>
            {
                if (_option.href === '/')
                {
                    if (window.parent && window.parent !== window)
                    {
                        window.parent.postMessage({ type: 'exit-world' }, window.location.origin)
                    }
                    else
                    {
                        window.location.href = '/'
                    }
                    return
                }
                window.open(_option.href, '_blank', 'noopener,noreferrer')
            })

            // Texture
            item.texture = _option.labelTexture
            item.texture.magFilter = THREE.LinearFilter
            item.texture.minFilter = THREE.LinearFilter

            // Create label
            item.labelMesh = new THREE.Mesh(this.links.labelGeometry, new THREE.MeshBasicMaterial({ wireframe: false, color: 0xffffff, alphaMap: _option.labelTexture, depthTest: true, depthWrite: false, transparent: true }))
            item.labelMesh.position.x = item.x
            item.labelMesh.position.y = item.y + this.links.labelOffset
            item.labelMesh.matrixAutoUpdate = false
            item.labelMesh.updateMatrix()
            this.links.container.add(item.labelMesh)

            // Save
            this.links.items.push(item)

            i++
        }
    }

    setActivities()
    {
        // Set up
        this.activities = {}
        this.activities.x = this.x + 0
        this.activities.y = this.y - 10
        this.activities.multiplier = 5.5

        // Geometry
        this.activities.geometry = new THREE.PlaneGeometry(2 * this.activities.multiplier, 1 * this.activities.multiplier, 1, 1)

        // Texture
        this.activities.texture = labelTexture(['CURIOUS BY NATURE', 'ENGINEER BY PRACTICE', 'AI / FULL-STACK / OPEN SOURCE'], 1024, 512)
        this.activities.texture.magFilter = THREE.NearestFilter
        this.activities.texture.minFilter = THREE.LinearFilter

        // Material
        this.activities.material = new THREE.MeshBasicMaterial({ wireframe: false, color: 0xffffff, alphaMap: this.activities.texture, transparent: true })

        // Mesh
        this.activities.mesh = new THREE.Mesh(this.activities.geometry, this.activities.material)
        this.activities.mesh.position.x = this.activities.x
        this.activities.mesh.position.y = this.activities.y
        this.activities.mesh.matrixAutoUpdate = false
        this.activities.mesh.updateMatrix()
        this.container.add(this.activities.mesh)
    }

}

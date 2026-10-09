import { test, expect } from 'bun:test'
import * as THREE from 'three'
import InformationSection from '../src/javascript/World/Sections/InformationSection.js'

test('information section replaces the French display while retaining its Indian flag', () => {
    const previousDocument = globalThis.document
    globalThis.document = {
        createElement: () => ({
            getContext: () => ({
                fillRect() {},
                fillText() {},
                measureText: text => ({ width: text.length * 25 })
            })
        })
    }

    try {
        // Mock resources
        const mockFrenchBase = new THREE.Group()
        const poleMesh = new THREE.Mesh()
        poleMesh.name = 'shadeWhite111'
        const ballMesh = new THREE.Mesh()
        ballMesh.name = 'shadeWhite'
        const whiteStripe = new THREE.Mesh()
        whiteStripe.name = 'shadeWhite112'
        const redStripe = new THREE.Mesh()
        redStripe.name = 'shadeRed005'
        const blueStripe = new THREE.Mesh()
        blueStripe.name = 'shadeBlue'
        const otherMesh = new THREE.Mesh()
        otherMesh.name = 'otherBaseMesh'

        const towerMesh = new THREE.Mesh(); towerMesh.name = 'shadeGray007'
        const pinMesh = new THREE.Mesh(); pinMesh.name = 'shadeRed001'
        mockFrenchBase.add(poleMesh, ballMesh, whiteStripe, redStripe, blueStripe, towerMesh, pinMesh, otherMesh)

        const mockIndiaGltf = {
            scene: new THREE.Group()
        }
        const mockFlagMesh = new THREE.Mesh()
        mockIndiaGltf.scene.add(mockFlagMesh)

        const addedObjects = []
        const mockObjects = {
            add: (obj) => {
                addedObjects.push(obj)
                return obj
            }
        }

        const mockResources = {
            items: {
                informationStaticBase: { scene: mockFrenchBase },
                informationStaticCollision: { scene: new THREE.Group() },
                informationStaticFloorShadowTexture: null,
                informationFlagIndia: mockIndiaGltf,
                informationContactTwitterLabel: null,
                informationContactGithubLabel: null,
                informationContactLinkedinLabel: null,
                informationContactMailLabel: null,
                informationActivities: null
            }
        }

        const mockTiles = {
            add: () => {}
        }
        const mockAreas = {
            add: () => ({ on: () => {} })
        }

        const info = new InformationSection({
            time: { on: () => {} },
            resources: mockResources,
            objects: mockObjects,
            areas: mockAreas,
            tiles: mockTiles,
            x: 1.2,
            y: -55
        })

        // 1. Verify filtered base has NO French flag meshes
        const staticBaseCall = addedObjects[0]
        expect(staticBaseCall).toBeDefined()
        const staticChildrenNames = staticBaseCall.base.children.map(c => c.name)
        expect(staticChildrenNames).toContain('otherBaseMesh')
        expect(staticChildrenNames).not.toContain('shadeWhite111')
        expect(staticChildrenNames).not.toContain('shadeWhite')
        expect(staticChildrenNames).not.toContain('shadeWhite112')
        expect(staticChildrenNames).not.toContain('shadeRed005')
        expect(staticChildrenNames).not.toContain('shadeBlue')
        expect(staticChildrenNames).not.toContain('shadeGray007')
        expect(staticChildrenNames).not.toContain('shadeRed001')
        expect(mockFrenchBase.children).toHaveLength(8)
        expect(addedObjects).toHaveLength(1)

        // 2. Verify Indian flag container is added to info.container
        const flagNode = info.container.children.find(c => c.name === 'flagIndia')
        expect(flagNode).toBeDefined()
        expect(flagNode.position.x).toBeCloseTo(1.2 - 4.23059, 4)
        expect(flagNode.position.y).toBeCloseTo(-55 + 5.06061, 4)
        expect(flagNode.position.z).toBeCloseTo(0, 4)
    } finally {
        globalThis.document = previousDocument
    }
})

import { test, expect, spyOn } from 'bun:test'
import * as THREE from 'three'
import ProfileLandmarks, { prepareLandmarkMaterial } from '../src/javascript/World/Sections/ProfileLandmarks.js'

test('panning to the profile landmarks loads them while the car stays at the start', () => {
    const clock = spyOn(performance, 'now').mockReturnValue(0)
    try {
        const instance = new THREE.PerspectiveCamera(40, 1280 / 720, 1, 80)
        instance.up.set(0, 0, 1)
        const direction = new THREE.Vector3(1.135, -1.45, 1.15).normalize()
        instance.position.copy(direction).multiplyScalar(21.5)
        instance.lookAt(0, 0, 0)
        let tick
        const car = new THREE.Vector3(0, 0, 1)
        const landmarks = new ProfileLandmarks({
            objects: { physics: { car: { chassis: { body: { position: car } } } } },
            camera: { instance },
            time: { on: (_event, callback) => { tick = callback } },
        }, new THREE.Group(), [])
        let campusLoads = 0, avatarLoads = 0
        landmarks.loadCampus = () => { campusLoads++; landmarks.campusState = 'loading' }
        landmarks.loadAvatar = () => { avatarLoads++; landmarks.avatarState = 'loading' }
        landmarks.loadSkills = () => { landmarks.skillsState = 'loading' }
        landmarks.loadHighlights = () => { landmarks.highlightsState = 'loading' }
        tick()
        // Normal entry must still avoid downloading the two large offscreen GLBs.
        expect([campusLoads, avatarLoads]).toEqual([0, 0])
        // Match the reported failure: move the camera, without driving the car.
        instance.position.copy(direction).multiplyScalar(29).add(new THREE.Vector3(0, -92, 0))
        instance.lookAt(0, -92, 0)
        clock.mockReturnValue(251)
        tick()
        expect(car.toArray()).toEqual([0, 0, 1])
        expect([campusLoads, avatarLoads]).toEqual([1, 1])
        // A model already loading must not start duplicate requests every frame.
        clock.mockReturnValue(502)
        tick()
        expect([campusLoads, avatarLoads]).toEqual([1, 1])
    } finally {
        clock.mockRestore()
    }
})

test('portrait and campus materials retain image detail without metallic skin or excessive specular', () => {
    const source = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: .1, specularIntensity: 1 })
    source.specularColor.setRGB(2, 2, 2)
    source.map = new THREE.Texture()
    source.normalMap = new THREE.Texture()
    source.metalnessMap = new THREE.Texture()
    for (const kind of ['avatar', 'campus']) {
        const material = prepareLandmarkMaterial(source, kind)
        expect(material).not.toBe(source)
        expect(material.map).toBe(source.map)
        expect(material.normalMap).toBe(source.normalMap)
        expect(material.metalness).toBe(0)
        expect(material.metalnessMap).toBeNull()
        expect(material.roughness).toBeGreaterThan(.8)
        expect(material.specularIntensity).toBeLessThan(.35)
        expect(material.specularColor.toArray()).toEqual([1, 1, 1])
    }
    expect(source.metalness).toBe(1)
    expect(source.specularColor.toArray()).toEqual([2, 2, 2])
})

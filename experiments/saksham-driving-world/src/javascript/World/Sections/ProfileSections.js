import * as THREE from 'three'
import { plaqueTexture } from '../../StudioLabels.js'
import { profileSections } from '../../sakshamProfile.js'
import ProfileLandmarks from './ProfileLandmarks.js'
import ProfileDistrict from './ProfileDistrict.js'
import { profileForecourts } from './ProfileForecourts.js'
import { groundLayer } from '../GroundLayers.js'
import DistrictScenery from './DistrictScenery.js'

// Section roads, accessible entry pads, and supplied GLB landmarks.
export default class ProfileSections {
    constructor(options) {
        const { areas, zones, camera } = options
        this.container = new THREE.Group()
        this.items = profileSections
        this.collisions = []
        this.entryAreas = []
        this.landmarks = new ProfileLandmarks(options, this.container, this.collisions)
        // A wider arrival view fits the supplied artwork without changing the
        // camera behavior elsewhere; visitors can still scroll/pinch to zoom.
        let previousZoom = camera.zoom.targetValue
        const baseDistance = camera.zoom.minDistance
        camera.angle.items.profile = new THREE.Vector3(0, -1.6, 1.6)
        const frameProfile = () => {
            const portrait = camera.instance.aspect < 1
            camera.zoom.minDistance = baseDistance + (portrait ? 8 : 0)
            camera.angle.set(portrait ? 'profile' : 'default')
        }
        const profileZone = zones.add({ position: new THREE.Vector2(2, -99), halfExtents: new THREE.Vector2(44, 30), data: {} })
        profileZone.on('in', () => {
            previousZoom = camera.zoom.targetValue
            camera.zoom.targetValue = 1
            frameProfile()
        })
        profileZone.on('out', () => {
            if (camera.zoom.targetValue === 1) camera.zoom.targetValue = previousZoom
            camera.zoom.minDistance = baseDistance
            camera.angle.set('default')
        })
        camera.sizes.on('resize', () => { if (profileZone.isIn) frameProfile() })
        this.forecourts = profileForecourts
        for (const section of profileSections) {
            const { title, entry } = profileForecourts[section.id]
            const group = new THREE.Group()
            group.name = `${section.id} / approach title`
            group.position.set(title.x, title.y, 0)
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(title.w, title.h), new THREE.MeshBasicMaterial({ map: plaqueTexture(section.sign, 1024, 256, { accent: section.color }), transparent: true, depthWrite: false }))
            ground.rotation.z = Math.PI
            groundLayer(ground, 'label')
            group.add(ground)
            // All four artworks stream independently; labels and entry pads
            // remain available while a distant landmark is downloading.
            this.container.add(group)
            const hint = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshBasicMaterial({ map: plaqueTexture(['OPEN DETAILS'], 512, 128, { accent: section.color, compact: true }), transparent: true, depthWrite: false }))
            hint.name = `${section.id} / approach entry`
            hint.position.set(entry.x, entry.y, 0)
            hint.rotation.z = Math.PI
            groundLayer(hint, 'label')
            this.container.add(hint)
            const area = areas.add({ position: new THREE.Vector2(entry.x, entry.y), halfExtents: new THREE.Vector2(entry.w / 2, entry.h / 2) })
            area.on('interact', () => window.dispatchEvent(new CustomEvent('drive-section', { detail: section.id })))
            this.entryAreas.push({ id: section.id, area })
        }
        // ProfileDistrict owns the complete lower route network so paths never
        // overlap one another or cross the section labels and entry pads.
        this.district = new ProfileDistrict(options, this.container, this.collisions)
        this.scenery = new DistrictScenery(options, this.container, this.collisions)
    }
}

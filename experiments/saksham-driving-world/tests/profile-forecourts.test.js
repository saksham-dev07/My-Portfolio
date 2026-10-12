import { expect, test } from 'bun:test'
import * as THREE from 'three'
import { profileSections } from '../src/javascript/sakshamProfile.js'
import { profileForecourts, profileArtworkPositions, curiosityLabel, campusForecourt } from '../src/javascript/World/Sections/ProfileForecourts.js'
import { roadEdgeDistance } from '../src/javascript/World/LandscapeLayout.js'
import { activityPropPlacements, activityPropSolids } from '../src/javascript/World/ActivityProps.js'

// Conservative shipping artwork envelopes, including the portrait's plinth.
const artwork = {
    about: new THREE.Box3(new THREE.Vector3(-.9, -82.9, 0), new THREE.Vector3(4.9, -77.1, 5.35)),
    skills: new THREE.Box3(new THREE.Vector3(-27.5, -92.5, 0), new THREE.Vector3(-20.5, -87.5, 4.88)),
    highlights: new THREE.Box3(new THREE.Vector3(25, -93.5, 0), new THREE.Vector3(35, -86.5, 5.08)),
    education: new THREE.Box3(new THREE.Vector3(-4.5, -116, 0), new THREE.Vector3(8.5, -108, 6.08)),
}

test('chase approaches see the complete title and entry footprint before each artwork', () => {
    for (const section of profileSections) {
        const { title, entry } = profileForecourts[section.id]
        for (const rect of [title, entry]) {
            expect(rect.y - rect.h / 2).toBeGreaterThan(artwork[section.id].max.y)
            for (const offsetX of [-8, 0, 8]) {
                const camera = new THREE.Vector3(entry.x + offsetX, entry.y + 18, 8)
                for (const dx of [-.5, 0, .5]) for (const dy of [-.5, 0, .5]) {
                    const target = new THREE.Vector3(rect.x + dx * rect.w, rect.y + dy * rect.h, .04)
                    const ray = new THREE.Ray(camera, target.clone().sub(camera).normalize())
                    const hit = ray.intersectBox(artwork[section.id], new THREE.Vector3())
                    expect(hit === null || hit.distanceTo(camera) > target.distanceTo(camera)).toBe(true)
                }
            }
        }
    }
    // The former About title reproduces the reported silhouette obstruction.
    const camera = new THREE.Vector3(2, -50, 8)
    const oldTitle = new THREE.Vector3(2, -79, .04)
    const oldArtwork = new THREE.Box3(new THREE.Vector3(-.9, -75.9, 0), new THREE.Vector3(4.9, -70.1, 5.35))
    const hit = new THREE.Ray(camera, oldTitle.clone().sub(camera).normalize()).intersectBox(oldArtwork, new THREE.Vector3())
    expect(hit.distanceTo(camera)).toBeLessThan(oldTitle.distanceTo(camera))
})

test('all four artworks occupy the former rear label sites and remain off the roads', () => {
    for (const section of profileSections) {
        expect(profileArtworkPositions[section.id]).toEqual({ x: section.x, y: section.y })
        const box = artwork[section.id]
        for (let x = box.min.x; x <= box.max.x; x += .5) for (let y = box.min.y; y <= box.max.y; y += .5) expect(roadEdgeDistance(x, y)).toBeGreaterThan(.3)
    }
})

test('foreground lettering and entry frames retain road clearance and do not overlap each other', () => {
    const rectangles = [...Object.values(profileForecourts).flatMap(layout => [layout.title, layout.entry]), curiosityLabel]
    for (const rect of rectangles) for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) {
        expect(roadEdgeDistance(rect.x - rect.w / 2 + x * rect.w / 10, rect.y - rect.h / 2 + y * rect.h / 10), JSON.stringify({ rect, x, y })).toBeGreaterThan(.3)
    }
    for (let i = 0; i < rectangles.length; i++) for (const other of rectangles.slice(i + 1)) {
        const rect = rectangles[i]
        expect(Math.abs(rect.x - other.x) < (rect.w + other.w) / 2 && Math.abs(rect.y - other.y) < (rect.h + other.h) / 2).toBe(false)
    }
})

test('the campus forecourt clears the rally arch post in the chase view', () => {
    const placement = activityPropPlacements.find(prop => prop.id === 'campus-checkpoint')
    const solids = activityPropSolids(placement).map(solid => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
        mesh.position.copy(solid.position); mesh.quaternion.copy(solid.quaternion); mesh.scale.copy(solid.scale)
        return new THREE.Box3().setFromObject(mesh)
    })
    const { title, entry } = profileForecourts.education
    // The moved arch clears both centered and lateral campus approaches.
    for (const rect of [title, entry]) for (const offset of [-8, 0, 8]) {
        const camera = new THREE.Vector3(entry.x + offset, entry.y + 18, 8)
        for (const dx of [-.5, 0, .5]) for (const dy of [-.5, 0, .5]) {
            const target = new THREE.Vector3(rect.x + dx * rect.w, rect.y + dy * rect.h, .04)
            const ray = new THREE.Ray(camera, target.clone().sub(camera).normalize())
            for (const solid of solids) {
                const hit = ray.intersectBox(solid, new THREE.Vector3())
                expect(hit === null || hit.distanceTo(camera) > target.distanceTo(camera), JSON.stringify({ camera, target, solid })).toBe(true)
            }
        }
    }
})

test('the campus court centers the title and entry on the facade and remains outside the road', () => {
    const { title, entry } = profileForecourts.education
    expect(title.x).toBe(profileArtworkPositions.education.x)
    expect(entry.x).toBe(title.x)
    expect(entry.y - entry.h / 2 - (title.y + title.h / 2)).toBeGreaterThan(.5)
    for (const rect of [title, entry]) {
        expect(Math.abs(rect.x - campusForecourt.x) + rect.w / 2).toBeLessThan(campusForecourt.w / 2)
        expect(Math.abs(rect.y - campusForecourt.y) + rect.h / 2).toBeLessThanOrEqual(campusForecourt.h / 2 + .001)
    }
    for (let x = 0; x <= 20; x++) for (let y = 0; y <= 20; y++) {
        expect(roadEdgeDistance(campusForecourt.x - campusForecourt.w / 2 + x * campusForecourt.w / 20, campusForecourt.y - campusForecourt.h / 2 + y * campusForecourt.h / 20)).toBeGreaterThan(.3)
    }
})

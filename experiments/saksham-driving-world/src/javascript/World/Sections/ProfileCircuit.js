import * as THREE from 'three'
import { labelTexture } from '../../StudioLabels.js'

export const circuitStops = [
    { x: 2, y: -98.5, angle: 0, label: 'START / FINISH' },
    { x: 40, y: -112, angle: -Math.PI / 2, label: '01' },
    { x: 2, y: -124, angle: Math.PI, label: '02' },
    { x: -26.5, y: -112, angle: Math.PI / 2, label: '03' },
]

export class CircuitProgress {
    constructor() { this.restart() }
    restart() { this.active = false; this.next = 0; this.complete = false }
    enter(index) {
        if (!this.active || this.complete || index !== this.next % 4) return false
        this.next++
        if (this.next === 5) this.complete = true
        return true
    }
}

// Four painted checkpoints. No new assets, collisions, lights or tick callback.
export default class ProfileCircuit {
    constructor({ zones, container }) {
        if (!zones) return
        this.progress = new CircuitProgress()
        const button = document.getElementById('circuit-start')
        const status = document.getElementById('circuit-status')
        this.materials = []
        circuitStops.forEach((stop, index) => {
            const group = new THREE.Group()
            group.position.set(stop.x, stop.y, .035)
            group.rotation.z = stop.angle
            const material = new THREE.MeshBasicMaterial({ color: '#fff0d5', transparent: true, opacity: .85 })
            this.materials.push(material)
            // Lane crossing stripe and directional arrow, facing clockwise.
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(.35, 4), material)
            group.add(stripe)
            const arrow = new THREE.Shape()
            arrow.moveTo(.9, -.35); arrow.lineTo(1.8, -.35)
            arrow.lineTo(1.8, -.75); arrow.lineTo(2.7, 0)
            arrow.lineTo(1.8, .75); arrow.lineTo(1.8, .35)
            arrow.lineTo(.9, .35); arrow.closePath()
            group.add(new THREE.Mesh(new THREE.ShapeGeometry(arrow), material))
            const label = new THREE.Mesh(new THREE.PlaneGeometry(index === 0 ? 6 : 1.3, 1), new THREE.MeshBasicMaterial({ color: '#fff0d5', transparent: true, alphaMap: labelTexture([stop.label], 512, 128), depthWrite: false }))
            // Keep the labels beside the lane, independent of arrow orientation.
            label.position.set(stop.x, stop.y + (index === 0 ? 3 : -3), .04)
            container.add(label, group)
            const zone = zones.add({ position: new THREE.Vector2(stop.x, stop.y), halfExtents: new THREE.Vector2(2.8, 2.8), data: {} })
            zone.on('in', () => { if (this.progress.enter(index)) this.update(status, button) })
        })
        button?.addEventListener('click', () => {
            this.progress.restart()
            this.progress.active = true
            this.update(status, button)
        })
    }
    update(status, button) {
        const progress = this.progress
        this.materials.forEach((material, index) => {
            material.color.set(progress.complete ? '#c3cdf7' : index === progress.next % 4 ? '#ffe0a1' : '#fff0d5')
            material.opacity = progress.complete || index === progress.next % 4 ? .95 : .75
        })
        if (button) button.textContent = 'Restart circuit'
        if (status) status.textContent = progress.complete ? 'Loop complete. Nicely driven.' : progress.next === 0 ? 'Cross START below About; follow the arrows clockwise.' : progress.next === 4 ? '3 / 3 checkpoints. Return to START to finish.' : `${progress.next - 1} / 3 checkpoints. Next: ${String(progress.next).padStart(2, '0')}.`
    }
}

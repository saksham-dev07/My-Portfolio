import * as THREE from 'three'
import { labelTexture } from '../../StudioLabels.js'
import CampusRally, { rallyGates } from '../Activities/CampusRally.js'

export const circuitStops = rallyGates

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

// Painted checkpoints present game state; CampusRally owns timing and rules.
export default class ProfileCircuit {
    constructor({ zones, container, physics }) {
        this.id = 'rally'
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
            // The start/finish checker is painted in the terrain mask. Other
            // gates retain their status stripe, bounded inside the lane.
            if (index !== 0) group.add(new THREE.Mesh(new THREE.PlaneGeometry(.18, 2.8), material))
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
        })
        this.startRequest = () => window.dispatchEvent(new CustomEvent('drive-activity-start', { detail: { id: this.id } }))
        this.button = button
        button?.addEventListener('click', this.startRequest)
        if (physics?.world && physics?.car?.chassis?.body) {
            this.rally = new CampusRally({ physics, onUpdate: detail => this.present(detail, status, button) })
            this.present(this.rally.snapshot(), status, button)
        }
    }
    start() { return this.rally?.start() ?? false }
    stop() { this.rally?.stop() }
    handleAction(action) { return this.rally?.handleAction(action) ?? false }
    snapshot() { return this.rally?.snapshot() ?? { id: this.id, title: 'Campus Rally', phase: 'idle' } }
    present(detail, status, button) {
        this.materials.forEach((material, index) => {
            const active = detail.phase === 'running' && index === detail.nextGate
            const complete = detail.phase === 'result' && detail.completed
            material.color.set(complete ? '#b6e3d5' : active ? '#ffe0a1' : '#fff0d5')
            material.opacity = active || complete ? .98 : .72
        })
        if (button) button.textContent = detail.phase === 'idle' ? 'Start rally' : detail.phase === 'result' ? 'Retry rally' : 'Restart rally'
        if (status) status.textContent = detail.phase === 'idle' ? 'Campus Rally: three gates, one clockwise lap. Your best time is saved.' : detail.message
    }
    destroy() {
        this.rally?.destroy()
        this.button?.removeEventListener('click', this.startRequest)
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

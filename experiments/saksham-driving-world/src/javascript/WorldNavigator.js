import { projects } from './sakshamProjects.js'
import { profileSections } from './sakshamProfile.js'
import { landscapeBounds, roads, distanceToRoad } from './World/LandscapeLayout.js'
import '../style/world-navigator.css'

const SVG_NS = 'http://www.w3.org/2000/svg'
const mapWidth = landscapeBounds.maxX - landscapeBounds.minX
const mapHeight = landscapeBounds.maxY - landscapeBounds.minY
const roadLabels = {
    Arrival: 'The starting line',
    'Hub roundabout': 'The crossroads',
    'Research approach': 'Research approach',
    'Research promenade': 'Research promenade',
    Playground: 'The playground',
    'Personal avenue': 'Information garden',
    'Garden west': 'Information garden',
    'Garden east': 'Information garden',
    'Ridge detour': 'Ridge road',
    'Quiet clearing': 'Quiet clearing',
}

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name)
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
    return element
}

export function mapPoint(position) {
    return { x: position.x - landscapeBounds.minX, y: landscapeBounds.maxY - position.y }
}

// Cannon's car faces local +X; SVG's vertical axis points down.
export function mapHeading({ x, y, z, w }) {
    return -Math.atan2(2 * (x * y + w * z), 1 - 2 * (y * y + z * z)) * 180 / Math.PI
}

export function locationAt(position, stops) {
    let nearestStop = null
    let nearestDistance = 11
    for (const stop of stops) {
        const distance = Math.hypot(position.x - stop.x, position.y - stop.y)
        if (distance < nearestDistance) {
            nearestStop = stop
            nearestDistance = distance
        }
    }
    if (nearestStop) return nearestStop.name
    if (Math.abs(position.x) < 18 && position.y > -18) return 'The starting line'
    if (position.x < -20 && position.y > -58) return 'The playground'
    let nearestRoad = null
    let roadDistance = Infinity
    for (const road of roads) {
        const distance = distanceToRoad(road, position.x, position.y)
        if (distance < roadDistance) {
            nearestRoad = road
            roadDistance = distance
        }
    }
    return roadLabels[nearestRoad?.name] || 'Campus circuit'
}

export default class WorldNavigator {
    constructor({ app, onOpenMap, onLocation = () => {} }) {
        this.app = app
        this.onLocation = onLocation
        this.visited = new Set()
        this.lastLocation = ''
        this.nextUpdate = 0
        this.lastCount = -1
        this.stops = [
            ...profileSections.map(section => {
                const area = app.world.sections.profile.entryAreas.find(entry => entry.id === section.id)?.area
                return { id: section.id, name: section.name, kind: 'profile', area, x: section.x, y: section.y - 4 }
            }),
            ...projects.map((project, index) => {
                const site = app.world.sections.projects.items[index]
                return { id: project.id, name: project.name, kind: 'project', area: site.floor.area, x: site.floor.area.position.x, y: site.floor.area.position.y }
            }),
        ]

        this.element = document.createElement('button')
        this.element.type = 'button'
        this.element.className = 'world-navigator'
        this.element.setAttribute('aria-haspopup', 'dialog')
        this.element.addEventListener('click', () => onOpenMap())

        const heading = document.createElement('span')
        heading.className = 'world-navigator__heading'
        const icon = svgElement('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' })
        icon.append(svgElement('path', { d: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15' }))
        const title = document.createElement('span')
        title.textContent = 'World map'
        const expand = svgElement('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: 'world-navigator__expand' })
        expand.append(svgElement('path', { d: 'M7 17 17 7M7 7h10v10' }))
        heading.append(icon, title, expand)

        const map = svgElement('svg', {
            class: 'world-navigator__map',
            viewBox: `-8 -8 ${mapWidth + 16} ${mapHeight + 16}`,
            'aria-hidden': 'true',
        })
        for (const road of roads) {
            // Authored road samples are spaced at half a metre. Two-metre
            // intervals retain rounded junctions at this map's small scale.
            const samples = road.samples.filter((_, index) => index % 4 === 0 || index === road.samples.length - 1)
            const points = samples.map(sample => {
                const point = mapPoint(sample)
                return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
            }).join(' ')
            map.append(svgElement('polyline', { points, class: 'world-navigator__road' }))
        }

        for (const stop of this.stops) {
            const point = mapPoint(stop)
            stop.marker = svgElement('circle', {
                cx: point.x, cy: point.y, r: 3.4,
                class: `world-navigator__stop world-navigator__stop--${stop.kind}`,
            })
            map.append(stop.marker)
        }
        this.carMarker = svgElement('g', { class: 'world-navigator__car' })
        this.carMarker.append(
            svgElement('circle', { r: 9, class: 'world-navigator__car-halo' }),
            svgElement('path', { d: 'M7 0-5-4-2 0-5 4Z', class: 'world-navigator__car-arrow' }),
        )
        map.append(this.carMarker)

        const legend = document.createElement('span')
        legend.className = 'world-navigator__legend'
        legend.setAttribute('aria-hidden', 'true')
        for (const [kind, label] of [['project', 'Projects'], ['profile', 'Profile'], ['visited', 'Explored'], ['car', 'You']]) {
            const entry = document.createElement('span')
            entry.className = `world-navigator__key world-navigator__key--${kind}`
            entry.textContent = label
            legend.append(entry)
        }
        this.location = document.createElement('span')
        this.location.className = 'world-navigator__location'
        this.progress = document.createElement('span')
        this.progress.className = 'world-navigator__progress'
        this.element.append(heading, map, legend, this.location, this.progress)
        document.body.append(this.element)

        this.tick = () => {
            // Visit detection runs with physics so a quick pass through a small
            // pad still counts. Only presentation is limited to ten updates/sec.
            for (const stop of this.stops) {
                if (!this.visited.has(stop.id) && stop.area?.containsCar()) this.visited.add(stop.id)
            }
            if (app.time.elapsed < this.nextUpdate) return
            this.nextUpdate = app.time.elapsed + 100
            this.update()
        }
        app.time.on('tick.worldNavigator', this.tick)
        this.update()
    }

    update() {
        const body = this.app.world.physics.car.chassis.body
        const point = mapPoint(body.position)
        this.carMarker.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${mapHeading(body.quaternion).toFixed(1)})`)
        const location = locationAt(body.position, this.stops)
        const locationChanged = location !== this.lastLocation
        const countChanged = this.lastCount !== this.visited.size
        if (locationChanged) {
            this.lastLocation = location
            this.location.textContent = location
            this.onLocation(location)
        }
        if (countChanged) {
            this.lastCount = this.visited.size
            this.progress.textContent = `${this.visited.size} / ${this.stops.length} explored`
            for (const stop of this.stops) stop.marker.classList.toggle('is-visited', this.visited.has(stop.id))
            this.element.classList.toggle('is-complete', this.visited.size === this.stops.length)
        }
        if (locationChanged || countChanged) {
            this.element.setAttribute('aria-label', `Open world map. ${location}. ${this.visited.size} of ${this.stops.length} stops explored.`)
        }
    }

    destroy() {
        this.app.time.off('tick.worldNavigator')
        this.element.remove()
    }
}

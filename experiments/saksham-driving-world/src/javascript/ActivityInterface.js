import ActivityDirector from './World/Activities/ActivityDirector.js'
import '../style/world-activities.css'

const activities = [
    { id: 'bowling', title: 'Maidan Bowling', category: 'A little friendly chaos', description: 'Three rolls. Ten pins each. Push the ball with your car or use the assisted roll.', controls: 'Arrows / WASD to drive. Roll ball for a straight shot.', icon: '<circle cx="7" cy="17" r="4"/><path d="M15 3h3l-1 4 2 9a2 2 0 0 1-2 3h-1a2 2 0 0 1-2-3l2-9-1-4Z"/>' },
    { id: 'rally', title: 'Campus Rally', category: 'Find your racing line', description: 'One clockwise lap around campus. Cross the three checkpoints in order, then return to START.', controls: 'Arrows / WASD to drive. Space to brake. Your best time stays on this browser.', icon: '<path d="M5 21V3m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>' },
]

function icon(paths) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '1.5'); svg.setAttribute('aria-hidden', 'true')
    svg.innerHTML = paths
    return svg
}

export function activityInterface(app, { isStarted, onStart }) {
    const focusWorld = () => app.$canvas.focus({ preventScroll: true })
    const release = () => app.world.controls.releaseActions()
    const play = document.createElement('button')
    play.type = 'button'; play.id = 'world-play'; play.disabled = true
    play.append(icon('<path d="m8 5 11 7-11 7V5Z"/>'), document.createTextNode('Play'))
    document.querySelector('.drive-actions').prepend(play)

    const menu = document.createElement('dialog')
    menu.className = 'activity-menu'; menu.setAttribute('aria-labelledby', 'activity-menu-title')
    const header = document.createElement('header')
    const intro = document.createElement('div')
    const eyebrow = document.createElement('p'); eyebrow.className = 'activity-eyebrow'; eyebrow.textContent = 'Take the scenic route'
    const title = document.createElement('h2'); title.id = 'activity-menu-title'; title.textContent = 'A break from the usual.'
    intro.append(eyebrow, title)
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Back to world'
    header.append(intro, close); menu.append(header)
    const choices = document.createElement('div'); choices.className = 'activity-choices'
    for (const activity of activities) {
        const card = document.createElement('article')
        const category = document.createElement('p'); category.className = 'activity-eyebrow'; category.textContent = activity.category
        const name = document.createElement('h3'); name.append(icon(activity.icon), document.createTextNode(activity.title))
        const description = document.createElement('p'); description.textContent = activity.description
        const controls = document.createElement('p'); controls.className = 'activity-controls'; controls.textContent = activity.controls
        const start = document.createElement('button'); start.type = 'button'; start.textContent = `Play ${activity.title}`
        start.addEventListener('click', () => startActivity(activity.id))
        card.append(category, name, description, controls, start); choices.append(card)
    }
    const menuStatus = document.createElement('p'); menuStatus.setAttribute('role', 'status'); menuStatus.hidden = true
    menu.append(choices, menuStatus)

    const hud = document.createElement('aside'); hud.className = 'activity-hud'; hud.hidden = true
    hud.setAttribute('aria-label', 'Current activity')
    const hudHeader = document.createElement('div'); hudHeader.className = 'activity-hud-header'
    const hudTitle = document.createElement('h2')
    const quit = document.createElement('button'); quit.type = 'button'; quit.textContent = 'Leave'
    quit.setAttribute('aria-label', 'Leave activity')
    hudHeader.append(hudTitle, quit)
    const score = document.createElement('p'); score.className = 'activity-score'
    const timer = document.createElement('span'); timer.className = 'activity-timer'; timer.setAttribute('aria-label', 'Elapsed time')
    const message = document.createElement('p'); message.className = 'activity-message'
    message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); message.setAttribute('aria-atomic', 'true')
    const actions = document.createElement('div'); actions.className = 'activity-hud-actions'
    hud.append(hudHeader, score, timer, message, actions)
    document.body.append(menu, hud)
    let ownsBrake = false
    let actionKey = ''
    const director = new ActivityDirector({
        resolve: id => id === 'bowling' ? app.world.sections?.playground?.bowlingGame : id === 'rally' ? app.world.sections?.profile?.district?.circuit : null,
        onChange: game => {
            if (!game) { hud.hidden = true; delete document.body.dataset.activity; actionKey = '' }
            else {
                document.body.dataset.activity = game.id
                hud.hidden = false
                render(game.snapshot?.())
            }
        },
    })
    const unlockMenu = () => {
        if (!ownsBrake) return
        ownsBrake = false
        if (!document.querySelector('.drive-index[open]')) app.world.physics.car.unbrake()
    }
    function startActivity(id) {
        if (!isStarted()) return
        release()
        unlockMenu()
        if (menu.open) menu.close()
        let didStart = false
        try { didStart = director.start(id) } catch (error) { console.warn('Activity could not start', error) }
        if (didStart) {
            onStart(id)
            document.querySelector('.discovery-status')?.setAttribute('hidden', '')
            focusWorld()
        } else {
            open()
            menuStatus.textContent = 'This activity is still loading. Try again in a moment.'
            menuStatus.hidden = false
        }
    }
    function render(detail) {
        if (!detail || detail.id !== director.current?.id) return
        hud.hidden = false
        hud.dataset.phase = detail.phase
        hudTitle.textContent = detail.title || activities.find(item => item.id === detail.id)?.title
        score.textContent = detail.scoreText || ''
        score.hidden = !detail.scoreText
        timer.hidden = !Number.isFinite(detail.timerMs)
        if (!timer.hidden) timer.textContent = `${(Math.max(0, detail.timerMs) / 1000).toFixed(1)}s`
        if (message.textContent !== detail.message) message.textContent = detail.message || ''
        const nextActions = detail.actions || []
        const nextKey = JSON.stringify(nextActions)
        if (nextKey === actionKey) return
        actionKey = nextKey
        actions.replaceChildren()
        for (const action of nextActions) {
            if (!action.id || !action.label || action.id === 'quit') continue
            const button = document.createElement('button'); button.type = 'button'; button.textContent = action.label
            button.addEventListener('click', () => {
                director.action(action.id)
                if (['next', 'replay', 'retry'].includes(action.id) && director.current) onStart(director.current.id)
                release(); focusWorld()
            })
            actions.append(button)
        }
    }
    const open = () => {
        if (!isStarted() || document.querySelector('dialog[open]')) return
        release(); app.world.physics.car.brake(); ownsBrake = true
        menuStatus.hidden = true; menu.showModal()
    }
    const stop = () => { director.stop(); release(); focusWorld() }
    const startHandler = event => startActivity(event.detail?.id)
    const updateHandler = event => render(event.detail)
    const focusHandler = event => {
        if (event.detail?.id !== director.current?.id) return
        onStart(event.detail.id); focusWorld()
    }
    const actionHandler = event => { director.action(event.detail?.action); release(); focusWorld() }
    const escapeHandler = event => {
        if (event.key !== 'Escape' || document.querySelector('dialog[open]') || !director.current) return
        event.preventDefault(); event.stopImmediatePropagation(); stop()
    }
    play.addEventListener('click', open)
    close.addEventListener('click', () => menu.close())
    menu.addEventListener('close', () => { if (!menu.open) { unlockMenu(); focusWorld() } })
    quit.addEventListener('click', stop)
    window.addEventListener('drive-activity-start', startHandler)
    window.addEventListener('drive-activity-update', updateHandler)
    window.addEventListener('drive-activity-focus', focusHandler)
    window.addEventListener('drive-activity-action', actionHandler)
    window.addEventListener('keydown', escapeHandler)
    return { director, menu, hud, play, enable: () => { play.disabled = false }, stop,
        dispose: () => {
            director.stop(); unlockMenu()
            window.removeEventListener('drive-activity-start', startHandler)
            window.removeEventListener('drive-activity-update', updateHandler)
            window.removeEventListener('drive-activity-focus', focusHandler)
            window.removeEventListener('drive-activity-action', actionHandler)
            window.removeEventListener('keydown', escapeHandler)
            menu.remove(); hud.remove(); play.remove()
        },
    }
}

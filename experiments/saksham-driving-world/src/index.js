import './style/main.css'
import Application from './javascript/Application.js'

window.application = new Application({
    $canvas: document.querySelector('.js-canvas'),
    useComposer: true
})

import './style/saksham.css'
import { drivingInterface } from './javascript/DrivingInterface.js'
// Apply the shared theme after all component styles, in dev and production.
import './style/driving-hud.css'
drivingInterface(window.application)

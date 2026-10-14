import { projects } from './sakshamProjects.js';
import { profileSections } from './sakshamProfile.js';
import { profileForecourts } from './World/Sections/ProfileForecourts.js';
import { atmospherePresets } from './World/EnvironmentConfig.js';
import { projectStoryHref, readProjectRequest } from '../../../../src/utils/worldNavigation.js';
import WorldNavigator from './WorldNavigator.js';
import { discoveryNotice } from './DiscoveryNotice.js';
import { activityInterface } from './ActivityInterface.js';
import { profileRequest, profileEntryOrder } from './ProfileNavigation.js';

export function drivingInterface(app) {
  discoveryNotice({document,window,focusWorld:()=>app.$canvas.focus({preventScroll:true})});
  const start = document.querySelector('#start-drive');
  const boot = document.querySelector('.drive-boot');
  const progress = document.querySelector('#world-progress');
  const status = document.querySelector('#loading-status');
  const index = document.querySelector('.drive-index');
  const opener = document.querySelector('#project-index');
  const sound = document.querySelector('#drive-sound');
  const vehicleButton = document.querySelector('#drive-vehicle');
  const vehicleBadge = document.querySelector('#vehicle-badge');
  const vehicleButtons = document.querySelectorAll('[data-vehicle-select]');
  const atmosphereButton = document.querySelector('#drive-atmosphere');
  const atmosphereBadge = document.querySelector('#atmosphere-badge');
  const atmosphereButtons = document.querySelectorAll('[data-atmosphere-select]');
  const telemetry = document.querySelector('#drive-telemetry');
  const speedValue = document.querySelector('#speed-value');
  const speedBarFill = document.querySelector('#speed-bar-fill');
  const boostChip = document.querySelector('#boost-chip');
  const stuntCallout = document.querySelector('#stunt-callout');
  const stuntCalloutBadge = document.querySelector('#stunt-callout-badge');
  const stuntCalloutText = document.querySelector('#stunt-callout-text');
  const driveHint = document.querySelector('#drive-hint');
  const home = document.querySelector('#drive-home');
  const resetCar = document.querySelector('#drive-reset');
  const location = document.querySelector('#world-location');
  const requestedProject = readProjectRequest(window.location.search, projects);
  const cameraTools = document.querySelector('.camera-tools');
  const cameraView = document.querySelector('#camera-view');
  const topTools = document.querySelector('#top-tools');
  const cameraHelp = document.querySelector('#camera-help');
  const cameraStatus = document.querySelector('#camera-status');
  const cameraToggle = document.querySelector('#camera-toggle');
  const cameraBody = document.querySelector('#camera-body');
  const followCar = document.querySelector('#follow-car');

  const syncVehicleTools = (info = app.world?.car?.getVehicleInfo?.()) => {
    if (!info) return;
    if (vehicleButton) {
      vehicleButton.dataset.vehicle = info.id;
      vehicleButton.setAttribute('aria-label', `Vehicle: ${info.label} (V)`);
      vehicleButton.title = `Switch vehicle: ${info.label} (V)`;
    }
    if (vehicleBadge) {
      vehicleBadge.textContent = info.shortLabel;
    }
    vehicleButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.vehicleSelect === info.id));
    });
  };

  vehicleButton?.addEventListener('click', () => {
    const info = app.world.toggleVehicle();
    syncVehicleTools(info);
    app.$canvas.focus({ preventScroll: true });
  });

  vehicleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const info = app.world.setVehicle(btn.dataset.vehicleSelect);
      syncVehicleTools(info);
      app.$canvas.focus({ preventScroll: true });
    });
  });

  window.addEventListener('drive-vehicle-change', event => {
    if (event.detail) syncVehicleTools(event.detail);
  });

  let calloutTimer = null;
  window.addEventListener('drive-stunt-callout', event => {
    if (!stuntCallout || !event.detail) return;
    stuntCalloutBadge.textContent = event.detail.badge || 'STUNT!';
    stuntCalloutText.textContent = event.detail.text || '';
    stuntCallout.hidden = false;
    if (calloutTimer) window.clearTimeout(calloutTimer);
    calloutTimer = window.setTimeout(() => {
      stuntCallout.hidden = true;
    }, 3800);
  });

  const syncAtmosphereTools = (preset = atmospherePresets[app.world?.evening?.mode || 'dusk']) => {
    if (!preset) return;
    if (atmosphereButton) {
      atmosphereButton.dataset.atmosphere = preset.id;
      atmosphereButton.setAttribute('aria-label', `Atmosphere: ${preset.label} (L)`);
      atmosphereButton.title = `Cycle atmosphere: ${preset.label} (L)`;
    }
    if (atmosphereBadge) {
      atmosphereBadge.textContent = preset.shortLabel;
    }
    atmosphereButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.atmosphereSelect === preset.id));
    });
  };

  atmosphereButton?.addEventListener('click', () => {
    const preset = app.world.cycleAtmosphere();
    syncAtmosphereTools(preset);
    app.$canvas.focus({ preventScroll: true });
  });

  atmosphereButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = app.world.setAtmosphere(btn.dataset.atmosphereSelect);
      syncAtmosphereTools(preset);
      app.$canvas.focus({ preventScroll: true });
    });
  });

  const setCameraCollapsed = collapsed => {
    const expanded = !collapsed;
    cameraToggle.setAttribute('aria-expanded', String(expanded));
    cameraToggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} camera controls`);
    cameraToggle.title = `${expanded ? 'Collapse' : 'Expand'} camera controls`;
    cameraBody.hidden = !expanded;
    cameraTools.dataset.collapsed = String(collapsed);
  };

  cameraToggle.addEventListener('click', () => {
    const expanded = cameraToggle.getAttribute('aria-expanded') !== 'true';
    setCameraCollapsed(!expanded);
  });
  // Keep the playfield open; detailed camera and driving controls are opt-in.
  setCameraCollapsed(true);

  const syncTouchHints = () => {
    if (!driveHint) return;
    if (app.config.touch) {
      driveHint.textContent = 'Joystick steer · Pedals drive & boost · Tap Jeep/Dusk to switch';
    }
  };

  const syncCameraTools = () => {
    const view = app.camera.view;
    cameraView.value = view;
    topTools.hidden = view !== 'top';
    followCar.hidden = view !== 'orbit';
    followCar.disabled = app.camera.following;
    const following = app.camera.following && !app.camera.exploring;
    cameraStatus.dataset.state = view === 'orbit' ? following ? 'follow' : 'explore' : view;
    cameraStatus.textContent = view === 'top' ? 'Map overview' : view === 'first' ? 'Behind the wheel' : following ? 'Auto follow' : 'Exploring';
    const touch = app.config.touch;
    cameraHelp.textContent = view === 'first'
      ? touch ? 'Hood-mounted camera · use Camera menu to switch view' : 'Hood-mounted camera · press C for map overview'
      : view === 'top'
        ? touch ? 'Drag to pan · pinch to zoom' : 'Drag to pan · scroll to zoom'
        : touch ? 'Drag to explore · pinch to zoom\nDrive to automatically follow your car.' : 'Left drag: pan · Scroll: zoom\nRight drag: rotate · Drive: auto follow';
  };
  app.time.on('cameraControl', syncCameraTools);
  window.addEventListener('drive-touch-mode', () => {
    syncTouchHints();
    syncCameraTools();
  });
  window.addEventListener('drive-boundary', () => { location.textContent = 'BACK ON THE ROAD · PERIMETER RIDGE'; });
  cameraView.addEventListener('change', () => {
    app.camera.setView(cameraView.value);
    syncCameraTools();
    app.$canvas.focus({ preventScroll: true });
  });
  followCar.addEventListener('click', () => {
    app.camera.focusCar();
    app.$canvas.focus({ preventScroll: true });
  });
  document.querySelector('#fit-map').addEventListener('click', () => {
    app.camera.fitMap();
    app.$canvas.focus({ preventScroll: true });
  });
  document.querySelector('#focus-car').addEventListener('click', () => {
    app.camera.focusCar();
    app.$canvas.focus({ preventScroll: true });
  });
  resetCar?.addEventListener('click', () => {
    app.world.controls.releaseActions();
    app.world.controls.trigger('action', ['reset']);
    app.camera.focusCar();
    if (app.config.touch || window.innerWidth <= 900) setCameraCollapsed(true);
    app.$canvas.focus({ preventScroll: true });
  });
  let started = false;
  let returnToWorld = false;
  app.activities = activityInterface(app, {
    isStarted: () => started,
    onStart: id => {
      app.world.scenicRoutes?.models?.load?.();
      setCameraCollapsed(true);
      cameraView.value = 'orbit';
      app.camera.setView('orbit');
      const body = app.world.physics.car.chassis.body;
      app.camera.target.copy(body.position);
      app.camera.target.z = 0;
      app.camera.targetEased.copy(app.camera.target);
      if (id === 'bowling' || id === 'stunt') app.camera.frameActivity(app.activities.director.current.snapshot().focus);
      else app.camera.focusCar();
      syncCameraTools();
    },
  });
  const nearbyButton = document.createElement('button');
  nearbyButton.id = 'nearby-section';
  nearbyButton.hidden = true;
  document.querySelector('.drive-bottom > div').prepend(nearbyButton);
  function storyLink(project, text) {
    const link = document.createElement('a');
    link.href = projectStoryHref(project.id);
    link.textContent = text;
    link.setAttribute('aria-label', `Read ${project.name} in the portfolio`);
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (window.parent !== window) {
        event.preventDefault();
        window.parent.postMessage({ type: 'portfolio-project', projectId: project.id }, window.location.origin);
      }
    });
    return link;
  }
  let activeStoryLink = null;
  let activeStoryId = null;
  function showProjectStory(project) {
    if ((project?.id || null) === activeStoryId) return;
    activeStoryId = project?.id || null;
    activeStoryLink?.remove();
    activeStoryLink = project ? storyLink(project, 'Read this project’s story') : null;
    if (activeStoryLink) {
      activeStoryLink.className = 'world-story-link';
      document.querySelector('.drive-bottom').append(activeStoryLink);
    }
  }
  let nearby = null;
  const modelStatus = document.createElement('p');
  modelStatus.className = 'model-status';
  modelStatus.setAttribute('role', 'status');
  modelStatus.hidden = true;
  document.body.append(modelStatus);
  window.addEventListener('drive-model', event => {
    modelStatus.textContent = event.detail;
    modelStatus.hidden = !event.detail;
  });
  app.time.on('tick', () => {
    if (started && !index.open) {
      const car = app.world.physics.car;
      const position = car.chassis.body.position;
      const velocity = car.chassis.body.velocity;
      const planarSpeed = Math.hypot(velocity.x, velocity.y);
      const kmh = Math.min(140, Math.round(planarSpeed * 4.2));
      if (speedValue) speedValue.textContent = String(kmh).padStart(2, '0');
      if (speedBarFill) {
        const pct = Math.min(100, Math.round((kmh / 110) * 100));
        speedBarFill.style.width = `${pct}%`;
      }
      if (boostChip) {
        const isBoosting = Boolean(app.world.controls.actions.boost && (app.world.controls.actions.up || app.world.controls.actions.down || kmh > 4));
        const inAir = Boolean(car.inAir && position.z > 0.7);
        const isCyber = Boolean(app.config.cyberTruck);
        boostChip.dataset.mode = inAir ? 'air' : isBoosting ? 'boost' : isCyber ? 'cyber' : 'cruise';
        boostChip.textContent = inAir
          ? 'AIRBORNE'
          : isBoosting
            ? 'BOOST'
            : isCyber
              ? 'CYBER · B CANNON'
              : 'TRAIL JEEP';
      }

      // Auto-collapse camera controls on mobile/touch when the user starts actively driving
      if ((app.config.touch || window.innerWidth <= 760) && cameraTools.dataset.collapsed === 'false' && (app.world.controls.actions.up || app.world.controls.actions.down)) {
        setCameraCollapsed(true);
      }

      const projectIndex = app.world.sections.projects.items.findIndex(site => Math.abs(position.x - site.x) < 10 && Math.abs(position.y - (site.y - 3)) < 10);
      showProjectStory(projects[projectIndex] || null);
    }
    const entry = started && !index.open && app.world.sections.profile.entryAreas.find(entry => entry.area.containsCar());
    if ((entry?.id || null) === (nearby?.id || null)) return;
    nearby = entry || null;
    nearbyButton.hidden = !nearby;
    if (nearby) nearbyButton.textContent = `Enter ${profileSections.find(section => section.id === nearby.id).name}`;
  });
  nearbyButton.addEventListener('click', () => {
    if (nearby && nearby.area.containsCar()) nearby.area.interact(false);
  });
  app.resources.on('progress', value => {
    progress.value = value * .7;
    if (!app.resources.loader.failures.size) status.textContent = `Preparing your drive · ${Math.round(value * 100)}%`;
  });
  const retryLoading = document.querySelector('#retry-loading');
  app.resources.on('error', () => {
    status.textContent = 'Some scene files could not load. Retry to continue.';
    retryLoading.hidden = false;
    retryLoading.disabled = false;
  });
  retryLoading.addEventListener('click', () => {
    if(app.world.prepareFailed){window.location.reload();return;}
    retryLoading.disabled = true;
    status.textContent = 'Reconnecting. Your loaded scenery is kept.';
    app.resources.loader.retryFailed();
  });
  app.resources.on('ready', () => {
    start.disabled=true;
    status.textContent='Preparing the scene…';
  });
  app.resources.on('worldProgress', state=>{
    progress.value=.7+.3*state.progress;
    status.textContent=state.message;
  });
  app.resources.on('worldError',()=>{
    status.textContent='The scene could not be prepared. Reload to retry.';
    retryLoading.textContent='Reload scene';
    retryLoading.hidden=false;retryLoading.disabled=false;
  });
  app.resources.on('worldReady', () => {
    progress.value=1;
    start.disabled = false;
    retryLoading.hidden = true;
    start.textContent = 'Enter the world';
    status.textContent = 'World ready. Your curiosity supplies the direction.';
    app.world.scenicRoutes?.models?.load?.();
    syncAtmosphereTools();
    syncVehicleTools();
  });
  app.world.startingScreen.area.on('interact', () => {
    if (started || !app.world.prepared) return;
    started = true;
    app.world.sounds.enable();
    boot.hidden = true;
    home.disabled = false;
    if (resetCar) resetCar.disabled = false;
    if (telemetry) telemetry.hidden = false;
    app.camera.car = app.world.physics.car;
    app.camera.controls = app.world.controls;
    app.activities.enable();
    cameraTools.hidden = false;
    syncTouchHints();
    syncCameraTools();
    syncAtmosphereTools();
    syncVehicleTools();
    app.worldNavigator = new WorldNavigator({ app, onOpenMap: () => openMap(), onLocation: name => { location.textContent = name.toUpperCase(); } });
    document.querySelectorAll('[data-drive]').forEach(button => { button.disabled = false; });
    if (requestedProject) {
      const destination = app.world.sections.projects.items[projects.indexOf(requestedProject)];
      if (destination) {
        travel(destination.x, destination.y);
        location.textContent = requestedProject.name.toUpperCase();
        showProjectStory(requestedProject);
      }
    }
    app.$canvas.focus({ preventScroll: true });
  });
  start.addEventListener('click', () => {
    if (!started && !start.disabled) app.world.startingScreen.area.trigger('interact');
  });
  function travel(x, y, { offsetY = -7, heading = 0 } = {}) {
    app.activities.stop();
    const car = app.world.physics.car;
    const body = car.chassis.body;
    const arrivalY = y + offsetY;
    body.position.set(x, arrivalY, 1.5);
    body.previousPosition.copy(body.position);
    body.interpolatedPosition.copy(body.position);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.force.set(0, 0, 0);
    body.torque.set(0, 0, 0);
    body.quaternion.set(0, 0, Math.sin(heading / 2), Math.cos(heading / 2));
    body.previousQuaternion.copy(body.quaternion);
    body.interpolatedQuaternion.copy(body.quaternion);
    body.wakeUp();
    car.oldPosition.copy(body.position);
    app.camera.pan.reset();
    app.camera.target.set(x, arrivalY, 0);
    app.camera.focusCar();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      app.camera.targetEased.set(x, arrivalY, 0);
    }
    app.world.controls.releaseActions();
    showProjectStory(null);
    returnToWorld = index.open;
    index.close();
    if (app.config.touch || window.innerWidth <= 900) setCameraCollapsed(true);
    app.$canvas.focus({ preventScroll: true });
  }
  home.addEventListener('click', () => {
    travel(0, 7);
    showProjectStory(null);
    location.textContent = 'THE STARTING LINE';
  });
  sound.addEventListener('click', () => {
    const enabled = app.world.sounds.muted;
    app.world.sounds.setMuted(!enabled);
    sound.querySelector('span').textContent = enabled ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(enabled));
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]') && !event.defaultPrevented && window.parent !== window) {
      window.parent.postMessage({ type: 'exit-world' }, window.location.origin);
      return;
    }
    const key = event.key.toLowerCase();
    const inEditable = event.target?.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"])');
    if (key === 'l' && started && !document.querySelector('dialog[open]') && !inEditable) {
      const preset = app.world.cycleAtmosphere();
      syncAtmosphereTools(preset);
      return;
    }
    if (key === 'v' && started && !document.querySelector('dialog[open]') && !inEditable) {
      const info = app.world.toggleVehicle();
      syncVehicleTools(info);
      return;
    }
    if (key !== 'm') return;
    sound.querySelector('span').textContent = app.world.sounds.muted ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-pressed', String(!app.world.sounds.muted));
  });
  function openMap(section = 'projects', chapter = null) {
    for (const key of Object.keys(app.world.controls.actions)) app.world.controls.actions[key] = false;
    if (started) app.world.physics.car.brake();
    selectSection(section, chapter);
    if (!index.open) index.showModal();
  }
  opener.addEventListener('click', () => openMap());
  window.addEventListener('drive-section', event => {
    const request = profileRequest(event.detail);
    if (!request) return;
    returnToWorld = true;
    openMap(request.id, request.chapter);
  });
  document.querySelector('#close-index').addEventListener('click', () => index.close());
  index.addEventListener('close', () => {
    if (started && !document.querySelector('dialog[open]')) app.world.physics.car.unbrake();
    (returnToWorld ? app.$canvas : opener).focus({ preventScroll: true });
    returnToWorld = false;
  });
  const list = document.querySelector('#project-list');
  const navigation = document.querySelector('#world-navigation');
  const profile = document.querySelector('#profile-content');
  const sectionButtons = new Map();
  function selectSection(id, chapter = null) {
    const landmarks = app.world.sections?.profile?.landmarks;
    if (id === 'education') landmarks?.loadCampus();
    if (id === 'about') landmarks?.loadAvatar();
    if (id === 'skills') landmarks?.loadSkills();
    if (id === 'highlights') landmarks?.loadHighlights();
    list.hidden = id !== 'projects';
    profile.hidden = id === 'projects';
    for (const [key, button] of sectionButtons) button.setAttribute('aria-pressed', String(key === id));
    if (id === 'projects') return;
    const section = profileSections.find(item => item.id === id);
    profile.replaceChildren();
    const eyebrow = document.createElement('p');
    eyebrow.className = 'drive-eyebrow';
    eyebrow.textContent = section.eyebrow;
    const title = document.createElement('h3');
    title.textContent = section.name;
    const intro = document.createElement('p');
    intro.textContent = section.intro;
    const drive = document.createElement('button');
    drive.className = 'profile-drive';
    drive.textContent = `Drive to ${section.name}`;
    drive.dataset.drive = section.id;
    drive.disabled = !started;
    drive.addEventListener('click', () => {
      const { entry } = profileForecourts[section.id];
      travel(entry.x, entry.y, { offsetY: 0, heading: -Math.PI / 2 });
      location.textContent = section.name.toUpperCase();
    });
    profile.append(eyebrow, title, intro);
    if (section.facts && section.facts.length) {
      const factsBar = document.createElement('div');
      factsBar.className = 'profile-facts-bar';
      for (const fact of section.facts) {
        const chip = document.createElement('span');
        chip.className = 'profile-fact-chip';
        chip.textContent = fact;
        factsBar.append(chip);
      }
      profile.append(factsBar);
    }
    const actionsRow = document.createElement('div');
    actionsRow.className = 'profile-actions-row';
    actionsRow.append(drive);
    if (section.links && section.links.length) {
      for (const [label, href] of section.links) {
        const a = document.createElement('a');
        a.className = 'profile-action-link';
        a.textContent = label;
        a.href = href;
        if (href.startsWith('http') || href.endsWith('.pdf')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        actionsRow.append(a);
      }
    }
    profile.append(actionsRow);
    const entries = document.createElement('div');
    entries.className = 'profile-entries';
    for (const { entry: [heading, copy], selected } of profileEntryOrder(id, section.entries, chapter)) {
      const article = document.createElement('article');
      if (selected) {
        article.className = 'profile-chapter-current';
        const marker = document.createElement('p');
        marker.className = 'profile-chapter-marker';
        marker.textContent = 'THIS CHAPTER';
        article.append(marker);
      }
      const h = document.createElement('h4');
      h.textContent = heading;
      const p = document.createElement('p');
      p.textContent = copy;
      article.append(h, p);
      entries.append(article);
    }
    profile.append(entries);
    if (id === 'skills') {
      const related = document.createElement('div');
      related.className = 'skill-evidence';
      const heading = document.createElement('h4');
      heading.textContent = 'See these tools in action';
      related.append(heading);
      for (const [label, projectId] of [['AI & Python → Deepfake Forensics', 'deepfake-forensics'], ['React → NexusBoard', 'nexusboard'], ['Security → Malware Detector', 'malware-detector']]) {
        const project = projects.find(item => item.id === projectId);
        const link = document.createElement('a');
        link.textContent = label;
        link.href = project.source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        related.append(link);
      }
      profile.append(related);
    }
  }
  for (const section of [{ id: 'projects', name: 'Projects · 12' }, ...profileSections]) {
    const button = document.createElement('button');
    button.textContent = section.name;
    button.setAttribute('aria-pressed', String(section.id === 'projects'));
    button.addEventListener('click', () => selectSection(section.id));
    sectionButtons.set(section.id, button);
    navigation.append(button);
  }
  projects.forEach((project, i) => {
    const article = document.createElement('article');
    article.className = 'map-project';
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = `${project.name} interface`;
    image.loading = 'lazy';
    const copy = document.createElement('div');
    copy.className = 'map-copy';
    const number = document.createElement('div');
    number.className = 'drive-eyebrow';
    number.textContent = `${String(i + 1).padStart(2, '0')} / ${project.role}`;
    const title = document.createElement('h3');
    title.textContent = project.name;
    const description = document.createElement('p');
    description.textContent = project.description;
    const links = document.createElement('div');
    links.className = 'map-links';
    const drive = document.createElement('button');
    drive.textContent = 'Drive here';
    drive.dataset.drive = project.id;
    drive.disabled = true;
    drive.addEventListener('click', () => {
      const destination = app.world.sections.projects.items[i];
      travel(destination.x, destination.y);
      location.textContent = project.name.toUpperCase();
      showProjectStory(project);
    });
    links.append(drive);
    links.append(storyLink(project, 'Read project story'));
    [['Source', project.source], ['Experience', project.demo]].forEach(([name, href]) => {
      if (!href) return;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    });
    copy.append(number, title, description, links);
    article.append(image, copy);
    list.append(article);
  });

  const exitLinks = document.querySelectorAll('a[href="/"]');
  exitLinks.forEach(link => {
    link.addEventListener('click', e => {
      if (window.parent && window.parent !== window) {
        e.preventDefault();
        window.parent.postMessage({ type: 'exit-world' }, window.location.origin);
      }
    });
  });
}

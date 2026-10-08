import { Howler } from 'howler';
import { projects } from './sakshamProjects.js';
import { profileSections } from './sakshamProfile.js';
import { projectStoryHref, readProjectRequest } from '../../../../src/utils/worldNavigation.js';
import WorldNavigator from './WorldNavigator.js';

export function drivingInterface(app) {
  const start = document.querySelector('#start-drive');
  const boot = document.querySelector('.drive-boot');
  const progress = document.querySelector('#world-progress');
  const status = document.querySelector('#loading-status');
  const index = document.querySelector('.drive-index');
  const opener = document.querySelector('#project-index');
  const sound = document.querySelector('#drive-sound');
  const home = document.querySelector('#drive-home');
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
  cameraToggle.addEventListener('click', () => {
    const expanded = cameraToggle.getAttribute('aria-expanded') !== 'true';
    cameraToggle.setAttribute('aria-expanded', String(expanded));
    cameraToggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} camera controls`);
    cameraToggle.title = `${expanded ? 'Collapse' : 'Expand'} camera controls`;
    cameraBody.hidden = !expanded;
    cameraTools.dataset.collapsed = String(!expanded);
  });
  if (window.matchMedia('(max-width: 760px), (pointer: coarse)').matches) cameraToggle.click();
  const syncCameraTools = () => {
    const view = app.camera.view;
    topTools.hidden = view !== 'top';
    followCar.hidden = view !== 'orbit';
    followCar.disabled = app.camera.following;
    const following = app.camera.following && !app.camera.exploring;
    cameraStatus.dataset.state = view === 'orbit' ? following ? 'follow' : 'explore' : view;
    cameraStatus.textContent = view === 'top' ? 'Map overview' : view === 'first' ? 'Behind the wheel' : following ? 'Auto follow' : 'Exploring';
    const touch = app.config.touch;
    cameraHelp.textContent = view === 'first'
      ? touch ? 'Car-mounted camera · use the driving controls' : 'Car-mounted camera · steer with arrows / WASD'
      : view === 'top'
        ? touch ? 'Drag to pan · pinch to zoom' : 'Drag to pan · scroll to zoom'
        : touch ? 'Drag to explore · pinch to zoom\nDrive to automatically follow your car.' : 'Left drag: pan · Scroll: zoom\nRight drag: rotate · Drive: auto follow';
  };
  app.time.on('cameraControl', syncCameraTools);
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
  let started = false;
  let returnToWorld = false;
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
      const position = app.world.physics.car.chassis.body.position;
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
    progress.value = value;
    status.textContent = `Loading scene assets · ${Math.round(value * 100)}%`;
  });
  app.resources.on('ready', () => {
    start.disabled = false;
    start.textContent = 'Enter the world';
    status.textContent = 'World ready. Your curiosity supplies the direction.';
  });
  app.world.startingScreen.area.on('interact', () => {
    if (started) return;
    started = true;
    boot.hidden = true;
    home.disabled = false;
    app.camera.carBody = app.world.physics.car.chassis.body;
    cameraTools.hidden = false;
    syncCameraTools();
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
  function travel(x, y) {
    const car = app.world.physics.car;
    const body = car.chassis.body;
    body.position.set(x, y - 7, 1.5);
    body.previousPosition.copy(body.position);
    body.interpolatedPosition.copy(body.position);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.force.set(0, 0, 0);
    body.torque.set(0, 0, 0);
    body.quaternion.set(0, 0, 0, 1);
    body.previousQuaternion.copy(body.quaternion);
    body.wakeUp();
    car.oldPosition.copy(body.position);
    app.camera.pan.reset();
    app.camera.target.set(x, y - 7, 0);
    app.camera.focusCar();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      app.camera.targetEased.set(x, y - 7, 0);
    }
    app.world.controls.releaseActions();
    showProjectStory(null);
    returnToWorld = index.open;
    index.close();
    app.$canvas.focus({ preventScroll: true });
  }
  home.addEventListener('click', () => {
    travel(0, 7);
    showProjectStory(null);
    location.textContent = 'THE STARTING LINE';
  });
  sound.addEventListener('click', () => {
    const enabled = app.world.sounds.muted;
    app.world.sounds.muted = !enabled;
    Howler.mute(!enabled);
    sound.textContent = enabled ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(enabled));
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !index.open && window.parent !== window) {
      window.parent.postMessage({ type: 'exit-world' }, window.location.origin);
      return;
    }
    if (event.key.toLowerCase() !== 'm') return;
    sound.textContent = app.world.sounds.muted ? 'Sound off' : 'Sound on';
    sound.setAttribute('aria-pressed', String(!app.world.sounds.muted));
  });
  function openMap(section = 'projects') {
    for (const key of Object.keys(app.world.controls.actions)) app.world.controls.actions[key] = false;
    if (started) app.world.physics.car.brake();
    selectSection(section);
    if (!index.open) index.showModal();
  }
  opener.addEventListener('click', () => openMap());
  window.addEventListener('drive-section', event => {
    if (!profileSections.some(section => section.id === event.detail)) return;
    returnToWorld = true;
    openMap(event.detail);
  });
  document.querySelector('#close-index').addEventListener('click', () => index.close());
  index.addEventListener('close', () => {
    if (started) app.world.physics.car.unbrake();
    (returnToWorld ? app.$canvas : opener).focus({ preventScroll: true });
    returnToWorld = false;
  });
  const list = document.querySelector('#project-list');
  const navigation = document.querySelector('#world-navigation');
  const profile = document.querySelector('#profile-content');
  const sectionButtons = new Map();
  function selectSection(id) {
    const landmarks = app.world.sections?.profile?.landmarks;
    if (id === 'education') landmarks?.loadCampus();
    if (id === 'about') landmarks?.loadAvatar();
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
      travel(section.x, section.y);
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
    for (const [heading, copy] of section.entries) {
      const article = document.createElement('article');
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

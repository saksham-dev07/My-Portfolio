# Portfolio design plan — the connected studio

Prepared 6 October 2026, before this implementation pass.

## Direction

Make Saksham's portfolio feel like visiting a working digital studio: meet the builder, explore his desk and ideas, choose a project, and examine how it was built. The identity remains warm charcoal, lime, violet, expressive type, and original imagery. The original workstation stays the default hero experience; the portrait and stylized 3D bust remain discoverable beside it.

The new emphasis is **composition, orientation, and continuity**. The site already has numerous effects. The next changes should make those effects and the engineering work feel connected, with clearer ways to explore.

## Reference findings

These are observations from the creators' live sites and the supplied directory, rather than a ranking of every portfolio on the internet. Home, relevant section navigation, and representative project layouts were inspected. Every animation, device, or route was not audited.

| Source | What was inspected and learned | Decision for Saksham |
| --- | --- | --- |
| [Emma Bostian's developer-portfolios directory](https://github.com/emmabostian/developer-portfolios) | The alphabetic directory is a discovery resource with many different approaches. Adham Dannaway and Alexis De Jesus were selected from its links and inspected directly. | Use a deliberate shortlist to test different principles, rather than combine unrelated styles from a huge list. |
| [Redoyanul Haque](https://www.redoyanulhaque.me/) | A purple-lit 3D character dominates the introduction and persists into the About composition. Work is presented as numbered columns with actual project images and tool descriptions. The loader initially delayed access, then the scene and content loaded. About and Work navigation were exercised. | Tie the hero's desk, signal, and person to explanatory copy. Use project numbers and visual selection to orient visitors. Preserve readable HTML immediately while the optional model loads. |
| [Majd](https://majd-portfolio.framer.website/) | Oversized black typography on a warm textured background, a restrained floating header, a centered personal portrait, spacious service rows, and large paired project covers. Hero, biography, services, and featured work were inspected visually. | Keep strong typographic contrast and give real project images space. Make the menu a considered composition. Carry the same visual grammar from introduction to work. The reference's business services and testimonials are not evidence about Saksham. |
| [Adham Dannaway](https://www.adhamdannaway.com/) | A split portrait gives the designer/coder identity an immediately understandable visual metaphor, accompanied by direct work links. The live browser loaded successfully after the text fetch timed out. | Let Saksham's own scenes explain different sides of one person. Use his existing assets and story rather than reproduce the split-face image. |
| [Alexis De Jesus](https://www.aalexis.fr/) and [professional view](https://www.aalexis.fr/professional) | A student/professional entry choice, concise identity, a quiet grid, timeline, project evidence, and compact navigation. The professional route was opened and inspected. | Support different visitor intents through the optional index, while keeping one complete portfolio and direct links. Visitors should be able to reach work or the résumé immediately. |

The previous research remains in [design-references.md](design-references.md): friends' portfolios, Maxime Heckel, Olivier Larose, Rauno Freiberg, and other complementary approaches. This pass builds on those decisions.

## Current state and opportunity

Already present: original interactive 3D desk, portrait and downloadable stylized bust, signal sculpture, project filters, large sticky project chapters, project dialogs, a searchable archive, a drawing/pipeline playground, theme transitions, word reveals, global motion control, and reduced-motion support.

Three opportunities remain:

1. The desktop navigation is a small text row; the mobile menu is a separate text-only experience. Both can become a memorable, useful introduction to the studio.
2. Large project chapters reward close reading, but visitors cannot first scan all four projects visually and jump directly to one.
3. The hero's left-side note remains about the desk even after choosing the signal or the person. Scene selection can tell a coherent story on both sides of the composition.

## Composition and interaction specification

### 1. Illustrated studio index

Add an **Index** control to the header on desktop and mobile. Keep the existing direct desktop navigation and contact link. Opening the control reveals one full-screen composition:

- A small identity/header line and an explicit close button.
- Five large numbered chapter links: Work, Play, Approach, About, Contact. Each gets a short description that explains what is there.
- A preview area on wide screens. Hovering or focusing a chapter changes its visual: a real project cover for Work, an original vector sketch for Play, an original system diagram for Approach, Saksham's portrait for About, and a typographic invitation for Contact.
- Résumé and GitHub quick links along the bottom.
- On narrow or short screens, the chapter list stays primary and the preview collapses. All links and the close button remain reachable by normal scrolling.

Use a native modal dialog: background content is inert, Escape closes it, focus stays within the dialog, and dismissal returns focus to Index. Choosing a chapter closes the dialog, unlocks page scrolling, then moves to and focuses that section. Link destinations stay real hash links. Modified clicks retain browser link behavior.

Motion: a 420 ms upward curtain reveal, with chapter rows staggered by 35 ms; preview changes use a bounded 280 ms image/opacity entrance. Close takes 180 ms. Escape can interrupt opening or closing. Motion-off/reduced-motion makes the interaction immediate, including an active closing transition. No pointer trail, background video, or additional WebGL scene is needed in the menu.

### 2. Visual project chapter selector

Between the filters and the large project chapters, add a contact sheet of the currently selected work. Each item combines an actual screenshot, a chapter number, a concise title, and its discipline.

- Four columns for four featured projects on wide screens; two columns on small screens. Filtered sets naturally show only their corresponding projects.
- A short instruction: **Choose a chapter.**
- Each thumbnail links to its own large project article. It navigates within the portfolio, with direct Source, Demo, and Inside the build actions retained in the destination.
- Chapter targets have stable IDs, a focus destination, and a scroll offset below the sticky header.
- Hover/focus slightly lifts a thumbnail and reveals an arrow. Touch users see the arrow without needing hover. The selected hash may mark a chapter; this is selection feedback, not a claim to track reading progress.

Motion stays local: 200–280 ms feedback and the browser's normal scroll behavior. Global motion-off and the operating-system preference remove the movement. No forced horizontal scrolling or scroll capture.

### 3. Connected hero storytelling

Give the three existing scene controls numbers and clearer visual selection. Keep their labels: The desk, The signal, The human.

Update the left-side annotation and art caption with the selected scene:

| Scene | Annotation | Role in the story |
| --- | --- | --- |
| 01 / The desk | Where ideas become real. An open editor, a question, a reason to build. | Retains the original workstation as the starting point. |
| 02 / The signal | Finding the pattern. Models are useful when people can understand their decisions. | Connects the visual experiment to applied AI and explainability. |
| 03 / The human | The person behind the code. Curiosity connects everything I build. | Introduces the existing portrait and optional bust. |

Use a single small heading/caption transition when the scene changes; do not add another continuous animation. Maintain the existing model controls, fallback, and lazy loading. On mobile, show a concise scene note near the art instead of losing this story when the desktop annotation is hidden.

## Implementation order

| Phase | Files / work | Completion evidence |
| --- | --- | --- |
| A — Research and plan | This document; extend the reference notes. | Requested references inspected, principles and behavior written before runtime edits. |
| B — Studio navigation | New `StudioIndex.jsx` and `studio-index.css`; connect through `Navbar.jsx`. | Desktop/mobile opening, preview switching, chapter navigation, Escape, focus restoration, and close interruption work. |
| C — Project orientation | New `ProjectIndex.jsx`; connect through `Projects.jsx`; add scoped styles. | All/AI/Full-stack/Backend selectors show the correct items; chapter links reach and focus the matching article. |
| D — Hero continuity | Update `Hero.jsx`; scoped styles. | Desk remains default; all three views retain their features and change the narrative consistently. |
| E — Verification | Formatting/check, production build, production browser inspection. | Narrow/wide layouts, both themes, keyboard/touch semantics, motion settings, existing models and dialogs checked; screenshot evidence saved. |

All three runtime changes are in this pass. Ideas requiring new content or a different project identity are outside this plan.

## Quality gates

- No horizontal page overflow at 320 px; the index also works on a short viewport and allows internal scrolling.
- No focus escape into the page while the index is open. Close returns focus to the opener; chapter selection focuses its destination instead.
- Rapid preview selection and Escape preserve the latest intent. No invisible open dialog or locked body after dismissal.
- Direct project links, résumé, contact form, filters, original workstation, portrait, and bust remain functional.
- Both themes keep legible labels and previews. Every icon-only action has a name; raw emoji are excluded.
- Reduced-motion and the user's motion toggle settle active effects and retain visible content. Focus feedback remains.
- Reuse existing WebP images, Lucide icons, native dialogs, CSS, and the existing Web Animations helpers. No new dependency, full-resolution portrait download in the initial menu, or second model preload.
- Run `bun run check`, `bun run build`, and `git diff --check`. Inspect the built app and record console errors. This interaction pass does not require changes to the contact API.
- Keep profile claims grounded in the verified portfolio data. Do not invent experience, client testimonials, deployment metrics, or project results.

Technical references: [MDN native dialogs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [scrollIntoView and scroll margins](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView), and the existing [Web Animations API implementation](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate).

## Follow-up direction — supplied model, blue palette, further references

After phases B–D were implemented, Saksham supplied a textured GLB and requested a color other than green. Use the supplied model in the existing Human viewer, fit its bounds to the camera, and keep orbit, reset, wireframe, download, lazy loading, fallback, and motion preferences. Optimize a separate web copy; preserve the source. Replace the main accent with periwinkle blue, light-theme indigo, and supporting violet/copper. Apply this to typography, controls, visual experiments, scene lights, favicon, and social preview. Retain the supplied texture's appearance.

Three additional references were then inspected in the browser:

| Reference | Observed idea | Decision |
| --- | --- | --- |
| [Aaftab Vijapura](https://aaftab.is-a.dev/) | Numbered right-side section rail; selecting Selected work scrolls to that section and marks it. Strong typographic hierarchy and small current-focus/time annotations. | Add a compact desktop chapter compass using our own six destinations and the existing section observer. |
| [Yash Ahire](https://yashahire.info/) | Accent picker changes the page treatment; the dog responds to a pet action; About includes expandable inline context. Real project screenshots and featured work anchor the personality. | Keep the blue identity coherent and preserve our working playground, 3D portrait, theme control, and build-story dialogs. No testimonial or professional claim is borrowed. |
| [Abinash Sharma](https://abinash-sharma.pages.dev/) | Live 3D robot hero, particle background, circular technology groups, and a world/time-zone section. Skills navigation was exercised; the page uses clear visual groups. | Preserve our supplied portrait and desk as personal focal points and keep existing expandable toolkit groups. A second globe/model is unnecessary for this pass. |

This was a focused review of the landing pages and selected interactions, not an exhaustive test of every page or animation. External widgets on the last reference showed incomplete data in the research browser; keep this portfolio's primary content local and reliable.

### Chapter compass plan, before implementation

Display only at widths of at least 1400 px and heights of at least 600 px, where the page gutters can accommodate a 44 px rail. Use ordinary links for Home, Work, Play, Approach, About, and Contact. A quiet dot marks each destination; the current section has an accented ring. Hover or keyboard focus reveals a short numbered label. Reuse the header's existing observer for selection. Hide on smaller screens, where the Index control remains available. Keep native scrolling and link behavior, do not capture the wheel, and suppress decorative movement when motion is off or reduced.

Verify active section updates after navigation, keyboard focus labels, no overlap with the 1240 px content shell at 1440 px, absence at 320 px, and dismissal of the existing index with no stranded focus or body scroll lock. Recheck the new model in production, both themes, wireframe/reset/rotation, and the direct filtered project link.

## Verification record

Completed against the development server and the built production preview on 6 October 2026:

- `bun run check`: 60 files, passes. `bun run build`: passes. `git diff --check`: passes. The existing 934 KB shared Three.js chunk still produces Vite's size warning; portrait and workstation code remain split, and the supplied model loads only in Human mode.
- At 1440 × 960, the illustrated menu shows all five chapters and its footer. Pointer/keyboard previews work for project, play, approach, and portrait content. Both blue/ink and indigo/paper themes remain legible. Tab and Shift+Tab wrap inside; Escape restores the Index opener and body scrolling. Choosing Work focuses its heading.
- At 320 × 800, the page has no horizontal overflow. The model and toolbar fit the content width. The compass is hidden and the Index retains the chapter list. The menu's Close action remains visible and the preview is removed. At 320 × 360 the menu scrolls internally and the close header stays reachable.
- Motion-off and a changed operating-system reduced-motion preference settle active menu effects. The model's automatic rotation becomes unavailable under reduced motion; its manual controls remain available. Restoring the preference returns the normal controls.
- The contact sheet shows 4/2/2/2 chapters for All/AI/Full-stack/Backend. Chapter links reach their article. A production test caught native fragment lookup happening before React rendered a direct chapter target; the initial chapter now explicitly receives focus and scrolls below the header. `#build-lastmile` renders the backend set and lands on its article.
- The supplied model renders with its embedded textures and a front-facing camera. Wireframe, arrow-key orbit, reset, optional rotation/pause, and the new GLB download were checked. The original desk remains available and the default scene.
- The compass sits beyond the 1240 px shell at 1440 px. Navigating to Play updates its current-section marker. Production browser console checks returned no errors or warnings.

Screenshot evidence is saved for the blue portrait hero, the illustrated menu, and the light menu. No contact message, deployment, commit, or push was performed.

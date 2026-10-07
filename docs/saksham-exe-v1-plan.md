# SAKSHAM.exe — V1 implementation plan

The professional portfolio remains the default route and primary experience. V1 adds an optional second layer, entered through its footer. No future phase is included in this pass.

## Architecture and boundaries

- Add a small location-aware root and an ordinary `/exe` footer link. Normal navigation retains modified-click/new-tab behavior. Save the return URL and scroll position only for a normal in-page entrance; exit and browser Back restore that position.
- Dynamically import the experience at `/exe`; import its R3F world only after the initialization interface has rendered. Reuse installed React, Three, R3F, Drei, and Lucide. No additional library, avatar, HDRI, audio, external texture, or physics engine is needed for V1.
- Draw an original procedural neural core and three floating portals: Projects, Skills, About. Use modest geometry and connection counts; quality selection controls DPR and geometry density. Do not implement AI/Memory/Lab worlds, avatar dialogue, terminal, achievements, classified content, multiplayer, or advanced shaders.
- Use existing verified project metadata and profile facts. The portals open holographic context panels, with a brief camera approach and a Return to hub action. Project sources and live links retain their real availability; no deployment claim is inferred.

## Initialization and controls

Show initialization before preparing the renderer. Track real milestones: world module loaded, portfolio data linked, renderer created, first scene frame rendered. Display completed stages rather than fabricated transfer percentages or timers. When ready, require an explicit Enter. Returning visitors can Continue their last area or Start from hub.

Automatically choose Performance for narrow/coarse or lower-resource devices, otherwise Balanced. Allow Performance/Balanced/Cinematic and remember the choice. The three modes are bounded; cinematic does not introduce V4 features.

Use OrbitControls for drag rotation, scroll/pinch zoom, and touch. All three portals also have normal HTML buttons so keyboard and assistive-technology users can select an area. Focus its panel heading after travel. Arrow keys can orbit the focused scene; Home resets. Escape opens a native modal menu with focus containment. Keep an Exit control visible during initialization, exploration, and failure.

Honor both operating-system reduced motion and the site's motion preference. Replace camera flights with an immediate view change and a short content fade when allowed; disable idle motion in hidden tabs. V1 has no audio. If WebGL fails, preserve the same three content areas and exit in an accessible explorer with a static visual fallback.

## Lightweight persistence

Store only V1 exploration: started, visited portals, last area, and quality in localStorage. Validate reads and tolerate disabled storage. The footer changes to Continue experience and reports portals explored after a visit. Do not create a login or record future-phase achievements/secrets.

## Implementation order and verification

1. Add route/persistence helpers and footer entry; verify the normal portfolio still opens and `/exe` is separate.
2. Add initialization and the procedural hub/portals; verify real readiness, quality modes, camera approaches, content, and a persistent exit.
3. Verify mobile drag/pinch semantics, keyboard/menu focus, reduced motion, storage fallback, and return position. Test direct `/exe`, footer entry, exit, and browser Back.
4. Run Bun code checks, relevant tests, production build, and diff checks. Inspect production resource requests to confirm `/exe` modules do not load on the normal route. Save screenshots of the entry and hub.

Stop once V1 works. Future phases remain explicit follow-up work.

## V1 verification

- Production browser requests contained no SakshamExe or ExeWorld bundles before the footer entrance.
- Initialization reached SYSTEM READY after the real first scene frame, then required Enter. The procedural neural hub and all three content portals rendered successfully.
- Checked 1440 × 960 desktop and 320 × 800 mobile compositions, technology-related projects, source/live links, profile content, menu focus wrapping, Performance switching, reduced-motion disabling, returning Continue, and footer focus/scroll restoration on exit. Browser Back returns to the normal route.
- Bun code checks and production build passed. All seven existing contact tests passed (33 assertions). No dependencies were installed.
- Touch drag/pinch use the installed OrbitControls; physical touch hardware and low-end-device frame rates were not measured. Future phases require separate authorization and performance testing.

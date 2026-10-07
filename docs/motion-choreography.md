# Motion choreography upgrade

Reference: the supplied 43.3-second recording of Abhyuday's portfolio. Its strongest patterns are the moving hero typography, layered project stack, continuous orange navigation thread, and spatial transitions into the homelab and globe journey. These patterns give a clear sequence rather than a collection of independent reveals.

## Applied to Saksham's existing design

- Masked, staggered letter entrances keep the full accessible hero name. Hovering surname letters picks out the studio accent.
- Existing heading masks now unfold with more deliberate stagger, restrained rotation, and vertical settling.
- A scroll-drawn SVG signal thread follows the major chapters in the desktop gutter. Its geometry is cached by page dimensions. The existing scroll RAF updates it without React state updates or an idle animation loop.
- Desk / signal / human switches reuse the native snapshot transition coordinator, with a short retreat and clipped arrival; captions follow the scene. Rapid selection replaces pending transitions. Unsupported browsers retain the existing scene entrance.
- Existing stacked projects, chapter menu, theme transition, keyboard controls, and optional driving world remain intact.

No dependencies or models were added. The thread is hidden below 1200px. System reduced motion and the persistent motion-off control suppress decorative changes; scene selection still works immediately. Original text remains readable and routes unchanged.

Validation: desktop and narrow-screen overflow checks, native scene transition activation, motion-off behavior, full build, Biome, and existing 17 tests. The supplied recording was viewed through a temporary local preview; the temporary copy was discarded by the clean production build.

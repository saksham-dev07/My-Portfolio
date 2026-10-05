# Portfolio design references

Reviewed on 5 October 2026. These references informed the design direction; they are a varied selection of strong approaches, not a universal ranking. The aim is a memorable portfolio that expresses Saksham's own work and personality.

## The supplied references

- [Abhyuday Tomar's portfolio](https://abhyudaytomar.com/) was inspected visually in the browser. Its portrait-led introduction, expressive hero typography, and playful discoveries show how a personal identity can anchor an interactive site. Saksham's introduction now gives his name more visual weight and makes his original 3D workstation the central experience.
- [Xkaper's portfolio](https://xkaper.dev/) was inspected visually in the browser. Its image gallery and navigation encourage exploration through visual work. Saksham's featured projects use larger editorial presentation and detailed project dialogs. Text-only crawling did not reliably represent the current visual versions of these two sites, so the browser inspection informed these observations.

## Wider research

| Reference | Useful idea | How it informed this portfolio |
| --- | --- | --- |
| [Bruno Simon's portfolio](https://bruno-simon.com/) | A coherent interactive 3D world with explicit controls, quality settings, and reset/respawn actions. | Restore the original workstation as a signature experience, with camera presets and reset. Keep project and resume links accessible without requiring visitors to explore the scene. |
| [Maxime Heckel's portfolio](https://maximeheckel.com/) | Shader-led visual identity and experiments that combine physics with familiar interactions such as moving and resizing windows. | Keep the playground connected to engineering craft. The 3D scene and experiments support the identity rather than competing as unrelated decorations. |
| [Olivier Larose's portfolio](https://www.olivierlarose.com/) and [sticky-card study](https://blog.olivierlarose.com/tutorials/cards-parallax) | Clear project context, substantial imagery, and sticky cards whose scale responds to scrolling. | Present featured work as editorial chapters, with restrained desktop stacking and ordinary stacked content on smaller screens. |
| [Dennis Snellenberg's portfolio](https://dennissnellenberg.com/), studied through [Olivier's implementation walkthrough](https://blog.olivierlarose.com/tutorials/awwwards-landing-page) | Coordinated entrances, expressive navigation, project previews, and tactile interactions. | Use staged hero entrances, section reveals, bounded magnetic buttons, and a moving ticker as one consistent motion language. The original site blocked text fetching; the walkthrough is the source for these implementation patterns. |
| [Henry Heffernan's portfolio](https://henryheffernan.com/) and [the author's source repository](https://github.com/henryjeff/portfolio-website) | A 3D environment paired with a functional 2D operating-system experience. | Give the workstation meaningful viewpoints and discoverable actions. Keep readable HTML content and direct navigation alongside the scene. The source establishes the 3D/2D split; this is not a claim that every live interaction was tested. |
| [Jesse Zhou's Ramen Shop](https://www.jesse-zhou.com/) and [the author's source repository](https://github.com/enderh3art/Ramen-Shop) | A distinctive personal setting provides a memorable theme. | Build around Saksham's existing workspace model instead of adopting another person's setting or assets. The JavaScript-rendered scene was not fully inspectable through text browsing. |
| [Brittany Chiang's portfolio](https://brittanychiang.com/) | Clear identity, credible project descriptions, resume access, an archive, and accessible navigation. | Preserve readable project evidence and straightforward contact paths beneath the more expressive presentation. |

## Motion decisions and tradeoffs

- **One focal experience:** the original 3D desk provides continuity with the previous website and a recognizable personal signature. Presets and reset make its interaction discoverable; camera travel stays bounded.
- **Work gets space:** large project chapters and dialogs let screenshots and engineering decisions carry the story. Sticky presentation is reserved for layouts with enough room; mobile visitors retain a natural document flow.
- **Motion has hierarchy:** staged typography introduces the person, reveals introduce sections, and smaller hover effects acknowledge actions. [Magnetic-button examples](https://blog.olivierlarose.com/tutorials/magnetic-button) informed the tactile treatment. Applying the same strength everywhere would weaken that hierarchy.
- **Visitors control animation:** reduced-motion preferences and a global motion toggle provide a quieter presentation. Decorative motion should never be required to read the portfolio, navigate it, or open project information.

The adaptations use original code and the portfolio's existing assets. The references informed interaction principles and presentation, not a reproduction of their designs.

## Further research: spatial transitions and precise interactions

A second research pass used portfolio and award searches to discover more approaches, followed by inspection of the creators' own sites. These observations supplement the earlier selection; they are not a claim to have reviewed every portfolio on the internet.

| Reference | Observed strength | Adaptation |
| --- | --- | --- |
| [Aristide Benoist](https://aristidebenoist.com/) | The live introduction presents work as a sequence of narrow photographic panels, with restrained navigation and numerical position cues. His [folio archive](https://aristidebenoist.com/folio-v1) also provides project context. The landing page and its project structure were inspected; every case-study transition was not tested. | Give project imagery a stronger spatial role: previews gently respond to the pointer, while incoming chapters push earlier cards into the background. Keep ordinary vertical scrolling and direct project links. |
| [Rauno Freiberg's Craft](https://rauno.me/craft), [Designing Depth](https://rauno.me/craft/depth), and [Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) | The live craft gallery collects focused interaction experiments. The essays explain layered composition, staggered timing, spatial consistency, and interruptibility. | Build stories expand from their source project, then recede when dismissed. Headings reveal in a short stagger. Rapid filter changes interrupt the previous visual transition, and keyboard focus brings a stacked card to the foreground. |
| [Seán Halpin](https://www.seanhalpin.xyz/) | The live introduction combines an expressive typographic identity, a cohesive color atmosphere, large visual projects, and a separate Play section. | Preserve Saksham's own lime-and-violet studio identity and original workstation. Let the theme change spread from its control, and make the project archive visual without adding another required navigation mode. |
| [Valentin Gassend](https://valentingassend.com/en/) | The creator describes WebGL and interactive narrative work, and groups project context, technology labels, and a Lab alongside the portfolio. Page content and navigation were inspected. The animated scene remained blank in the research browser, so its live motion is not treated as verified evidence. | Keep experiments connected to engineering projects and keep HTML project context available alongside the 3D scene. |

### Implemented in this pass

- **Scroll depth:** desktop project chapters shrink by at most 6.5% and dim as the next card arrives. Image drift is bounded to 18 pixels. Mobile retains normal stacked cards; keyboard focus removes the dimming and brings the focused card forward.
- **Image previews:** archive rows reveal the project's actual image beside the pointer. Keyboard focus also reveals the preview, Escape dismisses it, and preview placement is clamped to the viewport. Touch layouts keep the direct list navigation.
- **Spatial project stories:** a short opening animation originates from the selected project's image. Dismissal animates for 200 milliseconds, preserves the native dialog behavior, and restores focus to the opener. An opening animation can be interrupted immediately.
- **Word reveals:** section headings use a brief stagger of masked words while retaining their original heading text and semantics. The text stays visible with motion disabled.
- **Theme and filter transitions:** the palette changes immediately while a subtle color ripple spreads from the toggle. This avoids delaying theme changes to capture the live WebGL page. Project filters use native snapshots to bridge old and new layouts. Unsupported browsers and background pages update normally. An overlapping action settles the previous transition, preserves pending state updates, and applies the latest choice immediately.

The implementation follows the browser's [same-document View Transitions documentation](https://developer.chrome.com/docs/web-platform/view-transitions/same-document) and [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate). It adds no animation dependency. All new effects honor the global motion control and operating-system reduced-motion preference; turning motion off also settles active transitions.

## Research and plan before the next implementation

On 6 October 2026, the supplied [developer-portfolios directory](https://github.com/emmabostian/developer-portfolios), [Redoyanul Haque](https://www.redoyanulhaque.me/), and [Majd](https://majd-portfolio.framer.website/) were reviewed. Two contrasting entries from the directory, [Adham Dannaway](https://www.adhamdannaway.com/) and [Alexis De Jesus](https://www.aalexis.fr/), were inspected in the browser as well.

The observations, their limits, and a concrete plan were saved in [portfolio-design-plan.md](portfolio-design-plan.md) before editing the site. That plan guided the illustrated studio index, the visual project chapter selector, and hero copy that follows the selected scene. It specifies responsive behavior, keyboard navigation, reduced motion, timing, and acceptance checks for each interaction.

The later supplied [Aaftab](https://aaftab.is-a.dev/), [Yash](https://yashahire.info/), and [Abinash](https://abinash-sharma.pages.dev/) references were also inspected live. Aaftab's section rail informed a desktop chapter compass; Yash's palette control and small character response reinforced visitor-controlled interaction; Abinash's 3D hero and grouped toolkit reinforced the existing personal model and visual skill groups. The plan contains the exact observations, limits, and decisions. The user subsequently selected a supplied portrait GLB and a blue palette; that direction supersedes the earlier lime palette notes above.

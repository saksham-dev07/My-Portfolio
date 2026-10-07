# Animation components review

Reviewed the private Drive collection's 14 category directories and source examples from Text Animations/1, Hover Effects/1, Page Transitions/1, Mouse Effects/1 and SVG Animations/5. This is a selective source review, not a review of every archive.

The purchased collection permits website use and modification, but prohibits source redistribution. Archives remain in a private temporary directory outside the repository. No pack source or assets were copied into the site.

## Selected ideas

- SVG Animations/5 demonstrates scroll-driven SVG path morphing. The existing chapter divider now carries three signal lines that bend with scroll, connecting the studio introduction to engineered work. Uses the existing scroll RAF; no second animation loop or GSAP dependency.
- Hover Effects/1 demonstrates bounded, cursor-responsive surfaces. Project previews now have a restrained pointer-positioned light wash using CSS variables. No layout changes, continuous render loop or touch interaction interception.
- SVG connection animation informs a small architecture interaction: incoming connections brighten and trace once when their destination stage is selected. Existing project source data and readable explanations remain authoritative.

## Omitted

The sampled text treatment uses scrambling, FLIP and an additional smooth-scroll system. The site already has accessible heading reveals and Lenis; duplicating these would add weight and competing behavior. The full-screen shader cursor example preloads textures and renders continuously; it adds little to the existing readable previews. The sampled full-page transition does not justify replacing the site's existing native view transitions or EXE boot flow.

## Validation

- `bun run check` and `bun run build` pass.
- Desktop blueprint stage switching updates highlighted connections and explanations.
- Pointer movement updates preview lighting coordinates without React state updates.
- Mobile-width check has no horizontal overflow; divider uses a shorter composition.
- Both the site's motion pause control and OS reduced-motion preference stop connection animation and flatten the divider. Pointer lighting is disabled in these modes.
- No browser errors in the checked flow; no new dependencies or model downloads.

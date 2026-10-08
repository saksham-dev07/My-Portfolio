# Low-bandwidth optimization

Implemented 8 October 2026. The professional portfolio retains its design, typography, animation controls and project content. Optional interactive modules remain available.

## Findings and measured results

| Bottleneck | Change | Evidence |
| --- | --- | --- |
| Default workstation GLB: 7,625,780 bytes, plus Three.js | Poster rendered from the existing model on detected constrained connections; explicit full-3D button | No GLB or Three.js control chunk requested during cold constrained-load checks |
| Full 235 KB portrait used for a 34 px avatar | Responsive 64/128 px candidates | Desktop selected 2,300-byte AVIF |
| Project screenshots shared one resolution | AVIF/WebP width candidates and accurate `sizes` | Desktop selected 320 px contact-sheet and 960 px project candidates |
| External Google Fonts stylesheet and font connection | Local Latin variable WOFF2, preload and `font-display: swap` | 48,256-byte font; browser confirmed Inter loaded |
| Playground code in initial JS | Deferred import near viewport or on explicit request | Main entry gzip approximately 86.2 KB before, 74.3 KB after; playground absent from initial requests |
| Unversioned main models | Move to Vite source assets with content-hashed URLs | Immutable caching now applies to models as well as images, fonts and JS |

A cold desktop preview at **32,000 bytes/sec (256 Kbit/sec), 700 ms latency**, with browser cache disabled, loaded **242,627 bytes of encoded resource bodies** before scrolling. This includes scripts, CSS, the local font, poster, avatar and favicon; excludes document bytes and HTTP headers. No far-offscreen portraits, world assets or playground code were requested. Chrome reported effective connection type `3g` at this throughput; this is a transport-throttled test, not a field Core Web Vitals result. A separate 1 Mbit/sec, 400 ms latency test also exercised the constrained path.

Mobile was checked at 390 x 844 with DPR 2: no horizontal overflow, poster available, and density-aware image selection. The deferred canvas mounted after navigation and its sample-sketch interaction still worked. Full workstation 3D loading was verified after opting in.

## Responsive images and compression

`scripts/assets/optimize-images.mjs` generates candidates for portraits, the desk poster, project screenshots and certificate documents. Originals remain canonical and are retained as full-resolution WebP fallbacks. No upscaling or geometry reduction was introduced. AVIF uses quality 85 with 4:4:4 chroma; WebP derivatives use quality 92. An image family uses AVIF only when its full-resolution encoding beats the original WebP in bytes. Some existing WebP screenshots compress better than AVIF and deliberately stay WebP.

Compression is lossy; settings aim to preserve appearance rather than claim mathematical losslessness. Large readable certificate dialogs can still select full-size assets. Browser density selection preserves sharpness on high-DPR displays.

Use the shared component rather than adding another raw image:

```jsx
import ResponsiveImage from "./ResponsiveImage";
import preview from "../assets/projects/deepfake.webp";

<ResponsiveImage
  src={preview}
  alt="Deepfake forensics interface"
  sizes="(max-width: 650px) 90vw, (max-width: 1100px) 50vw, 650px"
/>
```

The component emits `<picture>` with an AVIF source when useful, plus WebP `srcSet`, intrinsic dimensions and async decoding. Its IntersectionObserver supplies the sources only within 600 px of a constrained viewport or 900 px otherwise. Eager hero/dialog images bypass the observer. This prevents distant images from competing with the current chapter; it also reserves dimensions to reduce layout shifts.

SVGO performs multipass minification of source SVGs, including certificate verification QR SVGs. Preserve accessible text and verify QR scanning if replacing the originals. Source width/height and viewBox behavior remain intact.

Regenerate derivatives after replacing source artwork:

```sh
bun run assets:optimize
bun run check
bun test
bun run build
bun run audit:production
```

Only generated image candidates are removed/replaced by this command. Encoders run during asset preparation, not every Vercel build. Generated candidates are committed with their manifest so CI does not need to re-encode them.

## Intelligent imports

All three hero experiences use lazy imports. `DeferredPlayground` imports its interactive component near the viewport; the existing optional world and lab route boundaries remain lazy.

```jsx
const WorkstationStage = lazy(() => import("./interactive/WorkstationStage"));
const BuildPlayground = lazy(() => import("./BuildPlayground"));
```

The network helper recognizes Save-Data, effective `slow-2g`/`2g`/`3g`, downlink below 1.5 Mbit/sec or RTT at least 300 ms. Under those hints the hero shows a same-model poster with an explicit full-3D action. It never fetches the GLB merely to show the poster. Browsers without Network Information API retain the usual 3D default; this API is not universally available. No lower-resolution models or texture replacements were introduced. Explicitly opening 3D still incurs the original large download on a slow link.

## Font subset

Inter's official Latin variable WOFF2 subset is self-hosted with its OFL license in `src/assets/fonts/`. Existing font weight and appearance are preserved; non-Latin user content falls back to the configured system fonts.

```css
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("../assets/fonts/inter-latin.woff2") format("woff2");
}
```

The actual rule also specifies the subset's Unicode range. In `index.html`:

```html
<link rel="preload" href="/src/assets/fonts/inter-latin.woff2"
      as="font" type="font/woff2" crossorigin />
```

Vite rewrites the preload and CSS to the same hashed URL, preventing duplicate font downloads.

## Build and cache configuration

Small responsive candidates stay separate files so merely importing the manifest does not download embedded image bodies:

```js
// vite.config.js, inside build
assetsInlineLimit: 0
```

The main workstation and portrait now live under `src/assets/models/`; viewer URLs use `new URL(..., import.meta.url)` so production files are hashed. Existing world models remain unversioned and revalidate. Do not mark those unversioned files immutable.

```json
{
  "source": "/assets/(.*)",
  "headers": [{
    "key": "Cache-Control",
    "value": "public, max-age=31536000, immutable"
  }]
}
```

This rule is already in `vercel.json`, along with immutable world bundles and revalidation for HTML/unversioned model directories. Vercel supplies transport compression; precompressed `.gz`/`.br` duplicates are unnecessary. A service worker that precaches the entire world would defeat this optimization and was not added.

The deployed folder is **50.70 MiB / 390 files** after responsive derivatives. Total storage increases because multiple sizes are shipped; each visitor downloads only selected candidates. The large optional driving-world campus model (10.63 MiB) remains the largest asset. Further world mesh/texture compression needs separate visual validation.

## References and verification limits

- [Responsive images](https://web.dev/learn/design/responsive-images)
- [Network Save-Data availability](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData)
- [Vercel cache-control headers](https://vercel.com/docs/caching/cache-control-headers)
- [Vercel transport compression](https://vercel.com/docs/how-vercel-cdn-works/compression)

Local checks: Biome passed; 18 tests passed (9,400 assertions); combined portfolio/world build and production output audit passed. Existing large optional Three.js chunks still produce size advisories. Live CDN headers, real-device image fidelity and field LCP/INP must be measured after deployment; local preview cannot certify those metrics.

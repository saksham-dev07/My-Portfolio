# Security hardening

Reviewed 14 October 2026. Scope: this portfolio, its embedded driving world and `api/send.js`. Linked external project applications are separate systems.

## Contact endpoint and shared abuse protection

The endpoint accepts JSON containing only `name`, `reply_to`, `title`, `message` and the optional `website` honeypot. Parsed payloads are limited to 16 KiB even without Content-Length. Types, lengths, email shape and single-line header fields are checked before sending a plain-text message. Production browser origins are restricted to the canonical domain, the public Vercel alias and the current deployment URL. Origin checks do not authenticate clients or stop bots that omit or spoof Origin.

Vercel's published `contact-submissions` firewall rule matches Request Path Equals `/api/send` AND Method Equals `POST`: Fixed Window, 60 seconds, 5 requests, IP Address key, Too Many Requests (429). This shared edge rule applies across function instances and was tested on production with six empty requests: five HTTP 400 responses, then HTTP 429 with `x-vercel-mitigated: deny`. No email was sent. It is project dashboard state, not encoded in vercel.json; recreate it if migrating projects. It is a per-client safeguard, not a global email quota or complete defense against distributed bots. Vercel's system DDoS mitigations remain enabled. Blanket bot challenges were not enabled because they would affect public portfolio traffic.

The handler's bounded, expiring memory map is additional protection only. Local development uses socket identity rather than trusting client-supplied forwarding headers. The development middleware caps raw streaming bytes before JSON parsing. Production's platform parser runs before the handler; the 16 KiB parsed envelope is not a custom pre-parser network limit. Vercel's function payload cap and the edge limiter bound that separate layer.

Application logs contain only outcome, status and a generated request ID. They exclude name, email, IP, message, API keys and provider exception details. Vercel/Resend may retain their own operational metadata. Inquiries stay in the owner's inbox until manually deleted, as described at `/privacy`. This notice does not certify legal compliance or control provider backups.

## Browser policy

The global enforced CSP blocks arbitrary inline JavaScript, JavaScript eval, external scripts, objects, external frames and external connections. Exact hashes cover the current inline startup script and structured data. Same-origin scripts/frames, local WASM, blob workers and blob texture fetches support Three.js, Draco and the embedded world. Inline styles remain permitted for existing React style properties; this is a documented limitation, not an unrestricted script policy. Other existing HSTS, framing, MIME, referrer and permissions headers are retained.

`bun run preview` serves these headers for local browser verification. Vite development intentionally does not enforce this production CSP. Static preview does not send contact email. After changing any inline startup code, update the hashes deliberately and run `bun run security:csp` on the built output; CI rejects stale hashes.

## Dependency mitigation

Both lockfiles are frozen in CI. source-map-js is upgraded to 1.2.2. The root override selects postcss-selector-parser 7.1.6; existing generated CSS was byte-identical before the new privacy UI. The world's redundant vite-plugin-restart watcher was removed, eliminating its vulnerable picomatch dependency; Vite's own watcher preserves static-asset reloads.

`braces` 3.0.3 has no published fix for GHSA-vfj7-8cjw-p6xm as of this review. Bun applies `patches/braces@3.0.3.patch` persistently. The patch validates AST depth (128), node count (65,536), queued nodes and cycles before recursive parse/compile/expand/stringify work. `security:audit` checks the registered patch, its SHA-256 and the installed module's behavior before accepting this exact upstream advisory. All other advisories and scanner failures fail the check. Raw `bun audit` still reports the upstream version; it must not be described as clean. This temporary mitigation should be replaced by an upstream patched release once available. Ordinary expansions, the full tests and the combined build passed.

## Re-test and monitoring

```sh
bun install --frozen-lockfile
bun run install:world
bun run check
bun test
bun run build
bun run audit:production
bun run security:secrets
bun run security:audit
bun run security:csp
```

The secret scanner checks tracked and untracked non-ignored text files and prints locations/types only. It is a targeted signature detector, not a guarantee that all possible credentials are absent. `bun run security:secrets -- --history` additionally scans all locally reachable refs. GitHub's weekly workflow runs a full-history scan and dependency audit, plus non-delivery public routing probes. Repository owners should enable GitHub failed-workflow notifications and review the runs. No paid alert service was enabled; Vercel anomaly alerts require a paid plan on this account.

## Credential rotation and deployment

1. On 14 October 2026 the owner created **Portfolio contact 2026-10-14** with sending-only access, updated Vercel's production `RESEND_API_KEY` and the ignored local `.env`, and the current production revision was redeployed. The new key was verified through one explicitly authorized contact-form test, confirmed delivered by Resend. With explicit owner approval, the old **Onboarding** key was then deleted; only the replacement remains. Never paste credentials into chat, commits or client-prefixed variables. For future rotations, replace the values, redeploy, verify delivery and only then retire the old key.
2. With explicit owner approval, the six local Cline checkpoint refs retaining the old key were removed on 14 October 2026. Normal branch/remote/tag refs and the working tree were verified unchanged. The full reachable-history signature scan now passes. The former blobs may still exist as unreachable Git objects or in backups; ref removal does not invalidate the credential or guarantee physical erasure. Rotate the key regardless, and do not push checkpoint refs or use `git push --mirror`.
3. The owner merged the security branch to production commit `361a0ed`. The redeployment is Ready and Current. Live checks confirmed the enforced CSP, `/privacy` returning 200, the contact endpoint returning 405 for GET, and successful contact-form delivery using the replacement key. The full local reachable-history signature scan still passes. Local browser checks covered the portfolio and embedded world under the same enforced policy. Live GitHub Actions run status was not independently verified.

No ordinary branch history rewriting, force push or inbox deletion was performed by the agent. The six local checkpoint refs and the old provider key were deleted only after separate explicit owner approvals. One test email was sent only after explicit authorization. No paid service was enabled. The source audit and detailed evidence are retained outside the repository to avoid publishing local operational metadata.

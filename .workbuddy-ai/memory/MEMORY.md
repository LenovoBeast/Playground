# Project memory — PlayGround (Lenovo Beast portfolio)

## Environment
- Bash AND Node 22 work fine here (updated 2026-10-12; the older "Bash always fails" note was
  stale). PowerShell runs but returns no stdout — prefer Bash. First `npm install` can hit a
  transient network error; just retry. Full suite: `npm test` (35/35), `npm run build` (~30s).

## Stack
Vite 5 + React 18 + Tailwind 3 + GSAP (ScrollTrigger) + framer-motion + Three.js.
Deployed under base `/Playground/` (`vite.config.js`, `basename="/Playground"` in main.jsx).

## Invariants (enforced by test/*.test.js — do not break)
- `projects.json` is the single source of truth; `src/data/projects.js` re-exports it verbatim.
- `src/components/Hero.jsx`: exactly one `const TerminalWindow3D`, rendered once as
  `<TerminalWindow3D />`; contains `8+`, `47`, `12k+`.
- `src/components/World.jsx`: must render `<canvas id="canvas">`.
- `src/components/Games.jsx`: GAMES catalogue includes snake/breakout/racer/match3/launch;
  needs `data-game={game.name}` + template ids `${name}Overlay|Canvas|Score|Status`.
- `src/App.jsx`: must render `World` and `Games`.

## Architecture after the 2026-09-24 "Nexus" redesign
- `src/three/backdrop.js` — full-page interactive 3D constellation (drag/hover/click nodes).
- `src/components/World.jsx` — mounts it, projects DOM labels onto the 3D nodes each frame,
  only accepts pointer input while the hero is in view.
- `src/world.js` — the older floating-desk scene, now container-aware; used only by the Games
  section "playroom" (`setupScene(canvas, getSize)`).
- `src/data/nav.js` — SECTIONS/SOCIALS shared by Nav, scroll-spy and the 3D scene.
- Shared hooks: `useActiveSection` (+ `scrollToSection`), `useReducedMotion`/`useInView`,
  `useTilt`.
- `src/index.css` keeps every legacy utility (mini-game overlays rely on
  `.game-overlay.active`, `.game-card`, `.close-btn`, `.game-loading`).

## Security posture (as of 2026-10-12 audit)
- CSP lives in TWO places — `netlify.toml` header + `<meta http-equiv>` mirror in index.html
  (site targets GitHub Pages, which ignores netlify.toml). JSON-LD script hashes are tracked by
  `scripts/csp-hashes.mjs` — rerun it after touching structured data and update BOTH copies.
  **Any Edit to index.html can silently change the JSON-LD blocks' whitespace and invalidate the
  hashes** (happened 2026-10-12: CSP was blocking its own structured data with no visible diff).
  `test/csp.test.js` now fails the build if any declared hash goes stale or is missing from either
  copy — do not delete those tests.
  Post-migration CSP: `style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:` —
  zero external origins (fonts + thumbnails are self-hosted).
- Live host per robots/canonical: `https://lenovobeast.github.io/Playground/`.
- npm audit: **0 vulnerabilities** (Tailwind v4 + Vite 8 + plugin-react 5; unused `serve` removed).
  CI runs `npm audit --audit-level=high` as a gate.
- Contact form (src/components/Contact.jsx): **mailto handoff, no backend** (user has no
  Netlify credits — decided 2026-10-12). Validated fields compose a URL-encoded
  `mailto:lenovobeast@example.com` link; ALL state updates are queued BEFORE
  `window.location.href = mailto` because the external-protocol handoff can unload the
  document. `test/contactForm.test.js` guards composition, encoding, and that ordering.
  **The placeholder address is retained by owner's explicit choice (2026-10-13) — do not
  invent a replacement.** Single constant in `src/data/contact.js`.
- Text contrast: site-wide AA baseline is zinc-400 (#a1a1aa ≈ 7.7:1 on #030712). Do not
  reintroduce text-zinc-600 (≈2.6:1) or zinc-500 for small text (≈4.1:1). Placeholders are
  #a1a1aa. An axe gate (`npm run a11y`) enforces 0 violations.

## Games (src/components/Games.jsx + src/games/)
- Six games. **Bytefall** is the flagship: original platformer (Bit the cube-bot vs
  glitch-mites) — pure rules in `bytefallLogic.js`, canvas engine in `bytefall.js`. It is an
  ORIGINAL work in the platformer genre; do NOT add third-party characters/art/music (the
  owner asked for "Super Mario" and was offered this instead — Nintendo IP is off limits).
- Contract for every game: `createX(canvas, scoreEl, statusEl) → { start, stop }`, lazy-loaded
  via a loader entry in `src/games/gameSession.js` whose element ids must match the overlay's
  template ids (`${name}Canvas|Score|Status`). `test/games.test.js` parses the catalogue from
  source and cross-checks all of this — add the catalogue entry and the loader together.
- The catalogue entry carries `span` (bento width), `badge`, and `controls`; one `GameCard`
  renders them all. Opening a card AUTO-STARTS the engine (no second click) and the Play button
  becomes Restart. The status line is a `role="status"` live region.
- Engines may expose `canvas.dataset.bfState` (score|lives|level|x|phase) — the smoke check
  reads it to prove the player actually moves; canvas pixel hashes are unreliable there.
- Perf invariants: the game cabinet must NOT use backdrop-blur (measured 11 vs 24 fps), and
  `World` receives `paused` while a cabinet is open so the 3D backdrop stops competing.
- **Shared kit: `src/games/gameKit.js` — all six engines use it and must keep doing so.**
  `createClock` (real dt — never integrate a hard-coded 1/60), `substeps` (anti-tunneling),
  `formatScore`, `readBest`/`writeBest` (keys `game-best-*`), `isRestartKey`/`isPauseKey`,
  `createKeyState` (held keys → time-based movement, never per-keydown), `mirrorState`
  (`canvas.dataset.gameState` = `score|progress|phase`, read by the smoke check),
  `withHints`, `createPauseState`. `test/games.test.js` enforces this (imports, no fixed
  timestep, 3-field mirror, best score, shared pause key, and no kit helper used unimported).
- Every game must be provably completable: `test/gameLogic.test.js` runs full-game
  simulations (a tracking paddle wins Breakout; Launch finishes inside its shot budget).
  Add one of these when adding a game — Breakout shipped unwinnable because its top brick
  rows sat above the ceiling bounce, which no single-function test would have caught.
- **In-game presentation: `src/games/gameArt.js`.** `createHudLayer` gives every game the same
  chip HUD over its canvas (build it in `start()`, NOT at construction — `start()` calls `stop()`
  for cleanup, which would destroy it). Textures are GENERATED to offscreen canvases (the CSP
  forbids remote images and there are no binary assets); the 3D games wrap them in
  `THREE.CanvasTexture` with `colorSpace = SRGBColorSpace`. Match-3 candies must keep one unique
  SHAPE per colour (colour-blind readability) — `test/gameKit.test.js` enforces it.
- This repo's files are CRLF: multi-line `sed`/node string replacement silently fails to match.
  Use the Edit tool for multi-line changes.

## Build & tooling (post-migration)
- Tailwind v4 via `@tailwindcss/postcss` (no autoprefixer); tailwind.css uses
  `@import "tailwindcss"; @config "./tailwind.config.js"` — legacy config still drives fontFamily
  and borderRadius. Vite 8 (Rolldown): `manualChunks` MUST be a function (object form errors);
  vendors split into three/react/motion/icons; main chunk ~141 kB. Build ~11s.
- Fonts self-hosted in `src/assets/fonts` (Satoshi from Fontshare — NOT on Google Fonts, the old
  Google link silently failed; JetBrains Mono is a single variable file, declare with
  `font-weight: 100 800`). Re-vendor via `node scripts/vendor-fonts.mjs`.
- `src/data/projects.js` re-exports projects.json via `import ... with { type: 'json' }` — do NOT
  reintroduce a hand-maintained copy (it drifts and breaks portfolioData.test.js).
- Quality gates (all green, mirrored in .github/workflows/ci.yml): `npm test` (35/35),
  `npm run build`, `npm run smoke` (headless runtime check), `npm run a11y` (axe 0 violations).

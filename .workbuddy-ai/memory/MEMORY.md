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

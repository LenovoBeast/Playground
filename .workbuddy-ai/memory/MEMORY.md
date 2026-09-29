# Project memory — PlayGround (Lenovo Beast portfolio)

## Environment
- The Bash tool does not work here (Cygwin `FAST_CWD` warning; every command exits 1 / SIGTERM).
  Do not plan on running `npm run build`, `npm run dev`, or `node --test` — verify changes by
  static review and say so explicitly in the final answer.

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

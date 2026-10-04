---
name: playground-portfolio
version: 1.0.0
date: 2026-10-04
---

# Product Truth

## What it is
PlayGround is a personal portfolio site for a game-dev & web engineer that showcases five hand-built canvas game engines (Snake, Breakout, Racer, Match 3, Launch) alongside project work and technical stack. The site itself is an interactive experience: a 3D Three.js workspace where artifacts can be clicked to launch their corresponding games, and a horizontal pan "playroom" that responds to scroll.

## Primary visitor
General curiosity — anyone stumbling across the site with no specific intent beyond exploration.

## Meaningful difference
The playable games are the core artifact: five hand-built engines running on raw canvas, each lazy-loaded and wired to both card UI and 3D world objects. The portfolio's value is the experience of the work itself; the interface recedes and lets the artifact lead.

## Mode
Experience — the visitor is inside the work itself. Portfolios, galleries, showcases. Let the artifact lead from the first viewport; the interface recedes.

## Surface inventory
| Surface | Purpose | Mode | Status |
|---------|---------|------|--------|
| index.html (root) | Landing / home | Experience | Shipped |
| /#projects | Selected Work | Experience | Shipped |
| /#about | About | Read | Shipped |
| /#stack | Engineered with Precision (tech stack) | Read | Shipped |
| /#games | Playable Experiments | Experience | Shipped |
| /#contact | Contact | Operate | Shipped |

## Non-negotiables
- None binding — use README, nav.js, projects.js, and the live site as the evidence base.

## Evidence paths
- **Content**: `src/data/projects.js`, `src/data/nav.js`, `README.md`
- **Visual identity**: `tailwind.config.js`, `src/index.css`, `src/components/`
- **Behavior**: `src/world.js`, `src/games/wireGames.js`, `src/components/Games.jsx`
- **Deployment**: `.github/workflows/deploy.yml`, `netlify.toml`

## Open questions
- Exact branding/voice ("Lenovo Beast" appears in README but not in code)
- Target roles or industries for the portfolio

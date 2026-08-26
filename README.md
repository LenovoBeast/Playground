# Playground

[![Deploy to GitHub Pages](https://github.com/LenovoBeast/Playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/LenovoBeast/Playground/actions/workflows/deploy.yml)

An interactive Three.js dreamscape workspace with three playable mini-games.

## Live Website

**Visit the live site:** [https://lenovobeast.github.io/Playground/](https://lenovobeast.github.io/Playground/)

The site is deployed automatically to GitHub Pages whenever changes are pushed to `main`. Individual games are lazy-loaded, so each game downloads only when it is opened.

## Included Games

- **Serpent Monitor** — classic Snake with keyboard controls, food, growth, and collision detection.
- **Void Breakout** — paddle-and-ball Breakout with keyboard and mouse controls.
- **Micro Racer** — a toy car racing around a 3D loop track.

## Controls

- Drag the main scene to orbit around the workspace.
- Scroll to zoom in and out.
- Click a game card or its 3D artifact to launch a game.
- Use arrow keys or `WASD` for game controls.
- Press `Escape` or click the close button to exit a game.
- Snake and Breakout show a game-over message; press `Space` to restart.
- Snake flashes the food and confirms each successful collection in the status line.

## Local Development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:3000
```

## Test and Production Build

Run the focused game logic tests:

```bash
npm test
```

Create and preview a production build locally:

```bash
npm run build
npm run preview
```

## Deployment

Deployment is configured in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) using GitHub Actions and the official GitHub Pages artifact flow.

For the first deployment, open the repository settings:

1. Go to **Settings > Pages**.
2. Set **Source** to **GitHub Actions** and save it.
3. Open the **Actions** tab and select **Deploy to GitHub Pages**.
4. Choose **Run workflow**, select `main`, and run it. Future pushes to `main` deploy automatically.

The generated site uses the `/Playground/` base path configured in [`vite.config.js`](vite.config.js).

## Tech Stack

- [Three.js](https://threejs.org/) for the 3D workspace and mini-games.
- [Vite](https://vite.dev/) for development and production builds.
- Node’s built-in test runner for focused game logic tests.

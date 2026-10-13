// Runtime smoke check: serves dist/ and loads the built site in headless
// Chromium, failing on console errors, page errors, failed requests, or a
// broken layout contract (hero, sections, fonts, images, deep links).
// Usage: node scripts/smoke-check.mjs  (run `npm run build` first)
import { chromium } from 'playwright';
import { startStaticServer } from './serve-dist.mjs';

const { server, base } = await startStaticServer();

const browser = await chromium.launch();
const page = await browser.newPage();
const problems = [];
page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
page.on('requestfailed', (req) => problems.push(`requestfailed: ${req.url()} ${req.failure()?.errorText ?? ''}`));
page.on('response', (res) => { if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`); });

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // The boot veil must lift on its own. It used to depend on setTimeout, which
  // the 3D engine booting behind it could starve for seconds — leaving the
  // shell inert and the visitor locked out.
  await page
    .waitForFunction(() => !document.querySelector('.boot-veil'), null, { timeout: 4000 })
    .catch(() => problems.push('boot veil did not unmount within 4s'));

  const checks = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() ?? null,
    sections: [...document.querySelectorAll('section[id]')].map((s) => s.id),
    fontSatoshi: getComputedStyle(document.body).fontFamily,
    imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, complete: i.complete })),
    skipLink: Boolean(document.querySelector('.skip-link')),
  }));

  // Deep-link check (SPA rewrite + scroll-to-section path). The app scrolls
  // ~900 ms after the veil lifts and animates there, so wait for the outcome
  // instead of a fixed sleep — a starved timer made the fixed wait flaky.
  await page.goto(`${base}#contact`, { waitUntil: 'networkidle' });
  const contactVisible = await page
    .waitForFunction(
      () => {
        const el = document.getElementById('contact');
        return el ? el.getBoundingClientRect().top < window.innerHeight : false;
      },
      null,
      { timeout: 6000 }
    )
    .then(() => true)
    .catch(() => false);

  // Contact form: validation gates, then the mailto handoff. Headless Chromium
  // has no mail handler, so the handoff destroys the execution context — we
  // assert everything observable up to that point.
  await page.goto(`${base}#contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);

  const submit = page.locator('button[aria-label="Send message"]');
  const status = page.locator('#form-status');

  await submit.click();
  await page.waitForTimeout(200);
  const validationText = (await status.textContent()) ?? '';
  if (!validationText.includes('Please fix the form')) {
    problems.push(`empty submit did not trigger validation: "${validationText}"`);
  }
  if (!(await page.locator('input[name="name"]').evaluate((el) => el.getAttribute('aria-invalid') === 'true'))) {
    problems.push('invalid field did not receive aria-invalid');
  }

  await page.fill('input[name="name"]', 'Smoke Tester');
  await page.fill('input[name="email"]', 'smoke@example.com');
  await page.fill('input[name="subject"]', 'Smoke check');
  await page.fill('textarea[name="message"]', 'Hello from the smoke check.');
  await submit.click();
  const openingState = await page
    .waitForFunction(
      () => /Opening your mail app/i.test(document.getElementById('form-status')?.textContent ?? ''),
      null,
      { timeout: 5000 }
    )
    .then(() => true)
    .catch(() => false);
  if (!openingState) {
    problems.push('valid submit never reached the mailto handoff state');
  }
  // Every game must open, start its engine, and report through the shared state
  // mirror (score | progress | phase). Input is driven per game so the check
  // proves the simulation advances, not just that something painted.
  const GAME_CHECKS = [
    { name: 'bytefall', hold: 'ArrowRight', holdMs: 1300 },
    { name: 'snake', hold: 'ArrowDown', holdMs: 1000 },
    { name: 'breakout', hold: 'ArrowRight', holdMs: 1000 },
    { name: 'racer', hold: 'ArrowUp', holdMs: 1300 },
    { name: 'launch', click: true },
    // Turn-based: the mirror only moves on a legal swap, so this one asserts the
    // engine started and stayed error-free rather than that it self-advanced.
    { name: 'match3', hold: 'ArrowRight', holdMs: 600, expectChange: false },
  ];

  const gameResults = [];
  for (const check of GAME_CHECKS) {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.querySelector('.boot-veil'), null, { timeout: 8000 });
    await page.locator(`[data-game="${check.name}"]`).click();
    const opened = await page
      .locator(`#${check.name}Overlay.active`)
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    let started = false;
    let advanced = false;
    let state = '';
    if (opened) {
      started = await page
        .waitForFunction(
          (name) => /SCORE|LAP/.test(document.getElementById(`${name}Score`)?.textContent ?? ''),
          check.name,
          { timeout: 8000 }
        )
        .then(() => true)
        .catch(() => false);

      const readState = () =>
        page.evaluate((name) => document.getElementById(`${name}Canvas`)?.dataset.gameState ?? '', check.name);
      // Engines publish the mirror from their render loop, so wait for the first
      // frame before sampling — otherwise `before` is empty and the comparison
      // fails even though the game is running.
      await page
        .waitForFunction(
          (name) => (document.getElementById(`${name}Canvas`)?.dataset.gameState ?? '') !== '',
          check.name,
          { timeout: 8000 }
        )
        .catch(() => {});
      const before = await readState();

      await page.locator(`#${check.name}Canvas`).focus();
      if (check.click) {
        const box = await page.locator(`#${check.name}Canvas`).boundingBox();
        await page.mouse.click(box.x + box.width * 0.72, box.y + box.height * 0.3);
      } else {
        await page.keyboard.down(check.hold);
        await page.waitForTimeout(check.holdMs);
        await page.keyboard.up(check.hold);
      }
      await page.waitForTimeout(250);

      const after = await readState();
      advanced = before !== '' && after !== '' && before !== after;
      state = after;
      // Turn-based games only promise that the engine is running.
      if (check.expectChange === false) advanced = started;
      await page.keyboard.press('Escape');
    }

    gameResults.push({ ...check, opened, started, advanced, state });
  }


  const badImgs = checks.imgs.filter((i) => !i.complete || i.src === '');
  console.log('title:          ', checks.title);
  console.log('h1:             ', checks.h1);
  console.log('sections:       ', checks.sections.join(', '));
  console.log('body font:      ', checks.fontSatoshi);
  console.log('images loaded:  ', checks.imgs.length, badImgs.length ? `FAILED: ${JSON.stringify(badImgs)}` : '(all complete)');
  console.log('skip link:      ', checks.skipLink);
  for (const result of gameResults) {
    console.log(
      `game ${result.name.padEnd(9)}`,
      result.opened
        ? `opens · engine ${result.started ? 'started' : 'FAILED'} · ${result.advanced ? 'advances' : 'FAILED to advance'} · ${result.state}`
        : 'FAILED to open'
    );
  }
  console.log('#contact scroll:', contactVisible ? 'ok' : 'FAILED');

  if (checks.h1 !== 'CraftingDigital Frontiers') problems.push('hero h1 text mismatch');
  if (!checks.sections.includes('contact')) problems.push('contact section missing');
  if (!checks.skipLink) problems.push('skip link missing');
  if (badImgs.length) problems.push('broken images');
  for (const result of gameResults) {
    if (!result.opened) problems.push(`${result.name}: overlay did not open`);
    if (result.opened && !result.started) problems.push(`${result.name}: engine did not start on open`);
    if (result.opened && !result.advanced) problems.push(`${result.name}: state did not advance under input`);
  }
  if (!contactVisible) problems.push('deep link #contact did not scroll into view');
} finally {
  await browser.close().catch(() => {});
  server.close();
}

if (problems.length) {
  console.error('\nSMOKE CHECK FAILED:');
  for (const p of problems) console.error(' -', p);
  process.exit(1);
}
console.log('\nsmoke check passed');

// Accessibility gate: serves dist/ and runs axe-core against the built site,
// including an open game overlay (the most interactive surface). Fails on any
// critical or serious violation.
// Usage: node scripts/a11y-check.mjs  (run `npm run build` first)
import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';
import { startStaticServer } from './serve-dist.mjs';

const { server, base } = await startStaticServer();
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const violations = [];

async function audit(label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  const bad = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  console.log(
    `${label}: ${results.violations.length} violation(s)` +
      (bad.length ? ` — ${bad.length} critical/serious` : ' (none critical/serious)')
  );
  for (const v of bad) {
    violations.push({ label, ...v });
    console.log(`   ✗ [${v.impact}] ${v.id} — ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) console.log(`      ${node.target.join(' ')}`);
  }
  return results;
}

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await audit('home page');

  // Open the first game card's overlay: focus trap + canvas + controls.
  // Scroll back to top first — the hero's scroll-linked fade would otherwise
  // make off-screen content fail contrast math for the wrong reason.
  await page.locator('[data-game="snake"]').click();
  await page.locator('#snakeOverlay.active').waitFor({ state: 'visible', timeout: 10000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await audit('game overlay');

  // 404 route
  await page.goto(`${base}definitely-not-a-page`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await audit('404 route');
} finally {
  await browser.close();
  server.close();
}

if (violations.length) {
  console.error(`\nA11Y CHECK FAILED: ${violations.length} critical/serious violation(s)`);
  process.exit(1);
}
console.log('\na11y check passed');

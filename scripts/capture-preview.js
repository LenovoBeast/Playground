import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capturePreview() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  // Create frames directory
  const framesDir = path.join(__dirname, '../preview-frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  try {
    // Navigate to local preview server
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for animations to settle
    await page.waitForTimeout(1000);

    // Capture hero section
    await page.screenshot({ path: path.join(framesDir, '01-hero.png'), fullPage: false });
    console.log('Captured hero');

    // Scroll to projects
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(framesDir, '02-projects.png'), fullPage: false });
    console.log('Captured projects');

    // Scroll to about
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(framesDir, '03-about.png'), fullPage: false });
    console.log('Captured about');

    // Scroll to stack
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 3, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(framesDir, '04-stack.png'), fullPage: false });
    console.log('Captured stack');

    // Scroll to contact
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 4, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(framesDir, '05-contact.png'), fullPage: false });
    console.log('Captured contact');

    // Record video - full page scroll
    const videoPath = path.join(__dirname, '../preview.webm');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: path.dirname(videoPath), size: { width: 1280, height: 720 } },
    });
    const videoPage = await context.newPage();
    await videoPage.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await videoPage.waitForTimeout(500);

    // Smooth scroll through entire page
    const scrollHeight = await videoPage.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 720;
    const steps = Math.ceil(scrollHeight / viewportHeight) * 2;

    for (let i = 0; i <= steps; i++) {
      await videoPage.evaluate((y) => window.scrollTo(0, y), (i / steps) * scrollHeight);
      await videoPage.waitForTimeout(100);
    }

    await videoPage.waitForTimeout(1000);
    await context.close();

    // Move video to final location
    const videoFiles = fs.readdirSync(path.dirname(videoPath)).filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      fs.renameSync(
        path.join(path.dirname(videoPath), videoFiles[0]),
        videoPath
      );
      console.log('Video captured (webm)');
    }

  } catch (error) {
    console.error('Error capturing preview:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capturePreview();
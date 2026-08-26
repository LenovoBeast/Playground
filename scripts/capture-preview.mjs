import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const outputDir = process.env.PREVIEW_OUTPUT_DIR || 'dist'
const frameDir = '.preview-frames'
const previewUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/Playground/'
const frameCount = 24
const frameDelay = 1000 / 12

await mkdir(outputDir, { recursive: true })
await rm(frameDir, { recursive: true, force: true })
await mkdir(frameDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader']
})

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  let loaded = false
  for (let attempt = 0; attempt < 10 && !loaded; attempt++) {
    try {
      await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 5000 })
      loaded = true
    } catch (error) {
      if (attempt === 9) throw error
      await page.waitForTimeout(500)
    }
  }
  await page.waitForTimeout(1000)

  for (let frame = 0; frame < 8; frame++) {
    await page.screenshot({ path: join(frameDir, `frame-${String(frame).padStart(3, '0')}.png`) })
    await page.waitForTimeout(frameDelay)
  }

  await page.locator('[data-game="snake"]').click()
  await page.locator('#snakeOverlay.active').waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(500)

  for (let frame = 8; frame < frameCount; frame++) {
    await page.screenshot({ path: join(frameDir, `frame-${String(frame).padStart(3, '0')}.png`) })
    await page.waitForTimeout(frameDelay)
  }
} finally {
  await browser.close()
}

const frames = (await readdir(frameDir)).filter(file => file.endsWith('.png')).sort()
if (frames.length !== frameCount) {
  throw new Error(`Expected ${frameCount} preview frames, received ${frames.length}`)
}

console.log(`Captured ${frames.length} preview frames in ${frameDir}`)

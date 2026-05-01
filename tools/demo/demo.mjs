// Records a walkthrough of the InteliCareer demo flow.
// Requires both dev servers running:
//   - Frontend on http://localhost:3000
//   - Backend  on http://localhost:3001
// Run: npm run demo  →  records webm, converts to docs/demo.mp4

import { chromium } from 'playwright'
import { mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = 'http://localhost:3000'
const VIEWPORT = { width: 1440, height: 900 }
const HERE = dirname(fileURLToPath(import.meta.url))
const VIDEO_DIR = join(HERE, 'videos')
const REPO_ROOT = resolve(HERE, '..', '..')
const MP4_OUT = join(REPO_ROOT, 'docs', 'demo.mp4')

mkdirSync(VIDEO_DIR, { recursive: true })
mkdirSync(dirname(MP4_OUT), { recursive: true })

// Slow human-style typing so the recording reads naturally.
async function type(page, selector, text, delay = 60) {
  await page.click(selector)
  await page.fill(selector, '')
  for (const ch of text) {
    await page.keyboard.type(ch, { delay })
  }
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  viewport: VIEWPORT,
})
const page = await context.newPage()

try {
  // ── 1. Login as the demo user ────────────────────────────────
  console.log('[demo] logging in')
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await type(page, 'input[type="email"]',    'demo@intelicareer.com')
  await type(page, 'input[type="password"]', 'demo1234')
  await page.waitForTimeout(500)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)

  // ── 2. Show the dashboard KPIs briefly ──────────────────────
  console.log('[demo] dashboard tour')
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(1500)

  // ── 3. Go to Auto Apply ─────────────────────────────────────
  console.log('[demo] navigate to auto-apply')
  await page.goto(`${FRONTEND}/auto-apply`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  // ── 4. Use the chat to scan AI companies ────────────────────
  console.log('[demo] chat: scan ai')
  const chatInput = 'input[placeholder*="Paste a URL"]'
  await type(page, chatInput, 'scan ai', 70)
  await page.waitForTimeout(800)
  await page.press(chatInput, 'Enter')

  // Wait for scan to complete — the chat shows a "Scan complete" card.
  await page.waitForSelector('text=Scan complete', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(2500)

  // ── 5. Switch to a few tabs to show empty/populated states ──
  console.log('[demo] tab tour')
  await page.click('button:has-text("Saved")')
  await page.waitForTimeout(2000)
  await page.click('button:has-text("Eligible")')
  await page.waitForTimeout(2000)

  // ── 6. Click Score on the first job to show A–F evaluation ──
  console.log('[demo] score first job')
  const scoreButton = page.locator('button:has-text("Score")').first()
  if (await scoreButton.count() > 0) {
    await scoreButton.click()
    await page.waitForTimeout(3500)
  }

  // ── 7. Bookmark a couple of jobs ────────────────────────────
  console.log('[demo] save jobs')
  const bookmarkButtons = page.locator('button[title*="Save for later"]')
  const count = Math.min(await bookmarkButtons.count(), 2)
  for (let i = 0; i < count; i++) {
    await bookmarkButtons.nth(i).click()
    await page.waitForTimeout(1200)
  }

  // ── 8. Show the Saved tab populated ─────────────────────────
  console.log('[demo] saved tab')
  await page.click('button:has-text("Saved")')
  await page.waitForTimeout(2500)

  // ── 9. Use the chat to find backend jobs ────────────────────
  console.log('[demo] chat: find backend')
  await page.click('button:has-text("Eligible")')
  await page.waitForTimeout(1000)
  await type(page, chatInput, 'find backend', 70)
  await page.waitForTimeout(600)
  await page.press(chatInput, 'Enter')
  await page.waitForTimeout(3000)

  // ── 10. End on the dashboard for a polished close ───────────
  console.log('[demo] return to dashboard')
  await page.goto(`${FRONTEND}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  console.log('[demo] done')
} finally {
  await context.close()
  await browser.close()
}

// ── Convert the latest .webm in VIDEO_DIR to MP4_OUT via ffmpeg ─
const webm = newestFile(VIDEO_DIR, '.webm')
if (!webm) {
  console.error('[demo] no .webm produced — recording failed')
  process.exit(1)
}
console.log(`[demo] webm: ${webm}`)

const ffmpeg = findFfmpeg()
if (!ffmpeg) {
  console.error('[demo] ffmpeg not found — install ffmpeg or run: npx playwright install')
  console.error(`[demo] webm is at ${webm}; convert it manually if you can.`)
  process.exit(1)
}

console.log(`[demo] ffmpeg: ${ffmpeg}`)
console.log(`[demo] converting → ${MP4_OUT}`)
const r = spawnSync(ffmpeg, [
  '-y', '-i', webm,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
  '-pix_fmt', 'yuv420p',         // ensure broad player compatibility
  '-movflags', '+faststart',     // streamable playback (GitHub <video>)
  '-an',                         // no audio track to drop
  MP4_OUT,
], { stdio: ['ignore', 'inherit', 'inherit'] })

if (r.status !== 0) {
  console.error('[demo] ffmpeg conversion failed')
  process.exit(r.status ?? 1)
}
console.log(`[demo] saved ${MP4_OUT}`)

// ── helpers ────────────────────────────────────────────────────
function newestFile(dir, ext) {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  return files.length ? join(dir, files[0].f) : null
}

function findFfmpeg() {
  // Prefer Playwright's bundled ffmpeg (we know it's there — Chromium needs it).
  const cache = join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright')
  if (existsSync(cache)) {
    const dirs = readdirSync(cache)
      .filter(d => d.startsWith('ffmpeg-'))
      .sort()
      .reverse()
    for (const d of dirs) {
      for (const bin of ['ffmpeg-mac', 'ffmpeg-linux', 'ffmpeg.exe', 'ffmpeg']) {
        const p = join(cache, d, bin)
        if (existsSync(p)) return p
      }
    }
  }
  // Fall back to system ffmpeg.
  const which = spawnSync('which', ['ffmpeg'])
  if (which.status === 0) return which.stdout.toString().trim()
  return null
}

// Records a walkthrough of the InteliCareer demo flow.
// Requires both dev servers running:
//   - Frontend on http://localhost:3000
//   - Backend  on http://localhost:3001
// Run: npm run demo  →  records webm, converts to docs/demo.mp4

import { chromium } from 'playwright'
import { mkdirSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000'
const VIEWPORT = { width: 1440, height: 900 }
const HERE = dirname(fileURLToPath(import.meta.url))
const VIDEO_DIR = join(HERE, 'videos')
const REPO_ROOT = resolve(HERE, '..', '..')
const DOCS_DIR = join(REPO_ROOT, 'docs')
const WEBM_OUT = join(DOCS_DIR, 'demo.webm')
const MP4_OUT  = join(DOCS_DIR, 'demo.mp4')

mkdirSync(VIDEO_DIR, { recursive: true })
mkdirSync(DOCS_DIR, { recursive: true })

// Slow human-style typing so the recording reads naturally.
async function type(page, selector, text, delay = 60) {
  await page.click(selector)
  await page.fill(selector, '')
  for (const ch of text) {
    await page.keyboard.type(ch, { delay })
  }
}

// HEADLESS=1 to record silently; default shows the browser so you can see
// what's happening on first run. DEBUG=1 dumps a screenshot + html on failure.
const HEADLESS = process.env.HEADLESS === '1'
const browser = await chromium.launch({ headless: HEADLESS })
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
  viewport: VIEWPORT,
})
const page = await context.newPage()

// Surface page-side errors so we can tell when the app itself is broken.
page.on('pageerror', err => console.error('[page error]', err.message))
page.on('console', msg => {
  if (msg.type() === 'error') console.error('[page console]', msg.text())
})

async function dumpFailure(label) {
  try {
    await page.screenshot({ path: join(HERE, `failure-${label}.png`), fullPage: true })
    const html = await page.content()
    const fs = await import('node:fs/promises')
    await fs.writeFile(join(HERE, `failure-${label}.html`), html)
    console.error(`[demo] dumped failure-${label}.png and failure-${label}.html`)
    console.error(`[demo] current url: ${page.url()}`)
  } catch (e) {
    console.error('[demo] failed to dump diagnostics:', e.message)
  }
}

try {
  // ── 1. Login as the demo user ────────────────────────────────
  console.log('[demo] logging in')
  const resp = await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' })
  console.log(`[demo] /login -> HTTP ${resp?.status()} ${page.url()}`)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2000)

  // Robust email-input lookup: try several locators before giving up.
  const emailInput = page.locator(
    'input[type="email"], input[name="email"], input[autocomplete="email"]'
  ).first()
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  } catch (err) {
    await dumpFailure('login')
    throw err
  }
  await emailInput.fill('demo@intelicareer.com')

  const passwordInput = page.locator(
    'input[type="password"], input[autocomplete="current-password"]'
  ).first()
  await passwordInput.fill('demo1234')

  await page.waitForTimeout(500)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(async (err) => {
    await dumpFailure('post-login')
    throw err
  })
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

// ── Publish the recording to docs/ ─────────────────────────────
//
// Playwright records .webm. GitHub renders <video src="...webm"> natively, so
// webm alone is enough — we just copy it to docs/demo.webm.
//
// MP4 is preferred for sharing outside GitHub (Twitter, Slack uploads, etc.)
// but Playwright's bundled ffmpeg is built with --disable-everything and
// can't encode H.264. We try a system ffmpeg as a bonus; if it's not there
// we skip silently.

const webm = newestFile(VIDEO_DIR, '.webm')
if (!webm) {
  console.error('[demo] no .webm produced — recording failed')
  process.exit(1)
}
console.log(`[demo] webm: ${webm}`)

copyFileSync(webm, WEBM_OUT)
console.log(`[demo] saved ${WEBM_OUT}`)

const systemFfmpeg = findSystemFfmpeg()
if (systemFfmpeg) {
  console.log(`[demo] system ffmpeg: ${systemFfmpeg} — encoding mp4`)
  const r = spawnSync(systemFfmpeg, [
    '-y', '-i', webm,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    MP4_OUT,
  ], { stdio: ['ignore', 'inherit', 'inherit'] })
  if (r.status === 0) {
    console.log(`[demo] saved ${MP4_OUT}`)
  } else {
    console.warn('[demo] mp4 encoding failed, but webm is ready')
  }
} else {
  console.log('[demo] no system ffmpeg — skipping mp4 (run `brew install ffmpeg` to enable)')
}

// ── helpers ────────────────────────────────────────────────────
function newestFile(dir, ext) {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  return files.length ? join(dir, files[0].f) : null
}

function findSystemFfmpeg() {
  const which = spawnSync('which', ['ffmpeg'])
  if (which.status === 0) {
    const path = which.stdout.toString().trim()
    if (path && existsSync(path)) return path
  }
  return null
}

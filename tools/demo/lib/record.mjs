// Shared recorder used by per-tab demo scripts.
//
// Each demo script supplies a flow function — `async (page) => { ... }` —
// that performs the click sequence to walk through one tab. Login is done
// via the backend API (no UI capture) so each new recording starts logged in.

import { chromium } from 'playwright'
import { mkdirSync, existsSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TOOLS_DEMO = resolve(HERE, '..')
const REPO_ROOT = resolve(TOOLS_DEMO, '..', '..')
const DOCS_DIR = join(REPO_ROOT, 'docs')

const DEFAULT_FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000'
const DEFAULT_BACKEND = process.env.BACKEND_URL || 'http://localhost:3001'
const DEMO_EMAIL = 'demo@intelicareer.com'
const DEMO_PASSWORD = 'demo1234'

export async function type(page, selector, text, delay = 50) {
  await page.click(selector)
  await page.fill(selector, '')
  for (const ch of text) await page.keyboard.type(ch, { delay })
}

async function loginViaApi() {
  const r = await fetch(`${DEFAULT_BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  })
  if (!r.ok) throw new Error(`API login failed: ${r.status} ${await r.text()}`)
  return r.json()
}

// `name` becomes docs/<name>.webm / .mp4 / .gif. `flow(page)` does the work.
// `startUrl` is where the recorder navigates after login.
export async function record({ name, startUrl, flow, viewport = { width: 1440, height: 900 } }) {
  const videoDir = join(TOOLS_DEMO, 'videos')
  mkdirSync(videoDir, { recursive: true })
  mkdirSync(DOCS_DIR, { recursive: true })

  console.log(`[${name}] logging in via API`)
  const auth = await loginViaApi()

  const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' })
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: viewport },
    viewport,
  })

  // Seed localStorage *before* the first page script runs so the api client
  // sees the bearer token on its very first request.
  await context.addInitScript(({ access, refresh }) => {
    try {
      localStorage.setItem('accessToken', access)
      localStorage.setItem('refreshToken', refresh)
    } catch { /* SSR — ignore */ }
  }, { access: auth.accessToken, refresh: auth.refreshToken })

  const page = await context.newPage()
  page.on('pageerror', err => console.error(`[${name}] page error:`, err.message))
  page.on('console', m => {
    if (m.type() === 'error') console.error(`[${name}] console error:`, m.text())
  })

  try {
    console.log(`[${name}] navigating ${startUrl}`)
    await page.goto(`${DEFAULT_FRONTEND}${startUrl}`, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)
    await flow(page)
    console.log(`[${name}] flow complete`)
  } finally {
    await context.close()
    await browser.close()
  }

  const webm = newestFile(videoDir, '.webm')
  if (!webm) throw new Error(`[${name}] no .webm produced`)
  console.log(`[${name}] webm: ${webm}`)

  const webmOut = join(DOCS_DIR, `${name}.webm`)
  const mp4Out  = join(DOCS_DIR, `${name}.mp4`)
  const gifOut  = join(DOCS_DIR, `${name}.gif`)

  copyFileSync(webm, webmOut)
  console.log(`[${name}] saved ${webmOut}`)

  const ff = findSystemFfmpeg()
  if (!ff) {
    console.log(`[${name}] no system ffmpeg — skipping mp4/gif. brew install ffmpeg to enable.`)
    return
  }

  console.log(`[${name}] encoding mp4`)
  const mp4r = spawnSync(ff, [
    '-y', '-i', webm,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
    mp4Out,
  ], { stdio: ['ignore', 'inherit', 'inherit'] })
  if (mp4r.status === 0) console.log(`[${name}] saved ${mp4Out}`)

  console.log(`[${name}] encoding gif`)
  const gifr = spawnSync(ff, [
    '-y', '-i', webm,
    '-vf', 'fps=12,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5',
    gifOut,
  ], { stdio: ['ignore', 'inherit', 'inherit'] })
  if (gifr.status === 0) console.log(`[${name}] saved ${gifOut}`)
}

function newestFile(dir, ext) {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
  return files.length ? join(dir, files[0].f) : null
}

function findSystemFfmpeg() {
  const w = spawnSync('which', ['ffmpeg'])
  if (w.status === 0) {
    const p = w.stdout.toString().trim()
    if (p && existsSync(p)) return p
  }
  return null
}

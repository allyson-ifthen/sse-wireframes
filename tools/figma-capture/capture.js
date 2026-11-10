// Error Pages wireframe: clean screenshots of every state.
// Adapted from the app-screens-to-figma skill scaffold (capture.template.js).
//
//   cd Wireframes/tools/figma-capture
//   npm install          (once; uses the Chrome already installed, downloads no browser)
//   npm run capture
//
// Output: figma-shots/NN-<page>-<market>-<viewport>.png  (gitignored, regenerate any time)
//
// No dev server needed: the script serves the Wireframes folder itself on a free local port.
// Override with URL="http://localhost:8000" if you'd rather serve it yourself.
const puppeteer = require('puppeteer-core')
const http = require('http')
const path = require('path')
const fs = require('fs')

const OUT = path.resolve(__dirname, 'figma-shots')
const ROOT = path.resolve(__dirname, '..', '..') // Wireframes/
const FILE = 'ErrorPages_Wireframe.html'

// ---------------------------------------------------------------------------------------
// THE STATES — the only project-specific part.
// Order sets the numbering: page, then market, then viewport.
// ---------------------------------------------------------------------------------------
const PAGES = ['404', '500full', '500fb', 'maint']
const MARKETS = ['ong', 'pa', 'gre', 'il', 'ies']
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 1000 },
  { name: 'mobile', width: 375, height: 812 },
]

// Clean view: presentation mode (no control panel, no annotations), plus wireframe-canvas
// framing stripped so each shot is just the page.
const CLEAN_CSS = `
  #esc-hint, .doc-footer { display: none !important; }
  body { background: #fff !important; }
  .canvas { max-width: none !important; margin: 0 !important; padding: 0 !important; }
  .section { border: none !important; margin: 0 !important; }
`

// ---------------------------------------------------------------------------------------
// Harness — generic.
// ---------------------------------------------------------------------------------------
const CHROME_PATHS = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
}

function resolveChrome() {
  if (process.env.CHROME) {
    if (!fs.existsSync(process.env.CHROME)) throw new Error(`CHROME is set to "${process.env.CHROME}" but there's nothing there.`)
    return process.env.CHROME
  }
  const found = (CHROME_PATHS[process.platform] || []).find((p) => p && fs.existsSync(p))
  if (found) return found
  throw new Error(`No Chrome-family browser found on ${process.platform}.\nPoint at one:  CHROME="/path/to/chrome" npm run capture`)
}

// Minimal static server for the Wireframes folder (only used when URL isn't set).
function startServer() {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' }
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'
    const p = path.resolve(ROOT, rel)
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
      res.writeHead(404); return res.end('not found')
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' })
    fs.createReadStream(p).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  let server = null
  let base = process.env.URL
  if (!base) {
    server = await startServer()
    base = `http://127.0.0.1:${server.address().port}`
  }
  if (!fs.existsSync(path.join(ROOT, FILE))) throw new Error(`Can't find ${FILE} in ${ROOT}`)
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars'],
  })
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

  let n = 0
  for (const pg of PAGES) {
    for (const mkt of MARKETS) {
      for (const vp of VIEWPORTS) {
        n += 1
        // 2x so the shots stay sharp when scaled up.
        await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 })
        const url = `${base}/${FILE}?page=${pg}&market=${mkt}&vp=${vp.name}`
        await page.goto(url, { waitUntil: 'networkidle0' })
        await page.evaluate(() => { setAnnMode('clean'); setChrome('hide') })
        await page.addStyleTag({ content: CLEAN_CSS })

        // Fail loudly if the state didn't land, rather than saving a plausible wrong shot.
        const ok = await page.evaluate(
          (p, m) => document.body.classList.contains('is-page-' + p) && document.body.classList.contains('mkt-' + m),
          pg, mkt,
        )
        if (!ok) throw new Error(`state did not apply: page=${pg} market=${mkt}`)

        await page.evaluate(() => document.fonts && document.fonts.ready)
        await sleep(250)
        const file = `${String(n).padStart(2, '0')}-${pg}-${mkt}-${vp.name}.png`
        await page.screenshot({ path: path.join(OUT, file), fullPage: true })
        console.log(`captured ${file}`)
      }
    }
  }

  await browser.close()
  if (server) server.close()
  console.log(`\ndone: ${n} screenshots in ${OUT}`)
}

main().catch((e) => {
  console.error('CAPTURE FAILED:', e.message)
  process.exit(1)
})

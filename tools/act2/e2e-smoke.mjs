/**
 * Act II smoke test in a real browser (BLUEPRINT P-27): starts Vite, opens Act II in Spanish, sets up
 * a game through the UI, plays a whole round and fails on any console error or page error.
 *
 *   PLAYWRIGHT_CORE=<path to a playwright-core folder> node tools/act2/e2e-smoke.mjs
 *
 * playwright-core is not a dependency of this repo: point PLAYWRIGHT_CORE at any copy (the lab has
 * several) or install it. It drives the system Edge, so no browser download is needed.
 * Taps go through the buttons' own pointer events, found by their text, like a player would.
 */
import { spawn } from 'child_process'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')
const PORT = 8123
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..')

const vite = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true })
const ready = new Promise((resolve, reject) => {
    vite.stdout.on('data', d => { if (String(d).includes('Local')) resolve() })
    vite.on('exit', code => reject(new Error(`vite exited ${code}`)))
    setTimeout(() => reject(new Error('vite did not start')), 60000)
})

const errors = []
let browser
try {
    await ready
    browser = await chromium.launch({ channel: 'msedge', headless: true })
    const page = await browser.newPage({ viewport: { width: 1024, height: 640 } })
    page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()} ${m.location().url || ''}`.trim()) })
    page.on('pageerror', e => errors.push(String(e)))
    page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`) })
    await page.goto(`http://localhost:${PORT}/?timer`)
    // Wait for the language screen to finish loading its fonts (stopping it earlier breaks its callback).
    await page.waitForFunction(() => {
        const g = window.__jawsGame
        const s = g && g.isBooted && g.scene.getScene('languageSelection')
        return !!s && s.children.list.some(o => o.type === 'Image')
    }, null, { timeout: 30000 })

    const result = await page.evaluate(async () => {
        const w = ms => new Promise(r => setTimeout(r, ms))
        const g = window.__jawsGame
        const tap = async (key, pred) => {
            const found = []
            const walk = o => { if (o.type === 'Text' && pred(o.text) && o.parentContainer && o.parentContainer.input) found.push(o.parentContainer); (o.list || []).forEach(walk) }
            g.scene.getScene(key).children.list.forEach(walk)
            if (!found.length) throw new Error(`no button in ${key}`)
            found[0].emit('pointerup')
            await w(80)
        }
        localStorage.clear()
        g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key))
        g.scene.start('act2Setup', { language: 'ES' })
        await w(300)
        for (const [who, cards] of [['Brody', ['Munición (', 'Jaula']], ['Quint', ['Fusil de Pesca (', 'Carnada (', 'Munición (']], ['Hooper', ['Bombona (', 'Red de Pesca (']]]) {
            await tap('act2Setup', t => t === who)
            for (const c of cards) await tap('act2Setup', t => t.indexOf(c) === 0)
        }
        await tap('act2Setup', t => t === 'Empezar el Acto II')
        await w(300)
        const R = () => g.scene.getScene('act2Round')
        for (const c of ['Z2 · Evasión 1 · 3 dados', 'Z3 · Evasión 1 · 3 dados', 'Z6 · Evasión 2 · 2 dados']) await tap('act2Round', t => t.indexOf(c) === 0)
        await tap('act2Round', t => t === 'Aceptar')
        await tap('act2Round', t => t === 'Revelar al Tiburón')
        await tap('act2Round', t => t === 'Hooper')
        await tap('act2Round', t => t === 'Aceptar')
        for (let i = 0; i < 20 && R().session.phase.kind !== 'summary' && R().session.phase.kind !== 'over'; i++) {
            const k = R().session.phase.kind
            if (k === 'crewRoll') await tap('act2Round', t => t === '2')
            else if (k === 'cage') await tap('act2Round', t => t === 'Nadie')
            else if (k === 'sharkRoll') await tap('act2Round', t => t === '1')
        }
        await w(200)
        return { phase: R().session.phase.kind, shark: R().session.state.shark.wounds, saved: !!localStorage.getItem('JawsAI_act2') }
    })
    if (result.phase !== 'summary' && result.phase !== 'over') throw new Error(`round did not finish: ${JSON.stringify(result)}`)
    if (!result.saved) throw new Error('the game was not saved')
    // The browser asks for /favicon.ico on its own; the app has never had one (harmless 404).
    const real = errors.filter(e => e.indexOf('favicon.ico') < 0)
    if (real.length) throw new Error(`console errors:\n${real.join('\n')}`)
    console.log(`OK: one Act II round played in the browser (${JSON.stringify(result)}), console clean`)
} catch (e) {
    console.error(`FAIL: ${e.message}`)
    process.exitCode = 1
} finally {
    if (browser) await browser.close()
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(vite.pid), '/T', '/F'])
    else vite.kill()
}

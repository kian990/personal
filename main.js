// ————— video: fade in, try to start with sound, fall back to muted —————
const bg = document.getElementById('bg')
const soundBtn = document.getElementById('sound')

// show the video as soon as it has a frame — checked right now (it may already be
// ready before this script runs) AND on every event that can mean "frames exist",
// so a refresh can never leave the page white because one event was missed
const showVideo = () => bg.classList.add('ready')
if (bg.readyState >= 2) showVideo()
for (const ev of ['loadeddata', 'canplay', 'playing', 'timeupdate']) {
  bg.addEventListener(ev, showVideo, { once: true })
}

function setSoundLabel() {
  soundBtn.textContent = bg.muted ? 'sound off' : 'sound on'
}

// try to start with sound; if that's blocked (or the load got interrupted by the
// refresh), fall back to muted, and keep retrying on user interaction / tab focus
function tryPlay() {
  return bg.play().then(setSoundLabel)
}
function startMuted() {
  bg.muted = true
  setSoundLabel()
  return tryPlay().catch(() => {})
}
const unmute = () => {
  bg.muted = false
  setSoundLabel()
  tryPlay().catch(startMuted)
}
const kick = () => {
  if (bg.paused) startMuted()
}

bg.muted = false
tryPlay().catch(() => {
  startMuted()
  window.addEventListener('pointerdown', unmute, { once: true })
})
// safety nets: if it's still paused after a stall, a decode hiccup, or coming back to
// the tab, nudge it again
bg.addEventListener('stalled', kick)
bg.addEventListener('suspend', kick)
bg.addEventListener('error', () => { bg.load(); startMuted() }, { once: true })
document.addEventListener('visibilitychange', () => { if (!document.hidden) kick() })
window.addEventListener('pointerdown', kick)

soundBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  bg.muted = !bg.muted
  setSoundLabel()
})

// ————— edit mode: press E — drag to move, shift+drag to resize —————
// on exit (press E again) the updated CSS is printed and copied to the clipboard.
// in a narrow window (≤768px) the CSS comes wrapped in the mobile media query,
// so mobile edits never touch the desktop layout — and vice versa.
const els = [...document.querySelectorAll('.el')]
const isMobile = () => innerWidth <= 768
// px size of one design unit (--u), matching style.css
const unit = () => (isMobile() ? Math.min(innerWidth * 0.018, innerHeight * 0.0154) : Math.min(innerWidth * 0.01, innerHeight * 0.0154))
let editing = false
let hint

// live edits go into a media-query-scoped stylesheet — NOT inline styles —
// so moving something in the mobile view can never affect the desktop view
const editSheet = document.head.appendChild(document.createElement('style'))
const edits = { mobile: {}, desktop: {} }

function renderEdits() {
  const block = (mode, wrap) => {
    const rules = Object.entries(edits[mode])
      .map(([id, p]) => {
        const parts = []
        if (p.left != null) parts.push(`left: ${p.left}; right: auto`)
        if (p.top != null) parts.push(`top: ${p.top}; bottom: auto`)
        if (p.w != null) parts.push(`--w: ${p.w}`)
        return `#${id} { ${parts.join('; ')}; }`
      })
      .join('\n')
    return rules ? `@media (${wrap}) {\n${rules}\n}` : ''
  }
  editSheet.textContent =
    block('desktop', 'min-width: 769px') + '\n' + block('mobile', 'max-width: 768px')
}

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'e' || e.repeat) return
  editing = !editing
  document.body.classList.toggle('editing', editing)
  if (editing) {
    hint = document.createElement('p')
    hint.id = 'edit-hint'
    hint.textContent = `edit mode (${isMobile() ? 'mobile' : 'desktop'}) — drag to move · shift+drag to resize · E to finish (copies css)`
    document.body.appendChild(hint)
  } else {
    hint?.remove()
    hint = null
    const mode = isMobile() ? 'mobile' : 'desktop'
    let css = Object.entries(edits[mode])
      .map(([id, p]) => {
        const parts = []
        if (p.left != null) parts.push(`left: ${p.left}`)
        if (p.top != null) parts.push(`top: ${p.top}`)
        if (p.w != null) parts.push(`--w: ${p.w}`)
        return `#${id} { ${parts.join('; ')}; }`
      })
      .join('\n')
    if (css) {
      if (mode === 'mobile') css = `@media (max-width: 768px) {\n${css.replace(/^/gm, '  ')}\n}`
      console.log(`--- updated ${mode.toUpperCase()} positions ---\n` + css)
      navigator.clipboard?.writeText(css)
    }
  }
})

let drag = null
document.addEventListener('pointerdown', (e) => {
  if (!editing) return
  const el = e.target.closest('.el')
  if (!el) return
  e.preventDefault()
  const r = el.getBoundingClientRect()
  drag = {
    el,
    resize: e.shiftKey,
    startX: e.clientX,
    startY: e.clientY,
    left: r.left,
    top: r.top,
    width: r.width,
  }
})
document.addEventListener('pointermove', (e) => {
  if (!drag) return
  const dx = e.clientX - drag.startX
  const dy = e.clientY - drag.startY
  const mode = isMobile() ? 'mobile' : 'desktop'
  const p = (edits[mode][drag.el.id] ||= {})
  if (drag.resize) {
    const w = Math.max(20, drag.width + dx)
    p.w = (w / unit()).toFixed(1)
  } else {
    p.left = (((drag.left + dx) / innerWidth) * 100).toFixed(1) + '%'
    p.top = (((drag.top + dy) / innerHeight) * 100).toFixed(1) + '%'
  }
  renderEdits()
})
document.addEventListener('pointerup', () => (drag = null))


// ————— who_am_i though? — blur the page, type the email out big, keep the music —————
const whoami = document.createElement('div')
whoami.id = 'whoami'
whoami.innerHTML = '<p id="typeline"></p>'
document.body.appendChild(whoami)

const EMAIL = 'kianludwig33@gmail.com'

function openWhoami(e) {
  e.preventDefault()
  document.body.classList.add('whoami')
  whoami.classList.add('open')
  // rebuilding the line restarts the sweep animation on every open
  whoami.innerHTML = `<p id="typeline">${EMAIL}<span class="cursor"></span></p>`
}

function closeWhoami() {
  document.body.classList.remove('whoami')
  whoami.classList.remove('open')
}

let copiedTimer = null
whoami.addEventListener('click', (e) => {
  const line = e.target.closest('#typeline')
  if (!line) return closeWhoami()
  // click on the email: copy it, flash the wrap pale green
  navigator.clipboard?.writeText(EMAIL)
  line.classList.add('copied')
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => line.classList.remove('copied'), 1400)
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && whoami.classList.contains('open')) closeWhoami()
})

const whoLink = [...document.querySelectorAll('.tree a')].find((a) => a.textContent.includes('who_am_i'))
whoLink?.addEventListener('click', openWhoami)

// ————— 005 source_material — everything fades into a big white box; video + music keep going —————
const figmaPanel = document.getElementById('figma-panel')
// letterhead date: today as MM/DD/YY
{
  const d = new Date()
  const two = (n) => String(n).padStart(2, '0')
  document.getElementById('lh-date').textContent =
    `${two(d.getMonth() + 1)}/${two(d.getDate())}/${String(d.getFullYear()).slice(-2)}`
}

// the box digitizes in as a pixel mosaic drawn on a canvas (no DOM churn, so it
// starts the instant you click): every cell gets a time at which it pops in — a
// left→right sweep with some noise — and the whole thing settles into one solid box
const MOSAIC_COLS = 96
const MOSAIC_SWEEP = 0.7   // s — how long the left→right sweep takes
const MOSAIC_NOISE = 0.35  // s — random jitter on top, so it feels digitized not wiped
const MOSAIC_POP = 0.18    // s — each cell's own fade
const MOSAIC_TOTAL = MOSAIC_SWEEP + MOSAIC_NOISE + MOSAIC_POP
const MOSAIC_FILL = '#fff'

const mosaic = document.createElement('canvas')
mosaic.className = 'mosaic'
figmaPanel.prepend(mosaic)
const mctx = mosaic.getContext('2d')
let mosaicRaf = 0

function runMosaic(reverse, done) {
  cancelAnimationFrame(mosaicRaf)
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const { width, height } = figmaPanel.getBoundingClientRect()
  mosaic.width = Math.round(width * dpr)
  mosaic.height = Math.round(height * dpr)
  const cols = MOSAIC_COLS
  const rows = Math.max(1, Math.round(cols * (height / width)))
  const cw = mosaic.width / cols
  const ch = mosaic.height / rows
  const at = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      at[r * cols + c] = (c / cols) * MOSAIC_SWEEP + Math.random() * MOSAIC_NOISE

  const t0 = performance.now()
  const frame = (now) => {
    const t = (now - t0) / 1000
    mctx.clearRect(0, 0, mosaic.width, mosaic.height)
    mctx.fillStyle = MOSAIC_FILL
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let k = (t - at[r * cols + c]) / MOSAIC_POP   // 0→1 as the cell pops in
        if (k <= 0) { if (reverse) mctx.globalAlpha = 1; else continue }
        else if (k >= 1) { if (reverse) continue; mctx.globalAlpha = 1 }
        else mctx.globalAlpha = reverse ? 1 - k : k
        // +0.5px overlap hides hairline seams between cells
        mctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5)
      }
    }
    mctx.globalAlpha = 1
    if (t < MOSAIC_TOTAL) mosaicRaf = requestAnimationFrame(frame)
    else { mctx.clearRect(0, 0, mosaic.width, mosaic.height); done() }
  }
  mosaicRaf = requestAnimationFrame(frame)
}

function openFigma(e) {
  e.preventDefault()
  e.stopPropagation()   // so the opening click doesn't count as a click outside the box
  if (figmaPanel.classList.contains('open')) return
  document.body.classList.add('figma')
  figmaPanel.classList.remove('closing', 'solid')
  figmaPanel.classList.add('open')
  // once every cell is in, the canvas clears and the box becomes one clean solid wrap
  runMosaic(false, () => figmaPanel.classList.add('solid'))
}
function closeFigma() {
  if (!figmaPanel.classList.contains('open')) return
  document.body.classList.remove('figma')
  figmaPanel.classList.remove('open', 'solid')
  figmaPanel.classList.add('closing')
  runMosaic(true, () => figmaPanel.classList.remove('closing'))
}
document.getElementById('sm-close').addEventListener('click', closeFigma)
// clicking the gutter around the box (anything outside the panel) closes it too
document.addEventListener('click', (e) => {
  if (figmaPanel.classList.contains('open') && !figmaPanel.contains(e.target)) closeFigma()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && figmaPanel.classList.contains('open')) closeFigma()
})
document.querySelector('.tree a.figma-link')?.addEventListener('click', openFigma)

// episode list (left column) + placeholder gallery (right column), fed by source-material.json
{
  const list = document.getElementById('ep-list')
  const frame = document.getElementById('ep-frame')
  const count = document.getElementById('ep-count')
  const two = (n) => String(n).padStart(2, '0')
  const fmt = (n) => n.toLocaleString('en-US')

  // gallery: one slot per episode; drop image paths in here (e.g. 'media/sm/ep01.jpg')
  // and they replace the placeholder — null slots stay as the dotted frame
  let slides = Array(8).fill(null)
  let slide = 0
  const show = (i, animate = true) => {
    slide = (i + slides.length) % slides.length
    const src = slides[slide]
    frame.innerHTML = src
      ? `<img src="${src}" alt="episode ${two(slide + 1)}">`
      : `<span class="ep-ph">[ image ${two(slide + 1)} / ${two(slides.length)} ]</span>`
    count.textContent = `${two(slide + 1)} / ${two(slides.length)}`
    if (animate) { frame.classList.remove('flip'); void frame.offsetWidth; frame.classList.add('flip') }
  }
  const step = (d) => (e) => { e.stopPropagation(); show(slide + d) }
  document.getElementById('ep-gallery').addEventListener('click', step(1))
  document.getElementById('ep-prev').addEventListener('click', step(-1))
  document.getElementById('ep-next').addEventListener('click', step(1))
  document.addEventListener('keydown', (e) => {
    if (!figmaPanel.classList.contains('open')) return
    if (e.key === 'ArrowRight') show(slide + 1)
    if (e.key === 'ArrowLeft') show(slide - 1)
  })
  show(0, false)

  fetch('source-material.json')
    .then((r) => r.json())
    .then(({ episodes }) => {
      const total = (ep) => (ep.youtube?.views || 0) + (ep.x?.views || 0)
      const row = (n, guest, views, cls = '') =>
        `<li class="${cls}"><span class="ep-n">${n}</span><span class="ep-guest">${guest}</span><span class="ep-views">${views}</span></li>`
      list.innerHTML =
        episodes.map((ep) => row(two(ep.ep), ep.guest.replace(/\s*\(.*?\)/g, ''), fmt(total(ep)))).join('') +
        row('&nbsp;&nbsp;', 'TOTAL VIEWS', fmt(episodes.reduce((s, ep) => s + total(ep), 0)), 'ep-total')
      slides = episodes.map(() => null)
      show(0, false)
    })
    .catch(() => { list.innerHTML = '<li><span class="ep-guest">source-material.json not found</span></li>' })
}

// ————— "kian ludwig" coin flip: hover any piece → all flip to the metallic side;
// the sheen follows the pointer, with a slow drift so it glistens even at rest —————
const coins = [...document.querySelectorAll('.coin')]
coins.forEach((coin) => {
  const front = coin.querySelector('.front')
  coin.querySelector('.back').style.setProperty('--face', `url("${front.getAttribute('src')}")`)
})
const setFlipped = (on) => coins.forEach((c) => c.classList.toggle('flipped', on))
coins.forEach((coin) => {
  coin.addEventListener('pointerenter', (e) => { if (!editing && e.pointerType !== 'touch') setFlipped(true) })
  coin.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') setFlipped(false) })
  // touch: tap toggles
  coin.addEventListener('click', (e) => {
    if (editing) return
    if (matchMedia('(hover: none)').matches) setFlipped(!coin.classList.contains('flipped'))
  })
})

// sheen: pointer position (eased) + a slow drift
const sheen = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
window.addEventListener('pointermove', (e) => {
  sheen.tx = e.clientX / innerWidth
  sheen.ty = e.clientY / innerHeight
})
;(function glisten(now) {
  const t = now / 1000
  sheen.x += (sheen.tx - sheen.x) * 0.08
  sheen.y += (sheen.ty - sheen.y) * 0.08
  const drift = Math.sin(t * 0.6) * 0.08
  // the gradient slides opposite to the pointer, like light moving across metal
  const sx = ((1 - sheen.x) * 100 + drift * 100).toFixed(2) + '%'
  const sy = ((1 - sheen.y) * 100 - drift * 60).toFixed(2) + '%'
  for (const c of coins) { c.style.setProperty('--sx', sx); c.style.setProperty('--sy', sy) }
  requestAnimationFrame(glisten)
})(performance.now())


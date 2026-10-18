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
    setTimeout(measureCoins, 50)
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

// ————— 005 / 006 sheet panels — everything fades into a big white box; video + music keep going —————
// letterhead date: today as MM/DD/YY (every sheet shares it)
{
  const d = new Date()
  const two = (n) => String(n).padStart(2, '0')
  const date = `${two(d.getMonth() + 1)}/${two(d.getDate())}/${String(d.getFullYear()).slice(-2)}`
  document.querySelectorAll('.lh-date').forEach((t) => { t.textContent = date })
}

// the box digitizes in as a pixel mosaic drawn on a canvas (no DOM churn, so it
// starts the instant you click): every cell gets a time at which it pops in — a
// left→right sweep with some noise — and the whole thing settles into one solid box
const MOSAIC_COLS = 96
const MOSAIC_SWEEP = 0.7   // s — how long the left→right sweep takes
const MOSAIC_NOISE = 0.35  // s — random jitter on top, so it feels digitized not wiped
const MOSAIC_POP = 0.18    // s — each cell's own fade
const MOSAIC_TOTAL = MOSAIC_SWEEP + MOSAIC_NOISE + MOSAIC_POP
const MOSAIC_FILL = 'rgba(255, 255, 255, .9)'   // matches .sheet-panel.solid in style.css

function runMosaic(panel, mosaic, reverse, done) {
  cancelAnimationFrame(panel._raf)
  const mctx = mosaic.getContext('2d')
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const { width, height } = panel.getBoundingClientRect()
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
    if (t < MOSAIC_TOTAL) panel._raf = requestAnimationFrame(frame)
    else { mctx.clearRect(0, 0, mosaic.width, mosaic.height); done() }
  }
  panel._raf = requestAnimationFrame(frame)
}

// one sheet panel: a nav link opens it, [x] / Escape / clicking outside closes it.
// bodyClass is what fades the homepage out while it's open.
function setupPanel({ panel, link, close, bodyClass }) {
  const mosaic = document.createElement('canvas')
  mosaic.className = 'mosaic'
  panel.prepend(mosaic)
  const isOpen = () => panel.classList.contains('open')
  const open = (e) => {
    e.preventDefault()
    e.stopPropagation()   // so the opening click doesn't count as a click outside the box
    if (isOpen()) return
    document.body.classList.add(bodyClass)
    panel.classList.remove('closing', 'solid')
    panel.classList.add('open')
    // once every cell is in, the canvas clears and the box becomes one clean solid wrap
    runMosaic(panel, mosaic, false, () => panel.classList.add('solid'))
  }
  const shut = () => {
    if (!isOpen()) return
    document.body.classList.remove(bodyClass)
    panel.classList.remove('open', 'solid')
    panel.classList.add('closing')
    runMosaic(panel, mosaic, true, () => panel.classList.remove('closing'))
  }
  close.addEventListener('click', shut)
  // clicking the gutter around the box (anything outside the panel) closes it too
  document.addEventListener('click', (e) => { if (isOpen() && !panel.contains(e.target)) shut() })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) shut() })
  link?.addEventListener('click', open)
  // instant versions for jumping between sheets: no mosaic, the new sheet's type just wipes in
  const show = () => {
    cancelAnimationFrame(panel._raf)
    document.body.classList.add(bodyClass)
    panel.classList.remove('closing')
    panel.classList.add('open', 'solid')
  }
  const hide = () => {
    cancelAnimationFrame(panel._raf)
    document.body.classList.remove(bodyClass)
    panel.classList.remove('open', 'solid', 'closing')
  }
  return { panel, isOpen, show, hide }
}

// a click-through gallery inside a sheet: click the frame (or < >, or the arrow keys
// while the panel is open) to advance. slides are image paths; null = dotted placeholder
function makeGallery({ gallery, frame, count, prev, next, panel, onChange, link }) {
  const two = (n) => String(n).padStart(2, '0')
  let slides = [null]
  let slide = 0
  const wrap = (i) => (i + slides.length) % slides.length
  // draw slide i (doesn't change which slide is "current" — hover previews use this)
  const render = (i, animate) => {
    const s = slides[i]
    frame.innerHTML = s?.src
      ? `<img src="${s.src}" alt="${s.name || 'slide ' + two(i + 1)}">`
      : `<span class="ep-ph">[ image ${two(i + 1)} / ${two(slides.length)} ]</span>`
    count.textContent = (s?.name ? s.name + ' · ' : '') + `${two(i + 1)} / ${two(slides.length)}`
    if (link) { link.hidden = !s?.url; if (s?.url) link.href = s.url }   // LINK ↗ to the slide's page, when it has one
    if (animate) { frame.classList.remove('flip'); void frame.offsetWidth; frame.classList.add('flip') }
  }
  const show = (i, animate = true) => {
    slide = wrap(i)
    onChange?.(slide)
    render(slide, animate)
  }
  const step = (d) => (e) => { e.stopPropagation(); show(slide + d) }
  gallery.addEventListener('click', step(1))
  link?.addEventListener('click', (e) => e.stopPropagation())   // the link opens; it doesn't also advance
  prev.addEventListener('click', step(-1))
  next.addEventListener('click', step(1))
  document.addEventListener('keydown', (e) => {
    if (!panel.classList.contains('open')) return
    if (e.key === 'ArrowRight') show(slide + 1)
    if (e.key === 'ArrowLeft') show(slide - 1)
  })
  show(0, false)
  return {
    // set the slides: each is { src, name } (src null = placeholder)
    set: (list) => { slides = list.length ? list : [null]; show(0, false) },
    go: (i) => show(i),   // jump straight to slide i (e.g. from a list)
    peek: (i) => render(wrap(i), false),   // preview slide i without making it current
    unpeek: () => render(slide, false),    // back to the current one
  }
}

// a list whose rows carry data-i drives a gallery: hover previews, click selects
function wireList(list, gallery) {
  const rowOf = (e) => e.target.closest('li[data-i]')
  list.addEventListener('click', (e) => { const li = rowOf(e); if (li) { e.stopPropagation(); gallery.go(+li.dataset.i) } })
  list.addEventListener('pointerover', (e) => { const li = rowOf(e); if (li && e.pointerType !== 'touch') gallery.peek(+li.dataset.i) })
  list.addEventListener('pointerleave', () => gallery.unpeek())
  // marks the row for the slide on screen with .cur
  return (i) => list.querySelectorAll('li[data-i]').forEach((li) => li.classList.toggle('cur', +li.dataset.i === i))
}

const $ = (id) => document.getElementById(id)
const slug = (s) => s.replace(/\s*\(.*?\)/g, '').trim().toLowerCase().replace(/\s+/g, '_')
const fmt = (n) => n.toLocaleString('en-US')
const two = (n) => String(n).padStart(2, '0')
const row = (n, label, value, cls = '', i = null) =>
  `<li class="${cls}"${i == null ? '' : ` data-i="${i}"`}><span class="ep-n">${n}</span><span class="ep-guest">${label}</span><span class="ep-views">${value}</span></li>`

// ——— 005 source_material: episode list with combined views + 8-slot placeholder gallery ———
const figmaPanel = $('figma-panel')
const smSheet = setupPanel({ panel: figmaPanel, link: document.querySelector('.tree a.figma-link'), close: $('sm-close'), bodyClass: 'figma' })
{
  const list = $('ep-list')
  let mark = () => {}
  const gallery = makeGallery({ gallery: $('ep-gallery'), frame: $('ep-frame'), count: $('ep-count'), prev: $('ep-prev'), next: $('ep-next'), panel: figmaPanel, onChange: (i) => mark(i), link: $('ep-link') })
  mark = wireList(list, gallery)   // hover a name → preview; click → select
  gallery.set(Array(8).fill(null))
  fetch('source-material.json')
    .then((r) => r.json())
    .then(({ episodes }) => {
      const total = (ep) => (ep.youtube?.views || 0) + (ep.x?.views || 0)
      list.innerHTML =
        episodes.map((ep, i) => row(two(ep.ep), slug(ep.guest), fmt(total(ep)), 'ep-row', i)).join('') +
        row('&nbsp;&nbsp;', 'total_views', fmt(episodes.reduce((s, ep) => s + total(ep), 0)), 'ep-total')
      gallery.set(episodes.map((ep) => (ep.image ? { src: ep.image, name: slug(ep.guest), url: ep.youtube?.url } : null)))
    })
    .catch(() => { $('ep-list').innerHTML = '<li><span class="ep-guest">source-material.json not found</span></li>' })
}

// ——— 006 zora_profiles: every guest listed, reel covers in the gallery ———
const zoraPanel = $('zora-panel')
const zoraSheet = setupPanel({ panel: zoraPanel, link: document.querySelector('.tree a.zora-link'), close: $('zora-close'), bodyClass: 'zora' })
// [>] on 005 → 006, [<] on 006 → 005 (stopPropagation: the click mustn't count as "outside" the new sheet)
const jump = (from, to) => (e) => { e.stopPropagation(); from.hide(); to.show() }
$('sm-next').addEventListener('click', jump(smSheet, zoraSheet))
$('zora-back').addEventListener('click', jump(zoraSheet, smSheet))
{
  const list = $('zora-list')
  let mark = () => {}
  const gallery = makeGallery({ gallery: $('zora-gallery'), frame: $('zora-frame'), count: $('zora-count'), prev: $('zora-prev'), next: $('zora-next'), panel: zoraPanel, onChange: (i) => mark(i) })
  mark = wireList(list, gallery)   // hover a name → preview; click → select
  fetch('zora-profiles.json')
    .then((r) => r.json())
    .then(({ profiles }) => {
      list.innerHTML = profiles
        .map((p, i) => `<li class="ep-row" data-i="${i}"><span class="ep-n">${two(i + 1)}</span><span class="ep-guest">${p.name || '—'}</span></li>`)
        .join('')
      // one slide per profile, same index as the list row (a profile without an image shows the dotted frame)
      gallery.set(profiles.map((p) => (p.image ? { src: p.image, name: p.name, url: p.reel } : null)))
    })
    .catch(() => { $('zora-list').innerHTML = '<li><span class="ep-guest">zora-profiles.json not found</span></li>' })
}


// ————— "kian ludwig" coin flip: hover any piece → all flip to the metallic side;
// the sheen follows the pointer, with a slow drift so it glistens even at rest —————
const coins = [...document.querySelectorAll('.coin')]
coins.forEach((coin) => {
  const front = coin.querySelector('.front')
  coin.querySelector('.back').style.setProperty('--face', `url("${front.getAttribute('src')}")`)
})
const setFlipped = (on) => coins.forEach((c) => c.classList.toggle('flipped', on))

// hover is judged against the coins' resting boxes (measured while flat), not the
// moving elements — a coin turned edge-on would otherwise "leave" and flip back
let coinBoxes = []
function measureCoins() {
  if (coins.some((c) => c.classList.contains('flipped'))) return
  const pad = 6
  coinBoxes = coins.map((c) => {
    const r = c.getBoundingClientRect()
    return { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad }
  })
}
const overCoins = (x, y) => coinBoxes.some((b) => x >= b.l && x <= b.r && y >= b.t && y <= b.b)
measureCoins()
window.addEventListener('resize', () => { setFlipped(false); setTimeout(measureCoins, 50) })
window.addEventListener('load', measureCoins)
window.addEventListener('pointermove', (e) => {
  if (editing || e.pointerType === 'touch') return
  setFlipped(overCoins(e.clientX, e.clientY))
})
// touch: tap toggles
coins.forEach((coin) => coin.addEventListener('click', () => {
  if (editing) return
  if (matchMedia('(hover: none)').matches) setFlipped(!coin.classList.contains('flipped'))
}))

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
  // the bands slide opposite to the pointer, like light moving across metal, and the
  // gradient tilts with it so the colours shift as well as travel
  const sx = ((1 - sheen.x) * 100 + drift * 100).toFixed(2) + '%'
  const sy = ((1 - sheen.y) * 100 - drift * 60).toFixed(2) + '%'
  const ang = (115 + (sheen.y - 0.5) * 70 + (sheen.x - 0.5) * 30 + drift * 40).toFixed(2) + 'deg'
  const px = sheen.x * innerWidth, py = sheen.y * innerHeight
  for (const c of coins) {
    c.style.setProperty('--sx', sx)
    c.style.setProperty('--sy', sy)
    c.style.setProperty('--ang', ang)
    // tilt toward the pointer (used by the diamond back): up to ±8° based on where the
    // pointer sits relative to this piece's centre
    {
      const r = c.getBoundingClientRect()
      const dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 2)))
      const dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 2)))
      c.style.setProperty('--ty', (-dx * 8).toFixed(2) + 'deg')
      c.style.setProperty('--tx', (dy * 8).toFixed(2) + 'deg')
    }
  }
  requestAnimationFrame(glisten)
})(performance.now())



// ————— film grain: animated static over the whole site (Virgil Abloh archive style).
// a handful of noise frames are rendered once at half resolution, then cycled at a
// film-like rate with a random nudge so the loop never reads as a pattern —————
{
  const GRAIN_SCALE = 0.5    // canvas pixels per screen pixel (pixelated up by CSS)
  const GRAIN_FRAMES = 12    // pre-rendered frames in the loop
  const GRAIN_FPS = 14       // how fast the static flickers
  const canvas = document.getElementById('grain')
  const ctx = canvas.getContext('2d', { alpha: true })
  let frames = []
  let w = 0, h = 0

  function buildFrames() {
    w = Math.max(1, Math.round(innerWidth * GRAIN_SCALE))
    h = Math.max(1, Math.round(innerHeight * GRAIN_SCALE))
    canvas.width = w
    canvas.height = h
    frames = []
    for (let f = 0; f < GRAIN_FRAMES; f++) {
      const img = ctx.createImageData(w, h)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        // two randoms summed: softer, more film-like distribution than flat noise
        const v = (Math.random() + Math.random()) * 127.5
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = 255
      }
      frames.push(img)
    }
  }

  let last = 0, idx = 0
  function tick(now) {
    if (now - last >= 1000 / GRAIN_FPS) {
      last = now
      idx = (idx + 1 + Math.floor(Math.random() * 3)) % frames.length   // skip around, no visible loop
      ctx.putImageData(frames[idx], Math.floor(Math.random() * 6) - 3, Math.floor(Math.random() * 6) - 3)
    }
    requestAnimationFrame(tick)
  }

  buildFrames()
  let resizeT
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(buildFrames, 150) })
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) ctx.putImageData(frames[0], 0, 0)
  else requestAnimationFrame(tick)
}


// ————— iPod: hover the star → it slides up from the bottom-right corner (GTA phone style).
// the click wheel's MENU / ⏮ / ⏭ / ▶⏸ / centre are real buttons, and the mouse wheel
// over the iPod scrolls through the playlist. snippets come from playlist.json —————
{
  const ipod = $('ipod')
  const star = $('star')
  const audio = $('ipod-audio')
  let tracks = []
  let playlistName = 'playlist'
  let cur = 0        // the track on the Now Playing screen
  let pick = 0       // the highlighted row in the MENU list
  let snippetEnd = null

  // ——— show / hide: up while the pointer is on the star or the iPod itself ———
  let hideT
  const up = () => { clearTimeout(hideT); ipod.classList.add('up'); ipod.setAttribute('aria-hidden', 'false') }
  const down = () => { hideT = setTimeout(() => { ipod.classList.remove('up'); ipod.setAttribute('aria-hidden', 'true') }, 450) }
  for (const el of [star, ipod]) {
    el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') up() })
    el.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') down() })
  }
  // touch (no hover): tapping the star or the peeking iPod raises it; tapping anywhere else lowers it
  const touchUI = () => matchMedia('(hover: none)').matches
  const lower = () => { ipod.classList.remove('up'); ipod.setAttribute('aria-hidden', 'true') }
  star.addEventListener('click', (e) => {
    if (editing || !touchUI()) return
    e.preventDefault(); e.stopPropagation()
    ipod.classList.contains('up') ? lower() : up()
  })
  ipod.addEventListener('click', (e) => {
    if (!touchUI()) return
    e.stopPropagation()
    if (!ipod.classList.contains('up')) up()
  })
  document.addEventListener('click', () => { if (touchUI() && ipod.classList.contains('up')) lower() })

  // ——— screen ———
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const snippetLength = (t) => (t.end ?? audio.duration ?? 0) - (t.start || 0)
  function renderNow() {
    const t = tracks[cur]
    $('ipod-count').textContent = tracks.length ? `${cur + 1} of ${tracks.length}` : '0 of 0'
    $('ipod-song').textContent = t?.title || '—'
    $('ipod-artist').textContent = t?.artist || ''
    $('ipod-album').textContent = t?.album || ''
    $('ipod-art').style.backgroundImage = t?.art ? `url("${t.art}")` : ''
    renderTime()
  }
  function renderTime() {
    const t = tracks[cur]
    const len = t ? Math.max(0, snippetLength(t) || 0) : 0
    const pos = t && !audio.paused ? Math.max(0, audio.currentTime - (t.start || 0)) : (audio.src && t ? Math.max(0, audio.currentTime - (t.start || 0)) : 0)
    $('ipod-fill').style.width = len ? `${Math.min(100, (pos / len) * 100)}%` : '0%'
    $('ipod-el').textContent = mmss(pos)
    $('ipod-rem').textContent = '-' + mmss(Math.max(0, len - pos))
    $('ipod-state').textContent = audio.paused ? '▶' : '‖'   // ▶ / ‖
  }
  function renderList() {
    const list = $('ipod-list')
    list.innerHTML = tracks.map((t, i) =>
      `<li class="${i === pick ? 'on' : ''} ${i === cur && !audio.paused ? 'playing' : ''}"><span>${t.title}</span></li>`).join('')
    // keep the highlighted row in view (6 rows fit)
    const rowH = list.firstElementChild?.offsetHeight || 0
    const visible = Math.max(1, Math.floor(list.clientHeight / (rowH || 1)))
    list.scrollTop = Math.max(0, (pick - visible + 1) * rowH)
  }
  const render = () => { renderNow(); renderList() }

  // ——— playback: each track is a snippet [start, end] of its file ———
  function load(i, autoplay) {
    cur = (i + tracks.length) % tracks.length
    pick = cur
    const t = tracks[cur]
    audio.pause()
    snippetEnd = t.end ?? null
    if (t.src) {
      audio.src = t.src
      audio.currentTime = 0
      audio.load()
      const seek = () => { audio.currentTime = t.start || 0; if (autoplay) play() }
      audio.addEventListener('loadedmetadata', seek, { once: true })
    } else {
      audio.removeAttribute('src')
    }
    render()
  }
  // the site's own music ducks while a snippet plays, and comes back after
  let duckedSite = false
  function play() {
    if (!tracks[cur]?.src) return
    if (!bg.muted) { bg.muted = true; duckedSite = true; setSoundLabel() }
    audio.play().catch(() => {})
  }
  function pause() {
    audio.pause()
    if (duckedSite) { bg.muted = false; duckedSite = false; setSoundLabel() }
  }
  const toggle = () => (audio.paused ? play() : pause())
  audio.addEventListener('timeupdate', () => {
    if (snippetEnd != null && audio.currentTime >= snippetEnd) load(cur + 1, true)
    else renderTime()
  })
  audio.addEventListener('ended', () => load(cur + 1, true))
  audio.addEventListener('play', render)
  audio.addEventListener('pause', render)

  // ——— controls ———
  const act = {
    menu: () => {
      const inMenu = ipod.classList.toggle('menu')
      $('ipod-bar-title').textContent = inMenu ? playlistName : 'Now Playing'
      pick = cur; render()
    },
    prev: () => load(cur - 1, !audio.paused),
    next: () => load(cur + 1, !audio.paused),
    play: toggle,
    select: () => {
      if (ipod.classList.contains('menu')) { ipod.classList.remove('menu'); $('ipod-bar-title').textContent = 'Now Playing'; load(pick, true) }
      else toggle()
    },
  }
  ipod.querySelectorAll('.ipod-wheel button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); act[b.dataset.k]() }))
  // mouse wheel = click wheel: in the MENU it moves the highlight, otherwise it skips tracks
  let wheelAcc = 0
  ipod.addEventListener('wheel', (e) => {
    e.preventDefault()
    wheelAcc += e.deltaY
    if (Math.abs(wheelAcc) < 40) return
    const d = wheelAcc > 0 ? 1 : -1
    wheelAcc = 0
    if (!tracks.length) return
    if (ipod.classList.contains('menu')) { pick = (pick + d + tracks.length) % tracks.length; renderList() }
    else load(cur + d, !audio.paused)
  }, { passive: false })

  fetch('playlist.json')
    .then((r) => r.json())
    .then(({ name, tracks: list }) => { playlistName = name || 'playlist'; tracks = list; if (tracks.length) load(0, false); else render() })
    .catch(() => { $('ipod-song').textContent = 'playlist.json not found' })
}


// ————— backgrounds easter egg: clicking custom_built_backgrounds.pol cycles the theme.
// a theme = a tiled background + a recoloured copy of some overlays (media/overlay/<theme>/).
// the new scene is drawn on a canvas and digitizes in cell by cell over the old one —————
const THEMES = [
  { name: 'video' },   // the original: the video + the original overlay colours
  { name: 'gingham-green', tile: 'media/bg/gingham-green.webp', tileSize: 440, backFirst: true,   // backFirst: the coin rests on its back (diamond)
    ipod: 'media/ipod-teal.png',   // the iPod's shell in the theme's cyan
    overlays: ['title-ian', 'title-ludwig', 'custom-bar', 'k-lines', 'asterisks', 'jp-subtitle', 'jp-vertical'] },
]
{
  const OVERLAY_IDS = ['k-lines', 'title-ian', 'title-ludwig', 'asterisks', 'page-pill', 'jp-subtitle', 'exclusive-feed', 'jp-vertical', 'newyork2', 'barcode', 'star', 'custom-bar']
  const fx = $('theme-fx')
  const bgImage = $('bg-image')
  const tree = document.querySelector('.tree')
  let current = 0
  let busy = false
  const srcFor = (theme, id) => (theme.overlays?.includes(id) ? `media/overlay/${theme.name}/${id}.png` : `media/overlay/${id}.png`)
  const imgOf = (id) => document.querySelector(`#${id} img.front`) || document.getElementById(id)   // coins hold their image inside
  const load = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src })
  const decoded = (im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())

  // every theme's images are fetched + decoded in the background after load, so a click starts instantly
  const assets = new Map()
  const assetsFor = (theme) => {
    if (!assets.has(theme.name)) {
      assets.set(theme.name, (async () => {
        const [tile, gem, ipodImg, ...list] = await Promise.all([theme.tile ? load(theme.tile) : null, theme.backFirst ? load('media/diamond.jpg') : null, load(theme.ipod || 'media/ipod.png'), ...OVERLAY_IDS.map((id) => load(srcFor(theme, id)))])
        await Promise.all([tile, gem, ipodImg, ...list].filter(Boolean).map(decoded))
        return { tile, gem, ipodImg, imgs: Object.fromEntries(OVERLAY_IDS.map((id, k) => [id, list[k]])) }
      })())
    }
    return assets.get(theme.name)
  }
  addEventListener('load', () => setTimeout(() => THEMES.forEach(assetsFor), 1500))

  // the live text (nav) is coloured by style.css per body.theme-<name>
  const setThemeClass = (theme) => {
    for (const t of THEMES) document.body.classList.remove(`theme-${t.name}`)
    document.body.classList.add(`theme-${theme.name}`)
  }
  function apply(theme) {
    for (const id of OVERLAY_IDS) {
      const img = imgOf(id); const src = srcFor(theme, id)
      if (img.getAttribute('src') !== src) img.setAttribute('src', src)
      // the coins' metallic back is a mask of the front: keep it in sync
      document.querySelector(`#${id} .back`)?.style.setProperty('--face', `url("${src}")`)
    }
    // a back-first theme inverts the coin's resting side; mute the flip transition for this
    // swap so the canvas hand-off is a cut, not a rotation
    coins.forEach((c) => { c.style.transition = 'none' })
    setThemeClass(theme)
    requestAnimationFrame(() => requestAnimationFrame(() => coins.forEach((c) => { c.style.transition = '' })))
    document.querySelector('#ipod .ipod-body').setAttribute('src', theme.ipod || 'media/ipod.png')
    if (theme.tile) {
      bgImage.style.backgroundImage = `url("${theme.tile}")`
      bgImage.style.backgroundSize = `${theme.tileSize}px`
      document.body.classList.add('themed')
    } else {
      document.body.classList.remove('themed')
    }
  }

  // a coin's resting side on a back-first theme: the diamond, cut to the artwork, with its rim lights —
  // matches style.css (.coin .back on that theme) so the hand-off is seamless
  const COIN_IDS = ['k-lines', 'title-ian', 'title-ludwig']
  const FACET_UNITS = 23.4   // background-size of the facets, in design units (as in style.css)
  function drawCoinBack(ctx, img, r, dpr, gem) {
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr))
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h
    const t = tmp.getContext('2d')
    const rim = 0.12 * unit() * dpr
    const stamp = (fill, dx, dy) => {
      t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, w, h); t.drawImage(img, 0, 0, w, h)
      t.globalCompositeOperation = 'source-in'; t.fillStyle = fill; t.fillRect(0, 0, w, h)
      ctx.drawImage(tmp, r.left * dpr + dx, r.top * dpr + dy)
    }
    stamp('#ffffff', -rim, -rim)
    stamp('#9a9ab0', rim, rim)
    const tileW = FACET_UNITS * unit() * dpr
    const pat = t.createPattern(gem, 'repeat')
    pat.setTransform(new DOMMatrix().translate((w - tileW) / 2, (h - tileW * gem.height / gem.width) / 2).scale(tileW / gem.width))
    stamp(pat, 0, 0)
  }

  // the incoming scene: background (tile, or the live video frame) + every overlay at its on-screen box
  function drawScene(ctx, W, H, dpr, theme, tile, pat, imgs, gem, ipodImg) {
    if (tile) {
      ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H)
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
      const vw = bg.videoWidth, vh = bg.videoHeight
      if (vw && vh) {   // object-fit: cover
        const s = Math.max(W / vw, H / vh)
        ctx.drawImage(bg, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s)
      }
    }
    for (const id of OVERLAY_IDS) {
      const r = document.getElementById(id).getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (theme.backFirst && gem && COIN_IDS.includes(id)) drawCoinBack(ctx, imgs[id], r, dpr, gem)
      else ctx.drawImage(imgs[id], r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr)
    }
    // the iPod's shell in the new theme's colour, wherever it currently sits (tucked or raised)
    if (ipodImg) {
      const r = document.querySelector('#ipod .ipod-body').getBoundingClientRect()
      if (r.width && r.top < innerHeight) ctx.drawImage(ipodImg, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr)
    }
  }

  async function switchTheme(i) {
    if (busy) return
    busy = true
    const theme = THEMES[i]
    try {
      const { tile, imgs, gem, ipodImg } = await assetsFor(theme)
      document.body.classList.add('switching')
      const dpr = Math.min(devicePixelRatio || 1, 2)   // match the page exactly, so nothing shifts when the canvas comes away
      const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr)
      fx.width = W; fx.height = H
      const scene = document.createElement('canvas'); scene.width = W; scene.height = H
      const mask = document.createElement('canvas'); mask.width = W; mask.height = H
      const sctx = scene.getContext('2d'), mctx = mask.getContext('2d'), ctx = fx.getContext('2d')
      let pat = null
      if (tile) {
        pat = sctx.createPattern(tile, 'repeat')
        // same placement as CSS `background-position: center`: a tile is centred on the screen
        const ts = theme.tileSize * dpr
        pat.setTransform(new DOMMatrix().translate(W / 2 - ts / 2, H / 2 - ts / 2).scale(ts / tile.width))
      }
      // same clock as the sheets' mosaic: a left→right sweep with noise, each cell popping in
      const cols = MOSAIC_COLS, rows = Math.max(1, Math.round(cols * (H / W)))
      const cw = W / cols, ch = H / rows
      const at = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) at[r * cols + c] = (c / cols) * MOSAIC_SWEEP + Math.random() * MOSAIC_NOISE
      // the nav sits above the canvas, so its colour flips the moment the sweep reaches it
      const navAt = (tree.getBoundingClientRect().left / innerWidth) * MOSAIC_SWEEP + MOSAIC_NOISE * 0.5
      let navDone = false
      if (tile) drawScene(sctx, W, H, dpr, theme, tile, pat, imgs, gem, ipodImg)   // static scene: draw once
      fx.classList.add('on')
      await new Promise((done) => {
        const t0 = performance.now()
        const frame = (now) => {
          const t = (now - t0) / 1000
          if (!tile) drawScene(sctx, W, H, dpr, theme, tile, pat, imgs, gem, ipodImg)   // live video frame: redraw
          mctx.clearRect(0, 0, W, H); mctx.fillStyle = '#000'
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const k = (t - at[r * cols + c]) / MOSAIC_POP
            if (k <= 0) continue
            mctx.globalAlpha = k >= 1 ? 1 : k
            mctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5)
          }
          mctx.globalAlpha = 1
          ctx.globalCompositeOperation = 'source-over'
          ctx.clearRect(0, 0, W, H); ctx.drawImage(scene, 0, 0)
          ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0)
          if (!navDone && t >= navAt) { navDone = true; setThemeClass(theme) }
          if (t < MOSAIC_TOTAL) requestAnimationFrame(frame); else done()
        }
        requestAnimationFrame(frame)
      })
      apply(theme)
      current = i
      // keep the canvas up until the swapped-in overlays have decoded and painted (no blank flash)
      await Promise.all(OVERLAY_IDS.map((id) => decoded(imgOf(id))))
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    } catch (e) {
      apply(theme); current = i   // if an image fails to load, just switch without the effect
    } finally {
      fx.classList.remove('on')
      fx.getContext('2d').clearRect(0, 0, fx.width, fx.height)
      document.body.classList.remove('switching')
      busy = false
    }
  }

  // clicking custom_built_backgrounds.pol or the WEBSITE_COLORWAYS nav item steps to the next theme
  const nextTheme = (e) => {
    if (editing) return
    e.preventDefault(); e.stopPropagation()
    switchTheme((current + 1) % THEMES.length)
  }
  $('custom-bar').addEventListener('click', nextTheme)
  document.querySelector('.tree a.colorways-link')?.addEventListener('click', nextTheme)
}

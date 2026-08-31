// ————— video: fade in, try to start with sound, fall back to muted —————
const bg = document.getElementById('bg')
const soundBtn = document.getElementById('sound')

bg.addEventListener('canplay', () => bg.classList.add('ready'), { once: true })

function setSoundLabel() {
  soundBtn.textContent = bg.muted ? 'sound off' : 'sound on'
}

bg.muted = false
bg.play().then(setSoundLabel).catch(() => {
  // autoplay with audio blocked — start muted, unmute on first interaction
  bg.muted = true
  bg.play()
  setSoundLabel()
  const unmute = () => {
    bg.muted = false
    setSoundLabel()
  }
  window.addEventListener('pointerdown', unmute, { once: true })
})

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

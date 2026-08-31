import { initPage } from './shared.js'
import { INTERVIEWS, DESIGNS } from './data.js'

initPage()

/* ——— zora triptych: three covers, reshuffled on every visit ——— */

const triptych = document.getElementById('triptych')
const picks = [...INTERVIEWS].sort(() => Math.random() - 0.5).slice(0, 3)
;[...triptych.querySelectorAll('img')].forEach((img, i) => {
  img.src = picks[i]
})

/* ——— design strip ——— */

const strip = document.getElementById('designStrip')
DESIGNS.slice(0, 4).forEach((src) => {
  const img = document.createElement('img')
  img.src = src
  img.loading = 'lazy'
  img.alt = ''
  strip.appendChild(img)
})

/* ——— hero: variable weight thins near the cursor ——— */

const heroChars = [...document.querySelectorAll('.hero-name .ch')]
if (heroChars.length && matchMedia('(pointer: fine)').matches) {
  const state = heroChars.map(() => ({ w: 600, t: 600 }))
  let raf = null

  function loop() {
    let alive = false
    heroChars.forEach((ch, i) => {
      const s = state[i]
      s.w += (s.t - s.w) * 0.14
      if (Math.abs(s.t - s.w) > 0.5) alive = true
      ch.style.fontVariationSettings = `'wght' ${s.w}`
    })
    raf = alive ? requestAnimationFrame(loop) : null
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop) }

  window.addEventListener('pointermove', (e) => {
    heroChars.forEach((ch, i) => {
      const r = ch.getBoundingClientRect()
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      state[i].t = 600 - Math.max(0, 1 - d / 160) * 320
    })
    kick()
  })
}

/* ——— email: click to copy ——— */

const email = document.getElementById('email')
const EMAIL = 'kianludwig33@gmail.com'
let copyTimer

email.addEventListener('click', () => {
  navigator.clipboard && navigator.clipboard.writeText(EMAIL)
  email.classList.add('copied')
  email.textContent = 'copied'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    email.classList.remove('copied')
    email.textContent = EMAIL
  }, 2000)
})

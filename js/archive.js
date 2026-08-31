import { initPage } from './shared.js'
import { INTERVIEWS } from './data.js'

const lenis = initPage()

/* ——— grid ——— */

const grid = document.getElementById('grid')
const count = document.getElementById('count')
count.textContent = `( ${INTERVIEWS.length} and counting )`

INTERVIEWS.forEach((src, i) => {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.setAttribute('aria-label', `interview ${i + 1}`)
  const img = document.createElement('img')
  img.src = src
  img.loading = 'lazy'
  img.alt = ''
  btn.appendChild(img)
  btn.addEventListener('click', () => openLightbox(src))
  grid.appendChild(btn)
})

// stagger the tiles in as they enter the viewport
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const el = entry.target
      el.style.setProperty('--d', `${(el._wave = (el._wave ?? waveIndex++)) % 8 * 0.05}s`)
      el.classList.add('on')
      io.unobserve(el)
    })
  },
  { threshold: 0.1 }
)
let waveIndex = 0
;[...grid.children].forEach((el) => io.observe(el))

/* ——— lightbox ——— */

const lightbox = document.getElementById('lightbox')
const lightboxImg = document.getElementById('lightboxImg')

function openLightbox(src) {
  lightboxImg.src = src
  lightbox.hidden = false
  void lightbox.offsetHeight // flush styles so the fade actually transitions
  lightbox.classList.add('on')
  lenis.stop()
}

function closeLightbox() {
  lightbox.classList.remove('on')
  lenis.start()
  setTimeout(() => { lightbox.hidden = true }, 300)
}

lightbox.addEventListener('click', closeLightbox)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox()
})

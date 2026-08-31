// shared: nav tree, lightbox, info overlay
import { ROOT, NAV } from './data.js'

export const src = (p) => ROOT + p

export function renderNav(mount, { onCatHover, onCatClick } = {}) {
  mount.innerHTML = `
    <a class="wordmark" href="index.html">kian ludwig<br>mahd soltani</a>
    <p class="role">creative producer &amp; editor — nyc</p>
    <ul class="nav-tree">
      ${NAV.map(
        (b) => `
        <li class="nav-branch" data-cat="${b.cat}">
          <span class="nav-cat">${b.label}</span>
          <ul class="nav-sub">${b.children.map((c) => `<li>${c}</li>`).join('')}</ul>
        </li>`
      ).join('')}
    </ul>
    <p class="nav-foot">
      <a href="archive.html">archive</a><span class="sep">/</span><button type="button" data-info>info</button>
    </p>`

  mount.querySelectorAll('.nav-branch').forEach((br) => {
    const cat = br.dataset.cat
    br.addEventListener('mouseenter', () => onCatHover && onCatHover(cat))
    br.addEventListener('mouseleave', () => onCatHover && onCatHover(null))
    br.querySelector('.nav-cat').addEventListener('click', () => {
      if (onCatClick) onCatClick(cat)
      else location.href = `archive.html#${cat}`
    })
  })
  mount.querySelector('[data-info]').addEventListener('click', openInfo)
}

// ————— lightbox —————
let boxItems = []
let boxIdx = 0
const box = document.createElement('div')
box.className = 'box'
box.innerHTML = `
  <div class="bmedia"></div>
  <p class="bcap"></p>
  <button class="bclose" aria-label="close">✕</button>
  <button class="bprev" aria-label="previous">←</button>
  <button class="bnext" aria-label="next">→</button>`
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(box))

function renderBox() {
  const it = boxItems[boxIdx]
  const media = box.querySelector('.bmedia')
  if (it.video) media.innerHTML = `<video src="${src(it.video)}" controls autoplay loop playsinline></video>`
  else if (it.src) media.innerHTML = `<img src="${src(it.src)}" alt="${it.title}">`
  else media.innerHTML = `<div class="bcard"><span class="c1">${it.card[0]}</span>${it.card.slice(1).map((l) => `<span class="dim">${l}</span>`).join('')}</div>`
  box.querySelector('.bcap').innerHTML =
    `${it.title} <span class="m">· ${it.meta}</span>` +
    (it.link ? ` <a href="${it.link}" target="_blank" rel="noopener">visit ↗</a>` : '')
}
export function openBox(items, idx) {
  boxItems = items
  boxIdx = idx
  renderBox()
  box.classList.add('open')
}
const step = (d) => {
  if (!boxItems.length) return
  boxIdx = (boxIdx + d + boxItems.length) % boxItems.length
  renderBox()
}
box.addEventListener('click', (e) => {
  if (e.target.closest('.bprev')) return step(-1)
  if (e.target.closest('.bnext')) return step(1)
  if (e.target.closest('.bclose') || !e.target.closest('img, video, .bcard, .bcap')) {
    box.classList.remove('open')
    box.querySelector('.bmedia').innerHTML = ''
  }
})
document.addEventListener('keydown', (e) => {
  if (box.classList.contains('open')) {
    if (e.key === 'Escape') { box.classList.remove('open'); box.querySelector('.bmedia').innerHTML = '' }
    if (e.key === 'ArrowLeft') step(-1)
    if (e.key === 'ArrowRight') step(1)
  } else if (e.key === 'Escape') {
    info.classList.remove('open')
  }
})

// ————— info overlay —————
const info = document.createElement('div')
info.className = 'info'
info.innerHTML = `
  <div>
    <p class="bio">i produce, cut and shape things people actually watch — leading video at zora,
    editing figma's first original series, and building my own corners of the internet along the way.</p>
    <p class="links">
      <button class="email" type="button">kianludwig33@gmail.com</button>
      <a href="https://www.linkedin.com/in/kianludwig" target="_blank" rel="noopener">linkedin</a>
    </p>
  </div>
  <button class="iclose" aria-label="close">✕</button>`
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(info))

export function openInfo() { info.classList.add('open') }
info.addEventListener('click', (e) => {
  const em = e.target.closest('.email')
  if (em) {
    navigator.clipboard.writeText(em.textContent.trim()).then(() => {
      em.classList.add('copied')
      const t = em.textContent
      em.textContent = 'copied'
      setTimeout(() => { em.classList.remove('copied'); em.textContent = t }, 1200)
    })
    return
  }
  if (e.target.closest('.iclose') || !e.target.closest('.bio, .links')) info.classList.remove('open')
})

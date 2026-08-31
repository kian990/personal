import { ITEMS, HOME_LAYOUT } from './data.js'
import { renderNav, openBox, src } from './app.js'

const field = document.getElementById('field')
const homeItems = HOME_LAYOUT.map((slot) => ({ ...ITEMS[slot.id], slot }))

// scatter the field
homeItems.forEach((it, i) => {
  const el = document.createElement('div')
  el.className = `item ${it.src || it.video ? '' : 'card'}`
  el.dataset.cat = it.cat
  el.style.left = it.slot.x + '%'
  el.style.top = it.slot.y + '%'
  el.style.width = it.slot.w
  el.style.zIndex = it.slot.z
  if (it.video) el.innerHTML = `<video src="${src(it.video)}" muted loop autoplay playsinline></video>`
  else if (it.src) el.innerHTML = `<img src="${src(it.src)}" loading="lazy" alt="${it.title}">`
  else el.innerHTML = `<span class="c1">${it.card[0]}</span>${it.card.slice(1).map((l) => `<span class="dim">${l}</span>`).join('')}`
  el.insertAdjacentHTML('beforeend', `<p class="cap">${it.title} <span class="m">· ${it.meta}</span></p>`)
  el.addEventListener('click', () => openBox(homeItems, i))
  field.insertBefore(el, field.querySelector('.fieldnote'))
})

// nav hover → blur everything outside the category
renderNav(document.getElementById('nav'), {
  onCatHover(cat) {
    if (cat) {
      document.body.dataset.focus = cat
      field.querySelectorAll('.item').forEach((el) => el.classList.toggle('match', el.dataset.cat === cat))
    } else {
      delete document.body.dataset.focus
      field.querySelectorAll('.item.match').forEach((el) => el.classList.remove('match'))
    }
  },
})

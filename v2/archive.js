import { ITEMS, NAV } from './data.js'
import { renderNav, openBox, src } from './app.js'

renderNav(document.getElementById('nav'))

const grid = document.getElementById('grid')
const indexTable = document.getElementById('index')
const bar = document.getElementById('bar')
const thumb = document.getElementById('floatThumb')

let cat = (location.hash || '').slice(1) || 'all'
if (!NAV.some((b) => b.cat === cat)) cat = 'all'
let view = 'grid'

bar.innerHTML =
  ['all', ...NAV.map((b) => b.cat)].map((c) => `<button data-cat="${c}">${c}</button>`).join('') +
  `<span class="spacer"></span>` +
  ['grid', 'index'].map((v) => `<button data-view="${v}">${v}</button>`).join('')

bar.addEventListener('click', (e) => {
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.cat) { cat = b.dataset.cat; history.replaceState(null, '', cat === 'all' ? '#' : '#' + cat) }
  if (b.dataset.view) view = b.dataset.view
  render()
})

function filtered() {
  return cat === 'all' ? ITEMS : ITEMS.filter((it) => it.cat === cat)
}

function render() {
  bar.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', b.dataset.cat === cat))
  bar.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === view))
  const items = filtered()

  grid.hidden = view !== 'grid'
  indexTable.hidden = view !== 'index'

  if (view === 'grid') {
    grid.innerHTML = items
      .map((it, i) => `
        <div class="g" data-i="${i}">
          ${it.src
            ? `<img src="${src(it.src)}" loading="lazy" alt="${it.title}">`
            : `<div class="gcard"><span class="c1">${it.card[0]}</span>${it.card.slice(1).map((l) => `<span class="dim">${l}</span>`).join('')}</div>`}
          <p class="cap">${it.title} <span class="m">· ${it.meta}</span></p>
        </div>`)
      .join('')
  } else {
    indexTable.innerHTML = items
      .map((it, i) => `
        <tr data-i="${i}">
          <td class="no">${String(i + 1).padStart(3, '0')}</td>
          <td class="ti">${it.title}</td>
          <td class="ty">${it.cat}</td>
          <td class="yr">${it.year}</td>
        </tr>`)
      .join('')
  }
}

grid.addEventListener('click', (e) => {
  const g = e.target.closest('.g')
  if (g) openBox(filtered(), +g.dataset.i)
})
indexTable.addEventListener('click', (e) => {
  const tr = e.target.closest('tr')
  if (tr) openBox(filtered(), +tr.dataset.i)
})

// floating thumbnail over index rows
indexTable.addEventListener('mousemove', (e) => {
  const tr = e.target.closest('tr')
  const it = tr && filtered()[+tr.dataset.i]
  if (it && it.src) {
    thumb.innerHTML = `<img src="${src(it.src)}" alt="">`
    thumb.style.display = 'block'
    thumb.style.left = Math.min(e.clientX + 20, innerWidth - 200) + 'px'
    thumb.style.top = Math.min(e.clientY + 16, innerHeight - 240) + 'px'
  } else {
    thumb.style.display = 'none'
  }
})
indexTable.addEventListener('mouseleave', () => (thumb.style.display = 'none'))

render()

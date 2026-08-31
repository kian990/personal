import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.3.11/+esm'

// split text into per-character spans for the staggered rise-in
export function splitChars(el) {
  const text = el.textContent
  el.textContent = ''
  el.classList.add('split')
  ;[...text].forEach((c, i) => {
    const s = document.createElement('span')
    s.className = 'ch'
    s.style.setProperty('--i', i)
    s.textContent = c === ' ' ? ' ' : c
    el.appendChild(s)
  })
  return [...el.querySelectorAll('.ch')]
}

export function initPage() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  })
  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  // same-page anchors glide instead of jump
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { duration: 1.3 })
    })
  })

  document.querySelectorAll('[data-split]').forEach(splitChars)

  document.querySelectorAll('.year').forEach((el) => {
    el.textContent = new Date().getFullYear()
  })

  // scroll reveals — css transitions, .on flips once
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.25, rootMargin: '0px 0px -5% 0px' }
  )
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

  return lenis
}

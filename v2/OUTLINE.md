# site redesign — outline

one sentence: a scattered visual field (kanakis clutter) floating in a lot of white
(minimalism), navigated by a text-tree in the corner where blur is the only effect
on the whole site (betiana).

## rules (what keeps it balanced)

1. **white ground, black mono text, no boxes, no borders, no color except the images.**
2. **blur is the only effect.** no fades to color, no parallax, no cursor gimmicks.
   - nav: resting state light grey; hovering one branch blurs the sibling branches.
   - field: hovering a nav category blurs every item NOT in that category —
     the nav becomes a way of *seeing*, not just clicking.
   - archive grid: images rest slightly blurred, sharpen on hover (the betiana moment).
3. **clutter is intentional, not random.** items are hand-placed in clusters with
   overlaps, like a table covered in prints — but the edges of the page stay empty.
4. **two typefaces only:** Inter Tight (name / big moments), IBM Plex Mono (everything else).
5. **text overlaps images** (kanakis) — the selected-works list and credits sit ON the
   collage, not beside it.

## pages

### 1. index — "the field"
- fixed nav tree, top-left (betiana structure):
  [VIDEO] / [INTERVIEWS] / [DESIGN] / [SITES] / [PERSONAL] + ARCHIVE + INFO
- a tall scrolling canvas (~3 viewport heights) of ~25 hand-placed items:
  interview stills, graphics, video stills, screenshots, all categories mixed.
- hover an item → it lifts above the others + a small mono caption appears.
- click an item → fullscreen white lightbox (arrow keys / swipe to move through).
- two small text blocks overlap the collage: selected works, credits/roles.
- ends on a single big "ARCHIVE ↗" in empty space.

### 2. archive — "the index"
- same nav. filter row: ALL / VIDEO / INTERVIEWS / DESIGN / SITES / PERSONAL.
- two views, toggle top-right:
  - GRID: masonry columns, images blurred at rest → sharp on hover, caption under cursor.
  - INDEX: a plain mono table (no. / title / type / year); hovering a row floats
    its thumbnail next to the cursor.
- click → same lightbox.

### 3. info — overlay, not a page
- short bio, email (click to copy), linkedin. white panel over whatever you were on.

## data model (how you add things)

everything lives in `v2/data.js`. one entry per piece:

```js
{ src: 'images/…jpg',        // or video: 'videos/…mp4' for loops
  cat: 'interviews',          // video | interviews | design | sites | personal
  title: 'zora interview — …',
  meta: 'shot, cut & posted · 2025',
  year: 2025 }
```

- adding to the ARCHIVE = add an entry to ITEMS. it appears in grid + index automatically.
- adding to the HOME field = add its index + a position to HOME_LAYOUT (x %, y %, width, z).
- videos: give an entry a `video:` path and it renders as a muted autoplaying loop
  in the field, full player in the lightbox.

## still to collect (slots already reserved)

- source material (figma) — key stills / trailer loop
- asspizza × whop — video still or loop
- lord sko — stills + graphics
- pass the butter — anything visual
- personal photos/videos beyond the one untitled image
- real titles for the zora interviews (currently numbered)

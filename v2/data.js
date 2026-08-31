// one entry per piece. add here and it shows up in the archive automatically.
// cat: video | interviews | design | sites | personal
// src: image path (relative to repo root) · video: mp4 path for loops · neither: text card
// title/meta: shown in captions, the index view and the lightbox

export const ROOT = '../' // v2 lives one level down; set to '' when promoted to root

const zora = (file, n) => ({
  src: `images/zora/${file}`,
  cat: 'interviews',
  title: `zora interview ${String(n + 1).padStart(3, '0')}`,
  meta: 'shot, cut & posted · 2025 — 26',
  year: 2025,
})

const rogue = (file, n) => ({
  src: `images/rogue/${file}`,
  cat: 'design',
  title: `rogue garms ${String(n + 1).padStart(2, '0')}`,
  meta: 'covers, flyers & graphics · 2024 — 25',
  year: 2024,
})

export const ITEMS = [
  // — video (placeholders until footage is collected) —
  { cat: 'video', title: 'source material', meta: 'a figma original series · lead editor', year: 2026, card: ['source material', 'a figma original series', 'coming 2026'] },
  { cat: 'video', title: 'asspizza × whop', meta: 'video · 2025', year: 2025, card: ['asspizza × whop', 'video', '2025'] },
  { cat: 'video', title: 'lord sko', meta: 'video & design · ongoing', year: 2025, card: ['lord sko', 'video & design', 'ongoing'] },
  { cat: 'video', title: 'pass the butter', meta: 'producer · 2024', year: 2024, card: ['pass the butter', 'producer', '2024'] },

  // — the zora interviews —
  ...[
    '573730542_1997361691109582_9167031353185000067_n.jpg',
    '573823303_18085418608988198_4991405721870614326_n.jpg',
    '581368051_2294744501002084_3755690896246473602_n.jpg',
    '582276390_4153922058256098_624550341865062444_n.jpg',
    '587235255_1915216745733806_769031112709212031_n.jpg',
    '587764774_1112915674040364_3022953149730978724_n.jpg',
    '587802353_851981030876388_4826983702932789751_n.jpg',
    '587809664_18088610869988198_8544303872881045452_n.jpg',
    '588409485_1369243644080973_2301317583729259552_n.jpg',
    '588596926_1514101816318026_1844111341262074758_n.jpg',
    '600338562_747748081069436_3748938381383272622_n.jpg',
    '603488544_842286938701241_265808132389175868_n.jpg',
    '609431949_1568923211041257_5953863383842611774_n.jpg',
    '610690305_1265339908754574_2699792625273787704_n.jpg',
    '611279707_1620137112341260_7953893017188374957_n.jpg',
    '612236966_901841045750218_6256082055976434445_n.jpg',
    '617901919_1782698109016287_8424690308392696218_n.jpg',
    '622555584_2294205971072641_7580761961205812752_n.jpg',
    '626278594_1416419596592922_2779593305071363439_n.jpg',
    '637715024_18094862362988198_8621831933781019531_n.jpg',
    '639719705_785593024012723_4645929918260062597_n.jpg',
    '642505010_1633983874512271_3354285874051987040_n.jpg',
    '642801802_18095600098988198_1409765516851134195_n.jpg',
    '648556807_1436862037299248_5054037167974406892_n.jpg',
    '651012545_18096806560988198_5668352014503870122_n.jpg',
    '652006211_1425543628881167_3148337635942406640_n.jpg',
    '652720660_18098070706988198_189810302298414502_n.jpg',
    '654685559_869819182691170_2586190055226542134_n.jpg',
    '655666201_982076640820011_5330700687583312630_n.jpg',
    '657738754_1716957046381862_10894481889724887_n.jpg',
    '658039750_18099422941988198_1301926902526022427_n.jpg',
    '658799781_18099618010988198_1409007503395975576_n.jpg',
  ].map(zora),

  // — design —
  ...[
    '474999532_18266234206283645_4356395874176650615_n.jpg',
    '475856565_18265803052283645_7816250349134322980_n.jpg',
    '486727261_18272541715283645_3408110218896349990_n.jpg',
    '502970849_737656431950487_3692573912548087839_n.jpg',
    '503106573_710377994820579_1598140881319603759_n.jpg',
    '503132099_1266821691723849_4581364456106364341_n.jpg',
    '503173165_1734214317172677_1304032348942638362_n.jpg',
    '503306867_1228461385588103_6593268189215444176_n.jpg',
    'tiktok-thumbnail.png',
  ].map(rogue),

  // — sites —
  { src: 'images/5see/5seelanding.jpg', cat: 'sites', title: '5see.org', meta: 'independent magazine & internet social archive · founder, designer, developer', year: 2025, link: 'https://5see.org' },

  // — personal —
  { src: 'images/untitled/652743358_17859634380669300_6634669781551792480_n.jpg', cat: 'personal', title: 'untitled', meta: 'videos, photos & experiments · ongoing', year: 2025 },
]

// give every item a stable id (its position in ITEMS)
ITEMS.forEach((it, i) => (it.id = i))

// ————————————————————————————————————————————————————————————————
// the home field: hand-placed. each slot: id of an ITEMS entry +
// x/y as % of the field canvas, w as a css width, z for stacking.
// tune freely — this is the "clutter" and it's meant to be arranged by hand.
// ————————————————————————————————————————————————————————————————
export const HOME_LAYOUT = [
  // cluster A — top
  { id: 5,  x: 27, y: 1.5, w: 'clamp(180px, 21vw, 340px)', z: 3 },
  { id: 40, x: 44, y: 4.5, w: 'clamp(150px, 15vw, 250px)', z: 4 },   // rogue
  { id: 12, x: 60, y: 2.0, w: 'clamp(150px, 16vw, 270px)', z: 2 },
  { id: 0,  x: 79, y: 6.5, w: 'clamp(180px, 15vw, 260px)', z: 5 },   // source material card
  { id: 20, x: 22, y: 12,  w: 'clamp(110px, 10vw, 180px)', z: 5 },

  // cluster B
  { id: 45, x: 52, y: 19,  w: 'clamp(240px, 27vw, 460px)', z: 2 },   // 5see landing
  { id: 8,  x: 38, y: 23,  w: 'clamp(130px, 14vw, 230px)', z: 3 },
  { id: 37, x: 79, y: 25,  w: 'clamp(120px, 12vw, 200px)', z: 3 },   // rogue
  { id: 25, x: 20, y: 29,  w: 'clamp(160px, 17vw, 290px)', z: 2 },
  { id: 1,  x: 85, y: 36,  w: 'clamp(150px, 12vw, 210px)', z: 4 },   // asspizza card

  // cluster C
  { id: 41, x: 29, y: 40,  w: 'clamp(180px, 19vw, 320px)', z: 2 },   // rogue
  { id: 16, x: 50, y: 43,  w: 'clamp(120px, 13vw, 220px)', z: 3 },
  { id: 30, x: 66, y: 39,  w: 'clamp(150px, 16vw, 270px)', z: 2 },
  { id: 46, x: 21, y: 51,  w: 'clamp(120px, 12vw, 200px)', z: 3 },   // personal
  { id: 39, x: 84, y: 47,  w: 'clamp(100px, 10vw, 170px)', z: 3 },   // rogue

  // cluster D
  { id: 28, x: 38, y: 58,  w: 'clamp(210px, 23vw, 380px)', z: 2 },
  { id: 42, x: 62, y: 63,  w: 'clamp(140px, 14vw, 240px)', z: 3 },   // rogue
  { id: 18, x: 77, y: 69,  w: 'clamp(110px, 12vw, 200px)', z: 2 },
  { id: 33, x: 23, y: 65,  w: 'clamp(120px, 12vw, 200px)', z: 2 },
  { id: 2,  x: 30, y: 74,  w: 'clamp(170px, 14vw, 240px)', z: 4 },   // lord sko card

  // cluster E — bottom
  { id: 36, x: 48, y: 80,  w: 'clamp(150px, 16vw, 270px)', z: 2 },   // rogue
  { id: 10, x: 33, y: 85,  w: 'clamp(130px, 13vw, 220px)', z: 3 },
  { id: 23, x: 64, y: 83,  w: 'clamp(160px, 18vw, 300px)', z: 2 },
]

export const NAV = [
  { label: '[video]',      cat: 'video',      children: ['source material', 'asspizza × whop', 'lord sko', 'pass the butter'] },
  { label: '[interviews]', cat: 'interviews', children: ['the zora interviews'] },
  { label: '[design]',     cat: 'design',     children: ['rogue garms & friends'] },
  { label: '[sites]',      cat: 'sites',      children: ['5see.org'] },
  { label: '[personal]',   cat: 'personal',   children: [] },
]

#!/usr/bin/env node
/* ==========================================================================
   Static site generator for CREATE Interior Design.
   Usage:  node build.js
   Reads data/projects.json and writes every HTML page.
   To add a project: drop its images into assets/img/orig, run
   `node optimize.js`, add an entry to data/projects.json, rebuild.
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));

const BUILD = Date.now().toString(36);   // cache-buster for css/js
const SITE = {
  name: 'CREATE Interior Architects',
  tagline: "Singapore's award-winning interior design studio",
  email: 'create1sg@gmail.com',
  phone: '+65 9105 6001',
  phoneHref: '+6591056001',
  instagram: 'https://www.instagram.com/create.interiors',
  facebook: 'https://www.facebook.com/createinteriors',
  year: new Date().getFullYear(),
};

const NAV = [
  ['Home', 'index.html'],
  ['About Us', 'about.html'],
  ['Portfolio', 'portfolio.html'],
  ['Contact Us', 'contact.html'],
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const web = (r, n) => `${r}assets/img/web/${n}.jpg`;
const thumb = (r, n) => `${r}assets/img/thumb/${n}.jpg`;
const exists = n => fs.existsSync(path.join(ROOT, 'assets/img/web', n + '.jpg'));

/* ---------- shared chrome ---------- */
function head(r, title, desc, extra = '', active = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<link rel="icon" href="${r}assets/img/favicon-32.png" sizes="32x32">
<link rel="icon" href="${r}assets/img/favicon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="${r}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;1,300&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/css/style.css?v=${BUILD}">
${extra}
</head>
<body>
<div class="curtain" aria-hidden="true"></div>
<header class="header">
  <a class="header__logo" href="${r}index.html" aria-label="${esc(SITE.name)} — home">
    <img class="logo-dark" src="${r}assets/img/logo.png" alt="CREATE">
    <img class="logo-white" src="${r}assets/img/logo-white.png" alt="CREATE">
  </a>
  <nav class="header__nav" aria-label="Main">
    ${NAV.map(([t, h]) => `<a href="${r}${h}"${h === active ? ' class="is-active"' : ''}>${t}</a>`).join('\n    ')}
  </nav>
  <button class="menu-btn" aria-label="Menu" aria-expanded="false"><span></span></button>
</header>
`;
}

function menu(r, active) {
  const links = NAV.map(([t, h]) => `<a href="${r}${h}"${h === active ? ' class="is-active"' : ''}>${t}</a>`).join('\n      ');
  return `
<nav class="menu" aria-label="Main">
  <div class="menu__inner">
    <div class="menu__nav">
      ${links}
    </div>
    <div class="menu__aside">
      <a href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg></a>
      <a href="${SITE.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M13.5 8.5h1.5V6h-1.5a3 3 0 0 0-3 3v1.5H9v2.5h1.5V21H13v-8h1.8l.4-2.5H13V9a.5.5 0 0 1 .5-.5z"/></svg></a>
      <a href="https://wa.me/${SITE.phoneHref.replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1z"/><path d="M9 9.5c0 2.5 3 5 5.5 5.5l1-1.5-1.7-.9-.8.8c-1-.4-2-1.4-2.4-2.4l.8-.8-.9-1.7z"/></svg></a>
    </div>
  </div>
  <div class="menu__foot">
    <span>&copy; ${SITE.year} CREATE Interior Design Co. All rights reserved.</span>
    <span>Singapore</span>
  </div>
</nav>`;
}

function footer(r) {
  const projectLinks = projects.slice(0, 6).map(p => `<li><a href="${r}projects/${p.slug}/">${esc(p.title)}</a></li>`).join('\n        ');
  return `
<footer class="footer">
  <div class="wrap footer__top">
    <div class="footer__brand">
      <a href="${r}index.html"><img src="${r}assets/img/logo.png" alt="CREATE"></a>
      <p>Singapore's award winning interior design studio. Thoughtful, immersive homes and spaces that blend concept, craft and culture.</p>
    </div>
    <div class="footer__col">
      <div class="h-section">Pages</div>
      <ul class="ul">
        ${NAV.map(([t, h]) => `<li><a href="${r}${h}">${t}</a></li>`).join('\n        ')}
      </ul>
    </div>
    <div class="footer__col">
      <div class="h-section">Projects</div>
      <ul class="ul">
        ${projectLinks}
        <li><a href="${r}portfolio.html">All projects</a></li>
      </ul>
    </div>
    <div class="footer__col">
      <div class="h-section">Contact</div>
      <ul class="ul">
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li><a href="https://wa.me/${SITE.phoneHref.replace('+', '')}" target="_blank" rel="noopener">${SITE.phone} (WhatsApp)</a></li>
        <li>8 Ubi Road 2, #06-10, Zervex<br>Singapore 408538</li>
        <li class="footer__careers">Careers: send your CV to <a href="mailto:${SITE.email}?subject=Application">${SITE.email}</a></li>
      </ul>
      <div class="footer__social">
        <a href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg></a>
        <a href="${SITE.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M13.5 8.5h1.5V6h-1.5a3 3 0 0 0-3 3v1.5H9v2.5h1.5V21H13v-8h1.8l.4-2.5H13V9a.5.5 0 0 1 .5-.5z"/></svg></a>
        <a href="https://wa.me/${SITE.phoneHref.replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1z"/><path d="M9 9.5c0 2.5 3 5 5.5 5.5l1-1.5-1.7-.9-.8.8c-1-.4-2-1.4-2.4-2.4l.8-.8-.9-1.7z"/></svg></a>
      </div>
    </div>
  </div>
  <div class="wrap footer__bottom">
    <span>&copy; ${SITE.year} CREATE Interior Design Co. All rights reserved.</span>
    <a href="${r}contact.html" class="footer__cta">Start a project</a>
  </div>
</footer>
<script src="${r}assets/js/main.js?v=${BUILD}"></script>
</body>
</html>
`;
}

/* ---------- milestones (home page timeline) ----------
   Years are placeholders: confirm with the client and edit here. The image is a
   project slug + photo index. */
const MILESTONES = [
  { when: '2014', title: 'The beginning', img: ['anchorvale', 0],
    text: 'Rick, a multifaceted designer with a background in product design, founds CREATE in Singapore to craft spaces, forms and experiences that reflect each client’s passions and aspirations.' },
  { when: '2016', title: 'In print', img: ['everitt-road', 1],
    text: 'Early homes catch the eye of The Straits Times and the leading interior titles Home & Décor, Designaire and Home + Living, the first of twelve media features to date.' },
  { when: '2018', title: 'A community of designers', img: ['cassia', 0],
    text: 'The studio grows into a community of passionate designers and planners from Singapore, Malaysia and the Philippines, working as an integrated spatial-design practice.' },
  { when: '2021', title: 'Awards', img: ['mandarin-gallery', 0],
    text: 'Five design awards and recognition from Qanvast and Houzz, with over 150 projects designed and 120 realised across residential and commercial work.' },
  { when: 'Today', title: 'World building', img: ['maplewoods', 2],
    text: 'From HDB flats and condominiums to landed homes and galleries, every project begins upstream with a single idea strong enough to guide the whole world we build around it.' },
];

function milestones(r) {
  const byslug = Object.fromEntries(projects.map(p => [p.slug, p]));
  const items = MILESTONES.map((m, i) => `
      <article class="ms ${i % 2 ? 'ms--right' : 'ms--left'}">
        <div class="ms__media fade"><img src="${web(r, byslug[m.img[0]].images[m.img[1]].name)}" alt="" loading="lazy"></div>
        <div class="ms__text fade">
          <div class="ms__dot"></div>
          <div class="ms__when">${esc(m.when)}</div>
          <h3 class="h-title">${esc(m.title)}</h3>
          <p>${esc(m.text)}</p>
        </div>
      </article>`).join('');
  return `
  <section class="section wrap milestones" id="milestones">
    <div class="intro" style="min-height:0">
      <div class="label words">Our milestones</div>
      <h2 class="h-light h-statement words">A decade of homes, spaces<br>and the people who live in them.</h2>
    </div>
    <div class="ms-list">
      <div class="ms-line"><i class="ms-line__fill"></i></div>${items}
    </div>
  </section>`;
}

/* ---------- our process (home): four steps that stack as you scroll ---------- */
const PROCESS = [
  { n: '01', title: 'Discovery', img: ['cck', 1],
    text: 'We start by listening: how you live, what you love, your budget and your key dates. A site visit and measurements follow, so every decision after this is grounded in the real space.',
    outcome: 'A clear brief and a realistic plan.' },
  { n: '02', title: 'Concept & Atmosphere', img: ['maplewoods', 3],
    text: 'Mood, materials, lighting and layout come together in a concept with a single idea at its centre, strong enough to guide every choice that follows.',
    outcome: 'Concept boards, space plan and a material palette.' },
  { n: '03', title: 'Technical Design', img: ['everitt-road', 4],
    text: 'Detailed drawings for joinery, electrical, lighting and finishes, with specifications ready for costing and approvals. Nothing is left to be guessed on site.',
    outcome: 'A complete design package, priced and approved.' },
  { n: '04', title: 'Execution & Oversight', img: ['grand_duchess', 1],
    text: 'We coordinate the works, manage sourcing and check every detail on site so the finished home matches the drawings, layer by layer.',
    outcome: 'A refined, completed space, handed over ready to live in.' },
];

function process(r) {
  const byslug = Object.fromEntries(projects.map(p => [p.slug, p]));
  const cards = PROCESS.map((s, i) => `
        <article class="pcard" style="--i:${i}">
          <div class="pcard__bar"><span>${s.n}</span><span class="dash"></span><span>${esc(s.title)}</span></div>
          <div class="pcard__photo">
            <img src="${web(r, byslug[s.img[0]].images[s.img[1]].name)}" alt="" loading="lazy">
            <div class="pcard__text">
              <p>${esc(s.text)}</p>
              <div class="pcard__out">Outcome: ${esc(s.outcome)}</div>
            </div>
          </div>
        </article>`).join('');
  return `
  <section class="process" id="process">
    <div class="wrap process__grid">
      <div class="process__head">
        <div class="label">Our process</div>
        <h2 class="process__title">Our<br>Process</h2>
        <p class="process__note">Four steps, one idea carried all the way through.</p>
      </div>
      <div class="pstack">${cards}
      </div>
    </div>
  </section>`;
}

/* ---------- "as featured in" logo slider ----------
   Drop a logo file at assets/img/logos/<file> and set `img`; until then the name is
   shown as a wordmark. */
const LOGOS = [
  { name: 'Hafary', img: 'hafary.png' },
  { name: 'Hansgrohe', img: 'hansgrohe.svg' },
  { name: 'Light Craft', img: 'lightcraft.png' },
  { name: 'SPACE Furniture', img: 'space.svg' },
  { name: 'Floor Xpert', img: 'floorxpert.svg' },
  { name: 'Miele', img: 'miele.svg' },
  { name: 'Goodrich', img: 'goodrich.png' },
];
function logoSlider(r) {
  const item = l => fs.existsSync(path.join(ROOT, 'assets/img/logos', l.img))
    ? `<div class="logos__item"><img src="${r}assets/img/logos/${l.img}" alt="${esc(l.name)}" loading="lazy"></div>`
    : `<div class="logos__item"><span>${esc(l.name)}</span></div>`;
  const row = LOGOS.concat(LOGOS).map(item).join('\n        ');
  return `
  <section class="logos" aria-label="Brands we work with">
    <div class="wrap"><div class="label logos__label">Brands we work with</div></div>
    <div class="logos__reel"><div class="logos__track">
        ${row}
    </div></div>
  </section>`;
}

/* ---------- testimonials: one quote at a time, fading in ----------
   PLACEHOLDER quotes: replace with real client reviews (Qanvast / Houzz / Google). */
const TESTIMONIALS = [
  { quote: 'Rick understood how we wanted to live before we could put it into words. The home feels calm, considered and completely ours.', who: 'Homeowner', where: 'Maplewoods' },
  { quote: 'Every detail was drawn, priced and checked before anything was built. No surprises on site, and the finish is exactly what we were shown.', who: 'Homeowner', where: 'Bedok South' },
  { quote: 'They turned a standard flat into a space our friends keep asking about. Warm, practical and beautifully lit.', who: 'Homeowner', where: 'Choa Chu Kang' },
  { quote: 'A gallery needs to disappear behind the art. CREATE gave us a raw, confident shell that does exactly that.', who: 'Gallery director', where: 'Mandarin Gallery' },
];
function testimonials(r) {
  const items = TESTIMONIALS.map((t, i) => `
      <figure class="quote${i === 0 ? ' is-on' : ''}">
        <blockquote>${esc(t.quote)}</blockquote>
        <figcaption><span class="who">${esc(t.who)}</span><span class="where">${esc(t.where)}</span></figcaption>
      </figure>`).join('');
  return `
  <section class="section wrap testimonials" id="testimonials">
    <div class="label words" style="text-align:center">What clients say</div>
    <div class="quotes">${items}
    </div>
    <div class="quotes__bar"><i></i></div>
    <div class="quotes__dots">${TESTIMONIALS.map((_, i) => `<button${i === 0 ? ' class="is-on"' : ''} aria-label="Quote ${i + 1}"></button>`).join('')}</div>
  </section>`;
}

/* ---------- home ---------- */
function home() {
  const r = '';
  // hero: the centre photo (index 0, the bed) flashes through `flash` during the
  // preloader, then settles into a collage with the 7 photos around it.
  const byslug = Object.fromEntries(projects.map(p => [p.slug, p]));
  const pick = (slug, i) => byslug[slug].images[i].name;
  const centre = pick('maplewoods', 0);
  const collage = [
    pick('cassia', 0),          // top centre (landscape)
    pick('bedok-south', 0),     // bottom centre (landscape)
    pick('cck', 0),             // left top
    pick('everitt-road', 0),    // left bottom (portrait)
    pick('mandarin-gallery', 0),// right top
    pick('grand_duchess', 0),   // right middle
    pick('cck', 2),             // right bottom (portrait)
  ];
  // HERO_VIDEO: the two-part house video (front, then zoom inside on first scroll). Set to null for the photo collage hero.
  const HERO_VIDEO = { startOnScroll: true, rate: 1.0, words: ['Imagine', 'Design', 'Create'] };   // the clip file is already sped up 2.4x (about 5 s)   // starts still on the front with the logo; first scroll plays it all the way at `rate`, the words run till the end, then the header
  // preloader (photos zooming from tiny to full screen). Switched OFF: set HERO_FLASH to true to bring it back.
  const HERO_FLASH = false;
  const flash = !HERO_FLASH ? '' : [pick('mandarin-gallery', 3), pick('cassia', 0), pick('grand_duchess', 9), centre]
    .map(n => web(r, n)).join('|');
  const tiles = [`<div class="hero__tile is-hero" data-full="${web(r, centre)}"><img src="${thumb(r, centre)}" alt="" fetchpriority="high"></div>`]
    .concat(collage.map(n => `<div class="hero__tile"><img src="${thumb(r, n)}" alt="" loading="eager"></div>`)).join('\n      ');

  const reel = projects.concat(projects).map(p => `<a class="reel__item" href="${r}projects/${p.slug}/" tabindex="-1">
          <img src="${thumb(r, p.images[0].name)}" alt="${esc(p.title)}" loading="lazy">
          <div class="reel__cap"><span class="t">${esc(p.title)}</span><span class="s">${esc(p.location)}</span></div>
        </a>`).join('\n        ');

  return head(r, 'CREATE Interior Architects — Singapore', SITE.tagline + '. Residential and commercial interiors crafted with concept, craft and culture.', '', 'index.html') + `
<main>
${HERO_VIDEO ? `
  <section class="hero hero--video" aria-label="Introduction" data-cut="${HERO_VIDEO.cut || 0}" data-rate="${HERO_VIDEO.rate || 1}" data-start="${HERO_VIDEO.startOnScroll ? 'scroll' : 'auto'}">
    <div class="hero__stage">
      <video muted playsinline ${HERO_VIDEO.startOnScroll ? '' : 'autoplay'} preload="auto" poster="${r}assets/video/hero-poster.jpg">
        <source src="${r}assets/video/hero-1080.mp4" type="video/mp4" media="(min-width: 800px)">
        <source src="${r}assets/video/hero-720.mp4" type="video/mp4">
      </video>
      <img class="hero__intro-logo" src="${r}assets/img/logo-white.png" alt="" aria-hidden="true">
      <div class="hero__words" aria-hidden="true">${(HERO_VIDEO.words || []).map(w => `<span>${esc(w)}</span>`).join('')}</div>
      <div class="hero__copy">
        <h1>Singapore's award winning designers</h1>
        <div class="sub">Create Interior Architects</div>
      </div>
    </div>
  </section>` : `
  <section class="hero" aria-label="Introduction">
    <div class="hero__stage" data-flash="${flash}">
      <img class="hero__bg" alt="" aria-hidden="true">
      ${tiles}
      <img class="hero__intro-logo" src="${r}assets/img/logo-white.png" alt="" aria-hidden="true">
      <div class="hero__copy">
        <h1>Singapore's award winning designers</h1>
        <div class="sub">Create Interior Architects</div>
      </div>
    </div>
  </section>`}
` + logoSlider(r) + `
  <section class="section intro wrap">
    <div class="label words">World builders</div>
    <h2 class="h-light h-statement words">We craft spaces, forms &amp; experiences<br>that reflect our clients' passions &amp; aspirations.<br>With each project, a world of its own.<br>We are CREATE.</h2>
  </section>

  <section class="section--tight reel-section" id="portfolio">
    <div class="wrap reel-head">
      <div class="label words">Portfolio</div>
      <a class="reel-all" href="${r}portfolio.html">View all projects</a>
    </div>
    <div class="reel" aria-label="Selected projects">
      <div class="reel__track">
        ${reel}
      </div>
    </div>
  </section>
` + milestones(r) + process(r) + testimonials(r) + `
</main>
` + menu(r, 'index.html') + footer(r).replace('</body>', '<script src="assets/js/' + (HERO_VIDEO ? 'hero-video' : 'hero') + '.js?v=' + BUILD + '"></script>\n</body>');
}

/* ---------- every portfolio photo, for the full-screen viewer ---------- */
const PHOTOS = [];
projects.forEach(p => p.images.forEach(f => PHOTOS.push({ s: f.name, t: p.title })));
const photoIndex = (slug, name) => PHOTOS.findIndex(x => x.s === name && x.t === projects.find(p => p.slug === slug).title);

/* ---------- portfolio page: the full mosaic grid ---------- */
function gridMarkup(r) {
  return projects.map(p => {
    const cover = p.images[0].name;
    const cycle = p.images.slice(0, 7).map(f => thumb(r, f.name)).join('|');
    const search = [p.title, p.subtitle, p.location, p.type, p.style, p.tags.join(' ')].filter(Boolean).join(' ');
    return `<a class="tile ${p.size}" href="${r}projects/${p.slug}/" data-tags="${p.tags.join(' ')}" data-search="${esc(search)}" data-imgs="${cycle}">
        <div class="tile__img">
          <img class="is-on" src="${p.size ? web(r, cover) : thumb(r, cover)}" alt="${esc(p.title)}" loading="lazy">
          <img src="" alt="" aria-hidden="true">
        </div>
        <div class="tile__border"></div>
        <div class="tile__info">
          <div class="tile__slogan">${esc(p.slogan)}</div>
          <div class="tile__meta"><div class="t">${esc(p.title)}</div><div class="s">${esc(p.location)}</div></div>
          <div class="tile__count">1 / ${Math.min(7, p.images.length)}</div>
        </div>
      </a>`;
  }).join('\n      ');
}

function portfolio() {
  const r = '';
  return head(r, 'Portfolio — CREATE Interior Architects', 'Residential and commercial interior design projects by CREATE, Singapore.', '', 'portfolio.html') + `
<main class="page">
  <div class="wrap page-title"><h1 class="label">Portfolio</h1></div>
  <section class="section--tight intro" style="min-height:0;padding-top:0">
    <h2 class="h-light h-statement words">Homes, galleries and spaces<br>across Singapore.</h2>
  </section>
  <section class="wrap" id="grid">
    <div class="gbar">
      <label class="gbar__search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input type="search" placeholder="Search" aria-label="Search projects" maxlength="30" autocomplete="off">
      </label>
      <div class="gbar__nav" role="tablist" aria-label="Filter projects">
        <button class="is-active" data-tag="selected"><i>&bull;</i>Selected</button>
        <span class="sep"></span>
        <button data-tag="residential"><i>&bull;</i>Residential</button>
        <button data-tag="commercial"><i>&bull;</i>Commercial</button>
        <span class="sep"></span>
        <button data-tag="hdb"><i>&bull;</i>HDB</button>
        <button data-tag="condo"><i>&bull;</i>Condo</button>
        <button data-tag="landed"><i>&bull;</i>Landed</button>
      </div>
    </div>
    <div class="grid">
      ${gridMarkup(r)}
    </div>
    <p class="grid-empty label">No projects match that search.</p>
  </section>
  <div class="section--tight"></div>
</main>
` + menu(r, 'portfolio.html') + footer(r);
}

/* ---------- project pages ---------- */
function project(p, i) {
  const r = '../../';
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const hero = p.images[0];
  const gallery = p.images.slice(1).map(f =>
    `<figure data-photo="${photoIndex(p.slug, f.name)}"><img src="${web(r, f.name)}" alt="${esc(p.title)}" loading="lazy"${f.w && f.h ? ` width="${f.w}" height="${f.h}"` : ''}></figure>`).join('\n      ');
  const metaLines = [p.location, p.type, p.area ? `Built area &ndash; ${p.area}` : null, p.services, p.style].filter(Boolean);
  const title = p.subtitle ? `${p.title} (${p.subtitle})` : p.title;
  return head(r, `${title} — CREATE Interior Architects`, `${p.style} ${p.type.toLowerCase()} interior design in ${p.location}. ${p.desc[0]}`) + `
<main class="page">
  <div class="proj-hero wrap" data-photo="${photoIndex(p.slug, hero.name)}">
    <img src="${web(r, hero.name)}" alt="${esc(p.title)}" fetchpriority="high">
  </div>

  <section class="proj-head wrap">
    <div class="row-2">
      <div class="meta">
        <h1 class="h-title">${esc(p.title)}${p.subtitle ? `<br><span style="font-weight:300">${esc(p.subtitle)}</span>` : ''}</h1>
        ${metaLines.map(l => `<div>${l}</div>`).join('\n        ')}
        <div class="links">
          <a href="#" data-share>Share</a>
          <a href="${r}contact.html">Enquire</a>
        </div>
      </div>
      <div class="text">
        <p><span class="kicker">${esc(p.slogan.replace('\n', ' '))}_</span> ${esc(p.desc[0])}</p>
        ${p.desc.slice(1).map(d => `<p>${esc(d)}</p>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="wrap">
    <div class="proj-gallery">
      ${gallery}
    </div>
  </section>

  <section class="section--tight"></section>
  <nav class="proj-nav" aria-label="More projects">
    <a href="${r}projects/${prev.slug}/"><img src="${web(r, prev.images[0].name)}" alt="" loading="lazy"><span class="label">Previous project</span><span class="name">${esc(prev.title)}</span></a>
    <a href="${r}projects/${next.slug}/"><img src="${web(r, next.images[0].name)}" alt="" loading="lazy"><span class="label">Next project</span><span class="name">${esc(next.title)}</span></a>
  </nav>
</main>
` + menu(r, 'index.html') + footer(r).replace('<script src="' + r + 'assets/js/main.js', '<script src="' + r + 'assets/js/photos.js?v=' + BUILD + '"></script>\n<script src="' + r + 'assets/js/main.js');
}

/* ---------- ABOUT US (passion, ethos, achievements, designers, studio) ---------- */
function about() {
  const r = '';
  const strip = ['anchorvale', 'everitt-road', 'cassia'].map(s => projects.find(p => p.slug === s).images[1].name);
  return head(r, 'About Us — CREATE Interior Architects', "Singapore's award-winning designers. Our passion, ethos, achievements and the people behind CREATE Interior Design.", '', 'about.html') + `
<main class="page wrap">
  <div class="page-title"><h1 class="label">About us</h1></div>

  <section class="section--tight intro" style="text-align:left;min-height:0">
    <h2 class="h-light h-statement words" style="margin:0;max-width:980px">Singapore's award winning designers.</h2>
  </section>

  <section class="section--tight row-2">
    <div class="col-label h-section fade">Our passion</div>
    <div class="text fade">
      <p class="lead">CREATE is a community of passionate &amp; creative designers &amp; planners from Singapore, Malaysia &amp; the Philippines, with a vision unto the future &amp; beyond the shores of the little red dot.</p>
      <p>Since inception, we have garnered much attention for design excellence from Singapore's main newspaper <strong>The Straits Times</strong>, top interior design magazines <strong>Home &amp; D&eacute;cor</strong>, <strong>Designaire</strong> and <strong>Home + Living</strong>, and leading design portals <strong>Qanvast</strong> &amp; <strong>Houzz</strong>.</p>
    </div>
  </section>
  <hr class="rule">

  <section class="section--tight row-2">
    <div class="col-label h-section fade">Ethos</div>
    <div class="text fade">
      <p class="lead">We craft spaces, forms &amp; experiences that reflect each client's passion &amp; aspirations.</p>
      <p>CREATE was formed by Rick as an integrated spatial-design practice. Our design process unfolds in a democratic &amp; explorative environment between our partners, clients &amp; craftsmen, before being integrated into form, site, object and space.</p>
      <p>We begin every project upstream. Before a single material is chosen we look for a central idea, a north star, strong enough to guide the whole project, then translate it through planning, joinery, lighting, materials and styling so that each home or space becomes a world of its own.</p>
      <p class="quote">&ldquo;A home should feel like it was always meant to be this way: considered, calm and unmistakably yours.&rdquo;</p>
      <div class="label">Rick, Principal Designer, CREATE</div>
    </div>
  </section>
  <hr class="rule">

  <section class="section--tight row-2">
    <div class="col-label h-section fade">Our achievements</div>
    <div class="stats fade">
      <div><div class="n">15,603</div><div class="l label">Total sqm designed</div></div>
      <div><div class="n">1,350</div><div class="l label">Largest project in sqm</div></div>
      <div><div class="n">38</div><div class="l label">Smallest project in sqm</div></div>
      <div><div class="n">153</div><div class="l label">Projects designed</div></div>
      <div><div class="n">120</div><div class="l label">Projects realised</div></div>
      <div><div class="n">5</div><div class="l label">Awards clinched</div></div>
      <div><div class="n">12</div><div class="l label">Media title features</div></div>
    </div>
  </section>
  <hr class="rule">

  <section class="section--tight row-2">
    <div class="col-label h-section fade">Our designers</div>
    <div class="fade">
      <div class="person">
        <img src="${web(r, projects.find(p => p.slug === 'anchorvale').images[3].name)}" alt="" loading="lazy">
        <div class="text">
          <div class="h-title">Rick</div>
          <div class="label" style="margin-bottom:14px">Principal Designer</div>
          <p>Rick is an experienced, multifaceted designer with over ten years in the industry, ranging from product design to his current focus, interior design.</p>
          <p>He serves as Principal Designer of CREATE Interior Design Co., leading every project from first conversation to final styling.</p>
        </div>
      </div>
    </div>
  </section>
  <hr class="rule">

  <section class="section--tight row-2">
    <div class="col-label h-section fade">Our studio</div>
    <div class="text fade">
      <p>CREATE Interior Design Studio is a Singapore-based design atelier known for crafting refined, meaningful spaces that balance aesthetic elegance with thoughtful functionality. Rooted in a passion for world-class design and a keen understanding of modern living, CREATE transforms lifestyle aspirations into environments that resonate with personality, harmony and purpose.</p>
      <p>With a collaborative spirit and a commitment to excellence, the studio brings bespoke creativity to every project, from residential sanctuaries to lifestyle-driven concepts, elevating the everyday into the exceptional.</p>
      <ul class="ul" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 24px;text-transform:uppercase;font-size:13px;letter-spacing:.3px;color:var(--ink-2);margin-top:28px">
        <li>Interior Design</li><li>Space Planning</li><li>Facade Design</li><li>Architecture</li>
        <li>Residential: HDB, Condo, Landed</li><li>Commercial &amp; Galleries</li><li>Custom Joinery &amp; FF&amp;E</li><li>Project Management</li>
      </ul>
      <p style="margin-top:32px"><a class="btn btn--red" href="${r}contact.html">Start a project</a></p>
    </div>
  </section>

  <section class="section--tight strip fade">
    ${strip.map(n => `<img src="${web(r, n)}" alt="" loading="lazy">`).join('\n    ')}
  </section>
</main>
` + menu(r, 'about.html') + footer(r);
}

/* ---------- CONTACT ---------- */
const MAP_QUERY = '8 Ubi Road 2, #06-10, Zervex, Singapore 408538';   // studio address (drives the map pin)
function contact() {
  const r = '';
  return head(r, 'Contact Us — CREATE Interior Architects', 'Start a project with CREATE Interior Design, Singapore. Tell us about your home or space.', '', 'contact.html') + `
<main class="page">
  <div class="wrap page-title"><h1 class="label">Get in touch</h1></div>

  <section class="wrap contact">
    <div class="contact__intro">
      <h2 class="h-light h-statement words">We are always ready<br>to help you and answer<br>your questions.</h2>
      <p class="contact__lead">Tell us about your home or space, your key collection date and the feel you are after. We reply within one working day.</p>
      <div class="contact__details">
        <div><div class="h-section">Call / WhatsApp</div><a href="https://wa.me/${SITE.phoneHref.replace('+', '')}" target="_blank" rel="noopener">${SITE.phone}</a><span>Rick, Principal Designer</span></div>
        <div><div class="h-section">Our location</div><a href="https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}" target="_blank" rel="noopener">8 Ubi Road 2, #06-10</a><span>Zervex, Singapore 408538</span></div>
        <div><div class="h-section">Email</div><a href="mailto:${SITE.email}">${SITE.email}</a></div>
        <div><div class="h-section">Social</div>
          <div class="contact__social">
            <a href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg></a>
            <a href="${SITE.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M13.5 8.5h1.5V6h-1.5a3 3 0 0 0-3 3v1.5H9v2.5h1.5V21H13v-8h1.8l.4-2.5H13V9a.5.5 0 0 1 .5-.5z"/></svg></a>
            <a href="https://wa.me/${SITE.phoneHref.replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1z"/><path d="M9 9.5c0 2.5 3 5 5.5 5.5l1-1.5-1.7-.9-.8.8c-1-.4-2-1.4-2.4-2.4l.8-.8-.9-1.7z"/></svg></a>
          </div>
        </div>
      </div>
    </div>

    <div class="contact__form">
      <h3 class="contact__title">Start a project</h3>
      <p class="contact__sub">Share the basics and we will come back with the next steps.</p>
      <form class="form fade" data-mailto="${SITE.email}" novalidate>
        <div class="f"><label class="label" for="f-name">Name</label><input id="f-name" name="Name" required autocomplete="name"></div>
        <div class="f"><label class="label" for="f-phone">Phone number</label><input id="f-phone" name="Phone" type="tel" autocomplete="tel"></div>
        <div class="f"><label class="label" for="f-email">Email</label><input id="f-email" name="Email" type="email" required autocomplete="email"></div>
        <div class="f"><label class="label" for="f-addr">Site address</label><input id="f-addr" name="Site address"></div>
        <div class="f"><label class="label" for="f-date">Key collection date</label><input id="f-date" name="Key collection date" type="date"></div>
        <div class="f"><label class="label" for="f-type">Property type</label>
          <select id="f-type" name="Property type">
            <option value="">Select a property type</option>
            <option>HDB BTO</option><option>HDB Resale</option><option>Condo</option><option>Condo Resale</option><option>Landed</option><option>Commercial</option>
          </select>
        </div>
        <div class="f"><label class="label" for="f-budget">Budget</label>
          <select id="f-budget" name="Budget">
            <option value="">Select a budget range</option>
            <option>$60,000 to $80,000</option><option>$80,000 to $100,000</option><option>$100,000 to $120,000</option><option>Above $120,000</option>
          </select>
        </div>
        <div class="f"><label class="label" for="f-plan">Floor plan</label><input id="f-plan" name="Floor plan" type="file" accept=".pdf,.jpg,.jpeg,.png"></div>
        <div class="f full"><label class="label" for="f-scope">Project scope &amp; requirements</label><textarea id="f-scope" name="Project scope"></textarea></div>
        <div class="f full"><label class="label" for="f-insp">Design inspiration / interior styles / Pinterest board</label><textarea id="f-insp" name="Design inspiration"></textarea></div>
        <div class="f full"><label class="label" for="f-more">Additional information</label><textarea id="f-more" name="Additional information"></textarea></div>
        <div class="f full"><button class="btn btn--red" type="submit">Send a message</button></div>
        <div class="form__note">Submitting opens your email app with the details filled in. Attach your floor plan there, or WhatsApp us directly.</div>
      </form>
    </div>
  </section>

  <section class="wrap contact__map">
    <iframe title="Map" src="https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  </section>
</main>
` + menu(r, 'contact.html') + footer(r);
}

/* ---------- write everything ---------- */
const out = (file, html) => { fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true }); fs.writeFileSync(path.join(ROOT, file), html); console.log('wrote', file); };

// sanity: every referenced image must exist
projects.forEach(p => p.images.forEach(f => { if (!exists(f.name)) console.warn('MISSING image', p.slug, f.name); }));

out('assets/js/photos.js', 'window.PORTFOLIO_PHOTOS = ' + JSON.stringify(PHOTOS.map(x => ({ s: 'assets/img/web/' + x.s + '.jpg', t: x.t }))) + ';\n');
out('index.html', home());
out('portfolio.html', portfolio());
out('about.html', about());
out('contact.html', contact());
projects.forEach((p, i) => out(`projects/${p.slug}/index.html`, project(p, i)));

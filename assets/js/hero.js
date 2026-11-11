/* ==========================================================================
   Home hero — three beats
   1. PRELOADER: one photo in the middle of a white screen flashes through
      many project photos, growing from small to big as it goes.
   2. COLLAGE: the last photo (the bed) settles into the centre of a magazine
      collage; the surrounding photos fade in around it.
   3. SCROLL: the centre photo expands over the collage until it fills the
      screen; headline + marquee fade in. Scrubs with the scroll.
   ========================================================================== */
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const stage = hero.querySelector('.hero__stage');
  const tiles = Array.from(hero.querySelectorAll('.hero__tile'));
  const heroTile = hero.querySelector('.hero__tile.is-hero');
  const heroImg = heroTile.querySelector('img');
  const others = tiles.filter(t => t !== heroTile);
  const copy = hero.querySelector('.hero__copy');
  const marquee = hero.querySelector('.hero__marquee');
  const bg = hero.querySelector('.hero__bg');
  const introLogo = hero.querySelector('.hero__intro-logo');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const flashList = (stage.dataset.flash || '').split('|').filter(Boolean);
  const heroFull = heroTile.dataset.full;        // large version of the centre photo

  let W = 0, H = 0;
  let B = [];                 // collage rect per tile (B[0] = centre)
  let heroRect = null;        // where the centre tile currently sits before scroll
  let scroll = 0;             // 0 → 1 scroll progress
  let phase = 'load';         // load → flash → settle → ready
  let hurry = false;          // user scrolled early: finish the intro fast
  let locked = false;         // the bed has filled the screen: that's the entrance, no way back
  let ticking = false;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
  const frac = (x0, y0, x1, y1) => ({ x: x0 * W, y: y0 * H, w: (x1 - x0) * W, h: (y1 - y0) * H });
  const put = (el, r) => { el.style.transform = `translate(${r.x}px, ${r.y}px)`; el.style.width = r.w + 'px'; el.style.height = r.h + 'px'; };

  /* ---------- collage layout (picture 2): centre + 7 around it ---------- */
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    const m = W < 700;
    B = m ? [
      frac(0.20, 0.30, 0.80, 0.70),   // centre — the bed
      frac(0.20, 0.10, 0.80, 0.28),   // top centre
      frac(0.20, 0.72, 0.80, 0.92),   // bottom centre
      frac(0.03, 0.10, 0.18, 0.46),   // left top
      frac(0.03, 0.48, 0.18, 0.92),   // left bottom
      frac(0.82, 0.10, 0.97, 0.38),   // right top
      frac(0.82, 0.40, 0.97, 0.64),   // right middle
      frac(0.82, 0.66, 0.97, 0.92),   // right bottom
    ] : [
      frac(0.31, 0.27, 0.69, 0.79),   // centre — the bed
      frac(0.31, 0.11, 0.69, 0.255),  // top centre
      frac(0.31, 0.805, 0.69, 0.97),  // bottom centre
      frac(0.05, 0.11, 0.295, 0.46),  // left top
      frac(0.05, 0.475, 0.295, 0.97), // left bottom
      frac(0.705, 0.11, 0.95, 0.39),  // right top
      frac(0.705, 0.405, 0.95, 0.62), // right middle
      frac(0.705, 0.635, 0.95, 0.97), // right bottom
    ];
    others.forEach((t, i) => put(t, B[i + 1]));
    if (phase === 'ready') heroRect = B[0];
  }

  /* ---------- paint the scroll state ---------- */
  function render() {
    ticking = false;
    if (phase !== 'ready') return;
    if (locked) scroll = 1;
    const expand = easeOut(clamp(scroll / 0.6, 0, 1));
    const text = clamp((scroll - 0.55) / 0.3, 0, 1);
    // the logo stays on the bed until you scroll, then fades out as the photo grows
    if (introLogo) { introLogo.style.opacity = 1 - clamp(scroll / 0.3, 0, 1); introLogo.style.transition = 'none'; }
    const full = { x: 0, y: 0, w: W, h: H };
    put(heroTile, lerpRect(B[0], full, expand));
    heroTile.style.setProperty('--shade', expand.toFixed(3));
    // the surrounding photos ease outward a touch as the centre grows over them
    others.forEach((t, i) => {
      const b = B[i + 1];
      const cx = b.x + b.w / 2 - W / 2, cy = b.y + b.h / 2 - H / 2;
      put(t, { x: b.x + cx * 0.12 * expand, y: b.y + cy * 0.12 * expand, w: b.w, h: b.h });
    });
    if (copy) { copy.style.opacity = text; copy.style.transform = `translateY(calc(-50% + ${((1 - text) * 24).toFixed(2)}px))`; }
    if (marquee) marquee.style.opacity = text;
    document.body.classList.toggle('is-dark', expand > 0.7 && hero.getBoundingClientRect().bottom > H * 0.6);
  }
  const requestRender = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };

  function onScroll() {
    if (locked) { requestRender(); return; }
    const range = hero.offsetHeight - H;
    scroll = range > 0 ? clamp(-hero.getBoundingClientRect().top / range, 0, 1) : 1;
    if (phase !== 'ready' && scroll > 0.01) hurry = true;
    if (phase === 'ready' && scroll >= 0.98) lock();
    requestRender();
  }

  // Once the bed fills the screen the entrance is over: the hero becomes a normal
  // full-screen hero at the top of the page and scrolling up never returns to the collage.
  function lock() {
    locked = true; scroll = 1;
    hero.style.height = '100vh';
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestRender();
  }

  /* ---------- beat 1: preloader flash ---------- */
  function preload(srcs, timeout) {
    return Promise.race([
      Promise.all(srcs.map(s => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = s; }))),
      new Promise(res => setTimeout(res, timeout))
    ]);
  }

  function flash() {
    phase = 'flash';
    heroTile.style.opacity = 1;
    const n = flashList.length;
    let k = 0;
    const tiny = () => ({ x: W / 2 - W * 0.03, y: H / 2 - W * 0.03 * (H / W), w: W * 0.06, h: W * 0.06 * (H / W) });
    const full = () => ({ x: 0, y: 0, w: W, h: H });
    (function one() {
      if (hurry) k = n - 1;
      heroImg.src = flashList[k];
      const last = k === n - 1;
      if (last) {
        // the bed only comes out to its collage size; the background clears underneath it
        if (heroFull) heroImg.src = heroFull;
        if (bg) bg.classList.remove('is-on');
      }
      const to = last ? B[0] : full();
      const dur = hurry ? 200 : (last ? 900 : 430);
      const t0 = performance.now();
      (function tick(now) {
        const t = easeInOut(clamp((now - t0) / dur, 0, 1));
        heroRect = lerpRect(tiny(), to, t);                       // pops out tiny → grows
        put(heroTile, heroRect);
        if (t < 1) requestAnimationFrame(tick);
        else if (!last) {
          // the photo that just filled the screen stays behind as the background for the next one
          if (bg) { bg.src = flashList[k]; bg.classList.add('is-on'); }
          if (introLogo) introLogo.classList.add('is-on');
          k++; one();
        }
        else settle();
      })(t0);
    })();
  }

  /* ---------- beat 2: settle into the collage ---------- */
  function settle() {
    phase = 'settle';
    heroRect = B[0];
    put(heroTile, heroRect);
    others.forEach((t, i) => { t.classList.add('is-in'); setTimeout(() => { t.style.opacity = 1; }, (hurry ? 40 : 60) + i * (hurry ? 30 : 90)); });
    setTimeout(() => { phase = 'ready'; onScroll(); }, hurry ? 200 : 500);
  }

  /* ---------- init ---------- */
  layout();
  if (reduce) {
    if (heroFull) heroImg.src = heroFull;
    tiles.forEach(t => { t.style.opacity = 1; });
    put(heroTile, B[0]);
    phase = 'ready';
    onScroll();
  } else if (flashList.length === 0) {
    // no preloader: the collage simply builds itself, bed first, the rest around it
    if (heroFull) heroImg.src = heroFull;
    put(heroTile, B[0]);
    heroTile.classList.add('is-in');
    setTimeout(() => { heroTile.style.opacity = 1; }, 120);
    if (introLogo) setTimeout(() => introLogo.classList.add('is-on'), 500);
    phase = 'settle';
    setTimeout(settle, 350);
  } else {
    const full = heroFull ? [heroFull] : [];
    preload(flashList.concat(full), 3500).then(flash);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { layout(); if (phase === 'ready') requestRender(); else if (heroRect) put(heroTile, heroRect); });
})();

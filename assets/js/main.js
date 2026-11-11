/* ==========================================================================
   Shared behaviour: menu, page-transition curtain, scroll reveal,
   portfolio grid (hover-to-play, filter, search, view toggle), contact form.
   ========================================================================== */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu ---------- */
  const menuBtn = $('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('menu-open'); });
  }

  /* ---------- curtain page transition ---------- */
  const curtain = $('.curtain');
  if (curtain && !reduce) {
    if (sessionStorage.getItem('curtain') === '1') {
      sessionStorage.removeItem('curtain');
      curtain.classList.add('is-cover');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        curtain.classList.remove('is-cover');
        curtain.classList.add('is-out');
        setTimeout(() => curtain.classList.remove('is-out'), 800);
      }));
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
          a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey) return;
      let url; try { url = new URL(href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      sessionStorage.setItem('curtain', '1');
      curtain.classList.add('is-in');
      setTimeout(() => { location.href = url.href; }, 620);
    });
    window.addEventListener('pageshow', e => { if (e.persisted) curtain.className = 'curtain'; });
  }

  /* ---------- scroll reveal ---------- */
  const fades = $$('.fade');
  if (fades.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    fades.forEach(f => io.observe(f));
  } else fades.forEach(f => f.classList.add('is-in'));

  /* ---------- word-by-word reveal, driven by scroll (scrubs, smoothed) ---------- */
  const wordBlocks = $$('.words');
  if (wordBlocks.length) {
    // split text nodes into word spans (keeps <br> and inline tags intact)
    wordBlocks.forEach(block => {
      const walk = node => {
        Array.from(node.childNodes).forEach(n => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(part => {
              if (!part) return;
              if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
              else { const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w); }
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(block);
    });
    const words = $$('.words .w');
    const perBlock = wordBlocks.map(b => $$('.w', b));
    let cur = 0, target = 0, raf = null;
    const vh = () => window.innerHeight;
    function measure() {
      // progress 0 → 1 as the first block travels from the bottom of the screen up to ~35% from the top
      const r = wordBlocks[0].parentElement.getBoundingClientRect();
      const from = vh() * 0.95, to = vh() * 0.3;
      target = Math.min(1, Math.max(0, (from - r.top) / (from - to)));
      if (reduce) { cur = target; paint(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      cur += (target - cur) * 0.12;                     // smoothing
      paint();
      raf = Math.abs(target - cur) > 0.002 ? requestAnimationFrame(tick) : null;
      if (!raf) { cur = target; paint(); }
    }
    function paint() {
      let offset = 0;
      const total = words.length;
      perBlock.forEach(list => {
        list.forEach((w, i) => {
          const k = (offset + i) / total;                // each word gets its own slot in the sweep
          const v = Math.min(1, Math.max(0, (cur - k * 0.7) / 0.3));
          const e = 1 - Math.pow(1 - v, 3);
          w.style.opacity = e;
          w.style.transform = `translateY(${(1 - e) * 0.6}em)`;
          w.style.filter = `blur(${(1 - e) * 4}px)`;
          const hv = (cur - k * 0.7) / 0.06;                     // a narrow red band, two words wide, racing ahead of the reveal
          w.classList.toggle('is-hot', hv > 0 && hv < 1);
        });
        offset += list.length;
      });
    }
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  }

  /* ---------- portfolio grid ---------- */
  const grid = $('.grid');
  if (grid) {
    const tiles = $$('.tile', grid);
    const canHover = window.matchMedia('(hover: hover)').matches;

    // grid-to-full preview: hovering a tile makes neighbouring tiles combine into one panel
    // that plays through the project's photos. With every photo the panel re-combines into a
    // different block of cells (2x2, a full row, 3x2, ...), so the shape keeps changing.
    if (canHover && !reduce) {
      const prev = document.createElement('a');
      prev.className = 'gprev';
      prev.innerHTML = '<div class="gprev__imgs"><img alt="" decoding="async"><img alt="" decoding="async"></div><div class="gprev__cta">View project</div><div class="gprev__cap"><span class="t"></span><span class="s"></span></div>';
      grid.appendChild(prev);
      const pimgs = $$('img', prev), capT = $('.t', prev), capS = $('.s', prev);
      const SHAPES = [[2, 2], [4, 1], [3, 2], [2, 2], [4, 2], [2, 1]];   // [columns, rows] of cells
      const STEP = 1300;
      let timer = null, idx = 0, imgs = [], on = 0, active = null, hideT = null, shapeI = 0;
      let mx = 0, my = 0;                                   // last pointer position (viewport)

      // grid geometry in cells
      function geo() {
        const vis = tiles.filter(t => !t.classList.contains('is-hidden'));
        const g = grid.getBoundingClientRect(), r = vis[0].getBoundingClientRect();
        const cs = getComputedStyle(grid);
        const gx = parseFloat(cs.columnGap) || 0, gy = parseFloat(cs.rowGap) || 0;
        const cols = Math.max(1, Math.round((g.width + gx) / (r.width + gx)));
        const rows = Math.ceil(vis.length / cols);
        return { g, cw: r.width, ch: r.height, gx, gy, cols, rows, ox: r.left - g.left, oy: r.top - g.top };
      }
      // which cell is the pointer over right now
      function cellAt(G) {
        const x = mx - G.g.left - G.ox, y = my - G.g.top - G.oy;
        return {
          c: Math.max(0, Math.min(G.cols - 1, Math.floor((x + G.gx / 2) / (G.cw + G.gx)))),
          r: Math.max(0, Math.min(G.rows - 1, Math.floor((y + G.gy / 2) / (G.ch + G.gy))))
        };
      }
      // lay the panel over a block of `shape` cells that always contains the pointer's cell
      function place(shape, fromTile) {
        const G = geo();
        const sc = Math.min(shape[0], G.cols), sr = Math.min(shape[1], G.rows);
        const at = cellAt(G);
        const c0 = Math.max(0, Math.min(at.c - Math.floor((sc - 1) / 2), G.cols - sc));
        const r0 = Math.max(0, Math.min(at.r, G.rows - sr));
        const rect = {
          left: G.ox + c0 * (G.cw + G.gx), top: G.oy + r0 * (G.ch + G.gy),
          width: sc * G.cw + (sc - 1) * G.gx, height: sr * G.ch + (sr - 1) * G.gy
        };
        if (fromTile) {                                    // first bloom starts from the hovered tile itself
          const r = fromTile.getBoundingClientRect();
          prev.style.transition = 'none';
          prev.style.left = (r.left - G.g.left) + 'px'; prev.style.top = (r.top - G.g.top) + 'px';
          prev.style.width = r.width + 'px'; prev.style.height = r.height + 'px';
          void prev.offsetWidth;
          prev.style.transition = '';
        }
        prev.style.left = rect.left + 'px'; prev.style.top = rect.top + 'px';
        prev.style.width = rect.width + 'px'; prev.style.height = rect.height + 'px';
      }
      // Photos are decoded off-screen first, so a large image never holds up the shape animation.
      let token = 0;
      const ready = {};                                    // src -> Promise resolved once decoded
      function prep(src) {
        if (!ready[src]) {
          const im = new Image(); im.decoding = 'async'; im.src = src;
          ready[src] = (im.decode ? im.decode() : new Promise(r => { im.onload = r; im.onerror = r; })).catch(() => {});
        }
        return ready[src];
      }
      function show(i) {
        idx = (i + imgs.length) % imgs.length;
        const src = imgs[idx], mine = ++token;
        prep(src).then(() => {
          if (mine !== token) return;                      // a newer photo (or project) took over
          const next = pimgs[1 - on], cur = pimgs[on];
          next.src = src;
          next.classList.add('is-on'); cur.classList.remove('is-on'); on = 1 - on;
        });
        prep(imgs[(idx + 1) % imgs.length]);               // warm up the one after
      }
      function step() {
        shapeI = (shapeI + 1) % SHAPES.length;
        place(SHAPES[shapeI]);                              // re-combine into the next shape...
        show(idx + 1);                                      // ...as the next photo fades in
      }
      function openFor(tile) {
        clearTimeout(hideT);
        if (active === tile) return;
        const first = !grid.classList.contains('is-previewing');
        active = tile;
        // the panel gets large, so use the full-size photos rather than the tile thumbnails
        imgs = (tile.dataset.imgs || '').split('|').filter(Boolean).map(s => s.replace('/thumb/', '/web/'));
        if (!imgs.length) return;
        prev.href = tile.getAttribute('href');
        capT.textContent = $('.tile__meta .t', tile).textContent;
        capS.textContent = $('.tile__meta .s', tile).textContent;
        shapeI = 0;
        place(SHAPES[0], first ? tile : null);
        grid.classList.add('is-previewing');
        clearInterval(timer);
        const cover = $('.tile__img img', tile);
        pimgs.forEach(x => x.classList.remove('is-on')); on = 0;
        pimgs[0].src = cover.currentSrc || cover.src;       // instant: the cover that is already loaded
        pimgs[0].classList.add('is-on');
        idx = 0; show(0);
        timer = setInterval(step, STEP);
      }
      function closeAll() {
        hideT = setTimeout(() => {
          clearInterval(timer); timer = null; active = null; token++;
          grid.classList.remove('is-previewing');
        }, 80);
      }
      grid.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
      tiles.forEach(tile => tile.addEventListener('mouseenter', e => {
        if (e.clientX || e.clientY) { mx = e.clientX; my = e.clientY; }
        else { const r = tile.getBoundingClientRect(); mx = r.left + r.width / 2; my = r.top + r.height / 2; }
        openFor(tile);
      }));
      prev.addEventListener('mouseenter', () => clearTimeout(hideT));
      grid.addEventListener('mouseleave', closeAll);
      window.addEventListener('resize', () => { if (active) place(SHAPES[shapeI]); });
    }

    // filter + search
    const buttons = $$('.gbar__nav button');
    const search = $('.gbar__search input');
    const empty = $('.grid-empty');
    let tag = 'selected', q = '';
    function apply() {
      let shown = 0;
      tiles.forEach(t => {
        const tags = (t.dataset.tags || '').split(' ');
        const hay = (t.dataset.search || '').toLowerCase();
        const ok = (tag === 'selected' || tags.includes(tag)) && (!q || hay.includes(q));
        t.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle('is-on', shown === 0);
    }
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      tag = b.dataset.tag; apply();
    }));
    if (search) search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); apply(); });

    // view toggle (mosaic / list)
    $$('.gbar__view button').forEach(b => b.addEventListener('click', () => {
      $$('.gbar__view button').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      grid.classList.toggle('is-list', b.dataset.view === 'list');
    }));

    // deep-link: /portfolio.html?go=residential
    const want = new URLSearchParams(location.search).get('go');
    if (want) { const b = buttons.find(x => x.dataset.tag === want); if (b) b.click(); }
  }

  /* ---------- process cards: title bars stack via sticky; the covered photo dims a little ---------- */
  const pcards = $$('.pcard');
  const darkBlocks = $$('.process');
  if (pcards.length && !reduce) {
    function stack() {
      pcards.forEach((card, i) => {
        const next = pcards[i + 1]; const photo = $('.pcard__photo', card);
        if (!next) { photo.style.opacity = ''; return; }
        const r = photo.getBoundingClientRect(), nr = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (r.bottom - nr.top) / r.height));   // how far the next card covers this photo
        photo.style.opacity = 1 - p * 0.6;
      });
      // white logo + links while a dark block sits under the header
      const dark = darkBlocks.some(b => { const r = b.getBoundingClientRect(); return r.top < 70 && r.bottom > 70; });
      document.body.classList.toggle('on-dark', dark);
    }
    window.addEventListener('scroll', stack, { passive: true });
    window.addEventListener('resize', stack);
    stack();
  }

  /* ---------- milestones line fills as you scroll ---------- */
  const msLine = $('.ms-line__fill');
  if (msLine) {
    const list = $('.ms-list');
    const dots = $$('.ms__dot');
    function fill() {
      const r = list.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
      msLine.style.height = (p * 100) + '%';
      dots.forEach(d => d.classList.toggle('is-on', d.getBoundingClientRect().top < window.innerHeight * 0.6));
    }
    window.addEventListener('scroll', fill, { passive: true });
    window.addEventListener('resize', fill);
    fill();
  }

  /* ---------- lightbox: the clicked photo zooms out of the page into the viewer;
     scroll, swipe, arrows or the thumbnail strip move through the whole portfolio, endlessly ---------- */
  const photos = window.PORTFOLIO_PHOTOS;
  const openers = $$('[data-photo]');
  if (photos && photos.length && openers.length) {
    const root = location.pathname.includes('/projects/') ? '../../' : '';
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = '<div class="lb__bg"></div><div class="lb__stage"><img class="lb__img" alt=""><img class="lb__img" alt=""></div>' +
      '<div class="lb__top"><div class="lb__cap"></div><button class="lb__close" aria-label="Close"></button></div>' +
      '<button class="lb__arrow lb__arrow--prev" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="lb__arrow lb__arrow--next" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<div class="lb__thumbs"></div>';
    document.body.appendChild(lb);
    const imgs = $$('.lb__img', lb), cap = $('.lb__cap', lb), strip = $('.lb__thumbs', lb), stage = $('.lb__stage', lb);
    const wrap = i => ((i % photos.length) + photos.length) % photos.length;
    const src = i => root + photos[wrap(i)].s;
    let idx = 0, on = 0, busy = false, origin = null;
    photos.forEach((p, i) => {
      const t = document.createElement('button'); t.className = 'lb__thumb'; t.setAttribute('aria-label', p.t + ' ' + (i + 1));
      t.innerHTML = '<img alt="" loading="lazy" src="' + root + p.s.replace('/web/', '/thumb/') + '">';
      t.addEventListener('click', () => show(i, i > idx ? 1 : -1));
      strip.appendChild(t);
    });
    const thumbs = $$('.lb__thumb', strip);
    function fitRect(w, h) {
      // where a w x h photo sits when fitted inside the stage
      const s = stage.getBoundingClientRect();
      const k = Math.min(s.width / w, s.height / h);
      const fw = w * k, fh = h * k;
      return { x: s.left + (s.width - fw) / 2, y: s.top + (s.height - fh) / 2, w: fw, h: fh };
    }
    function mark(i) {
      idx = wrap(i);
      cap.innerHTML = '<b>' + photos[idx].t + '</b><span>' + (idx + 1) + ' / ' + photos.length + '</span>';
      thumbs.forEach((t, k) => t.classList.toggle('is-on', k === idx));
      thumbs[idx].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
      [1, -1].forEach(d => { const im = new Image(); im.src = src(idx + d); });
    }
    function show(i, dir) {
      if (busy) return;
      busy = true;
      const next = imgs[1 - on], cur = imgs[on];
      next.src = src(i);
      const go = () => {
        next.style.transition = 'none';
        next.style.transform = 'translateX(' + (dir || 1) * 40 + 'px)'; next.style.opacity = 0;
        void next.offsetWidth;
        next.style.transition = '';
        next.classList.add('is-on'); next.style.transform = ''; next.style.opacity = '';
        cur.classList.remove('is-on'); cur.style.transform = 'translateX(' + (dir || 1) * -40 + 'px)';
        on = 1 - on;
        setTimeout(() => { cur.style.transform = ''; busy = false; }, 420);
      };
      next.complete ? go() : next.addEventListener('load', go, { once: true });
      mark(i);
    }
    function open(i, fromEl) {
      lb.classList.add('is-open'); document.body.classList.add('lb-open');
      origin = fromEl && fromEl.querySelector('img');
      const first = imgs[on];
      imgs.forEach(x => { x.classList.remove('is-on'); x.style.transform = ''; x.style.opacity = ''; });
      first.src = src(i);
      mark(i);
      const land = () => {
        first.classList.add('is-on');
        if (origin && !reduce) {
          // FLIP: start from the thumbnail's rect on the page, settle into the fitted rect
          const o = origin.getBoundingClientRect();
          const f = fitRect(first.naturalWidth || o.width, first.naturalHeight || o.height);
          const sx = o.width / f.w, sy = o.height / f.h;
          first.style.transition = 'none';
          first.style.transformOrigin = '0 0';
          first.style.transform = 'translate(' + (o.left - f.x) + 'px,' + (o.top - f.y) + 'px) scale(' + sx + ',' + sy + ')';
          void first.offsetWidth;
          first.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s';
          first.style.transform = 'translate(0,0) scale(1,1)';
          setTimeout(() => { first.style.transition = ''; first.style.transformOrigin = ''; }, 650);
        }
        requestAnimationFrame(() => lb.classList.add('is-shown'));
      };
      first.complete ? land() : first.addEventListener('load', land, { once: true });
    }
    function close() {
      const cur = imgs[on];
      const back = origin && !reduce && openers.some(o => o.contains(origin)) && wrap(idx) === +origin.closest('[data-photo]').dataset.photo;
      lb.classList.remove('is-shown');
      if (back) {
        const o = origin.getBoundingClientRect();
        const f = cur.getBoundingClientRect();
        cur.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s 0.2s';
        cur.style.transformOrigin = '0 0';
        cur.style.transform = 'translate(' + (o.left - f.left) + 'px,' + (o.top - f.top) + 'px) scale(' + o.width / f.width + ',' + o.height / f.height + ')';
      }
      setTimeout(() => {
        lb.classList.remove('is-open'); document.body.classList.remove('lb-open');
        imgs.forEach(x => { x.classList.remove('is-on'); x.style.transition = ''; x.style.transform = ''; x.style.transformOrigin = ''; });
      }, back ? 480 : 300);
    }
    openers.forEach(o => o.addEventListener('click', e => { e.preventDefault(); open(+o.dataset.photo || 0, o); }));
    $('.lb__close', lb).addEventListener('click', close);
    $('.lb__bg', lb).addEventListener('click', close);
    $('.lb__arrow--prev', lb).addEventListener('click', () => show(idx - 1, -1));
    $('.lb__arrow--next', lb).addEventListener('click', () => show(idx + 1, 1));
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); show(idx + 1, 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(idx - 1, -1); }
    });
    let acc = 0, last = 0;
    lb.addEventListener('wheel', e => {
      if (e.target.closest('.lb__thumbs')) return;          // the strip scrolls on its own
      e.preventDefault();
      const now = performance.now();
      if (now - last > 180) acc = 0;
      acc += e.deltaY + e.deltaX; last = now;
      if (Math.abs(acc) > 60 && !busy) { const d = acc > 0 ? 1 : -1; show(idx + d, d); acc = 0; }
    }, { passive: false });
    let tx = 0, ty = 0;
    lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (e.target.closest('.lb__thumbs')) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) { const d = (Math.abs(dx) > Math.abs(dy) ? dx : dy) < 0 ? 1 : -1; show(idx + d, d); }
    }, { passive: true });
  }

  /* ---------- contact form → opens the visitor's mail client ---------- */
  const form = $('form[data-mailto]');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const lines = [];
      fd.forEach((v, k) => { if (typeof v === 'string' && v.trim()) lines.push(`${k}: ${v.trim()}`); });
      const subject = encodeURIComponent('Enquiry from create-interiors.com');
      const body = encodeURIComponent(lines.join('\n') + '\n\n(Floor plans / images can be attached to this email.)');
      location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${body}`;
    });
  }

  /* ---------- share link on project pages ---------- */
  const share = $('[data-share]');
  if (share) share.addEventListener('click', async e => {
    e.preventDefault();
    const data = { title: document.title, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); share.textContent = 'Link copied'; setTimeout(() => share.textContent = 'Share', 1800); }
    } catch (_) {}
  });
})();

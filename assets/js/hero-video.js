/* ==========================================================================
   Home hero — video in two parts
   1. FRONT: the clip plays from the start and holds on the house front (CUT),
      with the CREATE logo over it.
   2. INSIDE: the visitor's first scroll plays the rest of the clip, zooming in
      through the doors. Scrolling is held while it plays. When it ends, the
      headline fades in, the page is released, and the hero stays on the
      inside frame: there is no way back to the front.
   ========================================================================== */
(function () {
  const hero = document.querySelector('.hero--video');
  if (!hero) return;
  const video = hero.querySelector('video');
  const copy = hero.querySelector('.hero__copy');
  const logo = hero.querySelector('.hero__intro-logo');
  const CUT = parseFloat(hero.dataset.cut) || 0;      // 0 = no hold, play straight through
  const RATE = parseFloat(hero.dataset.rate) || 1;
  const START_ON_SCROLL = hero.dataset.start === 'scroll';
  const words = Array.from(hero.querySelectorAll('.hero__words span'));
  let wordTimer = null, wi = -1;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let phase = 'front';          // front → zoom → inside
  video.playbackRate = RATE;
  video.addEventListener('loadedmetadata', () => { video.playbackRate = RATE; });

  // one word at a time under the logo, fading in and out while we hold on the front
  function wordsStart(stepMs, once) {
    if (!words.length || wordTimer) return;
    const next = () => {
      if (once && wi >= words.length - 1) { clearInterval(wordTimer); return; }   // last word stays till the header
      wi = (wi + 1) % words.length;
      words.forEach((w, k) => w.classList.toggle('is-on', k === wi));
    };
    next();
    wordTimer = setInterval(next, stepMs || 2400);
  }
  function wordsStop() {
    clearInterval(wordTimer); wordTimer = null;
    words.forEach(w => w.classList.remove('is-on'));
  }
  let frontPlayed = false;      // did part 1 actually play (autoplay can be blocked)?

  const setDark = () => document.body.classList.toggle('is-dark', hero.getBoundingClientRect().bottom > 70);

  function finish() {
    phase = 'inside';
    hero.classList.add('is-inside');
    document.body.classList.remove('hero-hold');
    if (logo) logo.classList.remove('is-on');
    wordsStop();
    if (copy) { copy.style.transition = 'opacity 0.6s, transform 0.6s'; copy.style.opacity = 1; copy.style.transform = 'translateY(-50%)'; }
    try { sessionStorage.setItem('hero-inside', '1'); } catch (_) {}
  }

  // hold the clip on the house front
  function holdAtCut() {
    if (phase !== 'front') return;
    if (video.currentTime >= CUT - 0.04) { video.pause(); video.currentTime = CUT; return; }
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(holdAtCut);
    else setTimeout(holdAtCut, 40);
  }

  // part 2: play through to the end, then lock
  function playThrough() {
    if (phase !== 'front') return;
    phase = 'zoom';
    document.body.classList.add('hero-hold');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (logo) logo.classList.remove('is-on');     // logo fades away, the words take its place
    hero.classList.add('is-words');
    const total = ((video.duration || 12) / RATE) * 1000;
    wordsStart(Math.max(600, Math.floor(total / Math.max(1, words.length))), true);
    const p = video.play();
    if (p && p.catch) p.catch(finish);
    video.addEventListener('ended', finish, { once: true });
    setTimeout(() => { if (phase === 'zoom') finish(); }, total + 4000);
  }

  function zoomIn() {
    if (START_ON_SCROLL) { playThrough(); return; }
    if (phase !== 'front') return;
    phase = 'zoom';
    document.body.classList.add('hero-hold');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (logo) logo.classList.remove('is-on');
    wordsStop();
    // scrolled early? just keep rolling through the cut, no jump. Autoplay blocked (still at 0)? start at the cut.
    if (video.paused && video.currentTime < 0.2) video.currentTime = CUT;
    const p = video.play();
    if (p && p.catch) p.catch(finish);
    video.addEventListener('ended', finish, { once: true });
    setTimeout(() => { if (phase === 'zoom') finish(); }, 9000);   // safety net if playback stalls
  }

  // any scroll intent while on the front starts the zoom (and is swallowed)
  function intent(e) {
    if (CUT <= 0 && !START_ON_SCROLL) return;   // autoplay-through: scrolling is free
    if (phase === 'front') { if (e.cancelable) e.preventDefault(); zoomIn(); return; }
    if (phase === 'zoom' && e.cancelable) e.preventDefault();
  }
  window.addEventListener('wheel', intent, { passive: false });
  window.addEventListener('touchmove', intent, { passive: false });
  window.addEventListener('keydown', e => {
    if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) intent(e);
  });
  window.addEventListener('scroll', () => { if ((CUT > 0 || START_ON_SCROLL) && phase === 'front' && window.scrollY > 0) zoomIn(); setDark(); }, { passive: true });

  // returning within the same session: go straight to the inside frame
  let seen = false;
  try { seen = sessionStorage.getItem('hero-inside') === '1'; } catch (_) {}

  if (reduce || seen) {
    video.removeAttribute('autoplay');
    video.currentTime = Math.max(0, video.duration || 9.9);
    video.addEventListener('loadedmetadata', () => { video.currentTime = Math.max(0, video.duration - 0.05); }, { once: true });
    finish();
  } else if (START_ON_SCROLL) {
    video.pause();
    try { video.currentTime = 0; } catch (_) {}
    if (logo) setTimeout(() => logo.classList.add('is-on'), 500);
  } else {
    if (logo) setTimeout(() => logo.classList.add('is-on'), 600);
    setTimeout(wordsStart, 1300);
    const start = () => {
      const p = video.play();
      const go = () => {
        frontPlayed = true;
        if (CUT > 0) { holdAtCut(); return; }
        // play-through: logo + words stay for the approach, go as the camera reaches the doors
        phase = 'zoom';
        document.body.classList.remove('hero-hold');
        const watch = () => {
          if (phase !== 'zoom') return;
          if (video.currentTime >= (video.duration || 12) * 0.7) { if (logo) logo.classList.remove('is-on'); wordsStop(); return; }
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(watch); else setTimeout(watch, 80);
        };
        watch();
        video.addEventListener('ended', finish, { once: true });
      };
      if (p && p.then) p.then(go).catch(() => { /* blocked: poster shows the front; retry on first interaction */ });
      else go();
    };
    if (video.readyState >= 2) start(); else video.addEventListener('loadeddata', start, { once: true });
    // autoplay blocked? the first interaction counts as a user gesture: try part 1 again
    const retry = () => { if (!frontPlayed && video.paused) start(); };
    ['pointerdown', 'pointermove', 'touchstart'].forEach(ev => window.addEventListener(ev, retry, { once: true, passive: true }));
  }
  setDark();
})();

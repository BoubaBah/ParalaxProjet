/* =========================================================
   HORIZONS — Parallax Engine
   - translateY par couche selon data-speed (0 = fixe, 1 = vitesse normale)
   - requestAnimationFrame + lecture de scrollY throttlée
   - IntersectionObserver pour les reveals et le compteur de stats
   ========================================================= */

(() => {
  const doc = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCompact = window.matchMedia('(max-width: 820px)').matches;

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 500);
  });

  /* ---------- Nav background on scroll ---------- */
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');

  /* ---------- Parallax layers ---------- */
  // Reading layout (getBoundingClientRect) inside the scroll handler forces
  // a synchronous reflow on every frame, which is the main cause of jank
  // and dropped/late frames on phones — that lag is what made whole blocks
  // of text appear to "leak" into the wrong section during a fast swipe.
  // Instead we measure each section's document-relative offset once (on
  // load and on resize) and do pure arithmetic on scroll.
  //
  // On phones we also only animate the plain background layers (image +
  // tint/gradient) and leave text, buttons and the speed legend static.
  // Those background layers are cheap: no filter, no blend mode, nothing
  // but a translate. The text blocks were the ones visibly detaching from
  // their section during a fast swipe, so on touch/narrow screens we don't
  // move them at all — depth still reads from the image drifting behind
  // static text, at a fraction of the paint cost.
  const BACKGROUND_LAYER_CLASSES = ['layer-back', 'layer-tint', 'statement-bg', 'stats-bg', 'outro-bg'];
  const isBackgroundLayer = (el) => BACKGROUND_LAYER_CLASSES.some((c) => el.classList.contains(c));

  const layers = Array.from(document.querySelectorAll('[data-speed]'))
    .filter((el) => !isCompact || isBackgroundLayer(el))
    .map((el) => {
      const section = el.closest('section') || el.parentElement;
      return { el, section, speed: parseFloat(el.dataset.speed), top: 0, height: 0 };
    });

  function measureLayers() {
    layers.forEach((layer) => {
      const rect = layer.section.getBoundingClientRect();
      layer.top = rect.top + window.scrollY;
      layer.height = rect.height;
    });
  }

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;
    const docH = doc.scrollHeight - viewportH;

    // Progress bar
    const progress = docH > 0 ? (scrollY / docH) * 100 : 0;
    progressBar.style.width = `${progress}%`;

    // Nav state
    nav.classList.toggle('scrolled', scrollY > 40);

    if (!prefersReduced) {
      // Skip sections nowhere near the viewport: writing a transform still
      // costs a style recalculation, and on a long page most of the 20+
      // parallax layers are off-screen at any given moment. This is the
      // single biggest saving on the phone's main thread during a fast
      // swipe, which is when frames were falling behind and stale content
      // stayed painted a moment too long.
      const margin = viewportH * 1.25;
      layers.forEach(({ el, top, height, speed }) => {
        const sectionTopVP = top - scrollY;
        if (sectionTopVP + height < -margin || sectionTopVP > viewportH + margin) return;
        const sectionCenter = top + height / 2 - scrollY - viewportH / 2;
        const offset = -sectionCenter * (1 - speed);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measureLayers();
      updateParallax();
    }, 150);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  measureLayers();
  updateParallax();
  // Re-measure once more after full load in case fonts/images shifted
  // section heights.
  window.addEventListener('load', measureLayers);

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Stat counters ---------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statNumbers.forEach((el) => statObserver.observe(el));

  /* ---------- Floating particles (dust / embers / birds) ---------- */
  function spawnParticles(containerId, count, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container || prefersReduced) return;
    const { minSize = 2, maxSize = 5, minDur = 10, maxDur = 22, color } = opts;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const size = minSize + Math.random() * (maxSize - minSize);
      const dur = minDur + Math.random() * (maxDur - minDur);
      const delay = Math.random() * dur;
      const left = Math.random() * 100;

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${left}%`;
      p.style.bottom = `-5%`;
      p.style.animationDuration = `${dur}s`;
      p.style.animationDelay = `-${delay}s`;
      if (color) p.style.background = color;
      container.appendChild(p);
    }
  }

  // Fewer particles on phones: each one is a continuously-animating
  // composited layer, and phone GPUs have far less headroom for that
  // than a desktop.
  const particleScale = isCompact ? 0.5 : 1;
  spawnParticles('particles-lake', Math.round(22 * particleScale), { color: 'rgba(244,162,89,0.7)', minSize: 2, maxSize: 4 });
  spawnParticles('particles-city', Math.round(18 * particleScale), { color: 'rgba(127,216,255,0.65)', minSize: 2, maxSize: 5 });
  spawnParticles('particles-road', Math.round(26 * particleScale), { color: 'rgba(245,241,232,0.5)', minSize: 1.5, maxSize: 3, minDur: 4, maxDur: 9 });

  /* ---------- Smooth anchor scroll offset for fixed nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();

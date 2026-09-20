/* =========================================================
   HORIZONS — Parallax Engine
   - translateY par couche selon data-speed (0 = fixe, 1 = vitesse normale)
   - requestAnimationFrame + lecture de scrollY throttlée
   - IntersectionObserver pour les reveals et le compteur de stats
   ========================================================= */

(() => {
  const doc = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 500);
  });

  /* ---------- Nav background on scroll ---------- */
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progressBar');

  /* ---------- Parallax layers ---------- */
  const layers = Array.from(document.querySelectorAll('[data-speed]'));
  let ticking = false;
  let lastScrollY = window.scrollY;

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
      layers.forEach((el) => {
        const speed = parseFloat(el.dataset.speed);
        // Distance from this element's section top to the viewport,
        // used so the offset is relative to each section (keeps layers
        // aligned when sections are tall / stacked).
        const rect = el.closest('section') ? el.closest('section').getBoundingClientRect() : el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2 - viewportH / 2;
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

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateParallax();

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

  spawnParticles('particles-lake', 22, { color: 'rgba(244,162,89,0.7)', minSize: 2, maxSize: 4 });
  spawnParticles('particles-city', 18, { color: 'rgba(127,216,255,0.65)', minSize: 2, maxSize: 5 });
  spawnParticles('particles-road', 26, { color: 'rgba(245,241,232,0.5)', minSize: 1.5, maxSize: 3, minDur: 4, maxDur: 9 });

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

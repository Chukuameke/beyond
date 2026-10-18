(function () {
  function init() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');

    /* ---------- 1. Nav gets a white background once the hero is scrolled past ---------- */
    if (nav) {
      // the home page hero, or the hero of the speakers / sponsors / register pages
      const heroEl = document.getElementById('home') ||
                     document.querySelector('.hero, .spg-hero, .spn-hero, .reg-hero');
      const onScroll = () => {
        const limit = heroEl ? heroEl.offsetHeight - nav.offsetHeight : 10;
        nav.classList.toggle('scrolled', window.scrollY > limit);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
    }

    /* ---------- 2. Mobile menu ---------- */
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    }

    /* ---------- 3. Active link ---------- */
    if (links) {
      const navAnchors = [...links.querySelectorAll('a')];
      const norm = s => (s || '').toLowerCase().replace(/\.html$/, '') || 'index';
      const here = norm(location.pathname.split('/').pop());
      const setActive = el => navAnchors.forEach(a => a.classList.toggle('active', a === el));

      // a) links to other pages: highlight the page we are on
      const pageLink = navAnchors.find(a => {
        const h = a.getAttribute('href') || '';
        return !h.startsWith('#') && norm(h.split('#')[0].split('/').pop()) === here;
      });
      if (pageLink) setActive(pageLink);

      // b) links to sections on this page: follow the scroll (home page)
      const spy = navAnchors.map(a => {
        const h = a.getAttribute('href') || '';
        return { a, el: h.length > 1 && h.startsWith('#') ? document.querySelector(h) : null };
      }).filter(x => x.el);
      if (spy.length && !pageLink) {
        window.addEventListener('scroll', () => {
          let current = spy[0];
          spy.forEach(s => { if (s.el.getBoundingClientRect().top <= 120) current = s; });
          setActive(current.a);
        }, { passive: true });
      }
    }

    /* ---------- 4. Countdown (home page only) ---------- */
    const cd = document.getElementById('countdown');
    if (cd) {
      const target = new Date(cd.dataset.date).getTime();
      const pad = n => String(n).padStart(2, '0');
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = pad(v); };
      const tick = () => {
        const d = Math.max(0, target - Date.now());
        set('cd-days', Math.floor(d / 864e5));
        set('cd-hours', Math.floor(d % 864e5 / 36e5));
        set('cd-mins', Math.floor(d % 36e5 / 6e4));
        set('cd-secs', Math.floor(d % 6e4 / 1e3));
      };
      tick();
      setInterval(tick, 1000);
    }

    /* ---------- 5. Parallax for the "About Beyond the Idea" image (home page only) ---------- */
    const btiHero = document.querySelector('.bti-about-hero');
    if (btiHero) {
      let ticking = false;
      const parallax = () => {
        const r = btiHero.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh) {
          const progress = (vh - r.top) / (vh + r.height);          // 0 when entering, 1 when leaving
          const shift = (progress - 0.5) * 2 * (r.height * 0.12);   // travel stays inside the 14% overhang
          btiHero.style.setProperty('--bti-shift', shift.toFixed(1) + 'px');
        }
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
      }, { passive: true });
      window.addEventListener('resize', parallax);
      parallax();
    }
  }

  // run once the page has loaded, wherever the script tag is placed
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


 
 // Nav gets a white background once the hero is scrolled past
 const nav = document.getElementById('nav');
 const hero = document.getElementById('home');
 function onScroll() {
   nav.classList.toggle('scrolled', window.scrollY > hero.offsetHeight - nav.offsetHeight);
 }
 window.addEventListener('scroll', onScroll, { passive: true });
 onScroll();

 // Mobile menu
 const toggle = document.getElementById('menuToggle');
 const links = document.getElementById('navLinks');
 toggle.addEventListener('click', () => {
   const open = links.classList.toggle('open');
   toggle.setAttribute('aria-expanded', open);
 });
 links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

 // Active link follows the section in view
 const navAnchors = [...links.querySelectorAll('a')];
 const sections = navAnchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
 window.addEventListener('scroll', () => {
   let current = sections[0];
   sections.forEach(s => { if (s.getBoundingClientRect().top <= 120) current = s; });
   navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
 }, { passive: true });

 // Countdown
 const target = new Date(document.getElementById('countdown').dataset.date).getTime();
 const pad = n => String(n).padStart(2, '0');
 function tick() {
   const d = Math.max(0, target - Date.now());
   document.getElementById('cd-days').textContent = pad(Math.floor(d / 864e5));
   document.getElementById('cd-hours').textContent = pad(Math.floor(d % 864e5 / 36e5));
   document.getElementById('cd-mins').textContent = pad(Math.floor(d % 36e5 / 6e4));
   document.getElementById('cd-secs').textContent = pad(Math.floor(d % 6e4 / 1e3));
 }
 tick();
 setInterval(tick, 1000);

 // Parallax for the "About Beyond the Idea" image section
 const btiHero = document.querySelector('.bti-about-hero');
 let btiTicking = false;
 function btiParallax() {
   const r = btiHero.getBoundingClientRect();
   const vh = window.innerHeight;
   if (r.bottom > 0 && r.top < vh) {
     const progress = (vh - r.top) / (vh + r.height);          // 0 when entering, 1 when leaving
     const shift = (progress - 0.5) * 2 * (r.height * 0.12);   // travel stays inside the 14% overhang
     btiHero.style.setProperty('--bti-shift', shift.toFixed(1) + 'px');
   }
   btiTicking = false;
 }
 window.addEventListener('scroll', () => {
   if (!btiTicking) { requestAnimationFrame(btiParallax); btiTicking = true; }
 }, { passive: true });
 window.addEventListener('resize', btiParallax);
 btiParallax();


 
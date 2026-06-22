/* ============================================================
   Forrest Blais Portfolio — main.js
   Carousel · Gallery Tabs · Lightbox · Stats Counter · Nav
   ============================================================ */

'use strict';

/* ---- Sticky header shadow on scroll ---- */
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 20
      ? '0 2px 24px rgba(0,0,0,0.5)'
      : '';
  }, { passive: true });
}

/* ---- Mobile Menu ---- */
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const menuClose  = document.querySelector('.menu-close');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

/* ---- Active nav highlighting ---- */
(function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkFile = href.split('/').pop();
    if (linkFile === path || (path === '' && linkFile === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ---- Stats Counter Animation ---- */
function animateCounter(el, target, duration) {
  duration = duration || 1600;
  const suffix = el.dataset.suffix || '';
  const start  = performance.now();
  (function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  })(start);
}

const statsEl = document.querySelector('.hero-stats');
if (statsEl) {
  let done = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !done) {
      done = true;
      statsEl.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count, 10));
      });
    }
  }, { threshold: 0.5 });
  observer.observe(statsEl);
}

/* ---- Carousel ---- */
(function initCarousel() {
  const wrapper = document.querySelector('.carousel-wrapper');
  if (!wrapper) return;

  const track   = wrapper.querySelector('.carousel-track');
  const slides  = wrapper.querySelectorAll('.carousel-slide');
  const dots    = wrapper.querySelectorAll('.carousel-dot');
  const counter = wrapper.querySelector('.carousel-counter');
  const titleEl = wrapper.querySelector('.carousel-title');
  const prevBtn = wrapper.querySelector('.carousel-btn-prev');
  const nextBtn = wrapper.querySelector('.carousel-btn-next');

  if (!track || slides.length === 0) return;

  let current   = 0;
  let startX    = 0;
  let isDragging = false;
  let autoTimer;

  function goTo(i) {
    current = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
    if (titleEl) titleEl.textContent = slides[current].dataset.title || '';
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetAuto(); }));

  /* Touch / mouse swipe */
  track.addEventListener('touchstart',  e => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
  track.addEventListener('touchend',    e => {
    if (!isDragging) return;
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) { goTo(current + (dx > 0 ? 1 : -1)); resetAuto(); }
    isDragging = false;
  });
  track.addEventListener('mousedown',   e => { startX = e.clientX; isDragging = true; e.preventDefault(); });
  window.addEventListener('mouseup',    e => {
    if (!isDragging) return;
    const dx = startX - e.clientX;
    if (Math.abs(dx) > 50) { goTo(current + (dx > 0 ? 1 : -1)); resetAuto(); }
    isDragging = false;
  });

  /* Auto-advance */
  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 5500); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', startAuto);

  goTo(0);
  startAuto();
})();

/* ---- Photography Gallery Tabs ---- */
(function initGalleryTabs() {
  const tabs  = document.querySelectorAll('.gallery-tab');
  const items = document.querySelectorAll('.gallery-item');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      items.forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });
})();

/* ---- Lightbox ---- */
(function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;

  const lbImg  = lightbox.querySelector('.lightbox-img');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbPrev  = document.getElementById('lb-prev');
  const lbNext  = document.getElementById('lb-next');

  let images = [];
  let idx    = 0;

  function open(imgs, i) {
    images = imgs; idx = i;
    show();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function show() {
    if (lbImg && images[idx]) lbImg.src = images[idx];
  }
  function prev() { idx = (idx - 1 + images.length) % images.length; show(); }
  function next() { idx = (idx + 1)             % images.length; show(); }

  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const visItems = [...document.querySelectorAll('.gallery-item')]
        .filter(el => el.style.display !== 'none');
      const srcList = visItems.map(el => {
        const img = el.querySelector('img');
        return img ? img.src : '';
      });
      const clickedIdx = visItems.indexOf(item);
      open(srcList, clickedIdx >= 0 ? clickedIdx : 0);
    });
  });

  if (lbClose) lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  if (lbPrev) lbPrev.addEventListener('click', prev);
  if (lbNext) lbNext.addEventListener('click', next);
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });
})();

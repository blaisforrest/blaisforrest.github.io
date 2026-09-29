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

  let current      = 0;
  let startX       = 0;
  let isDragging   = false;
  let autoTimer;
  let videoPlaying = false;

  function goTo(i) {
    current = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
    if (titleEl) titleEl.textContent = slides[current].dataset.title || '';
  }

  function navigate(i) { videoPlaying = false; goTo(i); resetAuto(); }

  if (prevBtn) prevBtn.addEventListener('click', () => navigate(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigate(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => navigate(i)));

  /* Touch / mouse swipe */
  track.addEventListener('touchstart',  e => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
  track.addEventListener('touchend',    e => {
    if (!isDragging) return;
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) navigate(current + (dx > 0 ? 1 : -1));
    isDragging = false;
  });
  track.addEventListener('mousedown',   e => { startX = e.clientX; isDragging = true; e.preventDefault(); });
  window.addEventListener('mouseup',    e => {
    if (!isDragging) return;
    const dx = startX - e.clientX;
    if (Math.abs(dx) > 50) navigate(current + (dx > 0 ? 1 : -1));
    isDragging = false;
  });

  /* Auto-advance — stops while a Vimeo video is playing */
  function startAuto() {
    clearInterval(autoTimer);
    if (!videoPlaying) autoTimer = setInterval(() => { if (!videoPlaying) goTo(current + 1); }, 5500);
  }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', () => { if (!videoPlaying) startAuto(); });

  /* Listen for Vimeo play/pause/finish events via postMessage */
  window.addEventListener('message', e => {
    if (typeof e.origin === 'string' && !e.origin.includes('vimeo.com')) return;
    let data;
    try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!data || !data.event) return;
    if (data.event === 'play') {
      videoPlaying = true;
      clearInterval(autoTimer);
    } else if (data.event === 'pause' || data.event === 'finish' || data.event === 'ended') {
      videoPlaying = false;
      startAuto();
    }
  });

  /* Register for Vimeo events once each iframe loads */
  function registerVimeoListeners() {
    wrapper.querySelectorAll('iframe[src*="vimeo.com"]').forEach(iframe => {
      try {
        ['play', 'pause', 'finish', 'ended'].forEach(evt => {
          iframe.contentWindow.postMessage(
            JSON.stringify({ method: 'addEventListener', value: evt }),
            'https://player.vimeo.com'
          );
        });
      } catch (err) {}
    });
  }
  wrapper.querySelectorAll('iframe[src*="vimeo.com"]').forEach(iframe => {
    iframe.addEventListener('load', registerVimeoListeners);
  });
  registerVimeoListeners();

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

/* ---- Rope scroll character ---- */
(function initScrollChar() {
  const charEl   = document.getElementById('scroll-char');
  const ropeEl   = document.getElementById('rope-line');
  const headerEl = document.querySelector('.site-header');
  if (!charEl || !ropeEl) return;

  /* Frame helper */
  const frame = n => {
    const idx = String(n).padStart(2, '0');
    return `<img src="images/char-frame-${idx}.png?v=2" alt="" style="width:100%;display:block;">`;
  };

  const idleFrames = [frame(0)];
  const pullFrames = Array.from({length: 27}, (_, i) => frame(i));

  let mode = 'idle', stopTimer, lastPullFrame = -1;

  /* Height of the sticky nav — rope starts from its bottom edge */
  function navBottom() {
    return headerEl ? headerEl.getBoundingClientRect().bottom : 0;
  }

  function updateRope() {
    const nb  = navBottom();
    const top = charEl.getBoundingClientRect().top;
    ropeEl.style.top    = nb + 'px';
    ropeEl.style.height = Math.max(top - nb + charEl.offsetHeight * 0.55, 0) + 'px';
  }

  function startIdle() {
    mode = 'idle';
    charEl.className = 'idle';
    charEl.innerHTML = idleFrames[0];
  }

  function startPull() {
    mode = 'pull';
    charEl.className = 'pull';
  }

  charEl.innerHTML = idleFrames[0];
  startIdle();

  function positionChar() {
    const viewH     = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    const maxScroll = document.documentElement.scrollHeight - viewH;
    const scrolled  = window.scrollY;
    const progress  = maxScroll > 0 ? Math.min(scrolled / maxScroll, 1) : 0;

    const nb      = navBottom();
    const charH   = charEl.offsetHeight || 200;
    const topStart = viewH - charH;          /* character bottom flush with viewport bottom */
    const topEnd   = nb - charH * 0.75;      /* 3/4 above nav, bottom 1/4 still visible */
    const charTop  = topStart - progress * (topStart - topEnd);
    charEl.style.top = charTop + 'px';
    return progress;
  }

  /* Set initial position before any scroll happens */
  positionChar();
  charEl.style.opacity = '1';
  ropeEl.style.opacity = '0.5';
  updateRope();

  window.addEventListener('scroll', () => {
    const progress = positionChar();

    charEl.style.opacity = '1';
    ropeEl.style.opacity = '0.5';

    if (mode !== 'pull') startPull();

    /* Cycle through all frames repeatedly — 8 full loops across the whole scroll */
    const cycles = 8;
    const fi = Math.floor((progress * pullFrames.length * cycles) % pullFrames.length);
    if (fi !== lastPullFrame) {
      charEl.innerHTML = pullFrames[fi];
      lastPullFrame = fi;
    }

    updateRope();

    clearTimeout(stopTimer);
    stopTimer = setTimeout(startIdle, 320);
  }, { passive: true });

  window.addEventListener('resize', () => { positionChar(); updateRope(); }, { passive: true });
})();

/* ---- Well descent effect ---- */
(function initWell() {
  const spacer      = document.getElementById('well-spacer');
  const darkEl      = document.getElementById('well-dark');
  const leftEl      = document.getElementById('well-left');
  const rightEl     = document.getElementById('well-right');
  const bottomEl    = document.getElementById('well-bottom-bricks');
  const waterEl     = document.getElementById('well-water');
  const glowEl      = document.getElementById('well-water-glow');
  if (!spacer || !darkEl) return;

  function onScroll() {
    const spacerTop  = spacer.getBoundingClientRect().top;
    const viewH      = window.innerHeight;

    if (spacerTop >= viewH) {
      /* Haven't entered well yet */
      darkEl.style.opacity  = 0;
      leftEl.style.opacity  = 0;
      rightEl.style.opacity = 0;
      bottomEl.style.opacity = 0;
      waterEl.style.opacity = 0;
      glowEl.style.opacity  = 0;
      return;
    }

    /* How far into the well spacer we've scrolled (0→1) */
    const wellScrollable = spacer.offsetHeight - viewH;
    const wellScrolled   = Math.max(-spacerTop, 0);
    const p = wellScrollable > 0 ? Math.min(wellScrolled / wellScrollable, 1) : 0;

    /* Darkness fades in progressively */
    darkEl.style.opacity = (p * 0.9).toFixed(3);

    /* Hide brick elements */
    leftEl.style.opacity   = 0;
    rightEl.style.opacity  = 0;
    bottomEl.style.opacity = 0;

    /* Water rises from the bottom — last 30% of scroll */
    const waterP = p < 0.7 ? 0 : (p - 0.7) / 0.3;
    waterEl.style.height  = Math.floor(waterP * 50) + 'vh';
    waterEl.style.opacity = waterP.toFixed(3);

    /* Glow cast upward */
    const glowOpacity = waterP * 0.9;
    glowEl.style.setProperty('--glow-base', glowOpacity.toFixed(3));
    glowEl.style.height  = Math.floor(waterP * 80) + 'vh';
    glowEl.style.opacity = glowOpacity.toFixed(3);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Formspree endpoint
const FORM_ENDPOINT = 'https://formspree.io/f/mbgdqbow';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav scroll state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Custom-paced smooth scroll for in-page links. Any wheel, touch or key input
// from the user cancels it, so the page never fights them for control.
const scrollInterruptEvents = ['wheel', 'touchstart', 'keydown'];
let scrollRaf = null;

function cancelSmoothScroll() {
  if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
  scrollRaf = null;
  scrollInterruptEvents.forEach(type => window.removeEventListener(type, cancelSmoothScroll));
}

function smoothScrollTo(targetY, duration = 600) {
  cancelSmoothScroll();
  if (reduceMotion) {
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
    return;
  }
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: startY + diff * eased, left: 0, behavior: 'instant' });
    if (t < 1) scrollRaf = requestAnimationFrame(step);
    else cancelSmoothScroll();
  }
  scrollInterruptEvents.forEach(type =>
    window.addEventListener(type, cancelSmoothScroll, { once: true, passive: true }));
  scrollRaf = requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY);
  });
});

// Hero parallax
if (!reduceMotion) {
  const heroShapes = document.querySelector('.hero__shapes');
  const heroContent = document.querySelector('.hero__content');
  let parallaxTicking = false;

  function updateParallax() {
    const y = window.scrollY;
    if (heroShapes) heroShapes.style.transform = `translateY(${y * 0.18}px)`;
    if (heroContent) {
      heroContent.style.transform = `translateY(${y * 0.1}px)`;
      heroContent.style.opacity = Math.max(1 - y / 500, 0);
    }
    parallaxTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!parallaxTicking) {
      requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  });
}

// Mobile menu
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function setMobileMenu(open) {
  mobileMenu.classList.toggle('open', open);
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
}

burger.addEventListener('click', () => setMobileMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setMobileMenu(false));
});

// Portfolio filters
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');
const grid = document.getElementById('grid');
const gridEmpty = document.getElementById('gridEmpty');
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    const value = btn.dataset.filter;
    let matches = 0;
    cards.forEach(card => {
      const match = value === 'all' || card.dataset.cat === value;
      card.classList.toggle('hidden-filter', !match);
      if (match) matches++;
    });
    grid.hidden = matches === 0;
    gridEmpty.hidden = matches > 0;
  });
});

// Video modal (facade — iframe only loads on click). Opens out of the clicked
// card and shrinks back into it (FLIP), and either direction can be
// interrupted mid-flight.
const videoModal = document.getElementById('videoModal');
const videoModalBox = videoModal.querySelector('.video-modal__box');
const videoModalInner = videoModal.querySelector('.video-modal__inner');
const videoModalPlayer = document.getElementById('videoModalPlayer');
const videoModalClose = document.getElementById('videoModalClose');
const MODAL_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
let modalTrigger = null;
let modalAnim = null;

// Transform that lays the (untransformed) modal box over the trigger's media
function triggerTransform() {
  if (reduceMotion || !modalTrigger) return 'none';
  const media = modalTrigger.querySelector('.card__thumb, .hero__preview-media') || modalTrigger;
  const from = media.getBoundingClientRect();
  if (!from.width) return 'none';
  const to = videoModalBox.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`;
}

// Stops an in-flight animation and returns where the box is on screen right
// now, so the next animation starts from there instead of jumping
function haltModalAnim() {
  if (!modalAnim) return null;
  const { transform, opacity } = getComputedStyle(videoModalBox);
  modalAnim.cancel();
  modalAnim = null;
  return { transform, opacity };
}

function animateModalBox(from, to, onDone) {
  modalAnim = videoModalBox.animate([from, to], {
    duration: reduceMotion ? 200 : 350,
    easing: MODAL_EASING,
  });
  modalAnim.onfinish = () => {
    modalAnim = null;
    if (onDone) onDone();
  };
}

function openVideoModal(videoId, trigger) {
  const current = haltModalAnim();
  modalTrigger = trigger;
  videoModalInner.style.backgroundImage = `url('https://i.ytimg.com/vi/${videoId}/hqdefault.jpg')`;
  videoModalPlayer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  videoModal.inert = false;
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  animateModalBox(current || { transform: triggerTransform(), opacity: 0 }, { transform: 'none', opacity: 1 });
  videoModalClose.focus({ preventScroll: true });
}

function closeVideoModal() {
  if (!videoModal.classList.contains('open')) return;
  const current = haltModalAnim() || { transform: 'none', opacity: 1 };
  // Measure before the scrollbar comes back and shifts the layout
  const target = triggerTransform();
  videoModal.classList.remove('open');
  videoModal.inert = true;
  document.body.style.overflow = '';
  animateModalBox(current, { transform: target, opacity: 0 }, () => {
    videoModalPlayer.innerHTML = '';
  });
  if (modalTrigger) modalTrigger.focus({ preventScroll: true });
}

cards.forEach(card => {
  const videoId = card.dataset.video;
  if (!videoId) return;
  card.addEventListener('click', () => openVideoModal(videoId, card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideoModal(videoId, card);
    }
  });
});

const heroAside = document.getElementById('heroAside');
const heroPreview = document.getElementById('heroPreview');
if (heroPreview) {
  const heroVideos = [
    { id: 'BlSJeWXsxzc', title: 'vlog meia maratona floripa' },
    { id: 'iew5npO-93A', title: 'como manter a dieta durante a semana' },
    { id: 'agY1oMIIgfc', title: 'final de semana em Orlando' },
    { id: '065tihMJ19s', title: 'como melhorar seus resultados em visitas comerciais' },
  ];
  const heroPreviewMedia = heroPreview.querySelector('.hero__preview-media');
  const heroPreviewTitle = heroPreview.querySelector('.hero__preview-title');
  const heroDots = heroAside.querySelectorAll('.hero__dot');
  let heroVideoIndex = 0;
  let heroRotateTimer = null;
  let heroFadeTimer = null;

  function setHeroVideo(index) {
    const v = heroVideos[index];
    heroPreview.dataset.video = v.id;
    heroPreviewMedia.style.backgroundImage = `url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg')`;
    heroPreviewTitle.textContent = v.title;
    heroPreview.setAttribute('aria-label', `Assistir: ${v.title}`);
  }

  function showHeroVideo(index) {
    heroVideoIndex = index;
    heroDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    clearTimeout(heroFadeTimer);
    heroPreview.classList.add('fading');
    heroFadeTimer = setTimeout(() => {
      setHeroVideo(index);
      heroPreview.classList.remove('fading');
    }, 300);
  }

  function stopHeroRotation() {
    clearInterval(heroRotateTimer);
    heroRotateTimer = null;
  }

  // Always starts a fresh timer
  function startHeroRotation() {
    stopHeroRotation();
    if (reduceMotion || videoModal.classList.contains('open')) return;
    heroRotateTimer = setInterval(() => showHeroVideo((heroVideoIndex + 1) % heroVideos.length), 4500);
  }

  startHeroRotation();
  ['mouseenter', 'focusin', 'pointerdown'].forEach(type => heroAside.addEventListener(type, stopHeroRotation));
  heroAside.addEventListener('mouseleave', startHeroRotation);
  heroAside.addEventListener('focusout', (e) => {
    if (heroAside.contains(e.relatedTarget)) return;
    startHeroRotation();
  });

  // Picking a video pauses rotation; it restarts with a fresh timer once the
  // pointer or focus leaves the card
  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopHeroRotation();
      if (i !== heroVideoIndex) showHeroVideo(i);
    });
  });

  heroPreview.addEventListener('click', () => openVideoModal(heroPreview.dataset.video, heroPreview));
  heroPreview.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideoModal(heroPreview.dataset.video, heroPreview);
    }
  });
}

videoModalClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeVideoModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVideoModal();
});

// Focus trap: sentinels on either side of the box wrap Tab around. Sentinels
// (rather than a keydown handler) also catch Tab leaving the YouTube iframe,
// whose key events never reach this document.
videoModal.querySelectorAll('[data-trap]').forEach(trap => {
  trap.addEventListener('focus', () => {
    const iframe = videoModalPlayer.querySelector('iframe');
    if (trap.dataset.trap === 'start' && iframe) iframe.focus();
    else videoModalClose.focus();
  });
});

// Reveal cards on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
cards.forEach(card => revealObserver.observe(card));
document.querySelectorAll('.reveal, .section-seam').forEach(el => revealObserver.observe(el));

// Contact form (Formspree)
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const formSubmit = form.querySelector('.form__submit');
const formSubmitLabel = formSubmit.textContent;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formSubmit.disabled = true;
  formSubmit.textContent = 'Enviando…';
  formNote.textContent = '';
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Formspree respondeu ${res.status}`);
    form.reset();
    formSubmit.textContent = 'Mensagem enviada ✓';
    setTimeout(() => {
      formSubmit.textContent = formSubmitLabel;
      formSubmit.disabled = false;
    }, 4000);
  } catch {
    formSubmit.textContent = formSubmitLabel;
    formSubmit.disabled = false;
    formNote.textContent = 'Não foi possível enviar. Tente pelo e-mail its.gbedit@gmail.com';
  }
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

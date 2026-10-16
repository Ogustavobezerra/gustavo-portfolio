// Formspree endpoint
const FORM_ENDPOINT = 'https://formspree.io/f/mbgdqbow';

// Single source of truth: the work grid, the hero timeline and the filter
// counts are all rendered from this list. Adding an item with
// `format: 'vertical'` updates the filters and counters on its own.
// `platform` defaults to YouTube (thumbnail comes from YouTube); Instagram and
// TikTok items need `url` (the post link) and `thumb` (a cover in assets/).
const VIDEOS = [
  { id: 'BlSJeWXsxzc', title: 'vlog meia maratona floripa | retirada de kit + pré e pós', short: 'Meia maratona de Floripa', format: 'horizontal', meta: 'Horizontal · YouTube · Vlog' },
  { id: 'iew5npO-93A', title: 'como manter a dieta durante a semana (preparando marmitas)', short: 'Dieta da semana', format: 'horizontal', meta: 'Horizontal · YouTube · Lifestyle' },
  { id: 'agY1oMIIgfc', title: 'final de semana em Orlando (Disney Springs, treinos, girls night)', short: 'Fim de semana em Orlando', format: 'horizontal', meta: 'Horizontal · YouTube · Vlog de viagem' },
  { id: '065tihMJ19s', title: 'como melhorar seus resultados em visitas comerciais', short: 'Visitas comerciais', format: 'horizontal', meta: 'Horizontal · Comercial · com @produtoracliffs' },
  { id: 'DdcilN5uSev', platform: 'instagram', url: 'https://www.instagram.com/reel/DdcilN5uSev/', thumb: 'assets/thumbs/ig-DdcilN5uSev.jpg', title: '3 erros que cometi começando a empreender', short: '3 erros empreendendo', format: 'vertical', meta: 'Vertical · Instagram · Reels' },
  { id: 'Db3zBv-yfmX', platform: 'instagram', url: 'https://www.instagram.com/reel/Db3zBv-yfmX/', thumb: 'assets/thumbs/ig-Db3zBv-yfmX.jpg', title: 'ozonioterapia na barbearia: novidade para a barba', short: 'Ozonioterapia na barbearia', format: 'vertical', meta: 'Vertical · Comercial · com @produtoracliffs' },
  { id: '7693295086523714834', platform: 'tiktok', url: 'https://www.tiktok.com/@danieluca___/video/7693295086523714834', thumb: 'assets/thumbs/tt-7693295086523714834.jpg', title: 'arrume-se comigo', short: 'Arrume-se comigo', format: 'vertical', meta: 'Vertical · TikTok · Lifestyle' },
  { id: '7694677527599729927', platform: 'tiktok', url: 'https://www.tiktok.com/@danieluca___/video/7694677527599729927', thumb: 'assets/thumbs/tt-7694677527599729927.jpg', title: 'trocando o fio da minha pulseira', short: 'Fio da pulseira', format: 'vertical', meta: 'Vertical · TikTok · Lifestyle' },
];

// The hero feature card is 16:9, so it only cycles through horizontal videos
const FEATURED = VIDEOS.filter(v => v.format === 'horizontal');

// Per-platform player: embed URL, link to the original post, button label and
// the aspect ratio of the player area in the modal
const PLATFORMS = {
  youtube: {
    embed: v => `https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`,
    link: v => `https://www.youtube.com/watch?v=${v.id}`,
    label: 'Assistir no YouTube ↗',
    ratio: 'landscape',
  },
  instagram: {
    embed: v => `https://www.instagram.com/reel/${v.id}/embed/`,
    link: v => v.url,
    label: 'Ver no Instagram ↗',
    ratio: 'instagram',
  },
  tiktok: {
    embed: v => `https://www.tiktok.com/player/v1/${v.id}?autoplay=1&rel=0&description=0&music_info=0`,
    link: v => v.url,
    label: 'Ver no TikTok ↗',
    ratio: 'portrait',
  },
};
const platformOf = v => PLATFORMS[v.platform || 'youtube'];

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.2, .8, .2, 1)';
const thumbUrl = v => v.thumb || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
const pad = n => String(n).padStart(2, '0');
const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Scroll lock shared by the mobile menu and the video modal
const locks = new Set();
function setScrollLock(key, on) {
  if (on) locks.add(key);
  else locks.delete(key);
  document.documentElement.classList.toggle('is-locked', locks.size > 0);
}

// ---------- Mobile menu ----------
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
mobileMenu.inert = true;

function setMenu(open) {
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.inert = !open;
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  setScrollLock('menu', open);
}

burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

// ---------- Work grid ----------
const grid = document.getElementById('grid');
const FORMAT_GROUPS = [['horizontal', 'Horizontal'], ['vertical', 'Vertical']];

const cardHtml = (v, i) => `
  <button class="card card--${v.format} reveal" type="button" data-index="${i}" aria-label="Assistir: ${escapeHtml(v.title)}">
    <span class="card__thumb">
      <img src="${thumbUrl(v)}" alt="" width="${v.format === 'vertical' ? 540 : 480}" height="${v.format === 'vertical' ? 960 : 360}" loading="lazy">
      <span class="badge">${pad(i + 1)} · ${v.format}</span>
      <span class="card__overlay" aria-hidden="true"><span class="card__play">${PLAY_ICON}</span></span>
    </span>
    <span class="card__title">${escapeHtml(v.title)}</span>
    <span class="card__meta">${escapeHtml(v.meta)}</span>
  </button>`;

// One group per format, each with its own column sizing (9:16 cards are narrower)
grid.innerHTML = FORMAT_GROUPS.map(([format, label]) => {
  const items = VIDEOS.map((v, i) => [v, i]).filter(([v]) => v.format === format);
  if (!items.length) return '';
  return `
  <div class="grid__group" data-format="${format}">
    <p class="grid__label">${label}</p>
    <div class="grid__items grid__items--${format}">${items.map(([v, i]) => cardHtml(v, i)).join('')}</div>
  </div>`;
}).join('');
grid.classList.add('is-all');

const cards = [...grid.querySelectorAll('.card')];
cards.forEach(card => {
  card.addEventListener('click', () => {
    openModal(VIDEOS[card.dataset.index], card.querySelector('.card__thumb'), card);
  });
});

// ---------- Filters ----------
const filterButtons = document.querySelectorAll('.filter');
const empty = document.getElementById('empty');
const emptyTitle = document.getElementById('emptyTitle');
const emptyText = document.getElementById('emptyText');
const EMPTY_COPY = {
  vertical: ['Nenhum vídeo vertical por aqui ainda', 'Reels, TikToks e Shorts entram em breve. Enquanto isso, veja os vídeos horizontais.'],
  horizontal: ['Nenhum vídeo horizontal por aqui ainda', 'Novos vídeos entram em breve. Enquanto isso, veja os outros formatos.'],
};

filterButtons.forEach(btn => {
  const f = btn.dataset.filter;
  btn.querySelector('.filter__count').textContent =
    f === 'all' ? VIDEOS.length : VIDEOS.filter(v => v.format === f).length;
  btn.addEventListener('click', () => applyFilter(f));
});

function applyFilter(filter) {
  filterButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === filter));
  grid.querySelectorAll('.grid__group').forEach(group => {
    group.hidden = filter !== 'all' && group.dataset.format !== filter;
  });
  // Group labels only help when both formats are on screen
  grid.classList.toggle('is-all', filter === 'all');
  const matches = VIDEOS.filter(v => filter === 'all' || v.format === filter).length;
  grid.hidden = matches === 0;
  empty.hidden = matches > 0;
  if (!matches && EMPTY_COPY[filter]) [emptyTitle.textContent, emptyText.textContent] = EMPTY_COPY[filter];
}

document.getElementById('emptyReset').addEventListener('click', () => {
  applyFilter('all');
  document.querySelector('.filter[data-filter="all"]').focus();
});

// ---------- Hero parallax ----------
const heroInner = document.querySelector('.hero__inner');
const heroGlow = document.querySelector('.hero__glow');
if (!reduceMotion) {
  let parallaxTicking = false;
  const updateParallax = () => {
    const y = Math.min(window.scrollY, window.innerHeight);
    heroGlow.style.transform = `translateY(${y * 0.3}px)`;
    heroInner.style.transform = `translateY(${y * 0.08}px)`;
    heroInner.style.opacity = Math.max(1 - y / 700, 0);
    parallaxTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(updateParallax);
  }, { passive: true });
}

// ---------- Hero feature + timeline ----------
const feature = document.getElementById('feature');
const featureImg = document.getElementById('featureImg');
const featureEyebrow = document.getElementById('featureEyebrow');
const featureTitle = document.getElementById('featureTitle');
const timeline = document.getElementById('timeline');
let featureIndex = 0;
let featureSwapTimer = null;

timeline.innerHTML = FEATURED.map((v, i) => `
  <button class="timeline__item" type="button" aria-pressed="${i === 0}">
    <img src="${thumbUrl(v)}" alt="" width="480" height="360" loading="lazy">
    <span class="timeline__label">${pad(i + 1)} · ${escapeHtml(v.short)}</span>
  </button>`).join('');

const timelineItems = [...timeline.querySelectorAll('.timeline__item')];
timelineItems.forEach((item, i) => item.addEventListener('click', () => setFeature(i)));

// Auto-rotation is driven by the progress bar on the active timeline item:
// when its CSS animation ends, the next video comes in. Pausing the bar
// therefore pauses the rotation, and it resumes exactly where it stopped.
// Selecting an item starts a fresh bar on it. No bar under reduced motion,
// so no rotation either.
const heroMedia = document.querySelector('.hero__media');
const rotationPauses = new Set();

function setRotationPaused(reason, paused) {
  if (paused) rotationPauses.add(reason);
  else rotationPauses.delete(reason);
  timeline.classList.toggle('is-paused', rotationPauses.size > 0);
}

timeline.addEventListener('animationend', (e) => {
  if (e.animationName === 'timelineProgress') setFeature((featureIndex + 1) % FEATURED.length);
});

heroMedia.addEventListener('mouseenter', () => setRotationPaused('hover', true));
heroMedia.addEventListener('mouseleave', () => setRotationPaused('hover', false));
// Only keyboard focus pauses; a tap leaves focus behind and would stall it
heroMedia.addEventListener('focusin', (e) => setRotationPaused('focus', e.target.matches(':focus-visible')));
heroMedia.addEventListener('focusout', (e) => {
  if (!heroMedia.contains(e.relatedTarget)) setRotationPaused('focus', false);
});
document.addEventListener('visibilitychange', () => setRotationPaused('hidden', document.hidden));
new IntersectionObserver(([entry]) => setRotationPaused('offscreen', !entry.isIntersecting))
  .observe(heroMedia);

function setFeature(index) {
  if (index === featureIndex) return;
  featureIndex = index;
  timelineItems.forEach((item, i) => item.setAttribute('aria-pressed', i === index));

  const v = FEATURED[index];
  const apply = () => {
    featureImg.src = thumbUrl(v);
    featureEyebrow.textContent = `Em destaque · ${pad(index + 1)}/${pad(FEATURED.length)}`;
    featureTitle.textContent = v.short;
    feature.setAttribute('aria-label', `Assistir: ${v.title}`);
    feature.classList.remove('is-swapping');
  };
  clearTimeout(featureSwapTimer);
  if (reduceMotion) return apply();
  // Quick crossfade: fade out, swap once faded, fade back in
  feature.classList.add('is-swapping');
  featureSwapTimer = setTimeout(apply, 160);
}

feature.addEventListener('click', () => openModal(FEATURED[featureIndex], featureImg, feature));

// ---------- Video modal ----------
// The panel grows out of the clicked thumbnail and shrinks back into it
// (FLIP). Either direction can be interrupted mid-flight: the next animation
// starts from wherever the panel is on screen.
const modal = document.getElementById('modal');
const modalPanel = document.getElementById('modalPanel');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const modalLink = document.getElementById('modalLink');
const modalClose = document.getElementById('modalClose');
let modalOrigin = null;   // element whose rect the panel animates from/to
let modalTrigger = null;  // element that gets focus back on close
let modalAnim = null;

// Transform that centres the panel's video area on the origin rect, scaled
// to its width (panel uses transform-origin: 0 0). Centring rather than
// top-aligning keeps it right when the two shapes differ (e.g. Instagram's
// 4:5 player growing out of a 9:16 card). Must be measured untransformed.
function originTransform() {
  if (reduceMotion || !modalOrigin) return 'none';
  const from = modalOrigin.getBoundingClientRect();
  if (!from.width) return 'none';
  const panel = modalPanel.getBoundingClientRect();
  const video = modalVideo.getBoundingClientRect();
  const s = from.width / video.width;
  const videoCx = video.left + video.width / 2 - panel.left;
  const videoCy = video.top + video.height / 2 - panel.top;
  const tx = from.left + from.width / 2 - panel.left - s * videoCx;
  const ty = from.top + from.height / 2 - panel.top - s * videoCy;
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}

function haltModalAnim() {
  if (!modalAnim) return null;
  const { transform, opacity } = getComputedStyle(modalPanel);
  modalAnim.cancel();
  modalAnim = null;
  return { transform, opacity };
}

function animatePanel(from, to, onDone) {
  const anim = modalPanel.animate([from, to], {
    duration: reduceMotion ? 200 : 380,
    easing: EASE,
    fill: 'forwards',
  });
  modalAnim = anim;
  anim.onfinish = () => {
    if (onDone) onDone();
    anim.cancel();
    if (modalAnim === anim) modalAnim = null;
  };
}

function openModal(video, origin, trigger) {
  const current = haltModalAnim();
  modalOrigin = origin;
  modalTrigger = trigger;

  const platform = platformOf(video);
  // Set the player shape before anything measures the panel
  modal.dataset.ratio = platform.ratio;
  modalVideo.style.backgroundImage = `url('${thumbUrl(video)}')`;
  modalVideo.innerHTML = `<iframe src="${platform.embed(video)}" title="${escapeHtml(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  modalTitle.textContent = video.title;
  modalMeta.textContent = video.meta;
  modalLink.href = platform.link(video);
  modalLink.textContent = platform.label;
  modalPanel.setAttribute('aria-label', video.title);

  modal.inert = false;
  modal.classList.remove('is-closing');
  modal.classList.add('is-open');
  setScrollLock('modal', true);
  setRotationPaused('modal', true);

  animatePanel(current || { transform: originTransform(), opacity: 0 }, { transform: 'none', opacity: 1 });
  modalClose.focus({ preventScroll: true });
}

function closeModal() {
  if (!modal.classList.contains('is-open')) return;
  const current = haltModalAnim() || { transform: 'none', opacity: 1 };
  const target = originTransform();

  modal.classList.remove('is-open');
  modal.classList.add('is-closing');
  modal.inert = true;
  setScrollLock('modal', false);
  setRotationPaused('modal', false);

  animatePanel(current, { transform: target, opacity: 0 }, () => {
    modal.classList.remove('is-closing');
    modalVideo.innerHTML = '';
  });
  if (modalTrigger) modalTrigger.focus({ preventScroll: true });
}

modalClose.addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', closeModal);

// Focus trap: sentinels on either side of the panel wrap Tab around. They
// also catch Tab leaving the YouTube iframe, whose key events never reach us.
modal.querySelectorAll('[data-trap]').forEach(trap => {
  trap.addEventListener('focus', () => {
    if (trap.dataset.trap === 'start') return modalClose.focus();
    (modalVideo.querySelector('iframe') || modalLink).focus();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (modal.classList.contains('is-open')) closeModal();
  else if (mobileMenu.classList.contains('is-open')) {
    setMenu(false);
    burger.focus();
  }
});

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll('.reveal');
// Cascade siblings that come into view together (cards in a row, services)
document.querySelectorAll('.grid__items, .services__grid').forEach(group => {
  [...group.children].forEach((el, i) => el.style.setProperty('--reveal-delay', `${(i % 4) * 90}ms`));
});
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));
}

// ---------- Contact form (Formspree) ----------
const form = document.getElementById('contactForm');
const formSubmit = document.getElementById('formSubmit');
const formNote = document.getElementById('formNote');
const formSuccess = document.getElementById('formSuccess');
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
    form.hidden = true;
    formSuccess.hidden = false;
    document.getElementById('formSuccessTitle').focus();
  } catch {
    formNote.textContent = 'Não foi possível enviar. Tente pelo e-mail its.gbedit@gmail.com';
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = formSubmitLabel;
  }
});

document.getElementById('formAgain').addEventListener('click', () => {
  formSuccess.hidden = true;
  form.hidden = false;
  document.getElementById('name').focus();
});

// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

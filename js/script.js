// Nav scroll state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Hero parallax
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

// Mobile menu
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  burger.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// Portfolio filters
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');
filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const value = btn.dataset.filter;
    cards.forEach(card => {
      const match = value === 'all' || card.dataset.cat === value;
      card.classList.toggle('hidden-filter', !match);
    });
  });
});

// Video modal (facade — iframe only loads on click)
const videoModal = document.getElementById('videoModal');
const videoModalPlayer = document.getElementById('videoModalPlayer');
const videoModalClose = document.getElementById('videoModalClose');

function openVideoModal(videoId) {
  videoModalPlayer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  videoModal.classList.remove('open');
  videoModalPlayer.innerHTML = '';
  document.body.style.overflow = '';
}

cards.forEach(card => {
  const videoId = card.dataset.video;
  if (!videoId) return;
  card.addEventListener('click', () => openVideoModal(videoId));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideoModal(videoId);
    }
  });
});

const heroPreview = document.getElementById('heroPreview');
if (heroPreview) {
  const heroVideos = [
    { id: 'BlSJeWXsxzc', title: 'vlog meia maratona floripa' },
    { id: 'iew5npO-93A', title: 'como manter a dieta durante a semana' },
    { id: 'agY1oMIIgfc', title: 'final de semana em Orlando' },
  ];
  const heroPreviewMedia = heroPreview.querySelector('.hero__preview-media');
  const heroPreviewTitle = heroPreview.querySelector('.hero__preview-title');
  let heroVideoIndex = 0;
  let heroRotateTimer = null;

  function setHeroVideo(index) {
    const v = heroVideos[index];
    heroPreview.dataset.video = v.id;
    heroPreviewMedia.style.backgroundImage = `url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg')`;
    heroPreviewTitle.textContent = v.title;
    heroPreview.setAttribute('aria-label', `Assistir: ${v.title}`);
  }

  function rotateHeroVideo() {
    heroVideoIndex = (heroVideoIndex + 1) % heroVideos.length;
    heroPreview.classList.add('fading');
    setTimeout(() => {
      setHeroVideo(heroVideoIndex);
      heroPreview.classList.remove('fading');
    }, 300);
  }

  function startHeroRotation() {
    heroRotateTimer = setInterval(rotateHeroVideo, 4500);
  }

  function stopHeroRotation() {
    clearInterval(heroRotateTimer);
  }

  startHeroRotation();
  heroPreview.addEventListener('mouseenter', stopHeroRotation);
  heroPreview.addEventListener('mouseleave', startHeroRotation);

  heroPreview.addEventListener('click', () => openVideoModal(heroPreview.dataset.video));
  heroPreview.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideoModal(heroPreview.dataset.video);
    }
  });
}

videoModalClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeVideoModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideoModal();
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
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Contact form (static demo — replace action with real backend/Formspree if needed)
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;
  const subject = encodeURIComponent(`Contato pelo site — ${name}`);
  const body = encodeURIComponent(`${message}\n\nDe: ${name} (${email})`);
  window.location.href = `mailto:its.gbedit@gmail.com?subject=${subject}&body=${body}`;
  formNote.textContent = 'Abrindo seu app de e-mail...';
  form.reset();
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

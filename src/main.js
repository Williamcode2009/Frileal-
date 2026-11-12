import '@fontsource-variable/bodoni-moda/wght.css';
import '@fontsource-variable/bodoni-moda/wght-italic.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './style.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createSphere } from './sphere.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

/* ── Desplazamiento suave ─────────────────────────────── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const scrollToTarget = (hash) => {
  const target = hash === '#inicio' ? document.body : $(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(hash === '#inicio' ? 0 : target, { offset: 0, duration: 1.4 });
  else target.scrollIntoView();
  if (hash !== '#inicio') {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
};

$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(hash);
    history.replaceState(null, '', hash === '#inicio' ? location.pathname : hash);
  }),
);

/* ── Menú móvil ───────────────────────────────────────── */
const menu = $('[data-menu]');
const toggle = $('[data-menu-toggle]');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  menu.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  $('.nav__toggle-label').textContent = 'Cerrar';
  document.body.classList.add('menu-open');
  lenis?.stop();
  gsap.killTweensOf([menu, '.menu__links a > *', '.menu__foot > *']);
  gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduced ? 0 : 0.9, ease: 'expo.inOut' });
  if (!reduced) {
    gsap.fromTo('.menu__links a > *', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: EASE, stagger: 0.06, delay: 0.35 });
    gsap.fromTo('.menu__foot > *', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.08, delay: 0.6 });
  }
}

function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  toggle.setAttribute('aria-expanded', 'false');
  $('.nav__toggle-label').textContent = 'Menú';
  document.body.classList.remove('menu-open');
  lenis?.start();
  gsap.to(menu, {
    clipPath: 'inset(0 0 100% 0)',
    duration: reduced ? 0 : 0.7,
    ease: 'expo.inOut',
    onComplete: () => !menuOpen && (menu.hidden = true),
  });
}

toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
window.matchMedia('(min-width: 900px)').addEventListener('change', closeMenu);

/* ── Barra de navegación: ocultar al bajar, mostrar al subir ── */
const nav = $('[data-nav]');
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate(self) {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > window.innerHeight * 0.5);
    nav.classList.toggle('is-hidden', !menuOpen && self.direction === 1 && y > window.innerHeight * 4);
  },
});

/* ── Ambientes claro / oscuro ─────────────────────────── */
$$('[data-theme]').forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle(self) {
      if (!self.isActive) return;
      const dark = section.dataset.theme === 'dark';
      document.body.classList.toggle('theme-dark', dark);
      document.body.classList.toggle('theme-light', !dark);
    },
  });
});

/* ── CTA flotante ─────────────────────────────────────── */
const fab = $('[data-fab]');
ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom 90%',
  endTrigger: '.closing',
  end: 'top 45%',
  onToggle: (self) => fab.classList.toggle('is-visible', self.isActive),
});

/* ── Horario en vivo (hora de Yucatán) ────────────────── */
(function openStatus() {
  const el = $('[data-open-status]');
  if (!el) return;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Merida',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const mins = Number(get('hour')) * 60 + Number(get('minute'));
    const opens = day === 0 ? null : day === 6 ? 12 * 60 : 13 * 60;
    const closes = 17 * 60;
    const isOpen = opens !== null && mins >= opens && mins < closes;
    let text;
    if (isOpen) text = 'Abierto ahora · cierra 5:00 p. m.';
    else if (opens !== null && mins < opens) text = `Cerrado · abre hoy ${day === 6 ? '12:00' : '1:00'} p. m.`;
    else {
      const next = day === 6 ? 'el lunes 1:00' : day === 5 ? 'mañana 12:00' : day === 0 ? 'mañana 1:00' : 'mañana 1:00';
      text = `Cerrado · abre ${next} p. m.`;
    }
    el.classList.toggle('is-open', isOpen);
    $('span', el).textContent = text;
    el.hidden = false;
  } catch {
    /* sin Intl: se muestra solo la tabla */
  }
})();

$('[data-year]').textContent = new Date().getFullYear();

/* ── Visor ampliado ───────────────────────────────────── */
const lightbox = $('[data-lightbox]');
const lbImg = $('[data-lightbox-img]');
const lbCap = $('[data-lightbox-cap]');

function closeLightbox() {
  if (!lightbox.open) return;
  gsap.to(lightbox, {
    autoAlpha: 0,
    duration: reduced ? 0 : 0.35,
    ease: 'power2.out',
    onComplete() {
      lightbox.close();
      lenis?.start();
    },
  });
}

$$('[data-zoom]').forEach((btn) => {
  const thumb = $('img', btn);
  btn.setAttribute('aria-label', `Ampliar fotografía: ${thumb.alt}`);
  btn.addEventListener('click', () => {
    lbImg.src = new URL(btn.dataset.zoom, document.baseURI).href;
    lbImg.width = btn.dataset.w;
    lbImg.height = btn.dataset.h;
    lbImg.alt = thumb.alt;
    lbCap.textContent = btn.dataset.cap || '';
    lenis?.stop();
    lightbox.showModal();
    gsap.fromTo(lightbox, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0 : 0.45, ease: 'power2.out' });
    if (!reduced) gsap.fromTo(lbImg, { scale: 0.94, y: 24 }, { scale: 1, y: 0, duration: 0.9, ease: EASE });
  });
});
lightbox.addEventListener('click', closeLightbox);
lightbox.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeLightbox();
});

/* ── Formulario de reserva → WhatsApp ─────────────────── */
(function booking() {
  const form = $('[data-booking]');
  if (!form) return;
  const error = $('[data-booking-error]');
  const dia = form.elements.dia;
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dia.min = iso(new Date());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    error.hidden = true;
    const [y, m, d] = dia.value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const hora = form.elements.hora.value;
    const fail = (msg) => {
      error.textContent = msg;
      error.hidden = false;
    };
    if (date.getDay() === 0) return fail('Los domingos está cerrado. Elige un día de lunes a sábado.');
    if (hora.startsWith('12') && date.getDay() !== 6) return fail('A las 12:00 solo se atiende los sábados. Elige otra hora.');
    const fecha = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    const text = `Hola Frida, soy ${form.elements.nombre.value.trim()}. Quiero agendar: ${form.elements.paquete.value}, el ${fecha} a la ${hora.replace(' (solo sábado)', '').replace('p. m.', 'p. m')}.`;
    window.open(`https://wa.me/529991022110?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();

/* ── Esfera de fotos ──────────────────────────────────── */
const sphereEl = $('[data-sphere]');
const sphere = sphereEl && createSphere(sphereEl, { reduced });

/* ── Animaciones ──────────────────────────────────────── */
const preloader = $('.preloader');
const desktop = () => window.matchMedia('(min-width: 900px)').matches;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Capítulo 1 — el poste gira, se desenrolla, se aplana y se corta. */
function poleChapter(pole) {
  const P = pole.P;
  const steps = $$('.hero__step');
  const stageEl = $('.hero__stage');
  P.x = desktop() ? 2.1 : 0;

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? pole.start() : pole.stop()),
  });

  const show = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, at);
  const hide = (el, at) => tl.to(el, { autoAlpha: 0, y: -40, duration: 0.6, ease: 'power2.in' }, at);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.8 },
  });
  tl.to(P, { camY: 0, duration: 3, ease: 'power1.inOut' }, 0)
    .to(P, { x: () => (desktop() ? 1.5 : 0), duration: 3, ease: 'power1.inOut' }, 0)
    .to('.hero__meta', { autoAlpha: 0, duration: 0.5 }, 0.1);
  hide(steps[0], 0.2);
  show(steps[1], 1.3);
  hide(steps[1], 2.9);
  tl.to(P, { core: 0.4, duration: 1.6, ease: 'power2.inOut' }, 3);
  show(steps[2], 3.6);
  hide(steps[2], 5.2);
  tl.to(P, { unwind: 1, duration: 2.8, ease: 'power1.inOut' }, 4.7)
    .to(P, { core: 0, duration: 1.2, ease: 'power2.in' }, 4.7)
    .to(P, { lift: 0, duration: 1.6 }, 4.9)
    .to(stageEl, { '--veil': 0, duration: 1.2 }, 5)
    .to(P, { zoom: 1.12, duration: 2.8 }, 4.7)
    .to(P, { wave: 0.1, duration: 1.4, ease: 'power2.out' }, 7.1)
    .to(P, { split: 1, duration: 1.3, ease: 'power3.inOut' }, 8.1);
  show(steps[3], 8.5);
  tl.to({}, { duration: 0.7 });
  return tl;
}

/** Capítulo 3 — la máquina se abre pieza por pieza. */
function clipperChapter(clipper) {
  const P = clipper.P;
  P.x = 1;
  ScrollTrigger.create({
    trigger: '.tools',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? clipper.start() : clipper.stop()),
  });
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.tools', start: 'top top', end: 'bottom bottom', scrub: 0.8 },
    })
    .to(P, { rot: 0.5, duration: 6 }, 0)
    .to('[data-tools-a]', { autoAlpha: 0, y: -30, duration: 0.8, ease: 'power2.in' }, 0.8)
    .to(P, { explode: 1, zoom: 1.5, duration: 3.2, ease: 'power2.inOut' }, 1.2)
    .fromTo('[data-clipper-labels]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 3.6)
    .fromTo('[data-tools-b]', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 3.8)
    .to({}, { duration: 1 });
  // entrada: la máquina sube girando
  gsap.from(P, {
    rot: -2.4,
    ease: 'none',
    scrollTrigger: { trigger: '.tools', start: 'top bottom', end: 'top top', scrub: 0.8 },
    immediateRender: false,
  });
}

function heroIntro(pole) {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  const name = SplitText.create('[data-hero-name]', { type: 'chars', mask: 'chars' });
  const tag = SplitText.create('[data-hero-tag]', { type: 'lines', mask: 'lines' });
  if (pole) tl.to(pole.P, { rise: 0, duration: 2.4, ease: 'expo.out' }, 0);
  tl.from(name.chars, { yPercent: 105, duration: 1.3, stagger: 0.045 }, 0.35)
    .from(tag.lines, { yPercent: 110, duration: 1.1 }, 0.7)
    .from('[data-hero-fade]', { autoAlpha: 0, y: 18, duration: 1, stagger: 0.09 }, 0.85)
    .from('.nav > *', { autoAlpha: 0, y: -14, duration: 0.9, stagger: 0.07, clearProps: 'all' }, 0.8);
  return tl;
}

function scrollAnimations() {
  // Cinta: velocidad ligada al desplazamiento
  const marquee = gsap.to('[data-marquee]', { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate(self) {
      const v = gsap.utils.clamp(-4, 4, self.getVelocity() / 350);
      gsap.to(marquee, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
      gsap.to(marquee, { timeScale: 1, duration: 1.2, delay: 0.3 });
    },
  });

  // Manifiesto: las palabras se revelan con el recorrido
  $$('[data-words]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.14 },
          { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 } },
        ),
    });
  });

  // Titulares: líneas enmascaradas
  $$('[data-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 108, duration: 1.25, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });

  // Aparición progresiva
  gsap.set('[data-reveal]', { autoAlpha: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08, overwrite: true }),
  });

  // Fotografías: cortina + profundidad interna
  $$('[data-clip]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.5,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
      },
    );
    const img = $('[data-parallax]', el);
    if (img) {
      gsap.fromTo(img, { yPercent: -10.5 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  // Paquetes: línea a línea
  $$('[data-service]').forEach((row) => {
    gsap.from(row.children, { autoAlpha: 0, y: 34, duration: 1.1, ease: EASE, stagger: 0.06, scrollTrigger: { trigger: row, start: 'top 90%', once: true } });
  });

  // Tipografía fantasma a la deriva
  $$('[data-drift]').forEach((el) => {
    gsap.fromTo(el, { xPercent: 12 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Esfera: entra creciendo y el scroll le suma giro
  if (sphere) {
    gsap.from('.sphere__rot', { scale: 0.55, ease: 'none', scrollTrigger: { trigger: '.sphere', start: 'top bottom', end: 'top 20%', scrub: 0.6 } });
    gsap.to(sphere, { scroll: 2.2, ease: 'none', scrollTrigger: { trigger: '.sphere', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    gsap.from('.sphere__title', { autoAlpha: 0, scale: 0.9, duration: 1.4, ease: EASE, scrollTrigger: { trigger: '.sphere__stage', start: 'top 60%', once: true } });
  }

  gsap.from('.footer__word', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

async function start() {
  const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).catch(() => {});

  if (reduced || !webglOK()) {
    document.documentElement.classList.add('static');
    await fontsReady;
    preloader?.remove();
    if (!reduced) {
      scrollAnimations();
      heroIntro(null);
    }
    return;
  }

  window.scrollTo(0, 0);
  lenis?.stop();

  // el contador avanza mientras se cargan las escenas 3D
  const counter = { v: 0 };
  const count = $('.preloader__count');
  const paint = () => (count.textContent = String(Math.round(counter.v)).padStart(3, '0'));
  const creep = gsap.to(counter, { v: 85, duration: 2.5, ease: 'power1.out', onUpdate: paint });

  let pole = null;
  let clipper = null;
  try {
    const [{ createPole }, { createClipper }] = await Promise.all([import('./three/pole.js'), import('./three/clipper.js'), fontsReady]);
    pole = createPole($('[data-pole]'));
    clipper = createClipper($('[data-clipper]'), $$('[data-clipper-labels] li'));
  } catch (err) {
    console.warn('3D no disponible:', err);
    document.documentElement.classList.add('static');
  }

  if (pole) {
    poleChapter(pole);
    clipperChapter(clipper);
  }
  scrollAnimations();
  ScrollTrigger.refresh();

  creep.kill();
  gsap
    .timeline({ onComplete: () => preloader.remove() })
    .to(counter, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: paint })
    .to('.preloader > *', { yPercent: -40, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
    .to(preloader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
    .add(() => lenis?.start(), '-=0.5')
    .add(heroIntro(pole), '-=0.75');
}

if (history.scrollRestoration) history.scrollRestoration = 'manual';
start();
window.addEventListener('load', () => ScrollTrigger.refresh());

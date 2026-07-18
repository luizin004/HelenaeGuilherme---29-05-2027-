/* ============================================================
   Helena & Guilherme · 29.05.2027
   Interações: contagem regressiva, menu, reveal e RSVP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCountdown();
  initReveal();
  initRSVP();
});

/* ----- Navegação (scroll + menu mobile) ----- */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ----- Contagem regressiva ----- */
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  const target = new Date(el.dataset.date).getTime();
  const units = {
    days: el.querySelector('[data-unit="days"]'),
    hours: el.querySelector('[data-unit="hours"]'),
    minutes: el.querySelector('[data-unit="minutes"]'),
    seconds: el.querySelector('[data-unit="seconds"]'),
  };

  const pad = (n) => String(n).padStart(2, '0');

  const title = document.querySelector('.countdown__title');

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      Object.values(units).forEach((u) => u && (u.textContent = '00'));
      if (title) title.textContent = 'É hoje! 💚';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (units.days) units.days.textContent = d;
    if (units.hours) units.hours.textContent = pad(h);
    if (units.minutes) units.minutes.textContent = pad(m);
    if (units.seconds) units.seconds.textContent = pad(s);
  };

  tick();
  const timer = setInterval(tick, 1000);
}

/* ----- Reveal ao rolar ----- */
function initReveal() {
  const targets = document.querySelectorAll('.section, .countdown, .detail-card, .gallery__item');
  targets.forEach((t) => t.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}

/* ----- RSVP -----
   Placeholder: valida e mostra confirmação local.
   Quando houver backend (ex.: Supabase), enviar `data` para lá. */
function initRSVP() {
  const form = document.getElementById('rsvpForm');
  const feedback = document.getElementById('rsvpFeedback');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    console.log('RSVP recebido:', data);

    const vai = data.presenca === 'sim';
    feedback.textContent = vai
      ? `Obrigado, ${data.nome.split(' ')[0]}! Sua presença está confirmada. 💚`
      : `Vamos sentir sua falta, ${data.nome.split(' ')[0]}. Obrigado por avisar!`;
    feedback.style.color = vai ? 'var(--sage)' : 'var(--muted)';

    form.reset();
  });
}

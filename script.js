/* ============================================
   Wedding Invitation — Frontend
   ============================================ */

let CONFIG = {};

const DEFAULT_CONFIG = {
  marqueeText: 'приглашение на свадьбу',
  splashTitle: 'Потому что мы женимся!',
  splashSubtitle: 'Ничего не планируйте на',
  splashHint: 'Листайте вниз, чтобы узнать все подробности',
  splashButtonText: 'Открыть приглашение',
  brideName: 'Хатиджа',
  groomName: 'Мухаммадюсуф',
  greetingTitle: 'Дорогие родные и друзья',
  greetingText: '15 августа 2026 состоится наша свадьба. Этот день невозможно представить без самых близких людей, и мы очень хотели бы, чтобы вы провели его вместе с нами!',
  weddingDate: '15.08.2026',
  weddingTime: '18:00',
  dateLabel: 'состоится наша свадьба',
  countdownLabel: 'До свадьбы осталось:',
  venueName: 'Торжественный Дворец',
  venueAddress: 'ул. Ленина 123\nХуджанд, Согдийская область',
  venuePhoto: '',
  coordinates: [40.2833, 69.6333],
  mapLink: 'https://maps.google.com/?q=40.2833,69.6333',
  program: [
    { time: '16:00', title: 'Сбор гостей', description: 'Приветственные напитки' },
    { time: '17:00', title: 'Церемония', description: 'Торжественная часть' },
    { time: '18:00', title: 'Банкет', description: 'Праздничный ужин и танцы' },
    { time: '23:00', title: 'Завершение', description: 'Прощание с гостями' }
  ],
  notesText: 'Самое важное для нас — отпраздновать этот день вместе с вами. Если захотите сделать подарок, мы с радостью примем ваш вклад в наш семейный бюджет.',
  contactsText: 'В день свадьбы по любым вопросам обращайтесь к организатору:',
  contactName: 'Организатор',
  contactPhone: '+992 00 000 00 00',
  inviteText: 'Будем очень рады видеть вас на нашей свадьбе!',
  inviteLink: '#',
  inviteButtonText: 'Написать в Telegram',
  footerSign: 'С любовью, Мухаммадюсуф & Хатиджа',
  gallery: [],
  theme: null
};

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      CONFIG = { ...DEFAULT_CONFIG, ...await res.json() };
      CONFIG.theme = mergeTheme(CONFIG.theme);
      return;
    }
  } catch {
    console.warn('Не удалось загрузить конфиг с сервера');
  }
  CONFIG = { ...DEFAULT_CONFIG };
  CONFIG.theme = mergeTheme(CONFIG.theme);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

function populateContent() {
  applyTheme(CONFIG.theme);

  setText('splash-title', CONFIG.splashTitle);
  setText('splash-subtitle', CONFIG.splashSubtitle);
  setText('splash-date', CONFIG.weddingDate);
  setText('splash-hint', CONFIG.splashHint);

  setText('hero-groom', CONFIG.groomName);
  setText('hero-bride', CONFIG.brideName);

  const heroCouple = document.getElementById('hero-couple');
  if (heroCouple) {
    heroCouple.setAttribute('aria-label', `${CONFIG.groomName} и ${CONFIG.brideName}`);
  }

  setText('greeting-title', CONFIG.greetingTitle);
  setText('greeting-text', CONFIG.greetingText);

  buildGallery();

  buildWeddingCalendar();
  setText('wedding-date', CONFIG.weddingDate);
  setText('date-label', CONFIG.dateLabel);
  setText('countdown-heading', CONFIG.countdownLabel);

  setText('venue-name', CONFIG.venueName);
  setText('venue-address', CONFIG.venueAddress);
  buildVenuePhoto();

  buildProgram();

  setText('notes-text', CONFIG.notesText);
  setText('contacts-text', CONFIG.contactsText);

  const phoneEl = document.getElementById('contacts-phone');
  if (phoneEl) {
    phoneEl.textContent = `${CONFIG.contactName}: ${CONFIG.contactPhone}`;
    phoneEl.href = `tel:${(CONFIG.contactPhone || '').replace(/\s/g, '')}`;
  }

  setText('invite-text', CONFIG.inviteText);
  const cta = document.getElementById('invite-cta');
  if (cta) {
    cta.href = CONFIG.inviteLink || '#';
    cta.textContent = CONFIG.inviteButtonText || 'Открыть';
  }
  setText('footer-sign', CONFIG.footerSign);
}

function buildGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const gallery = CONFIG.gallery || [];
  if (!gallery.length) {
    grid.innerHTML = '<p class="gallery-empty">Фото скоро появятся</p>';
    return;
  }

  gallery.forEach((item) => {
    const rotation = (Math.random() * 6 - 3).toFixed(1);
    const card = document.createElement('div');
    card.className = 'polaroid';
    card.style.transform = `rotate(${rotation}deg)`;

    const photoDiv = document.createElement('div');
    photoDiv.className = 'polaroid__photo';

    if (item.src) {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption || 'Фото';
      img.loading = 'lazy';
      photoDiv.appendChild(img);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'polaroid__placeholder';
      placeholder.textContent = 'фото';
      photoDiv.appendChild(placeholder);
    }

    const caption = document.createElement('p');
    caption.className = 'polaroid__caption';
    caption.textContent = item.caption || '';

    card.appendChild(photoDiv);
    card.appendChild(caption);
    grid.appendChild(card);
  });
}

function buildWeddingCalendar() {
  const container = document.getElementById('wedding-calendar');
  if (!container) return;

  const wedding = parseWeddingDateTime();
  if (!wedding) return;

  const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const weddingDay = wedding.getDate();
  const weddingMonth = wedding.getMonth();
  const weddingYear = wedding.getFullYear();

  const dayOfWeek = wedding.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(wedding);
  monday.setDate(weddingDay + mondayOffset);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      label: date.getDate(),
      isWedding: date.getDate() === weddingDay && date.getMonth() === weddingMonth
    });
  }

  container.removeAttribute('aria-hidden');
  container.innerHTML = `
    <p class="wedding-calendar__month">${MONTHS[weddingMonth]}, ${weddingYear}</p>
    <div class="wedding-calendar__weekdays">
      ${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}
    </div>
    <div class="wedding-calendar__days">
      ${days.map((day) => `
        <span class="wedding-calendar__day${day.isWedding ? ' is-wedding' : ''}">${day.label}</span>
      `).join('')}
    </div>
  `;
}

function buildVenuePhoto() {
  const figure = document.getElementById('venue-photo');
  const img = document.getElementById('venue-photo-img');
  if (!figure || !img) return;

  const src = (CONFIG.venuePhoto || '').trim();
  if (!src) {
    figure.hidden = true;
    img.removeAttribute('src');
    return;
  }

  img.src = src;
  img.alt = CONFIG.venueName || 'Банкетный зал';
  figure.hidden = false;
}

function buildProgram() {
  const list = document.getElementById('program-list');
  if (!list) return;

  const program = CONFIG.program || [];
  list.innerHTML = program.map((item) => `
    <article class="program__item">
      <div class="program__time">${item.time}</div>
      <div>
        <h3 class="program__event-title">${item.title}</h3>
        <p class="program__event-desc">${item.description || ''}</p>
      </div>
    </article>
  `).join('');
}

function initPreloader(onDone) {
  const preloader = document.getElementById('preloader');
  if (!preloader) {
    onDone();
    return;
  }

  window.setTimeout(() => {
    preloader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    onDone();
  }, 2400);
}

function initCover() {
  const cover = document.getElementById('siteCover');
  const main = document.getElementById('mainContent');
  const btn = document.getElementById('openCoverBtn');

  if (!cover || !main || !btn) {
    openSite();
    return;
  }

  if (sessionStorage.getItem('invitationOpened')) {
    cover.remove();
    openSite();
    return;
  }

  document.body.classList.add('cover-active');
  initStarfields();
  initRevealAnimations(cover);

  btn.addEventListener('click', () => {
    if (cover.classList.contains('is-opening')) return;
    cover.classList.add('is-opening');

    window.setTimeout(() => {
      cover.classList.add('is-done');
      openSite();
      sessionStorage.setItem('invitationOpened', '1');
      window.setTimeout(() => cover.remove(), 900);
    }, 900);
  });
}

function openSite() {
  document.body.classList.remove('cover-active');
  document.body.classList.add('site-open');

  const main = document.getElementById('mainContent');
  if (main) main.removeAttribute('inert');

  initCountdown();
  initRevealAnimations(main);
  initStarfields();
}

function parseWeddingDateTime() {
  const parts = (CONFIG.weddingDate || '15.08.2026').split('.');
  const timeParts = (CONFIG.weddingTime || '18:00').split(':');
  if (parts.length !== 3) return null;

  return new Date(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[0], 10),
    parseInt(timeParts[0], 10) || 0,
    parseInt(timeParts[1], 10) || 0
  );
}

function initCountdown() {
  const weddingDate = parseWeddingDateTime();
  if (!weddingDate) return;

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');
  const countdownValues = document.getElementById('countdown-values');

  function update() {
    const distance = weddingDate.getTime() - Date.now();

    if (distance <= 0) {
      if (countdownValues) {
        countdownValues.innerHTML = '<p class="countdown__done">Свадьба уже началась!</p>';
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;
  }

  update();
  window.setInterval(update, 1000);
}

function initRevealAnimations(root = document) {
  root.querySelectorAll('.reveal-group').forEach((group) => {
    const items = group.querySelectorAll('.reveal-item');
    let revealed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !revealed) {
            revealed = true;
            items.forEach((item, i) => {
              item.style.transitionDelay = `${i * 0.12}s`;
              item.classList.add('is-visible');
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(group);
  });
}

function initStarfields() {
  document.querySelectorAll('[data-starfield]').forEach((container) => {
    if (container.dataset.ready) return;
    container.dataset.ready = '1';

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const stars = [];
    const layers = [
      { count: 80, speed: 0.05, size: 0.8, alpha: 0.35 },
      { count: 50, speed: 0.12, size: 1.2, alpha: 0.55 },
      { count: 25, speed: 0.22, size: 1.8, alpha: 0.8 },
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({ x: Math.random(), y: Math.random(), layer });
      }
    });

    let width = 0;
    let height = 0;
    let animId = null;

    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        star.y += star.layer.speed / height;
        if (star.y > 1) {
          star.y = 0;
          star.x = Math.random();
        }
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.layer.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 92, ${star.layer.alpha * 0.55})`;
        ctx.fill();
      });
    }

    function loop() {
      draw();
      animId = requestAnimationFrame(loop);
    }

    resize();
    loop();
    window.addEventListener('resize', resize);

    const section = container.closest('.section');
    if (section) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!animId) loop();
          } else if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        });
      });
      observer.observe(section);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  populateContent();
  initPreloader(() => initCover());
});

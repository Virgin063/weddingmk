const loginScreen = document.getElementById('login-screen');
const statsApp = document.getElementById('stats-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const statsContent = document.getElementById('stats-content');
const fetchedAtEl = document.getElementById('fetched-at');

async function apiFetch(url, options = {}) {
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

function escapeHtml(text) {
  if (text == null || text === '') return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function formatRuDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return escapeHtml(String(iso));
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

function sideRu(side) {
  if (side === 'groom') return 'Жених';
  if (side === 'bride') return 'Невеста';
  return escapeHtml(side || '—');
}

function attendingRu(v) {
  if (v === 'yes') return 'Да';
  if (v === 'no') return 'Нет';
  return escapeHtml(v || '—');
}

function peerErrorText(code, message) {
  if (code === 'no_data') {
    return message || 'Данные сайта Хатиджи ещё не получены. Запустите локальный сайт — он отправит их на сервер автоматически.';
  }
  return escapeHtml(message || 'Данные временно недоступны');
}

function renderTable(headers, rows, emptyText) {
  if (!rows.length) {
    return `<div class="empty-hint">${escapeHtml(emptyText)}</div>`;
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`;
}

function renderInvitationSection(site) {
  if (!site.available) {
    return `
      <section class="site-block">
        <div class="site-block__head">
          <div>
            <h2 class="site-block__title">Сайт приглашения</h2>
            <p class="site-block__desc">193.233.91.241 · приглашение и открытка /hatidja</p>
          </div>
        </div>
        <div class="unavailable">${peerErrorText(site.error, site.message)}</div>
      </section>`;
  }

  const card = site.hatidjaCard || {};
  const ipRows = (card.byIp || []).map((row) => `
    <tr>
      <td>${escapeHtml(row.ip)}</td>
      <td>${row.count}</td>
      <td class="muted">${formatRuDate(row.firstSeen)}</td>
      <td class="muted">${formatRuDate(row.lastSeen)}</td>
    </tr>`);

  const recentRows = (card.recent || []).map((row) => `
    <tr>
      <td class="muted">${formatRuDate(row.at)}</td>
      <td>${escapeHtml(row.ip)}</td>
      <td title="${escapeHtml(row.userAgent)}">${escapeHtml(row.userAgent) || '—'}</td>
    </tr>`);

  return `
    <section class="site-block">
      <div class="site-block__head">
        <div>
          <h2 class="site-block__title">Сайт приглашения</h2>
          <p class="site-block__desc">Приглашение и открытка <a href="/" target="_blank" rel="noopener">/</a> · <a href="/hatidja/" target="_blank" rel="noopener">/hatidja</a></p>
        </div>
        <button type="button" class="btn btn-danger" id="clear-hatidja-views">Очистить просмотры открытки</button>
      </div>

      <div class="card">
        <h3 class="card-title">Открытка /hatidja</h3>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">${card.totalViews ?? 0}</div><div class="stat-label">Просмотров</div></div>
          <div class="stat-card"><div class="stat-value">${card.uniqueIps ?? 0}</div><div class="stat-label">Уникальных IP</div></div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">По IP (${(card.byIp || []).length})</h3>
        ${renderTable(['IP', 'Просмотров', 'Первый визит', 'Последний'], ipRows, 'Пока нет просмотров')}
      </div>

      <div class="card">
        <h3 class="card-title">Последние визиты</h3>
        ${renderTable(['Дата', 'IP', 'Устройство'], recentRows, 'Пока нет просмотров')}
      </div>
    </section>`;
}

function renderHatidjaSiteSection(site) {
  if (!site.available) {
    return `
      <section class="site-block">
        <div class="site-block__head">
          <div>
            <h2 class="site-block__title">Сайт Хатиджи</h2>
            <p class="site-block__desc">RSVP, квест, пожелания, музыка, галерея, бинго · данные с локального сайта</p>
          </div>
        </div>
        <div class="unavailable">${peerErrorText(site.error, site.message)}</div>
      </section>`;
  }

  const headcount = site.attendingHeadcount ?? 0;
  const bestQuiz = site.quizBest
    ? `${escapeHtml(site.quizBest.guestName)} — ${site.quizBest.percentage}%`
    : '—';

  const overviewCards = [
    ['Вошли на сайт', site.totalGuests],
    ['Уникальных имён', site.uniqueGuestNames ?? site.totalGuests],
    ['Ответов RSVP', site.totalRSVPs ?? 0],
    ['Придут', site.attendingYes],
    ['Человек (сумма)', headcount],
    ['Не придут', site.attendingNo ?? 0],
    ['Прошли квест', site.quizCompleted],
    ['Пожеланий', site.wishesCount],
    ['Музыка', site.musicRequestsCount],
    ['Фото/видео', site.galleryItemsCount],
    ['Играют в бинго', site.bingoPlayers ?? 0],
  ];

  const guestRows = (site.guestsList || []).map((g) => `
    <tr><td>${escapeHtml(g.name)}</td><td>${sideRu(g.side)}</td><td class="muted">${formatRuDate(g.loginTime)}</td></tr>`);

  const rsvpRows = (site.rsvpsList || []).map((r) => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${attendingRu(r.attending)}</td>
      <td>${escapeHtml(String(r.guests ?? '1'))}</td>
      <td>${r.dietary && String(r.dietary).trim() ? escapeHtml(r.dietary) : '<span class="muted">—</span>'}</td>
      <td class="muted">${formatRuDate(r.timestamp)}</td>
    </tr>`);

  const quizRows = (site.quizResultsList || []).map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(r.guestName)}</td>
      <td>${sideRu(r.side)}</td>
      <td><strong>${r.percentage ?? 0}%</strong> (${r.score ?? 0}/${r.totalQuestions ?? 0})</td>
      <td class="muted">${formatRuDate(r.timestamp)}</td>
    </tr>`);

  const wishRows = (site.wishesList || []).map((w) => `
    <tr>
      <td>${escapeHtml(w.author)}</td>
      <td>${sideRu(w.side)}</td>
      <td>${escapeHtml(w.message)}</td>
      <td class="muted">${formatRuDate(w.timestamp)}</td>
    </tr>`);

  const musicRows = (site.musicRequestsList || []).map((m) => `
    <tr>
      <td>${escapeHtml(m.song)}</td>
      <td>${escapeHtml(m.artist)}</td>
      <td><strong>${m.votes ?? 0}</strong></td>
      <td>${escapeHtml(m.requestedBy || '—')}</td>
      <td class="muted">${formatRuDate(m.timestamp)}</td>
    </tr>`);

  const galleryRows = (site.galleryList || []).map((g) => `
    <tr>
      <td>${g.type === 'video' ? 'Видео' : 'Фото'}</td>
      <td>${escapeHtml(g.originalName || g.filename || '—')}</td>
      <td>${escapeHtml(g.uploadedBy || '—')}</td>
      <td>${sideRu(g.side)}</td>
      <td><a href="${escapeHtml(g.url)}" target="_blank" rel="noopener">Открыть</a></td>
      <td class="muted">${formatRuDate(g.timestamp)}</td>
    </tr>`);

  const bingoRows = (site.bingoCardsList || []).map((b) => `
    <tr>
      <td>${escapeHtml(b.guestName)}</td>
      <td>${b.markedEvents?.length ?? 0}</td>
      <td>${b.completedAt ? formatRuDate(b.completedAt) : '<span class="muted">Не завершено</span>'}</td>
    </tr>`);

  return `
    <section class="site-block">
      <div class="site-block__head">
        <div>
          <h2 class="site-block__title">Сайт Хатиджи</h2>
          <p class="site-block__desc">RSVP, квест, пожелания, музыка, галерея, бинго</p>
        </div>
      </div>

      <div class="card">
        <p class="stat-meta">
          Последнее сохранение: <strong>${site.lastUpdated ? formatRuDate(site.lastUpdated) : '—'}</strong>.
          Конверсия RSVP: <strong>${site.rsvpRate ?? 0}%</strong>.
          Средний результат квеста: <strong>${site.quizAvgPercentage ?? 0}%</strong>.
          Лучший результат: <strong>${bestQuiz}</strong>.
        </p>
        <div class="stats-grid">${overviewCards.map(([label, value]) => `
          <div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`).join('')}
        </div>
        <div class="stat-subgrid">
          <div class="stat-mini"><div class="stat-mini-value">${site.guestsGroom ?? 0}</div><div class="stat-mini-label">Со стороны жениха</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${site.guestsBride ?? 0}</div><div class="stat-mini-label">Со стороны невесты</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${site.rsvpWithDietary ?? 0}</div><div class="stat-mini-label">RSVP с меню</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${site.musicTotalVotes ?? 0}</div><div class="stat-mini-label">Голосов за музыку</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${site.galleryImages ?? 0} / ${site.galleryVideos ?? 0}</div><div class="stat-mini-label">Фото / видео</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${site.bingoCompleted ?? 0}</div><div class="stat-mini-label">Завершили бинго</div></div>
        </div>
      </div>

      <div class="card"><h3 class="card-title">Входы (${(site.guestsList || []).length})</h3>${renderTable(['Имя', 'Сторона', 'Дата'], guestRows, 'Пока никто не входил')}</div>
      <div class="card"><h3 class="card-title">RSVP (${(site.rsvpsList || []).length})</h3>${renderTable(['Имя', 'Придёт', 'Человек', 'Меню', 'Дата'], rsvpRows, 'Нет ответов')}</div>
      <div class="card"><h3 class="card-title">Квест (${(site.quizResultsList || []).length})</h3>${renderTable(['#', 'Гость', 'Сторона', 'Результат', 'Дата'], quizRows, 'Квест ещё не проходили')}</div>
      <div class="card"><h3 class="card-title">Пожелания (${(site.wishesList || []).length})</h3>${renderTable(['Автор', 'Сторона', 'Текст', 'Дата'], wishRows, 'Пожеланий нет')}</div>
      <div class="card"><h3 class="card-title">Музыка (${(site.musicRequestsList || []).length})</h3>${renderTable(['Песня', 'Исполнитель', 'Голоса', 'Кто добавил', 'Дата'], musicRows, 'Запросов нет')}</div>
      <div class="card"><h3 class="card-title">Галерея (${(site.galleryList || []).length})</h3>${renderTable(['Тип', 'Файл', 'Кто', 'Сторона', 'Ссылка', 'Дата'], galleryRows, 'Загрузок нет')}</div>
      <div class="card"><h3 class="card-title">Бинго (${(site.bingoCardsList || []).length})</h3>${renderTable(['Гость', 'Отметок', 'Завершение'], bingoRows, 'Никто не играл')}</div>
    </section>`;
}

function renderAll(data) {
  const sites = data?.sites || {};
  statsContent.innerHTML =
    renderInvitationSection(sites.invitation || { available: false }) +
    renderHatidjaSiteSection(sites.hatidjaSite || { available: false });

  fetchedAtEl.textContent = data.fetchedAt
    ? `Обновлено: ${formatRuDate(data.fetchedAt)}`
    : '';

  document.getElementById('clear-hatidja-views')?.addEventListener('click', async () => {
    if (!confirm('Удалить всю статистику просмотров открытки?')) return;
    const res = await apiFetch('/api/stats/hatidja-views', { method: 'DELETE' });
    if (res.ok) await loadAll();
  });
}

function showLogin() {
  loginScreen.style.display = 'flex';
  statsApp.style.display = 'none';
}

function showStats() {
  loginScreen.style.display = 'none';
  statsApp.style.display = 'block';
}

async function loadAll() {
  statsContent.innerHTML = '<p class="loading-msg">Загрузка…</p>';
  try {
    const res = await apiFetch('/api/stats/all');
    if (res.status === 403) {
      showLogin();
      loginError.textContent = 'Нужно войти. Пароль: 260626MK';
      loginError.hidden = false;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAll(data);
  } catch (error) {
    showLogin();
    loginError.textContent = 'Ошибка загрузки: ' + (error.message || 'проверьте соединение');
    loginError.hidden = false;
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const code = document.getElementById('stats-code').value.trim();
  if (!code) {
    loginError.textContent = 'Введите код доступа';
    loginError.hidden = false;
    return;
  }

  try {
    const res = await apiFetch('/api/stats/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showStats();
      await loadAll();
      return;
    }

    loginError.textContent = data.message || 'Неверный код (пароль: 260626MK)';
    loginError.hidden = false;
  } catch {
    loginError.textContent = 'Нет связи с сервером';
    loginError.hidden = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await apiFetch('/api/stats/logout', { method: 'POST' });
  showLogin();
  document.getElementById('stats-code').value = '';
});

document.getElementById('refresh-btn').addEventListener('click', loadAll);

(async () => {
  try {
    const res = await apiFetch('/api/stats/session');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        showStats();
        await loadAll();
        return;
      }
    }
  } catch {
    // offline
  }
  showLogin();
})();

const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const saveStatus = document.getElementById('save-status');
const galleryEditor = document.getElementById('gallery-editor');
const programEditor = document.getElementById('program-editor');

const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');

async function serverAvailable() {
  try {
    const res = await fetch('/api/admin/session', { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

function showStaticHostWarning() {
  loginError.innerHTML = [
    '<strong>На GitHub Pages админка не работает</strong> — здесь нет сервера.',
    'Чтобы редактировать сайт онлайн:',
    '1) Задеплойте на <a href="https://render.com" target="_blank" rel="noopener">Render.com</a> (бесплатно)',
    '2) Откройте <code>/admin</code> на ссылке Render',
    'Пароль: <strong>260626MK</strong>',
    '<br>Или редактируйте <code>data/config.json</code> локально и делайте git push.',
  ].join('<br>');
  loginError.hidden = false;
  loginForm.querySelector('button[type="submit"]').disabled = true;
  document.getElementById('admin-code').disabled = true;
}

const FIELD_IDS = [
  'marqueeText', 'splashTitle', 'splashSubtitle', 'splashHint', 'splashButtonText',
  'brideName', 'groomName',
  'greetingTitle', 'greetingText',
  'weddingDate', 'weddingTime', 'dateLabel', 'countdownLabel',
  'venueName', 'venueAddress', 'venuePhoto', 'mapLink',
  'notesText',
  'contactsText', 'contactName', 'contactPhone',
  'inviteText', 'inviteLink', 'inviteButtonText', 'footerSign'
];

function showLogin() {
  loginScreen.style.display = 'flex';
  adminApp.style.display = 'none';
}

function showAdmin() {
  loginScreen.style.display = 'none';
  adminApp.style.display = 'block';
}

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

async function checkSession() {
  try {
    const res = await apiFetch('/api/admin/session');
    if (!res.ok) return false;
    const data = await res.json();
    return data.authenticated;
  } catch {
    return false;
  }
}

async function loadConfig() {
  const res = await apiFetch('/api/admin/config');
  if (!res.ok) throw new Error('Не авторизован');
  config = await res.json();
  populateForm();
}

const THEME_PRESET_LABELS = {
  gold: 'Золото + айвори',
  blush: 'Пыльная роза',
  bordo: 'Бордо',
  sage: 'Шалфей',
};

function renderThemeEditor() {
  const presetsEl = document.getElementById('theme-presets');
  const fieldsEl = document.getElementById('theme-fields');
  if (!presetsEl || !fieldsEl) return;

  presetsEl.innerHTML = Object.entries(THEME_PRESET_LABELS).map(([key, label]) => (
    `<button type="button" class="btn btn-outline btn-sm theme-preset-btn" data-preset="${key}">${label}</button>`
  )).join('');

  fieldsEl.innerHTML = THEME_ADMIN_FIELDS.map(({ key, label }) => `
    <div class="field theme-field">
      <label for="theme-${key}">${label}</label>
      <div class="theme-color-input">
        <input type="color" id="theme-${key}" data-theme-key="${key}">
        <input type="text" class="theme-hex" data-theme-hex="${key}" placeholder="#ffffff" maxlength="7">
      </div>
    </div>
  `).join('');

  presetsEl.querySelectorAll('.theme-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      config.theme = { ...THEME_PRESETS[btn.dataset.preset] };
      fillThemeFields(config.theme);
      updateThemePreview(config.theme);
    });
  });

  fieldsEl.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener('input', () => {
      syncThemeHex(input.dataset.themeKey, input.value);
      readThemeFromFields();
      updateThemePreview(config.theme);
    });
  });

  fieldsEl.querySelectorAll('.theme-hex').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.themeHex;
      const value = normalizeHex(input.value);
      if (!value) return;
      const colorInput = document.getElementById(`theme-${key}`);
      if (colorInput) colorInput.value = value;
      readThemeFromFields();
      updateThemePreview(config.theme);
    });
  });
}

function normalizeHex(value) {
  const trimmed = value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function syncThemeHex(key, value) {
  const hexInput = document.querySelector(`[data-theme-hex="${key}"]`);
  if (hexInput) hexInput.value = value;
}

function fillThemeFields(theme) {
  const merged = mergeTheme(theme);
  THEME_ADMIN_FIELDS.forEach(({ key }) => {
    const colorInput = document.getElementById(`theme-${key}`);
    const hexInput = document.querySelector(`[data-theme-hex="${key}"]`);
    if (colorInput) colorInput.value = merged[key];
    if (hexInput) hexInput.value = merged[key];
  });
  config.theme = merged;
}

function readThemeFromFields() {
  const theme = { ...mergeTheme(config.theme) };
  THEME_ADMIN_FIELDS.forEach(({ key }) => {
    const colorInput = document.getElementById(`theme-${key}`);
    if (colorInput?.value) theme[key] = colorInput.value;
  });
  theme.text = theme.textStrong;
  theme.textOnAccent = autoTextOnAccent(theme.accentSection, theme.textStrong);
  config.theme = theme;
}

function updateThemePreview(theme) {
  const preview = document.getElementById('theme-preview');
  if (!preview) return;
  const t = mergeTheme(theme);
  preview.style.setProperty('--preview-bg', t.background);
  preview.style.setProperty('--preview-accent', t.accentSection);
  preview.style.setProperty('--preview-primary', t.primary);
}

function populateForm() {
  FIELD_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = config[id] || '';
  });

  const coords = config.coordinates || [];
  document.getElementById('coordinates').value = coords.length === 2 ? `${coords[0]}, ${coords[1]}` : '';

  renderProgramEditor();
  renderGalleryEditor();
  if (!config.theme) config.theme = mergeTheme();
  renderThemeEditor();
  fillThemeFields(config.theme);
  updateThemePreview(config.theme);
}

function renderProgramEditor() {
  programEditor.innerHTML = '';
  const program = config.program || [];

  program.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'program-item';
    row.innerHTML = `
      <div class="field-row">
        <div class="field"><label>Время</label><input type="text" class="program-time" value="${escapeHtml(item.time || '')}"></div>
        <div class="field"><label>Название</label><input type="text" class="program-title" value="${escapeHtml(item.title || '')}"></div>
      </div>
      <div class="field"><label>Описание</label><input type="text" class="program-desc" value="${escapeHtml(item.description || '')}"></div>
      <button type="button" class="btn btn-danger program-remove" data-index="${index}">Удалить</button>
    `;
    programEditor.appendChild(row);
  });

  programEditor.querySelectorAll('.program-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      config.program.splice(Number(btn.dataset.index), 1);
      renderProgramEditor();
    });
  });
}

function renderGalleryEditor() {
  galleryEditor.innerHTML = '';
  const gallery = config.gallery || [];

  gallery.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'gallery-item';
    row.innerHTML = `
      <div class="field">
        <label>URL фото</label>
        <input type="text" class="gallery-src" value="${escapeHtml(item.src || '')}" placeholder="https://...">
      </div>
      <div class="field">
        <label>Подпись</label>
        <input type="text" class="gallery-caption" value="${escapeHtml(item.caption || '')}">
      </div>
      <button type="button" class="btn btn-danger gallery-remove" data-index="${index}">Удалить</button>
    `;
    galleryEditor.appendChild(row);
  });

  galleryEditor.querySelectorAll('.gallery-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      config.gallery.splice(Number(btn.dataset.index), 1);
      renderGalleryEditor();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectFormData() {
  const data = {};
  FIELD_IDS.forEach((id) => {
    const el = document.getElementById(id);
    data[id] = el ? el.value.trim() : '';
  });

  const coordsRaw = document.getElementById('coordinates').value.trim();
  const parts = coordsRaw.split(',').map((v) => parseFloat(v.trim()));
  data.coordinates = parts.length === 2 && parts.every((n) => !Number.isNaN(n)) ? parts : [40.2833, 69.6333];

  data.program = [];
  programEditor.querySelectorAll('.program-item').forEach((row) => {
    data.program.push({
      time: row.querySelector('.program-time')?.value.trim() || '',
      title: row.querySelector('.program-title')?.value.trim() || '',
      description: row.querySelector('.program-desc')?.value.trim() || '',
    });
  });

  data.gallery = [];
  galleryEditor.querySelectorAll('.gallery-item').forEach((row) => {
    data.gallery.push({
      src: row.querySelector('.gallery-src')?.value.trim() || '',
      caption: row.querySelector('.gallery-caption')?.value.trim() || '',
    });
  });

  readThemeFromFields();
  data.theme = mergeTheme(config.theme);

  return data;
}

function showStatus(message, type) {
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;
  saveStatus.hidden = false;
  setTimeout(() => { saveStatus.hidden = true; }, 3000);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('admin-code').value.trim();
  loginError.hidden = true;

  try {
    const res = await apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      let message = 'Неверный код. Проверьте пароль и попробуйте снова';
      try {
        const data = await res.json();
        if (data.message) message = data.message;
      } catch {
        if (res.status === 404) {
          message = 'Админка не работает без Node.js-сервера. Подключите Render или запустите npm start';
        }
      }
      loginError.textContent = message;
      loginError.hidden = false;
      return;
    }

    await loadConfig();
    showAdmin();
  } catch {
    loginError.textContent = 'Ошибка подключения к серверу';
    loginError.hidden = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await apiFetch('/api/admin/logout', { method: 'POST' });
  showLogin();
  document.getElementById('admin-code').value = '';
});

document.getElementById('add-gallery-item').addEventListener('click', () => {
  if (!config.gallery) config.gallery = [];
  config.gallery.push({ src: '', caption: '' });
  renderGalleryEditor();
});

document.getElementById('add-program-item').addEventListener('click', () => {
  if (!config.program) config.program = [];
  config.program.push({ time: '', title: '', description: '' });
  renderProgramEditor();
});

document.getElementById('save-btn').addEventListener('click', async () => {
  const data = collectFormData();

  try {
    const res = await apiFetch('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Ошибка сохранения');

    config = data;
    showStatus('Сохранено успешно', 'success');
  } catch {
    showStatus('Не удалось сохранить', 'error');
  }
});

(async () => {
  showLogin();

  if (IS_GITHUB_PAGES) {
    showStaticHostWarning();
    return;
  }

  const hasServer = await serverAvailable();
  if (!hasServer) {
    showStaticHostWarning();
    return;
  }

  const authed = await checkSession();
  if (authed) {
    try {
      await loadConfig();
      showAdmin();
    } catch {
      showLogin();
    }
  }
})();

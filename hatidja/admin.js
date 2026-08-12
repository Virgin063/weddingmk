/* Админ-панель статистики открытки /hatidja */

const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');
const clearBtn = document.getElementById('clear-btn');

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showLogin() {
  loginScreen.style.display = 'flex';
  adminApp.style.display = 'none';
}

function showAdmin() {
  loginScreen.style.display = 'none';
  adminApp.style.display = 'block';
}

async function checkSession() {
  const res = await fetch('/api/admin/session');
  const data = await res.json();
  if (data.authenticated) {
    showAdmin();
    await loadStats();
  } else {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const code = document.getElementById('admin-code').value;
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (res.ok) {
    showAdmin();
    await loadStats();
    return;
  }

  loginError.textContent = 'Неверный код';
  loginError.hidden = false;
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
  document.getElementById('admin-code').value = '';
});

refreshBtn.addEventListener('click', loadStats);

clearBtn.addEventListener('click', async () => {
  if (!confirm('Удалить всю статистику просмотров?')) return;

  const res = await fetch('/api/admin/hatidja/stats', { method: 'DELETE' });
  if (res.ok) {
    await loadStats();
  }
});

async function loadStats() {
  const res = await fetch('/api/admin/hatidja/stats');
  if (!res.ok) {
    showLogin();
    return;
  }

  const data = await res.json();

  document.getElementById('stat-total').textContent = data.totalViews;
  document.getElementById('stat-unique').textContent = data.uniqueIps;
  document.getElementById('last-updated').textContent =
    'Обновлено: ' + formatDate(new Date().toISOString());

  const ipBody = document.getElementById('ip-table-body');
  if (!data.byIp.length) {
    ipBody.innerHTML = '<tr><td colspan="4" class="empty-msg">Пока нет просмотров</td></tr>';
  } else {
    ipBody.innerHTML = data.byIp.map((row) => `
      <tr>
        <td class="ip-cell">${escapeHtml(row.ip)}</td>
        <td>${row.count}</td>
        <td>${formatDate(row.firstSeen)}</td>
        <td>${formatDate(row.lastSeen)}</td>
      </tr>
    `).join('');
  }

  const recentBody = document.getElementById('recent-table-body');
  if (!data.recent.length) {
    recentBody.innerHTML = '<tr><td colspan="3" class="empty-msg">Пока нет просмотров</td></tr>';
  } else {
    recentBody.innerHTML = data.recent.map((row) => `
      <tr>
        <td>${formatDate(row.at)}</td>
        <td class="ip-cell">${escapeHtml(row.ip)}</td>
        <td class="ua-cell" title="${escapeHtml(row.userAgent)}">${escapeHtml(row.userAgent) || '—'}</td>
      </tr>
    `).join('');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

checkSession();

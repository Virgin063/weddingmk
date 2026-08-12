const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true') {
  app.set('trust proxy', 1);
}
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const ADMIN_CODES = new Set([
  (process.env.ADMIN_CODE || '260626MK').toLowerCase(),
  'admin2026', // старый пароль, на случай если сервер ещё не обновился
]);

const useSecureCookies =
  process.env.COOKIE_SECURE === 'true' || process.env.RENDER === 'true';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'invitation-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: useSecureCookies,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

function loadConfig() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (Object.keys(data).length) return data;
  } catch {
    // use bundled default
  }
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'config.json'), 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function isAdmin(req, res, next) {
  if (req.session.isInvitationAdmin) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Доступ запрещен' });
}

/* ============================================
   Статистика просмотров открытки /hatidja
   ============================================ */
const HATIDJA_VIEWS_FILE = path.join(DATA_DIR, 'hatidja-views.json');

function loadHatidjaViews() {
  try {
    const data = JSON.parse(fs.readFileSync(HATIDJA_VIEWS_FILE, 'utf8'));
    return Array.isArray(data.views) ? data : { views: [] };
  } catch {
    return { views: [] };
  }
}

function saveHatidjaViews(data) {
  fs.writeFileSync(HATIDJA_VIEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
}

function normalizeIp(ip) {
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  return ip;
}

function buildHatidjaCardStats() {
  const data = loadHatidjaViews();
  const byIpMap = {};

  for (const view of data.views) {
    if (!byIpMap[view.ip]) {
      byIpMap[view.ip] = {
        ip: view.ip,
        count: 0,
        firstSeen: view.at,
        lastSeen: view.at,
      };
    }
    const entry = byIpMap[view.ip];
    entry.count += 1;
    if (view.at < entry.firstSeen) entry.firstSeen = view.at;
    if (view.at > entry.lastSeen) entry.lastSeen = view.at;
  }

  const byIp = Object.values(byIpMap).sort(
    (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
  );

  return {
    hatidjaCard: {
      totalViews: data.views.length,
      uniqueIps: byIp.length,
      byIp,
      recent: [...data.views].reverse().slice(0, 100),
    },
  };
}

app.post('/api/hatidja/view', (req, res) => {
  const data = loadHatidjaViews();
  const ip = normalizeIp(getClientIp(req));

  data.views.push({
    ip,
    userAgent: req.headers['user-agent'] || '',
    at: new Date().toISOString(),
  });

  saveHatidjaViews(data);
  res.json({ success: true });
});

const { createStatsRoutes } = require('./stats/statsRoutes');
createStatsRoutes(app, {
  siteId: 'invitation',
  adminCodes: ADMIN_CODES,
  statsDir: path.join(__dirname, 'stats'),
  getLocalPayload: () => buildHatidjaCardStats(),
  onClearHatidjaViews: () => saveHatidjaViews({ views: [] }),
});

app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/admin/login', (req, res) => {
  const code = (req.body.code || '').trim();
  if (ADMIN_CODES.has(code.toLowerCase())) {
    req.session.isInvitationAdmin = true;
    return res.json({ success: true });
  }
  res.status(403).json({ success: false, message: 'Неверный код' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.isInvitationAdmin) });
});

app.get('/api/admin/config', isAdmin, (req, res) => {
  res.json(loadConfig());
});

app.put('/api/admin/config', isAdmin, (req, res) => {
  saveConfig(req.body);
  res.json({ success: true, config: req.body });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Invitation site: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Stats panel: http://localhost:${PORT}/stats`);
  console.log(`Hatidja card: http://localhost:${PORT}/hatidja`);
});

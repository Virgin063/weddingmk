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
  process.env.COOKIE_SECURE === 'true' ? 'auto' : false;

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
   Статистика просмотров: / и /hatidja
   ============================================ */
const INVITATION_VIEWS_FILE = path.join(DATA_DIR, 'invitation-views.json');
const HATIDJA_VIEWS_FILE = path.join(DATA_DIR, 'hatidja-views.json');

function loadViews(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(data.views) ? data : { views: [] };
  } catch {
    return { views: [] };
  }
}

function saveViews(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
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

function recordView(req, filePath) {
  const data = loadViews(filePath);
  data.views.push({
    ip: normalizeIp(getClientIp(req)),
    userAgent: req.headers['user-agent'] || '',
    at: new Date().toISOString(),
  });
  saveViews(filePath, data);
}

function buildViewStats(filePath) {
  const data = loadViews(filePath);
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
    totalViews: data.views.length,
    uniqueIps: byIp.length,
    byIp,
    recent: [...data.views].reverse().slice(0, 100),
  };
}

function buildInvitationSiteStats() {
  return {
    main: buildViewStats(INVITATION_VIEWS_FILE),
    hatidjaCard: buildViewStats(HATIDJA_VIEWS_FILE),
  };
}

app.post('/api/invitation/view', (req, res) => {
  recordView(req, INVITATION_VIEWS_FILE);
  res.json({ success: true });
});

app.post('/api/hatidja/view', (req, res) => {
  recordView(req, HATIDJA_VIEWS_FILE);
  res.json({ success: true });
});

const { createStatsRoutes } = require('./stats/statsRoutes');
const {
  loadWeddingDataFile,
  saveWeddingDataFile,
  buildWeddingSiteStats,
} = require('./stats/weddingStats');

let weddingDataCache = loadWeddingDataFile(DATA_DIR);

function syncWeddingData(payload) {
  weddingDataCache = {
    rsvps: payload.rsvps || [],
    guests: payload.guests || [],
    quizResults: payload.quizResults || [],
    wishes: payload.wishes || [],
    musicRequests: payload.musicRequests || [],
    gallery: payload.gallery || [],
    bingoCards: payload.bingoCards || [],
    lastUpdated: payload.lastUpdated || new Date().toISOString(),
  };
  saveWeddingDataFile(DATA_DIR, weddingDataCache);
}

createStatsRoutes(app, {
  adminCodes: ADMIN_CODES,
  statsDir: path.join(__dirname, 'stats'),
  getCombinedStats: (req) => {
    const hatidjaStats = buildWeddingSiteStats(weddingDataCache, req);
    return {
      invitation: buildInvitationSiteStats(),
      hatidjaSite: {
        hasData: weddingDataCache.guests?.length > 0
          || weddingDataCache.rsvps?.length > 0
          || weddingDataCache.quizResults?.length > 0
          || weddingDataCache.wishes?.length > 0
          || weddingDataCache.musicRequests?.length > 0
          || weddingDataCache.gallery?.length > 0
          || weddingDataCache.bingoCards?.length > 0
          || Boolean(weddingDataCache.lastUpdated),
        ...hatidjaStats,
      },
    };
  },
  onClearInvitationViews: () => saveViews(INVITATION_VIEWS_FILE, { views: [] }),
  onClearHatidjaViews: () => saveViews(HATIDJA_VIEWS_FILE, { views: [] }),
  onSyncWeddingData: syncWeddingData,
});

app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/admin/login', (req, res) => {
  const code = (req.body.code || '').trim();
  if (ADMIN_CODES.has(code.toLowerCase())) {
    req.session.isInvitationAdmin = true;
    return req.session.save((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Ошибка сессии' });
      res.json({ success: true });
    });
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

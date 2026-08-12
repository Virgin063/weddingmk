const path = require('path');
const express = require('express');

function createStatsRoutes(app, config) {
  const {
    adminCodes,
    statsDir,
    getCombinedStats,
    onClearHatidjaViews,
    onClearInvitationViews,
    onSyncWeddingData,
    syncSecret = process.env.STATS_SYNC_SECRET || process.env.ADMIN_CODE || '260626MK',
  } = config;

  function hasStatsAccess(req) {
    return Boolean(req.session.isStatsViewer || req.session.isInvitationAdmin);
  }

  function isStatsViewer(req, res, next) {
    if (hasStatsAccess(req)) return next();
    res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  function sendStatsPage(req, res) {
    res.sendFile(path.join(statsDir, 'index.html'));
  }

  app.post('/api/stats/login', (req, res) => {
    const code = (req.body.code || '').trim();
    if (!adminCodes.has(code.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Неверный код' });
    }

    req.session.isStatsViewer = true;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Ошибка сессии' });
      }
      res.json({ success: true });
    });
  });

  app.post('/api/stats/logout', (req, res) => {
    delete req.session.isStatsViewer;
    req.session.save(() => res.json({ success: true }));
  });

  app.get('/api/stats/session', (req, res) => {
    res.json({ authenticated: hasStatsAccess(req) });
  });

  app.post('/api/stats/sync', (req, res) => {
    const secret = req.headers['x-stats-secret'] || '';
    if (secret !== syncSecret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (!onSyncWeddingData) {
      return res.status(500).json({ success: false, message: 'Sync not configured' });
    }
    onSyncWeddingData(req.body);
    res.json({ success: true });
  });

  app.get('/api/stats/all', isStatsViewer, (req, res) => {
    const combined = getCombinedStats(req);
    const { hasData, ...hatidjaStats } = combined.hatidjaSite;

    res.json({
      fetchedAt: new Date().toISOString(),
      sites: {
        invitation: { available: true, ...combined.invitation },
        hatidjaSite: hasData
          ? { available: true, ...hatidjaStats }
          : {
              available: false,
              error: 'no_data',
              message: 'Данные сайта Хатиджи ещё не синхронизированы с сервером',
            },
      },
    });
  });

  if (onClearInvitationViews) {
    app.delete('/api/stats/invitation-views', isStatsViewer, (req, res) => {
      onClearInvitationViews();
      res.json({ success: true });
    });
  }

  if (onClearHatidjaViews) {
    app.delete('/api/stats/hatidja-views', isStatsViewer, (req, res) => {
      onClearHatidjaViews();
      res.json({ success: true });
    });
  }

  app.get(['/stats', '/stats/'], sendStatsPage);
  app.use('/stats', express.static(statsDir, { index: false, redirect: false }));
}

module.exports = { createStatsRoutes };

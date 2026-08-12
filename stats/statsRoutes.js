const path = require('path');
const express = require('express');

function createStatsRoutes(app, config) {
  const {
    adminCodes,
    statsDir,
    getCombinedStats,
    onClearHatidjaViews,
    onSyncWeddingData,
    syncSecret = process.env.STATS_SYNC_SECRET || process.env.ADMIN_CODE || '260626MK',
  } = config;

  function isStatsViewer(req, res, next) {
    if (req.session.isStatsViewer) return next();
    res.status(403).json({ success: false, message: 'Доступ запрещен' });
  }

  app.post('/api/stats/login', (req, res) => {
    const code = (req.body.code || '').trim();
    if (adminCodes.has(code.toLowerCase())) {
      req.session.isStatsViewer = true;
      return res.json({ success: true });
    }
    res.status(403).json({ success: false, message: 'Неверный код' });
  });

  app.post('/api/stats/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get('/api/stats/session', (req, res) => {
    res.json({ authenticated: Boolean(req.session.isStatsViewer) });
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

  if (onClearHatidjaViews) {
    app.delete('/api/stats/hatidja-views', isStatsViewer, (req, res) => {
      onClearHatidjaViews();
      res.json({ success: true });
    });
  }

  app.get('/stats', (req, res) => {
    res.sendFile(path.join(statsDir, 'index.html'));
  });

  app.use('/stats', express.static(statsDir, { index: false }));
}

module.exports = { createStatsRoutes };

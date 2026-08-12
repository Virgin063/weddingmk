const path = require('path');
const express = require('express');

function createStatsRoutes(app, config) {
  const {
    siteId,
    adminCodes,
    statsDir,
    getLocalPayload,
    onClearHatidjaViews,
    peerUrl = process.env.STATS_PEER_URL || '',
    peerSecret = process.env.STATS_INTERNAL_SECRET || process.env.ADMIN_CODE || '260626MK',
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

  app.get('/api/stats/internal/data', (req, res) => {
    const secret = req.headers['x-stats-secret'] || '';
    if (secret !== peerSecret) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ siteId, data: getLocalPayload(req) });
  });

  async function fetchPeer() {
    if (!peerUrl) return { error: 'peer_not_configured' };
    try {
      const url = `${peerUrl.replace(/\/$/, '')}/api/stats/internal/data`;
      const res = await fetch(url, {
        headers: { 'X-Stats-Secret': peerSecret },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return { error: `peer_http_${res.status}` };
      return await res.json();
    } catch (e) {
      return { error: e.message || 'peer_fetch_failed' };
    }
  }

  app.get('/api/stats/all', isStatsViewer, async (req, res) => {
    const localData = getLocalPayload(req);
    const peer = await fetchPeer();

    const sites = {
      invitation: { available: false },
      hatidjaSite: { available: false },
    };

    if (siteId === 'invitation') {
      sites.invitation = { available: true, ...localData };
    } else {
      sites.hatidjaSite = { available: true, ...localData };
    }

    if (peer.siteId === 'invitation' && peer.data) {
      sites.invitation = { available: true, ...peer.data };
    } else if (peer.siteId === 'hatidjaSite' && peer.data) {
      sites.hatidjaSite = { available: true, ...peer.data };
    }

    if (peer.error) {
      if (siteId === 'invitation') {
        sites.hatidjaSite = { available: false, error: peer.error };
      } else {
        sites.invitation = { available: false, error: peer.error };
      }
    }

    res.json({
      fetchedAt: new Date().toISOString(),
      sites,
      peerError: peer.error || null,
    });
  });

  if (onClearHatidjaViews) {
    app.delete('/api/stats/hatidja-views', isStatsViewer, (req, res) => {
      onClearHatidjaViews();
      res.json({ success: true });
    });
  }

  app.use('/stats', express.static(statsDir, { index: false }));

  app.get('/stats', (req, res) => {
    res.sendFile(path.join(statsDir, 'index.html'));
  });
}

module.exports = { createStatsRoutes };

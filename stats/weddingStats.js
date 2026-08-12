const fs = require('fs');
const path = require('path');

function loadWeddingDataFile(dataDir) {
  const file = path.join(dataDir, 'wedding-data.json');
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {
    // ignore corrupt file
  }
  return {
    rsvps: [],
    guests: [],
    quizResults: [],
    wishes: [],
    musicRequests: [],
    gallery: [],
    bingoCards: [],
    lastUpdated: null,
  };
}

function saveWeddingDataFile(dataDir, data) {
  const file = path.join(dataDir, 'wedding-data.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function buildWeddingSiteStats(data, req) {
  const {
    rsvps = [],
    guests = [],
    quizResults = [],
    wishes = [],
    musicRequests = [],
    gallery = [],
    bingoCards = [],
    lastUpdated = null,
  } = data;

  const attendingHeadcount = rsvps
    .filter((r) => r.attending === 'yes')
    .reduce((sum, r) => {
      const n = parseInt(String(r.guests), 10);
      return sum + (Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 1);
    }, 0);

  const byTimeDesc = (a, b, key) => new Date(b[key]) - new Date(a[key]);

  const guestsGroom = guests.filter((g) => g.side === 'groom').length;
  const guestsBride = guests.filter((g) => g.side === 'bride').length;
  const quizSorted = [...quizResults].sort(
    (a, b) => b.percentage - a.percentage || byTimeDesc(a, b, 'timestamp')
  );
  const quizAvgPercentage = quizResults.length
    ? Math.round(quizResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / quizResults.length)
    : 0;
  const quizBest = quizSorted[0] || null;

  const musicSorted = [...musicRequests].sort(
    (a, b) => b.votes - a.votes || byTimeDesc(a, b, 'timestamp')
  );
  const musicTotalVotes = musicRequests.reduce((sum, r) => sum + (r.votes || 0), 0);

  const gallerySorted = [...gallery].sort((a, b) => byTimeDesc(a, b, 'timestamp'));
  const galleryImages = gallery.filter((g) => g.type === 'image').length;
  const galleryVideos = gallery.filter((g) => g.type === 'video').length;

  const bingoSorted = [...bingoCards].sort(
    (a, b) => (b.markedEvents?.length || 0) - (a.markedEvents?.length || 0)
  );
  const bingoCompleted = bingoCards.filter((c) => c.completedAt).length;

  const rsvpWithDietary = rsvps.filter((r) => r.dietary && String(r.dietary).trim()).length;
  const uniqueGuestNames = new Set(guests.map((g) => g.name)).size;
  const rsvpRate = guests.length ? Math.round((rsvps.length / guests.length) * 100) : 0;

  const galleryBase = process.env.HATIDJA_SITE_URL || '';

  return {
    lastUpdated,
    totalGuests: guests.length,
    uniqueGuestNames,
    guestsGroom,
    guestsBride,
    totalRSVPs: rsvps.length,
    attendingYes: rsvps.filter((r) => r.attending === 'yes').length,
    attendingNo: rsvps.filter((r) => r.attending === 'no').length,
    attendingHeadcount,
    rsvpWithDietary,
    rsvpRate,
    quizCompleted: quizResults.length,
    quizAvgPercentage,
    quizBest,
    wishesCount: wishes.length,
    musicRequestsCount: musicRequests.length,
    musicTotalVotes,
    galleryItemsCount: gallery.length,
    galleryImages,
    galleryVideos,
    bingoPlayers: bingoCards.length,
    bingoCompleted,
    guestsList: [...guests].sort((a, b) => byTimeDesc(a, b, 'loginTime')),
    rsvpsList: [...rsvps].sort((a, b) => byTimeDesc(a, b, 'timestamp')),
    wishesList: [...wishes].sort((a, b) => byTimeDesc(a, b, 'timestamp')),
    quizResultsList: quizSorted,
    musicRequestsList: musicSorted,
    galleryList: gallerySorted.map((item) => ({
      ...item,
      url: galleryBase && item.url ? `${galleryBase.replace(/\/$/, '')}${item.url}` : item.url,
    })),
    bingoCardsList: bingoSorted,
  };
}

module.exports = {
  loadWeddingDataFile,
  saveWeddingDataFile,
  buildWeddingSiteStats,
};

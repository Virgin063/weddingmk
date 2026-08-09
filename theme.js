/* Shared theme defaults and helpers */

const DEFAULT_THEME = {
  background: '#fffcf8',
  accentSection: '#f3ebdc',
  accentSectionLight: '#faf5eb',
  accentSectionDeep: '#ebe0cc',
  primary: '#c9a85c',
  accent: '#e8d9b8',
  accentBright: '#dbb04a',
  text: '#6b5528',
  textMuted: '#b8a078',
  textStrong: '#4a3a20',
  textHeading: '#5a4218',
  textOnAccent: '#4a3a20',
};

const THEME_PRESETS = {
  gold: { ...DEFAULT_THEME },
  blush: {
    background: '#fff9f7',
    accentSection: '#f5ebe8',
    accentSectionLight: '#faf3f0',
    accentSectionDeep: '#ebd8d4',
    primary: '#c49090',
    accent: '#e8cfc9',
    accentBright: '#d4a0a0',
    text: '#6b4545',
    textMuted: '#b89090',
    textStrong: '#4a3030',
    textHeading: '#5c3838',
    textOnAccent: '#4a3030',
  },
  bordo: {
    background: '#fcf2e9',
    accentSection: '#41090a',
    accentSectionLight: '#5a1418',
    accentSectionDeep: '#2e0607',
    primary: '#d3aeaa',
    accent: '#a05055',
    accentBright: '#f4846b',
    text: '#41090a',
    textMuted: '#6b4040',
    textStrong: '#41090a',
    textHeading: '#80090d',
    textOnAccent: '#f0ebe8',
  },
  sage: {
    background: '#f8faf6',
    accentSection: '#e8ede4',
    accentSectionLight: '#f2f5ef',
    accentSectionDeep: '#dce5d6',
    primary: '#6b7d62',
    accent: '#b8c9ae',
    accentBright: '#8fa882',
    text: '#3d4a38',
    textMuted: '#7a8a72',
    textStrong: '#2e382c',
    textHeading: '#4a5c44',
    textOnAccent: '#2e382c',
  },
};

const THEME_ADMIN_FIELDS = [
  { key: 'background', label: 'Фон страницы' },
  { key: 'accentSection', label: 'Фон акцентных блоков' },
  { key: 'primary', label: 'Основной акцент' },
  { key: 'accentBright', label: 'Яркий акцент' },
  { key: 'textHeading', label: 'Заголовки' },
  { key: 'textStrong', label: 'Основной текст' },
];

function mergeTheme(theme) {
  return { ...DEFAULT_THEME, ...(theme || {}) };
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3
    ? value.split('').map((c) => c + c).join('')
    : value;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function autoTextOnAccent(accentSection, textStrong) {
  return relativeLuminance(accentSection) < 0.22 ? '#f5f0e6' : textStrong;
}

function applyTheme(theme) {
  const t = mergeTheme(theme);
  if (!t.textOnAccent) {
    t.textOnAccent = autoTextOnAccent(t.accentSection, t.textStrong);
  }

  const root = document.documentElement;
  root.style.setProperty('--bordo-dark', t.accentSection);
  root.style.setProperty('--bordo-dark-light', t.accentSectionLight);
  root.style.setProperty('--bordo-dark-deep', t.accentSectionDeep);
  root.style.setProperty('--bordo', t.primary);
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--cream', t.background);
  root.style.setProperty('--rose', t.accent);
  root.style.setProperty('--coral', t.accentBright);
  root.style.setProperty('--text-on-light', t.text);
  root.style.setProperty('--text-muted-light', t.textMuted);
  root.style.setProperty('--text-strong', t.textStrong);
  root.style.setProperty('--text-heading', t.textHeading);
  root.style.setProperty('--text-on-accent', t.textOnAccent);
  root.style.setProperty('--text-muted-dark', `${t.textMuted}99`);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t.accentSection;
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_THEME,
    THEME_PRESETS,
    THEME_ADMIN_FIELDS,
    mergeTheme,
    applyTheme,
  };
}

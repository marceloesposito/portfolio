document.addEventListener('DOMContentLoaded', function() {
  const root = document.documentElement;
  const swapBtn = document.getElementById('swapColors');
  const randomBtn = document.getElementById('randomizeColors');
  const saveBtn = document.getElementById('saveColors');
  const langEnBtn = document.getElementById('langEn');
  const langItBtn = document.getElementById('langIt');
  let currentLang = localStorage.getItem('lang') || 'en';

  const translations = {
    en: {
      'color controls': 'color controls',
      'font controls': 'font controls',
      'language controls': 'language controls',
      'navigation': 'navigation',
      'content': 'content',
      'swap colors': 'swap colors',
      'randomize colors': 'randomize colors',
      'save colors': 'save colors',
      'serif': 'serif',
      'sans': 'sans',
      'mono': 'mono',
      'search': 'search',
      'home': 'home',
      'portfolio': 'portfolio',
      'project 1': 'project 1',
      'project 2': 'project 2',
      'blog': 'blog',
      'post 1': 'post 1',
      'rss feed': 'rss feed',
      'english': 'english',
      'italian': 'italian',
      'type here to search': 'type here to search'
    },
    it: {
      'color controls': 'controlli colore',
      'font controls': 'controlli font',
      'language controls': 'controlli lingua',
      'navigation': 'navigazione',
      'content': 'contenuto',
      'swap colors': 'scambia colori',
      'randomize colors': 'randomizza colori',
      'save colors': 'salva colori',
      'serif': 'serif',
      'sans': 'sans',
      'mono': 'mono',
      'search': 'cerca',
      'home': 'casa',
      'portfolio': 'portfolio',
      'project 1': 'progetto 1',
      'project 2': 'progetto 2',
      'blog': 'blog',
      'post 1': 'post 1',
      'rss feed': 'feed rss',
      'english': 'inglese',
      'italian': 'italiano',
      'type here to search': 'digita qui per cercare'
    }
  };

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-lang-key]').forEach(el => {
      const key = el.dataset.langKey;
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
    document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
      const key = el.dataset.langPlaceholder;
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });
    // Re-render current page
    const currentPage = document.querySelector('.nav-item.selected');
    if (currentPage) {
      renderPage(currentPage.dataset.page);
    }
  }

  // Utilities: color conversions and WCAG contrast
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function sRGBtoLinear(v) {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const R = sRGBtoLinear(r);
    const G = sRGBtoLinear(g);
    const B = sRGBtoLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function contrastRatio(hex1, hex2) {
    const L1 = relativeLuminance(hex1);
    const L2 = relativeLuminance(hex2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function randomHexColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  // Build an array of vectors (each vector is an array of 2 hex colors)
  // Ensure each pair has at least 9:1 contrast ratio.
  function buildPalette(count) {
    const palette = [];
    let attempts = 0;
    while (palette.length < count && attempts < count * 200) {
      attempts++;
      const a = randomHexColor();
      const b = randomHexColor();
      if (a.toLowerCase() === b.toLowerCase()) continue;
      const ratio = contrastRatio(a, b);
      if (ratio >= 9) palette.push([a.toLowerCase(), b.toLowerCase()]);
    }
    // Fallback: ensure at least one pair exists (black/white)
    if (palette.length === 0) palette.push(['#000000', '#ffffff']);
    return palette;
  }

  // apply a vector: set --bg-color to first, --fg-color to second
  function applyVector(vector) {
    const [bg, fg] = vector;
    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--fg-color', fg);
    // update preview labels if present
    updateColorPreview();
  }

  // swap current variables
  function swapColors() {
    const styles = getComputedStyle(root);
    const bg = styles.getPropertyValue('--bg-color').trim();
    const fg = styles.getPropertyValue('--fg-color').trim();
    root.style.setProperty('--bg-color', fg);
    root.style.setProperty('--fg-color', bg);
    updateColorPreview();
  }

  // save current colors to localStorage
  function saveColors() {
    const styles = getComputedStyle(root);
    const bg = styles.getPropertyValue('--bg-color').trim();
    const fg = styles.getPropertyValue('--fg-color').trim();
    localStorage.setItem('savedBg', bg);
    localStorage.setItem('savedFg', fg);
  }

  // Generate a palette of 8 vectors (each with 2 colors)
  const palette = buildPalette(8);

  // Randomly pick a vector from palette and apply it (first -> bg, second -> fg)
  function applyRandomVector() {
    const idx = Math.floor(Math.random() * palette.length);
    applyVector(palette[idx]);
  }

  // update hex labels shown in the color preview area (if present)
  function updateColorPreview() {
    try {
      const styles = getComputedStyle(root);
      const fg = styles.getPropertyValue('--fg-color').trim();
      const bg = styles.getPropertyValue('--bg-color').trim();
      const fgLabel = document.getElementById('fgHex');
      const bgLabel = document.getElementById('bgHex');
      if (fgLabel) fgLabel.textContent = fg;
      if (bgLabel) bgLabel.textContent = bg;
    } catch (e) {
      // ignore if DOM not ready
    }
  }

  // Expose for console/testing
  window.__colorPalette = palette;
  window.applyVector = applyVector;

  if (swapBtn) swapBtn.addEventListener('click', swapColors);
  if (randomBtn) randomBtn.addEventListener('click', applyRandomVector);
  if (saveBtn) saveBtn.addEventListener('click', saveColors);

  // wire global function (keeps previous behavior available)
  window.swapColors = swapColors;
  window.randomizeColors = applyRandomVector;

  // Optionally apply an initial vector on load: saved or random
  const savedBg = localStorage.getItem('savedBg');
  const savedFg = localStorage.getItem('savedFg');
  if (savedBg && savedFg) {
    applyVector([savedBg, savedFg]);
  } else {
    applyRandomVector();
  }
  // ensure preview labels reflect current variables
  updateColorPreview();
  
  // Note: custom caret was removed — the native caret is used now.

  // ---------- Selectable list behavior ----------
  // Multi-select list: toggle selected state independently
  const multiButtons = Array.from(document.querySelectorAll('.multi-select .selectable'));
  multiButtons.forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });

  // Single-select list: clicking selects that item and deselects others
  const singleButtons = Array.from(document.querySelectorAll('.single-select .selectable'));
  singleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      singleButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // ---------- Collapsible sections ----------
  const collapsibles = Array.from(document.querySelectorAll('.collapsible'));
  collapsibles.forEach(btn => {
    btn.addEventListener('click', () => {
      const subList = btn.nextElementSibling;
      if (subList.style.display === 'none' || subList.style.display === '') {
        subList.style.display = 'block';
        btn.classList.add('expanded');
      } else {
        subList.style.display = 'none';
        btn.classList.remove('expanded');
      }
    });
  });

  // ---------- Font toggle behavior ----------
  const fontButtons = Array.from(document.querySelectorAll('.font-toggle'));
  const fontMap = {
    serif: "'Times New Roman', Times, serif",
    sans: 'Arial, Helvetica, sans-serif',
    mono: "'Courier New', Courier, monospace"
  };

  function applyFont(key) {
    const fam = fontMap[key] || fontMap.serif;
    document.body.style.fontFamily = fam;
    // update selected state
    fontButtons.forEach(b => b.classList.toggle('selected', b.dataset.font === key));
  }

  fontButtons.forEach(btn => {
    btn.addEventListener('click', () => applyFont(btn.dataset.font));
  });

  // default selection to serif
  if (fontButtons.length) applyFont('serif');

  // ---------- Site pages data + navigator behavior ----------
  const contentBody = document.getElementById('contentBody');
  const navItems = Array.from(document.querySelectorAll('.nav-item'));

  // Data structure for site pages: portfolio entries, blog posts, RSS page
  const PAGES = {
    'home': {
      title: 'home',
      type: 'html',
      content: '<h2>welcome</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor.</p>'
    },
    'portfolio-1': {
      title: 'project 1',
      type: 'html',
      content: '<h2>project 1</h2><p>project 1 description — Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>'
    },
    'portfolio-2': {
      title: 'project 2',
      type: 'html',
      content: '<h2>project 2</h2><p>project 2 description — Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue.</p>'
    },
    'blog-1': {
      title: 'blog post 1',
      type: 'html',
      content: '<h2>blog post 1</h2><p>blog post content — Cras ornare tristique elit. Vivamus vestibulum ntulla nec ante.</p>'
    },
    'rss': {
      title: 'rss feed',
      type: 'rss',
      content: '<h2>rss feed</h2><p>feed items will be shown here. (placeholder)</p><ul><li>item 1 — example feed entry</li><li>item 2 — example feed entry</li></ul>'
    }
  };

  function renderPage(key) {
    const page = PAGES[key] || { title: key, type: 'html', content: '<p>No content</p>' };
    if (!contentBody) return;
    // For now all types render their HTML content string
    contentBody.innerHTML = page.content;
  }

  // wire nav item clicks
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      // single-select behavior
      navItems.forEach(n => n.classList.remove('selected'));
      btn.classList.add('selected');
      // render page from data structure
      const key = btn.dataset.page;
      renderPage(key);
    });
  });

  // default to home
  if (navItems.length) {
    const first = navItems.find(n => n.dataset.page === 'home') || navItems[0];
    first.classList.add('selected');
    renderPage(first.dataset.page);
  }
});

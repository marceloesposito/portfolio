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
      'type here to search': 'type here to search',
      'music player': 'music player',
      'now playing': 'now playing',
      'skip': 'skip',
      'pause': 'pause',
      'play': 'play',
      'mute': 'mute',
      'volume': 'volume'
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
      'type here to search': 'digita qui per cercare',
      'music player': 'lettore musicale',
      'now playing': 'in riproduzione',
      'skip': 'salta',
      'pause': 'pausa',
      'play': 'riproduci',
      'mute': 'muto',
      'volume': 'volume'
    }
  };

  function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    // Update toggle button states
    langButtons.forEach(b => b.classList.toggle('selected', b.dataset.lang === lang));
    // Update text for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang][key]) {
        if (el.tagName === 'INPUT' && el.type === 'search') {
          el.placeholder = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });
    // Reload currently selected nav item content in the new language
    const selectedNavItem = document.querySelector('.nav-item.selected');
    if (selectedNavItem) {
      const file = selectedNavItem.dataset.file;
      if (file) loadAndRender(file);
    }
  }

  async function loadAndRender(file) {
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error('Failed to load ' + file);
      const json = await res.json();
      const title = json['title_' + currentLang] || json.title || 'Untitled';
      const content = json['content_' + currentLang] || json.content || '<p>No content available.</p>';
      const contentBody = document.getElementById('contentBody');
      if (contentBody) {
        contentBody.innerHTML = '<h2>' + title + '</h2>' + content;
      }
    } catch (e) {
      console.error(e);
      const contentBody = document.getElementById('contentBody');
      if (contentBody) {
        contentBody.innerHTML = '<p>Error loading content.</p>';
      }
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

  // ---------- Navigation item behavior ----------
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deselect others
      navItems.forEach(b => b.classList.remove('selected'));
      // Select this one
      btn.classList.add('selected');
      // Load content
      const file = btn.dataset.file;
      if (file) loadAndRender(file);
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

  // ---------- Language toggle behavior ----------
  const langButtons = Array.from(document.querySelectorAll('.lang-toggle'));

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => changeLanguage(btn.dataset.lang));
  });

  // Default to English
  changeLanguage('en');

  // Load initial content (home)
  const homeItem = document.querySelector('.nav-item[data-file="data/home.json"]');
  if (homeItem) {
    homeItem.classList.add('selected');
    loadAndRender('data/home.json');
  }

  // ---------- Site search (scans JSON files listed in SEARCH_FILES) ----------
  const SEARCH_FILES = [
    'data/home.json',
    'data/blog/post1.json',
    'data/projects/project1.json',
    'data/projects/project2.json',
    'data/rss/feed.json'
  ];
  const searchInput = document.getElementById('siteSearch');
  const searchBtnEl = document.getElementById('searchBtn');

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }

  // find sentence containing index; split by punctuation
  function extractSentenceAround(text, index, maxLen = 200) {
    // split into sentences
    const sentences = text.split(/(?<=[\.\!\?])\s+/);
    let acc = 0;
    for (let s of sentences) {
      const start = acc;
      const end = acc + s.length;
      if (index >= start && index <= end) {
        s = s.trim();
        if (s.length <= maxLen) return s;
        // truncate around the match roughly in middle
        return s.slice(0, maxLen - 1) + '…';
      }
      acc = end + 1; // account for split
    }
    // Fallback: return a shortened chunk around index
    const start = Math.max(0, index - Math.floor(maxLen / 2));
    return (start > 0 ? '…' : '') + text.substr(start, maxLen) + (start + maxLen < text.length ? '…' : '');
  }

  function highlightMatches(text, terms) {
    if (!terms || !terms.length) return text;
    // escape regex
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp('(' + escaped.join('|') + ')', 'gi');
    return text.replace(re, '<span class="match">$1</span>');
  }

  function getNavPath(file) {
    const navItem = document.querySelector(`.nav-item[data-file="${file}"]`);
    if (!navItem) return file.replace(/^data\//, '');
    let path = navItem.textContent.trim();
    // Check if it has a parent collapsible
    const li = navItem.closest('li');
    if (li && li.parentElement && li.parentElement.previousElementSibling && li.parentElement.previousElementSibling.classList.contains('collapsible')) {
      const parentText = li.parentElement.previousElementSibling.textContent.trim();
      path = parentText + ' / ' + path;
    }
    return path;
  }

  async function runSearch(query) {
    if (!contentBody) return;
    const q = (query || '').trim();
    if (!q) {
      contentBody.innerHTML = '<p>Please enter a search term.</p>';
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const results = [];
    const lang = currentLang;
    const contentKey = 'content_' + lang;

    // fetch each JSON file and search
    await Promise.all(SEARCH_FILES.map(async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return;
        const json = await res.json();
        const title = json['title_' + lang] || json.title || '';
        const raw = (json[contentKey] || json.content || '') + ' ' + title;
        const text = stripHtml(raw);
        const lower = text.toLowerCase();
        // find all matches for any term
        for (let term of terms) {
          const li = lower.indexOf(term.toLowerCase());
          if (li !== -1) {
            const sentence = extractSentenceAround(text, li, 220);
            const highlighted = highlightMatches(sentence, terms);
            results.push({ excerpt: highlighted, source: path });
            break; // show only one match per file for brevity
          }
        }
      } catch (e) {
        // ignore file fetch errors
      }
    }));

    if (!results.length) {
      contentBody.innerHTML = '<p>No results.</p>';
      return;
    }

    // Render results
    const wrap = document.createElement('div');
    wrap.className = 'search-results';
    results.forEach((r, index) => {
      const row = document.createElement('div');
      row.className = 'search-result';
      const src = document.createElement('div');
      src.className = 'result-source';
      // Get navigation path
      const navPath = getNavPath(r.source);
      src.textContent = navPath;
      const e = document.createElement('div');
      e.className = 'excerpt';
      e.innerHTML = r.excerpt;
      row.appendChild(src);
      row.appendChild(e);
      wrap.appendChild(row);
      // Add divider if not the last result
      if (index < results.length - 1) {
        const hr = document.createElement('hr');
        hr.className = 'search-divider';
        wrap.appendChild(hr);
      }
    });
    contentBody.innerHTML = '';
    contentBody.appendChild(wrap);
  }

  if (searchBtnEl) searchBtnEl.addEventListener('click', () => runSearch(searchInput.value));
  if (searchInput) searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runSearch(searchInput.value); }
  });

  // ---------- Music player wiring ----------
  const audio = document.getElementById('audioPlayer');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const skipBtn = document.getElementById('skipBtn');
  const muteBtn = document.getElementById('muteBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercent = document.getElementById('volumePercent');
  const npAuthor = document.getElementById('npAuthor');
  const npTitle = document.getElementById('npTitle');

  const PLAYLIST = [
    { author: 'Artist A', title: 'Sample Track 1', src: '' },
    { author: 'Artist B', title: 'Sample Track 2', src: '' }
  ];
  let currentTrack = 0;

  function loadTrack(i) {
    currentTrack = (i + PLAYLIST.length) % PLAYLIST.length;
    const t = PLAYLIST[currentTrack];
    if (npAuthor) npAuthor.textContent = t.author;
    if (npTitle) npTitle.textContent = t.title;
    if (audio) {
      if (t.src) {
        audio.src = t.src;
        audio.load();
      } else {
        audio.removeAttribute('src');
      }
    }
  }

  if (playBtn) playBtn.addEventListener('click', () => { if (audio) audio.play().catch(()=>{}); });
  if (pauseBtn) pauseBtn.addEventListener('click', () => { if (audio) audio.pause(); });
  if (skipBtn) skipBtn.addEventListener('click', () => { loadTrack(currentTrack + 1); if (audio && audio.src) audio.play().catch(()=>{}); });
  if (muteBtn) muteBtn.addEventListener('click', () => { if (audio) audio.muted = !audio.muted; });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      if (audio) audio.volume = v;
      if (volumePercent) volumePercent.textContent = e.target.value;
    });
    // initialize
    volumeSlider.dispatchEvent(new Event('input'));
  }

  // load initial track info
  loadTrack(0);
});

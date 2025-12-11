document.addEventListener('DOMContentLoaded', function() {
  const root = document.documentElement;
  const swapBtn = document.getElementById('swapColors');
  const randomBtn = document.getElementById('randomizeColors');

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

  // wire global function (keeps previous behavior available)
  window.swapColors = swapColors;
  window.randomizeColors = applyRandomVector;

  // Optionally apply an initial random vector on load
  applyRandomVector();
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

  // ---------- Site pages navigator: fetch JSON pages and render ----------
  const contentBody = document.getElementById('contentBody');

  // Toggle nested section lists
  const sectionToggles = Array.from(document.querySelectorAll('.section-toggle'));
  sectionToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      const nested = document.querySelector('.nested[data-section="' + section + '"]');
      if (!nested) return;
      const isOpen = nested.classList.toggle('open');
      btn.textContent = btn.textContent.replace(/▸|▾/, isOpen ? '▾' : '▸');
    });
  });

  // Nav item clicks load JSON file and render
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  async function loadAndRender(filePath) {
    if (!contentBody) return;
    try {
      const res = await fetch(filePath);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const json = await res.json();
      contentBody.innerHTML = (json.title ? '<h2>' + json.title + '</h2>' : '') + (json.content || '');
    } catch (err) {
      contentBody.innerHTML = '<p>Unable to load content.</p><pre>' + (err && err.message) + '</pre>';
    }
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      // visual single-select for nav items
      document.querySelectorAll('.nav-item.selected').forEach(n => n.classList.remove('selected'));
      btn.classList.add('selected');
      const file = btn.dataset.file;
      if (file) loadAndRender(file);
    });
  });

  // load home by default (home could be a JSON file if desired)
  // If there's a nav-item that points to a home file, prefer it; otherwise show existing content
  const homeItem = document.querySelector('.nav-item[data-file="data/home.json"]');
  if (homeItem) homeItem.click();

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

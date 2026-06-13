/* ═══════════════════════════════════════
   script.js  ·  Game 1 – Flashlight / Find-the-Cat
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle:  'Alles Gute, Jessi!',
  hint:       'Finde die Katze',
  winTitle:   'Du hast sie gefunden!',
  winSub:     'Bereit fuers Memory?',
  winBtn:     'Zum Memory →',
  navFwd:     'Weiter →',
  wrongMsgs: [
    'Das ist doch keine Katze!',
    'Hmm, das ist keine Katze!',
    'Nein nein nein – such weiter!',
    'Fast! Aber das ist keine Katze!',
    'Eine Katze sieht anders aus!',
  ],
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                    = TEXT.pageTitle;
document.getElementById('hint').textContent       = TEXT.hint;
document.querySelector('.ws-title').textContent   = TEXT.winTitle;
document.querySelector('.ws-sub').textContent     = TEXT.winSub;
document.querySelector('.ws-btn').textContent     = TEXT.winBtn;
document.getElementById('nav-fwd').textContent    = TEXT.navFwd;

/* ── DOM references ──────────────────────────────────────────────────────── */
const overlay    = document.getElementById('overlay');
const cursorRing = document.getElementById('cursor-ring');
const cursorDot  = document.getElementById('cursor-dot');
const container  = document.getElementById('icons-container');
const toast      = document.getElementById('toast');
const toastText  = document.getElementById('toast-text');

/* ── Navigate with fade-out transition ───────────────────────────────────── */
function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(function() { window.location.href = url; }, 360);
}

/* ── Wire up navigation buttons ─────────────────────────────────────────── */
document.querySelector('.ws-btn').addEventListener('click', function() { navigate('../game2/'); });
document.getElementById('nav-fwd').addEventListener('click', function() { navigate('../game2/'); });

/* ── Flashlight overlay + custom cursor tracking ─────────────────────────── */

let mx = window.innerWidth  / 2;
let my = window.innerHeight / 2;

document.addEventListener('mousemove', function(e) {
  mx = e.clientX;
  my = e.clientY;

  /* Move the flashlight hole to follow the cursor */
  overlay.style.background =
    'radial-gradient(' +
    'circle at ' + mx + 'px ' + my + 'px,' +
    'rgba(255,182,220,.04)  0px,' +
    'transparent           80px,' +
    'rgba(13,0,8,.88)     150px,' +
    'rgba(13,0,8,.98)     200px,' +
    '#0d0008              240px' +
    ')';

  /* Move custom cursor elements */
  cursorRing.style.left = mx + 'px';
  cursorRing.style.top  = my + 'px';
  cursorDot.style.left  = mx + 'px';
  cursorDot.style.top   = my + 'px';
});

/* ── Icon definitions ────────────────────────────────────────────────────── */
/* The cat (isCat: true) is the target; everything else is a decoy. */
const ICONS = [
  { emoji: '🐱', isCat: true  },
  { emoji: '🌸', isCat: false },
  { emoji: '🦋', isCat: false },
  { emoji: '🌙', isCat: false },
  { emoji: '⭐', isCat: false },
  { emoji: '🌺', isCat: false },
  { emoji: '🎀', isCat: false },
  { emoji: '🍀', isCat: false },
  { emoji: '🌷', isCat: false },
  { emoji: '✨', isCat: false },
  { emoji: '🎈', isCat: false },
  { emoji: '🍭', isCat: false },
];

/* ── Utility: Fisher-Yates shuffle ──────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Utility: collision check for minimum distance between placed icons ───── */
function tooClose(x, y, placed, minDist) {
  return placed.some(function(p) { return Math.hypot(p.x - x, p.y - y) < minDist; });
}

/* ── Place icons randomly across the viewport with minimum spacing ──────── */
function placeIcons() {
  const pad     = 80;
  const minDist = 120;
  const maxW    = window.innerWidth  - pad;
  const maxH    = window.innerHeight - pad;
  const placed  = [];

  shuffle(ICONS).forEach(function(icon) {
    let x, y, attempts = 0;

    /* Retry placement until a valid position is found (max 50 tries) */
    do {
      x = pad + Math.random() * (maxW - pad);
      y = pad + Math.random() * (maxH - pad);
      attempts++;
    } while (tooClose(x, y, placed, minDist) && attempts < 50);

    placed.push({ x, y });

    const el = document.createElement('div');
    el.className   = 'icon';
    el.textContent = icon.emoji;
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';

    el.addEventListener('click', function() { handleClick(icon.isCat); });
    container.appendChild(el);
  });
}

/* ── Handle icon click ───────────────────────────────────────────────────── */
function handleClick(isCat) {
  if (isCat) {
    /* Correct! Show the win overlay. */
    document.getElementById('win-screen').classList.add('visible');
  } else {
    /* Wrong — show a random humorous message. */
    const msgs = TEXT.wrongMsgs;
    showToast(msgs[Math.floor(Math.random() * msgs.length)]);
  }
}

/* ── Toast display helper ────────────────────────────────────────────────── */
let toastTimer;

function showToast(text) {
  clearTimeout(toastTimer);
  toastText.textContent = text;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(function() { toast.classList.add('hidden'); }, 2600);
}

/* ── Init: place icons and start star background ─────────────────────────── */
placeIcons();
initPageStars('star-canvas');

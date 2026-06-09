const overlay      = document.getElementById('overlay');
const cursorRing   = document.getElementById('cursor-ring');
const cursorDot    = document.getElementById('cursor-dot');
const container    = document.getElementById('icons-container');
const toast        = document.getElementById('toast');
const toastText    = document.getElementById('toast-text');

// ── Flashlight & cursor ──────────────────────────────────────────────────────

let mx = window.innerWidth / 2;
let my = window.innerHeight / 2;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;

  overlay.style.background = `radial-gradient(
    circle at ${mx}px ${my}px,
    rgba(255,182,220,.04)  0px,
    transparent           80px,
    rgba(13,0,8,.88)     150px,
    rgba(13,0,8,.98)     200px,
    #0d0008              240px
  )`;

  cursorRing.style.left = mx + 'px';
  cursorRing.style.top  = my + 'px';
  cursorDot.style.left  = mx + 'px';
  cursorDot.style.top   = my + 'px';
});

// ── Icon definitions ─────────────────────────────────────────────────────────

const ICONS = [
  { emoji: '🐱', isCat: true  },   // ← the target
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

const WRONG_MESSAGES = [
  'Das ist doch keine Katze! 😅',
  'Hmm, das ist keine Katze! 🤔',
  'Nein nein nein — such weiter! 🔍',
  'Fast! Aber das ist keine Katze! 😄',
  'Eine Katze sieht anders aus! 🙈',
];

// ── Place icons with minimum distance ────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tooClose(x, y, placed, minDist) {
  return placed.some(p => Math.hypot(p.x - x, p.y - y) < minDist);
}

function placeIcons() {
  const pad     = 80;
  const minDist = 120;
  const maxW    = window.innerWidth  - pad;
  const maxH    = window.innerHeight - pad;
  const placed  = [];

  shuffle(ICONS).forEach(icon => {
    let x, y, attempts = 0;
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

    el.addEventListener('click', () => handleClick(icon.isCat));
    container.appendChild(el);
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(() => { window.location.href = url; }, 360);
}

// ── Click handling ────────────────────────────────────────────────────────────

function handleClick(isCat) {
  if (isCat) {
    document.getElementById('win-screen').classList.add('visible');
  } else {
    const msg = WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
    showToast(msg);
  }
}

let toastTimer;

function showToast(text) {
  clearTimeout(toastTimer);
  toastText.textContent = text;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

// ── Init ──────────────────────────────────────────────────────────────────────

placeIcons();

/* ═══════════════════════════════════════
   game2.js  ·  Memory Card Game (Game 2)
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle:       'Memory – Alles Gute, Jessi!',
  heading:         'Du hast die Katze gefunden!',
  subtitle:        'Jetzt: Memory',
  statsMovesLabel: 'Züge:',
  statsFoundLabel: 'Gefunden:',
  statsFoundOf:    '/ 8',
  winTitle:        'Gewonnen!',
  winSub:          'Alle Paare gefunden in',
  winSubEnd:       'Zügen!',
  winBtn:          'Weiter →',
  navBack:         '← Zurück',
  navFwd:          'Weiter →',
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                      = TEXT.pageTitle;
document.querySelector('h1').textContent            = TEXT.heading;
document.querySelector('.subtitle').textContent     = TEXT.subtitle;
document.getElementById('lbl-moves').textContent    = TEXT.statsMovesLabel;
document.getElementById('lbl-found').textContent    = TEXT.statsFoundLabel;
document.getElementById('lbl-of').textContent       = TEXT.statsFoundOf;
document.getElementById('win-title').textContent    = TEXT.winTitle;
document.getElementById('btn-next').textContent     = TEXT.winBtn;
document.getElementById('nav-back').textContent     = TEXT.navBack;
document.getElementById('nav-fwd').textContent      = TEXT.navFwd;

/* ── Navigate with fade-out transition ───────────────────────────────────── */
function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(function() { window.location.href = url; }, 360);
}

/* ── Wire up navigation buttons ─────────────────────────────────────────── */
document.getElementById('btn-next').addEventListener('click',  function() { navigate('../game3/'); });
document.getElementById('nav-back').addEventListener('click',  function() { navigate('../game1/'); });
document.getElementById('nav-fwd').addEventListener('click',   function() { navigate('../game3/'); });

/* ── Card symbols (8 pairs) ──────────────────────────────────────────────── */
const PAIRS = ['🌸', '🦋', '🌙', '⭐', '🌺', '🎀', '🍭', '🐱'];

/* ── Utility: Fisher-Yates shuffle ──────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Game state ──────────────────────────────────────────────────────────── */
const deck  = shuffle([...PAIRS, ...PAIRS]);  // 16 cards (8 pairs)
const grid  = document.getElementById('grid');
let flipped = [];   // cards currently face-up (max 2)
let locked  = false;
let moves   = 0;
let found   = 0;

/* ── Build the grid ──────────────────────────────────────────────────────── */
deck.forEach(function(symbol, idx) {
  const card = document.createElement('div');
  card.className        = 'card';
  card.dataset.symbol   = symbol;
  card.dataset.idx      = idx;

  /* Each card has a back face and a front face (emoji) */
  card.innerHTML =
    '<div class="card-inner">' +
      '<div class="card-face card-back"><div class="card-back-inner">✦</div></div>' +
      '<div class="card-face card-front">' + symbol + '</div>' +
    '</div>';

  card.addEventListener('click', function() { onCardClick(card); });
  grid.appendChild(card);
});

/* ── Card click handler ──────────────────────────────────────────────────── */
function onCardClick(card) {
  /* Ignore clicks when locked, already flipped, already matched, or two cards up */
  if (locked)                             return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;
  if (flipped.length === 2)               return;

  card.classList.add('flipped');
  flipped.push(card);

  /* Wait for a second card */
  if (flipped.length < 2) return;

  /* Two cards are now face-up — check for a match */
  moves++;
  document.getElementById('moves').textContent = moves;
  locked = true;

  const [a, b] = flipped;

  if (a.dataset.symbol === b.dataset.symbol) {
    /* Match found: mark both and update counter */
    a.classList.add('matched');
    b.classList.add('matched');
    found++;
    document.getElementById('found').textContent = found;
    flipped = [];
    locked  = false;

    /* All pairs matched — show win screen after a short delay */
    if (found === PAIRS.length) {
      setTimeout(showWin, 600);
    }
  } else {
    /* No match: flip both cards back after a brief pause */
    setTimeout(function() {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      flipped = [];
      locked  = false;
    }, 1000);
  }
}

/* ── Show the win overlay ────────────────────────────────────────────────── */
function showWin() {
  /* Build win subtitle with move count inline */
  document.getElementById('win-sub').textContent =
    TEXT.winSub + ' ' + moves + ' ' + TEXT.winSubEnd;
  document.getElementById('win-screen').classList.add('visible');
}

/* ── Start background stars ──────────────────────────────────────────────── */
initPageStars('star-canvas');

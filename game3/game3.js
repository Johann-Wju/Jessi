/* ═══════════════════════════════════════
   game3.js  ·  Lucky Wheel Game (Game 3)
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle:    'Glücksrad – Jessi!',
  heading:      'Glücksrad',
  subtitle:     'Dreh das Rad deines Schicksals!',
  spinBtn:      'Drehen!',
  jackpotTitle: 'JACKPOT!!',
  jackpotSub:   'Du hast gewonnen! Weiter zum naechsten Abenteuer!',
  jackpotBtn:   'Weiter →',
  tollText:     'Du bist toll!',
  navBack:      '← Zurück',
  navFwd:       'Weiter →',

  /* Wheel segment labels and emojis — edit text here, colors in segColors */
  segments: [
    { id: 'plus',      label: '+100€',          emoji: '💰' },
    { id: 'jackpot',   label: 'JACKPOT',         emoji: '🏆' },
    { id: 'rainbow',   label: 'Rainbow',         emoji: '🌈' },
    { id: 'capybara',  label: 'Capybara Regen',  emoji: '🦫' },
    { id: 'cats',      label: 'Cat Rain',        emoji: '🐱' },
    { id: 'explosion', label: 'Explosion!',      emoji: '💥' },
    { id: 'lasagne',   label: 'Lasagne',         emoji: '🍝' },
    { id: 'toll',        label: 'Du bist toll!',   emoji: '💖' },
    { id: 'jessistinkt', label: 'Jessi Stinkt',    emoji: '💩' },
    { id: 'feuerwerk',   label: 'Feuerwerk',        emoji: '🎆' },
  ],

  /* One background colour per segment (same order as segments array) */
  segColors: [
    '#1a5c2e', '#b8860b', '#4a1280', '#6b3d1e',
    '#7a1255', '#8a1010', '#a0401a', '#b0104a',
    '#1e5200', '#080066',
  ],

  /* Text shown inside the Jessi Stinkt overlay — edit here */
  jessistinktText: 'JESSI STINKT!',
  jessistinktSub:  '(Nur ein Spaß lol)',
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                       = TEXT.pageTitle;
document.querySelector('h1').textContent             = TEXT.heading;
document.querySelector('.subtitle').textContent      = TEXT.subtitle;
document.getElementById('spin-btn').textContent      = TEXT.spinBtn;
document.getElementById('jackpot-title').textContent = TEXT.jackpotTitle;
document.getElementById('jackpot-sub').textContent   = TEXT.jackpotSub;
document.getElementById('jackpot-btn').textContent   = TEXT.jackpotBtn;
document.getElementById('toll-text').textContent     = TEXT.tollText;
document.getElementById('nav-back').textContent      = TEXT.navBack;
document.getElementById('nav-fwd').textContent       = TEXT.navFwd;

/* ── Navigate with fade-out transition ───────────────────────────────────── */
function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(function() { window.location.href = url; }, 360);
}

/* ── Wire up navigation / action buttons ─────────────────────────────────── */
document.getElementById('jackpot-btn').addEventListener('click', function() { navigate('../game4/'); });
document.getElementById('nav-back').addEventListener('click',    function() { navigate('../game2/'); });
document.getElementById('nav-fwd').addEventListener('click',     function() { navigate('../game4/'); });

/* ── Merge segment data with colors from TEXT ────────────────────────────── */
const SEGMENTS = TEXT.segments.map(function(seg, i) {
  return { id: seg.id, label: seg.label, emoji: seg.emoji, color: TEXT.segColors[i] };
});

const N       = SEGMENTS.length;
const SEG_RAD = (2 * Math.PI) / N;   // radians per segment

/* ── Bag-based odds system ───────────────────────────────────────────────── */
/* Each non-jackpot effect fires exactly once per cycle, then jackpot fires.
   This guarantees the player always eventually hits jackpot. */
const JACKPOT_IDX     = SEGMENTS.findIndex(function(s) { return s.id === 'jackpot'; });
const NON_JACKPOT_IDX = SEGMENTS.map(function(_, i) { return i; }).filter(function(i) { return i !== JACKPOT_IDX; });

let spinBag       = [];
let nextIsJackpot = false;

/* Shuffle an array in-place (Fisher-Yates) and return it */
function bagShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Fill the bag with all non-jackpot indices in random order */
function refillBag() {
  spinBag       = bagShuffle(NON_JACKPOT_IDX);
  nextIsJackpot = true;   // jackpot follows after this full set of non-jackpots
}

/* Return the segment index that the wheel should land on next */
function getNextTarget() {
  if (spinBag.length === 0 && nextIsJackpot) {
    nextIsJackpot = false;
    refillBag();           // prepare the next round
    return JACKPOT_IDX;
  }
  if (spinBag.length === 0) refillBag();
  return spinBag.pop();
}

refillBag();   // prime the first round

/* ── Wheel canvas setup ──────────────────────────────────────────────────── */
const W  = 500;
const CX = W / 2;
const CY = W / 2;
const R  = W / 2 - 20;   // radius (slightly inset for border visibility)

const wCanvas  = document.getElementById('wheel');
const wCtx     = wCanvas.getContext('2d');
let   angle    = 0;       // current wheel rotation (radians)
let   spinning = false;

/**
 * drawWheel(a)
 * Clears and redraws the entire wheel at rotation angle `a`.
 * Renders each segment with its colour, emoji near the rim,
 * label near the centre, an outer ring, and a centre hub.
 */
function drawWheel(a) {
  wCtx.clearRect(0, 0, W, W);

  SEGMENTS.forEach(function(seg, i) {
    const startAngle = a + i * SEG_RAD - Math.PI / 2;
    const endAngle   = startAngle + SEG_RAD;
    const midAngle   = startAngle + SEG_RAD / 2;

    /* Segment wedge */
    wCtx.beginPath();
    wCtx.moveTo(CX, CY);
    wCtx.arc(CX, CY, R, startAngle, endAngle);
    wCtx.closePath();
    wCtx.fillStyle   = seg.color;
    wCtx.fill();
    wCtx.strokeStyle = 'rgba(255,255,255,.1)';
    wCtx.lineWidth   = 1.5;
    wCtx.stroke();

    /* Emoji near the rim */
    wCtx.save();
    wCtx.translate(CX, CY);
    wCtx.rotate(midAngle);
    wCtx.font         = (W * 0.075) + 'px sans-serif';
    wCtx.textAlign    = 'center';
    wCtx.textBaseline = 'middle';
    wCtx.fillText(seg.emoji, R * 0.7, 0);
    wCtx.restore();

    /* Text label closer to centre */
    wCtx.save();
    wCtx.translate(CX, CY);
    wCtx.rotate(midAngle);
    wCtx.font         = 'bold ' + (W * 0.034) + 'px \'Segoe UI\', sans-serif';
    wCtx.fillStyle    = 'rgba(255,255,255,.82)';
    wCtx.textAlign    = 'center';
    wCtx.textBaseline = 'middle';
    wCtx.fillText(seg.label, R * 0.37, 0);
    wCtx.restore();
  });

  /* Outer decorative ring */
  wCtx.beginPath();
  wCtx.arc(CX, CY, R, 0, 2 * Math.PI);
  wCtx.strokeStyle = 'rgba(255,105,180,.55)';
  wCtx.lineWidth   = 5;
  wCtx.stroke();

  /* Centre hub with radial gradient */
  const hub = wCtx.createRadialGradient(CX, CY, 0, CX, CY, 34);
  hub.addColorStop(0, '#3c001e');
  hub.addColorStop(1, '#1a0008');
  wCtx.beginPath();
  wCtx.arc(CX, CY, 34, 0, 2 * Math.PI);
  wCtx.fillStyle   = hub;
  wCtx.fill();
  wCtx.strokeStyle = 'rgba(255,105,180,.7)';
  wCtx.lineWidth   = 2.5;
  wCtx.stroke();

  /* Sparkle icon in hub */
  wCtx.font         = (W * 0.046) + 'px sans-serif';
  wCtx.textAlign    = 'center';
  wCtx.textBaseline = 'middle';
  wCtx.fillText('✨', CX, CY);
}

/* Initial draw */
drawWheel(0);

/* ── Spin animation ──────────────────────────────────────────────────────── */
const DURATION = 4400;   // total spin duration in ms

/* Easing function: starts fast, decelerates smoothly to a stop */
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

/**
 * startSpin()
 * Calculates the required rotation delta to land on the target segment,
 * adds full laps for drama, then animates with easeOutQuart.
 */
function startSpin() {
  if (spinning) return;
  spinning = true;
  document.getElementById('spin-btn').disabled = true;

  const target     = getNextTarget();
  const laps       = 5 + Math.floor(Math.random() * 4);   // 5-8 full rotations
  const base       = ((-(target + 0.5) * SEG_RAD - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const delta      = laps * 2 * Math.PI + base;
  const startAngle = angle;
  const startTime  = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - startTime) / DURATION);
    angle = startAngle + easeOutQuart(t) * delta;
    drawWheel(angle);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      /* Animation complete — land on segment */
      angle = startAngle + delta;
      drawWheel(angle);
      spinning = false;
      onLand(target);
    }
  }

  requestAnimationFrame(tick);
}

/* ── Land handler: trigger the correct effect ─────────────────────────────── */
function onLand(idx) {
  const seg = SEGMENTS[idx];

  /* Small delay before triggering effect so wheel is visibly stopped */
  setTimeout(function() {
    stopEffects();           // clear any previous effect first
    triggerEffect(seg.id);

    /* Re-enable spin button for non-jackpot outcomes */
    if (seg.id !== 'jackpot') {
      setTimeout(function() {
        document.getElementById('spin-btn').disabled = false;
      }, 800);
    }
  }, 300);

  /* Show jackpot screen after a slightly longer delay */
  if (seg.id === 'jackpot') {
    setTimeout(function() {
      document.getElementById('jackpot-screen').classList.add('visible');
    }, 650);
  }
}

/* Attach click listener to spin button */
document.getElementById('spin-btn').addEventListener('click', startSpin);

/* ── Particle system (for confetti / non-explosion effects) ──────────────── */
const fxCanvas = document.getElementById('fx-canvas');
const fxCtx    = fxCanvas.getContext('2d');
let   fxParts  = [];
let   fxActive = false;

/* Resize the fx canvas to fill the viewport */
function resizeFx() {
  fxCanvas.width  = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
resizeFx();
window.addEventListener('resize', resizeFx);

/**
 * Particle class for the general fx system (confetti, gold, etc.)
 * Each particle has position, velocity, gravity, radius, and alpha decay.
 */
class Particle {
  constructor(x, y, color, opts) {
    opts = opts || {};
    this.x     = x;
    this.y     = y;
    this.color = color;
    this.vx    = (Math.random() - 0.5) * (opts.speed  || 10);
    this.vy    = (Math.random() - 0.5) * (opts.speed  || 10) + (opts.vy0 || 0);
    this.r     = (opts.minR || 3) + Math.random() * (opts.rRange || 4);
    this.alpha = 1;
    this.g     = opts.gravity !== undefined ? opts.gravity : 0.22;
    this.decay = 0.012 + Math.random() * 0.01;
  }
  step() {
    this.x    += this.vx;
    this.vy   += this.g;
    this.y    += this.vy;
    this.vx   *= 0.97;
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

/* Run the fx particle loop until all particles have faded */
function fxLoop() {
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  fxParts = fxParts.filter(function(p) { return p.alpha > 0; });
  fxParts.forEach(function(p) { p.step(); p.draw(fxCtx); });
  if (fxParts.length) requestAnimationFrame(fxLoop);
  else fxActive = false;
}

/* Start the fx loop if it isn't already running */
function kickFx() {
  if (!fxActive) { fxActive = true; fxLoop(); }
}

/* ── Effect management ───────────────────────────────────────────────────── */
const flyBox = document.getElementById('fx-flying');
let effectTimers = [];
let rainbowTimer = null;
let stinkOverlay = null;   // reference to the active Jessi Stinkt DOM overlay
let fwRunning    = false;  // flag that controls the fireworks animation loop

/**
 * stopEffects()
 * Clears all running effect timers and resets all visual effect layers.
 * Called before triggering a new effect after the wheel lands.
 */
function stopEffects() {
  effectTimers.forEach(clearTimeout);
  effectTimers = [];

  if (rainbowTimer) { clearTimeout(rainbowTimer); rainbowTimer = null; }
  document.body.classList.remove('rainbow-mode');
  document.getElementById('toll-overlay').classList.remove('visible');

  flyBox.innerHTML = '';
  document.querySelectorAll('.lasagne-el').forEach(function(el) { el.remove(); });

  /* Clear explosion canvas */
  const exC   = document.getElementById('explosion-canvas');
  exC.style.display = 'none';
  exC.getContext('2d').clearRect(0, 0, exC.width, exC.height);

  /* Clear flash overlay */
  document.getElementById('explosion-flash').style.opacity = '0';

  /* Stop fireworks animation loop */
  fwRunning = false;

  /* Remove Jessi Stinkt overlay if still visible */
  if (stinkOverlay && stinkOverlay.parentNode) { stinkOverlay.remove(); stinkOverlay = null; }

  fxParts = [];
}

/* Dispatch to the correct effect function by segment id */
function triggerEffect(id) {
  const map = {
    jackpot:   fx_jackpot,
    plus:      fx_money,
    rainbow:   fx_rainbow,
    capybara:  fx_capybara,
    cats:      fx_cats,
    explosion: fx_explosion,
    lasagne:   fx_lasagne,
    toll:        fx_toll,
    jessistinkt: fx_jessistinkt,
    feuerwerk:   fx_feuerwerk,
  };
  (map[id] || function() {})();
}

/* ── Effect: Jackpot – gold confetti burst ───────────────────────────────── */
function fx_jackpot() {
  const cols = ['#ffd700', '#ffec6e', '#ff69b4', '#e91e8c', '#fff', '#ff9de2'];
  for (let i = 0; i < 90; i++) {
    fxParts.push(new Particle(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight * 0.4,
      cols[i % cols.length],
      { speed: 7, vy0: -3, gravity: 0.18, minR: 4, rRange: 5 }
    ));
  }
  kickFx();
}

/* ── Effect: +100€ – money rain (falling DOM elements) ───────────────────── */
function fx_money() {
  const syms = ['💰', '💵', '💴', '🪙', '💸'];
  for (let i = 0; i < 28; i++) {
    effectTimers.push(setTimeout(function() {
      const el = document.createElement('div');
      el.className = 'fall-el';
      el.textContent = syms[Math.floor(Math.random() * syms.length)];
      el.style.cssText =
        'left:' + (Math.random() * 92) + 'vw;' +
        'top:-60px;' +
        'font-size:' + (1.4 + Math.random() * 1.6) + 'rem;' +
        '--dur:' + (2 + Math.random() * 1.4) + 's';
      flyBox.appendChild(el);
      effectTimers.push(setTimeout(function() { el.remove(); }, 4000));
    }, i * 70));
  }
}

/* ── Effect: Rainbow – cycles background colour for 10 seconds ───────────── */
function fx_rainbow() {
  document.body.classList.remove('rainbow-mode');
  void document.body.offsetWidth;   // force reflow to restart animation
  document.body.classList.add('rainbow-mode');
  rainbowTimer = setTimeout(function() {
    document.body.classList.remove('rainbow-mode');
  }, 10200);
}

/* ── Effect: Capybara rain – capybaras falling from above ────────────────── */
function fx_capybara() {
  for (let i = 0; i < 22; i++) {
    effectTimers.push(setTimeout(function() {
      const el = document.createElement('div');
      el.className   = 'fall-el';
      el.textContent = '🦫';
      el.style.cssText =
        'left:' + (Math.random() * 92) + 'vw;' +
        'top:-70px;' +
        'font-size:' + (2 + Math.random() * 2) + 'rem;' +
        '--dur:' + (2.2 + Math.random() * 1.6) + 's';
      flyBox.appendChild(el);
      effectTimers.push(setTimeout(function() { el.remove(); }, 5000));
    }, i * 90));
  }
}

/* ── Effect: Cat rain – cats falling from above ──────────────────────────── */
function fx_cats() {
  for (let i = 0; i < 22; i++) {
    effectTimers.push(setTimeout(function() {
      const el = document.createElement('div');
      el.className   = 'fall-el';
      el.textContent = '🐱';
      el.style.cssText =
        'left:' + (Math.random() * 92) + 'vw;' +
        'top:-70px;' +
        'font-size:' + (1.8 + Math.random() * 2.2) + 'rem;' +
        '--dur:' + (2 + Math.random() * 1.6) + 's';
      flyBox.appendChild(el);
      effectTimers.push(setTimeout(function() { el.remove(); }, 5000));
    }, i * 90));
  }
}

/* ── Effect: EXPLOSION – massive canvas particle burst ───────────────────── */
/**
 * fx_explosion()
 *
 * Triggers a dramatic full-screen explosion effect:
 *   1. Synthesised boom sound via Web Audio API
 *   2. 80 ms white screen flash
 *   3. 400 central particles burst in all directions
 *   4. 6 secondary bursts scattered across the screen (100 particles each)
 *   5. Expanding shockwave ring that fades out
 * All drawn on the dedicated #explosion-canvas.
 */
function fx_explosion() {
  /* — Synthesised boom sound via Web Audio API — */
  try {
    const ac  = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.exp(-i / (ac.sampleRate * 0.18));
      data[i]   = (Math.random() * 2 - 1) * env;
    }
    const src  = ac.createBufferSource();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.42, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
    src.buffer = buf;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch (e) { /* Audio not available — silently skip */ }

  /* — White screen flash — */
  const flashEl = document.getElementById('explosion-flash');
  flashEl.style.opacity = '1';
  setTimeout(function() { flashEl.style.opacity = '0'; }, 80);

  /* — Explosion canvas setup — */
  const exC   = document.getElementById('explosion-canvas');
  exC.width   = window.innerWidth;
  exC.height  = window.innerHeight;
  exC.style.display = 'block';
  const exCtx = exC.getContext('2d');

  const cx   = window.innerWidth  / 2;
  const cy   = window.innerHeight / 2;
  const COLS = ['#ff4400','#ff8800','#ffdd00','#ff2200','#ffffff','#ff6600','#ffaa00','#ffff00','#ff0000'];

  let exParts = [];

  /* Helper: create a burst of particles from a point */
  function addBurst(bx, by, count, minSpd, maxSpd, minR, maxR) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = minSpd + Math.random() * (maxSpd - minSpd);
      exParts.push({
        x: bx, y: by,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r:  minR + Math.random() * (maxR - minR),
        color: COLS[Math.floor(Math.random() * COLS.length)],
        alpha: 1,
        g: 0.12,
        decay: 0.010 + Math.random() * 0.008,   // slower decay = 3s lifetime
      });
    }
  }

  /* Central burst: 400 particles */
  addBurst(cx, cy, 400, 8, 24, 4, 14);

  /* 6 secondary bursts scattered within 300 px radius of centre */
  for (let b = 0; b < 6; b++) {
    effectTimers.push(setTimeout(function() {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 60 + Math.random() * 300;
      const bx    = cx + Math.cos(angle) * dist;
      const by    = cy + Math.sin(angle) * dist;
      addBurst(bx, by, 100, 4, 16, 3, 10);
    }, b * 120 + 50));
  }

  /* — Shockwave ring state — */
  let shockRadius  = 0;
  let shockAlpha   = 1;
  let exRunning    = true;
  const shockSpeed = 8;   // px per frame

  /* — Explosion animation loop — */
  function exLoop() {
    if (!exRunning) return;
    exCtx.clearRect(0, 0, exC.width, exC.height);

    /* Draw shockwave ring */
    if (shockAlpha > 0) {
      shockRadius += shockSpeed;
      shockAlpha  -= 0.012;
      exCtx.save();
      exCtx.strokeStyle = 'rgba(255,200,100,' + Math.max(0, shockAlpha).toFixed(3) + ')';
      exCtx.lineWidth   = 6;
      exCtx.beginPath();
      exCtx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
      exCtx.stroke();
      exCtx.restore();
    }

    /* Draw and step all particles */
    exParts = exParts.filter(function(p) { return p.alpha > 0; });
    exParts.forEach(function(p) {
      p.x   += p.vx;
      p.vy  += p.g;
      p.y   += p.vy;
      p.vx  *= 0.97;
      p.alpha -= p.decay;

      exCtx.save();
      exCtx.globalAlpha = Math.max(0, p.alpha);
      exCtx.fillStyle   = p.color;
      exCtx.beginPath();
      exCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      exCtx.fill();
      exCtx.restore();
    });

    /* Stop when all particles are gone */
    if (exParts.length > 0 || shockAlpha > 0) {
      requestAnimationFrame(exLoop);
    } else {
      exC.style.display = 'none';
      exRunning = false;
    }
  }

  exLoop();

  /* Hard stop after 3 seconds regardless */
  effectTimers.push(setTimeout(function() {
    exRunning = false;
    exC.style.display = 'none';
  }, 3000));
}

/* ── Effect: Lasagne – scattered lasagne emojis for 10 seconds ───────────── */
function fx_lasagne() {
  const positions = [
    { top: '10%',  left:  '5%'  },
    { top: '15%',  right: '8%'  },
    { top: '40%',  left:  '2%'  },
    { top: '45%',  right: '3%'  },
    { top: '70%',  left:  '6%'  },
    { top: '72%',  right: '6%'  },
    { top: '5%',   left:  '40%' },
    { top: '80%',  left:  '38%' },
    { top: '25%',  left:  '20%' },
    { top: '25%',  right: '18%' },
    { top: '60%',  left:  '22%' },
    { top: '58%',  right: '20%' },
  ];

  positions.forEach(function(pos, i) {
    effectTimers.push(setTimeout(function() {
      const el = document.createElement('div');
      el.className = 'lasagne-el';

      /* Build inline style from position object */
      let css = '';
      Object.entries(pos).forEach(function([k, v]) { css += k + ':' + v + ';'; });
      el.style.cssText = css;
      el.textContent   = '🍝';
      document.body.appendChild(el);

      /* Fade out and remove after 10 seconds */
      effectTimers.push(setTimeout(function() {
        el.style.transition = 'opacity 0.5s';
        el.style.opacity    = '0';
        setTimeout(function() { el.remove(); }, 600);
      }, 10000));
    }, i * 60));
  });
}

/* ── Effect: Du bist toll! – big pulsing text overlay ────────────────────── */
/* The overlay stays visible until the next spin result clears it. */
function fx_toll() {
  document.getElementById('toll-overlay').classList.add('visible');
}

/* ── Effect: Jessi Stinkt – toxic green takeover ─────────────────────────── */
/*
 * Unique combo effect: synthesised pfft sound, full-screen green overlay with
 * pulsing "JESSI STINKT!" text, falling 💩💨 emojis, and a green particle cloud.
 * Persists for 10 s or until the next spin clears it via stopEffects().
 */
function fx_jessistinkt() {
  /* — Synthesised pfft sound via Web Audio API — */
  try {
    const ac  = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.8, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const ramp = Math.min(1, i / (ac.sampleRate * 0.04));   // short attack
      const env  = Math.exp(-i / (ac.sampleRate * 0.12));
      /* Low-pitched noise modulated by a 80 Hz sine for that classic pfft */
      d[i] = (Math.random() * 2 - 1) * env * ramp *
             Math.sin(2 * Math.PI * 80 * i / ac.sampleRate);
    }
    const src  = ac.createBufferSource();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.39, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
    src.buffer = buf;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch(e) {}

  /* — Build full-screen stink overlay — */
  stinkOverlay = document.createElement('div');
  stinkOverlay.id = 'stink-effect-overlay';

  const txt = document.createElement('div');
  txt.className   = 'stink-text';
  txt.textContent = TEXT.jessistinktText;

  const sub = document.createElement('div');
  sub.className   = 'stink-sub';
  sub.textContent = TEXT.jessistinktSub;

  stinkOverlay.appendChild(txt);
  stinkOverlay.appendChild(sub);
  document.body.appendChild(stinkOverlay);

  /* — Falling stink emojis via flyBox — */
  const stinkEmojis = ['💩', '💨', '🤢', '🦨', '💩', '💨'];
  for (let i = 0; i < 30; i++) {
    effectTimers.push(setTimeout(function() {
      const el = document.createElement('div');
      el.className   = 'fall-el';
      el.textContent = stinkEmojis[Math.floor(Math.random() * stinkEmojis.length)];
      el.style.cssText =
        'left:' + (Math.random() * 92) + 'vw;' +
        'top:-70px;' +
        'font-size:' + (1.5 + Math.random() * 2) + 'rem;' +
        '--dur:' + (2 + Math.random() * 2) + 's';
      flyBox.appendChild(el);
      effectTimers.push(setTimeout(function() { el.remove(); }, 5000));
    }, i * 80));
  }

  /* — Toxic green particle cloud emanating from centre — */
  const cx    = window.innerWidth  / 2;
  const cy    = window.innerHeight / 2;
  const gCols = ['#00ff00','#7fff00','#adff2f','#00cc00','#66ff33'];
  for (let i = 0; i < 80; i++) {
    fxParts.push(new Particle(
      cx + (Math.random() - 0.5) * 200,
      cy + (Math.random() - 0.5) * 200,
      gCols[Math.floor(Math.random() * gCols.length)],
      { speed: 4, vy0: -1, gravity: 0.04, minR: 4, rRange: 8 }
    ));
  }
  kickFx();

  /* — Auto-fade the overlay after 10 s — */
  effectTimers.push(setTimeout(function() {
    if (stinkOverlay && stinkOverlay.parentNode) {
      stinkOverlay.style.transition = 'opacity 0.6s';
      stinkOverlay.style.opacity    = '0';
      effectTimers.push(setTimeout(function() {
        if (stinkOverlay && stinkOverlay.parentNode) { stinkOverlay.remove(); stinkOverlay = null; }
      }, 700));
    }
  }, 10000));
}

/* ── Effect: Feuerwerk – classic multi-rocket fireworks display ───────────── */
/*
 * Launches 8 colour-coded rockets staggered over ~3 seconds.
 * Each rocket travels upward, leaves a fading trail, then bursts into a
 * symmetric starburst of coloured sparks that fall with gravity.
 * Uses the shared explosion-canvas; controlled by the fwRunning flag.
 */
function fx_feuerwerk() {
  const exC   = document.getElementById('explosion-canvas');
  exC.width   = window.innerWidth;
  exC.height  = window.innerHeight;
  exC.style.display = 'block';
  const exCtx = exC.getContext('2d');
  fwRunning   = true;

  /* Colour palettes, one per rocket */
  const PALETTES = [
    ['#ff4444','#ff8888','#ffaaaa'],   // red
    ['#4488ff','#88aaff','#aaccff'],   // blue
    ['#ffd700','#ffe680','#fff0aa'],   // gold
    ['#44ff88','#88ffaa','#aaffcc'],   // green
    ['#ff44ff','#ff88ff','#ffaaff'],   // pink
    ['#44ffff','#88ffff','#aaffff'],   // cyan
    ['#ffffff','#ffeeaa','#ffcc66'],   // white/gold
    ['#cc44ff','#bb88ff','#aa44ff'],   // purple
  ];

  let rockets = [];
  let sparks  = [];

  /* Create one rocket targeting a random apex in the upper 40% of the screen */
  function launchRocket(palette) {
    const x      = window.innerWidth  * (0.1 + Math.random() * 0.8);
    const peakY  = window.innerHeight * (0.08 + Math.random() * 0.32);
    const frames = 50 + Math.random() * 30;   // travel time in frames
    rockets.push({
      x,
      y:       window.innerHeight,
      vx:      (Math.random() - 0.5) * 2,
      vy:      -(window.innerHeight - peakY) / frames,
      peakY,
      palette,
      trail:   [],
      done:    false,
    });
  }

  /* Explode a rocket into an even starburst of sparks */
  function explodeRocket(r) {
    const count = 65 + Math.floor(Math.random() * 25);
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
      const spd = 2.5 + Math.random() * 5;
      sparks.push({
        x: r.x, y: r.y,
        vx:    Math.cos(ang) * spd,
        vy:    Math.sin(ang) * spd,
        r:     1.5 + Math.random() * 2.5,
        color: r.palette[Math.floor(Math.random() * r.palette.length)],
        alpha: 1,
        decay: 0.009 + Math.random() * 0.009,
        g:     0.07,
      });
    }
  }

  /* Animation loop */
  function fwLoop() {
    if (!fwRunning) return;
    exCtx.clearRect(0, 0, exC.width, exC.height);

    /* Rockets */
    rockets.forEach(function(r) {
      if (r.done) return;

      /* Fading trail */
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 10) r.trail.shift();
      r.trail.forEach(function(pt, i) {
        exCtx.save();
        exCtx.globalAlpha = (i / r.trail.length) * 0.65;
        exCtx.fillStyle   = r.palette[0];
        exCtx.beginPath();
        exCtx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        exCtx.fill();
        exCtx.restore();
      });

      /* Rocket head */
      exCtx.save();
      exCtx.fillStyle = '#ffffff';
      exCtx.beginPath();
      exCtx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      exCtx.fill();
      exCtx.restore();

      r.x += r.vx;
      r.y += r.vy;

      /* Explode when apex is reached */
      if (r.y <= r.peakY) { r.done = true; explodeRocket(r); }
    });

    /* Sparks */
    sparks = sparks.filter(function(s) { return s.alpha > 0; });
    sparks.forEach(function(s) {
      exCtx.save();
      exCtx.globalAlpha = Math.max(0, s.alpha);
      exCtx.fillStyle   = s.color;
      exCtx.beginPath();
      exCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      exCtx.fill();
      exCtx.restore();

      s.x    += s.vx;
      s.vy   += s.g;
      s.y    += s.vy;
      s.vx   *= 0.97;
      s.alpha -= s.decay;
    });

    if (fwRunning) requestAnimationFrame(fwLoop);
  }

  fwLoop();

  /* Launch all 8 rockets staggered over 3 seconds */
  PALETTES.forEach(function(pal, i) {
    effectTimers.push(setTimeout(function() { launchRocket(pal); }, i * 380));
  });

  /* Stop after 7 seconds and hide the canvas */
  effectTimers.push(setTimeout(function() {
    fwRunning = false;
    exC.style.display = 'none';
  }, 7000));
}

/* ── Star background ─────────────────────────────────────────────────────── */
initPageStars('star-canvas');

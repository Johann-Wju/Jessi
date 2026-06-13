/* ═══════════════════════════════════════
   game5.js  ·  Cat Runner Game (Game 5)
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle:  'Katzen-Sprint – Jessi!',
  heading:    'Katzen-Sprint',
  subtitle:   'Leertaste oder Tippen zum Springen',
  scoreLabel: 'Punkte',
  tapHint:    'Leertaste · Klick · Touch → Springen',
  winText:    'Geschafft!',
  navBack:    '← Zurück',
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                    = TEXT.pageTitle;
document.querySelector('h1').textContent          = TEXT.heading;
document.querySelector('.subtitle').textContent   = TEXT.subtitle;
document.getElementById('lbl-score').textContent  = TEXT.scoreLabel;
document.getElementById('tap-hint').textContent   = TEXT.tapHint;
document.getElementById('nav-back').textContent   = TEXT.navBack;

/* ── Navigate with fade-out transition ───────────────────────────────────── */
function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(function() { window.location.href = url; }, 360);
}

/* ── Wire up navigation ──────────────────────────────────────────────────── */
document.getElementById('nav-back').addEventListener('click', function() { navigate('../game4/'); });

/* ── DOM references ──────────────────────────────────────────────────────── */
const canvas    = document.getElementById('gameCanvas');
const ctx       = canvas.getContext('2d');
const flash     = document.getElementById('hit-flash');
const progFill  = document.getElementById('progress-fill');
const scoreNum  = document.getElementById('score-num');
const tapHint   = document.getElementById('tap-hint');

/* ── Game constants ──────────────────────────────────────────────────────── */
const GND    = 295;    // Y coordinate of the ground surface
const GRAVITY = 0.62;  // downward acceleration per frame
const JFORCE  = -14.5; // initial upward velocity on jump
const CAT_X   = 110;   // cat horizontal position (fixed)
const CAT_W   = 62;    // cat hitbox width
const CAT_H   = 52;    // cat hitbox height
const WIN     = 15;    // score needed to win (obstacles cleared)

/* ── Game state ──────────────────────────────────────────────────────────── */
let catY      = GND - CAT_H;   // cat's current Y position
let catVY     = 0;              // cat's vertical velocity
let onGround  = true;
let score     = 0;
let speed     = 5;              // obstacle speed (increases with score)
let frame     = 0;              // frame counter
let obstacles = [];
let invFrames = 0;              // invincibility frames remaining after a hit
let started   = false;          // game doesn't run until first jump
let won       = false;

/* ── In-canvas starfield (drawn on the game canvas sky area) ─────────────── */
const stars = Array.from({ length: 120 }, function() {
  const phase = Math.random() * Math.PI * 2;
  return {
    x:     Math.random() * 860,
    y:     Math.random() * (GND * 0.85),
    r:     Math.random() * 1.4 + 0.3,
    phase: phase,
    style: 'rgba(255,255,255,' + (0.3 + 0.5 * Math.sin(phase)).toFixed(2) + ')',
  };
});

/* Road lane dash scroll offset */
let dashOff = 0;

/* ── Input handling ──────────────────────────────────────────────────────── */
function tryJump() {
  if (won) return;
  if (!started) {
    started = true;
    tapHint.style.opacity = '0';   // hide the hint once game starts
  }
  if (onGround) {
    catVY    = JFORCE;
    onGround = false;
  }
}

document.addEventListener('keydown', function(e) {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); tryJump(); }
});
canvas.addEventListener('click', tryJump);
canvas.addEventListener('touchstart', function(e) { e.preventDefault(); tryJump(); }, { passive: false });

/* ── Obstacle type definitions ───────────────────────────────────────────── */
const OBS_TYPES = [
  { w: 82,  h: 50, type: 'car',   color: '#c0336e' },
  { w: 82,  h: 50, type: 'car',   color: '#7733cc' },
  { w: 82,  h: 50, type: 'car',   color: '#1166cc' },
  { w: 108, h: 64, type: 'truck', color: '#996600' },
  { w: 108, h: 64, type: 'truck', color: '#226644' },
  { w: 54,  h: 38, type: 'bike',  color: '#aa2244' },
];

/* Spawn a new obstacle at the right edge */
function spawnObs() {
  const t = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
  obstacles.push({
    x:      880,
    y:      GND - t.h,
    w:      t.w,
    h:      t.h,
    type:   t.type,
    color:  t.color,
    scored: false,
  });
}

/* ── Drawing helpers ─────────────────────────────────────────────────────── */

/* Draw a filled rounded rectangle (shorthand) */
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/**
 * drawBackground()
 * Draws the sky gradient, twinkling stars, road surface,
 * glowing ground line, and scrolling lane dashes.
 */
function drawBackground() {
  /* Sky: dark gradient top to slightly lighter at horizon */
  const skyG = ctx.createLinearGradient(0, 0, 0, GND);
  skyG.addColorStop(0, '#0d0008');
  skyG.addColorStop(1, '#1c0018');
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, 860, GND);

  /* Stars: update brightness every 4 frames for performance */
  const updateBrightness = (frame % 4 === 0);
  stars.forEach(function(s) {
    if (updateBrightness) {
      s.phase += 0.025;
      s.style = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.sin(s.phase)).toFixed(2) + ')';
    }
    ctx.fillStyle = s.style;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  /* Road surface */
  ctx.fillStyle = '#120010';
  ctx.fillRect(0, GND, 860, 380 - GND);

  /* Glowing ground line */
  ctx.save();
  ctx.shadowColor = 'rgba(255,105,180,.9)';
  ctx.shadowBlur  = 10;
  ctx.strokeStyle = 'rgba(255,105,180,.7)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, GND);
  ctx.lineTo(860, GND);
  ctx.stroke();
  ctx.restore();

  /* Scrolling lane dashes */
  dashOff = (dashOff - speed * 1.5 + 3000) % 80;
  ctx.save();
  ctx.strokeStyle  = 'rgba(255,105,180,.18)';
  ctx.lineWidth    = 2;
  ctx.setLineDash([40, 40]);
  ctx.lineDashOffset = dashOff;
  ctx.beginPath();
  ctx.moveTo(0, GND + 22);
  ctx.lineTo(860, GND + 22);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Cat blink state ─────────────────────────────────────────────────────── */
let blinkTimer = 0;
let blinking   = false;

/**
 * drawCat(x, y)
 * Draws the player cat at the given canvas position.
 * Includes:
 *   - animated tail (sine wave swing)
 *   - body with squish/squeeze physics on jump
 *   - animated legs (alternate pairs while running)
 *   - head with ears, eyes (with blink), nose, mouth, whiskers
 *   - alpha flicker when invincible after a hit
 */
function drawCat(x, y) {
  /* Leg swing: alternate front/back pairs based on frame */
  const cycle  = Math.sin(frame * 0.28);
  const lp     = onGround ? cycle * 7 : 0;

  /* Squish/squeeze the cat body during jumps for a cartoonish feel */
  const squish  = onGround ? 1 : (catVY < 0 ? 1.10 : 0.92);
  const squeeze = onGround ? 1 : (catVY < 0 ? 0.90 : 1.08);

  /* Blink: open eyes most of the time, close briefly */
  blinkTimer++;
  if (!blinking && blinkTimer > 140) { blinking = true;  blinkTimer = 0; }
  if ( blinking && blinkTimer >   6) { blinking = false; blinkTimer = 0; }

  ctx.save();
  ctx.translate(x + CAT_W / 2, y + CAT_H / 2);
  ctx.scale(squeeze, squish);
  ctx.translate(-(CAT_W / 2), -(CAT_H / 2));

  /* Flicker alpha when invincible */
  const hitAlpha = invFrames > 0 ? (Math.sin(frame * 0.7) * 0.5 + 0.5) : 1;
  ctx.globalAlpha = hitAlpha;

  /* Tail — curves upward from the rear and swings side-to-side */
  ctx.save();
  ctx.strokeStyle = '#ff9de2';
  ctx.lineWidth   = 5;
  ctx.lineCap     = 'round';
  const tailSwing = Math.sin(frame * 0.18) * 12;
  ctx.beginPath();
  ctx.moveTo(6, 30);
  ctx.bezierCurveTo(-14, 22 + tailSwing * 0.3, -18, 4 + tailSwing, -8, -6 + tailSwing);
  ctx.stroke();
  ctx.restore();

  /* Back legs (left pair) */
  ctx.fillStyle = '#ffaad4';
  ctx.beginPath(); ctx.roundRect(5,  38, 12, 14 + lp, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(19, 38, 12, 14 - lp, 5); ctx.fill();

  /* Body */
  ctx.fillStyle = '#ffb3d9';
  ctx.beginPath(); ctx.roundRect(2, 18, 44, 26, 12); ctx.fill();

  /* Front legs (right pair — opposite phase to back legs) */
  ctx.fillStyle = '#ffaad4';
  ctx.beginPath(); ctx.roundRect(31, 38, 12, 14 - lp, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(45, 38, 12, 14 + lp, 5); ctx.fill();

  /* Head */
  ctx.fillStyle = '#ffb3d9';
  ctx.beginPath(); ctx.arc(46, 20, 18, 0, Math.PI * 2); ctx.fill();

  /* Ears (outer) */
  ctx.fillStyle = '#ffb3d9';
  ctx.beginPath(); ctx.moveTo(33, 10); ctx.lineTo(39, -4); ctx.lineTo(46, 8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(46, 8);  ctx.lineTo(54, -4); ctx.lineTo(60, 10); ctx.closePath(); ctx.fill();

  /* Ears (inner pink) */
  ctx.fillStyle = '#e91e8c';
  ctx.beginPath(); ctx.moveTo(36, 9); ctx.lineTo(40, 0); ctx.lineTo(45, 8);  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(47, 8); ctx.lineTo(53, 0); ctx.lineTo(58, 9);  ctx.closePath(); ctx.fill();

  /* Eyes: squash to a slit when blinking */
  const eyeH = blinking ? 0.5 : 4.5;
  ctx.fillStyle = '#0d0008';
  ctx.beginPath(); ctx.ellipse(40, 18, 3.5, eyeH, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(52, 18, 3.5, eyeH, 0, 0, Math.PI * 2); ctx.fill();

  /* Eye shine (only when open) */
  if (!blinking) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(41, 16, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(53, 16, 1.4, 0, Math.PI * 2); ctx.fill();
  }

  /* Nose */
  ctx.fillStyle = '#e91e8c';
  ctx.beginPath(); ctx.moveTo(44, 25); ctx.lineTo(48, 23); ctx.lineTo(48, 27); ctx.closePath(); ctx.fill();

  /* Mouth (two small curves) */
  ctx.strokeStyle = 'rgba(180,60,100,.8)';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  ctx.beginPath(); ctx.moveTo(46, 27); ctx.quadraticCurveTo(42, 31, 40, 29); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(46, 27); ctx.quadraticCurveTo(50, 31, 52, 29); ctx.stroke();

  /* Whiskers */
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(41, 25); ctx.lineTo(24, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(41, 27); ctx.lineTo(24, 29); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(51, 25); ctx.lineTo(68, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(51, 27); ctx.lineTo(68, 29); ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ── Obstacle drawing ────────────────────────────────────────────────────── */

/**
 * drawCar(ob)
 * Draws a small car obstacle with shadow, wheels, cabin, windows and lights.
 */
function drawCar(ob) {
  const { x, y, w, h, color } = ob;

  /* Drop shadow */
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, GND + 4, w * 0.45, 6, 0, 0, Math.PI * 2); ctx.fill();

  /* Wheels */
  const wr = 12;
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.arc(x + w * 0.21, GND, wr, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.79, GND, wr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.arc(x + w * 0.21, GND, wr * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.79, GND, wr * 0.45, 0, Math.PI * 2); ctx.fill();

  /* Lower body */
  ctx.fillStyle = color;
  rr(x, y + h * 0.45, w, h * 0.55, [0, 0, 6, 6]);

  /* Upper cabin */
  rr(x + w * 0.12, y, w * 0.76, h * 0.5, [8, 8, 2, 2]);

  /* Windows */
  ctx.fillStyle = 'rgba(160,220,255,.65)';
  rr(x + w * 0.15, y + h * 0.04, w * 0.30, h * 0.4, 4);
  rr(x + w * 0.52, y + h * 0.04, w * 0.29, h * 0.4, 4);

  /* Headlight */
  ctx.fillStyle = 'rgba(255,255,180,.9)';
  ctx.beginPath(); ctx.ellipse(x + 5, y + h * 0.68, 4, 5, 0, 0, Math.PI * 2); ctx.fill();

  /* Tail light */
  ctx.fillStyle = 'rgba(255,80,80,.8)';
  ctx.beginPath(); ctx.ellipse(x + w - 5, y + h * 0.68, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
}

/**
 * drawTruck(ob)
 * Draws a wider truck obstacle with cargo body, cab, three wheels, windows and lights.
 */
function drawTruck(ob) {
  const { x, y, w, h, color } = ob;

  /* Drop shadow */
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, GND + 5, w * 0.45, 7, 0, 0, Math.PI * 2); ctx.fill();

  /* Three wheels */
  const wr = 13;
  ctx.fillStyle = '#1a1030';
  [x + w * 0.18, x + w * 0.5, x + w * 0.82].forEach(function(cx) {
    ctx.beginPath(); ctx.arc(cx, GND, wr, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  [x + w * 0.18, x + w * 0.5, x + w * 0.82].forEach(function(cx) {
    ctx.beginPath(); ctx.arc(cx, GND, wr * 0.45, 0, Math.PI * 2); ctx.fill();
  });

  /* Cargo body */
  ctx.fillStyle = color;
  rr(x + w * 0.3, y, w * 0.7, h, [4, 4, 4, 4]);

  /* Cab */
  ctx.fillStyle = shadeColor(color, 20);
  rr(x, y + h * 0.25, w * 0.35, h * 0.75, [6, 0, 0, 6]);

  /* Cab window */
  ctx.fillStyle = 'rgba(160,220,255,.65)';
  rr(x + w * 0.03, y + h * 0.3, w * 0.27, h * 0.38, 4);

  /* Lights */
  ctx.fillStyle = 'rgba(255,255,180,.9)';
  ctx.beginPath(); ctx.ellipse(x + 5, y + h * 0.72, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,80,80,.8)';
  ctx.beginPath(); ctx.ellipse(x + w - 5, y + h * 0.72, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
}

/**
 * drawBike(ob)
 * Draws a small bike obstacle with wheels, frame, and a rider.
 */
function drawBike(ob) {
  const { x, y, w, h, color } = ob;

  /* Drop shadow */
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, GND + 3, w * 0.4, 5, 0, 0, Math.PI * 2); ctx.fill();

  /* Wheels */
  const wr = 11;
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.arc(x + w * 0.2, GND, wr, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.8, GND, wr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ctx.beginPath(); ctx.arc(x + w * 0.2, GND, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.8, GND, 5, 0, Math.PI * 2); ctx.fill();

  /* Frame */
  ctx.strokeStyle = color;
  ctx.lineWidth   = 4;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, GND - wr);
  ctx.lineTo(x + w * 0.5, y + h * 0.3);
  ctx.lineTo(x + w * 0.8, GND - wr);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.3);
  ctx.lineTo(x + w * 0.5, y);
  ctx.stroke();

  /* Rider head and body */
  ctx.fillStyle = shadeColor(color, 15);
  ctx.beginPath(); ctx.arc(x + w * 0.5, y - 5, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  rr(x + w * 0.35, y + h * 0.05, w * 0.3, h * 0.55, 6);
}

/**
 * shadeColor(hex, pct)
 * Returns a lighter version of a hex colour string by the given percentage.
 */
function shadeColor(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const f = pct / 100;
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * f));
  const g = Math.min(255, ((n >>  8) & 0xff) + Math.round(255 * f));
  const b = Math.min(255, ( n        & 0xff) + Math.round(255 * f));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/* Dispatch to the correct draw function by obstacle type */
function drawObstacle(ob) {
  if (ob.type === 'car')   drawCar(ob);
  if (ob.type === 'truck') drawTruck(ob);
  if (ob.type === 'bike')  drawBike(ob);
}

/* ── Score UI ────────────────────────────────────────────────────────────── */
function updateScoreUI() {
  const pct = Math.max(0, Math.min(100, (score / WIN) * 100));
  progFill.style.width    = pct + '%';
  scoreNum.textContent    = Math.max(0, score) + ' / ' + WIN;
}

/* ── Hit flash overlay ───────────────────────────────────────────────────── */
function triggerFlash() {
  flash.style.opacity = '1';
  setTimeout(function() { flash.style.opacity = '0'; }, 120);
  setTimeout(function() { flash.style.opacity = '1'; }, 200);
  setTimeout(function() { flash.style.opacity = '0'; }, 320);
}

/* ── Collision detection ─────────────────────────────────────────────────── */

/* Cat hitbox (inset slightly from the drawn sprite) */
function hitbox() {
  return { l: CAT_X + 14, r: CAT_X + 54, t: catY + 6, b: catY + CAT_H - 2 };
}

/* Obstacle hitbox (inset to be fair) */
function obsHitbox(ob) {
  return { l: ob.x + 6, r: ob.x + ob.w - 6, t: ob.y + 4, b: ob.y + ob.h };
}

/* AABB collision test */
function collides(a, b) {
  return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
}

/* ── Spawn timing ────────────────────────────────────────────────────────── */
let nextSpawn = 180;   // frame number for first obstacle spawn

/* ── Main game loop ──────────────────────────────────────────────────────── */
function tick() {
  if (won) return;

  frame++;

  /* Idle state: draw scene but don't update game logic until started */
  if (!started) {
    drawBackground();
    drawCat(CAT_X, catY);
    requestAnimationFrame(tick);
    return;
  }

  /* Physics: apply gravity and clamp to ground */
  catVY += GRAVITY;
  catY  += catVY;
  if (catY >= GND - CAT_H) {
    catY     = GND - CAT_H;
    catVY    = 0;
    onGround = true;
  }

  /* Move all obstacles leftward */
  for (const ob of obstacles) ob.x -= speed;

  /* Spawn a new obstacle when the frame counter reaches nextSpawn */
  if (frame >= nextSpawn) {
    spawnObs();
    /* Space obstacles further apart at higher speeds, closer as score grows */
    nextSpawn = frame + 110 + Math.floor(Math.random() * 80) - Math.floor(score * 1.5);
    nextSpawn = Math.max(nextSpawn, frame + 70);
  }

  /* Count down invincibility frames */
  if (invFrames > 0) invFrames--;

  /* Check scoring and collision for each obstacle */
  for (const ob of obstacles) {
    /* Score: obstacle cleared when it passes behind the cat */
    if (!ob.scored && ob.x + ob.w < CAT_X) {
      ob.scored = true;
      score++;
      speed = 5 + score * 0.18;   // increase speed gradually
      updateScoreUI();
      if (score >= WIN) { won = true; winGame(); return; }
    }

    /* Collision: only when not invincible */
    if (invFrames === 0 && collides(hitbox(), obsHitbox(ob))) {
      score     = Math.max(0, score - 1);   // lose a point
      invFrames = 80;                        // brief invincibility window
      speed     = 5 + score * 0.18;
      updateScoreUI();
      triggerFlash();
    }
  }

  /* Remove obstacles that have scrolled off the left edge */
  obstacles = obstacles.filter(function(ob) { return ob.x + ob.w > -20; });
  if (obstacles.length > 12) obstacles.splice(0, obstacles.length - 12);

  /* Draw everything */
  ctx.clearRect(0, 0, 860, 380);
  drawBackground();
  obstacles.forEach(drawObstacle);
  drawCat(CAT_X, catY);

  /* On-canvas score display (small, top-right) */
  ctx.font      = 'bold 15px Segoe UI';
  ctx.fillStyle = 'rgba(255,182,220,.5)';
  ctx.textAlign = 'right';
  ctx.fillText('Score: ' + Math.max(0, score), 848, 22);

  requestAnimationFrame(tick);
}

/* ── Win sequence ────────────────────────────────────────────────────────── */
function winGame() {
  /* Draw the final frame with a celebratory message */
  ctx.clearRect(0, 0, 860, 380);
  drawBackground();
  drawCat(CAT_X, catY);

  ctx.font        = 'bold 36px Segoe UI';
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.shadowColor = 'rgba(255,105,180,.9)';
  ctx.shadowBlur  = 20;
  ctx.fillText(TEXT.winText, 430, 160);
  ctx.shadowBlur  = 0;

  /* Navigate to the final screen after a short celebration pause */
  setTimeout(function() { navigate('../final/'); }, 1400);
}

/* ── Init ────────────────────────────────────────────────────────────────── */
updateScoreUI();
requestAnimationFrame(tick);
initPageStars('star-canvas');

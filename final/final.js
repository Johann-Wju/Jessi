/* ═══════════════════════════════════════
   final.js  ·  Final Congratulations Screen
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle: 'Herzlichen Glückwunsch, Jessi!',
  emojiRow:  '🎂 🐱 🎉 🌸 ✨',
  congrats:  'Herzlichen Glückwunsch',
  name:      'Jessi!',
  msgHint:   'Nachricht',
  starRow:   '★ ★ ★ ★ ★',

  // ══════════════════════════════════════════
  //  EDIT YOUR BIRTHDAY MESSAGE HERE:
  // ══════════════════════════════════════════
  message: `
Deine persönliche Geburtstagsnachricht kommt hier hin.
Einfach diesen Text ersetzen.
  `.trim(),
  // ══════════════════════════════════════════
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                   = TEXT.pageTitle;
document.getElementById('emoji-row').textContent = TEXT.emojiRow;
document.getElementById('congrats').textContent  = TEXT.congrats;
document.getElementById('name').textContent      = TEXT.name;
document.getElementById('msg-hint').textContent  = TEXT.msgHint;
document.getElementById('msg-text').textContent  = TEXT.message;
document.getElementById('star-row').textContent  = TEXT.starRow;

/* ── Canvas setup ────────────────────────────────────────────────────────── */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/* ── Particle colour palette ─────────────────────────────────────────────── */
const COLORS = [
  'rgba(255,105,180,A)', 'rgba(233,30,140,A)',  'rgba(255,182,220,A)',
  'rgba(255,255,255,A)', 'rgba(255,230,240,A)', 'rgba(255,140,200,A)',
  'rgba(200,80,180,A)',  'rgba(255,200,230,A)',
];

/* Replace the 'A' placeholder with the actual alpha value */
function mkColor(template, a) {
  return template.replace('A', a.toFixed(2));
}

/* ── Particle system ─────────────────────────────────────────────────────── */
/**
 * Particle class
 * Used for both the continuous confetti rain and burst fireworks.
 * Pass a burst object {x, y} for firework-style particles, or null for
 * the steady downward rain.
 */
class Particle {
  constructor(burst) {
    this.reset(burst);
  }

  reset(burst) {
    const cx     = burst ? burst.x : Math.random() * canvas.width;
    const cy     = burst ? burst.y : -10;
    const spread = burst ? 1 : 0;

    this.x  = cx + (Math.random() - 0.5) * 60 * spread;
    this.y  = cy + (Math.random() - 0.5) * 60 * spread;
    this.r  = Math.random() * 5 + 2;

    /* Burst particles scatter outward; rain particles drift down gently */
    this.vx = burst
      ? (Math.random() - 0.5) * 12
      : (Math.random() - 0.5) * 1.2;
    this.vy = burst
      ? (Math.random() - 0.5) * 12 - 4
      : Math.random() * 2.5 + 0.8;

    this.gravity = burst ? 0.18 : 0;
    this.life    = 1;
    this.decay   = burst
      ? Math.random() * 0.014 + 0.008
      : Math.random() * 0.004 + 0.002;

    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shape = Math.random() < 0.4 ? 'rect' : 'circle';
    this.rot   = Math.random() * Math.PI * 2;
    this.rotV  = (Math.random() - 0.5) * 0.2;
    this.w     = this.r * (1 + Math.random());
    this.h     = this.r * (0.5 + Math.random() * 0.5);
  }

  update() {
    this.x   += this.vx;
    this.y   += this.vy;
    this.vy  += this.gravity;
    this.vx  *= 0.99;
    this.rot += this.rotV;
    this.life -= this.decay;
  }

  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle   = mkColor(this.color, Math.max(0, this.life));
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }
}

/* Steady confetti rain: 90 particles pre-scattered across the viewport */
const particles = Array.from({ length: 90 }, function() {
  const p = new Particle(null);
  p.y = Math.random() * canvas.height;  // pre-scatter so screen isn't empty at load
  return p;
});

/* ── Firework bursts ─────────────────────────────────────────────────────── */

/* Create a burst of n particles at (x, y) */
function burst(x, y, n) {
  if (n === undefined) n = 60;
  for (let i = 0; i < n; i++) particles.push(new Particle({ x: x, y: y }));
}

/* Schedule periodic random firework bursts */
function scheduleFirework() {
  const x = 0.1 * canvas.width  + Math.random() * 0.8 * canvas.width;
  const y = 0.15 * canvas.height + Math.random() * 0.45 * canvas.height;
  burst(x, y, 80);
  setTimeout(scheduleFirework, 1200 + Math.random() * 1800);
}

/* Start two burst sequences at different offsets */
setTimeout(scheduleFirework, 600);
setTimeout(scheduleFirework, 1800);

/* ── Floating hearts ─────────────────────────────────────────────────────── */
const HEARTS = ['🩷', '💗', '💕', '🌸', '✨', '⭐', '🎀', '💖', '🌟'];

/**
 * Heart class
 * Floating emoji symbols that rise slowly from the bottom and fade out.
 */
class Heart {
  constructor() { this.reset(); }

  reset() {
    this.x     = Math.random() * canvas.width;
    this.y     = canvas.height + 30;
    this.size  = 14 + Math.random() * 20;
    this.vy    = -(Math.random() * 1.2 + 0.5);
    this.vx    = (Math.random() - 0.5) * 0.6;
    this.life  = 1;
    this.decay = 0.003 + Math.random() * 0.003;
    this.char  = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    this.rot   = (Math.random() - 0.5) * 0.3;
    this.rotV  = (Math.random() - 0.5) * 0.01;
  }

  update() {
    this.x   += this.vx;
    this.y   += this.vy;
    this.rot += this.rotV;
    this.life -= this.decay;
  }

  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life * 0.8);
    ctx.font        = this.size + 'px serif';
    ctx.textAlign   = 'center';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillText(this.char, 0, 0);
    ctx.restore();
  }
}

/* 18 hearts pre-scattered across the screen so it looks alive immediately */
const hearts = Array.from({ length: 18 }, function() {
  const h = new Heart();
  h.y = Math.random() * canvas.height;
  return h;
});

/* ── Background gradient pulse ───────────────────────────────────────────── */
let bgPhase = 0;

/* ── Main render loop ────────────────────────────────────────────────────── */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Subtle pulsing radial gradient background */
  bgPhase += 0.008;
  const pulse = 0.5 + 0.5 * Math.sin(bgPhase);
  const bg    = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  bg.addColorStop(0,   'rgba(60,0,40,'  + (0.18 + pulse * 0.08).toFixed(3) + ')');
  bg.addColorStop(0.5, 'rgba(30,0,20,'  + (0.12 + pulse * 0.05).toFixed(3) + ')');
  bg.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Update and draw confetti particles; recycle steady rain, remove burst ones */
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.life <= 0) {
      if (i < 90) {
        p.reset(null);             // recycle the 90 steady-rain particles
      } else {
        particles.splice(i, 1);   // discard expired burst particles
      }
    }
  }

  /* Update and draw floating hearts; reset when they fade out */
  hearts.forEach(function(h) {
    h.update();
    h.draw();
    if (h.life <= 0) h.reset();
  });

  requestAnimationFrame(loop);
}

loop();

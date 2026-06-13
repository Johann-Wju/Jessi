/* ═══════════════════════════════════════
   game4.js  ·  Maze Game (Game 4)
   ═══════════════════════════════════════ */

/* ── All user-facing strings — edit only here ───────────────────────────── */
const TEXT = {
  pageTitle: 'Labyrinth – Jessi!',
  heading:   'Labyrinth-Flucht',
  subtitle:  'Finde den Ausgang',
  controls:  'W A S D · Katze bewegen',
  winTitle:  'Ausgang gefunden!',
  winSub:    'Die Katze ist frei!',
  winBtn:    'Weiter →',
  navBack:   '← Zurück',
  navFwd:    'Weiter →',
};

/* ── Apply TEXT to DOM ───────────────────────────────────────────────────── */
document.title                                     = TEXT.pageTitle;
document.querySelector('h1').textContent           = TEXT.heading;
document.querySelector('.subtitle').textContent    = TEXT.subtitle;
document.querySelector('.controls').textContent    = TEXT.controls;
document.getElementById('win-title').textContent   = TEXT.winTitle;
document.getElementById('win-sub').textContent     = TEXT.winSub;
document.getElementById('btn-next').textContent    = TEXT.winBtn;
document.getElementById('nav-back').textContent    = TEXT.navBack;
document.getElementById('nav-fwd').textContent     = TEXT.navFwd;

/* ── Navigate with fade-out transition ───────────────────────────────────── */
function navigate(url) {
  document.body.style.transition = 'opacity .35s';
  document.body.style.opacity    = '0';
  setTimeout(function() { window.location.href = url; }, 360);
}

/* ── Wire up navigation buttons ─────────────────────────────────────────── */
document.getElementById('btn-next').addEventListener('click',  function() { navigate('../game5/'); });
document.getElementById('nav-back').addEventListener('click',  function() { navigate('../game3/'); });
document.getElementById('nav-fwd').addEventListener('click',   function() { navigate('../game5/'); });

/* ── Maze grid dimensions ────────────────────────────────────────────────── */
const COLS = 15;
const ROWS = 11;

/* Calculate cell size to fit the available viewport space */
const availW = Math.min(window.innerWidth  - 32, 680);
const availH = Math.min(window.innerHeight * 0.60, 500);
const CELL   = Math.min(44, Math.max(22, Math.floor(Math.min(availW / COLS, availH / ROWS))));
const W      = COLS * CELL;
const H      = ROWS * CELL;

/* ── Canvas setup ────────────────────────────────────────────────────────── */
const canvas     = document.getElementById('maze');
canvas.width     = W;
canvas.height    = H;
const ctx        = canvas.getContext('2d');

/* ── Maze cell data ──────────────────────────────────────────────────────── */
/* Each cell stores a walls array: [top, right, bottom, left] (true = wall present) */
let cells;

/**
 * buildMaze()
 *
 * Generates a perfect maze using iterative depth-first search
 * (recursive backtracking without actual recursion).
 * Every cell is reachable from every other cell (no isolated regions).
 */
function buildMaze() {
  /* Initialise all cells with all walls intact */
  cells = Array.from({ length: ROWS }, function() {
    return Array.from({ length: COLS }, function() {
      return { walls: [true, true, true, true], visited: false };
    });
  });

  /* Direction vectors: [top, right, bottom, left]
     w = wall index in current cell, ow = opposite wall in neighbour */
  const DIRS = [
    { dx:  0, dy: -1, w: 0, ow: 2 },  // top
    { dx:  1, dy:  0, w: 1, ow: 3 },  // right
    { dx:  0, dy:  1, w: 2, ow: 0 },  // bottom
    { dx: -1, dy:  0, w: 3, ow: 1 },  // left
  ];

  /* Start from top-left corner */
  const stack = [{ x: 0, y: 0 }];
  cells[0][0].visited = true;

  while (stack.length) {
    const { x, y } = stack[stack.length - 1];

    /* Find unvisited neighbours */
    const nbrs = DIRS
      .map(function(d) { return { nx: x + d.dx, ny: y + d.dy, w: d.w, ow: d.ow }; })
      .filter(function(n) {
        return n.nx >= 0 && n.nx < COLS && n.ny >= 0 && n.ny < ROWS && !cells[n.ny][n.nx].visited;
      });

    if (!nbrs.length) { stack.pop(); continue; }

    /* Pick a random unvisited neighbour and carve a passage */
    const { nx, ny, w, ow } = nbrs[Math.floor(Math.random() * nbrs.length)];
    cells[y][x].walls[w]    = false;  // remove wall from current cell
    cells[ny][nx].walls[ow] = false;  // remove matching wall from neighbour
    cells[ny][nx].visited   = true;
    stack.push({ x: nx, y: ny });
  }
}

/* ── Player state ────────────────────────────────────────────────────────── */
let player = { x: 0, y: 0 };   // grid position (column, row)
let won    = false;

/**
 * tryMove(dx, dy)
 * Attempts to move the player one cell in the given direction.
 * Checks the wall in that direction before allowing movement.
 * Detects win condition (reaching bottom-right corner).
 */
function tryMove(dx, dy) {
  if (won) return;

  /* Map movement direction to wall index */
  const wallIdx = dy === -1 ? 0 : dx === 1 ? 1 : dy === 1 ? 2 : 3;
  if (cells[player.y][player.x].walls[wallIdx]) return;  // wall blocks move

  player.x += dx;
  player.y += dy;

  /* Check win condition: player reaches exit at bottom-right */
  if (player.x === COLS - 1 && player.y === ROWS - 1) {
    won = true;
    setTimeout(function() {
      document.getElementById('win-screen').classList.add('visible');
    }, 450);
  }
}

/* ── Keyboard input (WASD + arrow keys) ─────────────────────────────────── */
document.addEventListener('keydown', function(e) {
  switch (e.key.toLowerCase()) {
    case 'w': case 'arrowup':    tryMove( 0, -1); e.preventDefault(); break;
    case 's': case 'arrowdown':  tryMove( 0,  1); e.preventDefault(); break;
    case 'a': case 'arrowleft':  tryMove(-1,  0); e.preventDefault(); break;
    case 'd': case 'arrowright': tryMove( 1,  0); e.preventDefault(); break;
  }
});

/* ── Touch / swipe input ─────────────────────────────────────────────────── */
let touchX = null, touchY = null;

canvas.addEventListener('touchstart', function(e) {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;

  /* Move in the dominant swipe direction */
  if (Math.abs(dx) > Math.abs(dy)) {
    dx > 0 ? tryMove(1, 0) : tryMove(-1, 0);
  } else {
    dy > 0 ? tryMove(0, 1) : tryMove(0, -1);
  }

  touchX = touchY = null;
  e.preventDefault();
}, { passive: false });

/* ── Rendering ───────────────────────────────────────────────────────────── */
let exitPulse = 0;   // animated value (0–1) for exit glow intensity

/**
 * draw()
 * Renders the maze each frame:
 *   1. Dark background + subtle floor tiles
 *   2. Pulsing glow at the exit (bottom-right)
 *   3. Soft glow at the start (top-left)
 *   4. All walls (top + left per cell, plus border edges)
 *   5. Exit marker (✨) and player cat (🐱)
 */
function draw() {
  ctx.clearRect(0, 0, W, H);

  /* Dark background fill */
  ctx.fillStyle = '#0d0008';
  ctx.fillRect(0, 0, W, H);

  /* Subtle floor tile tint */
  ctx.fillStyle = 'rgba(255,105,180,0.025)';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    }
  }

  /* Exit pulsing radial glow (bottom-right cell centre) */
  const ex  = (COLS - 0.5) * CELL;
  const ey  = (ROWS - 0.5) * CELL;
  const gr  = CELL * (1.4 + exitPulse * 0.5);
  const grd = ctx.createRadialGradient(ex, ey, 0, ex, ey, gr);
  grd.addColorStop(0, 'rgba(233,30,140,' + (0.28 + exitPulse * 0.18).toFixed(3) + ')');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(ex - gr, ey - gr, gr * 2, gr * 2);

  /* Start soft glow (top-left cell) */
  const startGrd = ctx.createRadialGradient(CELL * 0.5, CELL * 0.5, 0, CELL * 0.5, CELL * 0.5, CELL);
  startGrd.addColorStop(0, 'rgba(255,182,220,0.1)');
  startGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = startGrd;
  ctx.fillRect(0, 0, CELL * 2, CELL * 2);

  /* Walls: draw top and left wall per cell, plus right/bottom border edges */
  ctx.strokeStyle = 'rgba(255,105,180,0.88)';
  ctx.lineWidth   = CELL > 32 ? 2.5 : 1.8;
  ctx.shadowColor = 'rgba(255,105,180,0.55)';
  ctx.shadowBlur  = CELL > 32 ? 6 : 4;
  ctx.lineCap     = 'square';

  ctx.beginPath();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const { walls } = cells[y][x];
      const px = x * CELL;
      const py = y * CELL;

      if (walls[0]) { ctx.moveTo(px, py);         ctx.lineTo(px + CELL, py);         }  // top
      if (walls[3]) { ctx.moveTo(px, py);         ctx.lineTo(px, py + CELL);         }  // left
      /* Right border for rightmost column */
      if (x === COLS - 1 && walls[1]) { ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); }
      /* Bottom border for bottom row */
      if (y === ROWS - 1 && walls[2]) { ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); }
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  /* Exit marker emoji */
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = Math.round(CELL * 0.70) + 'px sans-serif';
  ctx.fillText('✨', ex, ey);

  /* Player cat with pink glow */
  ctx.shadowColor = 'rgba(255,105,180,0.75)';
  ctx.shadowBlur  = CELL > 32 ? 16 : 10;
  ctx.font        = Math.round(CELL * 0.76) + 'px sans-serif';
  ctx.fillText('🐱', (player.x + 0.5) * CELL, (player.y + 0.5) * CELL);
  ctx.shadowBlur  = 0;
}

/* ── Animation loop ──────────────────────────────────────────────────────── */
function loop(ts) {
  /* exitPulse oscillates 0→1→0 at ~0.7 Hz for the exit glow animation */
  exitPulse = Math.sin(ts / 700) * 0.5 + 0.5;
  draw();
  requestAnimationFrame(loop);
}

/* ── Init ────────────────────────────────────────────────────────────────── */
buildMaze();
requestAnimationFrame(loop);
initPageStars('star-canvas');

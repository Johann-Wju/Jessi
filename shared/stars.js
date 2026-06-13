/* ═══════════════════════════════════════
   stars.js  ·  Shared page-background star animation utility
   ═══════════════════════════════════════ */

/**
 * initPageStars(canvasId, count)
 *
 * Attaches a drifting, twinkling star-field animation to the canvas element
 * with the given id.  Stars drift slowly to the right, wrap around when they
 * leave the viewport, and twinkle via a sine-phase opacity.
 * Brightness is only recalculated every 4 frames for performance.
 *
 * @param {string} canvasId  - id of the <canvas> element
 * @param {number} [count]   - number of stars to render (default: 180)
 */
function initPageStars(canvasId, count) {
  if (count === undefined) count = 180;

  const sc  = document.getElementById(canvasId);
  if (!sc) return;
  const sct = sc.getContext('2d');

  /* Create star objects with randomised position, size, speed and phase */
  const stars = Array.from({ length: count }, function() {
    const phase = Math.random() * Math.PI * 2;
    return {
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.3 + 0.2,
      speed: Math.random() * 0.06 + 0.01,
      phase: phase,
      /* Pre-compute style string to avoid repeated string allocation */
      style: 'rgba(255,255,255,' + (0.35 + 0.55 * Math.sin(phase)).toFixed(2) + ')',
    };
  });

  /* Resize canvas to fill the viewport */
  function resize() {
    sc.width  = window.innerWidth;
    sc.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let frameCount = 0;

  /* Animation loop */
  function loop() {
    sct.clearRect(0, 0, sc.width, sc.height);

    /* Only update twinkle brightness every 4 frames for performance */
    const updateBrightness = (++frameCount % 4 === 0);

    stars.forEach(function(s) {
      /* Drift right, wrap to left edge on exit */
      s.x += s.speed;
      if (s.x > sc.width) {
        s.x = 0;
        s.y = Math.random() * sc.height;
      }

      /* Update twinkle style when due */
      if (updateBrightness) {
        s.phase += 0.018;
        s.style = 'rgba(255,255,255,' + (0.35 + 0.55 * Math.sin(s.phase)).toFixed(2) + ')';
      }

      /* Draw star as a filled circle */
      sct.fillStyle = s.style;
      sct.beginPath();
      sct.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sct.fill();
    });

    requestAnimationFrame(loop);
  }

  loop();
}

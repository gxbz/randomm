const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

let W, H;
let mouse      = { x: -999, y: -999 };
let bgStars    = [];
let trailStars = [];
let bundles    = [];

const BG_COUNT      = 80;
const BUNDLE_RADIUS = 75;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/* ── Sparkle draw helper ── */
function drawSparkle(x, y, size, alpha) {
  if (size <= 1.5) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.round(x - 0.5), Math.round(y - 0.5), 1, 1);
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  // glow
  const glowR = size * 3.5;
  const glow  = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
  glow.addColorStop(0,   'rgba(255,255,255,0.25)');
  glow.addColorStop(0.4, 'rgba(255,255,255,0.07)');
  glow.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // cross spikes
  const arm = size * 2.2;
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth   = size < 3 ? 0.8 : 1.1;
  ctx.lineCap     = 'round';
  ctx.beginPath(); ctx.moveTo(-arm, 0); ctx.lineTo(arm, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -arm); ctx.lineTo(0, arm); ctx.stroke();

  // center dot
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fill();

  ctx.restore();
}

/* ── Background star factory ── */
function makeBgStar(fromTop = true) {
  const tier = Math.random();
  const size = tier < 0.55 ? 1
             : tier < 0.80 ? 2.5
             : tier < 0.94 ? 4.5
             : 7;
  return {
    x:            Math.random() * W,
    y:            fromTop ? -20 - Math.random() * 60 : Math.random() * H,
    size,
    speed:        0.25 + Math.random() * 0.6,
    vx:           (Math.random() - 0.5) * 0.15,
    twinkle:      Math.random() * Math.PI * 2,
    twinkleSpeed: 0.02 + Math.random() * 0.05,
    bundling:     false,
    bundleTarget: null,
    opacity:      1
  };
}

for (let i = 0; i < BG_COUNT; i++) bgStars.push(makeBgStar(false));

/* ── Trail star factory ── */
function makeTrailStar(x, y) {
  const size = 1 + Math.random() * 4.5;
  return {
    x,
    y,
    size,
    vx:           (Math.random() - 0.5) * 0.6,
    vy:           (Math.random() - 0.5) * 0.6 + 0.3,
    life:         1,
    decay:        0.008 + Math.random() * 0.012,
    twinkle:      Math.random() * Math.PI * 2,
    twinkleSpeed: 0.04 + Math.random() * 0.06,
    bundling:     false,
    bundleTarget: null
  };
}

/* ── Bundle factory ── */
function makeBundle(x, y) {
  return { x, y, particles: [], life: 1, born: performance.now() };
}

/* ── Mouse tracking ── */
let spawnTimer = 0;
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* ── Click: bundle nearby stars ── */
document.addEventListener('click', e => {
  if (e.target.closest('nav')) return;

  const cx = e.clientX, cy = e.clientY;

  // ripple element
  const rip = document.createElement('div');
  rip.className     = 'ripple';
  rip.style.cssText = `left:${cx}px;top:${cy}px;width:160px;height:160px;`;
  document.body.appendChild(rip);
  setTimeout(() => rip.remove(), 700);

  const bundle = makeBundle(cx, cy);
  bundles.push(bundle);

  let sent = 0;
  [...trailStars, ...bgStars].forEach(s => {
    if (sent >= 60 || s.bundling) return;
    const dx = cx - s.x, dy = cy - s.y;
    if (Math.sqrt(dx * dx + dy * dy) < 350) {
      s.bundling     = true;
      s.bundleTarget = bundle;
      sent++;
    }
  });
});

/* ── Draw bundle ── */
function drawBundle(b) {
  const age  = (performance.now() - b.born) / 1000;
  const fade = Math.max(0, 1 - age / 4);
  b.particles.forEach(p => {
    const t  = Math.min(1, age * 2.5);
    const px = b.x + p.ox * t;
    const py = b.y + p.oy * t;
    drawSparkle(px, py, p.size, fade * p.alpha);
  });
  b.life = fade;
}

/* ── Main animation loop ── */
function frame() {
  ctx.clearRect(0, 0, W, H);

  // spawn trail stars from mouse
  spawnTimer++;
  if (spawnTimer % 3 === 0 && mouse.x > 0) {
    const count = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      trailStars.push(makeTrailStar(
        mouse.x + (Math.random() - 0.5) * 8,
        mouse.y + (Math.random() - 0.5) * 8
      ));
    }
  }

  // background stars
  bgStars.forEach((s, i) => {
    s.twinkle += s.twinkleSpeed;

    if (s.bundling && s.bundleTarget) {
      const dx   = s.bundleTarget.x - s.x;
      const dy   = s.bundleTarget.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        const angle = Math.random() * Math.PI * 2;
        s.bundleTarget.particles.push({
          ox:    Math.cos(angle) * (10 + Math.random() * BUNDLE_RADIUS),
          oy:    Math.sin(angle) * (10 + Math.random() * BUNDLE_RADIUS),
          size:  s.size,
          alpha: 0.7 + Math.random() * 0.3
        });
        bgStars[i] = makeBgStar(true);
        return;
      }
      s.x      += (dx / dist) * 5;
      s.y      += (dy / dist) * 5;
      s.opacity = Math.max(0.2, dist / 200);
    } else {
      s.x += s.vx;
      s.y += s.speed;
      if (s.y > H + 30) bgStars[i] = makeBgStar(true);
    }

    const tw = 0.5 + 0.5 * Math.sin(s.twinkle);
    drawSparkle(s.x, s.y, s.size, s.opacity * (0.4 + 0.6 * tw));
  });

  // trail stars
  trailStars = trailStars.filter(s => {
    s.twinkle += s.twinkleSpeed;

    if (s.bundling && s.bundleTarget) {
      const dx   = s.bundleTarget.x - s.x;
      const dy   = s.bundleTarget.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        const angle = Math.random() * Math.PI * 2;
        s.bundleTarget.particles.push({
          ox:    Math.cos(angle) * (10 + Math.random() * BUNDLE_RADIUS),
          oy:    Math.sin(angle) * (10 + Math.random() * BUNDLE_RADIUS),
          size:  s.size,
          alpha: 0.8 + Math.random() * 0.2
        });
        return false;
      }
      s.x    += (dx / dist) * 5;
      s.y    += (dy / dist) * 5;
      s.life  = Math.max(0.2, dist / 200);
    } else {
      s.x    += s.vx;
      s.y    += s.vy;
      s.life -= s.decay;
    }

    if (s.life <= 0) return false;

    const tw = 0.6 + 0.4 * Math.sin(s.twinkle);
    drawSparkle(s.x, s.y, s.size, s.life * tw);
    return true;
  });

  // custom crosshair cursor
  if (mouse.x > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(mouse.x - 8, mouse.y); ctx.lineTo(mouse.x + 8, mouse.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y - 8); ctx.lineTo(mouse.x, mouse.y + 8); ctx.stroke();
    ctx.restore();
  }

  // bundles
  bundles = bundles.filter(b => b.life > 0.01);
  bundles.forEach(drawBundle);

  requestAnimationFrame(frame);
}

frame();
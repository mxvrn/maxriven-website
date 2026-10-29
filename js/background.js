// MAXRIVEN — background of floating prismatic glass panes, light sparkles and star dust.
// Pure DOM + CSS 3D transforms and one canvas for the dust; no libraries.
(function () {
  'use strict';

  // Narrow screens get fewer, smaller panes so they don't crowd the content.
  var small = window.innerWidth < 700;
  var PANES = small ? 8 : 14, SPARKS = small ? 10 : 18, BEAMS = small ? 2 : 4, DUST = small ? 160 : 320;
  var SCALE = Math.max(0.5, Math.min(1, window.innerWidth / 1200));

  // Seeded random so the composition is the same on every load.
  var seed = 7;
  function rnd() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(a, b) { return a + rnd() * (b - a); }

  var layer = document.createElement('div');
  layer.className = 'bg-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(layer, document.body.firstChild);
  document.documentElement.classList.add('has-bg');

  // Star dust
  var canvas = document.createElement('canvas');
  canvas.className = 'bg-dust';
  layer.appendChild(canvas);
  function drawDust() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    seed = 99;
    for (var i = 0; i < DUST; i++) {
      var r = rnd() < 0.92 ? range(0.3, 0.9) : range(1, 1.8);
      ctx.globalAlpha = range(0.15, 0.8);
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawDust();
  window.addEventListener('resize', drawDust);

  seed = 7;

  // Light beams
  for (var b = 0; b < BEAMS; b++) {
    var beam = document.createElement('span');
    beam.className = 'bg-beam';
    beam.style.left = range(5, 90) + 'vw';
    beam.style.top = range(-10, 60) + 'vh';
    beam.style.transform = 'rotate(' + range(-62, -28) + 'deg)';
    beam.style.animationDelay = (-range(0, 8)) + 's';
    layer.appendChild(beam);
  }

  // Glass panes
  var panes = [];
  for (var i = 0; i < PANES; i++) {
    var el = document.createElement('div');
    el.className = 'glass';
    var w = range(110, 280) * SCALE;
    el.style.width = w + 'px';
    el.style.height = (w * range(0.62, 1)) + 'px';
    layer.appendChild(el);
    panes.push({
      el: el,
      x: range(-4, 96), y: range(-6, 100),
      z: range(-500, 120),
      rx: range(-40, 40), ry: range(-55, 55), rz: range(-25, 25),
      spin: range(-6, 6), bob: range(8, 22), speed: range(0.15, 0.4), phase: range(0, 6.28),
      depth: range(0.05, 0.3)
    });
  }

  // Sparkles
  for (var s = 0; s < SPARKS; s++) {
    var sp = document.createElement('span');
    sp.className = 'bg-spark';
    var size = range(14, 46) * SCALE;
    sp.style.width = sp.style.height = size + 'px';
    sp.style.left = range(0, 100) + 'vw';
    sp.style.top = range(0, 100) + 'vh';
    sp.style.animationDelay = (-range(0, 5)) + 's';
    sp.style.animationDuration = range(3, 6) + 's';
    layer.appendChild(sp);
  }

  // Panes bob and turn slowly; scrolling moves them at different speeds for depth.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now) {
    var t = (now || 0) / 1000;
    var sy = window.scrollY;
    for (var k = 0; k < panes.length; k++) {
      var p = panes[k];
      var bob = reduce ? 0 : Math.sin(t * p.speed + p.phase) * p.bob;
      var spin = reduce ? 0 : t * p.spin;
      p.el.style.transform =
        'translate3d(' + p.x + 'vw,' + p.y + 'vh,' + p.z + 'px)' +
        ' translateY(' + (bob - sy * p.depth) + 'px)' +
        ' rotateX(' + (p.rx + spin * 0.5) + 'deg) rotateY(' + (p.ry + spin) + 'deg) rotateZ(' + p.rz + 'deg)';
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduce) window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
})();

// MAXRIVEN — mobile menu, the hero Insane preview, the listening room, plugin screenshot galleries, lightbox, the hero knob and its orbiting 3D rings.
(function () {
  'use strict';

  // Mobile menu: the two-line button in the top bar opens the full-screen nav.
  var menuBtn = document.querySelector('[data-menu-toggle]');
  if (menuBtn) {
    var menu = document.getElementById(menuBtn.getAttribute('aria-controls'));
    var setMenu = function (open) {
      document.documentElement.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      setMenu(false);
      // Page scrolling is locked while the menu is open, so jump to the section after it closes.
      var hash = link.getAttribute('href');
      var target = hash.charAt(0) === '#' && document.querySelector(hash);
      if (target) {
        e.preventDefault();
        setTimeout(function () {
          target.scrollIntoView();
          history.replaceState(null, '', hash);
        }, 0);
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 701px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  var dialog = document.querySelector('.lightbox');
  var lbImg = dialog.querySelector('.lightbox__img');
  var lbCount = dialog.querySelector('[data-lb-count]');
  var current = null; // { card, index }

  function thumbsOf(card) {
    return Array.prototype.slice.call(card.querySelectorAll('.thumb'));
  }

  function select(card, index) {
    var thumbs = thumbsOf(card);
    var thumb = thumbs[index];
    var main = card.querySelector('[data-main]');
    var small = thumb.querySelector('img');
    main.src = small.getAttribute('src');
    main.srcset = small.getAttribute('src') + ' ' + small.getAttribute('width') + 'w, ' + thumb.dataset.full + ' ' + thumb.dataset.fullw + 'w';
    main.alt = small.alt;
    main.width = small.width;
    main.height = small.height;
    thumbs.forEach(function (t, i) { t.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
  }

  function activeIndex(card) {
    var i = thumbsOf(card).findIndex(function (t) { return t.getAttribute('aria-pressed') === 'true'; });
    return i < 0 ? 0 : i;
  }

  function show(card, index) {
    var thumbs = thumbsOf(card);
    index = (index + thumbs.length) % thumbs.length;
    var thumb = thumbs[index];
    lbImg.src = thumb.dataset.full;
    lbImg.alt = thumb.querySelector('img').alt;
    lbCount.textContent = card.querySelector('h3').textContent + ' · ' + (index + 1) + ' / ' + thumbs.length;
    current = { card: card, index: index };
    select(card, index);
  }

  document.querySelectorAll('[data-gallery]').forEach(function (card) {
    thumbsOf(card).forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { select(card, i); });
    });
    card.querySelectorAll('[data-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(card, activeIndex(card));
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else window.open(lbImg.src, '_blank');
      });
    });
  });

  dialog.querySelector('[data-lb-prev]').addEventListener('click', function () { show(current.card, current.index - 1); });
  dialog.querySelector('[data-lb-next]').addEventListener('click', function () { show(current.card, current.index + 1); });
  dialog.querySelector('[data-lb-close]').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current.card, current.index - 1);
    if (e.key === 'ArrowRight') show(current.card, current.index + 1);
  });

  // Hero knob turns a little as the page scrolls.
  var knob = document.querySelector('[data-knob]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (knob && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        knob.style.transform = 'rotate(' + Math.min(window.scrollY / 4, 270) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  // YouTube: thumbnails are local; the player (youtube-nocookie) loads only after a click.
  var player = document.querySelector('[data-yt-player]');
  if (player) {
    var playVideo = function (id, title) {
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = 'MAXRIVEN – ' + (title || 'music video');
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      player.innerHTML = '';
      player.appendChild(frame);
    };
    player.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-yt]');
      if (btn) playVideo(btn.getAttribute('data-yt'), 'Insane');
    });
    // Video tiles are plain YouTube links; with JS they play in the player instead.
    document.querySelectorAll('[data-yt-tile]').forEach(function (tile) {
      tile.addEventListener('click', function (e) {
        e.preventDefault();
        playVideo(tile.getAttribute('data-yt-tile'), tile.getAttribute('data-yt-title'));
        player.scrollIntoView({ block: 'center' });
      });
    });
    document.querySelectorAll('[data-yt-jump]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        player.scrollIntoView({ block: 'center' });
        playVideo(link.getAttribute('data-yt-jump'), 'Insane');
      });
    });
  }

  // Hero release card: the cover plays a 45 s preview of Insane right on the page (nothing loads
  // until the first tap). The bars follow levels measured from the master, and a dock with a
  // Spotify link stays on screen while it plays and the card is scrolled away.
  var level = 0;
  var card = document.querySelector('[data-preview]');
  if (card) {
    var audio = new Audio(), DUR = 45, env = null, loaded = false;
    audio.preload = 'none';
    var dock = document.querySelector('[data-dock]');
    // starting the preview puts a playing music video back to its poster
    var vplayer = document.querySelector('[data-yt-player]'), facade = vplayer ? vplayer.innerHTML : '';
    var toggles = document.querySelectorAll('[data-preview-toggle]'), times = document.querySelectorAll('[data-preview-time]');
    var fills = document.querySelectorAll('.np__bar i, .dock__bar i'), bars = card.querySelectorAll('.np__eq i'), seekBar = card.querySelector('[data-preview-seek]');
    var fmt = function (t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); };
    var load = function () {
      if (loaded) return; loaded = true; audio.src = card.getAttribute('data-preview');
      fetch(card.getAttribute('data-levels')).then(function (r) { return r.json(); }).then(function (d) {
        var b = atob(d.env); env = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) env[i] = b.charCodeAt(i);
      }).catch(function () {});
    };
    // L/R RMS every 1/30 s, stored as (dB + 60) * 4
    var levelAt = function (t) {
      if (!env) return 0.5 + 0.3 * Math.sin(t * 9);
      var i = Math.min(env.length / 2 - 1, Math.max(0, Math.floor(t * 30)));
      var db = Math.max(env[2 * i], env[2 * i + 1]) / 4 - 60;
      return Math.min(1, Math.max(0, (db + 26) / 22));
    };
    var shown = false, cardVisible = true;
    var setDock = function () {
      var show = !audio.paused && !cardVisible; if (show === shown) return; shown = show;
      dock.classList.toggle('is-shown', show); dock.setAttribute('aria-hidden', show ? 'false' : 'true');
      dock.querySelectorAll('button, a').forEach(function (el) { el.tabIndex = show ? 0 : -1; });
    };
    var ui = function () {
      var on = !audio.paused;
      [card, dock].forEach(function (el) { el.classList.toggle('is-playing', on); });
      toggles.forEach(function (b) { b.setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' the Insane preview'); });
      setDock();
    };
    var raf = 0, sm = 0;
    var paint = function () {
      var t = audio.currentTime || 0, on = !audio.paused;
      var target = on ? levelAt(t) : 0; sm += (target - sm) * 0.35; level = sm;
      fills.forEach(function (f) { f.style.setProperty('--p', (t / DUR * 100) + '%'); });
      times.forEach(function (el) { el.textContent = (loaded ? fmt(t) + ' / 0:45' : el.textContent); });
      bars.forEach(function (b, i) { b.style.transform = 'scaleY(' + Math.max(0.18, Math.min(1, sm * (0.75 + 0.45 * Math.abs(Math.sin(t * 7 + i * 1.7))))) + ')'; });
      seekBar.setAttribute('aria-valuenow', Math.round(t));
      if (on || sm > 0.01) raf = requestAnimationFrame(paint);
    };
    var toggle = function () {
      load();
      if (audio.paused) {
        if (vplayer && vplayer.querySelector('iframe')) vplayer.innerHTML = facade;
        var p = audio.play(); if (p && p.catch) p.catch(function () {});
      } else audio.pause();
    };
    toggles.forEach(function (b) { b.addEventListener('click', toggle); });
    audio.addEventListener('play', function () { ui(); cancelAnimationFrame(raf); paint(); });
    audio.addEventListener('pause', ui);
    audio.addEventListener('ended', function () { audio.currentTime = 0; ui(); paint(); });
    var seek = function (x) { load(); var r = seekBar.getBoundingClientRect(); audio.currentTime = Math.min(DUR - 0.1, Math.max(0, (x - r.left) / r.width * DUR)); paint(); };
    var drag = false;
    seekBar.addEventListener('pointerdown', function (e) { drag = true; seekBar.setPointerCapture(e.pointerId); seek(e.clientX); });
    seekBar.addEventListener('pointermove', function (e) { if (drag) seek(e.clientX); });
    seekBar.addEventListener('pointerup', function () { drag = false; });
    seekBar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      load(); audio.currentTime = Math.min(DUR - 0.1, Math.max(0, audio.currentTime + (e.key === 'ArrowRight' ? 5 : -5))); paint(); e.preventDefault();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { cardVisible = e[0].isIntersecting; setDock(); }).observe(card);
    // and starting a music video, or opening the listening room, stops the preview
    document.addEventListener('mx:stop-audio', function () { audio.pause(); });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-yt], [data-yt-tile], [data-yt-jump]')) audio.pause(); }, true);
  }

  // Listening room: with JS, a release cover opens over the page with Spotify's own player
  // (preview, or the full track for signed-in listeners) instead of sending the visitor away.
  var room = document.querySelector('[data-room]');
  var covers = Array.prototype.slice.call(document.querySelectorAll('.releases .cover'));
  if (room && covers.length) {
    var items = covers.map(function (a) {
      var li = a.closest('.release'), img = a.querySelector('img'), t = li && li.querySelector('.release__title');
      var m = a.getAttribute('href').match(/open\.spotify\.com\/(track|album|artist)\/([A-Za-z0-9]+)/);
      return { link: a.getAttribute('href'), kind: m && m[1], id: m && m[2], title: t ? t.textContent : '', img: img.currentSrc || img.getAttribute('src'), big: img.getAttribute('src').replace('-600.', '-1200.') };
    });
    var current = 0, lastFocus = null;
    var q = function (sel) { return room.querySelector(sel); };
    var show = function (i) {
      current = (i + items.length) % items.length;
      var it = items[current];
      q('[data-room-img]').src = it.big; q('[data-room-img]').alt = 'Cover art for ' + it.title + ' by MAXRIVEN';
      q('[data-room-bg]').style.backgroundImage = 'url("' + it.img + '")';
      q('[data-room-title]').textContent = it.title;
      q('[data-room-count]').textContent = ('0' + (current + 1)).slice(-2) + ' / ' + ('0' + items.length).slice(-2);
      q('[data-room-open]').href = it.link;
      var box = q('[data-room-player]'); box.innerHTML = '';
      if (it.id) {
        var f = document.createElement('iframe');
        f.src = 'https://open.spotify.com/embed/' + it.kind + '/' + it.id + '?utm_source=generator&theme=0';
        f.title = 'Spotify player: ' + it.title + ' by MAXRIVEN';
        f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        f.loading = 'lazy';
        box.appendChild(f);
      }
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      document.dispatchEvent(new CustomEvent('mx:stop-audio'));
      show(i); room.hidden = false;
      document.documentElement.classList.add('room-open');
      requestAnimationFrame(function () { room.classList.add('is-open'); });
      q('[data-room-close]').focus();
    };
    var close = function () {
      room.classList.remove('is-open'); document.documentElement.classList.remove('room-open');
      q('[data-room-player]').innerHTML = '';
      room.hidden = true;
      if (lastFocus) lastFocus.focus();
    };
    covers.forEach(function (a, i) { a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); open(i);
    }); });
    q('[data-room-close]').addEventListener('click', close);
    room.addEventListener('click', function (e) {
      var step = e.target.closest('[data-room-step]');
      if (step) show(current + Number(step.getAttribute('data-room-step')));
      else if (e.target === room || e.target === q('.room__inner')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (room.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && e.target.tagName !== 'IFRAME') show(current + 1);
      else if (e.key === 'ArrowLeft' && e.target.tagName !== 'IFRAME') show(current - 1);
      else if (e.key === 'Tab') {
        var f = room.querySelectorAll('button, a[href], iframe'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
  }

  // Hero visual area: a band of type and a thin text ring around the M logo, as real 3D rings.
  // Each ring is a texture strip cut into thin columns and projected in perspective; columns
  // facing away go on the canvas behind the logo (mirrored, dimmed), the rest on the one in front.
  var front = document.querySelector('.ring3d--front'), back = document.querySelector('.ring3d--back');
  if (front && back && front.getContext) {
    var stage = front.parentNode, xF = front.getContext('2d'), xB = back.getContext('2d');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var WIDE = '"Michroma", sans-serif', MONO = '"JetBrains Mono", monospace', ACCENT = '#FF4A1C';
    // lay parts out once, then draw them twice so the strip wraps the ring twice
    var strip = function (h, parts) {
      var c = document.createElement('canvas'), x = c.getContext('2d'), w = 0;
      parts.forEach(function (p) { if (p.t) { x.font = p.font; p.w = x.measureText(p.t).width; } w += p.w + p.gap; });
      c.width = Math.ceil(w * 2); c.height = h;
      [0, c.width / 2].forEach(function (ox) { parts.forEach(function (p) { p.draw(x, ox); ox += p.w + p.gap; }); });
      return c;
    };
    var text = function (t, font, y, o) {
      return { t: t, font: font, gap: o.gap, draw: function (x, px) {
        x.save(); x.font = font; x.fillStyle = o.fill || '#fff';
        if (o.glow) { x.shadowColor = 'rgba(255,255,255,0.9)'; x.shadowBlur = o.glow; x.fillText(t, px, y); x.shadowBlur = o.glow / 3; }
        x.fillText(t, px, y); x.restore(); } };
    };
    var part = function (w, gap, draw) { return { w: w, gap: gap, draw: draw }; };
    var bandWords = front.getAttribute('data-band').split(' · ');
    var bandTex = function () {
      var H = 170;
      var c = strip(H, [
        text(bandWords[0], '400 84px ' + WIDE, 122, { glow: 20, gap: 44 }),
        part(190, 34, function (x, px) {
          x.save(); x.beginPath(); x.rect(px, 100, 190, 30); x.clip(); x.strokeStyle = '#fff'; x.lineWidth = 3;
          for (var i = -40; i < 230; i += 13) { x.beginPath(); x.moveTo(px + i, 130); x.lineTo(px + i + 30, 100); x.stroke(); }
          x.restore(); x.font = '400 13px ' + MONO; x.fillStyle = 'rgba(255,255,255,0.8)';
          bandWords.slice(1).forEach(function (l, i) { x.fillText(l, px, 46 + i * 17); });
        }),
        part(96, 30, function (x, px) {
          x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 2.5;
          [px + 32, px + 62].forEach(function (cx) { x.beginPath(); x.arc(cx, 86, 24, 0, 7); x.stroke(); });
        }),
        text(bandWords[bandWords.length - 1], '400 84px ' + WIDE, 122, { glow: 20, gap: 40, fill: ACCENT }),
        part(150, 40, function (x, px) {
          x.font = '400 18px ' + WIDE; x.fillStyle = '#fff';
          ['MMXXVI', 'MMXXVI', 'MMXXVI'].forEach(function (l, i) { x.globalAlpha = 1 - i * 0.25; x.fillText(l, px, 66 + i * 26); });
          x.globalAlpha = 1;
        })
      ]);
      var x = c.getContext('2d');
      x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(0, 12, c.width, 1.5); x.fillRect(0, H - 14, c.width, 1.5);
      x.fillStyle = 'rgba(255,255,255,0.25)'; for (var i = 0; i < c.width; i += 9) x.fillRect(i, 18, 1, 5);
      return c;
    };
    var thinTex = function () {
      var line = front.getAttribute('data-thin');
      var c = strip(40, [text(line, '500 24px ' + MONO, 32, { gap: 0, fill: ACCENT }), text(line, '500 24px ' + MONO, 32, { gap: 0, fill: ACCENT })]);
      var x = c.getContext('2d');
      x.fillStyle = 'rgba(255,74,28,0.7)'; x.fillRect(0, 3, c.width, 1.5);
      [0.18, 0.68].forEach(function (f) { x.beginPath(); x.arc(c.width * f, 4, 4, 0, 7); x.fill(); });
      return c;
    };
    // radius, band height and vertical offset are fractions of U, the stage width capped by its height
    var rings = [
      { R: 0.4, h: 0.07, y: 0.035, tx: 0.3, tz: -0.12, n: 200, spd: 1, back: 0.3, make: bandTex },
      { R: 0.43, h: 0.02, y: -0.05, tx: 0.24, tz: -0.06, n: 160, spd: -0.6, back: 0.45, make: thinTex }
    ];
    var W = 0, H = 0, U = 0, dpr = 1;
    var size = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; U = Math.min(W, 2.2 * H);
      [front, back].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    };
    var drawRing = function (g, ph) {
      var tex = g.tex, th = tex.height, R = g.R * U, h = g.h * U, F = 3.2 * U, cx = W / 2, cy = H / 2 + g.y * U;
      var ctx = Math.cos(g.tx), stx = Math.sin(g.tx), ctz = Math.cos(g.tz), stz = Math.sin(g.tz);
      var P = function (a, v) {
        var X = R * Math.sin(a), Z = R * Math.cos(a), Y1 = v * ctx + Z * stx, Z1 = -v * stx + Z * ctx, k = F / (F - Z1);
        return [cx + (X * ctz - Y1 * stz) * k, cy + (X * stz + Y1 * ctz) * k];
      };
      var dA = Math.PI * 2 / g.n, sw = tex.width / g.n;
      for (var i = 0; i < g.n; i++) {
        var a0 = i * dA + ph, isFront = Math.cos(a0 + dA / 2) > 0, x = isFront ? xF : xB;
        var p00 = P(a0, -h / 2), p10 = P(a0 + dA * 1.06, -h / 2), p01 = P(a0, h / 2), cw = Math.min(sw * 1.06, tex.width - i * sw);
        x.globalAlpha = isFront ? 1 : g.back;
        x.setTransform(dpr * (p10[0] - p00[0]) / sw, dpr * (p10[1] - p00[1]) / sw, dpr * (p01[0] - p00[0]) / th, dpr * (p01[1] - p00[1]) / th, dpr * p00[0], dpr * p00[1]);
        x.drawImage(tex, i * sw, 0, cw, th, 0, 0, cw, th);
      }
    };
    var phase = 0, last = 0, on = true, raf = 0;
    var frame = function (now) {
      var dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now; phase -= dt * (0.35 + level * 1.4);
      [xB, xF].forEach(function (x) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, front.width, front.height); });
      rings.forEach(function (g) { drawRing(g, phase * g.spd); });
      if (on && !still) raf = requestAnimationFrame(frame);
    };
    var start = function () {
      rings.forEach(function (g) { g.tex = g.make(); }); size(); frame(0);
      window.addEventListener('resize', function () { size(); if (still) frame(0); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
        on = e[0].isIntersecting; cancelAnimationFrame(raf); last = 0; if (on && !still) raf = requestAnimationFrame(frame);
      }).observe(stage);
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('84px "Michroma"'), document.fonts.load('500 24px "JetBrains Mono"')]).then(start, start);
    } else start();
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();

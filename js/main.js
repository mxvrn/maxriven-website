// MAXRIVEN — sticky menu, mobile menu, the hero Insane preview, plugin screenshot galleries, lightbox, plugin DETAILS panel,
// music video window, "Notify me" forms, the hero knob and its orbiting 3D rings.
(function () {
  'use strict';

  // The top bar stays on screen: sections scroll to just below it (--bar-h), the menu marks the section in view,
  // and a back-to-top button appears after the first screen.
  var bar = document.querySelector('.topbar'), root = document.documentElement;
  var setBar = function () { root.style.setProperty('--bar-h', bar.offsetHeight + 'px'); };
  setBar();
  if ('ResizeObserver' in window) new ResizeObserver(setBar).observe(bar);   // the bar grows a little when the web fonts arrive
  else window.addEventListener('resize', setBar);
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var toTop = document.querySelector('[data-to-top]');
  var markScroll = function () {
    var line = bar.offsetHeight + window.innerHeight * 0.3, active = -1;
    sections.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) active = i; });
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) active = sections.length - 1;   // the last section is short
    navLinks.forEach(function (a, i) { if (i === active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    var show = window.scrollY > window.innerHeight * 0.8;
    if (toTop.classList.contains('is-shown') !== show) { toTop.classList.toggle('is-shown', show); toTop.tabIndex = show ? 0 : -1; }
  };
  var marking = false;
  window.addEventListener('scroll', function () {
    if (marking) return;
    marking = true;
    requestAnimationFrame(function () { markScroll(); marking = false; });
  }, { passive: true });
  markScroll();
  toTop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    bar.querySelector('.brand').focus({ preventScroll: true });
  });

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

  var dialog = document.querySelector('.lightbox:not(.vbox)');
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
    // merch: the colour buttons follow the photo
    var colour = thumb.getAttribute('data-colour');
    if (colour) card.querySelectorAll('.swatch').forEach(function (s) { s.setAttribute('aria-pressed', s.getAttribute('data-colour') === colour ? 'true' : 'false'); });
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

  function wireGallery(card) {
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
    card.querySelectorAll('.swatch').forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        var i = thumbsOf(card).findIndex(function (t) { return t.getAttribute('data-colour') === swatch.getAttribute('data-colour'); });
        if (i >= 0) select(card, i);
      });
    });
  }
  document.querySelectorAll('[data-gallery]').forEach(wireGallery);

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

  // Music videos: the big Insane poster and the tiles play in a video window on the page (youtube-nocookie, autoplay;
  // thumbnails are local, so nothing loads from YouTube before a click). Closing the window removes the player, so the
  // video stops. The tiles are plain YouTube links, which is what they stay without JS or <dialog>.
  var vbox = document.querySelector('.vbox');
  if (vbox && typeof vbox.showModal === 'function') {
    var vFrame = vbox.querySelector('[data-vbox-frame]');
    var openVideo = function (id, title) {
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = 'MAXRIVEN – ' + (title || 'music video');
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      vFrame.innerHTML = '';
      vFrame.appendChild(frame);
      vbox.querySelector('[data-vbox-title]').textContent = 'MAXRIVEN · ' + (title || 'music video').toUpperCase();
      vbox.querySelector('[data-vbox-link]').href = 'https://www.youtube.com/watch?v=' + id;
      vbox.showModal();
    };
    document.querySelectorAll('[data-yt], [data-yt-tile]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openVideo(el.getAttribute('data-yt') || el.getAttribute('data-yt-tile'), el.getAttribute('data-yt-title'));
      });
    });
    vbox.querySelector('[data-vbox-close]').addEventListener('click', function () { vbox.close(); });
    vbox.addEventListener('click', function (e) { if (e.target === vbox) vbox.close(); });
    vbox.addEventListener('close', function () { vFrame.innerHTML = ''; });
  } else {
    var poster = document.querySelector('[data-yt]');
    if (poster) poster.addEventListener('click', function () { window.open('https://www.youtube.com/watch?v=' + poster.getAttribute('data-yt'), '_blank', 'noopener'); });
  }

  // "Notify me" forms: e-mail, a required consent box and the product's name in a hidden field. With NOTIFY_FORM_URL set
  // in js/config.js they post to that form service; while it is empty they open an e-mail to NOTIFY_EMAIL with the
  // product in the subject.
  var CONFIG = window.MAXRIVEN_CONFIG || {};
  var NOTIFY_EMAIL = CONFIG.NOTIFY_EMAIL || 'maxriven@icloud.com';
  function notifyMsg(form, text, kind) {
    var msg = form.querySelector('[data-notify-msg]');
    msg.textContent = text;
    msg.className = 'notify__msg' + (kind ? ' is-' + kind : '');
  }
  function resetNotify(form) { form.reset(); notifyMsg(form, '', ''); }
  document.querySelectorAll('[data-notify]').forEach(function (form) {
    form.addEventListener('input', function () { if (form.querySelector('.notify__msg.is-error')) notifyMsg(form, '', ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, consent = form.elements.consent, product = form.elements.product.value;
      if (!email.value.trim() || !email.checkValidity()) { notifyMsg(form, 'Please enter a valid e-mail address.', 'error'); email.focus(); return; }
      if (!consent.checked) { notifyMsg(form, 'Please tick the box to agree to release news.', 'error'); consent.focus(); return; }
      if (CONFIG.NOTIFY_FORM_URL) {
        var btn = form.querySelector('[type="submit"]');
        btn.disabled = true;
        notifyMsg(form, 'Sending…', '');
        fetch(CONFIG.NOTIFY_FORM_URL, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            resetNotify(form);
            notifyMsg(form, 'Thanks! You will hear from us when ' + product + ' is out.', 'ok');
          })
          .catch(function () { notifyMsg(form, 'Sorry, that did not work. Please try again or write to ' + NOTIFY_EMAIL + '.', 'error'); })
          .then(function () { btn.disabled = false; });
        return;
      }
      var body = 'Please let me know when ' + product + ' is released.\n\nMy e-mail: ' + email.value.trim() +
        '\nI agree to receive news about MAXRIVEN releases. I can unsubscribe at any time.';
      window.location.href = 'mailto:' + NOTIFY_EMAIL + '?subject=' + encodeURIComponent('Notify me – ' + product) + '&body=' + encodeURIComponent(body);
      notifyMsg(form, 'Almost done: your e-mail app opens with the message ready – just press send.', 'ok');
    });
  });

  // Plugin DETAILS panel: the card's screenshots (the big one still enlarges), its name and features (<template> in
  // the card), facts (formats, system, release, price) and the notify form for that plugin. NOTIFY ME on a card opens the panel at the form.
  var details = document.querySelector('.details');
  if (details && typeof details.showModal === 'function') {
    var dGallery = details.querySelector('[data-details-gallery]'), dMedia = details.querySelector('[data-details-media]');
    var dForm = details.querySelector('[data-notify]');
    var openDetails = function (card, atForm) {
      var screen = card.querySelector('.screen').cloneNode(true), thumbs = card.querySelector('.thumbs').cloneNode(true);
      var big = screen.querySelector('img');
      big.setAttribute('sizes', '(max-width: 760px) 92vw, 620px');
      big.removeAttribute('loading');
      dMedia.innerHTML = '';
      dMedia.appendChild(screen);
      dMedia.appendChild(thumbs);
      wireGallery(dGallery);
      var name = card.getAttribute('data-product');
      details.querySelector('[data-details-kicker]').textContent = card.querySelector('.plugin__top .mono').textContent;
      details.querySelector('[data-details-title]').textContent = name;
      var content = details.querySelector('[data-details-content]');
      content.innerHTML = '';
      content.appendChild(card.querySelector('template[data-details-body]').content.cloneNode(true));
      resetNotify(dForm);
      details.querySelector('[data-details-product]').value = name;
      details.showModal();
      dGallery.scrollTop = 0;
      if (atForm) {
        dForm.scrollIntoView({ block: 'nearest' });
        dForm.elements.email.focus({ preventScroll: true });
      }
    };
    document.querySelectorAll('.plugin [data-details]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDetails(btn.closest('.plugin'), btn.getAttribute('data-details') === 'notify'); });
    });
    details.querySelector('[data-details-close]').addEventListener('click', function () { details.close(); });
    details.addEventListener('click', function (e) { if (e.target === details) details.close(); });
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
    // and starting a music video stops the preview
    document.addEventListener('click', function (e) { if (e.target.closest('[data-yt], [data-yt-tile]')) audio.pause(); }, true);
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

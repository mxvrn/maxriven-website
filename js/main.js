// MAXRIVEN — mobile menu, plugin screenshot galleries, lightbox, the hero knob and its orbiting text bands.
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
    // Video tiles and release covers are plain YouTube links; with JS they play in the player instead.
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

  // Hero visual area: turn each text band into one panel per character around a cylinder.
  document.querySelectorAll('[data-ring]').forEach(function (ring) {
    var chars = Array.from(ring.getAttribute('data-ring'));
    ring.style.setProperty('--n', chars.length);
    chars.forEach(function (ch, i) {
      var glyph = document.createElement('i');
      glyph.textContent = ch === ' ' ? '\u00a0' : ch;
      if (ch === '·' || ch === '/') glyph.className = 'dot';
      glyph.style.setProperty('--a', (i * 360 / chars.length) + 'deg');
      ring.appendChild(glyph);
    });
  });

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();

// MAXRIVEN — "D · Showcase": nav, mobile menu, scroll reveals, "Notify me" forms, product sheets,
// releases shelf, music-video window and the 45-second Insane preview.
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ---- Global nav: translucent once the page scrolls; the link of the section in view is marked.
  var gnav = $('[data-gnav]');
  var navLinks = $$('.gnav__menu a[href^="#"]');
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var onScroll = function () {
    gnav.classList.toggle('is-scrolled', window.scrollY > 4);
    var line = window.innerHeight * 0.35, active = -1;
    sections.forEach(function (sec, i) {
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) active = i;
    });
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) active = sections.length - 1;
    navLinks.forEach(function (a, i) { if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  $('.gnav__brand').addEventListener('click', function (e) {
    e.preventDefault();
    setMenu(false);
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  });

  // ---- Mobile menu
  var menuBtn = $('[data-menu-toggle]');
  var menuLabel = $('[data-menu-label]');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuLabel.textContent = open ? 'Close menu' : 'Open menu';
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $('#gnav-menu').addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link || !root.classList.contains('menu-open')) return;
    e.preventDefault();
    setMenu(false);
    var target = document.querySelector(link.getAttribute('href'));
    // the page is scroll-locked while the menu is open, so jump after it closes
    requestAnimationFrame(function () {
      if (target) target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 835px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  // ---- Fade / slide in on scroll
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- "Notify me": e-mail, a required consent box and the product in a hidden field.
  // With NOTIFY_FORM_URL set in js/config.js they post there (Formspree, which forwards to Max's inbox);
  // without it they open an e-mail to NOTIFY_EMAIL.
  var CONFIG = window.MAXRIVEN_CONFIG || {};
  var NOTIFY_EMAIL = CONFIG.NOTIFY_EMAIL || 'maxriven@icloud.com';
  function notifyMsg(form, text, kind) {
    var msg = $('[data-notify-msg]', form);
    msg.textContent = text;
    msg.className = 'notify__msg' + (kind ? ' is-' + kind : '');
  }
  function resetNotify(form) { form.reset(); notifyMsg(form, '', ''); }

  $$('[data-notify]').forEach(function (form) {
    form.addEventListener('input', function () { if ($('.notify__msg.is-error', form)) notifyMsg(form, '', ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, consent = form.elements.consent, product = form.elements.product.value;
      if (!email.value.trim() || !email.checkValidity()) { notifyMsg(form, 'Please enter a valid e-mail address.', 'error'); email.focus(); return; }
      if (!consent.checked) { notifyMsg(form, 'Please tick the box to agree to release news.', 'error'); consent.focus(); return; }
      if (CONFIG.NOTIFY_FORM_URL) {
        var btn = $('[type="submit"]', form);
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

  // "Notify me" buttons swap their button row for the inline form; Cancel swaps back.
  $$('[data-notify-open]').forEach(function (btn) {
    var form = document.getElementById(btn.getAttribute('aria-controls'));
    var ctas = btn.closest('[data-ctas]');
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', 'true');
      form.hidden = false;
      ctas.hidden = true;
      form.elements.email.focus();
    });
    var cancel = $('[data-notify-cancel]', form);
    if (cancel) cancel.addEventListener('click', function () {
      resetNotify(form);
      form.hidden = true;
      ctas.hidden = false;
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    });
  });

  // ---- Product sheet ("Learn more"): filled from <template data-product-sheet="…">
  var sheet = $('[data-sheet]');
  if (sheet && typeof sheet.showModal === 'function') {
    var sMain = $('[data-sheet-main]', sheet), sImg = $('[data-sheet-img]', sheet), sThumbs = $('[data-sheet-thumbs]', sheet);
    var sForm = $('[data-notify]', sheet), lastOpener = null;
    var showShot = function (shots, i) {
      var s = shots[i];
      sImg.src = s.getAttribute('data-full');
      sImg.alt = s.alt;
      sMain.href = s.getAttribute('data-full');
      $$('.sheet__thumb', sThumbs).forEach(function (t, j) { t.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    };
    var openSheet = function (key, opener) {
      var tpl = $('template[data-product-sheet="' + key + '"]');
      if (!tpl) return;
      lastOpener = opener;
      var content = tpl.content.cloneNode(true);
      var shots = $$('.sheet__shots img', content);
      sheet.classList.toggle('sheet--portrait', tpl.hasAttribute('data-portrait'));
      $('[data-sheet-kicker]', sheet).textContent = tpl.getAttribute('data-kicker');
      $('[data-sheet-title]', sheet).textContent = tpl.getAttribute('data-name');
      sImg.style.aspectRatio = tpl.getAttribute('data-ratio');
      sThumbs.innerHTML = '';
      shots.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sheet__thumb';
        b.setAttribute('aria-label', 'Show image ' + (i + 1) + ' of ' + shots.length + ': ' + s.alt);
        var im = document.createElement('img');
        im.src = s.getAttribute('src');
        im.alt = '';
        im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () { showShot(shots, i); });
        sThumbs.appendChild(b);
      });
      showShot(shots, 0);
      var holder = $('[data-sheet-content]', sheet);
      holder.innerHTML = '';
      holder.appendChild(content);
      resetNotify(sForm);
      sForm.elements.product.value = tpl.getAttribute('data-name');
      $('.notify__label', sForm).textContent = 'Get an e-mail when ' + tpl.getAttribute('data-short').replace('HOODIE', 'the hoodie') + ' is out';
      sheet.showModal();
      sheet.scrollTop = 0;
    };
    $$('[data-details]').forEach(function (btn) {
      btn.addEventListener('click', function () { openSheet(btn.getAttribute('data-details'), btn); });
    });
    $('[data-sheet-close]', sheet).addEventListener('click', function () { sheet.close(); });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener('close', function () { if (lastOpener) lastOpener.focus(); });
  }

  // ---- Releases shelf: arrow buttons scroll by roughly one view; disabled at either end.
  var scroller = $('[data-shelf]');
  if (scroller) {
    var prev = $('[data-shelf-prev]'), next = $('[data-shelf-next]');
    var update = function () {
      var max = scroller.scrollWidth - scroller.clientWidth - 2;
      prev.disabled = scroller.scrollLeft <= 2;
      next.disabled = scroller.scrollLeft >= max;
    };
    var step = function (dir) {
      var card = $('.card', scroller);
      var by = card ? Math.max(card.offsetWidth + 20, Math.floor(scroller.clientWidth / (card.offsetWidth + 20)) * (card.offsetWidth + 20)) : scroller.clientWidth * 0.8;
      scroller.scrollBy({ left: dir * by, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    scroller.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- Music videos play in a window on the page (youtube-nocookie). Thumbnails are local, so nothing loads
  // from YouTube before a click; closing the window removes the player. Without <dialog> they stay plain links.
  var vbox = $('[data-vbox]');
  var stopPreview = function () {};
  if (vbox && typeof vbox.showModal === 'function') {
    var vFrame = $('[data-vbox-frame]', vbox), vOpener = null;
    $$('[data-yt]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // let modified clicks open YouTube in a new tab
        e.preventDefault();
        stopPreview();
        vOpener = el;
        var id = el.getAttribute('data-yt'), title = el.getAttribute('data-yt-title') || 'Music video';
        var frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
        frame.title = 'MAXRIVEN – ' + title;
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        vFrame.innerHTML = '';
        vFrame.appendChild(frame);
        $('[data-vbox-title]', vbox).textContent = 'MAXRIVEN – ' + title;
        $('[data-vbox-link]', vbox).href = 'https://www.youtube.com/watch?v=' + id;
        vbox.showModal();
      });
    });
    $('[data-vbox-close]', vbox).addEventListener('click', function () { vbox.close(); });
    vbox.addEventListener('click', function (e) { if (e.target === vbox) vbox.close(); });
    vbox.addEventListener('close', function () { vFrame.innerHTML = ''; if (vOpener) vOpener.focus(); });
  }

  // ---- 45-second Insane preview from the hero (nothing loads before the first tap). While it plays and the
  // hero image is scrolled away, a small player stays at the bottom of the screen.
  var preview = $('[data-preview]');
  if (preview) {
    var audio = new Audio(), DUR = 45, loaded = false;
    audio.preload = 'none';
    var dock = $('[data-dock]'), heroMedia = $('.hero__media');
    var toggles = $$('[data-preview-toggle]'), times = $$('[data-preview-time]');
    var fmt = function (t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); };
    var heroVisible = true, raf = 0;
    var setDock = function () { dock.hidden = audio.paused || heroVisible; };
    var paint = function () {
      var t = audio.currentTime || 0;
      preview.style.setProperty('--p', Math.min(100, t / DUR * 100).toFixed(2));
      times.forEach(function (el) { el.textContent = loaded ? fmt(t) + ' / 0:45' : 'Preview'; });
      if (!audio.paused) raf = requestAnimationFrame(paint);
    };
    var ui = function () {
      var on = !audio.paused;
      [preview, dock].forEach(function (el) { el.classList.toggle('is-playing', on); });
      toggles.forEach(function (b) { b.setAttribute('aria-label', (on ? 'Pause' : 'Play') + ' the 45-second preview of Insane'); });
      setDock();
    };
    toggles.forEach(function (b) {
      b.addEventListener('click', function () {
        if (!loaded) { loaded = true; audio.src = preview.getAttribute('data-preview'); }
        if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
        else audio.pause();
      });
    });
    audio.addEventListener('play', function () { ui(); cancelAnimationFrame(raf); paint(); });
    audio.addEventListener('pause', function () { ui(); paint(); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; ui(); paint(); });
    stopPreview = function () { audio.pause(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; setDock(); }).observe(heroMedia);
    }
  }
})();

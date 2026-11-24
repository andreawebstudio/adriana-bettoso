(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Anno nel footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Header: stato scroll ---------- */
  var header = document.getElementById('site-header');
  function onHeaderScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var toggleLabel = toggle ? toggle.querySelector('.visually-hidden') : null;

  function setMenu(open, returnFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (toggleLabel) toggleLabel.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      toggle.focus();
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
      var items = Array.prototype.slice.call(nav.querySelectorAll('a'));
      var idx = items.indexOf(document.activeElement);
      if (!e.shiftKey && idx === items.length - 1) { e.preventDefault(); toggle.focus(); }
      if (e.shiftKey && idx === 0) { e.preventDefault(); toggle.focus(); }
    });
    var mq = window.matchMedia('(min-width: 1100px)');
    var onMq = function () { if (mq.matches) setMenu(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
  }

  /* ---------- Voce di menu attiva ---------- */
  var navLinks = document.querySelectorAll('.nav-list a[href^="#"]');
  var linkMap = {};
  navLinks.forEach(function (a) { linkMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkMap[entry.target.id];
        navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home'].concat(Object.keys(linkMap)).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Fade-in leggero ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Come funziona: linea di avanzamento animata ---------- */
  var steps = document.getElementById('steps');
  if (steps) {
    var track = steps.querySelector('.steps-track');
    var fill = steps.querySelector('.steps-fill');
    var stepEls = Array.prototype.slice.call(steps.querySelectorAll('.step'));
    var geo = null;

    function measure() {
      var box = steps.getBoundingClientRect();
      var nodes = stepEls.map(function (s) {
        var r = s.querySelector('.step-node').getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
      });
      var first = nodes[0], last = nodes[nodes.length - 1];
      var vertical = Math.abs(last.y - first.y) > Math.abs(last.x - first.x);
      geo = { nodes: nodes, first: first, last: last, vertical: vertical };
      steps.classList.toggle('is-vertical', vertical);
      [track, fill].forEach(function (el) {
        if (vertical) {
          el.style.left = (first.x - 1) + 'px'; el.style.top = first.y + 'px';
          el.style.width = '2px';
        } else {
          el.style.top = (first.y - 1) + 'px'; el.style.left = first.x + 'px';
          el.style.height = '2px';
        }
      });
      if (vertical) { track.style.height = (last.y - first.y) + 'px'; }
      else { track.style.width = (last.x - first.x) + 'px'; }
      update();
    }

    function update() {
      if (!geo) return;
      var box = steps.getBoundingClientRect();
      var vh = window.innerHeight;
      var p;
      if (reduceMotion) {
        p = 1;
      } else if (geo.vertical) {
        p = (vh * 0.62 - (box.top + geo.first.y)) / (geo.last.y - geo.first.y);
      } else {
        p = (vh * 0.82 - (box.top + geo.first.y)) / (vh * 0.4);
      }
      p = Math.max(0, Math.min(1, p));
      var len = geo.vertical ? geo.last.y - geo.first.y : geo.last.x - geo.first.x;
      if (geo.vertical) { fill.style.height = (len * p) + 'px'; fill.style.width = '2px'; }
      else { fill.style.width = (len * p) + 'px'; fill.style.height = '2px'; }
      var reached = reduceMotion || (box.top + geo.first.y) < vh * (geo.vertical ? 0.62 : 0.82);
      stepEls.forEach(function (s, i) {
        var at = i / (stepEls.length - 1);
        s.classList.toggle('is-active', reached && p >= at - 0.001);
      });
      steps.classList.toggle('is-complete', p >= 1);
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* ---------- FAQ accordion (tutte chiuse all'avvio) ---------- */
  document.querySelectorAll('.faq-q button').forEach(function (btn) {
    var item = btn.closest('.faq-item');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.setAttribute('aria-hidden', 'true');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
      if (panel) panel.setAttribute('aria-hidden', String(!open));
    });
  });

  /* ---------- WATT: modal calendario ---------- */
  var dialog = document.getElementById('watt-dialog');
  var openBtn = document.getElementById('watt-open');
  if (dialog && openBtn) {
    var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    var MAIL = 'adrianabettoso@gmail.com';
    var today = new Date(); today.setHours(0, 0, 0, 0);

    var dateItems = Array.prototype.slice.call(dialog.querySelectorAll('#cal-dates li[data-date]'));
    var events = dateItems.map(function (li) {
      var parts = li.getAttribute('data-date').split('-').map(Number);
      return { li: li, date: new Date(parts[0], parts[1] - 1, parts[2]) };
    });

    events.forEach(function (ev) {
      var d = ev.date;
      var past = d < today;
      var label = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      var subject = encodeURIComponent('Prenotazione WATT – ' + label);
      ev.li.className = 'cal-date' + (past ? ' is-past' : '');
      ev.li.innerHTML =
        '<span class="cal-date-day" aria-hidden="true"><b>' + d.getDate() + '</b><small>' + MONTHS[d.getMonth()].slice(0, 3) + '</small></span>' +
        '<div><h3>' + label.charAt(0).toUpperCase() + label.slice(1) + '</h3><p>Uscita WATT · durata circa 2 ore</p></div>' +
        (past
          ? '<span class="cal-badge">Uscita conclusa</span>'
          : '<div class="cal-date-actions">' +
              '<a class="btn btn-primary" href="mailto:' + MAIL + '?subject=' + subject + '">Prenota<span class="visually-hidden"> l\'uscita di ' + label + ' via email</span></a>' +
              '<a class="btn btn-secondary" href="tel:+393480696970">Chiama<span class="visually-hidden"> per prenotare</span></a>' +
            '</div>');
    });

    // Mini calendari dei mesi coinvolti
    var monthsWrap = document.getElementById('cal-months');
    var seen = {};
    events.forEach(function (ev) {
      var key = ev.date.getFullYear() + '-' + ev.date.getMonth();
      if (seen[key]) return;
      seen[key] = true;
      var y = ev.date.getFullYear(), m = ev.date.getMonth();
      var html = '<div class="cal-month"><p class="cal-month-title">' + MONTHS[m] + ' ' + y + '</p><div class="cal-grid">';
      ['L', 'M', 'M', 'G', 'V', 'S', 'D'].forEach(function (d) { html += '<span class="dow">' + d + '</span>'; });
      var offset = (new Date(y, m, 1).getDay() + 6) % 7;
      for (var i = 0; i < offset; i++) html += '<span></span>';
      var daysIn = new Date(y, m + 1, 0).getDate();
      for (var day = 1; day <= daysIn; day++) {
        var cls = 'day';
        events.forEach(function (e2) {
          if (e2.date.getFullYear() === y && e2.date.getMonth() === m && e2.date.getDate() === day) {
            cls += ' is-event' + (e2.date < today ? ' is-past' : '');
          }
        });
        html += '<span class="' + cls + '">' + day + '</span>';
      }
      monthsWrap.insertAdjacentHTML('beforeend', html + '</div></div>');
    });

    openBtn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    });
    dialog.addEventListener('close', function () {
      document.body.style.overflow = '';
      openBtn.focus();
    });
    dialog.querySelector('[data-close-dialog]').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Form contatti ---------- */
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('.btn-submit');
  var FALLBACK = 'puoi contattarmi telefonicamente al <a href="tel:+393480696970">348 069 6970</a>.';

  var rules = [
    { el: form.elements['nome'], err: 'f-name-err', test: function (v) { return v.trim().length >= 2; }, msg: 'Inserisci il tuo nome e cognome.' },
    { el: form.elements['email'], err: 'f-email-err', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Inserisci un indirizzo email valido, ad esempio nome@dominio.it.' },
    { el: form.elements['messaggio'], err: 'f-msg-err', test: function (v) { return v.trim().length >= 10; }, msg: 'Scrivi un breve messaggio (almeno 10 caratteri).' },
    { el: form.elements['privacy'], err: 'f-privacy-err', test: function () { return form.elements['privacy'].checked; }, msg: 'Per inviare la richiesta è necessario accettare l\'informativa sulla privacy.' }
  ];

  function validateField(r) {
    var ok = r.test(r.el.value);
    r.el.setAttribute('aria-invalid', String(!ok));
    document.getElementById(r.err).textContent = ok ? '' : r.msg;
    return ok;
  }
  rules.forEach(function (r) {
    r.el.addEventListener('blur', function () { if (r.el.getAttribute('aria-invalid') !== null) validateField(r); });
    r.el.addEventListener('change', function () { if (r.el.getAttribute('aria-invalid') === 'true') validateField(r); });
  });

  function showStatus(type, html) {
    status.className = 'form-status ' + (type === 'success' ? 'is-success' : 'is-error');
    status.innerHTML = html;
    status.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    status.innerHTML = '';

    var firstInvalid = null;
    rules.forEach(function (r) { if (!validateField(r) && !firstInvalid) firstInvalid = r.el; });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    if (!endpoint) {
      showStatus('error', 'Il modulo online non è ancora attivo e la tua richiesta non è stata inviata. Nel frattempo ' + FALLBACK);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso…';

    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var ok = res.ok && (data.success === true || data.success === 'true');
          if (!ok) throw new Error(data.message || ('HTTP ' + res.status));
        });
      })
      .then(function () {
        form.reset();
        rules.forEach(function (r) { r.el.removeAttribute('aria-invalid'); });
        showStatus('success', 'Grazie, la tua richiesta è stata inviata. Ti risponderò appena possibile.');
      })
      .catch(function () {
        showStatus('error', 'Non è stato possibile inviare la richiesta. Riprova tra qualche minuto oppure ' + FALLBACK);
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia la richiesta';
      });
  });
})();

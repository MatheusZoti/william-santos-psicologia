/* WM Psicologia - motion
   Conceito: a travessia. A ponte do Willian se desenha na abertura e
   reaparece no convite final; o rio corre sob o hero e sob o convite.
   Cada animação tem um papel: guiar a leitura, marcar o processo ou
   responder ao gesto de quem navega. */
(function () {
  'use strict';

  window.__wmMotion = true;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------
     Básico: funciona com ou sem animação
     --------------------------------------------------------------- */
  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Contorno do arco do hero, desenhado no tamanho real
  var outline = $('.arch-outline');
  function drawArch() {
    if (!outline) return;
    var w = outline.clientWidth, h = outline.clientHeight;
    if (!w || !h) return;
    var r = w / 2 - 0.5, b = 28, x0 = 0.5, x1 = w - 0.5, y1 = h - 0.5;
    outline.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    outline.firstElementChild.setAttribute('d',
      'M' + x0 + ',' + (y1 - b) + ' L' + x0 + ',' + (r + 0.5) +
      ' A' + r + ',' + r + ' 0 0 1 ' + x1 + ',' + (r + 0.5) +
      ' L' + x1 + ',' + (y1 - b) +
      ' A' + b + ',' + b + ' 0 0 1 ' + (x1 - b) + ',' + y1 +
      ' L' + (x0 + b) + ',' + y1 +
      ' A' + b + ',' + b + ' 0 0 1 ' + x0 + ',' + (y1 - b));
  }
  drawArch();
  if (outline && 'ResizeObserver' in window) new ResizeObserver(drawArch).observe(outline);

  // Rios
  var rivers = new Map();
  if (window.WMRiver) {
    $$('[data-river]').forEach(function (c) {
      var final = c.classList.contains('river--final');
      var mavi = c.dataset.river === 'mavi';
      rivers.set(c, new window.WMRiver(c, mavi ? {
        host: c.closest('section, main') || c.parentElement,
        lines: 22, amplitude: 0.9, glints: 7, light: true, alphaScale: 1.6,
        c1: [174, 196, 202], c2: [217, 168, 160],          // Sereno no meio, Rosé nas pontas
        glintCore: [255, 255, 255], glintMid: [217, 168, 160]
      } : {
        host: c.closest('section, main') || c.parentElement,
        lines: final ? 20 : 26,
        amplitude: final ? 0.8 : 1,
        glints: final ? 6 : 10
      }));
    });
  }

  // Header fixo e com o mesmo visual do início ao fim da página
  var header = $('.site-header');
  var hero = $('.hero');
  if (header) header.classList.add('is-solid');

  var hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.DrawSVGPlugin);

  if (reduce || !hasGsap) {
    root.classList.remove('motion', 'intro');
    rivers.forEach(function (r) { r.intensity = 1; r.draw(0); });
    // FAQ simples: uma resposta aberta por vez
    var faq = $$('.faq details');
    faq.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) faq.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
    return;
  }

  /* ---------------------------------------------------------------
     Motion
     --------------------------------------------------------------- */
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger, SplitText, window.DrawSVGPlugin, window.MotionPathPlugin, window.CustomEase);
  window.CustomEase.create('wm', '0.16, 1, 0.3, 1');
  window.CustomEase.create('wmInOut', '0.77, 0, 0.18, 1');
  gsap.defaults({ ease: 'wm' });
  gsap.config({ nullTargetWarn: false });

  // Rolagem suave
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Destino da rolagem: cada seção para exatamente no topo da tela, cobrindo-a com a sua cor
  // (o topo some ao descer e fica sobre o respiro interno da seção ao subir).
  // No convite final (#agendar) desce até os botões de agendamento ficarem visíveis, sem passar do título.
  function scrollDest(id, target) {
    if (id !== '#agendar') return { to: target, offset: 0 };
    var top = target.getBoundingClientRect().top + window.scrollY;
    var choices = target.querySelector('.choices'), title = target.querySelector('h2');
    var rel = function (el) { var y = 0; while (el && el !== target) { y += el.offsetTop; el = el.offsetParent; } return y; };
    var need = choices ? rel(choices) + choices.offsetHeight + 32 - window.innerHeight : 0;
    var cap = title ? rel(title) - 24 : 0;
    return { to: Math.round(top + Math.max(0, Math.min(need, cap))), offset: 0 };
  }
  $$('a[href^="#"]:not(.skip-link)').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.getElementById(id.slice(1));
      if (!target || !lenis) return;
      e.preventDefault();
      var dest = scrollDest(id, target);
      lenis.scrollTo(dest.to, {
        offset: dest.offset,
        duration: 1.6,
        easing: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; }
      });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  var claimed = new Set();
  function claim(list) { (list.length !== undefined ? list : [list]).forEach(function (el) { if (el) claimed.add(el); }); }
  function show(el) { if (el) gsap.set(el, { autoAlpha: 1 }); }

  // Título: palavras sobem de dentro das linhas
  function headingReveal(el, o) {
    if (!el) return;
    o = o || {};
    claim(el);
    SplitText.create(el, {
      type: 'lines,words', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: function (self) {
        show(el);
        return gsap.fromTo(self.words, { yPercent: 118, rotate: o.rotate == null ? 3 : o.rotate }, {
          yPercent: 0, rotate: 0, duration: o.duration || 1.25, stagger: o.stagger || 0.045, delay: o.delay || 0,
          scrollTrigger: { trigger: el, start: o.start || 'top 86%', once: true }
        });
      }
    });
  }

  // Parágrafo: linhas sobem de dentro da máscara
  function linesReveal(el, o) {
    if (!el) return;
    o = o || {};
    claim(el);
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: function (self) {
        show(el);
        return gsap.fromTo(self.lines, { yPercent: 105 }, {
          yPercent: 0, duration: o.duration || 1.1, stagger: 0.07, delay: o.delay || 0,
          scrollTrigger: { trigger: o.trigger || el, start: o.start || 'top 88%', once: true }
        });
      }
    });
  }

  function riseIn(els, o) {
    els = (els.length !== undefined ? Array.prototype.slice.call(els) : [els]).filter(Boolean);
    if (!els.length) return;
    o = o || {};
    claim(els);
    gsap.fromTo(els, { autoAlpha: 0, y: o.y == null ? 36 : o.y, scale: o.scale || 1 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: o.duration || 1.1, stagger: o.stagger || 0.08, delay: o.delay || 0,
      scrollTrigger: { trigger: o.trigger || els[0], start: o.start || 'top 88%', once: true }
    });
  }

  function drawBridge(svg) {
    var q = function (s) { return $$(s, svg); };
    var tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.fromTo(q('.bridge__towers path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, stagger: 0.12 }, 0)
      .fromTo(q('.bridge__deck path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, stagger: 0 }, 0.4)
      .fromTo(q('.bridge__river'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, 0.5)
      .fromTo(q('.bridge__cables path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, stagger: 0 }, 0.7)
      .fromTo(q('.bridge__hangers path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, stagger: 0.07, ease: 'power2.out' }, 1.1);
    return tl;
  }

  function magnetic(el, strength) {
    if (!fine || !el) return;
    // o GSAP cuida do transform; a transição CSS de transform brigaria com ele e daria trancos
    el.style.transitionProperty = 'background-color, color, border-color, box-shadow';
    var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * (strength || 0.28));
      yTo((e.clientY - r.top - r.height / 2) * (strength || 0.28) * 1.3);
    });
    el.addEventListener('pointerleave', function () {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
    });
  }

  // botão aura: no hover as bolhas aceleram aos poucos (mudar animation-duration no CSS faz elas saltarem)
  function auraHover(btn) {
    if (!fine || !btn || !btn.getAnimations) return;
    var blobs = btn.querySelectorAll('.aura i');
    var rate = { v: 1 };
    function apply() {
      blobs.forEach(function (b) { b.getAnimations().forEach(function (a) { a.playbackRate = rate.v; }); });
    }
    btn.addEventListener('pointerenter', function () {
      gsap.to(rate, { v: 1.8, duration: 1.2, ease: 'sine.inOut', overwrite: true, onUpdate: apply });
    });
    btn.addEventListener('pointerleave', function () {
      gsap.to(rate, { v: 1, duration: 1.6, ease: 'sine.inOut', overwrite: true, onUpdate: apply });
    });
  }

  function spotlight(el) {
    if (!fine || !el) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  var fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 1800); })
  ]);

  fontsReady.then(function () {
    if (hero) initHome();
    if ($('.bio')) initLinks();
    if ($('.nf')) init404();

    // Tudo que ainda não tem animação própria entra ao rolar
    var rest = $$('.reveal').filter(function (el) { return !claimed.has(el) && !el.closest('[data-claimed]'); });
    gsap.set(rest, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(rest, {
      start: 'top 90%', once: true,
      onEnter: function (batch) { gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }); }
    });
    ScrollTrigger.refresh();
  });

  /* ===============================================================
     Página inicial
     =============================================================== */
  function initHome() {
    var introEl = $('.intro-screen');
    var withIntro = root.classList.contains('intro') && introEl;
    var heroTl = buildHero();

    if (withIntro) {
      if (lenis) lenis.stop();
      var bridge = $('.bridge--intro', introEl);
      var wm = $('.intro-screen__wm', introEl);
      var sub = $('.intro-screen__sub', introEl);
      var subSplit = SplitText.create(sub, { type: 'chars' });
      var intro = gsap.timeline({
        onComplete: function () {
          root.classList.remove('intro');
          try { sessionStorage.setItem('wm-intro', '1'); } catch (e) { /* sem storage */ }
          if (lenis) lenis.start();
          subSplit.revert();
        }
      });
      intro.add(drawBridge(bridge), 0.15)
        .fromTo(wm, { autoAlpha: 0, y: 26, letterSpacing: '0.3em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.04em', duration: 1.3 }, 1.05)
        .fromTo(subSplit.chars, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.035 }, 1.3)
        .to($('.intro-screen__inner', introEl), { y: -40, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, 2.45)
        .to(introEl, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'wmInOut' }, 2.65)
        .add(function () { heroTl.play(); }, 2.85);
      // clique ou tecla acelera a abertura
      var hurry = function () { intro.timeScale(3.5); };
      introEl.addEventListener('pointerdown', hurry, { once: true });
      window.addEventListener('keydown', hurry, { once: true });
    } else {
      gsap.delayedCall(0.1, function () { heroTl.play(); });
      if (location.hash && lenis) {
        var t = document.getElementById(location.hash.slice(1));
        if (t) setTimeout(function () { var d = scrollDest(location.hash, t); lenis.scrollTo(d.to, { offset: d.offset, immediate: true }); ScrollTrigger.refresh(); }, 60);
      }
    }

    heroScroll();
    headerScroll();
    empathy();
    whenSection();
    approach();
    professionals();
    firstContact();
    place();
    faqSection();
    finalCta();
    footer();

    $$('.hero__actions .btn, .when__close .btn, .steps__cta .btn, .choice .btn, .pro .btn, .place__actions .btn, .nav .btn')
      .forEach(function (b) { magnetic(b, 0.25); });
    $$('.btn--aura').forEach(auraHover);
  }

  function buildHero() {
    var h1 = $('.hero h1'), sub = $('.hero__sub'), actions = $('.hero__actions');
    var media = $('.hero__media'), arch = $('.arch'), img = $('.arch img'), path = $('.arch-outline path');
    var rings = $$('.hero .rings span'), glow = $('.hero .glow'), canvas = $('.hero .river');
    var river = rivers.get(canvas);
    var headerBits = [$('.site-header .brand')].concat($$('.nav > *'));
    var bar = null;
    claim([h1, sub, actions, media]);

    var h1Split = SplitText.create(h1, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
    var subSplit = SplitText.create(sub, { type: 'lines', mask: 'lines', linesClass: 'split-line' });

    gsap.set(h1Split.words, { yPercent: 118, rotate: 4 });
    gsap.set(subSplit.lines, { yPercent: 105 });
    gsap.set(actions.children, { autoAlpha: 0, y: 26 });
    gsap.set(arch, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(img, { scale: 1.35 });
    gsap.set(path, { drawSVG: '0%' });
    gsap.set(rings, { autoAlpha: 0, scale: 0.2 });
    gsap.set(glow, { autoAlpha: 0, scale: 0.7 });
    gsap.set(canvas, { autoAlpha: 0 });
    gsap.set(headerBits, { autoAlpha: 0, y: -14 });
    if (bar) gsap.set(bar, { yPercent: 120 });
    gsap.set([h1, sub, actions, media], { autoAlpha: 1 });

    var tl = gsap.timeline({
      paused: true,
      onComplete: function () {
        h1Split.revert(); subSplit.revert();
        gsap.set(path, { clearProps: 'all' });
      }
    });
    tl.to(glow, { autoAlpha: 1, scale: 1, duration: 2.6 }, 0)
      .to(canvas, { autoAlpha: 1, duration: 2 }, 0.2)
      .to(arch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'wmInOut' }, 0.05)
      .to(img, { scale: 1, duration: 2.4 }, 0.05)
      .to(path, { drawSVG: '100%', duration: 2.2, ease: 'power2.inOut' }, 0.7)
      .to(h1Split.words, { yPercent: 0, rotate: 0, duration: 1.35, stagger: 0.06 }, 0.38)
      .to(subSplit.lines, { yPercent: 0, duration: 1.1, stagger: 0.09 }, 0.85)
      .to(actions.children, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 1.05)
      .to(rings, { autoAlpha: 1, scale: 1, duration: 1.4, stagger: { each: 0.07, from: 'center' } }, 0.9)
      .to(headerBits, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.5);
    if (bar) tl.to(bar, { yPercent: 0, duration: 1 }, 1.4);
    if (river) tl.fromTo(river, { intensity: 0 }, { intensity: 1, duration: 3, ease: 'power2.out' }, 0.1);

    // Resposta ao cursor: luz, foto e anéis acompanham o gesto
    if (fine) {
      var gx = gsap.quickTo(glow, 'x', { duration: 1.6, ease: 'power3' });
      var gy = gsap.quickTo(glow, 'y', { duration: 1.6, ease: 'power3' });
      var rx = gsap.quickTo(media, 'rotationY', { duration: 1.2, ease: 'power3' });
      var ry = gsap.quickTo(media, 'rotationX', { duration: 1.2, ease: 'power3' });
      var ringsEl = $('.hero .rings');
      var kx = gsap.quickTo(ringsEl, 'x', { duration: 1.4, ease: 'power3' });
      var ky = gsap.quickTo(ringsEl, 'y', { duration: 1.4, ease: 'power3' });
      gsap.set(media, { transformPerspective: 1200 });
      hero.addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        gx(nx * 120); gy(ny * 80);
        rx(nx * 7); ry(-ny * 5);
        kx(nx * -30); ky(ny * -20);
      });
      hero.addEventListener('pointerleave', function () { rx(0); ry(0); kx(0); ky(0); });
    }
    return tl;
  }

  function heroScroll() {
    var st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__grid > div:first-child', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__media .arch', { yPercent: 8, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__media .arch-outline', { yPercent: -6, ease: 'none', scrollTrigger: st });
  }

  function headerScroll() {
    var bar = $('.scroll-progress');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        gsap.set(bar, { scaleX: self.progress });
        // some ao rolar para baixo, volta ao rolar para cima (sempre visível bem no topo)
        var y = self.scroll();
        header.classList.toggle('is-hidden', y > 80 && self.direction === 1);
      }
    });
  }

  function empathy() {
    var statement = $('.statement');
    claim(statement);
    var split = SplitText.create(statement, { type: 'words', wordsClass: 'w' });
    show(statement);
    gsap.fromTo(split.words, { color: 'rgba(10, 39, 45, 0.13)' }, {
      color: function (i, w) { return w.closest('.soft') ? '#84663d' : '#0a272d'; },
      ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 42%', scrub: 0.6 }
    });
    $$('.empathy__body p').forEach(function (p, i) { linesReveal(p, { delay: i ? 0.05 : 0 }); });

    var svg = $('.flow-line'), base = $('.flow-line__base'), cur = $('.flow-line__current');
    var len = cur.getTotalLength();
    gsap.set(cur, { strokeDasharray: '46 ' + Math.round(len / 3 - 46), autoAlpha: 0 });
    gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 95%', end: 'bottom 55%', scrub: 0.8 } })
      .fromTo(base, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', duration: 1 })
      .to(cur, { autoAlpha: 0.9, duration: 0.2, ease: 'none' }, 0.8);
    gsap.to(cur, { strokeDashoffset: -len / 3, duration: 5, ease: 'none', repeat: -1 });
  }

  function whenSection() {
    headingReveal($('#quando-title'));
    riseIn($('.when__head .lead'), { delay: 0.2 });
    var items = $$('.when__grid li');
    claim(items);
    gsap.set(items, { autoAlpha: 0, y: 44 });
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09 });
        batch.forEach(function (li, i) {
          var bar = $('.when__bar', li);
          gsap.timeline({ delay: 0.25 + i * 0.09, onComplete: function () { gsap.set(bar, { clearProps: 'transform,transformOrigin' }); } })
            .fromTo(bar, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' })
            .to(bar, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.8, ease: 'power3.inOut' });
        });
      }
    });
    var close = $('.when__close');
    claim(close);
    show(close);
    headingReveal($('p', close), { start: 'top 90%', rotate: 0 });
    riseIn($('.btn', close), { delay: 0.3, trigger: close });
    gsap.fromTo('#quando .glow', { yPercent: -18 }, {
      yPercent: 18, ease: 'none', scrollTrigger: { trigger: '#quando', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  function approach() {
    headingReveal($('#abordagem-title'));
    riseIn($('.approach__intro .lead'), { delay: 0.15 });
    var lines = $$('.approach__lines > div');
    claim(lines);
    gsap.set(lines, { autoAlpha: 0, x: -20 });
    gsap.set($$('.approach__lines img'), { rotate: -25, scale: 0.5 });
    gsap.timeline({ scrollTrigger: { trigger: '.approach__lines', start: 'top 90%', once: true } })
      .to(lines, { autoAlpha: 1, x: 0, duration: 1, stagger: 0.14 })
      .to($$('.approach__lines img'), { rotate: 0, scale: 1, duration: 1.2, ease: 'back.out(2)', stagger: 0.14 }, 0);

    var pathEl = $('.path');
    gsap.fromTo('.path__fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: pathEl, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 }
    });
    $$('.path__step').forEach(function (step) {
      claim(step);
      ScrollTrigger.create({
        trigger: step, start: 'top 64%',
        onEnter: function () { step.classList.add('is-active'); },
        onLeaveBack: function () { step.classList.remove('is-active'); }
      });
      gsap.set(step, { autoAlpha: 1 });
      gsap.fromTo($$('h3, p', step), { autoAlpha: 0, x: 36 }, {
        autoAlpha: 1, x: 0, duration: 1.1, stagger: 0.1,
        scrollTrigger: { trigger: step, start: 'top 82%', once: true }
      });
    });
  }

  function professionals() {
    riseIn($('.pros__head .eyebrow'), { y: 16 });
    headingReveal($('#pros-title'), { delay: 0.05 });
    riseIn($('.pros__head .lead'), { delay: 0.25 });

    var cards = $$('.pro');
    claim(cards);
    cards.forEach(function (card, i) {
      var photo = $('.pro__photo', card), img = $('.pro__photo img', card);
      var bits = $$('.pro__top, .pro__bio, .pro__facts > div, .pro > .pro__body > .btn', card);
      var chips = $$('.plans li', card), symbol = $('.pro__symbol', card);
      gsap.set(card, { autoAlpha: 1 });
      // no desktop a foto abre de lado, do centro do card para fora; no celular, de baixo para cima
      var wide = window.matchMedia('(min-width: 901px)').matches;
      var photoFrom = !wide ? 'inset(0% 0% 100% 0%)' : (card.classList.contains('pro--mavi') ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)');
      gsap.set(photo, { clipPath: photoFrom });
      gsap.set(img, { scale: 1.45, transformOrigin: wide ? '50% 40%' : '50% 0%' });
      gsap.set(bits, { autoAlpha: 0, y: 30 });
      gsap.set(chips, { autoAlpha: 0, scale: 0.6 });
      gsap.set(symbol, { autoAlpha: 0, rotate: -40, scale: 0.4 });
      gsap.set($('.pro__body', card), { clipPath: wide ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' });

      gsap.timeline({ delay: i * 0.12, scrollTrigger: { trigger: card, start: 'top 82%', once: true } })
        .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'wmInOut' }, 0)
        .to(img, { scale: wide ? 1.12 : 1, duration: 2.2 }, 0)
        .to($('.pro__body', card), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'wmInOut' }, wide ? 0.25 : 0.55)
        .to(bits, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07 }, 0.8)
        .to(symbol, { autoAlpha: 0.95, rotate: 0, scale: 1, duration: 1.4, ease: 'back.out(1.8)' }, 0.9)
        .to(chips, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.035 }, 1.2);

      // no celular a foto fica ancorada no topo, sem parallax, para não cortar a cabeça
      if (wide) gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // Inclinação 3D com luz que segue o cursor
      if (fine) {
        var rX = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3' });
        var rY = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3' });
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          rY((px - 0.5) * 3); rX((0.5 - py) * 3);
          card.style.setProperty('--mx', (px * 100) + '%');
          card.style.setProperty('--my', (py * 100) + '%');
        });
        card.addEventListener('pointerleave', function () { rX(0); rY(0); });
      }
    });

  }

  function firstContact() {
    headingReveal($('#contato-title'));
    var wrap = $('.steps-wrap'), fill = $('.steps__fill'), dot = $('.steps__dot'), line = $('.steps__line');
    var steps = $$('.step');
    claim(steps);
    gsap.set(steps, { autoAlpha: 1 });

    gsap.matchMedia().add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, function (ctx) {
      var desk = ctx.conditions.desk;
      var tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: wrap, start: desk ? 'top 78%' : 'top 70%', end: desk ? 'bottom 62%' : 'bottom 70%', scrub: 0.8 }
      });
      tl.fromTo(fill, desk ? { scaleX: 0 } : { scaleY: 0 }, desk ? { scaleX: 1, duration: 3, ease: 'none' } : { scaleY: 1, duration: 3, ease: 'none' }, 0)
        .fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
        .fromTo(dot, desk ? { x: 0 } : { y: 0 },
          desk ? { x: function () { return line.offsetWidth; }, duration: 3, ease: 'none' }
               : { y: function () { return line.offsetHeight; }, duration: 3, ease: 'none' }, 0)
        .to(dot, { autoAlpha: 0, duration: 0.2 }, 2.8);
      steps.forEach(function (step, i) {
        var at = i * 1.3;
        tl.fromTo($('.step__num', step), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.4)' }, at)
          .fromTo($('.step__num', step), { boxShadow: '0 0 0 0px rgba(209,163,100,0.5)' }, { boxShadow: '0 0 0 14px rgba(209,163,100,0)', duration: 0.7 }, at + 0.1)
          .fromTo($$('h3, p', step), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, at + 0.15);
      });
      tl.fromTo(line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
    });
    riseIn($('.steps__cta'), { start: 'top 92%' });
  }

  function place() {
    headingReveal($('#local-title'));
    linesReveal($('.place__text > p'));
    var address = $('.address'), pin = $('.address .icon');
    claim(address);
    show(address);
    gsap.timeline({ scrollTrigger: { trigger: address, start: 'top 88%', once: true } })
      .fromTo(address, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 1 })
      .fromTo(pin, { y: -46, autoAlpha: 0, scaleY: 1.2 }, { y: 0, autoAlpha: 1, scaleY: 1, duration: 1.1, ease: 'bounce.out' }, 0.15)
      .fromTo(pin, { scaleX: 1 }, { scaleX: 1.18, scaleY: 0.82, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.6);
    riseIn($('.place__actions'), { delay: 0.2 });

    var photo = $('.place__photo'), img = $('.place__photo img');
    claim(photo);
    gsap.set(photo, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 100%)' });
    gsap.set(img, { scale: 1.35 });
    gsap.timeline({ scrollTrigger: { trigger: photo, start: 'top 82%', once: true } })
      .to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'wmInOut' })
      .to(img, { scale: 1.08, duration: 2.4 }, 0);
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true } });
    riseIn($('.map'), { y: 60, start: 'top 92%' });
  }

  function faqSection() {
    headingReveal($('#faq-title'));
    riseIn($$('.faq__intro > p, .faq__intro > .text-link'), { delay: 0.15 });
    var items = $$('.faq details');
    claim(items);
    gsap.set(items, { autoAlpha: 0, x: 40 });
    ScrollTrigger.batch(items, {
      start: 'top 92%', once: true,
      onEnter: function (b) { gsap.to(b, { autoAlpha: 1, x: 0, duration: 1, stagger: 0.07 }); }
    });

    // Abrir e fechar com altura animada, uma resposta por vez
    function close(d) {
      var a = $('.faq__answer', d);
      d.classList.remove('is-open');
      gsap.to(a, { height: 0, autoAlpha: 0, duration: 0.55, ease: 'power3.inOut', onComplete: function () { d.open = false; gsap.set(a, { clearProps: 'height,opacity,visibility' }); } });
    }
    function open(d) {
      var a = $('.faq__answer', d);
      d.open = true;
      d.classList.add('is-open');
      gsap.fromTo(a, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.7, ease: 'power3.out', onComplete: function () { gsap.set(a, { clearProps: 'height' }); } });
      gsap.fromTo($('p', a), { y: 14 }, { y: 0, duration: 0.7 });
    }
    items.forEach(function (d) {
      $('summary', d).addEventListener('click', function (e) {
        e.preventDefault();
        if (d.classList.contains('is-open')) { close(d); return; }
        items.forEach(function (o) { if (o !== d && o.classList.contains('is-open')) close(o); });
        open(d);
      });
    });
  }

  function finalCta() {
    var sec = $('#agendar'), bridge = $('.bridge--final'), glow = $('#agendar .glow'), canvas = $('.river--final');
    var river = rivers.get(canvas);
    // a ponte se desenha conforme você chega ao convite
    gsap.set(bridge, { autoAlpha: 1 });
    var draw = drawBridge(bridge).pause();
    ScrollTrigger.create({
      trigger: sec, start: 'top 75%', end: 'top 20%', scrub: 0.8,
      animation: draw
    });
    headingReveal($('#final-title'), { start: 'top 80%', stagger: 0.05 });
    riseIn($('.final__sub'), { delay: 0.35, start: 'top 85%' });
    var choices = $$('.choice');
    claim(choices);
    gsap.fromTo(choices, { autoAlpha: 0, y: 70, rotationX: -12, transformPerspective: 900 }, {
      autoAlpha: 1, y: 0, rotationX: 0, duration: 1.3, stagger: 0.14,
      scrollTrigger: { trigger: '.choices', start: 'top 88%', once: true }
    });
    choices.forEach(spotlight);
    gsap.to(glow, { scale: 1.12, opacity: 0.7, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    if (river) {
      river.intensity = 0;
      gsap.to(river, { intensity: 1, duration: 3, ease: 'power2.out', scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
    }
  }

  function footer() {
    var cols = $$('.footer__grid > div');
    gsap.fromTo(cols, { autoAlpha: 0, y: 30 }, {
      autoAlpha: 1, y: 0, duration: 1, stagger: 0.1,
      scrollTrigger: { trigger: '.site-footer', start: 'top 92%', once: true }
    });
  }

  /* ===============================================================
     Página de links
     =============================================================== */
  function initLinks() {
    var inner = $('.bio__inner');
    var ring = $('.bio__ring circle'), photo = $('.bio__photo img');
    var brand = $('.bio .brand'), tag = $('.bio__tag'), links = $$('.bio-link'), foot = $('.bio__foot');
    var glow = $('.bio .glow'), canvas = $('.bio .river'), river = rivers.get(canvas);
    var tagSplit = SplitText.create(tag, { type: 'lines', mask: 'lines', linesClass: 'split-line' });

    gsap.set([ring], { drawSVG: '0%' });
    gsap.set(photo, { scale: 1.4, autoAlpha: 0 });
    gsap.set(brand, { autoAlpha: 0, y: 20, letterSpacing: '0.2em' });
    gsap.set(tagSplit.lines, { yPercent: 105 });
    gsap.set(links, { autoAlpha: 0, y: 40, rotationX: -25, transformPerspective: 800 });
    var extras = $$('.bio__extra'), line = $('.bio__line path');
    gsap.set(foot, { autoAlpha: 0 });
    gsap.set(extras, { autoAlpha: 0, y: 30 });
    if (line) gsap.set(line, { drawSVG: '0%' });
    gsap.set(glow, { autoAlpha: 0, scale: 0.7 });
    gsap.set($$('.bio__inner > *'), { visibility: 'visible' });
    if (river) river.intensity = 0;

    var tl = gsap.timeline({ delay: 0.1, onComplete: function () { tagSplit.revert(); } });
    tl.to(glow, { autoAlpha: 1, scale: 1, duration: 2.4 }, 0)
      .to(ring, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' }, 0.1)
      .to(photo, { autoAlpha: 1, scale: 1, duration: 1.6 }, 0.3)
      .to(brand, { autoAlpha: 1, y: 0, letterSpacing: '0em', duration: 1.2 }, 0.6)
      .to(tagSplit.lines, { yPercent: 0, duration: 1, stagger: 0.08 }, 0.8)
      .to(links, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.1, stagger: 0.08 }, 1)
      .to(extras, { autoAlpha: 1, y: 0, duration: 1.1 }, 1.4)
      .to(foot, { autoAlpha: 1, duration: 1 }, 1.6);
    // linha contínua da marca da Mavi: se desenha atrás do conteúdo
    if (line) tl.to(line, { drawSVG: '100%', duration: 2.8, ease: 'power2.inOut' }, 0.15);
    if (river) tl.to(river, { intensity: 1, duration: 3, ease: 'power2.out' }, 0.4);
    links.forEach(function (l) { spotlight(l); magnetic(l, 0.08); });
  }

  /* ===============================================================
     404
     =============================================================== */
  function init404() {
    var bridge = $('.bridge--broken'), bits = $$('.nf .container > *:not(.bridge)'), canvas = $('.nf .river'), river = rivers.get(canvas);
    var h1 = $('.nf h1');
    var split = SplitText.create(h1, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
    gsap.set(split.words, { yPercent: 118 });
    gsap.set(bits, { autoAlpha: 0, y: 24 });
    gsap.set(h1, { autoAlpha: 1, y: 0 });
    gsap.set($$('.nf .container > *'), { visibility: 'visible' });
    if (river) river.intensity = 0;
    var brand = $('.site-header .brand');
    var tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo(brand, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0)
      .add(drawBridge(bridge), 0)
      .fromTo($$('.bridge__deck path', bridge), { x: 0 }, { x: function (i) { return i ? 14 : -14; }, duration: 1.4, ease: 'elastic.out(1, 0.3)' }, 1.3)
      .to(bits.filter(function (b) { return b !== h1; }), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.9)
      .to(split.words, { yPercent: 0, duration: 1.2, stagger: 0.05 }, 0.8);
    if (river) tl.to(river, { intensity: 1, duration: 3, ease: 'power2.out' }, 0.3);
    $$('.nf .btn').forEach(function (b) { magnetic(b, 0.25); });
  }
})();

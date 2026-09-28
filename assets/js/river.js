/* WM Psicologia - "O rio"
   Linhas douradas que correm como água, inspiradas no rio sob a ponte
   do logo do Willian. Desenho em canvas, pausado fora da tela e estático
   para quem prefere menos movimento. */
(function () {
  'use strict';

  var GOLD = [209, 163, 100];
  var ROSE = [217, 168, 160];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeGlint() {
    var s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(250, 239, 228, 1)');
    grad.addColorStop(0.18, 'rgba(238, 186, 115, 0.85)');
    grad.addColorStop(0.5, 'rgba(209, 163, 100, 0.18)');
    grad.addColorStop(1, 'rgba(209, 163, 100, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return c;
  }
  var GLINT = null;

  function River(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.host = opts.host || canvas.parentElement;
    this.count = opts.lines || 24;
    this.amp = opts.amplitude || 1;
    this.speed = opts.speed || 1;
    this.glintCount = opts.glints == null ? 9 : opts.glints;
    this.t = Math.random() * 100;
    this.pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, force: 0, target: 0 };
    this.visible = false;
    this.running = false;
    this.last = 0;
    this.intensity = reduce ? 1 : 0; // o GSAP pode subir de 0 a 1 na entrada
    if (!GLINT) GLINT = makeGlint();
    this.glints = [];
    for (var i = 0; i < this.glintCount; i++) this.glints.push(this.newGlint(true));
    this.bind();
    this.resize();
  }

  River.prototype.newGlint = function (anywhere) {
    return {
      line: Math.floor(this.count * (0.35 + Math.random() * 0.65)),
      x: anywhere ? Math.random() : -0.05,
      v: 0.018 + Math.random() * 0.03,
      size: 10 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2
    };
  };

  River.prototype.bind = function () {
    var self = this;
    this.onResize = function () { self.resize(); if (reduce || !self.running) self.draw(0); };
    if ('ResizeObserver' in window) new ResizeObserver(this.onResize).observe(this.canvas);
    else window.addEventListener('resize', this.onResize);

    if (!reduce && window.matchMedia('(pointer: fine)').matches) {
      this.host.addEventListener('pointermove', function (e) {
        var r = self.canvas.getBoundingClientRect();
        self.pointer.tx = e.clientX - r.left;
        self.pointer.ty = e.clientY - r.top;
        if (self.pointer.x < -1000) { self.pointer.x = self.pointer.tx; self.pointer.y = self.pointer.ty; }
        self.pointer.target = 1;
      });
      this.host.addEventListener('pointerleave', function () { self.pointer.target = 0; });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
        self.visible ? self.start() : self.stop();
      }, { rootMargin: '80px' }).observe(this.canvas);
    } else {
      this.visible = true;
      this.start();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? self.stop() : (self.visible && self.start());
    });
  };

  River.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // linhas mais juntas ao fundo (longe) e mais abertas à frente (perto)
    this.rows = [];
    for (var i = 0; i < this.count; i++) {
      var d = i / (this.count - 1);
      var grad = this.ctx.createLinearGradient(0, 0, this.w, 0);
      var a = 0.06 + 0.34 * Math.pow(d, 1.3);
      grad.addColorStop(0, 'rgba(' + ROSE + ',' + (a * 0.35) + ')');
      grad.addColorStop(0.35, 'rgba(' + GOLD + ',' + a + ')');
      grad.addColorStop(0.7, 'rgba(' + GOLD + ',' + (a * 0.9) + ')');
      grad.addColorStop(1, 'rgba(' + ROSE + ',' + (a * 0.3) + ')');
      this.rows.push({
        d: d,
        y: this.h * (0.1 + 0.86 * Math.pow(d, 1.55)),
        amp: (5 + 30 * d) * this.amp,
        width: 0.6 + 1.1 * d,
        stroke: grad,
        seed: i * 1.618
      });
    }
    this.step = this.w < 700 ? 18 : 22;
  };

  River.prototype.yAt = function (row, x, t) {
    var s = row.seed;
    var y = row.y +
      row.amp * (0.62 * Math.sin(x * 0.0042 + t * 0.55 + s) +
                 0.38 * Math.sin(x * 0.0093 - t * 0.35 + s * 1.7)) * this.intensity;
    var p = this.pointer;
    if (p.force > 0.01) {
      var dx = x - p.x, dy = row.y - p.y;
      var fall = Math.exp(-(dx * dx) / 26000 - (dy * dy) / 9000);
      y += (dy >= 0 ? 1 : -1) * 38 * fall * p.force;
    }
    return y;
  };

  River.prototype.draw = function (dt) {
    var ctx = this.ctx, t = this.t, p = this.pointer;
    p.x += (p.tx - p.x) * 0.12;
    p.y += (p.ty - p.y) * 0.12;
    p.force += (p.target - p.force) * 0.06;

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineCap = 'round';
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
      ctx.beginPath();
      for (var x = -this.step; x <= this.w + this.step; x += this.step) {
        var y = this.yAt(row, x, t);
        x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = row.stroke;
      ctx.lineWidth = row.width;
      ctx.stroke();
    }

    // brilhos que descem o rio
    ctx.globalCompositeOperation = 'lighter';
    for (var g = 0; g < this.glints.length; g++) {
      var gl = this.glints[g];
      if (!reduce) gl.x += gl.v * dt * this.speed;
      if (gl.x > 1.08) { this.glints[g] = this.newGlint(false); continue; }
      var r = this.rows[Math.min(gl.line, this.rows.length - 1)];
      var gx = gl.x * this.w, gy = this.yAt(r, gx, t);
      var tw = 0.55 + 0.45 * Math.sin(t * 2.2 + gl.phase);
      var edge = Math.min(1, gl.x * 6, (1.08 - gl.x) * 6);
      ctx.globalAlpha = Math.max(0, tw * edge * this.intensity * (0.35 + 0.65 * r.d));
      var s = gl.size * (0.6 + 0.4 * r.d);
      ctx.drawImage(GLINT, gx - s / 2, gy - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  River.prototype.start = function () {
    if (reduce) { this.draw(0); return; }
    if (this.running) return;
    this.running = true;
    var self = this;
    this.last = performance.now();
    (function loop(now) {
      if (!self.running) return;
      var dt = Math.min(0.05, (now - self.last) / 1000);
      self.last = now;
      self.t += dt * self.speed;
      self.draw(dt);
      self.raf = requestAnimationFrame(loop);
    })(this.last);
  };

  River.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  window.WMRiver = River;
})();

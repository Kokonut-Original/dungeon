/* 30-fx: cảm giác đánh — hạt, rung màn hình, khựng, chữ sát thương, nháy màn hình, vòng nổ */
const FX = {
  parts: [], numbers: [], rings: [], tempLights: [], trauma: 0, screenFlash: null, quality: "high",

  /** hạt pixel: o = {n, color, speed, life, size, gravity, spread, ang} */
  particles(x, y, o) {
    const max = this.quality === "low" ? 150 : CONFIG.MAX_PARTICLES;
    for (let i = 0; i < o.n; i++) {
      if (this.parts.length >= max) this.parts.shift();
      const a = o.ang != null ? o.ang + rand(-(o.spread || 0.6), o.spread || 0.6) : rand(0, TAU), sp = rand(0.3, 1) * (o.speed || 60);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rand(0.6, 1) * (o.life || 0.4),
        color: o.color || "#fff", size: o.size || (Math.random() < 0.3 ? 2 : 1), g: o.gravity || 0, add: !!o.add });
    }
  },
  /** rung kiểu trauma (0..1), độ rung = trauma² */
  shake(t) { if (GAME.settings.shake) this.trauma = Math.min(1, this.trauma + t); },
  hitstop(t) { GAME.hitstop = Math.max(GAME.hitstop, t); },
  number(x, y, val, kind) {
    if (!GAME.settings.numbers) return;
    this.numbers.push({ x, y, val: Math.round(val), kind, t: 0, vx: rand(-15, 15), vy: -55 });
  },
  flashScreen(color, t) { this.screenFlash = { color, t, dur: t }; },
  flashLight(x, y, r, t, color = "#fff2c8") { this.tempLights.push({ x, y, r, t, dur: t, color }); },
  ring(x, y, r, color, t) { this.rings.push({ x, y, r, color, t: 0, dur: t }); },
  lines: [],
  /** tia sét gấp khúc */
  bolt(x1, y1, x2, y2, color) {
    const pts = [[x1, y1]], n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 10));
    for (let i = 1; i < n; i++) pts.push([lerp(x1, x2, i / n) + rand(-5, 5, Math.random), lerp(y1, y2, i / n) + rand(-5, 5, Math.random)]);
    pts.push([x2, y2]); this.lines.push({ pts, color, w: 2, t: 0, dur: 0.18 }); this.flashLight(x2, y2, 40, 0.15, color);
  },
  /** tia thẳng (mũi tên xuyên, ăn mòn) */
  beam(x1, y1, x2, y2, color, w = 3) { this.lines.push({ pts: [[x1, y1], [x2, y2]], color, w, t: 0, dur: 0.22 }); this.flashLight(x1, y1, 40, 0.15, color); },
  explosion(x, y, r, color) {
    this.ring(x, y, r, color, 0.3); this.ring(x, y, r * 0.6, "#fff6d0", 0.18);
    this.particles(x, y, { n: 26, color, speed: r * 5, life: 0.5, size: 2 });
    this.particles(x, y, { n: 10, color: "#3a3040", speed: r * 2, life: 0.8, size: 3, gravity: -30 });
    this.flashLight(x, y, r * 2.4, 0.25, color); this.shake(0.4); this.hitstop(0.05);
  },
  deathBurst(e) {
    const c = e.tint || (PH_STYLE[e.sprite] ? PH_STYLE[e.sprite][0] : "#a08cff");
    this.particles(e.x, e.y - 6, { n: 18, color: c, speed: 120, life: 0.55, size: 2, gravity: 160 });
    this.particles(e.x, e.y - 6, { n: 8, color: "#ffffff", speed: 70, life: 0.25, size: 1 });
    this.ring(e.x, e.y - 4, 14, "#ffffff", 0.18);
  },

  update(dt) {
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= Math.pow(0.08, dt); p.vy *= p.g ? 1 : Math.pow(0.08, dt); }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const n of this.numbers) { n.t += dt; n.x += n.vx * dt; n.y += n.vy * dt; n.vy += 140 * dt; }
    this.numbers = this.numbers.filter(n => n.t < 0.8);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < r.dur);
    for (const l of this.lines) l.t += dt; this.lines = this.lines.filter(l => l.t < l.dur);
    for (const l of this.tempLights) l.t -= dt; this.tempLights = this.tempLights.filter(l => l.t > 0);
    this.trauma = Math.max(0, this.trauma - dt * 2.4);
    if (this.screenFlash) { this.screenFlash.t -= dt; if (this.screenFlash.t <= 0) this.screenFlash = null; }
  },
  /** độ rung = trauma² × biên độ; biên độ chỉnh trong Cài đặt (0 = tắt, mặc định 3px) */
  shakeOffset() { const s = this.trauma * this.trauma * (GAME.settings.shakeAmp == null ? 3 : GAME.settings.shakeAmp); return [Math.round(rand(-s, s, Math.random)), Math.round(rand(-s, s, Math.random))]; },

  /** vẽ hạt và vòng trên canvas thế giới (toạ độ đã trừ camera) */
  renderWorld(ctx) {
    for (const p of this.parts) {
      ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const k = r.t / r.dur; ctx.strokeStyle = r.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = Math.max(1, 3 * (1 - k));
      ctx.beginPath(); ctx.arc(Math.round(r.x), Math.round(r.y), r.r * (0.4 + 0.6 * k), 0, TAU); ctx.stroke();
    }
    for (const l of this.lines) {
      const k = 1 - l.t / l.dur; ctx.globalAlpha = k; ctx.lineCap = "round";
      for (const [w, c] of [[l.w + 3, l.color], [Math.max(1, l.w - 1), "#ffffff"]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w * (0.5 + 0.5 * k); ctx.globalAlpha = k * (c === "#ffffff" ? 1 : 0.6);
        ctx.beginPath(); l.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  },

  /** chữ sát thương trên uiCanvas: toScreen(x,y) -> [sx, sy], s = tỉ lệ phóng */
  renderNumbers(g, toScreen, s) {
    const COLORS = { phys: "#ffffff", spell: "#8fd0ff", crit: "#ffd23d", heal: "#5cf28a", hurt: "#ff5a6a", dot: "#d08cff" };
    g.textAlign = "center"; g.textBaseline = "middle";
    for (const n of this.numbers) {
      const [sx, sy] = toScreen(n.x, n.y), k = n.t / 0.8;
      const pop = n.t < 0.08 ? 1.5 - n.t / 0.08 * 0.5 : 1;
      const size = (n.kind === "crit" ? 13 : 9) * s * 0.5 * pop + 8;
      g.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      g.font = `${Math.round(size)}px VT323, monospace`;
      const txt = (n.kind === "heal" ? "+" : "") + n.val + (n.kind === "crit" ? "!" : "");
      g.lineWidth = Math.max(3, s * 0.9); g.strokeStyle = "#000"; g.strokeText(txt, sx, sy);
      g.fillStyle = COLORS[n.kind] || "#fff"; g.fillText(txt, sx, sy);
    }
    g.globalAlpha = 1;
  },
};

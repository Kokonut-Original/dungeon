/* 31-light: lớp tối + nguồn sáng (GDD 13.7) */
const Light = {
  canvas: null, ctx: null, grads: new Map(),

  init(w, h) {
    this.canvas = document.createElement("canvas"); this.canvas.width = w; this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d");
  },
  /** sprite gradient tròn (cache theo bán kính) */
  sprite(r) {
    r = Math.max(4, Math.round(r / 4) * 4);
    let c = this.grads.get(r); if (c) return c;
    c = document.createElement("canvas"); c.width = c.height = r * 2;
    const g = c.getContext("2d"), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); this.grads.set(r, c); return c;
  },
  /** vẽ lớp tối lên ctx (đã ở toạ độ màn hình); lights: [{x,y,r,flicker,color}] theo toạ độ thế giới */
  render(ctx, world, camX, camY, ambient) {
    const L = this.ctx, w = this.canvas.width, h = this.canvas.height, t = GAME.time;
    L.globalCompositeOperation = "source-over"; L.clearRect(0, 0, w, h);
    L.fillStyle = `rgba(6,3,14,${ambient})`; L.fillRect(0, 0, w, h);
    L.globalCompositeOperation = "destination-out";
    const all = [];
    if (world.player) all.push({ x: world.player.x, y: world.player.y - 6, r: CONFIG.PLAYER_LIGHT * (world.player.lightMult || 1) });
    for (const l of world.lights) all.push(l);
    for (const p of world.projs) if (!p.dead && p.glow) all.push({ x: p.x, y: p.y, r: 22 });
    for (const l of FX.tempLights) all.push({ x: l.x, y: l.y, r: l.r * (l.t / l.dur) });
    for (const l of all) {
      const r = l.r * (l.flicker ? 0.92 + Math.sin(t * 9 + l.x) * 0.05 + Math.random() * 0.03 : 1);
      const sx = l.x - camX, sy = l.y - camY; if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      L.drawImage(this.sprite(r), Math.round(sx - r), Math.round(sy - r), r * 2, r * 2);
    }
    ctx.drawImage(this.canvas, 0, 0);
    // vầng sáng màu cộng thêm (đuốc ấm, đạn phép)
    if (FX.quality !== "low") {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const l of world.lights) { const s = this.sprite(l.r * 0.5); ctx.globalAlpha = 0.16; ctx.drawImage(tintGlow(s, l.color || "#ffb35a"), Math.round(l.x - camX - l.r * 0.5), Math.round(l.y - camY - l.r * 0.5)); }
      for (const p of world.projs) if (!p.dead && p.glow) { const s = this.sprite(14); ctx.globalAlpha = 0.5; ctx.drawImage(tintGlow(s, p.color), Math.round(p.x - camX - 14), Math.round(p.y - camY - 14)); }
      for (const l of FX.tempLights) { const s = this.sprite(l.r); ctx.globalAlpha = 0.35 * l.t / l.dur; ctx.drawImage(tintGlow(s, l.color), Math.round(l.x - camX - l.r), Math.round(l.y - camY - l.r)); }
      ctx.restore();
    }
  },
};
const _glowCache = new Map();
function tintGlow(src, color) {
  const k = src.width + color; let c = _glowCache.get(k); if (c) return c;
  c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  _glowCache.set(k, c); return c;
}

/* 32-render: vẽ thế giới — nền/tường pixel (cache), cửa, gai, vật thể, bóng đổ, thực thể sắp theo y,
   vệt chém, báo nguy hiểm, ánh sáng. Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const DEFAULT_THEME = { floor: ["#2a2238", "#2e2540", "#272034"], floorLine: "#1e1828", wallTop: "#4a3d63", wallFace: "#362b4c",
  wallLine: "#281f3a", core: "#140f1e", water: "#14304a", accent: "#7a5cff" };
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const Render = {
  floorCache: null,

  /** vẽ toàn bộ nền + tường vào canvas phụ (khi đổi tầng) */
  buildFloor(world) {
    const c = this.floorCache && this.floorCache.width === world.pw && this.floorCache.height === world.ph ? this.floorCache : document.createElement("canvas");
    c.width = world.pw; c.height = world.ph; this.floorCache = c;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    g.fillStyle = (world.theme || DEFAULT_THEME).core; g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) this.drawTileAt(g, world, x, y);
    world.dirty = false; world.cacheFor = world;
  },
  /** vẽ lại vài ô (cửa đóng/mở, thùng vỡ) mà không dựng lại cả tầng */
  redrawAround(world, tiles) {
    const g = this.floorCache.getContext("2d");
    const done = new Set();
    for (const [tx, ty] of tiles) for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = tx + dx, y = ty + dy, k = x + "," + y; if (done.has(k) || x < 0 || y < 0 || x >= world.w || y >= world.h) continue;
      done.add(k); this.drawTileAt(g, world, x, y);
    }
  },

  drawTileAt(g, world, x, y) {
    const th = world.theme || DEFAULT_THEME, ch = world.tiles[y][x], px = x * T, py = y * T, r = hash2(x, y);
    const below = tileAt(world, x, y + 1), above = tileAt(world, x, y - 1);
    if (ch === "d") {                                              // cửa gỗ nhà (thị trấn)
      g.fillStyle = th.wallFace; g.fillRect(px, py, T, T);
      g.fillStyle = "#000"; g.fillRect(px + 1, py + 2, T - 2, T - 2);
      g.fillStyle = "#7a4a24"; g.fillRect(px + 2, py + 3, T - 4, T - 3);
      g.fillStyle = "#a8743c"; for (let i = 0; i < 3; i++) g.fillRect(px + 3 + i * 4, py + 3, 2, T - 3);
      g.fillStyle = "#ffd23d"; g.fillRect(tileAt(world, x + 1, y) === "d" ? px + T - 4 : px + 3, py + 9, 1, 2);
      return;
    }
    if (ch === "H") {                                              // mái ngói nhà (thị trấn)
      const roofTop = tileAt(world, x, y - 1) !== "H", c1 = th.roof || "#9a3a2e", c2 = th.roofDark || "#6a2420";
      g.fillStyle = c2; g.fillRect(px, py, T, T);
      g.fillStyle = c1; for (let i = 0; i < 4; i++) g.fillRect(px + ((i + y) % 2 ? 0 : 4), py + i * 4, T, 3);
      g.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) g.fillRect(px + ((i + y) % 2 ? 7 : 3) + k * 8, py + i * 4, 1, 3);
      if (roofTop) { g.fillStyle = "#c86a4a"; g.fillRect(px, py, T, 2); }
      if (tileAt(world, x - 1, y) !== "H") { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(px, py, 2, T); }
      if (tileAt(world, x + 1, y) !== "H") { g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(px + T - 2, py, 2, T); }
      return;
    }
    if (ch === "#" || ch === "T") {
      g.fillStyle = th.core; g.fillRect(px, py, T, T);
      const faceVisible = !NO_WALK.has(below) || below === "~" || below === "D";
      if (faceVisible) {                                          // mặt tường gạch
        if (!drawTile(g, "wall_mid", px, py)) {
          g.fillStyle = th.wallFace; g.fillRect(px, py, T, T);
          g.fillStyle = th.wallLine;
          for (let i = 0; i < 3; i++) { g.fillRect(px, py + 5 + i * 5, T, 1); const off = (i + x) % 2 ? 4 : 11; g.fillRect(px + off, py + i * 5, 1, 5); }
          g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(px, py + 1, T, 1);
          g.fillStyle = th.wallTop; g.fillRect(px, py, T, 2);
          g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(px, py + T - 2, T, 2);
          if (r > 0.85) { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(px + 3 + Math.floor(r * 9), py + 7, 2, 2); }
        }
      } else if (!NO_WALK.has(above) || (above !== "#" && above !== "T")) {   // mép trên của khối tường
        g.fillStyle = th.wallTop; g.fillRect(px, py, T, 3); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(px, py + 3, T, 1);
      }
      // viền tường hai bên khi cạnh là sàn
      const open = t => !NO_WALK.has(t) || t === "~" || t === "D";
      const L = open(tileAt(world, x - 1, y)), Rr = open(tileAt(world, x + 1, y));
      if ((L || Rr) && !faceVisible) {
        g.fillStyle = th.wallFace; if (Rr) g.fillRect(px + T - 4, py, 4, T); if (L) g.fillRect(px, py, 4, T);
        g.fillStyle = th.wallTop; if (Rr) g.fillRect(px + T - 4, py, 1, T); if (L) g.fillRect(px + 3, py, 1, T);
      }
      if (ch === "T") this.drawTorchBase(g, px, py);
      return;
    }
    // sàn lát đá
    if (!drawTile(g, "floor_" + (1 + Math.floor(r * 3)), px, py)) {
      g.fillStyle = th.floor[Math.floor(r * th.floor.length)]; g.fillRect(px, py, T, T);
      g.fillStyle = th.floorLine; g.fillRect(px, py + T - 1, T, 1); g.fillRect(px + T - 1, py, 1, T);
      g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(px, py, T - 1, 1);
      if (r > 0.78) { g.fillStyle = "rgba(0,0,0,.22)"; const cx = 3 + Math.floor(r * 50) % 9; g.fillRect(px + cx, py + 6, 3, 1); g.fillRect(px + cx + 2, py + 7, 2, 1); }
      if (r < 0.08) { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(px + 5, py + 9, 2, 2); }
    }
    if (ch === "~") { g.fillStyle = th.water; g.fillRect(px, py, T, T); g.fillStyle = "rgba(0,0,0,.35)"; if (above !== "~") g.fillRect(px, py, T, 3); g.fillStyle = "rgba(140,210,255,.18)"; g.fillRect(px + 2 + Math.floor(r * 6), py + 7 + (x % 3), 5, 1); }
    if (ch === "=") {                                            // đường ray
      g.fillStyle = "#4a3426"; for (let i = 0; i < 3; i++) g.fillRect(px + 1 + i * 5, py + 3, 3, 10);
      g.fillStyle = "#8a8f9a"; g.fillRect(px, py + 4, T, 2); g.fillRect(px, py + 10, T, 2);
      g.fillStyle = "#c8ccd6"; g.fillRect(px, py + 4, T, 1); g.fillRect(px, py + 10, T, 1);
    }
    if (ch === "^") { g.fillStyle = "rgba(0,0,0,.35)"; for (let i = 0; i < 4; i++) g.fillRect(px + 2 + (i % 2) * 7, py + 3 + Math.floor(i / 2) * 7, 3, 3); }
    if (ch === "D") this.drawDoor(g, px, py, x, y, world);
    if (ch === "o") this.drawColumn(g, px, py, th);
    if (ch === "c") this.drawCrate(g, px, py);
    if (above === "#" || above === "T") { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(px, py, T, 4); }   // bóng tường
  },
  drawDoor(g, px, py, x, y, world) {
    g.fillStyle = "#1a1220"; g.fillRect(px, py, T, T);
    const vert = tileAt(world, x, y - 1) === "D" || tileAt(world, x, y + 1) === "D";
    g.fillStyle = "#5a4a3a"; g.fillRect(px + 1, py + 1, T - 2, T - 2);
    g.fillStyle = "#8a8f9a";
    if (vert) for (let i = 0; i < 3; i++) g.fillRect(px + 2, py + 2 + i * 5, T - 4, 2);
    else for (let i = 0; i < 3; i++) g.fillRect(px + 2 + i * 5, py + 1, 2, T - 2);
    g.fillStyle = "#c8ccd6"; if (vert) g.fillRect(px + 2, py + 2, T - 4, 1); else g.fillRect(px + 2, py + 1, 1, T - 2);
    g.fillStyle = "rgba(255,80,60,.35)"; g.fillRect(px, py, T, 1); g.fillRect(px, py + T - 1, T, 1);
  },
  drawColumn(g, px, py, th = DEFAULT_THEME) {
    if (drawTile(g, "column_mid", px, py)) return;
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(px + 1, py + 12, 14, 4);
    g.fillStyle = "#000"; g.fillRect(px + 2, py - 7, 12, 19);
    g.fillStyle = th.wallFace; g.fillRect(px + 3, py - 6, 10, 17);
    g.fillStyle = th.wallTop; g.fillRect(px + 3, py - 6, 10, 3);
    g.fillStyle = th.wallLine; g.fillRect(px + 10, py - 3, 3, 14); g.fillRect(px + 3, py + 2, 7, 1); g.fillRect(px + 3, py + 7, 7, 1);
  },
  drawCrate(g, px, py) {
    if (drawTile(g, "crate", px, py)) return;
    g.fillStyle = "#000"; g.fillRect(px + 1, py + 1, 14, 14);
    g.fillStyle = "#8a5a2e"; g.fillRect(px + 2, py + 2, 12, 12);
    g.fillStyle = "#a8743c"; g.fillRect(px + 2, py + 2, 12, 2); g.fillRect(px + 2, py + 7, 12, 2);
    g.fillStyle = "#5e3b1c"; g.fillRect(px + 2, py + 12, 12, 2); g.fillRect(px + 3, py + 4, 1, 3); g.fillRect(px + 12, py + 9, 1, 3);
  },
  drawTorchBase(g, px, py) { g.fillStyle = "#000"; g.fillRect(px + 6, py + 6, 4, 8); g.fillStyle = "#6a4a2a"; g.fillRect(px + 7, py + 7, 2, 6); },

  /** vẽ toàn cảnh lên ctx thế giới */
  world(ctx, world, camX, camY, ambient) {
    if (!this.floorCache || world.cacheFor !== world) this.buildFloor(world);
    else if (world.dirty) { this.redrawAround(world, world.dirtyTiles || []); world.dirtyTiles = []; world.dirty = false; }
    const W = GAME.view.w, H = GAME.view.h;
    ctx.fillStyle = (world.theme || DEFAULT_THEME).core; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.floorCache, -Math.round(camX), -Math.round(camY));
    ctx.save(); ctx.translate(-Math.round(camX), -Math.round(camY));
    const vx0 = camX - 32, vy0 = camY - 32, vx1 = camX + W + 32, vy1 = camY + H + 32, inView = e => e.x > vx0 && e.x < vx1 && e.y > vy0 && e.y < vy1;

    this.drawSpikes(ctx, world, camX, camY, W, H);
    for (const l of world.lights) if (l.flicker && inView(l)) this.drawFlame(ctx, l.x, l.y - 10);
    for (const h of world.hazards) if (!h.dead) this.drawHazard(ctx, h);
    for (const e of world.enemies) if (!e.dead && e.aiState === "spawn") this.drawSpawnMark(ctx, e);
    for (const e of world.enemies) if (!e.dead && e.tele) this.drawTele(ctx, e);

    // thực thể + vật thể sắp xếp theo y
    const list = [];
    for (const k of world.pickups) if (!k.dead && inView(k)) list.push(k);
    for (const pr of world.props) if (inView(pr)) list.push(pr);
    for (const e of world.enemies) if (!e.dead && e.aiState !== "spawn" && inView(e)) list.push(e);
    if (world.player && !world.player.dead) list.push(world.player);
    list.sort((a, b) => a.y - b.y);
    for (const e of list) if (e.kind !== "pickup" || e.pkind !== "item") this.shadow(ctx, e);
    for (const e of list) {
      if (e.kind === "pickup") this.drawPickup(ctx, e);
      else if (e.kind === "player") this.drawPlayer(ctx, e);
      else if (e.kind === "enemy" || e.kind === "npc") this.drawEnemy(ctx, e);
      else this.drawProp(ctx, e);
    }
    for (const h of world.hazards) if (!h.dead && (h.hkind === "lob" || h.hkind === "cart")) this.drawHazardTop(ctx, h);
    for (const p of world.projs) if (!p.dead) this.drawProj(ctx, p);
    FX.renderWorld(ctx);
    ctx.restore();

    Light.render(ctx, world, Math.round(camX), Math.round(camY), ambient);
    if (FX.screenFlash) { ctx.fillStyle = FX.screenFlash.color; ctx.globalAlpha = FX.screenFlash.t / FX.screenFlash.dur; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  },

  drawSpikes(ctx, world, camX, camY, W, H) {
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(world.w - 1, Math.ceil((camX + W) / T)), y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(world.h - 1, Math.ceil((camY + H) / T));
    const up = world.spikesUp, warn = !up && world.spikeT > 1.1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (world.tiles[y][x] !== "^") continue;
      const px = x * T, py = y * T;
      for (let i = 0; i < 4; i++) {
        const sx = px + 2 + (i % 2) * 7, sy = py + 3 + Math.floor(i / 2) * 7;
        if (up) { ctx.fillStyle = "#000"; ctx.fillRect(sx, sy - 3, 3, 6); ctx.fillStyle = "#c8ccd6"; ctx.fillRect(sx + 1, sy - 3, 1, 5); ctx.fillStyle = "#e8ecf6"; ctx.fillRect(sx + 1, sy - 3, 1, 1); }
        else if (warn) { ctx.fillStyle = "#8a8f9a"; ctx.fillRect(sx + 1, sy, 1, 1); }
      }
    }
  },

  shadow(ctx, e) {
    const r = (e.kind === "pickup" ? 3 : e.kind === "prop" ? 7 : e.r + 1) * (e.scale || 1);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(Math.round(e.x), Math.round(e.y), r, r * 0.45, 0, 0, TAU); ctx.fill();
  },
  drawPlayer(ctx, p) {
    if (p.iframes > 0 && p.dodgeT <= 0 && Math.floor(p.iframes * 20) % 2 === 0) return;
    const moving = p.moving && p.dodgeT <= 0, base = p.sprite + (moving ? "_run_anim" : "_idle_anim");
    const fr = animFrame(base, p.animT, moving ? 12 : 6), roll = p.dodgeT > 0;
    ctx.save();
    if (roll) { ctx.translate(Math.round(p.x), Math.round(p.y - 8)); ctx.rotate((1 - p.dodgeT / CONFIG.DODGE_T) * TAU * (p.dodgeDx < 0 ? -1 : 1)); ctx.translate(-Math.round(p.x), -Math.round(p.y - 8)); }
    const behind = Math.sin(p.aim) < -0.3;
    const wx = p.x + Math.cos(p.aim) * 5, wy = p.y - 7 + Math.sin(p.aim) * 3;
    const swingOff = p.swing ? Math.sin(p.swing.t / p.swing.dur * Math.PI) * 1.4 * (p.swing.dir || 1) : 0;
    const A = p.active || {}, whirl = A.whirl;
    if (A.twin) drawSprite(ctx, base, fr, p.x - 14, p.y, { flip: p.flip, tint: "#3a2a6a", tintAmt: 0.8, alpha: 0.55 });   // Bóng Đôi
    const alpha = p.invisT > 0 ? 0.35 : 1;
    const wAng = whirl ? p.whirlAng : p.aim + swingOff;
    if (behind && !roll && !whirl) drawWeapon(ctx, WEAPON_SPRITE[p.weapon.wtype], wx, wy, wAng, { len: 14 });
    drawSprite(ctx, base, fr, p.x, p.y, { flip: whirl ? Math.sin(p.whirlAng * 0.5) > 0 : p.flip, flash: p.flash, alpha });
    if ((!behind || whirl) && !roll) drawWeapon(ctx, WEAPON_SPRITE[p.weapon.wtype], whirl ? p.x + Math.cos(wAng) * 8 : wx, whirl ? p.y - 7 + Math.sin(wAng) * 5 : wy, wAng, { len: 14 });
    ctx.restore();
    if (whirl) { ctx.strokeStyle = "rgba(220,230,255,.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 26, p.whirlAng, p.whirlAng + 4); ctx.stroke(); }
    if (p.shield > 0) { ctx.strokeStyle = `rgba(216,200,160,${0.5 + 0.2 * Math.sin(GAME.time * 8)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 9, 11, 13, 0, 0, TAU); ctx.stroke(); }
    if (A.pact) { ctx.fillStyle = "rgba(255,40,70,.25)"; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 4, 0, 0, TAU); ctx.fill(); }
    for (const o of p.orbiters || []) {
      if (o.kind === "wisp") { ctx.fillStyle = "#000"; ctx.fillRect(Math.round(o.x) - 2, Math.round(o.y) - 2, 4, 4); ctx.fillStyle = o.color; ctx.fillRect(Math.round(o.x) - 1, Math.round(o.y) - 1, 3, 3); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(o.x), Math.round(o.y) - 1, 1, 1); }
      else drawWeapon(ctx, "weapon_rusty_sword", o.x, o.y + 6, o.ang + Math.PI / 2, {});
    }
    if (p.swing) this.drawSwing(ctx, p.x, p.y - 6, p.swing, "#fff8e0");
  },
  drawEnemy(ctx, e) {
    const base = e.sprite + (e.moving ? "_run_anim" : "_idle_anim"), fr = animFrame(base, e.animT, e.moving ? 10 : 6);
    const tint = e.elite ? "#ffd23d" : e.invuln > 0 ? "#9ad0ff" : e.tint;
    if (e.elite) { ctx.fillStyle = "rgba(255,210,61,.25)"; ctx.beginPath(); ctx.arc(e.x, e.y - 6, e.r + 6, 0, TAU); ctx.fill(); }
    if (e.isBoss || e.miniboss) { ctx.strokeStyle = e.isBoss ? "rgba(255,80,80,.5)" : "rgba(122,240,255,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + 6, (e.r + 6) * 0.45, 0, 0, TAU); ctx.stroke(); }
    const bob = e.status.stun ? Math.sin(GAME.time * 30) : 0;
    drawSprite(ctx, base, fr, e.x + bob, e.y, { flip: e.flip, flash: e.flash, tint, tintAmt: e.elite ? 0.3 : 0.4, scale: e.scale });
    if (e.def.weapon) {                                      // vũ khí boss
      const ang = e.tele && e.tele.ang != null ? e.tele.ang : (e.facing || 0);
      drawWeapon(ctx, e.def.weapon, e.x + (e.flip ? -12 : 12), e.y - 14, e.tele ? -Math.PI / 2 + (e.flip ? -0.5 : 0.5) : ang * 0.2 + (e.flip ? -0.6 : 0.6), {});
    }
    if (e.status.stun) for (let i = 0; i < 3; i++) { const a = GAME.time * 4 + i * 2.1; ctx.fillStyle = "#ffd23d"; ctx.fillRect(Math.round(e.x + Math.cos(a) * 8), Math.round(e.y - 22 * e.scale + Math.sin(a) * 2), 2, 2); }
    if (e.swing) this.drawSwing(ctx, e.x, e.y - 4, e.swing, "#ff6a6a");
    if (e.hp < e.maxHp && !e.isBoss) {
      const w = 14 * (e.scale || 1), x = Math.round(e.x - w / 2), y = Math.round(e.y - 18 * (e.scale || 1) - 3);
      ctx.fillStyle = "#000"; ctx.fillRect(x - 1, y - 1, w + 2, 4);
      ctx.fillStyle = "#5a1020"; ctx.fillRect(x, y, w, 2);
      ctx.fillStyle = e.elite ? "#ffd23d" : e.miniboss ? "#7af0ff" : "#ff4a5a"; ctx.fillRect(x, y, Math.ceil(w * e.hp / e.maxHp), 2);
    }
  },
  drawSwing(ctx, x, y, s, color) {
    const k = s.t / s.dur, a = s.arc * Math.PI / 180;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineCap = "round";
    if (s.kind === "thrust") { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(s.ang) * s.range, y + Math.sin(s.ang) * s.range); ctx.stroke(); }
    else for (let i = 0; i < 3; i++) {
      ctx.lineWidth = (s.big ? 5 : 3) - i; ctx.globalAlpha = (1 - k) * (1 - i * 0.3);
      ctx.beginPath(); ctx.arc(x, y, s.range - 2 - i * 3, s.ang - a / 2, s.ang + a / 2); ctx.stroke();
    }
    ctx.restore();
  },
  drawTele(ctx, e) {
    const t = e.tele; ctx.save();
    if (t.kind === "arc") {
      const a = t.arc * Math.PI / 180; ctx.fillStyle = `rgba(255,40,40,${0.15 + 0.25 * t.t})`;
      ctx.beginPath(); ctx.moveTo(e.x, e.y - 4); ctx.arc(e.x, e.y - 4, t.range * Math.min(1, 0.3 + t.t), t.ang - a / 2, t.ang + a / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,80,80,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y - 4, t.range, t.ang - a / 2, t.ang + a / 2); ctx.stroke();
    } else if (t.kind === "circle") {
      ctx.fillStyle = `rgba(255,60,30,${0.12 + 0.25 * t.t})`; ctx.beginPath(); ctx.arc(e.x, e.y, t.r * t.t, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(255,90,60,.9)"; ctx.beginPath(); ctx.arc(e.x, e.y, t.r, 0, TAU); ctx.stroke();
    } else if (t.kind === "glow") {
      ctx.fillStyle = `rgba(255,90,90,${0.5 * Math.min(1, t.t)})`; ctx.beginPath(); ctx.arc(e.x, e.y - 6 * (e.scale || 1), 3 + 6 * Math.min(1, t.t), 0, TAU); ctx.fill();
    } else if (t.kind === "dash") {
      ctx.strokeStyle = `rgba(255,60,60,${0.4 + 0.3 * Math.sin(GAME.time * 30)})`; ctx.lineWidth = e.r * 1.6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(e.x, e.y - 4); ctx.lineTo(e.x + Math.cos(t.ang) * t.len, e.y - 4 + Math.sin(t.ang) * t.len); ctx.stroke();
    }
    ctx.restore();
  },
  drawHazard(ctx, h) {
    const k = h.delay ? Math.min(1, h.t / h.delay) : 1;
    if ((h.hkind === "circle" || h.hkind === "lob") && !h.triggered && h.team === 0) {      // vòng phép của người chơi: màu phép, không đỏ
      ctx.strokeStyle = h.color; ctx.globalAlpha = 0.5 + 0.4 * k; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (1.2 - 0.2 * k), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    } else if ((h.hkind === "circle" || h.hkind === "lob") && !h.triggered) {
      ctx.fillStyle = `rgba(255,50,40,${0.12 + 0.2 * k})`; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(255,90,70,.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
    } else if (h.hkind === "line" && !h.triggered) {
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.ang);
      ctx.fillStyle = `rgba(255,50,40,${0.12 + 0.22 * k})`; ctx.fillRect(0, -h.width / 2, h.len * Math.min(1, 0.25 + k), h.width);
      ctx.strokeStyle = "rgba(255,90,70,.85)"; ctx.lineWidth = 1; ctx.strokeRect(0, -h.width / 2, h.len, h.width); ctx.restore();
    } else if (h.hkind === "zone") {
      const fade = Math.min(1, (h.life - h.t) * 2);
      if (h.sub === "fire") {
        ctx.fillStyle = `rgba(255,110,30,${0.22 * fade})`; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + h.t * 2, d = h.r * (0.3 + 0.5 * hash2(i, h.id.length)); const fl = 2 + Math.sin(h.t * 14 + i) * 1.5;
          ctx.fillStyle = i % 2 ? "#ffb32a" : "#ff6a1a"; ctx.globalAlpha = fade; ctx.fillRect(Math.round(h.x + Math.cos(a) * d), Math.round(h.y + Math.sin(a) * d * 0.6 - fl), 2, Math.round(fl + 2)); }
        ctx.globalAlpha = 1;
      } else if (h.sub === "hole") {
        for (let i = 0; i < 4; i++) { ctx.strokeStyle = `rgba(154,106,255,${0.5 * fade})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (1 - ((h.t * 0.8 + i * 0.25) % 1)), 0, TAU); ctx.stroke(); }
        ctx.fillStyle = `rgba(10,0,20,${0.9 * fade})`; ctx.beginPath(); ctx.arc(h.x, h.y, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#c9a0ff"; ctx.beginPath(); ctx.arc(h.x, h.y, 10, h.t * 6, h.t * 6 + 4); ctx.stroke();
      } else if (h.sub === "poison") {
        ctx.fillStyle = `rgba(110,220,80,${0.22 * fade})`; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
        for (let i = 0; i < 6; i++) { const a = i + h.t * 0.6, d = h.r * 0.6; ctx.fillStyle = `rgba(160,255,120,${0.25 * fade})`; ctx.beginPath(); ctx.arc(h.x + Math.cos(a) * d * Math.sin(i), h.y + Math.sin(a) * d * 0.5, 8, 0, TAU); ctx.fill(); }
      } else if (h.sub === "ink") { ctx.fillStyle = `rgba(40,30,80,${0.45 * fade})`; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = `rgba(120,200,90,${0.35 * fade})`; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, TAU); ctx.fill(); }
    } else if (h.hkind === "cart" && h.t < h.delay) {
      ctx.fillStyle = `rgba(255,50,40,${0.12 + 0.2 * k})`; ctx.fillRect(h.lane.x0, h.y - 9, h.lane.x1 - h.lane.x0, 18);
      ctx.strokeStyle = "rgba(255,90,70,.7)"; ctx.strokeRect(h.lane.x0, h.y - 9, h.lane.x1 - h.lane.x0, 18);
    }
  },
  /** vật bay (đá, đèn lồng) và xe goòng vẽ trên cùng */
  drawHazardTop(ctx, h) {
    if (h.hkind === "lob" && !h.triggered) {
      const k = Math.min(1, h.t / h.delay), x = lerp(h.fromX, h.x, k), y = lerp(h.fromY, h.y, k) - Math.sin(k * Math.PI) * 40;
      drawSprite(ctx, h.sprite || "rock", 0, x, y + 3, {});
    } else if (h.hkind === "cart" && h.t >= h.delay) drawSprite(ctx, "cart", 0, h.x, h.y + 6, { flip: h.vx < 0 });
  },
  drawSpawnMark(ctx, e) {
    const k = clamp(e.aiT / CONFIG.SPAWN_TELEGRAPH, 0, 1), s = e.scale || 1;
    ctx.strokeStyle = `rgba(200,150,255,${0.4 + 0.6 * k})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 10 * s * (1.4 - k * 0.4), 5 * s * (1.4 - k * 0.4), 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(180,120,255,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, 8 * s, 4 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(220,190,255,.8)"; for (let i = 0; i < 2; i++) ctx.fillRect(Math.round(e.x + rand(-8, 8, Math.random)), Math.round(e.y - rand(0, 16 * k, Math.random)), 1, 2);
  },
  drawProj(ctx, p) {
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.shape === "axe") { drawWeapon(ctx, "weapon_hammer", x, y + 5, p.animT * 20, {}); return; }
    if (p.shape === "arrow") {
      const a = Math.atan2(p.vy, p.vx); ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = "#000"; ctx.fillRect(-7, -1, 11, 3); ctx.fillStyle = "#e8d8b0"; ctx.fillRect(-6, 0, 9, 1); ctx.fillStyle = "#fff"; ctx.fillRect(3, -1, 2, 3);
      ctx.restore(); return;
    }
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x, y, p.r + 1, 0, TAU); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, y, p.r, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, y - 1, 2, 2);
  },
  drawPickup(ctx, k) {
    const bob = Math.round(Math.sin(k.animT * 6) * 1.5);
    if (k.pkind === "gold") {
      if (Assets.has("coin_anim")) { drawSprite(ctx, "coin_anim", animFrame("coin_anim", k.animT, 10), k.x, k.y + bob + 4); return; }
      ctx.fillStyle = "#000"; ctx.fillRect(Math.round(k.x) - 3, Math.round(k.y) - 4 + bob, 6, 6);
      ctx.fillStyle = "#ffcf3d"; ctx.fillRect(Math.round(k.x) - 2, Math.round(k.y) - 3 + bob, 4, 4);
      ctx.fillStyle = "#fff6c0"; ctx.fillRect(Math.round(k.x) - 2, Math.round(k.y) - 3 + bob, 1, 1);
    } else if (k.pkind === "orb") {
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(k.x, k.y - 3 + bob, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ff4a6a"; ctx.beginPath(); ctx.arc(k.x, k.y - 3 + bob, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ffd0da"; ctx.fillRect(Math.round(k.x) - 1, Math.round(k.y) - 5 + bob, 1, 1);
    } else if (k.pkind === "item") {
      const it = k.item, col = RAR[it.rar].color, ri = RAR_ORDER.indexOf(it.rar);
      if (ri >= 2) {                                         // cột sáng độ hiếm
        const gr = ctx.createLinearGradient(0, k.y - 50, 0, k.y);
        gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, col); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(k.animT * 4);
        ctx.fillStyle = gr; ctx.fillRect(Math.round(k.x) - 3, Math.round(k.y) - 50, 6, 50); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = col; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(k.x, k.y + 1, 7, 3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      const key = it.slot === "weapon" ? WEAPON_SPRITE[it.wtype] : ITEM_ICON[it.slot];
      drawSprite(ctx, key, 0, k.x, k.y - 1 + bob, {});
    }
  },
  drawProp(ctx, pr) {
    if (pr.kind === "chest") {
      drawSprite(ctx, pr.used ? "chest_open" : "chest_closed", 0, pr.x, pr.y + 4, { scale: pr.big ? 1.4 : 1 });
      if (!pr.used) { ctx.fillStyle = `rgba(255,220,120,${0.2 + 0.2 * Math.sin(pr.t * 4)})`; ctx.fillRect(Math.round(pr.x) - 1, Math.round(pr.y) - 16 - Math.round(Math.sin(pr.t * 3) * 2), 2, 2); }
      if (pr.beam && pr.beam.t < 2.5) {
        pr.beam.t += 1 / 60; const a = 1 - pr.beam.t / 2.5;
        const gr = ctx.createLinearGradient(0, pr.y - 120, 0, pr.y); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, pr.beam.color);
        ctx.globalAlpha = a * 0.7; ctx.fillStyle = gr; ctx.fillRect(Math.round(pr.x) - 6, Math.round(pr.y) - 120, 12, 120); ctx.globalAlpha = 1;
      }
    } else if (pr.kind === "fountain") {
      drawSprite(ctx, "fountain", 0, pr.x, pr.y + 5, pr.used ? { tint: "#5a5a6a", tintAmt: 0.7 } : {});
      if (!pr.used && Math.random() < 0.2) FX.particles(pr.x + rand(-3, 3), pr.y - 14, { n: 1, color: "#9ad8ff", speed: 15, life: 0.5, gravity: 40 });
    } else if (pr.kind === "exit") {                         // cổng ra: vòng xoáy tím
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = ["#b58cff", "#7a5cff", "#e0d0ff"][i]; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.ellipse(pr.x, pr.y - 6, 9 - i * 2.5, 12 - i * 3, 0, pr.t * (2 + i) + i, pr.t * (2 + i) + i + 4.5); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (Math.random() < 0.3) FX.particles(pr.x + rand(-6, 6), pr.y, { n: 1, color: "#c9a0ff", speed: 20, life: 0.6, gravity: -50 });
    }
  },
  drawFlame(ctx, x, y) {
    const t = GAME.time;
    for (let i = 0; i < 3; i++) {
      const h = 3 + Math.sin(t * 14 + i * 2 + x) * 1.5;
      ctx.fillStyle = ["#ff6a1a", "#ffb32a", "#fff2a0"][i];
      ctx.fillRect(Math.round(x - 2 + i * 0.5), Math.round(y - h + i), 4 - i, Math.round(h + 2 - i));
    }
  },
};

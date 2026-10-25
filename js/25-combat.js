/* 25-combat: sát thương, trạng thái, đòn đánh vũ khí, đạn, vùng nguy hiểm, vật nhặt */
const Combat = {
  /** đòn đánh thường theo loại vũ khí đang cầm (GDD 5.1) */
  weaponAttack(world, p) {
    const W = WEAPON_TYPES[p.weapon.wtype], st = p.stats;
    p.atkT = W.interval / (st.atkSpeed * (p.rageOn ? 1.2 : 1));
    const mult = (W.scale === "spell" ? st.spellMult : st.physMult) * (st.lowHpDmg && p.hp < p.maxHp * 0.3 ? 1 + st.lowHpDmg : 1);
    let base = (p.weapon.dmg || W.base) * mult;
    const ang = p.aim, cx = p.x, cy = p.y - 6;
    if (W.kind === "melee" || W.kind === "thrust") {
      let f = 1;
      if (W.combo) { f = W.combo[p.combo]; p.combo = (p.combo + 1) % W.combo.length; p.comboT = 0.6; }
      base *= f;
      const heavy = p.weapon.wtype === "heavy" || f > 1.2;
      p.swing = { ang, arc: W.arc || 30, range: W.range || W.len, t: 0, dur: 0.14, kind: W.kind, big: heavy, dir: p.combo % 2 ? 1 : -1 };
      Audio.sfx("swing");
      let hitAny = false;
      for (const e of world.enemies) {
        if (e.dead || e.aiState === "spawn") continue;
        let hit;
        if (W.kind === "thrust") hit = segCircle(cx, cy, cx + Math.cos(ang) * W.len, cy + Math.sin(ang) * W.len, e.x, e.y - 4, e.r + W.width / 2);
        else hit = arcHit(cx, cy, ang, W.arc, W.range, e.x, e.y - 4, e.r);
        if (!hit) continue;
        hitAny = true;
        const [kx, ky] = normalize(e.x - p.x, e.y - p.y);
        const dealt = dealDamage(p, e, { base, type: W.scale, knock: W.knock * (f > 1.2 ? 1.6 : 1), kx, ky, critBonus: W.crit || 0, heavy });
        if (dealt && st.burnC && Math.random() < st.burnC) applyStatus(e, "burn", { t: 3, dps: dealt * 0.2 / 3, src: p });
      }
      // đánh vỡ thùng trong tầm
      const tx = Math.floor((cx + Math.cos(ang) * 18) / T), ty = Math.floor((cy + Math.sin(ang) * 18) / T);
      if (hitCrate(world, tx, ty)) hitAny = true;
      if (hitAny && heavy) FX.shake(0.25);
      Combat.parryBullets(world, p);                    // phá đạn ngay trong khung vung
    } else {
      const sp = W.speed, mx = cx + Math.cos(ang) * 10, my = cy + Math.sin(ang) * 10;
      world.projs.push(createProjectile({ x: mx, y: my, angle: ang, speed: sp, r: W.r, dmg: base, dtype: W.scale, team: 0,
        life: W.life, homing: W.homing || 0, splash: W.splash || 0, owner: p, shape: p.weapon.wtype === "bow" ? "arrow" : "orb",
        color: W.scale === "spell" ? "#b58cff" : "#ffe9a8", burnC: st.burnC }));
      FX.particles(mx, my, { n: 4, color: W.scale === "spell" ? "#d6c2ff" : "#fff2c8", speed: 50, life: 0.15, size: 2 });
      FX.flashLight(mx, my, 30, 0.08);
      Audio.sfx(W.scale === "spell" ? "magic" : "shoot");
    }
    // Bóng Đôi: bản sao bắn thêm một bóng ma 40% sát thương theo mỗi đòn
    if (p.active && p.active.twin) {
      const tg = nearestEnemy(world, p.x, p.y, 170);
      const a = tg ? Math.atan2(tg.y - 4 - (p.y - 8), tg.x - (p.x - 14)) : ang;
      world.projs.push(createProjectile({ x: p.x - 14, y: p.y - 8, angle: a, speed: 240, r: 3, dmg: base * p.active.twin.pct, dtype: W.scale, team: 0, life: 1, homing: 5, owner: p, color: "#6a5aaa", src: "skill" }));
    }
    Events.emit("attack", { p, W, base });
  },
};

/**
 * Chém trúng đạn thì đạn bị phá (gọi mỗi khung khi vệt chém còn hiện, nên chém sớm một chút vẫn đỡ được).
 * Chỉ áp dụng cho vũ khí cận chiến; đạn của quái (team 1) nằm trong hình quạt/đường đâm thì biến mất.
 */
Combat.parryBullets = function (world, p) {
  const s = p.swing; if (!s) return;
  const cx = p.x, cy = p.y - 6;
  let n = 0;
  for (const b of world.projs) {
    if (b.dead || b.team !== 1) continue;
    const hit = s.kind === "thrust"
      ? segCircle(cx, cy, cx + Math.cos(s.ang) * s.range, cy + Math.sin(s.ang) * s.range, b.x, b.y, b.r + 5)
      : arcHit(cx, cy, s.ang, s.arc, s.range + 2, b.x, b.y, b.r);
    if (!hit) continue;
    b.dead = true; n++;
    FX.particles(b.x, b.y, { n: 7, color: "#ffe9a8", speed: 90, life: 0.22, size: 2, ang: Math.atan2(b.y - cy, b.x - cx), spread: 0.9 });
    FX.ring(b.x, b.y, 7, "#ffffff", 0.14);
  }
  if (n) { Audio.sfx("parry"); FX.hitstop(0.025); Events.emit("parry", { p, count: n }); }
};

/** hệ số sát thương động của người chơi: Giao Kèo Máu + các hiệu ứng đồ độc nhất (p.dmgMods: fn(p, tgt, opts) → % cộng thêm) */
function playerDmgMult(p, tgt, opts) {
  let add = 0;
  if (p.active && p.active.pact) add += p.active.pact.pct;
  if (p.dmgMods) for (const f of p.dmgMods) add += f(p, tgt, opts) || 0;
  return 1 + add;
}

/**
 * Chuỗi xử lý sát thương (GDD 5.4).
 * opts: {base, type:"phys"|"spell"|"true", canCrit, forceCrit, critBonus, knock, kx, ky, heavy, source}
 * trả về số sát thương thực
 */
function dealDamage(src, tgt, opts) {
  if (tgt.dead) return 0;
  if (tgt.kind === "player" && (tgt.iframes > 0 || tgt.dodgeT > 0) && opts.source !== "self") return 0;
  if (tgt.invuln > 0) { if (opts.source !== "dot") FX.particles(tgt.x, tgt.y - 10, { n: 3, color: "#9ad0ff", speed: 50, life: 0.2 }); return 0; }
  let amount = opts.base, crit = false;
  const fromPlayer = src && src.kind === "player";
  if (fromPlayer && opts.source !== "dot") {
    const st = src.stats;
    if (tgt.isBoss || tgt.miniboss) amount *= 1 + st.bossDmg;
    else if (tgt.elite) amount *= 1 + st.eliteDmg;
  }
  if (fromPlayer && opts.source !== "dot") amount *= playerDmgMult(src, tgt, opts);
  if (fromPlayer && opts.canCrit !== false) {
    const cc = src.stats.critChance + (opts.critBonus || 0);
    if (src.nextCrit2 && opts.source !== "dot") { src.nextCrit2 = false; amount *= src.stats.critMult * 2; crit = true; }    // Bước Bóng
    else if (opts.forceCrit || Math.random() < cc) { amount *= src.stats.critMult; crit = true; }
  }
  if (tgt.kind === "player") amount *= tgt.stats.dmgTaken;
  if (tgt.status.vuln) amount *= 1.25;
  amount = Math.max(1, Math.ceil(amount));
  // khiên trước, máu sau
  let rest = amount;
  if (tgt.shield > 0) { const a = Math.min(tgt.shield, rest); tgt.shield -= a; rest -= a; }
  tgt.hp -= rest;

  Events.emit("hit", { src, tgt, amount, crit, opts });
  // hút máu (người chơi đánh) và phản đòn (người chơi bị đánh)
  if (fromPlayer && src.stats.lifesteal && opts.source !== "dot" && opts.source !== "thorns" && !src.dead) src.hp = Math.min(src.maxHp, src.hp + amount * src.stats.lifesteal);
  if (tgt.kind === "player" && tgt.stats.thorns && src && src.kind === "enemy" && !src.dead && opts.source !== "thorns")
    dealDamage(tgt, src, { base: amount * tgt.stats.thorns, type: "true", canCrit: false, source: "thorns" });
  // phản hồi hình ảnh/âm thanh
  tgt.flash = 0.08;
  if (opts.knock && opts.kx != null) { const k = opts.knock * (tgt.kind === "player" ? 0.6 : 1) / (tgt.scale || 1); tgt.knockX += opts.kx * k * 3; tgt.knockY += opts.ky * k * 3; }
  const kind = tgt.kind === "player" ? "hurt" : crit ? "crit" : opts.type === "spell" ? "spell" : "phys";
  FX.number(tgt.x + rand(-4, 4), tgt.y - 14 - (tgt.r || 6), amount, kind);
  FX.particles(tgt.x, tgt.y - 6, { n: crit ? 10 : 5, color: tgt.kind === "player" ? "#ff4a5a" : "#ffffff", speed: crit ? 110 : 70, life: 0.25, size: 2 });
  if (tgt.kind === "player") {
    tgt.iframes = CONFIG.HURT_IFRAME; FX.shake(0.35); FX.flashScreen("rgba(255,40,60,.25)", 0.15); Audio.sfx("hurt"); FX.hitstop(0.04);
    Events.emit("hurt", { src, tgt, amount });
  } else {
    if (crit || opts.heavy) { FX.hitstop(crit ? 0.05 : 0.035); FX.shake(crit ? 0.2 : 0.12); Audio.sfx("crit"); } else Audio.sfx("hit");
  }
  if (tgt.hp <= 0) kill(tgt, src);
  return amount;
}

function kill(tgt, src) {
  tgt.hp = 0; tgt.dead = true;
  if (tgt.kind === "enemy") {
    Events.emit("kill", { tgt, src });
    FX.deathBurst(tgt);
    Audio.sfx("death");
    if (GAME.run) { Run.onEnemyKilled(tgt, src); return; }
    if (Math.random() < CONFIG.ORB_DROP * 2) GAME.world.pickups.push(createPickup({ kind: "orb", x: tgt.x, y: tgt.y, vx: rand(-40, 40), vy: rand(-40, 40) }));
    for (let i = 0; i < 3; i++) GAME.world.pickups.push(createPickup({ kind: "gold", x: tgt.x, y: tgt.y, value: 1, vx: rand(-70, 70), vy: rand(-70, 70) }));
  }
}

/* ───────── Trạng thái ───────── */
function applyStatus(tgt, key, params) {
  const cur = tgt.status[key];
  if (key === "poison" && cur) { cur.stacks = Math.min(5, cur.stacks + 1); cur.t = params.t; return; }
  tgt.status[key] = Object.assign({ stacks: 1, tick: 0 }, params);
}
const Status = {
  update(world, e, dt) {
    for (const k in e.status) {
      const s = e.status[k]; s.t -= dt;
      if ((k === "burn" || k === "poison" || k === "bleed") && !e.dead) {
        s.tick += dt;
        if (s.tick >= 0.5) { s.tick -= 0.5; dealDamage(s.src || null, e, { base: s.dps * 0.5 * (s.stacks || 1), type: "true", canCrit: false, source: "dot" }); }
      }
      if (s.t <= 0) delete e.status[k];
    }
  },
};

/* ───────── Đạn ───────── */
const Projectiles = {
  update(world, dt) {
    const enemyBullets = world.projs.filter(p => p.team === 1).length;
    if (enemyBullets > CONFIG.MAX_ENEMY_BULLETS) { let n = enemyBullets - CONFIG.MAX_ENEMY_BULLETS; for (const p of world.projs) if (p.team === 1 && n-- > 0) p.dead = true; }
    for (const p of world.projs) {
      if (p.dead) continue;
      p.life -= dt; p.animT += dt;
      if (p.homing) {
        let best = null, bd = 140 * 140;
        for (const e of world.enemies) { if (e.dead) continue; const d = dist2(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; best = e; } }
        if (best) {
          const cur = Math.atan2(p.vy, p.vx), want = Math.atan2(best.y - 4 - p.y, best.x - p.x);
          const na = cur + clamp(angDiff(cur, want), -p.homing * dt, p.homing * dt);
          p.vx = Math.cos(na) * p.speed; p.vy = Math.sin(na) * p.speed;
        }
      }
      if (p.boomerang) {                              // rìu bay: ra xa rồi quay về người ném
        const b = p.boomerang, o = p.owner;
        if (!b.back && Math.hypot(p.x - b.sx, p.y - b.sy) >= b.out) { b.back = true; p.hitSet.clear(); }
        if (b.back && o) { const a = Math.atan2(o.y - 8 - p.y, o.x - p.x); p.vx = Math.cos(a) * p.speed * 1.2; p.vy = Math.sin(a) * p.speed * 1.2; if (Math.hypot(o.x - p.x, o.y - 8 - p.y) < 8) { p.dead = true; continue; } }
      }
      if (p.trail) { p.trailT = (p.trailT || 0) - dt; if (p.trailT <= 0) { p.trailT = 0.08; p.trail(p, world); } }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) { this.expire(world, p); continue; }
      if (blocksProjPx(world, p.x, p.y) && !(p.boomerang && p.boomerang.back)) {
        const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
        if (p.team === 0) hitCrate(world, tx, ty);
        this.expire(world, p, true); continue;
      }
      if (p.team === 0) {
        for (const e of world.enemies) {
          if (e.dead || e.aiState === "spawn" || p.hitSet.has(e)) continue;
          if (dist2(e.x, e.y - 4, p.x, p.y) > (e.r + p.r) * (e.r + p.r)) continue;
          p.hitSet.add(e);
          const [kx, ky] = normalize(p.vx, p.vy);
          const dealt = dealDamage(p.owner, e, { base: p.dmg, type: p.dtype, knock: p.knock, kx, ky, source: p.srcTag, proj: p });
          if (p.burnC && Math.random() < p.burnC) applyStatus(e, "burn", { t: 3, dps: p.dmg * 0.2 / 3, src: p.owner });
          if (dealt && p.srcTag === "skill") Events.emit("skillHit", { p: p.owner, n: 1 });
          if (p.boom) { this.expire(world, p); break; }
          if (p.pierce-- <= 0) { this.expire(world, p); break; }
        }
      } else {
        const pl = world.player;
        if (pl && !pl.dead && !(pl.projImmuneT > 0) && dist2(pl.x, pl.y - 5, p.x, p.y) < (pl.r + p.r) * (pl.r + p.r)) {
          const [kx, ky] = normalize(p.vx, p.vy);
          if (dealDamage(null, pl, { base: p.dmg, type: "phys", knock: 20, kx, ky }) > 0 || !(pl.iframes > 0)) this.expire(world, p);
        }
      }
    }
  },
  expire(world, p, wall) {
    p.dead = true;
    FX.particles(p.x, p.y, { n: wall ? 5 : 3, color: p.color, speed: 50, life: 0.2, size: 2 });
    if (p.boom && p.team === 0) {                     // cầu lửa: nổ khi chạm hoặc hết tầm
      const B = p.boom;
      hitCircle(world, p.owner, p.x, p.y, B.r, B.dmg, p.dtype, { knock: 70, canCrit: true, onEach: e => B.burn && applyStatus(e, "burn", { t: 3, dps: B.dmg * 0.2 / 3, src: p.owner }) });
      FX.explosion(p.x, p.y, B.r, B.color); FX.trauma = Math.min(FX.trauma, 0.35);
    }
    if (p.splash && p.team === 0) {
      for (const e of world.enemies) if (!e.dead && !p.hitSet.has(e) && dist2(e.x, e.y, p.x, p.y) < (p.splash + e.r) ** 2)
        dealDamage(p.owner, e, { base: p.dmg * 0.5, type: p.dtype, canCrit: false });
      FX.ring(p.x, p.y, p.splash, p.color, 0.2);
    }
  },
};

/* ───────── Vùng nguy hiểm (vòng báo, dải chém, đá ném, vùng lửa/nhớt, xe goòng) ───────── */
const Hazards = {
  update(world, dt) {
    const pl = world.player;
    for (const h of world.hazards) {
      if (h.dead) continue;
      h.t += dt;
      if (!h.triggered && h.t >= h.delay) {
        h.triggered = true;
        if ((h.hkind === "circle" || h.hkind === "lob") && h.team === 0) {     // phép của người chơi: trúng quái
          hitCircle(world, h.src, h.x, h.y, h.r, h.dmg, "spell", { knock: 50, onEach: h.onEnemy });
          if (h.r >= 30) FX.explosion(h.x, h.y, h.r, h.color); else { FX.ring(h.x, h.y, h.r, h.color, 0.2); FX.particles(h.x, h.y, { n: 6, color: h.color, speed: 60, life: 0.3 }); }
          FX.trauma = Math.min(FX.trauma, 0.3);
        } else if (h.hkind === "circle" || h.hkind === "lob") {
          FX.explosion(h.x, h.y, h.r, h.color === "#ff3a3a" ? "#d8b48a" : h.color); FX.trauma = Math.min(FX.trauma, 0.5);
          if (pl && !pl.dead && dist2(pl.x, pl.y, h.x, h.y) < (h.r + pl.r) ** 2) { const [kx, ky] = normalize(pl.x - h.x, pl.y - h.y); dealDamage(h.src || null, pl, { base: h.dmg, type: "phys", knock: 70, kx, ky }); }
          if (h.onTrigger) h.onTrigger(h, world);
        } else if (h.hkind === "line") {
          const x2 = h.x + Math.cos(h.ang) * h.len, y2 = h.y + Math.sin(h.ang) * h.len;
          for (let i = 0; i <= 8; i++) FX.particles(lerp(h.x, x2, i / 8), lerp(h.y, y2, i / 8), { n: 3, color: "#d8b48a", speed: 70, life: 0.4, size: 2 });
          FX.shake(0.35); Audio.sfx("explode");
          if (pl && !pl.dead && segCircle(h.x, h.y, x2, y2, pl.x, pl.y, h.width / 2 + pl.r)) { const [kx, ky] = normalize(Math.cos(h.ang + Math.PI / 2), Math.sin(h.ang + Math.PI / 2)); dealDamage(h.src || null, pl, { base: h.dmg, type: "phys", knock: 60, kx, ky }); }
          if (h.onTrigger) h.onTrigger(h, world);
        }
      }
      if (h.hkind === "zone" && h.team === 0 && h.t >= h.delay) {              // vùng của người chơi: hút, độc, làm chậm quái
        h.tick = (h.tick || 0) + dt; const doTick = h.tick >= 0.25; if (doTick) h.tick = 0;
        for (const e of world.enemies) {
          if (e.dead || e.aiState === "spawn") continue;
          const d2 = dist2(e.x, e.y, h.x, h.y); if (d2 > (h.r + e.r) ** 2) continue;
          if (h.pull && !e.isBoss) { const [nx, ny] = normalize(h.x - e.x, h.y - e.y); moveAndCollide(world, e, nx * h.pull * dt, ny * h.pull * dt); }
          if (h.slowEnemies) applyStatus(e, "slow", { t: 0.3, amt: h.slowEnemies });
          if (doTick && h.tickDmg) { dealDamage(h.src, e, { base: h.tickDmg, type: "spell", canCrit: false, source: "dot" }); if (h.poison) applyStatus(e, "poison", { t: 4, dps: h.tickDmg * 0.4, src: h.src }); }
        }
      }
      if (h.hkind === "zone" && h.team !== 0 && h.t >= h.delay && pl && !pl.dead && dist2(pl.x, pl.y, h.x, h.y) < h.r * h.r) {
        if (h.slow) applyStatus(pl, "slow", { t: 0.25, amt: h.slow });
        if (h.dps) { h.tick = (h.tick || 0) + dt; if (h.tick >= 0.4) { h.tick = 0; dealDamage(h.src || null, pl, { base: h.dps * 0.4, type: "phys" }); } }
      }
      if (h.hkind === "cart" && h.t >= h.delay) {
        h.x += h.vx * dt; h.y += h.vy * dt;
        if (Math.random() < 0.5) FX.particles(h.x - Math.sign(h.vx) * 8, h.y + 4, { n: 1, color: "#ffd23d", speed: 40, life: 0.2, size: 1 });
        if (!h.hitDone && pl && !pl.dead && Math.abs(pl.x - h.x) < 10 + pl.r && Math.abs(pl.y - h.y) < 7 + pl.r) {
          h.hitDone = true; dealDamage(h.src || null, pl, { base: h.dmg, type: "phys", knock: 120, kx: Math.sign(h.vx), ky: 0 });
        }
      }
      if (h.t >= h.life) h.dead = true;
    }
  },
};

/** gai trên sàn (ô ^): cứ 2 s bật lên 0.6 s, đứng trên lúc bật thì mất 8% máu tối đa */
function updateSpikes(world, dt) {
  world.spikeT = (world.spikeT + dt) % 2;
  const up = world.spikeT > 1.4, pl = world.player;
  world.spikesUp = up;
  if (up && pl && !pl.dead && tileAtPx(world, pl.x, pl.y) === "^") dealDamage(null, pl, { base: pl.maxHp * 0.08, type: "true", canCrit: false });
}

/** nổ tròn: gây sát thương mọi mục tiêu đối phương trong bán kính (bom của quái nổ cả quái khác) */
function explode(world, x, y, r, dmg, team, src, opts = {}) {
  FX.explosion(x, y, r, opts.color || "#ff8a3a");
  Audio.sfx("explode");
  const pl = world.player;
  if ((team === 1 || opts.hitsAll) && pl && !pl.dead && dist2(pl.x, pl.y, x, y) < (r + pl.r) ** 2) {
    const [kx, ky] = normalize(pl.x - x, pl.y - y); dealDamage(src, pl, { base: dmg, type: "phys", knock: 90, kx, ky });
  }
  if (team === 0 || opts.hitsAll) for (const e of world.enemies) {
    if (e.dead || e === src || dist2(e.x, e.y, x, y) > (r + e.r) ** 2) continue;
    const [kx, ky] = normalize(e.x - x, e.y - y); dealDamage(team === 0 ? src : null, e, { base: dmg, type: "phys", knock: 90, kx, ky, canCrit: false });
  }
}

/* ───────── Vật nhặt (vàng, quả cầu máu) ───────── */
const Pickups = {
  update(world, dt, magnetAll) {
    const pl = world.player;
    for (const k of world.pickups) {
      if (k.dead) continue;
      k.t += dt; k.animT += dt;
      k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= Math.pow(0.02, dt); k.vy *= Math.pow(0.02, dt);
      if (circleHitsSolid(world, k.x, k.y, 2)) { k.vx = -k.vx * 0.5; k.vy = -k.vy * 0.5; }
      if (!pl || pl.dead || k.t < 0.35 || k.pkind === "item") continue;      // đồ phải bấm F để nhặt
      const d = Math.hypot(pl.x - k.x, pl.y - 4 - k.y), mag = magnetAll ? 9999 : 40;
      if (d < mag) { const sp = 260 * (1 - Math.min(1, d / 200)) + 120; k.x += (pl.x - k.x) / d * sp * dt; k.y += (pl.y - 4 - k.y) / d * sp * dt; }
      if (d < 7) {
        k.dead = true;
        if (k.pkind === "gold") { if (GAME.run) GAME.run.gold += k.value; else GAME.runGold = (GAME.runGold || 0) + k.value; Audio.sfx("coin"); Events.emit("pickupGold", { value: k.value }); }
        if (k.pkind === "orb") { const h = Math.round(pl.maxHp * CONFIG.ORB_HEAL); pl.hp = Math.min(pl.maxHp, pl.hp + h); FX.number(pl.x, pl.y - 20, h, "heal"); Audio.sfx("potion"); }
      }
    }
  },
};

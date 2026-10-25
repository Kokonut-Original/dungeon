/* 26-skills: hành vi 20 phép Q/E (GDD 5.2). Sát thương = gốc × G(cấp đồ) × độ hiếm × (Sức Mạnh hoặc Phép Lực) × (1 + sát thương kỹ năng).
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const Skills = {
  /** sức mạnh của phép trong ô: {key, item, power(giá trị sát thương/hiệu ứng), cd} */
  slotInfo(p, slot) {
    let key = null, it = null;
    if (p.save) { it = equippedItem(p.save, slot); key = it && it.skill; }
    else key = (p.testSpells || [])[slot === "spell1" ? 0 : 1];
    if (!key) return null;
    const S = SKILLS[key], st = p.stats;
    const lvlMult = it ? itemStats(it).main.v : G(p.hero.level);       // main.v = G(ilvl) × độ hiếm × nâng cấp
    const scaleMult = S.scale === "phys" ? st.physMult : S.scale === "spell" ? st.spellMult : 1;
    const power = S.scale === "none" ? S.base * (it ? RAR[it.rar].mult * (1 + 0.1 * it.upg.filter(u => u === "main").length) : 1)
      : S.base * lvlMult * scaleMult * (1 + st.skillDmg);
    return { key, item: it, S, power, cd: S.cd * (1 - st.cdr) };
  },

  /** gọi mỗi bước: hồi chiêu, bấm Q/E, cập nhật các hiệu ứng đang chạy */
  update(world, p, dt) {
    p.skillCd = p.skillCd || { spell1: 0, spell2: 0 };
    for (const s of ["spell1", "spell2"]) if (p.skillCd[s] > 0) p.skillCd[s] -= dt;
    if (!p.dead && !(p.status.stun || p.status.freeze) && GAME.scene !== TownScene) {
      if (Input.state.skill1Pressed) this.cast(world, p, "spell1");
      if (Input.state.skill2Pressed) this.cast(world, p, "spell2");
    }
    this.tickActive(world, p, dt);
  },

  cast(world, p, slot) {
    const info = this.slotInfo(p, slot);
    if (!info) { UI.toast(`Chưa gắn phép vào ô ${slot === "spell1" ? "Q" : "E"} (mở túi đồ để gắn)`, "#c9bde8"); return false; }
    if (p.skillCd[slot] > 0) return false;
    const aim = { x: Input.state.aimWorldX || p.x + Input.state.aimX * 60, y: Input.state.aimWorldY || p.y + Input.state.aimY * 60, ang: p.aim };
    SKILL_IMPL[info.key](world, p, info.power, aim, info);
    p.skillCd[slot] = info.cd; p.skillCdMax = p.skillCdMax || {}; p.skillCdMax[slot] = info.cd;
    FX.particles(p.x, p.y - 8, { n: 8, color: info.S.color, speed: 60, life: 0.3 });
    Events.emit("castSkill", { p, slot, key: info.key });
    return true;
  },

  /** các phép kéo dài: lốc xoáy, khiên, hồi máu, đom đóm, bão kiếm, giao kèo máu, bóng đôi, tàng hình */
  tickActive(world, p, dt) {
    const A = p.active || (p.active = {});
    if (A.whirl) {
      A.whirl.t -= dt; A.whirl.tick -= dt; p.whirlAng = (p.whirlAng || 0) + dt * 18;
      if (A.whirl.tick <= 0) { A.whirl.tick = 0.2; hitCircle(world, p, p.x, p.y - 4, 28, A.whirl.dmg, "phys", { knock: 30 }); Audio.sfx("swing"); }
      if (A.whirl.t <= 0) A.whirl = null;
    }
    if (A.shield) { A.shield.t -= dt; if (A.shield.t <= 0) { p.shield = Math.max(0, p.shield - A.shield.amt); A.shield = null; } }
    if (A.hot) { const h = A.hot.rate * dt; p.hp = Math.min(p.maxHp, p.hp + h); A.hot.t -= dt; if (Math.random() < 0.3) FX.particles(p.x + rand(-6, 6), p.y - 4, { n: 1, color: "#7affb0", speed: 10, life: 0.6, gravity: -40 }); if (A.hot.t <= 0) A.hot = null; }
    if (A.pact) { A.pact.t -= dt; if (A.pact.t <= 0) A.pact = null; }
    if (p.invisT > 0) p.invisT -= dt;
    if (A.twin) { A.twin.t -= dt; if (A.twin.t <= 0) A.twin = null; }
    // vật bay quanh người (đom đóm, kiếm)
    p.orbiters = (p.orbiters || []).filter(o => (o.t -= dt) > 0);
    for (const o of p.orbiters) {
      o.ang += dt * o.spin; o.x = p.x + Math.cos(o.ang) * o.r; o.y = p.y - 6 + Math.sin(o.ang) * o.r * 0.8;
      if (o.kind === "wisp") {
        o.cd -= dt;
        if (o.cd <= 0) { o.cd = 0.5; const tg = nearestEnemy(world, o.x, o.y, 160);
          if (tg) world.projs.push(createProjectile({ x: o.x, y: o.y, angle: Math.atan2(tg.y - 4 - o.y, tg.x - o.x), speed: 200, r: 2, dmg: o.dmg, dtype: "spell", team: 0, life: 1.4, homing: 6, owner: p, color: "#d6ff7a", src: "skill" })); }
      } else if (o.kind === "blade") {
        for (const e of world.enemies) {
          if (e.dead || e.aiState === "spawn") continue;
          if (dist2(e.x, e.y - 4, o.x, o.y) < (e.r + 4) ** 2 && (o.hitT.get(e) || 0) <= GAME.time) {
            o.hitT.set(e, GAME.time + 0.5); dealDamage(p, e, { base: o.dmg, type: "phys", knock: 20, kx: Math.cos(o.ang), ky: Math.sin(o.ang), source: "skill" });
          }
        }
      }
    }
  },
};

/* ── tiện ích dùng chung cho phép ── */
function nearestEnemy(world, x, y, range, exclude = null) {
  let best = null, bd = range * range;
  for (const e of world.enemies) { if (e.dead || e.aiState === "spawn" || (exclude && exclude.has(e))) continue; const d = dist2(e.x, e.y, x, y); if (d < bd) { bd = d; best = e; } }
  return best;
}
/** gây sát thương mọi quái trong vòng tròn; trả số quái trúng */
function hitCircle(world, p, x, y, r, dmg, type, o = {}) {
  let n = 0;
  for (const e of world.enemies) {
    if (e.dead || e.aiState === "spawn" || dist2(e.x, e.y - 4, x, y) > (r + e.r) ** 2) continue;
    const [kx, ky] = normalize(e.x - x, e.y - y);
    if (dealDamage(p, e, Object.assign({ base: dmg, type, kx, ky, source: "skill" }, o)) > 0) n++;
    if (o.onEach) o.onEach(e);
  }
  if (n) Events.emit("skillHit", { p, n });
  return n;
}
/** gây sát thương mọi quái trên đoạn thẳng */
function hitLine(world, p, x1, y1, x2, y2, w, dmg, type, o = {}) {
  let n = 0;
  for (const e of world.enemies) {
    if (e.dead || e.aiState === "spawn" || !segCircle(x1, y1, x2, y2, e.x, e.y - 4, e.r + w / 2)) continue;
    const [kx, ky] = normalize(x2 - x1, y2 - y1);
    if (dealDamage(p, e, Object.assign({ base: dmg, type, kx, ky, source: "skill" }, o)) > 0) n++;
    if (o.onEach) o.onEach(e);
  }
  if (n) Events.emit("skillHit", { p, n });
  return n;
}
/** điểm cuối của tia đi theo hướng ang, dừng ở tường */
function rayEnd(world, x, y, ang, len) {
  let ex = x, ey = y;
  for (let d = 4; d <= len; d += 4) { const nx = x + Math.cos(ang) * d, ny = y + Math.sin(ang) * d; if (blocksProjPx(world, nx, ny)) break; ex = nx; ey = ny; }
  return [ex, ey];
}
/** điểm ngắm bị kẹp trong tầm và không nằm trong tường */
function clampAim(world, p, aim, maxD) {
  const d = Math.min(maxD, Math.hypot(aim.x - p.x, aim.y - p.y)), a = Math.atan2(aim.y - p.y, aim.x - p.x);
  const [x, y] = rayEnd(world, p.x, p.y - 4, a, d); return { x, y };
}

const SKILL_IMPL = {
  fireball(world, p, dmg, aim) {
    world.projs.push(createProjectile({ x: p.x, y: p.y - 8, angle: p.aim, speed: 220, r: 4, dmg, dtype: "spell", team: 0, life: 1.5, owner: p, color: "#ff8a2a", src: "skill",
      boom: { r: 24, dmg, color: "#ff8a2a", burn: true } }));
    Audio.sfx("spell_fire");
  },
  whirlwind(world, p, dmg) { p.active = p.active || {}; p.active.whirl = { t: 1.6, tick: 0, dmg }; },
  dashslash(world, p, dmg) {
    const a = p.aim, x0 = p.x, y0 = p.y;
    for (let i = 0; i < 20; i++) moveAndCollide(world, p, Math.cos(a) * 4, Math.sin(a) * 4);
    p.iframes = Math.max(p.iframes, 0.25);
    hitLine(world, p, x0, y0 - 6, p.x, p.y - 6, 14, dmg, "phys", { knock: 60 });
    for (let i = 0; i < 8; i++) FX.particles(lerp(x0, p.x, i / 8), lerp(y0, p.y, i / 8) - 6, { n: 2, color: "#fff2c8", speed: 30, life: 0.3 });
    p.swing = { ang: a, arc: 140, range: 28, t: 0, dur: 0.16, kind: "melee", big: true, dir: 1 };
    Audio.sfx("dodge"); FX.shake(0.15);
  },
  icerain(world, p, dmg, aim) {
    const c = clampAim(world, p, aim, 150);
    for (let i = 0; i < 6; i++) {
      const a = rand(0, TAU), d = rand(0, 40);
      world.hazards.push(createHazard({ kind: "circle", team: 0, x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, r: 10, delay: 0.3 + i * 0.08, dmg, src: p, color: "#9ad8ff",
        onEnemy: e => applyStatus(e, "slow", { t: 2, amt: 0.4 }) }));
    }
    Audio.sfx("spell_ice");
  },
  chain(world, p, dmg, aim) {
    const hit = new Set(); let cur = nearestEnemy(world, aim.x, aim.y, 70) || nearestEnemy(world, p.x, p.y, 150), from = { x: p.x, y: p.y - 8 }, d = dmg;
    for (let i = 0; i < 5 && cur; i++) {
      FX.bolt(from.x, from.y, cur.x, cur.y - 6, "#fff27a");
      dealDamage(p, cur, { base: d, type: "spell", source: "skill" }); hit.add(cur);
      from = { x: cur.x, y: cur.y - 6 }; d *= 0.8; cur = nearestEnemy(world, cur.x, cur.y, 90, hit);
    }
    if (hit.size) Events.emit("skillHit", { p, n: hit.size });
    Audio.sfx("spell_lightning");
  },
  stoneshield(world, p, pct) {
    const amt = Math.round(p.maxHp * pct); p.shield += amt; p.active = p.active || {}; p.active.shield = { t: 4, amt };
    FX.ring(p.x, p.y - 6, 16, "#d8c8a0", 0.3); Audio.sfx("door_close");
  },
  spring(world, p, pct) { p.active = p.active || {}; p.active.hot = { t: 3, rate: p.maxHp * pct / 3 }; Audio.sfx("spell_heal"); },
  piercearrow(world, p, dmg) {
    const [ex, ey] = rayEnd(world, p.x, p.y - 6, p.aim, 200);
    hitLine(world, p, p.x, p.y - 6, ex, ey, 8, dmg, "phys", { knock: 40 });
    FX.beam(p.x, p.y - 6, ex, ey, "#ffe9a8", 3); Audio.sfx("shoot");
  },
  boomerang(world, p, dmg) {
    world.projs.push(createProjectile({ x: p.x, y: p.y - 8, angle: p.aim, speed: 240, r: 5, dmg, dtype: "phys", team: 0, life: 3, pierce: 99, owner: p, color: "#c9d2e6", shape: "axe", src: "skill",
      boomerang: { out: 120, back: false, sx: p.x, sy: p.y } }));
    Audio.sfx("swing");
  },
  quake(world, p, dmg) {
    hitCircle(world, p, p.x, p.y, 44, dmg, "phys", { knock: 90, onEach: e => applyStatus(e, "stun", { t: 0.8 * (e.isBoss ? 0.3 : 1) }) });
    FX.ring(p.x, p.y, 44, "#d8b48a", 0.35); FX.particles(p.x, p.y, { n: 24, color: "#a0805a", speed: 120, life: 0.5, gravity: 200 });
    FX.shake(0.4); Audio.sfx("explode");
  },
  wisps(world, p, dmg) {
    p.orbiters = p.orbiters || [];
    for (let i = 0; i < 2; i++) p.orbiters.push({ kind: "wisp", t: 8, ang: i * Math.PI, r: 16, spin: 2.5, cd: 0.3 * i, dmg, x: p.x, y: p.y, color: "#d6ff7a" });
    Audio.sfx("magic");
  },
  blackhole(world, p, dmg, aim) {
    const c = clampAim(world, p, aim, 140);
    world.hazards.push(createHazard({ kind: "zone", sub: "hole", team: 0, x: c.x, y: c.y, r: 60, life: 2, pull: 140, tickDmg: dmg, src: p, color: "#9a6aff" }));
    Audio.sfx("spell_dark");
  },
  poisoncloud(world, p, dmg, aim) {
    const c = clampAim(world, p, aim, 130);
    world.hazards.push(createHazard({ kind: "zone", sub: "poison", team: 0, x: c.x, y: c.y, r: 36, life: 4, tickDmg: dmg * 0.5, poison: true, src: p, color: "#8aff6a" }));
    Audio.sfx("spell_dark");
  },
  bladestorm(world, p, dmg) {
    p.orbiters = p.orbiters || [];
    for (let i = 0; i < 6; i++) p.orbiters.push({ kind: "blade", t: 5, ang: i * TAU / 6, r: 26, spin: 5, dmg, hitT: new Map(), x: p.x, y: p.y });
    Audio.sfx("swing");
  },
  meteor(world, p, dmg, aim) {
    const c = clampAim(world, p, aim, 170);
    world.hazards.push(createHazard({ kind: "lob", team: 0, x: c.x, y: c.y, fromX: c.x - 60, fromY: c.y - 180, r: 40, delay: 0.8, dmg, src: p, sprite: "rock", color: "#ff5a2a",
      onEnemy: e => applyStatus(e, "burn", { t: 3, dps: dmg * 0.1, src: p }) }));
    Audio.sfx("spell_fire");
  },
  shadowstep(world, p) {
    FX.particles(p.x, p.y - 6, { n: 16, color: "#4a3a7a", speed: 60, life: 0.4 });
    const [ex, ey] = rayEnd(world, p.x, p.y, p.aim, 90);
    if (!circleHitsSolid(world, ex, ey, p.r)) { p.x = ex; p.y = ey; }
    p.invisT = 1; p.nextCrit2 = true;
    FX.particles(p.x, p.y - 6, { n: 16, color: "#8a7acc", speed: 60, life: 0.4 }); Audio.sfx("dodge");
  },
  bloodpact(world, p, pct) {
    p.hp = Math.max(1, p.hp - p.hp * 0.1); p.active = p.active || {}; p.active.pact = { t: 3, pct };
    FX.flashScreen("rgba(255,40,60,.2)", 0.2); Audio.sfx("hurt");
  },
  abysscall(world, p, dmg) {
    for (const e of world.enemies) if (!e.dead && dist(e, p) < 120 && !e.isBoss) { const [kx, ky] = normalize(p.x - e.x, p.y - e.y); e.knockX += kx * 380; e.knockY += ky * 380; }
    world.hazards.push(createHazard({ kind: "circle", team: 0, x: p.x, y: p.y, r: 46, delay: 0.45, dmg, src: p, color: "#b86cff" }));
    FX.ring(p.x, p.y, 120, "#b86cff", 0.4); Audio.sfx("spell_dark");
  },
  twinshade(world, p, pct) { p.active = p.active || {}; p.active.twin = { t: 6, pct }; Audio.sfx("spell_dark"); },
  corrode(world, p, dmg) {
    const [ex, ey] = rayEnd(world, p.x, p.y - 6, p.aim, 160);
    hitLine(world, p, p.x, p.y - 6, ex, ey, 10, dmg, "spell", { onEach: e => applyStatus(e, "vuln", { t: 4 }) });
    FX.beam(p.x, p.y - 6, ex, ey, "#7aff9a", 4); Audio.sfx("spell_dark");
  },
};

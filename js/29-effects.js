/* 29-effects: hiệu ứng đồ độc nhất (GDD 6.6) — mỗi hiệu ứng đăng ký vào Events khi vào hầm và gỡ khi rời.
   Hiệu ứng tăng sát thương thêm hàm vào p.dmgMods: fn(p, tgt, opts) → % cộng thêm.
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const FX_OWNER = "uniq";
const EFFECT_IMPL = {
  /* ── Huyền Thoại có tên ── */
  u_foremanPick(p) {
    let n = 0;
    Events.on("hit", c => {
      if (c.src !== p || c.opts.source === "dot" || c.opts.source === "skill" || c.opts.source === "uniq") return;
      if (++n % 3 === 0) { hitCircle(GAME.world, p, c.tgt.x, c.tgt.y, 30, c.amount * 0.5, "phys", { source: "uniq", knock: 60, canCrit: false }); FX.ring(c.tgt.x, c.tgt.y, 30, "#d8b48a", 0.25); FX.shake(0.15); }
    }, FX_OWNER);
  },
  u_hoaLantern(p) {
    p.lightMult = 1.5;
    p.dmgMods.push((pp, t) => dist(pp, t) < CONFIG.PLAYER_LIGHT * 1.5 * 0.6 ? 0.10 : 0);
  },
  u_vanBrush(p) {
    Events.on("attack", c => {
      if (c.p !== p) return;
      const last = GAME.world.projs[GAME.world.projs.length - 1];
      if (last && last.owner === p && last.srcTag === "weapon") last.trail = (pr, w) => w.hazards.push(createHazard({ kind: "zone", sub: "ink", team: 0, x: pr.x, y: pr.y + 4, r: 8, life: 1.5, slowEnemies: 0.3 }));
    }, FX_OWNER);
  },
  u_wetCloak(p) { Events.on("dodge", c => { if (c.p === p) p.projImmuneT = CONFIG.DODGE_T + 1.5; }, FX_OWNER); },
  u_tiltedScale(p) { p.dmgMods.push(() => GAME.run ? Math.min(0.25, Math.floor(GAME.run.gold / 100) * 0.01) : 0); },
  u_tailorShears(p) { Events.on("hit", c => { if (c.src === p && c.crit) applyStatus(c.tgt, "bleed", { t: 3, dps: c.amount * 0.3 / 3, src: p }); }, FX_OWNER); },
  u_captainHelm(p) { p.helmShield = { still: 0, cd: 0 }; },
  u_khaSword(p) {
    Events.on("attack", c => {
      if (c.p !== p || p.combo !== 0 || !p.swing || !p.swing.big) return;      // vừa ra đòn cuối của combo
      GAME.world.projs.push(createProjectile({ x: p.x, y: p.y - 6, angle: p.aim, speed: 260, r: 6, dmg: c.base * 0.8, dtype: "phys", team: 0, life: 100 / 260, pierce: 99, owner: p, color: "#9ad8ff", src: "uniq" }));
    }, FX_OWNER);
    Events.on("hit", c => { if (c.src === p && c.opts.proj && c.opts.proj.color === "#9ad8ff" && c.opts.source === "uniq") applyStatus(c.tgt, "slow", { t: 1.5, amt: 0.4 }); }, FX_OWNER);
  },
  u_goldCrown(p) { p.dmgMods.push(() => Math.floor(((GAME.save && GAME.save.am) || 0) / 10) * 0.01); },
  u_hungryBoots(p) { Events.on("pickupGold", () => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.005); }, FX_OWNER); },
  u_bookOfNames(p) { p.dmgMods.push(() => ((GAME.save && GAME.save.sparedCount) || 0) * 0.03); },

  /* ── hiệu ứng Huyền Thoại ngẫu nhiên ── */
  g_killBoom(p) { Events.on("kill", c => { if (c.src === p && Math.random() < 0.1) { const d = p.weapon.dmg || 10; hitCircle(GAME.world, p, c.tgt.x, c.tgt.y, 20, d * p.stats.physMult * 0.4, "phys", { source: "uniq", canCrit: false }); FX.explosion(c.tgt.x, c.tgt.y, 20, "#ffb13b"); } }, FX_OWNER); },
  g_dodgeHit(p) {
    Events.on("dodge", c => { if (c.p === p) p.dodgeBuff = true; }, FX_OWNER);
    p.dmgMods.push((pp, t, o) => { if (pp.dodgeBuff && o.source !== "dot") { pp.dodgeBuff = false; return 0.5; } return 0; });
  },
  g_rage(p) { p.rage = true; },
  g_roomShield(p) { Events.on("roomEnter", c => { if (c.room.type !== "start" && !c.room.cleared) { p.shield += Math.round(p.maxHp * 0.08); FX.ring(p.x, p.y - 6, 14, "#ffb13b", 0.3); } }, FX_OWNER); },
  g_spellFlow(p) {
    Events.on("skillHit", c => { if (c.p !== p || !p.skillCd) return; const now = GAME.time; if (p._flowT > now) return; p._flowT = now + 0.2;
      for (const s of ["spell1", "spell2"]) if (s !== p._lastCast && p.skillCd[s] > 0) p.skillCd[s] = Math.max(0, p.skillCd[s] - 0.5); }, FX_OWNER);
    Events.on("castSkill", c => { if (c.p === p) p._lastCast = c.slot; }, FX_OWNER);
  },
  g_tenKills(p) { let n = 0; Events.on("kill", c => { if (c.src === p && ++n % 10 === 0) { const h = Math.round(p.maxHp * 0.05); p.hp = Math.min(p.maxHp, p.hp + h); FX.number(p.x, p.y - 20, h, "heal"); } }, FX_OWNER); },

  /* ── Thần Thoại ── */
  m_farmThrone(p) { p.dmgMods.push(() => 0.4); Events.on("roomClear", () => { if (GAME.save) GAME.save.am = Math.min(100, (GAME.save.am || 0) + 1); }, FX_OWNER); },
  m_abyssHeart(p) { p.cheatDeath = () => { if (p._heartUsed) return false; p._heartUsed = true; p.hp = Math.round(p.maxHp * 0.5); p.maxHp = Math.round(p.maxHp * 0.8); p.hp = Math.min(p.hp, p.maxHp); p.iframes = 2; FX.flashScreen("rgba(180,60,255,.35)", 0.4); UI.showBanner("TRÁI TIM VỰC", "đập thêm một nhịp", 1.4); return true; }; },
  m_namelessBlade(p) { p.dmgMods.push(() => Object.values((GAME.save && GAME.save.lore) || {}).filter(l => l.frags >= 5).length * 0.02); },
  m_echoStaff(p) {
    let n = 0;
    Events.on("attack", c => {
      if (c.p !== p || WEAPON_TYPES[p.weapon.wtype].kind !== "shot" || ++n % 5) return;
      for (let i = -2; i <= 2; i++) if (i) GAME.world.projs.push(createProjectile({ x: p.x, y: p.y - 6, angle: p.aim + i * 0.18, speed: 260, r: 3, dmg: c.base, dtype: "spell", team: 0, life: 1, owner: p, color: "#d6b0ff", src: "uniq" }));
    }, FX_OWNER);
  },
  m_fallingStarBow(p) { Events.on("hit", c => { if (c.src === p && c.crit && c.opts.proj && c.opts.source === "weapon") GAME.world.hazards.push(createHazard({ kind: "lob", team: 0, x: c.tgt.x, y: c.tgt.y, fromX: c.tgt.x - 30, fromY: c.tgt.y - 120, r: 20, delay: 0.4, dmg: c.amount * 0.6, src: p, sprite: "rock", color: "#ffd23d" })); }, FX_OWNER); },
  m_graveBoots(p) { Events.on("dodge", c => { if (c.p === p) GAME.world.hazards.push(createHazard({ kind: "zone", sub: "poison", team: 0, x: p.x, y: p.y, r: 16, life: 2, tickDmg: (p.weapon.dmg || 10) * 0.3, poison: true, src: p })); }, FX_OWNER); },
};

const Effects = {
  /** gọi khi vào hầm/phòng thử: đăng ký hiệu ứng của mọi món độc nhất đang mặc */
  registerRun(p) {
    Events.off(FX_OWNER);
    p.dmgMods = []; p.lightMult = 1; p.cheatDeath = null; p.rage = false; p.helmShield = null; p.projImmuneT = 0;
    const list = [];
    if (p.save) for (const s of EQUIP_SLOTS) { const it = equippedItem(p.save, s); if (it && it.unique && EFFECT_IMPL[it.unique]) list.push(it.unique); }
    for (const k of p.testEffects || []) list.push(k);
    for (const k of new Set(list)) EFFECT_IMPL[k](p);
    return list;
  },
  clear() { Events.off(FX_OWNER); },
  /** hiệu ứng cần cập nhật mỗi bước (Mũ Đội Trưởng, Cơn Giận) */
  tick(world, p, dt) {
    if (p.projImmuneT > 0) p.projImmuneT -= dt;
    if (p.helmShield) {
      const h = p.helmShield; h.cd -= dt;
      if (p.moving || Input.state.attack) h.still = 0; else h.still += dt;
      if (h.still >= 1 && h.cd <= 0) { h.cd = 6; p.shield += Math.round(p.maxHp * 0.1); FX.ring(p.x, p.y - 6, 14, "#c8d0e0", 0.3); Audio.sfx("door_close"); }
    }
    p.rageOn = p.rage && p.hp < p.maxHp * 0.3;
  },
};

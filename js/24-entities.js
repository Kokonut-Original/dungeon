/* 24-entities: tạo thực thể + logic người chơi (đi, lăn, đánh, bình máu) */
const HERO_LOOKS = { knight: "knight_m", mage: "wizzard_m", hunter: "elf_m", lizard: "lizard_m" };
const WEAPON_SPRITE = { sword: "weapon_rusty_sword", heavy: "weapon_hammer", spear: "weapon_spear", dagger: "weapon_knife",
  bow: "weapon_bow", staff: "weapon_red_magic_staff", tome: "weapon_green_magic_staff" };

function baseEntity(kind, x, y, r) {
  return { id: uid(), kind, x, y, vx: 0, vy: 0, r, team: 0, hp: 1, maxHp: 1, shield: 0, dead: false,
    sprite: null, animT: Math.random() * 3, flip: false, tint: null, scale: 1, flash: 0, iframes: 0,
    knockX: 0, knockY: 0, status: {}, z: 0 };
}

/** người chơi; hero = {name, look, level, points}; save = để đọc đồ đang mặc (null ở phòng thử) */
function createPlayer(hero, x, y, save = null) {
  const p = baseEntity("player", x, y, CONFIG.PLAYER_R);
  p.hero = hero; p.save = save; p.team = 0; p.sprite = HERO_LOOKS[hero.look] || "knight_m";
  refreshPlayerStats(p);
  p.hp = p.maxHp;
  p.potionMax = save ? save.potionMax : CONFIG.POTIONS;
  p.aim = 0; p.atkT = 0; p.combo = 0; p.comboT = 0;
  p.dodgeT = 0; p.dodgeCd = 0; p.dodgeDx = 0; p.dodgeDy = 0;
  p.potions = p.potionMax; p.potionCd = 0;
  p.swing = null;                   // vệt chém đang hiển thị
  p.moving = false; p.stepT = 0;
  return p;
}

/** tính lại chỉ số khi lên cấp / đổi đồ; giữ nguyên tỉ lệ máu hiện tại */
function refreshPlayerStats(p) {
  const frac = p.maxHp > 1 ? p.hp / p.maxHp : 1;
  p.stats = computePlayerStats(p.hero, p.save);
  const w = p.stats.weapon;
  p.weapon = w ? { wtype: w.wtype, dmg: w.dmg } : { wtype: (p.weapon && p.weapon.wtype) || "sword", dmg: null };
  p.maxHp = p.stats.maxHp; p.hp = Math.max(1, Math.round(p.maxHp * frac));
}

function createEnemy(defId, level, opts = {}) {
  const def = ENEMIES[defId], diff = opts.diff || DIFF_NORMAL;
  const big = (def.scale || 1) * (opts.elite ? 1.25 : 1);
  const e = baseEntity("enemy", opts.x, opts.y, def.r * (opts.elite ? 1.25 : 1));
  const st = enemyStats(def, level, diff, opts.elite);
  Object.assign(e, { defId, def, team: 1, sprite: def.sprite, level, diff, hp: st.hp, maxHp: st.hp, dmg: st.dmg,
    speed: def.spd, ai: def.ai, params: def.params || {}, elite: !!opts.elite, scale: big, tint: def.tint || null,
    isBoss: !!def.isBoss, miniboss: !!def.miniboss, room: opts.room || null, invuln: 0,
    aiState: "spawn", aiT: 0, cd: rand(0.5, 1.5), facing: 0 });
  return e;
}

/** đạn: {x,y,angle,speed,r,dmg,dtype,team,pierce,life,homing,color,splash,owner} */
function createProjectile(o) {
  const p = baseEntity("proj", o.x, o.y, o.r || 3);
  Object.assign(p, { team: o.team, dmg: o.dmg, dtype: o.dtype || "phys", pierce: o.pierce || 0, life: o.life || 2,
    homing: o.homing || 0, color: o.color || (o.team === 0 ? "#9fe8ff" : "#ff5a5a"), splash: o.splash || 0,
    owner: o.owner || null, hitSet: new Set(), knock: o.knock || 30, glow: o.glow !== false, shape: o.shape || "orb",
    burnC: o.burnC || 0, boom: o.boom || null, boomerang: o.boomerang || null, srcTag: o.src || "weapon", trail: o.trail || null, crit2: !!o.crit2 });
  p.vx = Math.cos(o.angle) * o.speed; p.vy = Math.sin(o.angle) * o.speed; p.speed = o.speed;
  return p;
}

/**
 * vùng nguy hiểm (xem Hazards trong 25-combat):
 *  circle: vòng báo đỏ `delay` giây rồi gây `dmg` trong bán kính r (1 lần)
 *  line:   dải báo đỏ từ (x,y) theo góc `ang`, dài `len`, rộng `width`, rồi gây `dmg` (1 lần)
 *  lob:    như circle nhưng có vật bay vòng cung từ (fromX,fromY) tới (x,y) — `sprite`
 *  zone:   vùng tồn tại `life` giây: gây `dps` và/hoặc làm chậm `slow` khi đứng trong (kind con: fire/slime)
 *  cart:   khối di chuyển theo (vx,vy) sau `delay`, chạm là gây `dmg`
 */
function createHazard(o) {
  const h = baseEntity("hazard", o.x, o.y, o.r || 16);
  Object.assign(h, { hkind: "circle", t: 0, delay: 0, life: 0, triggered: false, color: "#ff3a3a", dmg: 0, dps: 0, slow: 0, team: 1, hitDone: false }, o);
  h.hkind = o.kind || "circle"; h.life = o.life || h.delay + 0.25;
  return h;
}

function createPickup(o) {
  const p = baseEntity("pickup", o.x, o.y, 4);
  Object.assign(p, { pkind: o.kind, value: o.value || 0, vx: o.vx || 0, vy: o.vy || 0, t: 0 });
  return p;
}

/* ───────── Logic người chơi ───────── */
const Player = {
  update(world, p, dt) {
    const s = Input.state, st = p.stats;
    p.animT += dt; if (p.flash > 0) p.flash -= dt; if (p.iframes > 0) p.iframes -= dt;
    p.atkT -= dt; p.dodgeCd -= dt; p.potionCd -= dt; p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;
    if (p.swing) { p.swing.t += dt; if (p.swing.t > p.swing.dur) p.swing = null; else Combat.parryBullets(world, p); }
    p.aim = Math.atan2(s.aimY, s.aimX);
    if (p.dead) return;
    if (st.regen && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * st.regen * dt);
    const stunned = p.status.stun || p.status.freeze;

    // lăn né
    if (p.dodgeT > 0) {
      p.dodgeT -= dt;
      const sp = CONFIG.DODGE_DIST / CONFIG.DODGE_T;
      moveAndCollide(world, p, p.dodgeDx * sp * dt, p.dodgeDy * sp * dt);
      if (Math.random() < 0.6) FX.particles(p.x, p.y, { n: 1, color: "rgba(220,210,255,.7)", speed: 15, life: 0.3, size: 2 });
    } else if (!stunned) {
      let mx = s.moveX, my = s.moveY;
      const slow = (p.status.slow ? 1 - p.status.slow.amt : 1) * (p.active && p.active.whirl ? 0.7 : 1);
      moveAndCollide(world, p, mx * st.moveSpeed * slow * dt, my * st.moveSpeed * slow * dt);
      p.moving = Math.hypot(mx, my) > 0.1;
      if (p.moving) { p.stepT -= dt; if (p.stepT <= 0) { p.stepT = 0.18; FX.particles(p.x, p.y + 1, { n: 2, color: "rgba(180,170,200,.5)", speed: 12, life: 0.35, size: 2 }); } }
      if (s.dodgePressed && p.dodgeCd <= 0) {
        let [dx, dy] = normalize(mx, my); if (!dx && !dy) { dx = s.aimX; dy = s.aimY; }
        p.dodgeDx = dx; p.dodgeDy = dy; p.dodgeT = CONFIG.DODGE_T; p.dodgeCd = st.dodgeCd;
        p.iframes = Math.max(p.iframes, CONFIG.DODGE_IFRAME); Audio.sfx("dodge"); Events.emit("dodge", { p });
      }
      if (s.attack && p.atkT <= 0 && !(p.active && p.active.whirl)) Combat.weaponAttack(world, p);
    }
    Skills.update(world, p, dt);
    Effects.tick(world, p, dt);
    p.flip = Math.cos(p.aim) < 0;

    // đẩy lùi
    if (p.knockX || p.knockY) { moveAndCollide(world, p, p.knockX * dt, p.knockY * dt); p.knockX *= Math.pow(0.001, dt); p.knockY *= Math.pow(0.001, dt);
      if (Math.abs(p.knockX) + Math.abs(p.knockY) < 5) p.knockX = p.knockY = 0; }

    // bình máu
    if (s.potionPressed && p.potions > 0 && p.potionCd <= 0 && p.hp < p.maxHp) {
      p.potions--; p.potionCd = CONFIG.POTION_CD; const heal = Math.round(p.maxHp * CONFIG.POTION_HEAL * (1 + st.potionEff));
      p.hp = Math.min(p.maxHp, p.hp + heal); FX.number(p.x, p.y - 20, heal, "heal"); Audio.sfx("potion");
      FX.particles(p.x, p.y - 8, { n: 16, color: "#ff6a8a", speed: 50, life: 0.6, gravity: -60 });
    }
  },
};

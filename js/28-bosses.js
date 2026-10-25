/* 28-bosses: boss & mini boss nhiều pha (GDD 7.4, 7.5).
   BOSS_IMPL[key].phases = [{ until: tỉ lệ máu kết thúc pha, name, attacks: [tên đòn...], speed }]
   Mỗi đòn trong BOSS_ATTACKS trả về một "task" {dur, update?(dt) -> true khi xong}. */
const BOSS_IMPL = {
  foreman: { phases: [
    { until: 0.6, name: "", attacks: ["slam", "rockfall", "charge"], speed: 1 },
    { until: 0.25, name: "CA ĐÊM", attacks: ["slam", "summon", "rockfall", "carts", "charge"], speed: 1 },
    { until: 0, name: "ĐÀO! ĐÀO TIẾP!", attacks: ["slam3", "rockfall", "carts", "charge", "summon"], speed: 1.25 },
  ] },
  hoa: { phases: [
    { until: 0, name: "", attacks: ["lantern", "lantern", "charge"], speed: 1 },
  ] },
};

const Bosses = {
  update(e, dt, world, pl) {
    const impl = BOSS_IMPL[e.def.boss], B = e.bs || (e.bs = { phase: 0, cur: null, rest: 1.2, idx: 0 });
    if (e.invuln > 0) e.invuln -= dt;
    // đổi pha theo máu
    const frac = e.hp / e.maxHp;
    let ph = 0; while (ph < impl.phases.length - 1 && frac <= impl.phases[ph].until) ph++;
    if (ph !== B.phase) {
      B.phase = ph; B.cur = null; B.rest = 1.4; B.idx = 0; e.invuln = 1.2; e.tele = null;
      const name = impl.phases[ph].name;
      if (name) UI.showBanner(name, e.def.name, 1.4);
      FX.shake(0.7); FX.flashScreen("rgba(255,220,150,.25)", 0.25); Audio.sfx("boss_phase");
      world.hazards = world.hazards.filter(h => h.hkind === "zone");      // xoá đòn đang báo dở cho công bằng
    }
    const P = impl.phases[B.phase], spd = P.speed || 1;
    if (B.cur) {
      B.cur.t = (B.cur.t || 0) + dt * spd;
      const done = B.cur.update ? B.cur.update(dt * spd) : B.cur.t >= B.cur.dur;
      if (done || B.cur.t > (B.cur.dur || 99)) { B.cur = null; B.rest = rand(0.8, 1.2) / spd; e.tele = null; }
      return;
    }
    // nghỉ giữa hai đòn: tiến chậm về phía người chơi
    B.rest -= dt;
    e.moving = false;
    if (dist(e, pl) > 40) stepToward(world, e, pl.x, pl.y, dt, 0.8 * spd);
    if (B.rest <= 0) {
      const name = P.attacks[B.idx % P.attacks.length]; B.idx++;
      B.cur = BOSS_ATTACKS[name](e, world, pl); B.cur.t = 0;
    }
  },
};

/** dải đỏ báo trước từ boss tới người chơi rồi nện xuống */
function slamTask(e, world, pl, delay = 0.8) {
  const ang = angleTo(e, pl);
  world.hazards.push(createHazard({ kind: "line", x: e.x, y: e.y - 4, ang, len: 130, width: 18, delay, dmg: e.dmg, src: e }));
  e.facing = ang; e.tele = { kind: "glow", t: 0 };
  Audio.sfx("telegraph");
}

const BOSS_ATTACKS = {
  slam(e, world, pl) { slamTask(e, world, pl); return { dur: 1.05 }; },
  slam3(e, world, pl) {
    let n = 0, next = 0;
    return { dur: 2.2, update(dt) { next -= dt; if (n < 3 && next <= 0) { slamTask(e, world, pl, 0.6); n++; next = 0.5; } return this.t >= this.dur; } };
  },
  rockfall(e, world, pl) {
    for (let i = 0; i < 6; i++) {
      const a = rand(0, TAU), d = i === 0 ? 0 : rand(14, 60);
      world.hazards.push(createHazard({ kind: "lob", x: pl.x + Math.cos(a) * d, y: pl.y + Math.sin(a) * d, fromX: pl.x + rand(-40, 40), fromY: pl.y - 160,
        r: 16, delay: 1.0 + i * 0.08, dmg: e.dmg * 0.8, sprite: "rock", src: e }));
    }
    FX.shake(0.3); Audio.sfx("boss_roar");
    return { dur: 1.4 };
  },
  /** vạch đường 0.6 s rồi lao thẳng; đâm tường thì tự choáng 1 s */
  charge(e, world, pl) {
    const ang = angleTo(e, pl), sp = e.def.boss === "hoa" ? 240 : 300;
    let state = "aim", hit = false;
    e.tele = { kind: "dash", ang, len: 160 };
    Audio.sfx("telegraph");
    return { dur: 3, update(dt) {
      if (state === "aim") { if (this.t >= 0.6) { state = "go"; e.tele = null; Audio.sfx("dodge"); } return false; }
      if (state === "go") {
        e.moving = true;
        const wall = moveAndCollide(world, e, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt);
        if (Math.random() < 0.6) FX.particles(e.x, e.y, { n: 1, color: "rgba(200,180,150,.7)", speed: 20, life: 0.3, size: 2 });
        if (!hit && dist(e, pl) < e.r + pl.r + 4) { hit = true; dealDamage(e, pl, { base: e.dmg * 1.1, type: "phys", knock: 150, kx: Math.cos(ang), ky: Math.sin(ang) }); }
        if (wall || this.t > 1.8) { state = "stun"; if (wall) { applyStatus(e, "stun", { t: 1 }); FX.shake(0.5); Audio.sfx("explode"); FX.particles(e.x, e.y - 10, { n: 10, color: "#ffd23d", speed: 60, life: 0.6 }); } return wall ? false : true; }
        return false;
      }
      return !e.status.stun;
    } };
  },
  summon(e, world, pl) {
    const alive = world.enemies.filter(x => !x.dead && !x.def.isBoss).length;
    if (alive < 6) for (let i = 0; i < 3; i++) {
      const pos = randomFloorPos(world, pl.x, pl.y, 40, e.room);
      world.enemies.push(createEnemy("mine_goblin", e.level, { x: pos.x, y: pos.y, diff: e.diff }));
    }
    Audio.sfx("boss_roar"); e.tele = { kind: "glow", t: 1 };
    return { dur: 0.9 };
  },
  /** 2 xe goòng chạy ngang phòng theo 2 hàng, báo đỏ 1 s trước */
  carts(e, world, pl) {
    const r = e.room; if (!r) return { dur: 0.1 };
    const rows = [], top = r.y + 2, bot = r.y + r.h - 3;
    rows.push(clamp(Math.floor(pl.y / T), top, bot));
    let other; do { other = randInt(top, bot); } while (Math.abs(other - rows[0]) < 3);
    rows.push(other);
    rows.forEach((ty, i) => {
      const fromLeft = (i + Math.floor(GAME.time)) % 2 === 0, y = (ty + 0.5) * T;
      const x = fromLeft ? (r.x + 1) * T : (r.x + r.w - 1) * T, len = (r.w - 2) * T;
      world.hazards.push(createHazard({ kind: "cart", x, y, vx: fromLeft ? 280 : -280, vy: 0, delay: 1.0 + i * 0.3, life: 1.0 + i * 0.3 + len / 280 + 0.1,
        lane: { x0: (r.x + 1) * T, x1: (r.x + r.w - 1) * T }, r: 9, dmg: e.dmg, sprite: "cart", src: e }));
    });
    Audio.sfx("telegraph");
    return { dur: 1.8 };
  },
  /** Hòa ném đèn lồng: vỡ ra thành vùng lửa 3 s */
  lantern(e, world, pl) {
    world.hazards.push(createHazard({ kind: "lob", x: pl.x + rand(-6, 6), y: pl.y + rand(-6, 6), fromX: e.x, fromY: e.y - 14, r: 22, delay: 0.85, dmg: e.dmg * 0.8,
      sprite: "lantern", color: "#ff8a2a", src: e,
      onTrigger: (h, w) => w.hazards.push(createHazard({ kind: "zone", sub: "fire", x: h.x, y: h.y, r: 22, life: 3, dps: e.dmg * 0.5, color: "#ff8a2a", src: e })) }));
    e.tele = { kind: "glow", t: 1 }; Audio.sfx("enemy_shoot");
    return { dur: 1.0 };
  },
};

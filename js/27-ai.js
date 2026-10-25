/* 27-ai: máy trạng thái của quái (GDD 7.2). Thêm hành vi mới = thêm hàm vào AI_BEHAVIORS. */
const AI = {
  updateAll(world, dt) {
    const pl = world.player;
    for (const e of world.enemies) {
      if (e.dead) continue;
      e.animT += dt; if (e.flash > 0) e.flash -= dt;
      // xuất hiện sau vòng báo
      if (e.aiState === "spawn") { e.aiT += dt; if (e.aiT >= CONFIG.SPAWN_TELEGRAPH) { e.aiState = "idle"; e.aiT = 0; FX.particles(e.x, e.y - 4, { n: 12, color: "#c9a0ff", speed: 70, life: 0.35 }); } continue; }
      Status.update(world, e, dt);
      if (e.dead) continue;
      // đẩy lùi
      if (e.knockX || e.knockY) {
        moveAndCollide(world, e, e.knockX * dt, e.knockY * dt);
        const f = Math.pow(0.0005, dt); e.knockX *= f; e.knockY *= f;
        if (Math.abs(e.knockX) + Math.abs(e.knockY) < 4) e.knockX = e.knockY = 0;
      }
      if (e.status.stun || e.status.freeze) continue;
      if (pl && pl.invisT > 0 && !e.isBoss) { e.moving = false; e.tele = null; if (e.aiState === "windup") e.aiState = "idle"; continue; }   // Bước Bóng: quái mất dấu
      const B = AI_BEHAVIORS[e.ai]; if (B && pl) B(e, dt, world, pl);
      e.flip = pl ? pl.x < e.x : e.flip;
    }
    // đẩy quái tách nhau ra cho khỏi chồng lên nhau
    const list = world.enemies;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]; if (a.dead || b.dead) continue;
      const d2 = dist2(a.x, a.y, b.x, b.y), rr = a.r + b.r;
      if (d2 > 0.01 && d2 < rr * rr) {
        const d = Math.sqrt(d2), push = (rr - d) / 2, nx = (a.x - b.x) / d, ny = (a.y - b.y) / d;
        moveAndCollide(world, a, nx * push, ny * push); moveAndCollide(world, b, -nx * push, -ny * push);
      }
    }
  },
};

/** đi về phía mục tiêu với tốc độ của quái (có tính Chậm) */
function stepToward(world, e, tx, ty, dt, mult = 1) {
  const [nx, ny] = normalize(tx - e.x, ty - e.y);
  const slow = e.status.slow ? 1 - e.status.slow.amt * (e.boss ? 0.5 : 1) : 1;
  const hit = moveAndCollide(world, e, nx * e.speed * mult * slow * dt, ny * e.speed * mult * slow * dt);
  e.moving = true;
  return hit;
}

const AI_BEHAVIORS = {
  /** đuổi → gồng (báo đỏ) → chém quạt → nghỉ */
  chaser(e, dt, world, pl) {
    const P = e.params, d = dist(e, pl);
    e.aiT += dt; e.moving = false;
    if (P.trail) {                                   // Sên: để lại vệt nhớt làm chậm
      e.trailT = (e.trailT || 0) - dt;
      if (e.trailT <= 0) { e.trailT = P.trail.every; world.hazards.push(createHazard({ kind: "zone", sub: "slime", x: e.x, y: e.y, r: P.trail.r, life: P.trail.life, slow: P.trail.slow, color: "#8acf6a" })); }
    }
    switch (e.aiState) {
      case "idle":
        if (d > P.range + pl.r + 2) stepToward(world, e, pl.x, pl.y, dt);
        else { e.aiState = "windup"; e.aiT = 0; e.facing = angleTo(e, pl); Audio.sfx("telegraph"); }
        break;
      case "windup":
        e.tele = { kind: "arc", ang: e.facing, arc: P.arc, range: P.range + 8, t: e.aiT / P.windup };
        if (e.aiT >= P.windup) {
          e.tele = null; e.aiState = "recover"; e.aiT = 0;
          e.swing = { ang: e.facing, arc: P.arc, range: P.range + 8, t: 0, dur: 0.12 };
          if (arcHit(e.x, e.y - 4, e.facing, P.arc, P.range + 8, pl.x, pl.y - 4, pl.r)) {
            const [kx, ky] = normalize(pl.x - e.x, pl.y - e.y); dealDamage(e, pl, { base: e.dmg, type: "phys", knock: 40, kx, ky });
          }
        }
        break;
      case "recover":
        if (e.swing) { e.swing.t += dt; if (e.swing.t > e.swing.dur) e.swing = null; }
        if (e.aiT >= P.recover) { e.aiState = "idle"; e.aiT = 0; }
        break;
    }
  },

  /** giữ khoảng cách, đi ngang; tới lượt thì gồng rồi bắn theo pattern */
  shooter(e, dt, world, pl) {
    const P = e.params, d = dist(e, pl); e.moving = false;
    e.cd -= dt;
    if (e.aiState === "windup") {
      e.aiT += dt; e.tele = { kind: "glow", t: e.aiT / 0.4 };
      if (e.aiT >= 0.4) { e.tele = null; e.aiState = "idle"; e.cd = P.cd * rand(0.85, 1.15); Patterns[P.pattern](world, e, pl, P); }
      return;
    }
    if (!e.strafe || Math.random() < dt * 0.5) e.strafe = Math.random() < 0.5 ? 1 : -1;
    const a = angleTo(pl, e);
    let tx, ty;
    if (d < P.min) { tx = e.x + Math.cos(a) * 30; ty = e.y + Math.sin(a) * 30; }
    else if (d > P.max || !lineOfSight(world, e.x, e.y, pl.x, pl.y)) { tx = pl.x; ty = pl.y; }
    else { const s = a + e.strafe * Math.PI / 2; tx = e.x + Math.cos(s) * 30; ty = e.y + Math.sin(s) * 30; }
    if (stepToward(world, e, tx, ty, dt, 0.8)) e.strafe = -e.strafe;
    if (e.cd <= 0 && d < P.max + 40 && lineOfSight(world, e.x, e.y - 4, pl.x, pl.y - 4)) { e.aiState = "windup"; e.aiT = 0; }
  },

  /** giữ khoảng cách, ném đá vòng cung tới chỗ người chơi; điểm rơi có vòng đỏ báo trước */
  lobber(e, dt, world, pl) {
    const P = e.params, d = dist(e, pl); e.moving = false; e.cd -= dt;
    if (e.aiState === "windup") {
      e.aiT += dt; e.tele = { kind: "glow", t: e.aiT / 0.35 };
      if (e.aiT >= 0.35) {
        e.tele = null; e.aiState = "idle"; e.cd = P.cd * rand(0.85, 1.2);
        const tx = pl.x + pl.vx * 0.3 + rand(-8, 8), ty = pl.y + rand(-8, 8);
        world.hazards.push(createHazard({ kind: "lob", x: tx, y: ty, fromX: e.x, fromY: e.y - 8, r: P.r, delay: P.flight, dmg: e.dmg, sprite: "rock", src: e }));
        Audio.sfx("enemy_shoot");
      }
      return;
    }
    let tx = pl.x, ty = pl.y;
    if (d < P.min) { const a = angleTo(pl, e); tx = e.x + Math.cos(a) * 30; ty = e.y + Math.sin(a) * 30; stepToward(world, e, tx, ty, dt); }
    else if (d > P.max) stepToward(world, e, tx, ty, dt);
    if (e.cd <= 0 && d < P.max + 30) { e.aiState = "windup"; e.aiT = 0; }
  },

  /** boss / mini boss: giao cho 28-bosses.js */
  boss(e, dt, world, pl) { Bosses.update(e, dt, world, pl); },

  /** lao tới, gần thì nháy rồi nổ (nổ trúng cả quái khác) */
  bomber(e, dt, world, pl) {
    const P = e.params; e.moving = false;
    if (e.aiState === "fuse") {
      e.aiT += dt; e.tele = { kind: "circle", r: P.r, t: e.aiT / P.fuse };
      if (Math.floor(e.aiT * 12) % 2 === 0) e.flash = 0.04;
      if (e.aiT >= P.fuse) { e.tele = null; e.dead = true; e.hp = 0; explode(world, e.x, e.y, P.r, e.dmg, 1, e, { hitsAll: true }); FX.deathBurst(e); }
      return;
    }
    if (dist(e, pl) < 20) { e.aiState = "fuse"; e.aiT = 0; Audio.sfx("telegraph"); return; }
    stepToward(world, e, pl.x, pl.y, dt, 1 + Math.sin(e.animT * 8) * 0.15);
  },
};

/** kiểu đạn của quái */
const Patterns = {
  aimed(world, e, pl, P) {
    const base = Math.atan2(pl.y - 4 - (e.y - 4), pl.x - e.x), n = P.n || 1, spread = (P.spread || 0) * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const a = base + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0);
      world.projs.push(createProjectile({ x: e.x, y: e.y - 5, angle: a, speed: P.bulletSpeed || 120, r: 3, dmg: e.dmg, team: 1, life: 3 }));
    }
    Audio.sfx("enemy_shoot");
  },
  ring(world, e, pl, P) {
    const n = P.n || 8, off = rand(0, TAU);
    for (let i = 0; i < n; i++) world.projs.push(createProjectile({ x: e.x, y: e.y - 5, angle: off + i * TAU / n, speed: P.bulletSpeed || 100, r: 3, dmg: e.dmg, team: 1, life: 3 }));
    Audio.sfx("enemy_shoot");
  },
};

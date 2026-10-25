/* 13-data-enemies: định nghĩa quái (GDD 7.3). Hành vi nằm trong 27-ai.js theo key `ai`;
   boss/mini boss dùng ai "boss" + logic trong 28-bosses.js theo key `boss`. */
const ENEMIES = {
  /* ── D1 · Mỏ Bỏ Hoang ── */
  mine_goblin: { name: "Yêu Tinh Đào Mỏ", sprite: "goblin", ai: "chaser", hpK: 0.7, dmgK: 0.7, spd: 70, r: 6, cost: 1,
    params: { range: 14, windup: 0.35, arc: 90, recover: 0.5 } },
  mine_slug: { name: "Sên Mỏ", sprite: "tiny_slug", ai: "chaser", hpK: 0.9, dmgK: 0.5, spd: 30, r: 6, cost: 1,
    params: { range: 12, windup: 0.5, arc: 100, recover: 0.6, trail: { every: 0.35, r: 7, life: 3, slow: 0.2 } } },
  mine_skel: { name: "Xương Thợ Mỏ", sprite: "skelet", ai: "chaser", hpK: 1.0, dmgK: 1.0, spd: 50, r: 6, cost: 2,
    params: { range: 18, windup: 0.6, arc: 120, recover: 0.7 } },
  mine_mud: { name: "Bùn Ném Đá", sprite: "muddy", ai: "lobber", hpK: 0.8, dmgK: 0.9, spd: 35, r: 6, cost: 2,
    params: { cd: 2.2, flight: 0.9, r: 14, min: 50, max: 130 } },
  mine_spark: { name: "Đốm Lửa Mỏ", sprite: "imp", ai: "bomber", hpK: 0.5, dmgK: 2.5, spd: 80, r: 5, cost: 2,
    params: { r: 26, fuse: 0.8 } },

  /* ── D2 (dùng trong phòng thử) ── */
  lib_ink: { name: "Yêu Mực", sprite: "wogol", ai: "shooter", hpK: 0.8, dmgK: 0.8, spd: 50, r: 6, cost: 2,
    params: { min: 60, max: 110, cd: 1.8, pattern: "aimed", n: 3, spread: 20, bulletSpeed: 120 } },

  /* ── Mini boss & boss (GDD 7.4, 7.5) ── */
  mb_hoa: { name: "Hòa Đèn Lồng", title: "Kẻ Ở Lại", sprite: "hoa", ai: "boss", boss: "hoa", miniboss: true,
    hpK: 12, dmgK: 1.4, spd: 45, r: 7, scale: 1.5, tint: null },
  boss_foreman: { name: "Quản Đốc Cuốc", title: "Boss · Mỏ Bỏ Hoang", sprite: "ogre", ai: "boss", boss: "foreman", isBoss: true,
    hpK: 40, dmgK: 1.6, spd: 40, r: 12, scale: 1.4, weapon: "weapon_big_hammer" },
};

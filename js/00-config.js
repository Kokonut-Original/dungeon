/* 00-config: mọi hằng số và tham số cân bằng. Chỉnh số ở đây, không sửa logic. */
const CONFIG = {
  TILE: 16, VIEW_W: 480, VIEW_H: 270, STEP: 1 / 60,
  G_BASE: 1.065, LEVEL_CAP: 60, POINTS_PER_LEVEL: 3, XP_A: 50, XP_P: 1.6,
  STAT_PCT: 0.02, BASE_HP: 60, BASE_CRIT: 0.05, BASE_CRIT_MULT: 1.5,
  MOVE_SPEED: 90, DODGE_T: 0.30, DODGE_DIST: 70, DODGE_IFRAME: 0.25, DODGE_CD: 0.8,
  HURT_IFRAME: 0.5, POTIONS: 3, POTION_HEAL: 0.40, POTION_CD: 1.5, ORB_HEAL: 0.06,
  ENEMY_HP_BASE: 28, ENEMY_DMG_BASE: 12, ELITE_HP: 3, ELITE_DMG: 1.5,
  MINIBOSS_HP: 12, MINIBOSS_DMG: 1.4, BOSS_HP: 40, BOSS_DMG: 1.6,
  ITEM_DROP: 0.02, ELITE_ITEM_DROP: 0.25, ORB_DROP: 0.06,
  GOLD_BASE: 2, XP_BASE: 4, XP_EXP: 1.2,
  UPGRADE_BASE: 40, UPGRADE_EXP: 1.6, UPGRADE_MAIN: 0.10, UPGRADE_AFF: 0.25,
  SELL_BASE: 6, ROOM_BUDGET_BASE: 6, ROOM_BUDGET_STEP: 2,
  SPAWN_TELEGRAPH: 0.7, MAX_ENEMY_BULLETS: 120, MAX_PARTICLES: 300,
  AM_DMG_PER_POINT: 0.003, AM_MAX: 100,
  ABYSS_MULT_BASE: 1.1, ABYSS_MULT_STEP: 0.01,
  PLAYER_R: 6, PLAYER_LIGHT: 110, CAM_LERP: 0.12, CAM_LEAD: 8,
  AUTOAIM_RANGE: 170,
};

/* Loại vũ khí (GDD 5.1). base = sát thương cấp 1 độ hiếm Thường */
const WEAPON_TYPES = {
  sword:  { name: "Kiếm",     scale: "phys",  base: 10, interval: 0.38, kind: "melee", arc: 100, range: 26, combo: [1, 1, 1.6], knock: 60 },
  heavy:  { name: "Búa/Rìu",  scale: "phys",  base: 22, interval: 0.75, kind: "melee", arc: 140, range: 30, knock: 140 },
  spear:  { name: "Giáo",     scale: "phys",  base: 13, interval: 0.50, kind: "thrust", len: 40, width: 10, knock: 50 },
  dagger: { name: "Dao",      scale: "phys",  base: 6,  interval: 0.22, kind: "melee", arc: 70, range: 20, crit: 0.10, knock: 30 },
  bow:    { name: "Cung",     scale: "phys",  base: 9,  interval: 0.42, kind: "shot", speed: 320, life: 0.9, r: 2 },
  staff:  { name: "Gậy phép", scale: "spell", base: 9,  interval: 0.42, kind: "shot", speed: 260, life: 1.0, r: 3, splash: 10 },
  tome:   { name: "Sách phép",scale: "spell", base: 12, interval: 0.60, kind: "shot", speed: 180, life: 1.6, r: 4, homing: 4 },
};

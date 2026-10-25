/* 15-data-dungeons: định nghĩa hầm và độ khó (GDD 8.1, 8.4) */
const DIFFICULTIES = {
  easy:      { key: "easy",      name: "Dễ",      offset: 0,  hp: 0.7, dmg: 0.6, loot: 0.7, xp: 0.8, elite: 0,    revives: 1, rarity: [80, 18, 2, 0, 0] },
  normal:    { key: "normal",    name: "Thường",  offset: 3,  hp: 1.0, dmg: 1.0, loot: 1.0, xp: 1.0, elite: 0.03, revives: 1, rarity: [65, 28, 6, 1, 0] },
  hard:      { key: "hard",      name: "Khó",     offset: 6,  hp: 1.5, dmg: 1.3, loot: 1.4, xp: 1.3, elite: 0.08, revives: 0, rarity: [45, 38, 13, 3.5, 0.5] },
  insane:    { key: "insane",    name: "Điên",    offset: 9,  hp: 2.2, dmg: 1.7, loot: 2.0, xp: 1.7, elite: 0.15, revives: 0, rarity: [25, 42, 23, 8, 2] },
  nightmare: { key: "nightmare", name: "Ác Mộng", offset: 12, hp: 3.2, dmg: 2.2, loot: 3.0, xp: 2.2, elite: 0.25, revives: 0, rarity: [10, 40, 32, 14, 4] },
};
const DIFF_ORDER = ["easy", "normal", "hard", "insane", "nightmare"];
/** phần trăm vàng nhặt trong lượt bị mất khi chết (GDD 8.6) */
const DEATH_GOLD_LOSS = { easy: 0, normal: 0.1, hard: 0.5, insane: 1, nightmare: 1 };

const DUNGEONS = {
  mine: {
    id: "mine", name: "Mỏ Bỏ Hoang", chapter: 1, baseLevel: 1,
    tint: "#8a6a4a", ambientDark: 0.55, music: "mine",
    theme: { floor: ["#3a2e2a", "#40332d", "#362a26"], floorLine: "#2a201c", wallTop: "#6a5444", wallFace: "#4e3d33",
      wallLine: "#3a2c24", core: "#16100e", water: "#1a2a36", accent: "#8a6a4a" },
    enemyPool: [{ id: "mine_goblin", w: 5 }, { id: "mine_slug", w: 3 }, { id: "mine_skel", w: 3 }, { id: "mine_mud", w: 2 }, { id: "mine_spark", w: 2 }],
    miniboss: "mb_hoa", boss: "boss_foreman",
    rooms: { start: ["any_start"], combat: ["mine_c1", "mine_c2", "mine_c3", "mine_c4"], chest: ["any_chest"],
      event: ["any_event"], miniboss: ["any_mb"], boss: ["mine_boss"] },
    layout: { mainRooms: 7, branches: [1, 2], waves: [2, 3] },
    loot: { weapons: { sword: "Kiếm Gỉ", heavy: "Cuốc Chim", spear: "Giáo Đường Ray", dagger: "Dao Đẽo", bow: "Cung Gỗ Thông", staff: "Gậy Đèn Mỏ", tome: "Sổ Ghi Ca" },
      material: "Thợ Mỏ", spells: ["fireball", "whirlwind", "dashslash", "stoneshield"] },
  },
};

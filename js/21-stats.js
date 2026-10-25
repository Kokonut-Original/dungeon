/* 21-stats: công thức sức mạnh, cấp độ, chỉ số người chơi từ điểm + trang bị (GDD 4) */
const G = L => Math.pow(CONFIG.G_BASE, L - 1);
const xpNeed = L => Math.round(CONFIG.XP_A * Math.pow(L, CONFIG.XP_P));

/** cộng dồn mọi dòng của đồ đang mặc thành bảng {key: tổng} (+ armorHp, weapon) */
function gearTotals(save) {
  const g = { armorHp: 0 };
  if (!save) return g;
  for (const slot of EQUIP_SLOTS) {
    const it = equippedItem(save, slot); if (!it || it.slot === "spell") continue;
    const st = itemStats(it);
    for (const l of st.lines) {
      if (l.key === "dmg") { g.weapon = { wtype: it.wtype, dmg: l.v, item: it }; continue; }
      if (l.key === "hp") { g.armorHp += l.v; continue; }
      g[l.key] = (g[l.key] || 0) + l.v;
    }
  }
  return g;
}

/**
 * Chỉ số người chơi (GDD 4.4). hero: {level, points}; save: để đọc đồ đang mặc (có thể null ở phòng thử)
 * Trả {maxHp, physMult, spellMult, critChance, critMult, atkSpeed, moveSpeed, cdr, dmgTaken, lifesteal, ...gear}
 */
function computePlayerStats(hero, save = null) {
  const pts = hero.points || { str: 0, int: 0, vit: 0 }, P = CONFIG.STAT_PCT, g = gearTotals(save);
  const sum = k => g[k] || 0;
  return {
    maxHp: Math.round((CONFIG.BASE_HP * G(hero.level) + g.armorHp) * (1 + P * pts.vit + sum("hpPct"))),
    physMult: (1 + P * pts.str) * (1 + sum("physPct")),
    spellMult: (1 + P * pts.int) * (1 + sum("spellPct")),
    critChance: Math.min(0.75, CONFIG.BASE_CRIT + sum("critC")),
    critMult: CONFIG.BASE_CRIT_MULT + sum("critD"),
    atkSpeed: 1 + sum("atkSpd"),
    moveSpeed: CONFIG.MOVE_SPEED * Math.min(1.6, 1 + sum("move")),
    cdr: Math.min(0.5, sum("cdr")),
    dmgTaken: Math.max(0.6, 1 - sum("dr")),
    lifesteal: sum("life"), bossDmg: sum("boss"), eliteDmg: sum("elite"), regen: sum("regen"),
    dodgeCd: CONFIG.DODGE_CD * (1 - Math.min(0.5, sum("dodgeCd"))), goldFind: sum("gold"), find: sum("find"),
    thorns: sum("thorns"), potionEff: sum("potion"), burnC: sum("burnC"), skillDmg: sum("skillDmg"), lowHpDmg: sum("lowHpDmg"),
    weapon: g.weapon || null,
  };
}

/** Lực Chiến (GDD 4.5) */
function playerPower(save) { let s = 3 * save.hero.level; for (const slot of EQUIP_SLOTS) s += itemScore(equippedItem(save, slot)); return s; }
const recPower = L => Math.round(7 * 10 * G(L) * 1.15) + 3 * Math.round(L);

/** chỉ số quái theo cấp & độ khó (GDD 7.1) */
function enemyStats(def, level, diff, elite) {
  return {
    hp: Math.round(def.hpK * CONFIG.ENEMY_HP_BASE * G(level) * diff.hp * (elite ? CONFIG.ELITE_HP : 1)),
    dmg: def.dmgK * CONFIG.ENEMY_DMG_BASE * G(level) * diff.dmg * (elite ? CONFIG.ELITE_DMG : 1),
  };
}
const DIFF_NORMAL = { key: "normal", name: "Thường", offset: 3, hp: 1, dmg: 1, loot: 1, xp: 1, elite: 0.03 };

/** cộng XP cho hero; trả số cấp vừa lên */
function addXpTo(hero, n) {
  let ups = 0; hero.xp = (hero.xp || 0) + n;
  while (hero.level < CONFIG.LEVEL_CAP && hero.xp >= xpNeed(hero.level)) { hero.xp -= xpNeed(hero.level); hero.level++; hero.unspent = (hero.unspent || 0) + CONFIG.POINTS_PER_LEVEL; ups++; }
  if (hero.level >= CONFIG.LEVEL_CAP) hero.xp = 0;
  return ups;
}

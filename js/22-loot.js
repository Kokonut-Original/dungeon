/* 22-loot: độ hiếm, sinh đồ, chỉ số đồ, nâng cấp, rèn lại, giải phóng, bán (GDD 6).
   Lưu ý: món đồ chỉ lưu giá trị GỐC; số thực luôn tính lại bằng itemStats() để đổi cân bằng không làm hỏng save. */
const RAR = {
  common:    { name: "Thường",      mult: 1.00, affixes: 0, slots: 2, affMult: 1.00, shards: 1,  reroll: 0,  color: "#C8C8C8" },
  rare:      { name: "Hiếm",        mult: 1.15, affixes: 1, slots: 3, affMult: 1.25, shards: 3,  reroll: 2,  color: "#4DA6FF" },
  epic:      { name: "Sử Thi",      mult: 1.35, affixes: 2, slots: 4, affMult: 1.50, shards: 8,  reroll: 5,  color: "#B26BFF" },
  legendary: { name: "Huyền Thoại", mult: 1.60, affixes: 3, slots: 5, affMult: 1.75, shards: 20, reroll: 12, color: "#FFB13B" },
  mythic:    { name: "Thần Thoại",  mult: 1.90, affixes: 3, slots: 6, affMult: 2.00, shards: 50, reroll: 30, color: "#FF4D6D" },
};
const RAR_ORDER = ["common", "rare", "epic", "legendary", "mythic"];
const SLOT_WEIGHTS = [{ slot: "weapon", w: 30 }, { slot: "spell", w: 20 }, { slot: "helm", w: 13 }, { slot: "chest", w: 13 }, { slot: "boots", w: 12 }, { slot: "relic", w: 12 }];
const SLOT_NAMES = { weapon: "Vũ khí", spell: "Phép", helm: "Mũ", chest: "Giáp", boots: "Giày", relic: "Di vật" };
const ARMOR_NAMES = {
  helm:  { warrior: "Mũ Sắt", mage: "Mũ Chóp", guardian: "Mũ Giáp" },
  chest: { warrior: "Giáp Xích", mage: "Áo Choàng", guardian: "Giáp Tấm" },
  boots: { warrior: "Ủng Da", mage: "Giày Vải", guardian: "Ủng Sắt" },
};
const ARMOR_BASE = { helm: 25, chest: 45, boots: 20 };
const ITEM_ICON = { helm: "icon_helm", chest: "icon_chest", boots: "icon_boots", relic: "icon_ring", spell: "icon_scroll" };

/** chọn độ hiếm theo bảng của độ khó; bonusTier = dùng bảng cao hơn n bậc; minRar = sàn; find = tăng đồ hiếm */
function rollRarity(diffKey, opts = {}) {
  const i = Math.min(DIFF_ORDER.length - 1, DIFF_ORDER.indexOf(diffKey) + (opts.bonusTier || 0));
  const table = DIFFICULTIES[DIFF_ORDER[i]].rarity, find = opts.find || 0;
  let list = RAR_ORDER.map((k, j) => ({ k, w: table[j] * (j > 0 ? 1 + find : 1) }));
  if (!["insane", "nightmare"].includes(diffKey)) { list[3].w += list[4].w; list[4].w = 0; }   // Thần Thoại chỉ ở Điên/Ác Mộng (Vực: M7)
  if (opts.minRar) { const m = RAR_ORDER.indexOf(opts.minRar); list = list.filter((_, j) => j >= m); if (!list.some(o => o.w > 0)) list[0].w = 1; }
  return weighted(list.filter(o => o.w > 0)).k;
}

/** random một dòng phụ hợp ô, không trùng các khoá trong `exclude` */
function rollAffix(slot, rar, exclude = []) {
  const pool = Object.keys(AFFIXES).filter(k => AFFIXES[k].slots.includes(slot) && !exclude.includes(k));
  if (!pool.length) return null;
  const k = pick(pool), a = AFFIXES[k];
  return { k, v: +(rand(a.min, a.max) * RAR[rar].affMult).toFixed(4) };
}

/** sinh một món đồ (GDD 14.2) */
function genItem(o) {
  const dg = DUNGEONS[o.dungeonId], rar = o.rarity || rollRarity(o.diff || "normal", o);
  // đồ độc nhất: Thần Thoại luôn có tên; Huyền Thoại 40% lấy món có tên của hầm (GDD 6.6)
  let tpl = null, uniqueKey = o.unique || null;
  if (!uniqueKey && !o.slot && rar === "mythic") uniqueKey = pick(Object.keys(MYTHICS));
  if (!uniqueKey && !o.slot && rar === "legendary") {
    const pool = Object.keys(UNIQUES).filter(k => UNIQUES[k].dungeon === o.dungeonId);
    if (pool.length && Math.random() < 0.4) uniqueKey = pick(pool);
  }
  if (uniqueKey) { tpl = UNIQUES[uniqueKey] || MYTHICS[uniqueKey]; o = Object.assign({}, o, { slot: tpl.slot, wtype: tpl.wtype, base: tpl.base, armorClass: tpl.armorClass }); }
  const slot = o.slot || weighted(SLOT_WEIGHTS).slot;
  const it = { uid: uid("it_") + Date.now().toString(36).slice(-4), slot, rar, ilvl: clamp(Math.round(o.ilvl), 1, 60),
    wtype: null, armorClass: null, skill: null, base: null, name: "", main: null, aff: [], upg: [], unique: null, owner: null,
    locked: false, isNew: true, source: { mode: o.mode || "farm", dungeon: o.dungeonId, diff: o.diff } };
  if (slot === "weapon") {
    it.wtype = o.wtype || pick(Object.keys(WEAPON_TYPES)); it.name = dg.loot.weapons[it.wtype]; it.base = dg.id + "_" + it.wtype;
    it.main = { key: "dmg", base: WEAPON_TYPES[it.wtype].base };
  } else if (slot === "spell") {
    it.skill = o.skill || pick(o.spellPool || dg.loot.spells); it.name = SKILLS[it.skill].name; it.main = { key: "skill", base: 1 };
  } else if (slot === "relic") {
    it.base = o.base || pick(Object.keys(RELICS)); it.name = RELICS[it.base].name; it.main = { key: RELICS[it.base].key, base: RELICS[it.base].v };
  } else {
    it.armorClass = o.armorClass || pick(Object.keys(ARMOR_CLASS)); it.name = ARMOR_NAMES[slot][it.armorClass] + " " + dg.loot.material;
    it.main = { key: "hp", base: ARMOR_BASE[slot] };
  }
  for (let i = 0; i < RAR[rar].affixes; i++) { const a = rollAffix(slot, rar, it.aff.map(x => x.k)); if (a) it.aff.push(a); }
  if (tpl) { it.unique = uniqueKey; it.name = tpl.name; it.owner = tpl.owner || null; }
  else if (rar === "legendary" || rar === "mythic") it.unique = pick(Object.keys(LEGEND_EFFECTS));
  return it;
}

/**
 * Chỉ số thực của món đồ: {main:{key,v}, lines:[{key,v,src}]} — src: "main"|"class"|"aff"|"inherent"
 * dòng chính: gốc × G(ilvl) × RAR.mult (riêng di vật: gốc × RAR.mult) × (1 + 10% mỗi lần nâng cấp dòng chính)
 * dòng phụ: giá trị đã random × (1 + 25% mỗi lần nâng cấp dòng đó)
 */
function itemStats(it) {
  const R0 = RAR[it.rar], nUp = k => it.upg.filter(u => u === k).length;
  const scaleLvl = it.slot === "relic" ? 1 : G(it.ilvl);
  const main = { key: it.main.key, v: it.main.base * scaleLvl * R0.mult * (1 + CONFIG.UPGRADE_MAIN * nUp("main")) };
  const lines = [Object.assign({ src: "main" }, main)];
  if (it.armorClass) { const c = ARMOR_CLASS[it.armorClass]; lines.push({ key: c.key, v: c.pct[it.slot] * R0.mult, src: "class" }); }
  if (it.slot === "boots") lines.push({ key: "move", v: 0.05, src: "inherent" });
  it.aff.forEach((a, i) => lines.push({ key: a.k, v: a.v * (1 + CONFIG.UPGRADE_AFF * nUp("a" + i)), src: "aff", idx: i }));
  return { main, lines };
}

/** điểm của món (dùng cho Lực Chiến, GDD 4.5) */
const itemScore = it => it ? Math.round(10 * G(it.ilvl) * RAR[it.rar].mult * (1 + 0.08 * it.upg.length)) : 0;
const itemFullName = it => it.name + (it.upg.length ? ` +${it.upg.length}` : "");

/* ── Lò Rèn & Chợ (GDD 6.9–6.11) ── */
const upgradeCost = it => Math.round(CONFIG.UPGRADE_BASE * G(it.ilvl) * RAR[it.rar].mult * Math.pow(it.upg.length + 1, CONFIG.UPGRADE_EXP));
const canUpgrade = it => it.upg.length < RAR[it.rar].slots;
/** lineKey: "main" hoặc "a0","a1".. (dòng phụ thứ i) */
function applyUpgrade(save, it, lineKey) {
  const cost = upgradeCost(it);
  if (!canUpgrade(it) || save.gold < cost) return false;
  save.gold -= cost; it.upg.push(lineKey); return true;
}
const rerollCost = it => ({ shards: RAR[it.rar].reroll, gold: Math.round(20 * G(it.ilvl)) });
function rerollAffix(save, it, idx) {
  const c = rerollCost(it); if (!c.shards || save.shards < c.shards || save.gold < c.gold) return false;
  save.shards -= c.shards; save.gold -= c.gold;
  const others = it.aff.filter((_, i) => i !== idx).map(a => a.k);
  it.aff[idx] = rollAffix(it.slot, it.rar, others) || it.aff[idx];
  it.upg = it.upg.filter(u => u !== "a" + idx);                 // nâng cấp dồn vào dòng cũ bị mất
  return true;
}
const sellPrice = it => Math.round(CONFIG.SELL_BASE * G(it.ilvl) * Math.pow(RAR[it.rar].mult, 2) * (1 + 0.1 * it.upg.length));

/** thả đồ ra sàn: rơi văng nhẹ, nhặt bằng phím F */
function dropItem(world, it, x, y) {
  const p = createPickup({ kind: "item", x, y, vx: rand(-50, 50), vy: rand(-50, 50) }); p.item = it;
  world.pickups.push(p);
  const ri = RAR_ORDER.indexOf(it.rar);
  if (ri >= 2) FX.flashLight(x, y, 60 + ri * 20, 1.2, RAR[it.rar].color);
  if (ri >= 3) { Audio.sfx("rarity_legendary"); FX.shake(0.3); }
  return p;
}

/** vàng rơi (GDD 6.8); gold = % vàng nhặt thêm từ đồ */
function goldDrop(level, diff, mult = 1, goldBonus = 0) { return Math.max(1, Math.round(CONFIG.GOLD_BASE * G(level) * rand(0.8, 1.2) * diff.loot * mult * (1 + goldBonus))); }

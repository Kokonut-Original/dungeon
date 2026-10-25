/* 20-save: lưu game vào localStorage (GDD 14.1). Có phiên bản + nâng cấp save cũ + xuất/nhập chuỗi.
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const SAVE_KEY = "mds_save_v1", SAVE_VERSION = 1;
const EQUIP_SLOTS = ["weapon", "spell1", "spell2", "helm", "chest", "boots", "relic"];
const STARTER = {   // vũ khí + phép khởi đầu theo dáng (GDD 4.7)
  knight: { wtype: "sword", skill: "dashslash" }, mage: { wtype: "staff", skill: "fireball" },
  hunter: { wtype: "bow", skill: "whirlwind" }, lizard: { wtype: "dagger", skill: "dashslash" },
};

const Save = {
  /** tạo save mới cho nhân vật */
  fresh(name, look) {
    const st = STARTER[look] || STARTER.knight;
    const w = genItem({ dungeonId: "mine", slot: "weapon", wtype: st.wtype, rarity: "common", ilvl: 1 });
    const s = genItem({ dungeonId: "mine", slot: "spell", skill: st.skill, rarity: "common", ilvl: 1 });
    w.isNew = s.isNew = false; w.source = s.source = { mode: "starter" };
    return {
      v: SAVE_VERSION, created: Date.now(), playTime: 0,
      hero: { name: name || "Mini", look: look || "knight", level: 1, xp: 0, points: { str: 0, int: 0, vit: 0 }, unspent: CONFIG.POINTS_PER_LEVEL },
      gold: 50, shards: 0, invCap: 40, potionMax: CONFIG.POTIONS, invExpands: 0,
      inventory: [w, s], equip: { weapon: w.uid, spell1: s.uid, spell2: null, helm: null, chest: null, boots: null, relic: null },
      unlocks: { dungeons: { mine: { story: true, maxDiff: null } } },
      stats: { kills: 0, deaths: 0, runs: 0, wins: 0, itemsFound: 0 },
      daily: { date: "", shop: [] },
      settings: { music: 0.6, sfx: 0.8, shakeAmp: 3, numbers: true, autoAim: false, fxQuality: "high" },
    };
  },
  load() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; return this.migrate(JSON.parse(raw)); }
    catch (e) { console.warn("Save hỏng, bỏ qua:", e); return null; }
  },
  write() {
    if (!GAME.save) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(GAME.save)); } catch (e) { console.warn("Không ghi được save:", e); }
  },
  /** nâng save cũ lên phiên bản hiện tại; thêm trường thiếu bằng giá trị mặc định */
  migrate(s) {
    const d = this.fresh(s.hero && s.hero.name, s.hero && s.hero.look);
    for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
    s.settings = Object.assign({}, d.settings, s.settings);
    s.v = SAVE_VERSION;
    return s;
  },
  exportStr() { return btoa(unescape(encodeURIComponent(JSON.stringify(GAME.save)))); },
  importStr(str) {
    const s = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!s.hero || !s.inventory) throw new Error("Chuỗi không phải save của Mini Dungeon Slayer");
    GAME.save = this.migrate(s); this.write();
  },
  wipe() { localStorage.removeItem(SAVE_KEY); GAME.save = null; },
};

/* ── tiện ích túi đồ ── */
const itemByUid = (save, uid) => save.inventory.find(i => i.uid === uid) || null;
const equippedItem = (save, slot) => save.equip[slot] ? itemByUid(save, save.equip[slot]) : null;
const isEquipped = (save, it) => EQUIP_SLOTS.some(s => save.equip[s] === it.uid);
const bagItems = save => save.inventory.filter(it => !isEquipped(save, it));
const bagFull = save => bagItems(save).length >= save.invCap;

/** ô trang bị phù hợp với món đồ; phép: ô trống trước, không thì spell1 */
function slotFor(save, it) {
  if (it.slot !== "spell") return it.slot;
  if (!save.equip.spell1) return "spell1";
  if (!save.equip.spell2) return "spell2";
  return "spell1";
}
function equipItem(save, it, slot = slotFor(save, it)) {
  if (it.slot === "spell" && slot !== "spell1" && slot !== "spell2") return false;
  if (it.slot !== "spell" && slot !== it.slot) return false;
  for (const s of EQUIP_SLOTS) if (save.equip[s] === it.uid) save.equip[s] = null;  // đổi ô phép
  save.equip[slot] = it.uid; it.isNew = false; return true;
}
function unequip(save, slot) { if (bagFull(save)) return false; save.equip[slot] = null; return true; }
function removeItem(save, it) {
  for (const s of EQUIP_SLOTS) if (save.equip[s] === it.uid) save.equip[s] = null;
  save.inventory = save.inventory.filter(i => i !== it);
}

/** đưa đồ của lượt chơi vào túi; túi đầy thì tự bán phần dư. Trả {added, sold, goldFromSold} */
function addLoot(save, items) {
  let added = 0, sold = 0, goldFromSold = 0;
  for (const it of items) {
    if (bagFull(save)) { sold++; goldFromSold += sellPrice(it); continue; }
    save.inventory.push(it); added++;
  }
  save.gold += goldFromSold; save.stats.itemsFound += items.length;
  return { added, sold, goldFromSold };
}

/* 11-data-items: dòng phụ, di vật, hệ giáp (GDD 6.3, 6.4, 6.7). Giá trị % viết dạng thập phân (0.05 = 5%). */
const AFFIXES = {
  critC:    { name: "Tỉ lệ chí mạng",        min: 0.02,  max: 0.05,  slots: ["weapon", "spell", "helm", "chest", "boots", "relic"] },
  critD:    { name: "Sát thương chí mạng",   min: 0.10,  max: 0.25,  slots: ["weapon", "relic", "helm"] },
  atkSpd:   { name: "Tốc đánh",              min: 0.04,  max: 0.10,  slots: ["weapon", "relic", "helm"] },
  move:     { name: "Tốc chạy",              min: 0.03,  max: 0.08,  slots: ["boots", "relic"] },
  life:     { name: "Hút máu",               min: 0.01,  max: 0.03,  slots: ["weapon", "relic"] },
  cdr:      { name: "Giảm hồi chiêu",        min: 0.04,  max: 0.10,  slots: ["helm", "spell", "relic"] },
  boss:     { name: "Sát thương lên boss",   min: 0.06,  max: 0.15,  slots: ["weapon", "spell", "relic"] },
  elite:    { name: "Sát thương lên tinh anh", min: 0.08, max: 0.18, slots: ["weapon", "spell", "relic"] },
  regen:    { name: "Hồi máu mỗi giây",      min: 0.003, max: 0.008, slots: ["chest"], suffix: " máu tối đa" },
  dodgeCd:  { name: "Giảm hồi lăn",          min: 0.08,  max: 0.20,  slots: ["boots"] },
  gold:     { name: "Vàng nhặt được",        min: 0.08,  max: 0.20,  slots: ["helm", "boots", "relic"] },
  find:     { name: "Tìm đồ hiếm",           min: 0.05,  max: 0.12,  slots: ["helm", "relic"] },
  thorns:   { name: "Phản đòn",              min: 0.10,  max: 0.30,  slots: ["chest"] },
  potion:   { name: "Hiệu quả bình máu",     min: 0.10,  max: 0.25,  slots: ["chest", "relic"] },
  burnC:    { name: "Tỉ lệ gây Bỏng",        min: 0.05,  max: 0.12,  slots: ["weapon"] },
  skillDmg: { name: "Sát thương kỹ năng",    min: 0.06,  max: 0.15,  slots: ["spell", "helm"] },
  hpPct:    { name: "Máu tối đa",            min: 0.04,  max: 0.10,  slots: ["helm", "chest", "boots"] },
  dr:       { name: "Giảm sát thương nhận",  min: 0.02,  max: 0.06,  slots: ["helm", "chest"] },
};
/** tên hiển thị của mọi khoá chỉ số (dùng trong chú thích, bảng chỉ số) */
const STAT_NAMES = Object.assign({
  dmg: "Sát thương", hp: "Máu", physPct: "Sát thương vật lý", spellPct: "Sát thương phép", lowHpDmg: "Sát thương khi dưới 30% máu",
  skill: "Sức mạnh phép",
}, Object.fromEntries(Object.entries(AFFIXES).map(([k, a]) => [k, a.name])));

/** hệ giáp: dòng thêm theo ô (cấp Thường), nhân RAR.mult */
const ARMOR_CLASS = {
  warrior:  { name: "Chiến Binh", key: "physPct",  pct: { helm: 0.04, chest: 0.06, boots: 0.03 } },
  mage:     { name: "Pháp Sư",    key: "spellPct", pct: { helm: 0.04, chest: 0.06, boots: 0.03 } },
  guardian: { name: "Hộ Vệ",      key: "hpPct",    pct: { helm: 0.04, chest: 0.06, boots: 0.03 } },
};

/** di vật thường: dòng chính cố định (cấp Thường), nhân RAR.mult */
const RELICS = {
  r_copperRing:  { name: "Nhẫn Đồng",    key: "critC",    v: 0.04 },
  r_windCharm:   { name: "Bùa Gió",      key: "move",     v: 0.06 },
  r_wolfFang:    { name: "Răng Sói",     key: "life",     v: 0.02 },
  r_hourglass:   { name: "Đồng Hồ Cát",  key: "cdr",      v: 0.08 },
  r_goldPouch:   { name: "Túi Vàng",     key: "gold",     v: 0.15 },
  r_catEye:      { name: "Mắt Mèo",      key: "find",     v: 0.08 },
  r_phoenixDown: { name: "Lông Phượng",  key: "potion",   v: 0.20 },
  r_angerStone:  { name: "Đá Giận",      key: "lowHpDmg", v: 0.20 },
};

/** dòng nào hiển thị dạng % */
const isPctKey = k => !["dmg", "hp", "skill"].includes(k);
function fmtStat(k, v) {
  if (!isPctKey(k)) return Math.round(v).toLocaleString("vi-VN");
  const p = v * 100; return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : Math.round(p)) + "%" + (AFFIXES[k] && AFFIXES[k].suffix ? AFFIXES[k].suffix : "");
}

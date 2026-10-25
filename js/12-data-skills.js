/* 12-data-skills: 20 phép (GDD 5.2) + đồ độc nhất Huyền Thoại/Thần Thoại (GDD 6.6).
   Hành vi phép: 26-skills.js (SKILL_IMPL). Hiệu ứng đồ: 29-effects.js (EFFECT_IMPL). */
const SKILLS = {
  fireball:    { name: "Cầu Lửa",       scale: "spell", base: 28, cd: 4,  color: "#ff8a2a", glyph: "✹", desc: "Quả cầu lửa nổ khi chạm (bán kính 24), gây Bỏng." },
  whirlwind:   { name: "Lốc Xoáy",      scale: "phys",  base: 7,  cd: 7,  color: "#c9d2e6", glyph: "◎", desc: "Xoay 1.6 s, cứ 0.2 s chém quanh người. Vẫn chạy được (70% tốc độ)." },
  dashslash:   { name: "Lướt Chém",     scale: "phys",  base: 26, cd: 5,  color: "#fff2c8", glyph: "➤", desc: "Lướt 80px theo hướng ngắm, bất tử khi lướt, chém mọi quái trên đường." },
  icerain:     { name: "Mưa Băng",      scale: "spell", base: 9,  cd: 6,  color: "#9ad8ff", glyph: "❄", desc: "6 mảnh băng rơi quanh điểm ngắm, gây Chậm 40% trong 2 s." },
  chain:       { name: "Sét Xích",      scale: "spell", base: 20, cd: 5,  color: "#fff27a", glyph: "ϟ", desc: "Sét đánh quái gần điểm ngắm rồi nảy sang 4 con nữa (mỗi lần ×0.8)." },
  stoneshield: { name: "Khiên Đá",      scale: "none",  base: 0.20, cd: 12, color: "#b0a080", glyph: "◆", desc: "Khiên hấp thụ 20% máu tối đa trong 4 s." },
  spring:      { name: "Suối Hồi",      scale: "none",  base: 0.25, cd: 15, color: "#7affb0", glyph: "✚", desc: "Hồi 25% máu tối đa trong 3 s." },
  piercearrow: { name: "Mũi Tên Xuyên", scale: "phys",  base: 30, cd: 4,  color: "#ffe9a8", glyph: "→", desc: "Tia thẳng 200px xuyên mọi quái." },
  boomerang:   { name: "Rìu Bay",       scale: "phys",  base: 18, cd: 5,  color: "#c9d2e6", glyph: "↺", desc: "Rìu bay ra 120px rồi quay về, trúng mỗi quái 2 lần." },
  quake:       { name: "Địa Chấn",      scale: "phys",  base: 34, cd: 8,  color: "#d8b48a", glyph: "▼", desc: "Nện đất bán kính 44, Choáng 0.8 s." },
  wisps:       { name: "Đom Đóm",       scale: "spell", base: 6,  cd: 10, color: "#d6ff7a", glyph: "✧", desc: "Gọi 2 đom đóm bay quanh 8 s, mỗi con 0.5 s bắn một phát tự đuổi." },
  blackhole:   { name: "Lỗ Đen",        scale: "spell", base: 5,  cd: 10, color: "#9a6aff", glyph: "●", desc: "Hố đen ở điểm ngắm 2 s hút quái bán kính 60, cứ 0.25 s gây sát thương." },
  poisoncloud: { name: "Độc Vụ",        scale: "spell", base: 8,  cd: 8,  color: "#8aff6a", glyph: "☁", desc: "Mây độc bán kính 36 trong 4 s, gây sát thương mỗi giây và cộng dồn Độc." },
  bladestorm:  { name: "Bão Kiếm",      scale: "phys",  base: 10, cd: 10, color: "#e8eef8", glyph: "✦", desc: "6 thanh kiếm bay vòng quanh người 5 s." },
  meteor:      { name: "Thiên Thạch",   scale: "spell", base: 60, cd: 9,  color: "#ff5a2a", glyph: "☄", desc: "Báo 0.8 s rồi thiên thạch nổ bán kính 40 ở điểm ngắm." },
  shadowstep:  { name: "Bước Bóng",     scale: "none",  base: 0,  cd: 8,  color: "#8a7acc", glyph: "◐", desc: "Dịch chuyển 90px, tàng hình 1 s; đòn kế tiếp chí mạng ×2." },
  bloodpact:   { name: "Giao Kèo Máu",  scale: "none",  base: 0.6, cd: 10, color: "#ff3a5a", glyph: "♦", abyss: true, desc: "Mất 10% máu hiện tại, +60% mọi sát thương trong 3 s." },
  abysscall:   { name: "Tiếng Gọi Vực", scale: "spell", base: 40, cd: 12, color: "#b86cff", glyph: "◉", abyss: true, desc: "Kéo mọi quái bán kính 120 về phía bạn rồi nổ." },
  twinshade:   { name: "Bóng Đôi",      scale: "none",  base: 0.4, cd: 14, color: "#6a5aaa", glyph: "♊", abyss: true, desc: "Bản sao bóng tối đánh theo bạn 6 s (40% sát thương)." },
  corrode:     { name: "Ăn Mòn",        scale: "spell", base: 15, cd: 7,  color: "#7aff9a", glyph: "≋", abyss: true, desc: "Tia thẳng; quái trúng nhận thêm 25% sát thương trong 4 s." },
};
/** phép bán ở quầy hằng ngày / rơi ở hầm chưa có pool riêng */
const NORMAL_SPELLS = Object.keys(SKILLS).filter(k => !SKILLS[k].abyss);

/* đồ Huyền Thoại có tên (rơi 40% khi ra Huyền Thoại ở hầm tương ứng) */
const UNIQUES = {
  u_foremanPick:  { name: "Cuốc Của Quản Đốc", slot: "weapon", wtype: "heavy", dungeon: "mine", owner: "tuan", desc: "Cứ đòn thứ 3 liên tiếp trúng quái gây thêm địa chấn bán kính 30 (50% sát thương)." },
  u_hoaLantern:   { name: "Đèn Lồng Của Hòa",  slot: "relic", base: "r_phoenixDown", dungeon: "mine", owner: "hoa", desc: "Bán kính sáng +50%; quái đứng trong vùng sáng nhận thêm 10% sát thương." },
  u_vanBrush:     { name: "Bút Lông Của Vân",  slot: "weapon", wtype: "staff", dungeon: "library", owner: "van", desc: "Tia phép để lại vệt mực 1.5 s, quái đi qua bị Chậm 30%." },
  u_wetCloak:     { name: "Áo Choàng Ướt",     slot: "chest", armorClass: "mage", dungeon: "library", desc: "Lăn xong thì miễn sát thương từ đạn trong 1.5 s." },
  u_tiltedScale:  { name: "Cân Lệch",          slot: "relic", base: "r_goldPouch", dungeon: "market", desc: "Mỗi 100 vàng nhặt trong lượt: +1% sát thương (tối đa +25%)." },
  u_tailorShears: { name: "Kéo Thợ May",       slot: "weapon", wtype: "dagger", dungeon: "market", owner: "lua", desc: "Đòn chí mạng gây Chảy máu." },
  u_captainHelm:  { name: "Mũ Đội Trưởng",     slot: "helm", armorClass: "guardian", dungeon: "camp", owner: "minh", desc: "Đứng yên 1 s thì nhận khiên 10% máu tối đa (hồi lại sau 6 s)." },
  u_khaSword:     { name: "Kiếm Của Kha",      slot: "weapon", wtype: "sword", dungeon: "camp", owner: "kha", desc: "Đòn cuối của combo phóng sóng kiếm băng bay 100px, gây Chậm." },
  u_goldCrown:    { name: "Vương Miện Vàng",   slot: "helm", armorClass: "warrior", dungeon: "well", desc: "+1% sát thương cho mỗi 10 Ám." },
  u_hungryBoots:  { name: "Giày Kẻ Đói",       slot: "boots", armorClass: "guardian", dungeon: "well", owner: "a_quan", desc: "Nhặt xu hồi 0.5% máu tối đa." },
  u_bookOfNames:  { name: "Sổ Tên",            slot: "weapon", wtype: "tome", dungeon: "library", desc: "+3% sát thương cho mỗi Kẻ Ở Lại đã tha." },
};
/* hiệu ứng Huyền Thoại ngẫu nhiên (cho 60% đồ Huyền Thoại không có tên) */
const LEGEND_EFFECTS = {
  g_killBoom:   { desc: "Giết quái: 10% tỉ lệ nổ bán kính 20, gây 40% sát thương." },
  g_dodgeHit:   { desc: "Lăn xong thì đòn kế tiếp +50% sát thương." },
  g_rage:       { desc: "Dưới 30% máu thì +20% tốc đánh." },
  g_roomShield: { desc: "Khi vào phòng chiến đấu nhận khiên 8% máu tối đa." },
  g_spellFlow:  { desc: "Phép trúng quái thì giảm 0.5 s hồi chiêu của phép còn lại." },
  g_tenKills:   { desc: "Cứ 10 quái bị giết thì hồi 5% máu." },
};
/* đồ Thần Thoại (chỉ ở Điên, Ác Mộng hoặc Vực từ tầng 20) */
const MYTHICS = {
  m_farmThrone:     { name: "Ngai Vua Farm",        slot: "relic", base: "r_angerStone", desc: "+40% mọi sát thương; mỗi phòng dọn xong +1 Ám." },
  m_abyssHeart:     { name: "Trái Tim Vực",         slot: "chest", armorClass: "guardian", desc: "Hồi sinh 1 lần mỗi lượt với 50% máu; sau đó máu tối đa −20% tới hết lượt." },
  m_namelessBlade:  { name: "Thanh Kiếm Không Tên", slot: "weapon", wtype: "sword", desc: "+2% sát thương cho mỗi Chủ Cũ đã mở đủ 5 mảnh ký ức." },
  m_echoStaff:      { name: "Gậy Tiếng Vọng",       slot: "weapon", wtype: "staff", desc: "Cứ tia thứ 5 tách thành 5 tia tỏa quạt." },
  m_fallingStarBow: { name: "Cung Sao Rơi",         slot: "weapon", wtype: "bow", desc: "Mũi tên chí mạng gọi thiên thạch nhỏ (bán kính 20, 60% sát thương)." },
  m_graveBoots:     { name: "Giày Mộ",              slot: "boots", armorClass: "guardian", desc: "Lăn để lại vùng độc bán kính 16 trong 2 s." },
};
const uniqueDesc = key => (UNIQUES[key] || MYTHICS[key] || LEGEND_EFFECTS[key] || {}).desc || "";

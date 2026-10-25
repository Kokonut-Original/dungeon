/* 02c-pixel-sprites: sprite pixel art vẽ bằng mảng ký tự (dùng khi chưa có gói 0x72).
   Mỗi sprite: pal (bảng màu), body (các hàng), legs (biến thể chân khi đứng/bước) hoặc kiểu "bounce".
   Viền đen 1px được sinh tự động quanh mọi điểm ảnh.
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const OUTLINE = "#160e22";

const PIXEL_SPRITES = {
  // nhân vật chính: chibi tóc cam, râu, giáp xanh thép
  knight_m: { anim: "walk",
    pal: { y: "#ffb35c", h: "#e0662a", H: "#a83c1c", S: "#f6c69c", s: "#d9946c", E: "#24182e", W: "#ffffff",
      L: "#d7e2f5", a: "#6c7fb4", A: "#3c4672", G: "#f2b234", B: "#2a2e48", b: "#4a5078" },
    body: [
      "....hyyh.yh...",
      "..hhhyhhhhhh..",
      ".hhhhhhhhhhhh.",
      "hhHhhhhhhhhHhh",
      "hHhSSSSSSSShHh",
      ".HSSSSSSSSSSH.",
      ".HSWESSSSWESH.",
      ".HSEESSSSEESH.",
      ".HsSSSssSSSsH.",
      ".HhhhSSSShhhH.",
      "..HhhhhhhhhH..",
      "...HhhhhhhH...",
      "..AaHHhhHHaA..",
      ".SAaLLLLLLaAS.",
      ".SAaLLaaLLaAS.",
      "..AGGGGGGGGA..",
      "..AaaaAAaaaA..",
    ],
    legs: {
      stand: ["...AAa..aAA...", "..BBBb..bBBB.."],
      a:     ["..AAa...aAA...", ".BBBb.....BBB."],
      b:     ["...AAa...aAA..", ".BBB.....bBBB."],
    } },

  // Yêu Tinh Đào Mỏ: da xanh, tai nhọn, mắt đỏ, khố da
  goblin: { anim: "walk",
    pal: { l: "#a8e070", g: "#6fbf4a", G: "#3f8a34", d: "#2a5e28", R: "#ff3a3a", E: "#1a1020", T: "#f4f0d0",
      c: "#8a5a32", C: "#5e3a1e", k: "#d8a04a" },
    body: [
      "....GggG....",
      "...GgllgG...",
      "GG.GggggG.GG",
      "dGGgggggggGd",
      ".dGgREgREgG.",
      "..GggggggG..",
      "..GgTddTgG..",
      "...GGggGG...",
      "..gcCccCcg..",
      ".g.ckkkkc.g.",
      "...cCccCc...",
    ],
    legs: {
      stand: ["...GG..GG...", "...dd..dd..."],
      a:     ["..GG....GG..", "..dd.....dd."],
      b:     ["...GG..GG...", ".dd.....dd.."],
    } },

  // Xương Thợ Mỏ: xương trắng, hốc mắt đen, đồng tử đỏ
  skelet: { anim: "walk",
    pal: { W: "#f2f0e6", w: "#c9c4b4", K: "#8a8478", E: "#1a1020", R: "#ff4a4a", h: "#b07a3a", H: "#6a4520" },
    body: [
      "...hhhhhh...",
      "..hHHHHHHh..",
      "..wWWWWWWw..",
      "..WEEWWEEW..",
      "..WERWWREW..",
      "..wWWKKWWw..",
      "...wEWEWw...",
      "....wwww....",
      "..W.WKKW.W..",
      ".W..WEEW..W.",
      "....WKKW....",
      "....wWWw....",
    ],
    legs: {
      stand: ["....W..W....", "...wW..Ww..."],
      a:     ["...W....W...", "..wW....Ww.."],
      b:     ["....W...W...", "...Ww..wW..."],
    } },

  // Đốm Lửa Mỏ: ngọn lửa có mắt, nảy tưng tưng
  imp: { anim: "bounce",
    pal: { Y: "#fff2a0", y: "#ffd23d", o: "#ff8a2a", r: "#e0401a", R: "#9a2010", E: "#1a1020", W: "#ffffff" },
    body: [
      ".....y......",
      "....yo...y..",
      "...yoo..yo..",
      "..yooo.yoo..",
      "..oooooooo..",
      ".ooYYYYYYoo.",
      ".oYYYYYYYYo.",
      "royWEyyWEyor",
      "royEEyyEEyor",
      "rooyyYYyyoor",
      ".rooyyyyoor.",
      "..rroooorr..",
      "...RrrrrR...",
    ] },

  // Yêu Mực: mực tím, hai mắt to, xúc tu
  wogol: { anim: "walk",
    pal: { p: "#9a8cf0", P: "#6a5acd", D: "#3a2c7a", W: "#ffffff", E: "#1a1020", I: "#20183a", k: "#ff7ac8" },
    body: [
      "....DPPD....",
      "...DPppPD...",
      "..DPppppPD..",
      ".DPppppppPD.",
      ".DPWEPPWEPD.",
      ".DPEEPPEEPD.",
      ".DPkPPPPkPD.",
      ".DPPPIIPPPD.",
      "..DPPPPPPD..",
    ],
    legs: {
      stand: ["..D.D..D.D..", ".D..D..D..D."],
      a:     [".D..D..D..D.", "..D.D..D.D.."],
      b:     ["..D..DD..D..", ".D.D....D.D."],
    } },

  /* ── vũ khí (dựng đứng, chuôi ở dưới) ── */
  weapon_rusty_sword: { anim: "static",
    pal: { M: "#eef3fb", m: "#9aa6c0", G: "#f2b234", g: "#a8761c", c: "#7a4a24" },
    body: ["..M..", ".MMm.", ".MMm.", ".MMm.", ".MMm.", ".MMm.", ".MMm.", ".MMm.", "GgGgG", "..c..", "..c..", ".GgG."] },
  weapon_hammer: { anim: "static",
    pal: { M: "#c9d2e6", m: "#7d879e", D: "#565f78", c: "#7a4a24", G: "#f2b234" },
    body: [".MMMMM.", "MMMMMMm", "MMMMMMm", "DmmmmmD", "...c...", "...c...", "...c...", "...c...", "...c...", "...G..."] },
  weapon_spear: { anim: "static",
    pal: { M: "#eef3fb", m: "#9aa6c0", G: "#f2b234", c: "#8a5a32", r: "#e0401a" },
    body: [".M.", "MMm", "MMm", ".m.", "rGr", ".c.", ".c.", ".c.", ".c.", ".c.", ".c.", ".c.", ".c."] },
  weapon_knife: { anim: "static",
    pal: { M: "#eef3fb", m: "#9aa6c0", G: "#f2b234", c: "#5e3a1e" },
    body: [".M.", "MMm", "MMm", "MMm", "GGG", ".c.", ".c."] },
  weapon_bow: { anim: "static",
    pal: { c: "#a8743c", C: "#6a4520", s: "#e8e8e8" },
    body: ["sC...", "s.c..", "s..c.", "s..c.", "s..c.", "s..c.", "s.c..", "sC..."] },
  weapon_red_magic_staff: { anim: "static",
    pal: { R: "#c84aff", r: "#7a2ad0", Y: "#ffe0ff", c: "#7a4a24", G: "#f2b234" },
    body: [".rRr.", "rRYRr", "rRRRr", ".rGr.", "..c..", "..c..", "..c..", "..c..", "..c..", "..c..", "..c.."] },
  weapon_green_magic_staff: { anim: "static",
    pal: { B: "#4a9aff", b: "#2a5ad0", Y: "#e0f4ff", P: "#f2e6c8", p: "#c8b48a", R: "#c83a3a" },
    body: ["bBBBBBb", "bPPPPPb", "bPpppPb", "bPPPPPb", "bPpppPb", "bPPPPPb", "bBBRBBb"] },
  weapon_big_hammer: { anim: "static",
    pal: { M: "#c9d2e6", m: "#7d879e", D: "#565f78", c: "#7a4a24", G: "#f2b234" },
    body: [".MMMMMMM.", "MMMMMMMMm", "MMMMMMMMm", "MMMMMMMMm", "DmmmmmmmD", "....c....", "....c....", "....c....", "....c....", "....c....", "....c....", "....G...."] },

  /* ── quái hầm Mỏ (M2) ── */
  // Sên Mỏ: vỏ vàng, thân xanh, mắt trên râu
  tiny_slug: { anim: "bounce",
    pal: { S: "#8a6a2a", s: "#c8b04a", k: "#e8d880", g: "#8acf6a", G: "#5a9a4a", E: "#1a1020" },
    body: [
      "...SSSS.....",
      "..SkkksS....",
      ".SksSSksS.E.",
      ".SsSkkSsS.gE",
      ".SSsssssS.g.",
      "gGGGGGGGGGg.",
      "ggggggggggg.",
    ] },
  // Bùn Ném Đá: khối bùn mắt vàng
  muddy: { anim: "bounce",
    pal: { m: "#8a6a4a", M: "#5e4630", d: "#3e2e20", l: "#b08a60", E: "#1a1020", Y: "#ffd23d" },
    body: [
      "....mmmm....",
      "..mmllllmm..",
      ".mmlmmmmlmm.",
      ".mmYEmmYEmm.",
      "mmmmmmmmmmmm",
      "mMmmdddmmmMm",
      "MMmmmmmmmmMM",
      ".MMmmmmmmMM.",
      "..dMMMMMMd..",
    ] },
  // Mini boss Hòa Đèn Lồng: thợ mỏ xám nhợt, mắt phát sáng, cầm đèn lồng
  hoa: { anim: "walk",
    pal: { h: "#7a8090", H: "#4a5060", y: "#c8d0e0", S: "#b8c0c8", s: "#8a92a0", E: "#1a1020", W: "#7af0ff",
      A: "#3a4050", a: "#5a6270", L: "#8a92a0", G: "#6a5a3a", B: "#2a2e38", b: "#4a5060", o: "#ff8a2a", O: "#ffd23d" },
    body: [
      "....hyyh......",
      "..hhhhhhhhhh..",
      ".hhhhhhhhhhhh.",
      "HHHHHHHHHHHHHH",
      ".HSSSSSSSSSSH.",
      ".HSWESSSSWESH.",
      ".HSEESSSSEESH.",
      ".HsSSSssSSSsH.",
      "..sSSSEESSSs..",
      "...ssSSSSss...",
      "..AaaaaaaaaA..",
      ".SAaLLLLLLaAoO",
      ".SAaLLaaLLaAOo",
      "..AGGGGGGGGA..",
      "..AaaaAAaaaA..",
    ],
    legs: {
      stand: ["...AAa..aAA...", "..BBBb..bBBB.."],
      a:     ["..AAa...aAA...", ".BBBb.....BBB."],
      b:     ["...AAa...aAA..", ".BBB.....bBBB."],
    } },
  // Boss Quản Đốc Cuốc: gã khổng lồ đội mũ thợ mỏ, râu mép, quần yếm
  ogre: { anim: "walk",
    pal: { Y: "#f2c230", y: "#c8961c", L: "#fff6c0", S: "#c9a07a", s: "#9a7458", E: "#1a1020", R: "#ff4a3a",
      M: "#4a3020", O: "#4a6a9a", o: "#2e4670", B: "#6a4520", G: "#d8b04a", b: "#3a2a20" },
    body: [
      "......yYYLLYYy......",
      ".....yYYYYYYYYy.....",
      "....yYYYYYYYYYYy....",
      "...yyyyyyyyyyyyyy...",
      "....SSSSSSSSSSSS....",
      "...SSERSSSSSSERSS...",
      "...SSEESSSSSSEESS...",
      "...sSSSSSssSSSSSs...",
      "...sSMMMMMMMMMMSs...",
      "....sMMSSSSSSMMs....",
      ".....sSSSSSSSSs.....",
      "..SSOOOOOOOOOOOOSS..",
      ".SSSOoOOOOOOOOoOSSS.",
      ".SSsOoOOOOOOOOoOsSS.",
      ".sS.OOOOOOOOOOOO.Ss.",
      "....BBBBBGGBBBBB....",
      "....OOOOOOOOOOOO....",
      "....oOOOOooOOOOo....",
    ],
    legs: {
      stand: ["....oOOOO..OOOOo....", "...bbbbbb..bbbbbb..."],
      a:     ["...oOOOO....OOOOo...", "..bbbbbb.....bbbbbb."],
      b:     [".....oOOOO.OOOOo....", "....bbbbbb.bbbbbb..."],
    } },

  /* ── vật thể ── */
  chest_closed: { anim: "static",
    pal: { W: "#a8743c", w: "#7a4a24", d: "#4e2e14", G: "#f2b234", g: "#a8761c", K: "#2a1a10" },
    body: ["..dddddddddd..", ".dWWWWWWWWWWd.", "dWWWWWWWWWWWWd", "dwwwwwwwwwwwwd", "dGGGGGgGGGGGGd",
      "dWWWWGKGWWWWWd", "dWWWWWgWWWWWWd", "dwwwwwwwwwwwwd", "dddddddddddddd"] },
  chest_open: { anim: "static",
    pal: { W: "#a8743c", w: "#7a4a24", d: "#4e2e14", G: "#f2b234", K: "#2a1a10", Y: "#fff2a0" },
    body: [".dWWWWWWWWWWd.", "dwwwwwwwwwwwwd", "dKYKYKKYKKYKKd", "dGGGGGGGGGGGGd", "dWWWWWWWWWWWWd",
      "dWWWWWWWWWWWWd", "dwwwwwwwwwwwwd", "dddddddddddddd"] },
  fountain: { anim: "static",
    pal: { S: "#8a8aa0", s: "#5a5a70", B: "#4ab0ff", b: "#2a70c0", W: "#d0f0ff", P: "#ff6a8a" },
    body: ["......WW......", ".....WBBW.....", "......BB......", "......ss......", "..ssssssssss..",
      ".sBBBBWBBBBBs.", ".sbBBPBBPBBbs.", ".sbBBBPPBBBbs.", "..sSSSSSSSSs..", "....ssssss....", "....SSSSSS....", "...ssssssss..."] },
  cart: { anim: "static",
    pal: { M: "#7a7f90", m: "#4a4f60", d: "#2a2e38", r: "#c84a2a", W: "#3a3a3a", w: "#8a8a8a", O: "#9a6a3a" },
    body: ["...OOrOOOO......", "..OOOOOrOOO.....", "mMMMMMMMMMMMMMMm", "mMmmmmmmmmmmmmMm", "mMMMMMMMMMMMMMMm",
      "dmmmmmmmmmmmmmmd", ".dWWd......dWWd.", "..ww........ww.."] },
  rock: { anim: "static", pal: { r: "#6a6a72", R: "#9a9aa8", W: "#c8c8d0" },
    body: ["..rr..", ".rWRr.", "rRRRRr", "rRRRRr", ".rRRr.", "..rr.."] },
  lantern: { anim: "static", pal: { c: "#5a5a5a", o: "#ff8a2a", O: "#ffd23d", Y: "#fff6c0" },
    body: ["..c..", ".oOo.", "oOYOo", "oOOOo", ".ooo."] },

  /* ── icon đồ ── */
  icon_helm: { anim: "static", pal: { M: "#c9d2e6", m: "#7d879e", d: "#4a5060", R: "#e0401a" },
    body: ["...RR....", "..MMMMm..", ".MMMMMMm.", ".MMMMMMm.", ".Md...dm.", ".M.....m."] },
  icon_chest: { anim: "static", pal: { M: "#c9d2e6", m: "#7d879e" },
    body: [".MM..MM.", "MMMMMMMm", "MMmMMmMm", ".MMMMMm.", ".MMMMMm.", ".mmmmmm."] },
  icon_boots: { anim: "static", pal: { M: "#a8743c", m: "#6a4520" },
    body: ["MM....", "MM....", "MM....", "MMMMm.", "MMMMMm", "mmmmmm"] },
  icon_ring: { anim: "static", pal: { G: "#f2b234", g: "#a8761c", B: "#4ab0ff" },
    body: ["..BB..", ".gBBg.", "G....G", "G....G", ".gGGg."] },
  icon_scroll: { anim: "static", pal: { P: "#f2e6c8", p: "#c8b48a", R: "#c83a3a" },
    body: ["pPPPPp", ".PRRP.", ".PPPP.", ".PRRP.", "pPPPPp"] },
};

/* ── dáng nhân vật & NPC tạo bằng cách đổi bảng màu của khuôn có sẵn ── */
function paletteVariant(baseKey, pal) { const b = PIXEL_SPRITES[baseKey]; return Object.assign({}, b, { pal: Object.assign({}, b.pal, pal) }); }
Object.assign(PIXEL_SPRITES, {
  // Pháp Sư: râu tóc bạc, áo tím
  wizzard_m: paletteVariant("knight_m", { y: "#ffffff", h: "#d8d8e8", H: "#9a9ab0", L: "#d8b8ff", a: "#7a4ac8", A: "#4a2a8a", G: "#ffd23d", B: "#2a1a4a", b: "#4a2a7a" }),
  // Thợ Săn: tóc vàng, áo xanh lá
  elf_m: paletteVariant("knight_m", { y: "#fff6b0", h: "#f2c84a", H: "#b0862a", L: "#c8f0b0", a: "#4a9a4a", A: "#2a5a2a", G: "#a8743c", B: "#3a2a1a", b: "#5e4630" }),
  // Thằn Lằn: da xanh, mào sẫm, áo da
  lizard_m: paletteVariant("knight_m", { S: "#8acf6a", s: "#5a9a4a", y: "#c8f08a", h: "#4a9a4a", H: "#2a5a2a", L: "#d8b48a", a: "#8a5a32", A: "#5e3a1e", G: "#f2b234" }),
  // Bác Đồng (thợ rèn): râu đen, tạp dề da
  npc_smith: paletteVariant("knight_m", { y: "#6a5a50", h: "#3a2e2a", H: "#1e1614", S: "#e8b088", s: "#c08860", L: "#a8743c", a: "#7a4a24", A: "#4e2e14", G: "#c8ccd6", B: "#2a2020", b: "#4a3a30" }),
});
// khuôn áo choàng dài cho NPC
const ROBE_BODY = [
  ".....hhhh.....",
  "....hhhhhh....",
  "...hhhhhhhh...",
  "..hhhSSSShhh..",
  "..hhSSSSSShh..",
  "..hSWESSWESh..",
  "..hSEESSEESh..",
  "..hsSSssSSsh..",
  "...hSSSSSSh...",
  "..RRrRRRRrRR..",
  ".SRRrRRRRrRRS.",
  ".SRRrRGGRrRRS.",
  "..RRrRRRRrRR..",
  "..RRrRRRRrRR..",
  ".RRRrRRRRrRRR.",
];
const ROBE_LEGS = { stand: [".rRRRRRRRRRRr.", "..BB......BB.."], a: [".rRRRRRRRRRRr.", ".BB.......BB.."], b: [".rRRRRRRRRRRr.", "..BB.......BB."] };
const robe = pal => ({ anim: "walk", body: ROBE_BODY, legs: ROBE_LEGS, pal: Object.assign({ E: "#1a1020", W: "#ffffff", S: "#f2c9a0", s: "#d0a07a", B: "#2a2030" }, pal) });
Object.assign(PIXEL_SPRITES, {
  npc_mo:   robe({ h: "#c8c8d0", R: "#8a2a3a", r: "#5a1a26", G: "#ffd23d" }),                  // Bà Mõ: tóc bạc, áo đỏ sẫm
  npc_nen:  robe({ h: "#f2c9a0", R: "#e08a2a", r: "#a85a1a", G: "#fff2a0" }),                  // Sư Nến: đầu trọc, áo cà sa
  npc_muc:  robe({ h: "#2a2438", R: "#2a4a8a", r: "#1a2e5a", G: "#c8d0e0", W: "#9ad0ff" }),    // Cô Mực: tóc đen, áo xanh, kính
  npc_lang: robe({ h: "#5a5a66", R: "#3a3a46", r: "#24242e", G: "#8a8a96", S: "#c8b8a8" }),    // Ông Lặng: mũ trùm xám
  // Xu Xu: mèo buôn mặc gi-lê, đeo xu vàng
  npc_cat: { anim: "walk",
    pal: { O: "#c8762a", o: "#f2a04a", W: "#ffffff", E: "#1a1020", k: "#ff7aa8", w: "#fff2e0", G: "#3a8a5a", g: "#2a5a3a", Y: "#ffd23d" },
    body: ["..O......O..", ".OoO....OoO.", ".OooOOOOooO.", ".OooooooooO.", ".OoWEooWEoO.", ".OoEEkkEEoO.", "..OoowwooO..", "...OOOOOO...",
      "..GgYYYYgG..", ".oGgGGGGgGo.", "..GgGGGGgG.."],
    legs: { stand: ["...oo..oo...", "...OO..OO..."], a: ["..oo....oo..", "..OO....OO.."], b: ["...oo..oo...", "..OO...OO..."] } },
});

/** ghép body + chân thành lưới màu (pure, dùng được cả trong Node để xuất ảnh xem trước).
    variant: "stand" | "a" | "b" | "squash"; trả {w, h, px: mảng hàng, mỗi ô là mã màu hoặc null} */
function pixelGrid(def, variant = "stand") {
  let rows = def.body.slice();
  if (def.legs) rows = rows.concat(def.legs[variant] || def.legs.stand);
  if (variant === "squash") rows = [rows[0].replace(/./g, ".")].concat(rows.slice(0, 1), rows.slice(2));   // bẹp 1 hàng
  const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2;
  const px = [];
  for (let y = 0; y < h; y++) { px.push([]); for (let x = 0; x < w; x++) { const ch = (rows[y - 1] || "")[x - 1]; px[y].push(ch && ch !== "." ? def.pal[ch] || "#ff00ff" : null); } }
  // viền: ô trống kề (4 hướng) một ô có màu thì tô màu viền
  const out = px.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[y][x]) continue;
    if ((px[y - 1] && px[y - 1][x]) || (px[y + 1] && px[y + 1][x]) || px[y][x - 1] || px[y][x + 1]) out[y][x] = OUTLINE;
  }
  return { w, h, px: out };
}

/** dựng canvas các khung cho mọi sprite: PixelArt.frames(key, anim) -> [canvas...] */
const PixelArt = {
  cache: {},
  canvasFrom(grid) {
    const c = document.createElement("canvas"); c.width = grid.w; c.height = grid.h;
    const g = c.getContext("2d");
    for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.px[y][x]) { g.fillStyle = grid.px[y][x]; g.fillRect(x, y, 1, 1); }
    return c;
  },
  /** anim: "idle" | "run" | "static" */
  frames(key, anim) {
    const def = PIXEL_SPRITES[key]; if (!def) return null;
    const ck = key + "|" + anim; if (this.cache[ck]) return this.cache[ck];
    let variants;
    if (def.anim === "static") variants = ["stand"];
    else if (def.anim === "bounce") variants = anim === "run" ? ["stand", "squash"] : ["stand", "stand", "squash", "stand"];
    else variants = anim === "run" ? ["a", "stand", "b", "stand"] : ["stand", "stand", "squash", "stand"];
    return (this.cache[ck] = variants.map(v => this.canvasFrom(pixelGrid(def, v))));
  },
  has(key) { return !!PIXEL_SPRITES[key]; },
};
if (typeof module !== "undefined") module.exports = { PIXEL_SPRITES, pixelGrid };

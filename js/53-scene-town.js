/* 53-scene-town: thị trấn Miệng Giếng — đi bộ, nói chuyện với NPC để mở Lò Rèn, Chợ, Giếng Thánh, Bảng Hầm... (GDD 10.1)
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const TOWN_THEME = { floor: ["#3a3a4a", "#3e3e50", "#363646"], floorLine: "#2a2a38", wallTop: "#8a6a5a", wallFace: "#6a4a3e",
  wallLine: "#4a3028", core: "#1a1622", water: "#1e3a5a", accent: "#ffd23d" };
const TOWN_W = 40, TOWN_H = 24;
/* toà nhà: x, y (ô), rộng 6 × cao 3; NPC đứng ngay dưới cửa */
const TOWN_PLACES = [
  { id: "smith",   x: 3,  y: 2,  name: "LÒ RÈN",      npc: "npc_smith", who: "Bác Đồng",  role: "Nâng cấp · Rèn lại đồ",       open: () => UI.openSmith() },
  { id: "board",   x: 17, y: 2,  name: "BẢNG VÀNG",   npc: "npc_mo",    who: "Bà Mõ",     role: "Chọn hầm · Độ khó",            open: () => UI.openBoard() },
  { id: "library", x: 31, y: 2,  name: "THƯ VIỆN",    npc: "npc_muc",   who: "Cô Mực",    role: "Sổ Ký Ức (sắp mở)",            open: () => UI.say("Cô Mực", "Thư viện đang sắp lại sách. Khi nào nhóc mang được nhiều đồ lên, chị sẽ kể cho nhóc nghe về chủ của chúng. (Mở ở bản cốt truyện M5)") },
  { id: "shop",    x: 3,  y: 10, name: "CHỢ XU XU",   npc: "npc_cat",   who: "Xu Xu",     role: "Mua bán · Bình máu · Mở túi",  open: () => UI.openShop() },
  { id: "gate",    x: 31, y: 10, name: "CỔNG VỰC",    npc: "npc_lang",  who: "Ông Lặng",  role: "Vực Không Đáy (sắp mở)",       open: () => UI.say("Ông Lặng", "...Chưa phải lúc. (Vực Không Đáy mở ở bản M7)") },
  { id: "home",    x: 3,  y: 17, name: "NHÀ",         npc: null,        who: null,        role: "Cộng điểm · Chỉ số",           open: () => UI.openStats() },
];

const TownScene = {
  world: null, ambient: 0.18, hint: "", hintT: 0, hudInfo: "", near: null,

  build() {
    const w = emptyWorld(TOWN_W, TOWN_H, ".");
    for (let x = 0; x < TOWN_W; x++) { w.tiles[0][x] = "#"; w.tiles[TOWN_H - 1][x] = "#"; }
    for (let y = 0; y < TOWN_H; y++) { w.tiles[y][0] = "#"; w.tiles[y][TOWN_W - 1] = "#"; }
    for (let x = 4; x < TOWN_W - 4; x += 6) w.tiles[0][x] = "T";                       // đuốc tường bắc
    w.npcs = []; w.labels = [];
    for (const pl of TOWN_PLACES) {
      for (let y = pl.y; y < pl.y + 3; y++) for (let x = pl.x; x < pl.x + 6; x++) w.tiles[y][x] = y < pl.y + 2 ? "H" : "#";
      w.tiles[pl.y + 2][pl.x + 1] = "T"; w.tiles[pl.y + 2][pl.x + 4] = "T";
      w.tiles[pl.y + 2][pl.x + 2] = "d"; w.tiles[pl.y + 2][pl.x + 3] = "d";      // cửa gỗ
      const nx = (pl.x + 3) * T, ny = (pl.y + 4) * T;
      if (pl.npc) { const n = baseEntity("npc", nx, ny, 6); Object.assign(n, { sprite: pl.npc, place: pl, animT: Math.random() * 3 }); w.npcs.push(n); }
      else w.props.push({ id: uid("pr"), kind: "door", x: nx, y: ny - 4, r: 7, place: pl, t: 0 });
      w.labels.push({ x: (pl.x + 3) * T, y: pl.y * T - 2, text: pl.name });
    }
    // Giếng Thánh ở giữa + Sư Nến
    const wx = 20.5 * T, wy = 12 * T;
    for (let y = 11; y <= 12; y++) for (let x = 19; x <= 21; x++) w.tiles[y][x] = "~";
    const monk = baseEntity("npc", 23.5 * T, 13.5 * T, 6); Object.assign(monk, { sprite: "npc_nen", place: { id: "well", name: "GIẾNG THÁNH", who: "Sư Nến", role: "Rửa điểm chỉ số", open: () => UI.openWell() }, animT: 1 });
    w.npcs.push(monk); w.labels.push({ x: wx, y: 10.5 * T, text: "GIẾNG THÁNH" });
    // trang trí
    [[10, 6], [27, 6], [12, 15], [28, 15], [36, 20], [16, 20]].forEach(([x, y]) => { w.tiles[y][x] = "o"; });
    [[9, 20], [10, 20], [30, 20]].forEach(([x, y]) => { w.tiles[y][x] = "c"; });
    for (let x = 14; x < 27; x++) w.tiles[17][x] = "=";
    scanTiles(w);
    w.theme = TOWN_THEME; w.floorSeed = 77; w.startPos = { x: 20.5 * T, y: 19 * T };
    return w;
  },

  enter(params = {}) {
    GAME.run = null; GAME.paused = false;
    const w = this.world = GAME.world = this.build();
    w.player = createPlayer(GAME.save.hero, w.startPos.x, w.startPos.y, GAME.save);
    w.player.potions = w.player.potionMax;
    GAME.view.camX = w.player.x - GAME.view.w / 2; GAME.view.camY = w.player.y - GAME.view.h / 2;
    this.hint = Input.isTouch ? ["Đi tới chỗ NPC rồi bấm ⚔ để nói chuyện"] : ["Đi tới NPC và bấm F · I túi đồ · C nhân vật · Esc cài đặt"];
    this.hintT = 6;
    this.showButtons();
    UI.showBanner("MIỆNG GIẾNG", `${GAME.save.hero.name} · Cấp ${GAME.save.hero.level}`, 1.6);
    if (GAME.save.hero.unspent > 0) UI.toast(`Có ${GAME.save.hero.unspent} điểm chỉ số chưa cộng (về Nhà hoặc bấm C)`, "#ffd23d");
    Save.write();
    this.autosave = 30;
  },
  exit() { const b = document.getElementById("townbtns"); if (b) b.remove(); Win.close(true); },

  showButtons() {
    const old = document.getElementById("townbtns"); if (old) old.remove();
    const btns = [btn("Túi đồ", () => UI.openInventory()), btn("Nhân vật", () => UI.openStats()), btn("⚙", () => UI.openSettings())];
    if (isDebug()) btns.unshift(btn("DEBUG", () => this.debugMenu()));
    UI.root.append(el("div.hudbtns", { id: "townbtns" }, btns));
  },
  /** bảng thử nghiệm (?debug=1): cho đồ, vàng, cấp để test nhanh */
  debugMenu() {
    const s = GAME.save, give = o => { const it = genItem(Object.assign({ dungeonId: "mine", diff: "nightmare", ilvl: s.hero.level }, o)); s.inventory.push(it); UI.toast("+ " + it.name, RAR[it.rar].color); afterChange(); };
    const body = Win.open("DEBUG", afterChange);
    body.append(el("div.acts", {}, [
      btn("+10.000 vàng", () => { s.gold += 10000; afterChange(); }), btn("+100 mảnh", () => { s.shards += 100; afterChange(); }),
      btn("+1 cấp", () => { addXpTo(s.hero, xpNeed(s.hero.level)); afterChange(); }), btn("+10 cấp", () => { for (let i = 0; i < 10; i++) addXpTo(s.hero, xpNeed(s.hero.level)); afterChange(); }),
      btn("Huyền Thoại có tên", () => give({ rarity: "legendary", unique: pick(["u_foremanPick", "u_hoaLantern", "u_khaSword", "u_tailorShears", "u_captainHelm", "u_hungryBoots", "u_wetCloak", "u_vanBrush"]) })),
      btn("Huyền Thoại ngẫu nhiên", () => give({ rarity: "legendary" })), btn("Thần Thoại", () => give({ rarity: "mythic" })),
      btn("Đủ 20 phép (Hiếm)", () => { for (const k of Object.keys(SKILLS)) { const it = genItem({ dungeonId: "mine", slot: "spell", skill: k, rarity: "rare", ilvl: s.hero.level }); s.inventory.push(it); } s.invCap = Math.max(s.invCap, 80); afterChange(); UI.toast("+20 phép", "#4DA6FF"); }),
      btn("Mở hết độ khó Mỏ", () => { s.unlocks.dungeons.mine.maxDiff = "insane"; afterChange(); }),
    ]));
  },
  autoTarget() { return null; },

  update(dt) {
    const w = this.world, p = w.player, s = Input.state, v = GAME.view;
    if (GAME.uiOpen) return;
    if (s.invPressed) { UI.openInventory(); return; }
    if (Input.pressed.KeyC) { UI.openStats(); return; }
    if (s.pausePressed) { UI.openSettings(); return; }
    // NPC gần nhất
    this.near = null; let bd = 26 * 26;
    for (const n of w.npcs) { n.animT += dt; n.flip = p.x < n.x; const d = dist2(n.x, n.y, p.x, p.y); if (d < bd) { bd = d; this.near = n; } }
    for (const pr of w.props) { pr.t += dt; const d = dist2(pr.x, pr.y, p.x, p.y); if (d < bd) { bd = d; this.near = pr; } }
    if (this.near) {
      if (Input.isTouch) { s.attack = false; if (Input.touchHeld.attackP) this.talk(this.near); }
      else if (s.interactPressed) this.talk(this.near);
    }
    Player.update(w, p, dt);
    w.pickups = []; w.projs = w.projs.filter(e => { e.life -= dt; e.x += e.vx * dt; e.y += e.vy * dt; return e.life > 0 && !blocksProjPx(w, e.x, e.y); });
    if (this.hintT > 0) this.hintT -= dt;
    this.autosave -= dt; if (this.autosave <= 0) { this.autosave = 30; GAME.save.playTime += 30; Save.write(); }
    // camera
    const tx = p.x - v.w / 2, ty = p.y - 8 - v.h / 2;
    v.camX = lerp(v.camX, tx, CONFIG.CAM_LERP); v.camY = lerp(v.camY, ty, CONFIG.CAM_LERP);
    v.camX = w.pw <= v.w ? (w.pw - v.w) / 2 : clamp(v.camX, 0, w.pw - v.w);
    v.camY = w.ph <= v.h ? (w.ph - v.h) / 2 : clamp(v.camY, 0, w.ph - v.h);
  },
  talk(n) { Audio.sfx("ui_click"); n.place.open(); },

  render(ctx) {
    const v = GAME.view, w = this.world;
    // NPC vẽ như quái (dùng chung renderer), tạm gắn vào danh sách enemies để sắp theo y
    w.enemies = w.npcs.map(n => Object.assign(n, { aiState: "idle", moving: false, def: { name: n.place.who }, hp: 1, maxHp: 1, status: {} }));
    Render.world(ctx, w, Math.round(v.camX), Math.round(v.camY), this.ambient);
    w.enemies = [];
  },
  /** chữ trên uiCanvas: tên toà nhà, tên NPC, gợi ý nói chuyện */
  hudExtra(g, toScreen, u) {
    const w = this.world;
    for (const l of w.labels) { const [sx, sy] = toScreen(l.x, l.y); UI.text(l.text, sx, sy, u * 0.95, "#ffe9a8", "center"); }
    // bảng hologram trên đầu NPC: tên + việc NPC làm (nhấp nháy nhẹ, trôi lên xuống)
    const t = GAME.time, holo = [...w.npcs.map(n => ({ x: n.x, y: n.y - 30, p: n.place })), ...w.props.filter(pr => pr.place).map(pr => ({ x: pr.x, y: pr.y - 18, p: pr.place }))];
    holo.forEach((h, i) => {
      const [sx, sy0] = toScreen(h.x, h.y), sy = sy0 + Math.sin(t * 2 + i) * u * 0.15;
      const a = 0.75 + 0.15 * Math.sin(t * 7 + i * 3) + (Math.random() < 0.02 ? -0.4 : 0);
      g.save(); g.globalAlpha = Math.max(0.2, a);
      g.font = `${Math.round(u * 0.8)}px VT323, monospace`;
      const tw = Math.max(g.measureText(h.p.role).width, g.measureText(h.p.who || h.p.name).width) + u;
      g.fillStyle = "rgba(20,80,110,.45)"; g.fillRect(sx - tw / 2, sy - u * 1.15, tw, u * 1.75);
      g.strokeStyle = "rgba(120,240,255,.8)"; g.lineWidth = 1; g.strokeRect(sx - tw / 2 + 0.5, sy - u * 1.15 + 0.5, tw, u * 1.75);
      g.fillStyle = "rgba(120,240,255,.12)"; for (let k = 0; k < 4; k++) g.fillRect(sx - tw / 2, sy - u * 1.15 + ((t * 20 + k * u * 0.45) % (u * 1.75)), tw, 1);  // vạch quét
      g.beginPath(); g.moveTo(sx - 3, sy + u * 0.6); g.lineTo(sx + 3, sy + u * 0.6); g.lineTo(sx, sy + u * 0.95); g.fillStyle = "rgba(120,240,255,.8)"; g.fill();
      g.restore();
      g.globalAlpha = Math.max(0.3, a);
      UI.text(h.p.who || h.p.name, sx, sy - u * 0.6, u * 0.85, "#aaf6ff", "center");
      UI.text(h.p.role, sx, sy + u * 0.15, u * 0.75, "#e6fdff", "center");
      g.globalAlpha = 1;
    });
    if (this.near) {
      const n = this.near, [sx, sy] = toScreen(n.x, n.y - 26);
      UI.text((Input.isTouch ? "⚔ " : "[F] ") + (n.place.who ? "Nói chuyện với " + n.place.who : "Vào " + n.place.name.toLowerCase()), sx, sy, u, "#ffffff", "center");
    }
  },
};

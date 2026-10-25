/* 55-scene-title: màn hình tiêu đề + tạo nhân vật (GDD 10.2 mục 1, 2) */
const LOOKS = [
  { id: "knight", name: "Hiệp Sĩ", sprite: "knight_m", desc: "Kiếm + Lướt Chém" },
  { id: "mage", name: "Pháp Sư", sprite: "wizzard_m", desc: "Gậy phép + Cầu Lửa" },
  { id: "hunter", name: "Thợ Săn", sprite: "elf_m", desc: "Cung + Lốc Xoáy" },
  { id: "lizard", name: "Thằn Lằn", sprite: "lizard_m", desc: "Dao + Lướt Chém" },
];
const TitleScene = {
  world: null, t: 0, motes: [],
  enter() {
    GAME.run = null; GAME.world = null; this.world = null; GAME.paused = false;
    this.motes = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.2, 1, Math.random) }));
    GAME.save ? this.menu() : this.create();
  },
  exit() { Win.close(true); },
  menu() {
    const s = GAME.save;
    const body = Win.open("MINI DUNGEON SLAYER", () => this.menu());
    body.append(el("p", { style: "text-align:center" }, [el("img", { src: spriteIconURL(HERO_LOOKS[s.hero.look] + "_idle_anim"), style: "width:96px;image-rendering:pixelated" })]),
      el("p", { style: "text-align:center;font-size:24px" }, `${s.hero.name} · Cấp ${s.hero.level} · ${fmtN(s.gold)} vàng`),
      el("div.acts", { style: "justify-content:center" }, [
        btn("Tiếp tục", () => { Win.close(true); SceneManager.go("town", {}); }),
        btn("Phòng thử vũ khí", () => { Win.close(true); SceneManager.go("dungeon", { test: true }); }),
        btn("⚙ Cài đặt", () => UI.openSettings(() => this.menu()))]),
      el("p.muted", { style: "text-align:center;margin-top:10px" }, WATERMARK));
  },
  create() {
    let look = "knight";
    const body = Win.open("TẠO NHÂN VẬT", () => this.create());
    const name = el("input.txt", { maxlength: 12, value: "Mini" });
    const looks = el("div.cols");
    const draw = () => {
      looks.innerHTML = "";
      for (const L of LOOKS) looks.append(el("div.card", { style: `cursor:pointer;text-align:center;min-width:150px;flex:1;border-color:${look === L.id ? "#ffd23d" : "#3a2e5a"}`, onclick: () => { look = L.id; Audio.sfx("ui_click"); draw(); } },
        [el("img", { src: spriteIconURL(L.sprite + "_idle_anim"), style: "width:80px;image-rendering:pixelated" }), el("h3", {}, L.name), el("div.muted", {}, L.desc)]));
    };
    draw();
    body.append(el("p", {}, "Ba tháng trước, anh Kha xuống Vực và không về. Bạn đến thị trấn Miệng Giếng để tìm anh."),
      el("div.row", {}, [el("span", {}, "Tên"), name]), el("p.muted", {}, "Chọn dáng (chỉ là ngoại hình + vũ khí khởi đầu, đổi build bằng đồ sau):"), looks,
      el("div.acts", { style: "justify-content:center;margin-top:10px" }, [btn("Bắt đầu", () => {
        Audio.init();
        GAME.save = Save.fresh((name.value || "Mini").trim().slice(0, 12), look); Save.write();
        Object.assign(GAME.settings, GAME.save.settings);
        Win.close(true); SceneManager.go("town", {});
      })]));
  },
  update(dt) { this.t += dt; },
  render(ctx) {
    const v = GAME.view, g = ctx;
    const gr = g.createLinearGradient(0, 0, 0, v.h); gr.addColorStop(0, "#120a22"); gr.addColorStop(1, "#05030a");
    g.fillStyle = gr; g.fillRect(0, 0, v.w, v.h);
    for (const m of this.motes) { const y = (m.y - this.t * 0.02 * m.s) % 1, yy = (y < 0 ? y + 1 : y) * v.h;
      g.fillStyle = `rgba(200,170,255,${0.2 + 0.4 * m.s})`; g.fillRect(Math.round(m.x * v.w), Math.round(yy), 1, 1); }
  },
};

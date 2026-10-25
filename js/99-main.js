/* 99-main: khởi động, quản lý scene, vòng lặp bước cố định 60 lần/giây (GDD 13.3)
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const WATERMARK = "Tran Duc Long - tranduclong.id.vn";
const GAME = {
  save: null, scene: null, overlays: [], run: null, world: null,
  time: 0, paused: false, hitstop: 0, slowmo: 1, fps: 60, runGold: 0,
  settings: { shake: true, numbers: true, autoAim: false, fxQuality: "high" },
  view: { w: 480, h: 270, scale: 1, dpr: 1, camX: 0, camY: 0, offX: 0, offY: 0 },
};
const SCENES = { dungeon: DungeonScene, town: TownScene, title: TitleScene };

const SceneManager = {
  go(name, params) {
    if (GAME.scene && GAME.scene.exit) GAME.scene.exit();
    FX.parts = []; FX.numbers = []; FX.rings = []; FX.tempLights = []; FX.lines = [];
    GAME.scene = SCENES[name]; GAME.scene.enter(params);
  },
};

const worldCanvas = document.getElementById("worldCanvas");
const wctx = worldCanvas.getContext("2d");

/**
 * Chọn kích thước màn hình logic sao cho phóng to theo số nguyên điểm ảnh thiết bị,
 * chiều cao logic ≈ 270 và luôn lấp đầy màn hình (không viền đen).
 */
function resizeView() {
  const dpr = Math.min(3, devicePixelRatio || 1), cw = innerWidth || 480, ch = innerHeight || 270;   // khung ẩn có thể báo 0
  const scale = Math.max(1, Math.round(ch * dpr / CONFIG.VIEW_H));        // điểm ảnh thiết bị cho mỗi pixel game
  const vw = Math.ceil(cw * dpr / scale), vh = Math.ceil(ch * dpr / scale);
  worldCanvas.width = vw; worldCanvas.height = vh;
  worldCanvas.style.width = (vw * scale / dpr) + "px"; worldCanvas.style.height = (vh * scale / dpr) + "px";
  worldCanvas.style.left = "0px"; worldCanvas.style.top = "0px";
  Object.assign(GAME.view, { w: vw, h: vh, scale: scale / dpr, dpr, offX: 0, offY: 0 });
  wctx.imageSmoothingEnabled = false;
  Light.init(vw, vh);
}

/** toạ độ CSS của chuột -> toạ độ thế giới */
function screenToWorld(cx, cy) { const v = GAME.view; return [(cx - v.offX) / v.scale + v.camX, (cy - v.offY) / v.scale + v.camY]; }

let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0;
let lastW = 0, lastH = 0;
function frame(now) {
  let dt = Math.min(0.1, (now - last) / 1000); last = now;
  // tự tính lại cỡ màn hình nếu cửa sổ đổi cỡ mà không có sự kiện resize (tab ẩn, xoay máy, khung nhúng)
  if (innerWidth !== lastW || innerHeight !== lastH) { lastW = innerWidth; lastH = innerHeight; if (lastW && lastH) { resizeView(); UI.resize(); Input.layoutButtons(); } }
  fpsT += dt; fpsN++; if (fpsT >= 0.5) { GAME.fps = Math.round(fpsN / fpsT); fpsT = 0; fpsN = 0; }
  const sc = GAME.scene;
  if (sc && sc.world) {
    const p = sc.world.player;
    Input.poll(screenToWorld, p, (Input.isTouch || GAME.settings.autoAim || !Input.state.hasMouseAim) && sc.autoTarget ? sc.autoTarget() : null);
  }
  if (GAME.hitstop > 0) { GAME.hitstop -= dt; dt = 0; }
  acc += dt * GAME.slowmo;
  let steps = 0;
  while (acc >= CONFIG.STEP && steps < 6) {
    update(CONFIG.STEP); acc -= CONFIG.STEP; steps++;
    Input.consumePresses();                 // phím vừa bấm chỉ được dùng ở bước logic đầu tiên
  }
  if (steps === 6) acc = 0;
  render();
  // chỉ xoá phím đã bấm khi đã có ít nhất một bước logic xử lý nó
  // (màn hình 120/144/165 Hz có nhiều khung vẽ không chạy logic → trước đây phím bị mất, phải bấm 2 lần)
  if (steps > 0) Input.endFrame();
  requestAnimationFrame(frame);
}
function update(dt) {
  if (!GAME.paused && GAME.scene) { GAME.time += dt; GAME.scene.update(dt); }
  FX.update(dt); UI.update(dt); Audio.update(dt);
}
function render() {
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  if (GAME.scene) GAME.scene.render(wctx);
  UI.renderHud(GAME.scene);
}

function boot() {
  Input.init(document.getElementById("game"));
  UI.init();
  resizeView(); addEventListener("resize", resizeView);
  addEventListener("pointerdown", () => Audio.init(), { once: true });
  Assets.load(() => {
    GAME.save = Save.load();
    if (GAME.save) { Object.assign(GAME.settings, GAME.save.settings); FX.quality = GAME.save.settings.fxQuality; Audio.setVolume("sfx", GAME.save.settings.sfx); }
    SceneManager.go(/[?&]test=1/.test(location.search) ? "dungeon" : "title", { test: true });
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
  });
}
boot();

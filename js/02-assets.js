/* 02-assets: nạp ảnh gói 0x72, vẽ sprite, đổi màu, hình thay thế khi chưa có gói */
const Assets = {
  img: null, ready: false, usingAtlas: false,
  tintCache: new Map(), phCache: new Map(),

  /** nạp ảnh atlas (nếu có) và chờ font; xong gọi onDone */
  load(onDone) {
    const fontReady = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const imgReady = new Promise(res => {
      if (typeof ATLAS === "undefined" || !ATLAS || !ATLAS_IMAGE || isDebug() && /placeholder=1/.test(location.search)) return res();
      const im = new Image();
      im.onload = () => { this.img = im; this.usingAtlas = true; res(); };
      im.onerror = () => { console.warn("Không nạp được ảnh atlas, dùng hình thay thế:", ATLAS_IMAGE); res(); };
      im.src = ATLAS_IMAGE;
    });
    Promise.all([fontReady, imgReady]).then(() => { this.ready = true; onDone(); });
  },

  has(key) { return this.usingAtlas && !!ATLAS[key]; },
  frames(key) { if (this.has(key)) return ATLAS[key].frames; const f = pixelFrames(key); return f ? f.length : 1; },
};

/* ── sprite pixel vẽ bằng code (02c) khi atlas không có key ── */
const PIXEL_ALIAS = {};
/** "goblin_run_anim" -> các khung chạy của goblin; "weapon_x" -> 1 khung tĩnh */
function pixelFrames(key) {
  if (typeof PixelArt === "undefined") return null;
  const m = key.match(/^(.*)_(idle|run)_anim$/);
  let base = m ? m[1] : key; base = PIXEL_ALIAS[base] || base;
  const def = PIXEL_SPRITES[base]; if (!def) return null;
  return PixelArt.frames(base, def.anim === "static" ? "static" : (m ? m[2] : "idle"));
}
/** bản phủ màu của một canvas bất kỳ, có cache */
const _tintMap = new WeakMap();
function tintedCanvas(src, color, strength) {
  let m = _tintMap.get(src); if (!m) { m = new Map(); _tintMap.set(src, m); }
  const k = color + strength; let c = m.get(k);
  if (!c) {
    c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const g = c.getContext("2d"); g.drawImage(src, 0, 0);
    g.globalCompositeOperation = "source-atop"; g.globalAlpha = strength; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    m.set(k, c);
  }
  return c;
}

/** chọn khung animation theo thời gian */
function animFrame(key, t, fps = 8) { const n = Assets.frames(key); return Math.floor(t * fps) % n; }

/** cắt 1 khung từ atlas ra canvas riêng (để đổi màu / nháy trắng) */
function frameCanvas(key, frame) {
  const a = ATLAS[key], c = document.createElement("canvas");
  c.width = a.w; c.height = a.h;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(Assets.img, a.x + frame * a.w, a.y, a.w, a.h, 0, 0, a.w, a.h);
  return c;
}

/** sprite đã phủ màu (color, độ đậm strength 0..1), có cache */
function getTinted(key, frame, color, strength) {
  const ck = key + "|" + frame + "|" + color + "|" + strength;
  let c = Assets.tintCache.get(ck);
  if (!c) {
    c = frameCanvas(key, frame);
    const g = c.getContext("2d");
    g.globalCompositeOperation = "source-atop"; g.globalAlpha = strength; g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    Assets.tintCache.set(ck, c);
  }
  return c;
}

/**
 * vẽ sprite, chân sprite đặt tại (x, y) (đáy giữa).
 * opts: {flip, scale, tint, tintAmt, alpha, flash, w, h, color (hình thay thế), kind}
 */
function drawSprite(ctx, key, frame, x, y, opts = {}) {
  const s = opts.scale || 1;
  ctx.save();
  ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
  if (Assets.has(key)) {
    const a = ATLAS[key], f = frame % a.frames;
    let src = null;
    if (opts.flash > 0) src = getTinted(key, f, "#ffffff", 1);
    else if (opts.tint) src = getTinted(key, f, opts.tint, opts.tintAmt == null ? 0.45 : opts.tintAmt);
    ctx.translate(Math.round(x), Math.round(y));
    if (opts.flip) ctx.scale(-1, 1);
    const w = a.w * s, h = a.h * s;
    if (src) ctx.drawImage(src, -w / 2, -h, w, h);
    else ctx.drawImage(Assets.img, a.x + f * a.w, a.y, a.w, a.h, -w / 2, -h, w, h);
  } else {
    const fr = pixelFrames(key);
    if (fr) {
      let src = fr[frame % fr.length];
      if (opts.flash > 0) src = tintedCanvas(src, "#ffffff", 1);
      else if (opts.tint) src = tintedCanvas(src, opts.tint, opts.tintAmt == null ? 0.45 : opts.tintAmt);
      ctx.translate(Math.round(x), Math.round(y));
      if (opts.flip) ctx.scale(-1, 1);
      const w = src.width * s, h = src.height * s;
      ctx.drawImage(src, Math.round(-w / 2), Math.round(-h + 1), w, h);
    } else drawPlaceholder(ctx, key, frame, x, y, opts);
  }
  ctx.restore();
}

/* ── Hình thay thế: nhân vật chibi pixel vẽ bằng khối, đủ đẹp để test khi chưa có gói 0x72 ── */
const PH_STYLE = {
  // key: [màu thân, màu đầu/mặt, cao, rộng, kiểu]
  knight_m: ["#6b7ba8", "#f2c9a0", 22, 12, "hero"], wizzard_m: ["#6b3fa0", "#f2c9a0", 22, 12, "hero"],
  elf_m: ["#3f8a4a", "#f2c9a0", 22, 12, "hero"], lizard_m: ["#4f9a5a", "#7fd08a", 22, 12, "hero"],
  goblin: ["#5a8a3a", "#8fcf5a", 14, 12, "mob"], wogol: ["#3a5a8a", "#6a9ad0", 14, 12, "mob"],
  imp: ["#b0402a", "#ff7a4a", 13, 11, "mob"], skelet: ["#c8c8c0", "#ecece4", 15, 11, "mob"],
};
function drawPlaceholder(ctx, key, frame, x, y, opts) {
  const st = PH_STYLE[key] || [opts.color || "#a08cff", "#ffffff", 14, 12, "mob"];
  const s = opts.scale || 1, h = st[2] * s, w = st[3] * s, bob = (frame % 2) * s;
  ctx.translate(Math.round(x), Math.round(y));
  if (opts.flip) ctx.scale(-1, 1);
  const body = opts.flash > 0 ? "#fff" : (opts.tint || st[0]), head = opts.flash > 0 ? "#fff" : st[1];
  ctx.fillStyle = "#000";                                     // viền
  ctx.fillRect(-w / 2 - 1, -h - 1 + bob, w + 2, h + 2 - bob);
  ctx.fillStyle = body;
  ctx.fillRect(-w / 2, -h * 0.55, w, h * 0.55);               // thân
  ctx.fillStyle = head;
  ctx.fillRect(-w / 2, -h + bob, w, h * 0.48);                // đầu
  ctx.fillStyle = "#14101e";                                  // mắt
  ctx.fillRect(Math.round(w * 0.05), Math.round(-h * 0.8 + bob), Math.max(1, s * 2), Math.max(2, s * 3));
  ctx.fillRect(Math.round(w * 0.28), Math.round(-h * 0.8 + bob), Math.max(1, s * 2), Math.max(2, s * 3));
  if (st[4] === "hero") { ctx.fillStyle = body; ctx.fillRect(-w / 2, -h - 2 + bob, w, 3); } // mũ
  ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(-w / 2, -h + bob, w, 1);              // ánh sáng đỉnh
}

/** vẽ vũ khí cầm tay xoay theo hướng ngắm */
function drawWeapon(ctx, key, x, y, ang, opts = {}) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(ang + Math.PI / 2);
  if (Math.cos(ang) < 0) ctx.scale(-1, 1);
  const pf = Assets.has(key) ? null : pixelFrames(key);
  if (Assets.has(key)) {
    const a = ATLAS[key];
    ctx.drawImage(Assets.img, a.x, a.y, a.w, a.h, -a.w / 2, -a.h + 2, a.w, a.h);
  } else if (pf) {
    const c = pf[0]; ctx.drawImage(c, Math.round(-c.width / 2), -c.height + 3);
  } else {
    const len = opts.len || 14;
    ctx.fillStyle = "#000"; ctx.fillRect(-2, -len - 1, 4, len + 2);
    ctx.fillStyle = opts.color || "#dfe6f2"; ctx.fillRect(-1, -len, 2, len - 3);
    ctx.fillStyle = "#8a5a2a"; ctx.fillRect(-3, -3, 6, 2);
  }
  ctx.restore();
}

/** ô nền/tường từ atlas; trả false nếu không có để nơi gọi tự tô màu */
function drawTile(ctx, key, x, y) {
  if (!Assets.has(key)) return false;
  const a = ATLAS[key];
  ctx.drawImage(Assets.img, a.x, a.y, a.w, a.h, x, y, a.w, a.h);
  return true;
}

/* 40-ui-hud: HUD trên uiCanvas độ phân giải cao (chữ tiếng Việt nét), nút cảm ứng, thông báo */
const UI = {
  canvas: null, g: null, dpr: 1, toasts: [], banner: null,

  init() {
    this.canvas = document.getElementById("uiCanvas"); this.g = this.canvas.getContext("2d");
    this.root = document.getElementById("ui-root");
    this.resize(); addEventListener("resize", () => this.resize());
  },
  resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = innerWidth * this.dpr; this.canvas.height = innerHeight * this.dpr;
  },
  toast(text, color = "#fff") { this.toasts.push({ text, color, t: 0 }); if (this.toasts.length > 4) this.toasts.shift(); },
  showBanner(text, sub, dur = 1.6) { this.banner = { text, sub, t: 0, dur }; },
  update(dt) {
    for (const t of this.toasts) t.t += dt; this.toasts = this.toasts.filter(t => t.t < 3);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
  },

  /** vẽ chữ có viền đen kiểu pixel */
  text(txt, x, y, size, color = "#fff", align = "left") {
    const g = this.g; g.font = `${Math.round(size)}px VT323, monospace`; g.textAlign = align; g.textBaseline = "middle";
    g.lineWidth = Math.max(3, size / 6); g.strokeStyle = "#000"; g.lineJoin = "round"; g.strokeText(txt, x, y);
    g.fillStyle = color; g.fillText(txt, x, y);
  },
  bar(x, y, w, h, k, fg, bg = "#2a0a14", k2 = 0, fg2 = "#9fd0ff") {
    const g = this.g;
    g.fillStyle = "#000"; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.fillStyle = fg; g.fillRect(x, y, w * clamp(k, 0, 1), h);
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x, y, w * clamp(k, 0, 1), h * 0.3);
    if (k2 > 0) { g.fillStyle = fg2; g.fillRect(x, y + h * 0.65, w * clamp(k2, 0, 1), h * 0.35); }
  },

  /** vẽ toàn bộ HUD của scene hầm */
  renderHud(scene) {
    const g = this.g, d = this.dpr, W = this.canvas.width, H = this.canvas.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.setTransform(d, 0, 0, d, 0, 0);
    const w = innerWidth, h = innerHeight, u = Math.max(14, Math.min(w, h) * 0.035);   // đơn vị cỡ chữ
    if (!scene || !scene.world) return;
    const p = scene.world.player;

    // chữ sát thương (toạ độ thế giới -> màn hình)
    const v = GAME.view;
    const toScreen = (x, y) => [v.offX + (x - v.camX) * v.scale, v.offY + (y - v.camY) * v.scale];
    FX.renderNumbers(g, toScreen, v.scale);
    if (scene.hudExtra) scene.hudExtra(g, toScreen, u);

    if (p) {
      const bw = Math.min(260, w * 0.3);
      this.bar(u, u, bw, u * 0.9, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? "#ff3a4a" : "#e8384f", "#3a0a14", p.shield / p.maxHp);
      this.text(`${Math.ceil(p.hp)} / ${p.maxHp}`, u + bw / 2, u + u * 0.45, u * 0.95, "#fff", "center");
      const h = p.hero;
      this.bar(u, u * 1.75, bw, u * 0.22, (h.xp || 0) / xpNeed(h.level), "#ffd23d", "#2a2210");
      this.text(`♥ ${p.potions}`, u, u * 2.8, u * 1.1, "#ff7a9a");
      this.text(`● ${GAME.run ? GAME.run.gold : GAME.runGold || 0}`, u + u * 3.4, u * 2.8, u * 1.1, "#ffd23d");
      this.text(`Cấp ${h.level}`, u + u * 8, u * 2.8, u * 1.1, "#c9bde8");
      this.text(`${WEAPON_TYPES[p.weapon.wtype].name}`, u, u * 4, u * 0.95, "#c9bde8");
      if (p.dodgeCd > 0) this.bar(u, u * 4.8, u * 4, u * 0.25, 1 - p.dodgeCd / CONFIG.DODGE_CD, "#9fd0ff", "#10203a");
    }
    // ô phép Q/E (máy tính: góc dưới phải; điện thoại: vẽ trên nút)
    if (p && GAME.scene !== TownScene) {
      const sz = u * 2.6;
      ["spell1", "spell2"].forEach((slot, i) => {
        const info = Skills.slotInfo(p, slot), cd = (p.skillCd && p.skillCd[slot]) || 0, max = (p.skillCdMax && p.skillCdMax[slot]) || 1;
        let x, y, r;
        if (Input.isTouch) { const b = Input.buttons.find(b => b.key === slot); x = b.x; y = b.y; r = b.r; }
        else { x = w - u * 1.2 - sz * (2 - i) - u * 0.4 * (1 - i) + sz / 2; y = h - u * 4.2 - sz / 2; r = sz / 2; }
        if (!Input.isTouch) { g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4); g.fillStyle = "#1a1230"; g.fillRect(x - r, y - r, r * 2, r * 2); }
        if (info) {
          g.globalAlpha = cd > 0 ? 0.45 : 1; this.text(info.S.glyph, x, y - (Input.isTouch ? 0 : r * 0.12), r * 1.1, info.S.color, "center"); g.globalAlpha = 1;
          if (cd > 0) {
            g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * (cd / max)); g.closePath(); g.fill();
            this.text(cd.toFixed(cd < 1 ? 1 : 0), x, y, r * 0.7, "#fff", "center");
          }
          if (!Input.isTouch) this.text(info.S.name, x, y + r * 0.72, Math.max(10, r * 0.32), "#c9bde8", "center");
        }
        if (!Input.isTouch) this.text(i ? "E" : "Q", x - r + 6, y - r + 8, r * 0.4, "#ffe9a8", "left");
      });
    }
    const run = GAME.run;
    // thanh máu boss
    if (run && run.boss && !run.boss.dead && run.boss.aiState !== "spawn") {
      const b = run.boss, bw = Math.min(460, w * 0.5), bx = (w - bw) / 2, by = h - u * 3.6;
      this.text(b.def.name, w / 2, by - u * 0.9, u * 1.2, b.isBoss ? "#ffb3a0" : "#7af0ff", "center");
      this.bar(bx, by, bw, u * 0.8, b.hp / b.maxHp, b.invuln > 0 ? "#9ad0ff" : b.isBoss ? "#e8384f" : "#3ab0d0", "#2a0a14");
    }
    // thông tin đợt quái
    if (scene.hudInfo) this.text(scene.hudInfo, w / 2, u * 1.1, u * 1.1, "#ffe9a8", "center");
    // gợi ý tương tác
    if (run && run.interact) {
      const o = run.interact, [sx, sy] = [v.offX + (o.x - v.camX) * v.scale, v.offY + (o.y - 26 - v.camY) * v.scale];
      const col = o.kind === "pickup" ? RAR[o.item.rar].color : "#ffe9a8";
      this.text((Input.isTouch ? "⚔ " : "[F] ") + Run.interactLabel(o), sx, sy, u * 1.05, col, "center");
    }
    if (run) this.renderMinimap(run, w, u);
    // gợi ý điều khiển
    if (scene.hint && scene.hintT > 0) {
      g.globalAlpha = Math.min(1, scene.hintT);
      const lines = [].concat(scene.hint), fs = Math.min(u * 0.9, w / 30);
      lines.forEach((l, i) => this.text(l, w / 2, h - u * 1.6 - (lines.length - 1 - i) * fs * 1.2, fs, "#c9bde8", "center"));
      g.globalAlpha = 1;
    }
    // thông báo
    this.toasts.forEach((t, i) => { g.globalAlpha = t.t > 2.5 ? (3 - t.t) * 2 : 1; this.text(t.text, u, h * 0.42 + i * u * 1.2, u, t.color); });
    g.globalAlpha = 1;
    // băng rôn giữa màn hình
    if (this.banner) {
      const b = this.banner, k = b.t / b.dur, s = b.t < 0.15 ? 1.6 - b.t / 0.15 * 0.6 : 1;
      g.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      this.text(b.text, w / 2, h * 0.32, u * 3 * s, "#ffd23d", "center");
      if (b.sub) this.text(b.sub, w / 2, h * 0.32 + u * 2.4, u * 1.1, "#e8deff", "center");
      g.globalAlpha = 1;
    }
    g.globalAlpha = 0.35; this.text(WATERMARK, w - u * 0.6, h - u * 0.6, u * 0.65, "#c9bde8", "right"); g.globalAlpha = 1;
    if (isDebug()) this.text(`FPS ${GAME.fps} · quái ${scene.world.enemies.length} · đạn ${scene.world.projs.length} · hạt ${FX.parts.length}`, w - u, h - u, u * 0.8, "#8f8", "right");
    if (Input.isTouch) this.renderTouch(g);
  },

  /** bản đồ nhỏ góc trên phải: phòng đã vào (sáng), phòng kề (mờ), biểu tượng rương/boss */
  renderMinimap(run, w, u) {
    const g = this.g, world = GAME.world, cs = Math.max(10, u * 0.9), gap = cs * 0.45;
    const ox = w - (GRID * (cs + gap)) - u * (Input.isTouch ? 4.5 : 1), oy = u;
    g.globalAlpha = 0.85;
    for (const r of world.rooms) {
      if (!r.known) continue;
      const x = ox + r.gx * (cs + gap), y = oy + r.gy * (cs + gap);
      for (const li of r.links) { const o = world.rooms[li]; if (!o.known || li < r.id) continue;
        g.fillStyle = "#6a5a8a"; const x2 = ox + o.gx * (cs + gap), y2 = oy + o.gy * (cs + gap);
        g.fillRect(Math.min(x, x2) + cs / 2 - 1.5, Math.min(y, y2) + cs / 2 - 1.5, Math.abs(x2 - x) + 3, Math.abs(y2 - y) + 3); }
    }
    for (const r of world.rooms) {
      if (!r.known) continue;
      const x = ox + r.gx * (cs + gap), y = oy + r.gy * (cs + gap);
      g.fillStyle = "#000"; g.fillRect(x - 2, y - 2, cs + 4, cs + 4);
      g.fillStyle = r === run.room ? "#f2ecff" : r.visited ? (r.cleared ? "#7a6aa8" : "#c8506a") : "#3a3058";
      g.fillRect(x, y, cs, cs);
      const icon = { boss: ["☠", "#ff5a5a"], miniboss: ["!", "#7af0ff"], chest: ["▪", "#ffd23d"], event: ["♥", "#7ad0ff"] }[r.type];
      if (icon && (r.visited || r.type === "boss" || r.known)) this.text(icon[0], x + cs / 2, y + cs / 2, cs * 0.9, icon[1], "center");
    }
    g.globalAlpha = 1;
  },

  /** joystick ảo + nút cảm ứng */
  renderTouch(g) {
    const st = Input.stick;
    if (st.id !== null) {
      const R = innerHeight * 0.11;
      g.globalAlpha = 0.35; g.fillStyle = "#000"; g.beginPath(); g.arc(st.ox, st.oy, R, 0, TAU); g.fill();
      g.globalAlpha = 0.6; g.strokeStyle = "#c9bde8"; g.lineWidth = 2; g.beginPath(); g.arc(st.ox, st.oy, R, 0, TAU); g.stroke();
      const dx = st.x - st.ox, dy = st.y - st.oy, l = Math.hypot(dx, dy), f = l > R ? R / l : 1;
      g.globalAlpha = 0.8; g.fillStyle = "#e8deff"; g.beginPath(); g.arc(st.ox + dx * f, st.oy + dy * f, R * 0.4, 0, TAU); g.fill();
    }
    for (const b of Input.buttons) {
      g.globalAlpha = b.down ? 0.75 : 0.45; g.fillStyle = b.down ? "#5a4590" : "#1a1230";
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
      g.strokeStyle = "#c9bde8"; g.lineWidth = 2; g.stroke(); g.globalAlpha = 0.95;
      if (b.key !== "skill1" && b.key !== "skill2") this.text(b.icon, b.x, b.y, b.r * 0.9, "#fff", "center");
    }
    g.globalAlpha = 1;
  },

  /** bảng DOM đơn giản: {title, text, buttons:[{label, onClick}]} */
  panel(o) {
    this.closePanel();
    const el = document.createElement("div"); el.className = "panel"; el.id = "panel";
    el.innerHTML = `<h1>${o.title}</h1>${o.text ? `<p>${o.text}</p>` : ""}`;
    for (const b of o.buttons || []) {
      const btn = document.createElement("button"); btn.className = "btn"; btn.textContent = b.label;
      btn.onclick = () => { Audio.init(); Audio.sfx("ui_click"); b.onClick(); }; el.appendChild(btn);
    }
    this.root.appendChild(el);
  },
  closePanel() { const p = document.getElementById("panel"); if (p) p.remove(); },
};

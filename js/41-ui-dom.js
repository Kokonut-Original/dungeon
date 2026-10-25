/* 41-ui-dom: khung cửa sổ DOM kiểu pixel, icon đồ, chú thích đồ có so sánh. Dùng chung cho túi đồ, lò rèn, chợ... */
(function injectCss() {
  const css = `
  .win{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(900px,96vw);max-height:94vh;display:flex;flex-direction:column;
    background:rgba(14,10,24,.96);border:2px solid #8a6cff;box-shadow:0 0 0 2px #000,0 8px 0 #000;font-size:20px;color:#f2ecff}
  .win-h{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:2px solid #2e2450;background:#1a1330}
  .win-h h2{font-size:30px;color:#ffd36b;text-shadow:2px 2px 0 #000;flex:1;letter-spacing:1px}
  .win-x{font-family:var(--font);font-size:26px;background:#3a1a2a;color:#fff;border:2px solid #ff6a8a;padding:0 12px;cursor:pointer}
  .win-b{padding:12px 14px;overflow:auto;flex:1}
  .tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
  .tab{font-family:var(--font);font-size:22px;background:#1e1736;color:#c9bde8;border:2px solid #4a3a7a;padding:2px 14px;cursor:pointer}
  .tab.on{background:#3d2c68;color:#fff;border-color:#b9a6ff}
  .cols{display:flex;gap:14px;flex-wrap:wrap}.col{flex:1;min-width:260px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:6px}
  .cell{position:relative;aspect-ratio:1;background:#120d20;border:2px solid #3a2e5a;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .cell img{width:80%;height:80%;image-rendering:pixelated}
  .cell.sel{outline:2px solid #fff;outline-offset:1px}
  .cell .up{position:absolute;right:2px;bottom:0;font-size:15px;color:#ffd23d;text-shadow:1px 1px 0 #000}
  .cell .new{position:absolute;left:3px;top:3px;width:6px;height:6px;background:#5cf28a;box-shadow:0 0 4px #5cf28a}
  .cell .lock{position:absolute;right:2px;top:-2px;font-size:14px}
  .cell .lbl{position:absolute;left:2px;top:0;font-size:13px;color:#8a7cb0}
  .eq{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
  .tip{background:#0c0816;border:2px solid #3a2e5a;padding:8px 10px;font-size:19px;line-height:1.15}
  .tip .nm{font-size:24px}.tip .sub{color:#8a7cb0;font-size:17px}.tip .up{color:#5cf28a}.tip .dn{color:#ff6a7a}.tip .ln{display:flex;justify-content:space-between;gap:10px}
  .tip hr{border:0;border-top:1px solid #2e2450;margin:5px 0}
  .acts{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.acts .btn{font-size:20px;padding:3px 12px}
  .btn[disabled]{opacity:.4;cursor:not-allowed}
  .muted{color:#8a7cb0}.gold{color:#ffd23d}.good{color:#5cf28a}.bad{color:#ff6a7a}
  .row{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed #2a2244}
  .card{background:#120d20;border:2px solid #3a2e5a;padding:8px 10px;margin-bottom:8px}
  .card h3{font-size:24px;color:#ffe9a8}
  .pill{display:inline-block;padding:1px 8px;border:2px solid #4a3a7a;margin:2px;font-size:18px}
  .hudbtns{position:absolute;right:10px;top:10px;display:flex;gap:6px}.hudbtns .btn{font-size:20px;padding:2px 10px}
  input.txt{font-family:var(--font);font-size:24px;background:#0c0816;color:#fff;border:2px solid #8a6cff;padding:4px 8px;width:240px}
  textarea.txt{font-family:monospace;font-size:12px;width:100%;height:90px;background:#0c0816;color:#c9bde8;border:2px solid #4a3a7a}
  input[type=range]{width:180px}
  @media (max-width:700px){.win{font-size:17px}.win-h h2{font-size:24px}.grid{grid-template-columns:repeat(auto-fill,minmax(44px,1fr))}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
})();

/** tạo phần tử: el("div.class", {onclick}, [con hoặc chuỗi html]) */
function el(sel, props = {}, kids = []) {
  const [tag, ...cls] = sel.split("."), e = document.createElement(tag || "div");
  if (cls.length) e.className = cls.join(" ");
  for (const [k, v] of Object.entries(props)) { if (k === "html") e.innerHTML = v; else if (k.startsWith("on")) e[k] = v; else if (k === "style") e.style.cssText = v; else e.setAttribute(k, v); }
  for (const k of [].concat(kids)) if (k != null) e.append(k instanceof Node ? k : document.createRange().createContextualFragment(String(k)));
  return e;
}
function btn(label, onClick, opts = {}) {
  const b = el("button.btn", { onclick: () => { Audio.init(); Audio.sfx("ui_click"); onClick(); } }, label);
  if (opts.disabled) b.disabled = true; if (opts.title) b.title = opts.title; return b;
}

/** mở cửa sổ; trả về phần thân để điền nội dung. Đóng thì gọi onClose. */
const Win = {
  cur: null,
  open(title, onClose) {
    this.close(true);
    const body = el("div.win-b"), w = el("div.win", {}, [el("div.win-h", {}, [el("h2", {}, title), btn("✕", () => this.close())]), body]);
    UI.root.appendChild(w); this.cur = { w, onClose }; GAME.uiOpen = true;
    return body;
  },
  close(silent) {
    if (!this.cur) return;
    const c = this.cur; this.cur = null; c.w.remove(); GAME.uiOpen = false;
    if (!silent && c.onClose) c.onClose();
  },
};

/** icon của món đồ → dataURL (cache theo sprite) */
const _iconCache = {};
function spriteIconURL(key) {
  if (_iconCache[key]) return _iconCache[key];
  const fr = pixelFrames(key) || pixelFrames("icon_scroll"), src = fr[0];
  const c = document.createElement("canvas"), S = 32; c.width = c.height = S;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const k = Math.max(1, Math.floor(Math.min((S - 4) / src.width, (S - 4) / src.height)));
  g.drawImage(src, Math.round((S - src.width * k) / 2), Math.round((S - src.height * k) / 2), src.width * k, src.height * k);
  return (_iconCache[key] = c.toDataURL());
}
const itemSprite = it => it.slot === "weapon" ? WEAPON_SPRITE[it.wtype] : ITEM_ICON[it.slot];
function itemCell(it, opts = {}) {
  const c = el("div.cell", { onclick: opts.onclick || null, style: `border-color:${it ? RAR[it.rar].color : "#3a2e5a"}` });
  if (opts.label) c.append(el("span.lbl", {}, opts.label));
  if (!it) return c;
  c.append(el("img", { src: spriteIconURL(itemSprite(it)), alt: it.name }));
  if (it.upg.length) c.append(el("span.up", {}, "+" + it.upg.length));
  if (it.isNew) c.append(el("span.new"));
  if (it.locked) c.append(el("span.lock", {}, "🔒"));
  if (opts.sel) c.classList.add("sel");
  return c;
}

/** mô tả loại món: "Kiếm · Vũ khí vật lý", "Giáp · Hộ Vệ"... */
function itemTypeText(it) {
  if (it.slot === "weapon") return `${WEAPON_TYPES[it.wtype].name} · ${WEAPON_TYPES[it.wtype].scale === "spell" ? "ăn theo Phép Lực" : "ăn theo Sức Mạnh"}`;
  if (it.armorClass) return `${SLOT_NAMES[it.slot]} · hệ ${ARMOR_CLASS[it.armorClass].name}`;
  if (it.slot === "spell") { const S = SKILLS[it.skill]; return `Phép · ${S.scale === "phys" ? "ăn theo Sức Mạnh" : S.scale === "spell" ? "ăn theo Phép Lực" : "hỗ trợ"} · hồi ${S.cd} s`; }
  return SLOT_NAMES[it.slot];
}

/** HTML chú thích; cmp = món đang mặc cùng ô để so sánh */
function itemTooltipHTML(it, cmp = null) {
  const st = itemStats(it), R0 = RAR[it.rar];
  const cmpMap = {}; if (cmp && cmp !== it) for (const l of itemStats(cmp).lines) cmpMap[l.key] = (cmpMap[l.key] || 0) + l.v;
  const seen = new Set();
  const lineHTML = l => {
    seen.add(l.key);
    if (l.key === "skill") {                       // phép: hiện sát thương gốc (chưa nhân chỉ số nhân vật)
      const S = SKILLS[it.skill], v = S.scale === "none" ? S.base * RAR[it.rar].mult * (1 + 0.1 * it.upg.filter(u => u === "main").length) : S.base * l.v;
      let d = "";
      if (cmp && cmp !== it && cmp.skill === it.skill) { const ov = S.scale === "none" ? S.base * RAR[cmp.rar].mult : S.base * itemStats(cmp).main.v, diff = v - ov; if (Math.abs(diff) > 1e-6) d = ` <span class="${diff > 0 ? "up" : "dn"}">${diff > 0 ? "▲" : "▼"}${S.scale === "none" ? Math.round(Math.abs(diff) * 100) + "%" : Math.round(Math.abs(diff))}</span>`; }
      return `<div class="ln"><span>${S.scale === "none" ? "Sức mạnh hiệu ứng" : "Sát thương gốc"}</span><span>${S.scale === "none" ? Math.round(v * 100) + "%" : Math.round(v)}${d}</span></div><div class="muted">${S.desc}</div>`;
    }
    let d = "";
    if (cmp && cmp !== it) { const diff = l.v - (cmpMap[l.key] || 0); if (Math.abs(diff) > 1e-6) d = ` <span class="${diff > 0 ? "up" : "dn"}">${diff > 0 ? "▲" : "▼"}${fmtStat(l.key, Math.abs(diff))}</span>`; }
    const tag = l.src === "class" ? " <span class='muted'>(hệ giáp)</span>" : "";
    return `<div class="ln"><span>${STAT_NAMES[l.key] || l.key}${tag}</span><span>+${fmtStat(l.key, l.v)}${d}</span></div>`;
  };
  const main = st.lines.filter(l => l.src !== "aff").map(lineHTML).join("");
  const aff = st.lines.filter(l => l.src === "aff").map(lineHTML).join("");
  let lost = "";
  if (cmp && cmp !== it) for (const k in cmpMap) if (!seen.has(k)) lost += `<div class="ln"><span>${STAT_NAMES[k] || k}</span><span class="dn">▼${fmtStat(k, cmpMap[k])}</span></div>`;
  const sc = itemScore(it), sc2 = cmp && cmp !== it ? itemScore(cmp) : null;
  return `<div class="tip"><div class="nm" style="color:${R0.color}">${itemFullName(it)}</div>
    <div class="sub">${R0.name} · cấp ${it.ilvl} · ${itemTypeText(it)}</div><hr>${main}${aff ? "<hr>" + aff : ""}
    ${it.unique ? `<hr><div style="color:${R0.color}">★ ${uniqueDesc(it.unique)}</div>` : ""}${lost ? "<hr><div class='muted'>Mất so với đồ đang mặc:</div>" + lost : ""}
    <hr><div class="ln"><span class="muted">Nâng cấp</span><span>${it.upg.length}/${R0.slots}</span></div>
    <div class="ln"><span class="muted">Điểm đồ</span><span>${sc}${sc2 != null ? ` <span class="${sc >= sc2 ? "up" : "dn"}">(${sc >= sc2 ? "+" : ""}${sc - sc2})</span>` : ""}</span></div>
    ${cmp === it ? "<div class='good'>Đang mặc</div>" : ""}</div>`;
}

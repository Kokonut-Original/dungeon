/* 43-ui-town: cửa sổ chức năng ở thị trấn — Lò Rèn, Chợ, Giếng Thánh, Bảng Vàng, Nhân vật, Cài đặt (GDD 10.2)
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const fmtN = n => Math.round(n).toLocaleString("vi-VN");
const afterChange = () => { Save.write(); const p = GAME.world && GAME.world.player; if (p && p.save) { refreshPlayerStats(p); p.potionMax = GAME.save.potionMax; } };

/** hộp thoại ngắn của NPC */
UI.say = function (who, text, buttons = []) {
  const body = Win.open(who);
  body.append(el("p", { style: "font-size:22px;line-height:1.25" }, text), el("div.acts", {}, [...buttons, btn("Đóng", () => Win.close())]));
};

/** danh sách đồ (đang mặc trước) để chọn; onPick(it) */
function itemPicker(save, selUid, onPick, filter = () => true) {
  const eq = EQUIP_SLOTS.map(s => equippedItem(save, s)).filter(Boolean).filter(filter);
  const bag = bagItems(save).filter(filter).sort(SORTS.rar);
  const grid = el("div.grid");
  for (const it of eq) { const c = itemCell(it, { sel: it.uid === selUid, onclick: () => onPick(it), label: "✓" }); grid.append(c); }
  for (const it of bag) grid.append(itemCell(it, { sel: it.uid === selUid, onclick: () => onPick(it) }));
  return grid;
}

/* ───────── Lò Rèn (Bác Đồng): nâng cấp & rèn lại (GDD 6.9, 6.10) ───────── */
UI.openSmith = function () {
  const save = GAME.save; let tab = "up", selUid = save.equip.weapon;
  const body = Win.open("LÒ RÈN · BÁC ĐỒNG", afterChange);
  function render() {
    body.innerHTML = "";
    const sel = selUid ? itemByUid(save, selUid) : null;
    body.append(el("div.tabs", {}, [
      el("button.tab" + (tab === "up" ? ".on" : ""), { onclick: () => { tab = "up"; render(); } }, "Nâng cấp"),
      el("button.tab" + (tab === "re" ? ".on" : ""), { onclick: () => { tab = "re"; render(); } }, "Rèn lại dòng phụ"),
      el("span.muted", { style: "margin-left:auto" }, `Vàng <span class="gold">${fmtN(save.gold)}</span> · Mảnh <span style="color:#b58cff">${save.shards}</span>`)]));
    body.append(el("p.muted", {}, tab === "up" ? "\"Đồ tốt thì phải có người dùng.\" Mỗi lần nâng cấp chọn 1 dòng để tăng. Không hoàn tác được."
      : "Đổi một dòng phụ thành dòng ngẫu nhiên khác. Các lần nâng cấp đã dồn vào dòng đó sẽ mất."));
    const cols = el("div.cols");
    cols.append(el("div.col", {}, [itemPicker(save, selUid, it => { selUid = it.uid; render(); }, it => tab === "up" || it.aff.length > 0)]));
    const right = el("div.col");
    if (sel) {
      right.append(el("div", { html: itemTooltipHTML(sel) }));
      const st = itemStats(sel);
      if (tab === "up") {
        if (!canUpgrade(sel)) right.append(el("p.good", {}, "Món này đã nâng cấp tối đa."));
        else {
          const cost = upgradeCost(sel), afford = save.gold >= cost;
          right.append(el("p", { html: `Lần nâng cấp thứ ${sel.upg.length + 1}/${RAR[sel.rar].slots} · Giá <span class="${afford ? "gold" : "bad"}">${fmtN(cost)} vàng</span>` }));
          const opts = [{ key: "main", line: st.lines.find(l => l.src === "main") }].concat(sel.aff.map((a, i) => ({ key: "a" + i, line: st.lines.find(l => l.src === "aff" && l.idx === i) })));
          for (const o of opts) {
            const after = JSON.parse(JSON.stringify(sel)); after.upg.push(o.key);
            const nl = itemStats(after).lines.find(l => o.key === "main" ? l.src === "main" : l.src === "aff" && l.idx === +o.key.slice(1));
            right.append(el("div.row", {}, [el("span", {}, STAT_NAMES[o.line.key] || o.line.key),
              el("span", { html: `${fmtStat(o.line.key, o.line.v)} → <span class="good">${fmtStat(o.line.key, nl.v)}</span> ` }),
              btn("Tăng", () => { if (applyUpgrade(save, sel, o.key)) { Audio.sfx("levelup"); FX.shake(0.1); } render(); }, { disabled: !afford })]));
          }
        }
      } else {
        if (!sel.aff.length) right.append(el("p.muted", {}, "Món này không có dòng phụ."));
        else {
          const c = rerollCost(sel), afford = c.shards && save.shards >= c.shards && save.gold >= c.gold;
          right.append(el("p", { html: c.shards ? `Giá: <span style="color:#b58cff">${c.shards} mảnh</span> + <span class="gold">${fmtN(c.gold)} vàng</span>` : "<span class='muted'>Đồ Thường không rèn lại được.</span>" }));
          sel.aff.forEach((a, i) => {
            const line = st.lines.find(l => l.src === "aff" && l.idx === i);
            right.append(el("div.row", {}, [el("span", {}, STAT_NAMES[a.k]), el("span", {}, "+" + fmtStat(a.k, line.v)),
              btn("Rèn lại", () => { if (rerollAffix(save, sel, i)) { Audio.sfx("magic"); } render(); }, { disabled: !afford })]));
          });
        }
      }
    } else right.append(el("p.muted", {}, "Chọn một món để rèn."));
    cols.append(right); body.append(cols);
  }
  render();
};

/* ───────── Chợ (Xu Xu): bán, mua bình máu, mở rộng túi, quầy hằng ngày (GDD 10.1) ───────── */
const POTION_UPGRADES = [{ to: 4, cost: 500 }, { to: 5, cost: 2000 }, { to: 6, cost: 8000 }];
function dailyShop(save) {
  const today = new Date().toISOString().slice(0, 10);
  if (save.daily.date !== today || !save.daily.shop.length) {
    const seed = [...today].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0, rng = mulberry32(seed ^ save.created);
    const old = R.rng; R.rng = rng;
    const lvl = clamp(save.hero.level, 1, 60);
    save.daily = { date: today, shop: [0, 1, 2].map(() => { const it = genItem({ dungeonId: "mine", diff: "hard", ilvl: lvl, minRar: "rare", spellPool: NORMAL_SPELLS, slot: Math.random() < 0.4 ? "spell" : undefined }); it.isNew = false; return { item: it, price: sellPrice(it) * 4, sold: false }; }) };
    R.rng = old;
  }
  return save.daily.shop;
}
UI.openShop = function () {
  const save = GAME.save;
  const body = Win.open("CHỢ XU XU", afterChange);
  function render() {
    body.innerHTML = "";
    body.append(el("p", { html: `"Meo! Khách quen!" · Vàng <span class="gold">${fmtN(save.gold)}</span>` }));
    body.append(el("div.acts", {}, [btn("Bán đồ trong túi", () => UI.openInventory({ shop: true, onClose: () => UI.openShop() }))]));
    const up = POTION_UPGRADES.find(u => u.to > save.potionMax);
    const expandCost = 1000 * (save.invExpands + 1);
    body.append(el("div.card", {}, [el("h3", {}, "Hàng của tiệm"),
      el("div.row", {}, [el("span", {}, `Túi bình máu: ${save.potionMax} lượt` + (up ? ` → ${up.to}` : " (tối đa)")),
        up ? btn(`${fmtN(up.cost)} vàng`, () => { if (save.gold >= up.cost) { save.gold -= up.cost; save.potionMax = up.to; Audio.sfx("coin"); render(); } }, { disabled: save.gold < up.cost }) : el("span.good", {}, "✓")]),
      el("div.row", {}, [el("span", {}, `Mở rộng túi đồ: ${save.invCap} ô` + (save.invCap < 100 ? " → " + (save.invCap + 10) : " (tối đa)")),
        save.invCap < 100 ? btn(`${fmtN(expandCost)} vàng`, () => { if (save.gold >= expandCost) { save.gold -= expandCost; save.invCap += 10; save.invExpands++; Audio.sfx("coin"); render(); } }, { disabled: save.gold < expandCost }) : el("span.good", {}, "✓")]),
    ]));
    const shop = dailyShop(save);
    const card = el("div.card", {}, [el("h3", {}, "Quầy hôm nay"), el("p.muted", {}, "Đổi hàng mỗi ngày. Giá gấp 4 lần giá thu mua.")]);
    shop.forEach(s => {
      card.append(el("div", { html: itemTooltipHTML(s.item, equippedItem(save, slotFor(save, s.item))) }));
      card.append(el("div.acts", { style: "margin-bottom:8px" }, [s.sold ? el("span.muted", {}, "Đã bán") :
        btn(`Mua ${fmtN(s.price)} vàng`, () => {
          if (save.gold < s.price) return; if (bagFull(save)) { UI.toast("Túi đầy!", "#ff6a7a"); return; }
          save.gold -= s.price; const it = JSON.parse(JSON.stringify(s.item)); it.uid = uid("it_") + Date.now().toString(36).slice(-4); it.isNew = true;
          save.inventory.push(it); s.sold = true; Audio.sfx("coin"); render();
        }, { disabled: save.gold < s.price })]));
    });
    body.append(card);
  }
  render();
};

/* ───────── Giếng Thánh (Sư Nến): reset điểm chỉ số ───────── */
UI.openWell = function () {
  const save = GAME.save, h = save.hero, cost = 100 * h.level, spent = h.points.str + h.points.int + h.points.vit;
  UI.say("Sư Nến · Giếng Thánh", `"Giếng vẫn trong." — Rửa sạch mọi điểm chỉ số đã cộng để cộng lại từ đầu. Giá ${fmtN(cost)} vàng. (Đã cộng ${spent} điểm)`, [
    btn(`Rửa điểm (${fmtN(cost)} vàng)`, () => {
      if (save.gold < cost || !spent) return;
      save.gold -= cost; h.unspent += spent; h.points = { str: 0, int: 0, vit: 0 }; afterChange(); Audio.sfx("potion");
      Win.close(); UI.toast("Đã rửa điểm. Bấm C để cộng lại.", "#7ad0ff");
    }, { disabled: save.gold < cost || !spent })]);
};

/* ───────── Bảng Vàng (Bà Mõ): chọn hầm và độ khó (GDD 8.4) ───────── */
function diffState(save, dungeonId, dk) {
  const def = DUNGEONS[dungeonId], u = save.unlocks.dungeons[dungeonId];
  const mon = def.baseLevel + DIFFICULTIES[dk].offset, i = DIFF_ORDER.indexOf(dk);
  if (!u) return { ok: false, why: `Xong chương ${def.chapter} để mở`, mon };
  if (i <= 1) return { ok: true, mon };
  const prevDone = u.maxDiff && DIFF_ORDER.indexOf(u.maxDiff) >= i - 1;
  if (!prevDone) return { ok: false, why: `Thắng độ khó ${DIFFICULTIES[DIFF_ORDER[i - 1]].name} trước`, mon };
  if (save.hero.level < mon - 3) return { ok: false, why: `Cần cấp ${mon - 3}`, mon };
  return { ok: true, mon };
}
const LOCKED_DUNGEONS = [
  { name: "Thư Viện Ngập Nước", ch: 2 }, { name: "Chợ Đêm Dưới Đất", ch: 3 }, { name: "Doanh Trại Băng", ch: 4 }, { name: "Đáy Giếng", ch: 5 },
];
UI.openBoard = function () {
  const save = GAME.save, power = playerPower(save);
  const body = Win.open("BẢNG VÀNG · BÀ MÕ");
  body.append(el("p", { html: `"Muốn xuống dưới thì phải có đồ." · Lực Chiến của bạn: <b class="gold">${power}</b>` }));
  for (const def of Object.values(DUNGEONS)) {
    const card = el("div.card", {}, [el("h3", {}, def.name), el("p.muted", {}, `Chương ${def.chapter} · cấp gốc ${def.baseLevel} · boss: ${ENEMIES[def.boss].name}`)]);
    for (const dk of DIFF_ORDER) {
      const s = diffState(save, def.id, dk), rp = recPower(s.mon), col = power >= rp ? "good" : power >= rp * 0.75 ? "gold" : "bad";
      const won = save.unlocks.dungeons[def.id] && save.unlocks.dungeons[def.id].maxDiff && DIFF_ORDER.indexOf(save.unlocks.dungeons[def.id].maxDiff) >= DIFF_ORDER.indexOf(dk);
      card.append(el("div.row", {}, [
        el("span", { html: `<b>${DIFFICULTIES[dk].name}</b>${won ? " <span class='good'>✓</span>" : ""} <span class="muted">· quái cấp ${s.mon}</span>` }),
        el("span", { html: `Khuyên <span class="${col}">${rp}</span>` }),
        s.ok ? btn("Vào", () => { Win.close(true); SceneManager.go("dungeon", { dungeonId: def.id, diff: dk }); }) : el("span.muted", {}, "🔒 " + s.why)]));
    }
    body.append(card);
  }
  for (const d of LOCKED_DUNGEONS) body.append(el("div.card", { style: "opacity:.5" }, [el("h3", {}, d.name), el("p.muted", {}, `🔒 Mở khi xong chương ${d.ch - 1} (bản cốt truyện M5–M6)`)]));
};

/* ───────── Nhân vật: cộng điểm + bảng chỉ số (GDD 4.3, 4.4) ───────── */
UI.openStats = function () {
  const save = GAME.save, h = save.hero;
  let draft = Object.assign({}, h.points), left = h.unspent;
  const body = Win.open("NHÂN VẬT", afterChange);
  const INFO = { str: ["Sức Mạnh", "+2% sát thương vật lý (kiếm, búa, giáo, dao, cung)"], int: ["Phép Lực", "+2% sát thương phép (gậy, sách, phép kỹ năng)"], vit: ["Thể Lực", "+2% máu tối đa"] };
  function render() {
    body.innerHTML = "";
    const tmpHero = Object.assign({}, h, { points: draft }), st = computePlayerStats(tmpHero, save);
    body.append(el("div.card", {}, [el("h3", {}, `${h.name} · Cấp ${h.level}`),
      el("div", { html: `XP ${fmtN(h.xp)} / ${fmtN(xpNeed(h.level))} · Lực Chiến <b class="gold">${playerPower(save)}</b> · Điểm chưa cộng: <b class="gold">${left}</b>` })]));
    for (const k of ["str", "int", "vit"]) body.append(el("div.row", {}, [
      el("span", { html: `<b>${INFO[k][0]}</b> ${draft[k]} <span class="muted">· ${INFO[k][1]}</span>` }),
      el("span", {}, [btn("−", () => { if (draft[k] > h.points[k]) { draft[k]--; left++; render(); } }, { disabled: draft[k] <= h.points[k] }),
        btn("+", () => { if (left > 0) { draft[k]++; left--; render(); } }, { disabled: left <= 0 }),
        btn("+5", () => { const n = Math.min(5, left); draft[k] += n; left -= n; render(); }, { disabled: left <= 0 })])]));
    const changed = left !== h.unspent;
    body.append(el("div.acts", {}, [btn("Xác nhận", () => { h.points = Object.assign({}, draft); h.unspent = left; afterChange(); Audio.sfx("levelup"); render(); }, { disabled: !changed }),
      btn("Huỷ", () => { draft = Object.assign({}, h.points); left = h.unspent; render(); }, { disabled: !changed })]));
    const rows = [["Máu tối đa", fmtN(st.maxHp)], ["Sát thương vật lý", "×" + st.physMult.toFixed(2)], ["Sát thương phép", "×" + st.spellMult.toFixed(2)],
      ["Tỉ lệ chí mạng", fmtStat("critC", st.critChance)], ["Sát thương chí mạng", "×" + st.critMult.toFixed(2)], ["Tốc đánh", "×" + st.atkSpeed.toFixed(2)],
      ["Tốc chạy", Math.round(st.moveSpeed) + " px/s"], ["Giảm sát thương nhận", fmtStat("dr", 1 - st.dmgTaken)], ["Hút máu", fmtStat("life", st.lifesteal)],
      ["Sát thương lên boss", fmtStat("boss", st.bossDmg)], ["Sát thương lên tinh anh", fmtStat("elite", st.eliteDmg)], ["Hồi máu mỗi giây", fmtStat("regen", st.regen)],
      ["Hồi lăn", st.dodgeCd.toFixed(2) + " s"], ["Vàng nhặt thêm", fmtStat("gold", st.goldFind)], ["Tìm đồ hiếm", fmtStat("find", st.find)],
      ["Phản đòn", fmtStat("thorns", st.thorns)], ["Hiệu quả bình máu", "+" + fmtStat("potion", st.potionEff)], ["Tỉ lệ gây Bỏng", fmtStat("burnC", st.burnC)],
      ["Vũ khí", st.weapon ? `${WEAPON_TYPES[st.weapon.wtype].name} · ${fmtN(st.weapon.dmg)} sát thương gốc` : "Tay không"]];
    body.append(el("div.card", {}, [el("h3", {}, "Chỉ số chi tiết"), ...rows.map(([a, b]) => el("div.row", {}, [el("span.muted", {}, a), el("span", {}, b)]))]));
    const s = save.stats;
    body.append(el("p.muted", {}, `Đã chơi ${s.runs} lượt · thắng ${s.wins} · hạ ${fmtN(s.kills)} quái · nhặt ${s.itemsFound} món đồ`));
  }
  render();
};

/* ───────── Cài đặt (GDD 10.2 mục 11) ───────── */
UI.openSettings = function (onBack) {
  const save = GAME.save, set = save ? save.settings : GAME.settings;
  const body = Win.open("CÀI ĐẶT", () => { Object.assign(GAME.settings, set); if (save) Save.write(); onBack && onBack(); });
  const slider = (label, key, min, max, step, onChange) => {
    const v = el("span", {}, String(set[key])), inp = el("input", { type: "range", min, max, step, value: set[key] });
    inp.oninput = () => { set[key] = +inp.value; v.textContent = inp.value; onChange && onChange(+inp.value); Object.assign(GAME.settings, set); };
    return el("div.row", {}, [el("span", {}, label), el("span", {}, [inp, " ", v])]);
  };
  const toggle = (label, key) => el("div.row", {}, [el("span", {}, label), btn(set[key] ? "Bật" : "Tắt", function () { set[key] = !set[key]; Object.assign(GAME.settings, set); UI.openSettings(onBack); })]);
  body.append(slider("Âm lượng nhạc", "music", 0, 1, 0.1, v => Audio.setVolume("music", v)),
    slider("Âm lượng hiệu ứng", "sfx", 0, 1, 0.1, v => Audio.setVolume("sfx", v)),
    slider("Độ rung màn hình (0 = tắt)", "shakeAmp", 0, 6, 1),
    toggle("Hiện số sát thương", "numbers"), toggle("Tự nhắm (máy tính)", "autoAim"),
    el("div.row", {}, [el("span", {}, "Chất lượng hiệu ứng"), btn(set.fxQuality === "low" ? "Thấp" : "Cao", () => { set.fxQuality = set.fxQuality === "low" ? "high" : "low"; FX.quality = set.fxQuality; UI.openSettings(onBack); })]));
  if (save) {
    const ta = el("textarea.txt", { placeholder: "Dán chuỗi save vào đây để nhập" });
    body.append(el("div.card", {}, [el("h3", {}, "Chuyển save giữa máy tính và điện thoại"),
      el("div.acts", {}, [btn("Xuất save", () => { ta.value = Save.exportStr(); ta.select(); try { navigator.clipboard.writeText(ta.value); UI.toast("Đã chép chuỗi save", "#5cf28a"); } catch (e) {} }),
        btn("Nhập save", () => { try { Save.importStr(ta.value); Win.close(true); SceneManager.go("town", {}); UI.toast("Đã nhập save", "#5cf28a"); } catch (e) { UI.toast("Chuỗi save không hợp lệ", "#ff6a7a"); } })]), ta]));
    let armed = 0;
    const del = btn("Xoá toàn bộ dữ liệu", () => {
      armed++; if (armed === 1) { del.textContent = "Bấm lần nữa để XOÁ VĨNH VIỄN"; return; }
      Save.wipe(); Win.close(true); SceneManager.go("title", {});
    });
    body.append(el("div.acts", {}, [del]));
  }
  body.append(el("p.muted", { style: "margin-top:8px" }, WATERMARK));
};

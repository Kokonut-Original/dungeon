/* 42-ui-inventory: túi đồ — 7 ô trang bị, lưới túi, chú thích + so sánh, trang bị/tháo, khoá, giải phóng, bán (GDD 10.2 mục 4) */
const EQUIP_LABELS = { weapon: "Vũ khí", spell1: "Q", spell2: "E", helm: "Mũ", chest: "Giáp", boots: "Giày", relic: "Di vật" };
const SORTS = {
  rar: (a, b) => RAR_ORDER.indexOf(b.rar) - RAR_ORDER.indexOf(a.rar) || b.ilvl - a.ilvl,
  lvl: (a, b) => b.ilvl - a.ilvl || RAR_ORDER.indexOf(b.rar) - RAR_ORDER.indexOf(a.rar),
  slot: (a, b) => a.slot.localeCompare(b.slot) || RAR_ORDER.indexOf(b.rar) - RAR_ORDER.indexOf(a.rar),
};

/** opts: {inRun: chỉ xem, shop: có nút Bán, onClose} */
UI.openInventory = function (opts = {}) {
  const save = GAME.save; if (!save) return;
  const wasPaused = GAME.paused; GAME.paused = true;
  let selUid = null, sort = UI._invSort || "rar";
  const body = Win.open(opts.shop ? "CHỢ XU XU · BÁN ĐỒ" : "TÚI ĐỒ", () => { GAME.paused = wasPaused; Save.write(); syncPlayer(); opts.onClose && opts.onClose(); });

  function syncPlayer() { const p = GAME.world && GAME.world.player; if (p && p.save) { refreshPlayerStats(p); p.potionMax = save.potionMax; } }

  function render() {
    body.innerHTML = "";
    const sel = selUid ? itemByUid(save, selUid) : null;
    // cột trái: trang bị
    const eq = el("div.eq");
    for (const s of EQUIP_SLOTS) { const it = equippedItem(save, s); eq.append(itemCell(it, { label: EQUIP_LABELS[s], sel: it && it.uid === selUid, onclick: () => { if (it) { selUid = it.uid; render(); } } })); }
    const st = computePlayerStats(save.hero, save);
    const left = el("div.col", {}, [
      el("div.card", {}, [el("h3", {}, `${save.hero.name} · Cấp ${save.hero.level}`),
        el("div", { html: `Lực Chiến <b class="gold">${playerPower(save)}</b> · Máu <b>${st.maxHp}</b><br>
          Vàng <span class="gold">${save.gold.toLocaleString("vi-VN")}</span> · Mảnh Ký Ức <span style="color:#b58cff">${save.shards}</span>` })]),
      eq,
    ]);
    // cột phải: túi
    const bag = bagItems(save).sort(SORTS[sort]);
    const grid = el("div.grid");
    for (const it of bag) grid.append(itemCell(it, { sel: it.uid === selUid, onclick: () => { selUid = it.uid; it.isNew = false; render(); } }));
    for (let i = bag.length; i < save.invCap; i++) grid.append(el("div.cell", { style: "opacity:.35" }));
    const right = el("div.col", { style: "flex:2" }, [
      el("div.tabs", {}, [el("span.muted", { style: "margin-right:6px" }, `Túi ${bag.length}/${save.invCap} · Xếp theo:`),
        ...Object.entries({ rar: "Độ hiếm", lvl: "Cấp", slot: "Loại" }).map(([k, n]) => el("button.tab" + (sort === k ? ".on" : ""), { onclick: () => { sort = UI._invSort = k; render(); } }, n))]),
      grid,
      el("div.acts", {}, opts.inRun ? [] : [
        btn("Giải phóng hết đồ Thường", () => massSalvage("common"), { disabled: !bag.some(i => i.rar === "common" && !i.locked) }),
        btn("Giải phóng hết đồ Hiếm", () => massSalvage("rare"), { disabled: !bag.some(i => i.rar === "rare" && !i.locked) }),
        opts.shop ? btn("Bán hết đồ Thường", () => massSell("common"), { disabled: !bag.some(i => i.rar === "common" && !i.locked) }) : null].filter(Boolean)),
    ]);
    body.append(el("div.cols", {}, [left, right]));
    // chi tiết món đang chọn
    if (sel) {
      const equippedSlot = EQUIP_SLOTS.find(s => save.equip[s] === sel.uid);
      const cmp = equippedSlot ? sel : equippedItem(save, slotFor(save, sel));
      const acts = el("div.acts");
      if (opts.inRun) acts.append(el("span.muted", {}, "Trong hầm chỉ xem được đồ; về thị trấn để thay đồ."));
      else {
        if (equippedSlot) acts.append(btn("Tháo ra", () => { if (!unequip(save, equippedSlot)) UI.toast("Túi đầy!", "#ff6a7a"); render(); }));
        else if (sel.slot === "spell") { acts.append(btn("Trang bị vào Q", () => { equipItem(save, sel, "spell1"); render(); })); acts.append(btn("Trang bị vào E", () => { equipItem(save, sel, "spell2"); render(); })); }
        else acts.append(btn("Trang bị", () => { equipItem(save, sel); Audio.sfx("pickup"); render(); }));
        acts.append(btn(sel.locked ? "Mở khoá" : "Khoá", () => { sel.locked = !sel.locked; render(); }));
        if (!equippedSlot && !sel.locked) {
          acts.append(btn(`Giải phóng (+${RAR[sel.rar].shards} mảnh)`, () => confirmIf(RAR_ORDER.indexOf(sel.rar) >= 2, `Giải phóng ${sel.name}?`, () => { salvage(sel); render(); })));
          if (opts.shop) acts.append(btn(`Bán (+${sellPrice(sel)} vàng)`, () => confirmIf(RAR_ORDER.indexOf(sel.rar) >= 2, `Bán ${sel.name}?`, () => { save.gold += sellPrice(sel); removeItem(save, sel); selUid = null; Audio.sfx("coin"); render(); })));
        }
      }
      body.append(el("div", { style: "margin-top:10px" }, [el("div", { html: itemTooltipHTML(sel, cmp) }), acts]));
    } else body.append(el("div.muted", { style: "margin-top:10px" }, "Chạm vào một món để xem chi tiết và so sánh với đồ đang mặc."));
    syncPlayer();
  }
  function salvage(it) { save.shards += RAR[it.rar].shards; removeItem(save, it); selUid = null; Audio.sfx("pickup"); }
  function massSalvage(rar) {
    const list = bagItems(save).filter(i => i.rar === rar && !i.locked);
    confirmIf(true, `Giải phóng ${list.length} món ${RAR[rar].name}? Nhận ${list.length * RAR[rar].shards} Mảnh Ký Ức.`, () => { list.forEach(salvage); render(); });
  }
  function massSell(rar) {
    const list = bagItems(save).filter(i => i.rar === rar && !i.locked), g = list.reduce((s, i) => s + sellPrice(i), 0);
    confirmIf(true, `Bán ${list.length} món ${RAR[rar].name} được ${g} vàng?`, () => { list.forEach(i => removeItem(save, i)); save.gold += g; Audio.sfx("coin"); render(); });
  }
  /** hỏi xác nhận bằng hộp nhỏ ngay trong cửa sổ */
  function confirmIf(need, text, fn) {
    if (!need) return fn();
    const box = el("div.card", { style: "position:sticky;bottom:0;border-color:#ffd23d" }, [el("div", {}, text),
      el("div.acts", {}, [btn("Đồng ý", () => { box.remove(); fn(); }), btn("Thôi", () => box.remove())])]);
    body.append(box); box.scrollIntoView({ block: "end" });
  }
  render();
};

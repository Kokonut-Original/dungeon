/* 51-run: điều khiển một lượt chơi trong hầm — phòng khóa cửa, đợt quái, boss, rơi đồ, rương, chết, tổng kết.
   Mini Dungeon Slayer · Tran Duc Long - tranduclong.id.vn */
const END_CHEST_ITEMS = { easy: 1, normal: 2, hard: 2, insane: 3, nightmare: 4 };

const Run = {
  /** bắt đầu lượt: {dungeonId, diff, seed, hero} → tạo GAME.run và GAME.world */
  start(o) {
    const def = DUNGEONS[o.dungeonId], diff = DIFFICULTIES[o.diff || "normal"];
    const seed = o.seed || Math.floor(Math.random() * 1e9), rng = mulberry32(seed);
    const world = generateFloor(def, rng);
    world.theme = def.theme;
    GAME.world = world;
    const run = GAME.run = { mode: o.mode || "farm", def, dungeonId: def.id, diff, diffKey: diff.key, seed,
      loot: [], gold: 0, xp: 0, kills: 0, time: 0, revivesLeft: diff.revives, room: null, boss: null,
      level: def.baseLevel + diff.offset, done: false, result: null, interact: null, magnetT: 0 };
    world.player = createPlayer(o.hero, world.startPos.x, world.startPos.y, o.save || null);
    run.effects = Effects.registerRun(world.player);
    // vật thể đặt sẵn: rương ở phòng rương, giếng ở phòng sự kiện
    for (const r of world.rooms) {
      if (r.type === "chest" && r.marks.chest) world.props.push(this.makeProp("chest", r.marks.chest.x, r.marks.chest.y, r, { tier: "room" }));
      if (r.type === "event" && r.marks.npc) world.props.push(this.makeProp("fountain", r.marks.npc.x, r.marks.npc.y, r));
    }
    this.enterRoom(world.rooms[0]);
    UI.showBanner(def.name.toUpperCase(), `Độ khó: ${diff.name} · Cấp quái ${run.level}`, 2.2);
    return run;
  },

  makeProp(kind, x, y, room, extra = {}) { return Object.assign({ id: uid("pr"), kind, x, y, r: 7, room, used: false, t: 0 }, extra); },
  roomLevel(r) { return GAME.run.level + Math.floor(Math.max(0, r.main) / 3); },

  enterRoom(r) {
    const run = GAME.run, world = GAME.world;
    run.room = r; r.visited = r.known = true;
    for (const i of r.links) world.rooms[i].known = true;
    Events.emit("roomEnter", { room: r });
    if (r.cleared) return;
    setDoors(world, r, true); Audio.sfx("door_close"); FX.shake(0.2);
    if (r.type === "combat") {
      const lay = run.def.layout;
      r.waveTotal = randInt(lay.waves[0], lay.waves[1]); r.wave = 0; r.waveCd = 0.3;
      r.budget = CONFIG.ROOM_BUDGET_BASE + CONFIG.ROOM_BUDGET_STEP * Math.max(0, r.main);
    } else if (r.type === "miniboss" || r.type === "boss") {
      const id = r.type === "boss" ? run.def.boss : run.def.miniboss, d = ENEMIES[id];
      const pos = r.marks.boss || { x: (r.x + r.w / 2) * T, y: (r.y + r.h / 2) * T };
      const b = createEnemy(id, this.roomLevel(r), { x: pos.x, y: pos.y, diff: run.diff, room: r });
      b.aiT = -0.8;                                     // vòng xuất hiện lâu hơn
      GAME.world.enemies.push(b); run.boss = b;
      UI.showBanner(d.name.toUpperCase(), d.title || "", 2);
      Audio.sfx("boss_roar"); FX.shake(0.5);
    }
  },

  /** sinh một đợt quái trong phòng (GDD 8.4) */
  spawnWave(r) {
    const run = GAME.run, world = GAME.world, p = world.player;
    r.wave++;
    let budget = r.wave === r.waveTotal ? r.budget : Math.ceil(r.budget / 2);
    r.budget -= budget;
    const spots = r.marks.spawns.slice();
    while (budget > 0) {
      const opts = run.def.enemyPool.filter(o => ENEMIES[o.id].cost <= budget); if (!opts.length) break;
      const o = weighted(opts); budget -= ENEMIES[o.id].cost;
      let pos = null;
      if (spots.length && Math.random() < 0.6) { const s = spots.splice(randInt(0, spots.length - 1), 1)[0]; if (dist2(s.x, s.y, p.x, p.y) > 48 * 48) pos = s; }
      if (!pos) pos = randomFloorPos(world, p.x, p.y, 48, r);
      world.enemies.push(createEnemy(o.id, this.roomLevel(r), { x: pos.x + rand(-3, 3), y: pos.y + rand(-3, 3), diff: run.diff, room: r, elite: Math.random() < run.diff.elite }));
    }
    Audio.sfx("spawn");
  },

  clearRoom(r) {
    const run = GAME.run, world = GAME.world;
    r.cleared = true; setDoors(world, r, false); Events.emit("roomClear", { room: r });
    Audio.sfx("room_clear"); Audio.sfx("door_open");
    run.magnetT = 1.5;
    if (r.type === "combat") { UI.toast("Dọn sạch phòng!", "#5cf28a"); if (Math.random() < 0.2) world.props.push(this.makeProp("chest", (r.x + r.w / 2) * T, (r.y + r.h / 2) * T, r, { tier: "small" })); }
  },

  updateRoomLogic(dt) {
    const run = GAME.run, world = GAME.world, p = world.player;
    run.time += dt; if (run.magnetT > 0) run.magnetT -= dt;
    const r = roomAt(world, p.x, p.y, 2);
    if (r && r !== run.room && !p.dead) this.enterRoom(r);
    const cur = run.room;
    if (cur && cur.locked) {
      const alive = world.enemies.filter(e => !e.dead && e.room === cur);
      if (cur.type === "combat") {
        cur.waveCd -= dt;
        if (cur.wave < cur.waveTotal && alive.length <= (cur.wave === 0 ? 0 : 1) && cur.waveCd <= 0) { this.spawnWave(cur); cur.waveCd = 1.0; }
        else if (cur.wave >= cur.waveTotal && alive.length === 0) this.clearRoom(cur);
      } else if (!run.boss || run.boss.dead) {
        for (const e of alive) { e.hp = 0; kill(e, null); }        // dọn quái triệu hồi còn sót
        this.clearRoom(cur);
      }
    }
    // tương tác gần nhất (rương, giếng, đồ, lối ra)
    run.interact = null; let bd = 22 * 22;
    for (const pr of world.props) { if (pr.used && pr.kind !== "exit") continue; const d = dist2(pr.x, pr.y, p.x, p.y); if (d < bd) { bd = d; run.interact = pr; } }
    for (const k of world.pickups) { if (k.dead || k.pkind !== "item" || k.t < 0.4) continue; const d = dist2(k.x, k.y, p.x, p.y); if (d < bd) { bd = d; run.interact = k; } }
    for (const pr of world.props) pr.t += dt;
  },

  interactLabel(o) {
    if (!o) return "";
    if (o.kind === "pickup") return `Nhặt: ${o.item.name}`;
    return { chest: "Mở rương", fountain: "Uống nước giếng", exit: "Rời hầm" }[o.kind] || "";
  },

  /** người chơi bấm tương tác */
  doInteract() {
    const run = GAME.run, world = GAME.world, p = world.player, o = run.interact; if (!o) return;
    if (o.kind === "pickup") {
      o.dead = true; run.loot.push(o.item); Audio.sfx("pickup");
      UI.toast(`+ ${o.item.name} (${RAR[o.item.rar].name})`, RAR[o.item.rar].color);
      FX.particles(o.x, o.y, { n: 10, color: RAR[o.item.rar].color, speed: 60, life: 0.4 });
      return;
    }
    if (o.kind === "chest") {
      o.used = true; Audio.sfx("chest_open"); FX.shake(0.2);
      const n = o.tier === "end" ? END_CHEST_ITEMS[run.diffKey] : 1, lvl = this.roomLevel(o.room);
      let best = 0;
      for (let i = 0; i < n; i++) {
        const minRar = o.tier === "end" ? (DIFF_ORDER.indexOf(run.diffKey) >= 2 ? "epic" : "rare") : null;
        const it = genItem({ dungeonId: run.dungeonId, diff: run.diffKey, ilvl: lvl + randInt(-1, 1), minRar, mode: run.mode, find: p.stats.find });
        dropItem(world, it, o.x + rand(-6, 6), o.y + 6); best = Math.max(best, RAR_ORDER.indexOf(it.rar));
      }
      const g = goldDrop(lvl, run.diff, o.tier === "end" ? 30 : o.tier === "room" ? 8 : 4, p.stats.goldFind);
      for (let i = 0; i < 6; i++) world.pickups.push(createPickup({ kind: "gold", x: o.x, y: o.y, value: Math.ceil(g / 6), vx: rand(-80, 80), vy: rand(-80, 80) }));
      o.beam = { color: RAR[RAR_ORDER[best]].color, t: 0 };
      FX.flashLight(o.x, o.y, 90 + best * 25, 1.5, RAR[RAR_ORDER[best]].color);
      if (o.tier === "end") world.props.push(this.makeProp("exit", o.x, o.y + 40, o.room));
      return;
    }
    if (o.kind === "fountain") {
      o.used = true; const heal = Math.round(p.maxHp * 0.5); p.hp = Math.min(p.maxHp, p.hp + heal);
      p.potions = Math.min(p.potionMax, p.potions + 1); FX.number(p.x, p.y - 20, heal, "heal"); Audio.sfx("potion");
      FX.particles(o.x, o.y - 8, { n: 20, color: "#7ad0ff", speed: 60, life: 0.7, gravity: -40 });
      UI.toast("Hồi 50% máu, +1 bình máu", "#7ad0ff");
      return;
    }
    if (o.kind === "exit") this.finish("win");
  },

  /** quái chết: vàng, XP, đồ, quả cầu máu (GDD 6.8) */
  onEnemyKilled(e, src) {
    const run = GAME.run, world = GAME.world, diff = run.diff, pst = world.player.stats;
    run.kills++;
    const mult = e.isBoss ? 50 : e.miniboss ? 20 : e.elite ? 4 : 1;
    const g = goldDrop(e.level, diff, mult, pst.goldFind), coins = Math.min(12, 2 + Math.floor(mult / 2));
    for (let i = 0; i < coins; i++) world.pickups.push(createPickup({ kind: "gold", x: e.x, y: e.y, value: Math.max(1, Math.round(g / coins)), vx: rand(-80, 80), vy: rand(-80, 80) }));
    const xpMult = e.isBoss ? 30 : e.miniboss ? 12 : e.elite ? 3 : 1;
    this.addXp(Math.round(CONFIG.XP_BASE * Math.pow(e.level, CONFIG.XP_EXP) * diff.xp * xpMult));
    if (Math.random() < CONFIG.ORB_DROP) world.pickups.push(createPickup({ kind: "orb", x: e.x, y: e.y, vx: rand(-40, 40), vy: rand(-40, 40) }));
    let item = null; const base = { dungeonId: run.dungeonId, diff: run.diffKey, ilvl: e.level + randInt(-1, 1), find: pst.find };
    if (e.isBoss) item = genItem(Object.assign(base, { minRar: DIFF_ORDER.indexOf(run.diffKey) >= 2 ? "epic" : "rare" }));
    else if (e.miniboss) item = genItem(Object.assign(base, { minRar: "rare" }));
    else if (Math.random() < (e.elite ? CONFIG.ELITE_ITEM_DROP : CONFIG.ITEM_DROP)) item = genItem(Object.assign(base, { bonusTier: e.elite ? 1 : 0 }));
    if (item) dropItem(world, item, e.x, e.y);
    if (e.isBoss || e.miniboss) {
      run.boss = null; GAME.slowmo = 0.3; FX.shake(0.9); FX.flashScreen("rgba(255,255,255,.4)", 0.3);
      setTimeout(() => { GAME.slowmo = 1; }, 700);
      if (e.isBoss) {
        UI.showBanner("CHIẾN THẮNG!", e.def.name + " đã gục ngã", 2.4);
        world.props.push(this.makeProp("chest", (e.room.x + e.room.w / 2) * T, (e.room.y + e.room.h / 2) * T, e.room, { tier: "end", big: true }));
      }
    }
  },

  addXp(n) {
    const run = GAME.run, p = GAME.world.player, h = p.hero;
    run.xp += n;
    if (addXpTo(h, n) > 0) {
      refreshPlayerStats(p); p.hp = p.maxHp;
      UI.showBanner("LÊN CẤP " + h.level, `+${CONFIG.POINTS_PER_LEVEL} điểm chỉ số · cộng điểm ở thị trấn`, 1.6); Audio.sfx("levelup");
      FX.particles(p.x, p.y - 10, { n: 30, color: "#ffd23d", speed: 90, life: 0.8, gravity: -50 });
    }
  },

  /** người chơi hết máu */
  onPlayerDeath() {
    const run = GAME.run;
    if (run.revivesLeft > 0) {
      GAME.paused = true;
      UI.panel({ title: "ĐỨNG DẬY?", text: `Còn ${run.revivesLeft} lần hồi sinh tại chỗ trong lượt này.`, buttons: [
        { label: "Đứng dậy", onClick: () => { UI.closePanel(); this.revive(); } },
        { label: "Bỏ cuộc", onClick: () => { UI.closePanel(); this.finish("dead"); } }] });
    } else setTimeout(() => this.finish("dead"), 900);
  },
  revive() {
    const run = GAME.run, world = GAME.world, p = world.player;
    run.revivesLeft--; p.dead = false; p.hp = Math.round(p.maxHp * 0.5); p.iframes = 2;
    for (const e of world.enemies) if (!e.dead && dist(e, p) < 60) { const [kx, ky] = normalize(e.x - p.x, e.y - p.y); e.knockX += kx * 400; e.knockY += ky * 400; }
    FX.ring(p.x, p.y, 60, "#ffd23d", 0.5); FX.particles(p.x, p.y, { n: 30, color: "#ffd23d", speed: 120, life: 0.6 }); Audio.sfx("levelup");
    GAME.paused = false; DungeonScene.over = false;
  },

  /** kết thúc lượt: thắng (đi lối ra) hoặc chết/bỏ cuộc; áp hình phạt theo độ khó (GDD 8.6) */
  finish(result) {
    const run = GAME.run, world = GAME.world;
    if (run.done) return; run.done = true; run.result = result; Effects.clear();
    // thắng: tự gom đồ còn trên sàn
    if (result === "win") for (const k of world.pickups) if (!k.dead && k.pkind === "item") { k.dead = true; run.loot.push(k.item); }
    let lostGold = 0, lostItems = 0;
    if (result !== "win") {
      lostGold = Math.round(run.gold * DEATH_GOLD_LOSS[run.diffKey]); run.gold -= lostGold;
      if (["insane", "nightmare"].includes(run.diffKey)) { lostItems = run.loot.length; run.loot = []; }
    }
    GAME.paused = true;
    // ghi vào save: vàng, đồ, thống kê, mở khoá độ khó (GDD 8.4)
    let bagInfo = null;
    const save = GAME.save;
    if (save) {
      save.gold += run.gold; bagInfo = addLoot(save, run.loot);
      save.stats.runs++; save.stats.kills += run.kills; if (result === "win") save.stats.wins++; else save.stats.deaths++;
      if (result !== "win" && run.diffKey === "nightmare") { const extra = Math.round(save.gold * 0.05); save.gold -= extra; lostGold += extra; }
      if (result === "win") {
        const u = save.unlocks.dungeons[run.dungeonId] || (save.unlocks.dungeons[run.dungeonId] = { story: true, maxDiff: null });
        if (!u.maxDiff || DIFF_ORDER.indexOf(run.diffKey) > DIFF_ORDER.indexOf(u.maxDiff)) u.maxDiff = run.diffKey;
      }
      Save.write();
    }
    const mm = Math.floor(run.time / 60), ss = String(Math.floor(run.time % 60)).padStart(2, "0");
    const items = run.loot.slice().sort((a, b) => RAR_ORDER.indexOf(b.rar) - RAR_ORDER.indexOf(a.rar))
      .map(it => `<div style="color:${RAR[it.rar].color}">${it.name} <small>· ${RAR[it.rar].name} · cấp ${it.ilvl}</small></div>`).join("") || "<div style='opacity:.6'>(không có đồ)</div>";
    UI.panel({ title: result === "win" ? "HOÀN THÀNH" : "THẤT BẠI",
      text: `${run.def.name} · ${run.diff.name}<br>Thời gian ${mm}:${ss} · Hạ ${run.kills} quái · +${run.xp} XP · +${run.gold} vàng`
        + (lostGold ? `<br><span style="color:#ff7a8a">Mất ${lostGold} vàng${lostItems ? ` và ${lostItems} món đồ` : ""}</span>` : "")
        + `<div style="max-height:180px;overflow:auto;margin-top:10px;text-align:left">${items}</div>`
        + (bagInfo && bagInfo.sold ? `<br><span style="color:#ffd23d">Túi đầy: tự bán ${bagInfo.sold} món được ${bagInfo.goldFromSold} vàng</span>` : ""),
      buttons: save ? [{ label: "Về thị trấn", onClick: () => { UI.closePanel(); SceneManager.go("town", {}); } },
        { label: "Đi tiếp lượt mới", onClick: () => { UI.closePanel(); SceneManager.go("dungeon", { dungeonId: run.dungeonId, diff: run.diffKey }); } }]
        : [{ label: "Lượt mới", onClick: () => { UI.closePanel(); SceneManager.go("dungeon", { dungeonId: run.dungeonId, diff: run.diffKey }); } }] });
  },
};

/* 54-scene-dungeon: scene trong hầm. Mặc định chạy một lượt Farm (Run); params.test = phòng thử M1. */
const TEST_WEAPONS = ["sword", "heavy", "spear", "dagger", "bow", "staff", "tome"];
const TEST_POOL = [{ id: "mine_goblin", w: 5 }, { id: "mine_skel", w: 3 }, { id: "mine_spark", w: 2 }, { id: "lib_ink", w: 3 }, { id: "mine_mud", w: 2 }, { id: "mine_slug", w: 2 }];

const DungeonScene = {
  world: null, test: false, wave: 0, waveDelay: 0, hint: "", hintT: 0, hudInfo: "", ambient: 0.55, over: false,

  enter(params = {}) {
    this.test = !!params.test || !GAME.save; this.over = false; GAME.paused = false;
    if (this.test) {
      GAME.run = null;
      const hero = { name: "Thử", look: GAME.save ? GAME.save.hero.look : "knight", level: GAME.save ? GAME.save.hero.level : 1, xp: 0, points: { str: 0, int: 0, vit: 0 } };
      const w = this.world = buildWorldFromRoom("test_arena");
      GAME.world = w; GAME.runGold = 0; w.theme = DUNGEONS.mine.theme;
      w.player = createPlayer(hero, w.pw / 2, w.ph / 2 + 40);
      w.player.weapon.wtype = GAME.lastWeapon || "sword";
      w.player.testSpells = GAME.testSpells || (GAME.testSpells = ["fireball", "whirlwind"]);
      w.player.testEffects = GAME.testEffects || [];
      Effects.registerRun(w.player);
      this.wave = 0; this.waveDelay = 1.2; this.ambient = 0.55;
      UI.showBanner("PHÒNG THỬ", "Đổi vũ khí bằng phím 1–7");
    } else {
      const run = Run.start({ dungeonId: params.dungeonId || "mine", diff: params.diff || "normal", seed: params.seed, hero: GAME.save.hero, save: GAME.save });
      this.world = GAME.world; this.ambient = run.def.ambientDark;
    }
    const p = this.world.player;
    this.hint = Input.isTouch ? ["Joystick trái để đi · ⚔ đánh / tương tác", "» lăn · ♥ bình máu" + (this.test ? " · ⇄ đổi vũ khí" : "")]
      : ["WASD đi · Chuột ngắm · Giữ chuột trái để đánh · Q/E phép · F tương tác", "Space lăn · R bình máu · " + (this.test ? "1–7 vũ khí · 8/9 đổi phép Q/E · 0 đổi hiệu ứng Huyền Thoại" : "Tab túi đồ · Esc tạm dừng")];
    this.hintT = 8;
    GAME.view.camX = p.x - GAME.view.w / 2; GAME.view.camY = p.y - GAME.view.h / 2;
  },
  exit() {},

  /** quái gần nhất trong tầm, có đường nhìn (cho tự nhắm) */
  autoTarget() {
    const w = this.world, p = w.player; if (!p) return null;
    let best = null, bd = CONFIG.AUTOAIM_RANGE ** 2;
    for (const e of w.enemies) {
      if (e.dead || e.aiState === "spawn") continue;
      const d = dist2(e.x, e.y, p.x, p.y) * (e.isBoss ? 0.5 : e.elite ? 0.6 : 1);
      if (d < bd && lineOfSight(w, p.x, p.y - 4, e.x, e.y - 4)) { bd = d; best = e; }
    }
    return best;
  },

  /* phòng thử: quái ra theo đợt vô tận */
  testWave() {
    const w = this.world, p = w.player; this.wave++;
    let budget = 3 + this.wave * 2;
    const spots = w.spawns.slice();
    while (budget > 0) {
      const opts = TEST_POOL.filter(o => ENEMIES[o.id].cost <= budget); if (!opts.length) break;
      const o = weighted(opts); budget -= ENEMIES[o.id].cost;
      let pos = spots.length && Math.random() < 0.5 ? spots.splice(randInt(0, spots.length - 1), 1)[0] : randomFloorPos(w, p.x, p.y, 56);
      if (dist2(pos.x, pos.y, p.x, p.y) < 48 * 48) pos = randomFloorPos(w, p.x, p.y, 56);
      const elite = this.wave >= 3 && Math.random() < 0.08 + this.wave * 0.01;
      w.enemies.push(createEnemy(o.id, 1 + Math.floor(this.wave / 2), { x: pos.x + rand(-4, 4), y: pos.y + rand(-4, 4), elite }));
    }
    Audio.sfx("spawn"); UI.toast(`Đợt ${this.wave}`, "#ffe9a8");
  },

  update(dt) {
    const w = this.world, p = w.player, v = GAME.view, run = GAME.run;
    if (this.test) {
      for (let i = 0; i < TEST_WEAPONS.length; i++) if (Input.pressed["Digit" + (i + 1)]) this.setWeapon(TEST_WEAPONS[i]);
      if (Input.touchHeld.weaponP) this.setWeapon(TEST_WEAPONS[(TEST_WEAPONS.indexOf(p.weapon.wtype) + 1) % TEST_WEAPONS.length]);
    }
    if (Input.state.pausePressed && !GAME.paused && !this.over) this.pauseMenu();
    if (Input.state.invPressed && !this.over && GAME.save && !this.test) UI.openInventory({ inRun: true });
    if (this.test) {   // phòng thử: phím 8/9 đổi phép Q/E, phím 0 đổi hiệu ứng Huyền Thoại để thử
      const all = Object.keys(SKILLS), ts = p.testSpells;
      if (Input.pressed.Digit8) { ts[0] = all[(all.indexOf(ts[0]) + 1) % all.length]; UI.toast("Q: " + SKILLS[ts[0]].name, SKILLS[ts[0]].color); }
      if (Input.pressed.Digit9) { ts[1] = all[(all.indexOf(ts[1]) + 1) % all.length]; UI.toast("E: " + SKILLS[ts[1]].name, SKILLS[ts[1]].color); }
      if (Input.pressed.Digit0) {
        const effs = Object.keys(EFFECT_IMPL), cur = p.testEffects[0], nx = effs[(effs.indexOf(cur) + 1) % effs.length];
        p.testEffects = GAME.testEffects = [nx]; Effects.registerRun(p);
        UI.toast("Hiệu ứng: " + ((UNIQUES[nx] || MYTHICS[nx] || {}).name || nx) + " — " + uniqueDesc(nx), "#ffb13b");
      }
    }

    // tương tác: trên điện thoại nút ⚔ thành nút tương tác khi đứng gần rương/đồ
    if (run && run.interact) {
      if (Input.isTouch) { Input.state.attack = false; if (Input.touchHeld.attackP) Run.doInteract(); }
      else if (Input.state.interactPressed) Run.doInteract();
    }

    Player.update(w, p, dt);
    Status.update(w, p, dt);
    AI.updateAll(w, dt);
    Projectiles.update(w, dt);
    Hazards.update(w, dt);
    updateSpikes(w, dt);
    const alive = w.enemies.filter(e => !e.dead);
    Pickups.update(w, dt, run ? run.magnetT > 0 : alive.length === 0);
    w.enemies = alive; w.projs = w.projs.filter(e => !e.dead); w.hazards = w.hazards.filter(e => !e.dead); w.pickups = w.pickups.filter(e => !e.dead);

    if (run) {
      Run.updateRoomLogic(dt);
      const r = run.room;
      this.hudInfo = r && r.locked ? (r.type === "combat" ? `Đợt ${r.wave}/${r.waveTotal} · còn ${alive.filter(e => e.room === r).length} quái` : "") : "";
    } else {
      if (!this.over && alive.length === 0) {
        if (this.waveDelay <= 0 && this.wave > 0) { Audio.sfx("room_clear"); UI.toast("Dọn sạch!", "#5cf28a"); }
        this.waveDelay -= dt;
        if (this.waveDelay <= -1.4 || this.wave === 0 && this.waveDelay <= 0) { this.waveDelay = 0.0001; this.testWave(); }
      } else this.waveDelay = 0;
      this.hudInfo = this.wave ? `Đợt ${this.wave} · còn ${alive.length} quái` : "";
    }
    if (this.hintT > 0) this.hintT -= dt;

    // chết
    if (!this.over && p.hp <= 0 && p.cheatDeath && p.cheatDeath()) { /* Trái Tim Vực: hồi sinh */ }
    if (!this.over && p.hp <= 0) {
      this.over = true; p.dead = true; FX.deathBurst(p); FX.shake(0.8); Audio.sfx("death");
      if (run) Run.onPlayerDeath();
      else setTimeout(() => UI.panel({ title: "BẠN ĐÃ NGÃ", text: `Trụ được tới đợt ${this.wave}`,
        buttons: [{ label: "Chơi lại", onClick: () => { UI.closePanel(); SceneManager.go("dungeon", { test: true }); } },
          { label: "Vào hầm Mỏ", onClick: () => { UI.closePanel(); SceneManager.go("dungeon", {}); } }] }), 900);
    }

    // camera: bám người chơi, lệch về hướng ngắm, kẹp trong bản đồ
    const s = Input.state, tx = p.x + s.aimX * CONFIG.CAM_LEAD - v.w / 2, ty = p.y - 8 + s.aimY * CONFIG.CAM_LEAD - v.h / 2;
    v.camX = lerp(v.camX, tx, CONFIG.CAM_LERP); v.camY = lerp(v.camY, ty, CONFIG.CAM_LERP);
    v.camX = w.pw <= v.w ? (w.pw - v.w) / 2 : clamp(v.camX, 0, w.pw - v.w);
    v.camY = w.ph <= v.h ? (w.ph - v.h) / 2 : clamp(v.camY, 0, w.ph - v.h);
  },

  /** menu tạm dừng: tiếp tục / cài đặt / rời hầm (áp hình phạt như khi chết) */
  pauseMenu() {
    GAME.paused = true;
    const run = GAME.run;
    const btns = [{ label: "Tiếp tục", onClick: () => { UI.closePanel(); GAME.paused = false; } },
      { label: "Cài đặt", onClick: () => UI.openSettings(() => this.pauseMenu()) }];
    if (run) btns.push({ label: "Rời hầm", onClick: () => {
      const loss = Math.round(DEATH_GOLD_LOSS[run.diffKey] * 100);
      UI.panel({ title: "RỜI HẦM?", text: `Rời hầm tính như thua: mất ${loss}% vàng nhặt trong lượt${["insane", "nightmare"].includes(run.diffKey) ? " và toàn bộ đồ nhặt được" : ""}.`,
        buttons: [{ label: "Rời hầm", onClick: () => { UI.closePanel(); Run.finish("quit"); } }, { label: "Ở lại", onClick: () => this.pauseMenu() }] });
    } });
    else btns.push({ label: "Về thị trấn", onClick: () => { UI.closePanel(); SceneManager.go(GAME.save ? "town" : "dungeon", {}); } });
    UI.panel({ title: "TẠM DỪNG", buttons: btns });
  },

  setWeapon(k) { const p = this.world.player; p.weapon.wtype = k; p.combo = 0; GAME.lastWeapon = k; UI.toast("Vũ khí: " + WEAPON_TYPES[k].name, "#c9bde8"); Audio.sfx("ui_click"); },

  render(ctx) {
    const v = GAME.view, [sx, sy] = FX.shakeOffset();
    Render.world(ctx, this.world, Math.round(v.camX + sx), Math.round(v.camY + sy), this.ambient);
  },
};

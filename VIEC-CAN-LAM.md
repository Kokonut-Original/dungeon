# Việc cần làm — thẻ việc M5 → M8

Mỗi **thẻ việc** là một phần nhỏ, làm xong chạy được ngay. Tài liệu đi kèm: [MINI-DUNGEON-SLAYER-GDD.md](MINI-DUNGEON-SLAYER-GDD.md) (thiết kế), [TIEN-DO.md](TIEN-DO.md) (hiện trạng và quy ước).

Tran Duc Long - tranduclong.id.vn

## Luật chung cho mọi thẻ (đọc trước khi làm)

1. **Mỗi lần chỉ làm 1 thẻ.** Chỉ sửa những file ghi trong thẻ. Cần sửa file khác thì ghi rõ lý do trong báo cáo.
2. **Không viết lại cả file đang chạy tốt.** Chỉ thêm, hoặc sửa đúng đoạn cần sửa. Không đổi tên hàm hay biến đang có.
3. Script thường, **không `import/export`, không `fetch`**. Thêm file JS mới thì thêm thẻ `<script>` vào `index.html` **đúng thứ tự số** trong tên file.
4. Chữ hiển thị bằng tiếng Việt, tên biến bằng tiếng Anh, chú thích ngắn bằng tiếng Việt. Giữ watermark có sẵn.
5. **Save cũ phải chạy được.** Trường mới của save thêm vào `Save.fresh()` (`js/20-save.js`); `Save.migrate` tự điền trường thiếu cho save cũ.
6. Làm xong mỗi thẻ thì:
   - `node --check` từng file đã sửa.
   - Mở game qua `python -m http.server 8765`, vào `http://localhost:8765/?debug=1`, thấy console không có lỗi đỏ.
   - Làm đúng các bước ở mục **Nghiệm thu** của thẻ.
   - `git commit` (message tiếng Việt, kết thúc bằng dòng `Tran Duc Long - tranduclong.id.vn`, không thêm dòng tên ai khác).
7. Thẻ nào nghiệm thu không đạt thì **không làm thẻ tiếp theo.**

### Bản đồ code hiện có (để móc vào)
| Cần gì | Dùng cái có sẵn |
|---|---|
| Cửa sổ DOM | `Win.open(title, onClose) → body`, `Win.close()`, `el(sel, props, kids)`, `btn(label, fn, {disabled})` (`js/41-ui-dom.js`) |
| Thông báo | `UI.toast(text, color)`, `UI.showBanner(text, sub, dur)`, `UI.say(who, text, buttons)` (`js/40-ui-hud.js`, `js/43-ui-town.js`) |
| Dừng game | `GAME.paused = true/false`; khi có cửa sổ mở thì `GAME.uiOpen = true` |
| Save | `GAME.save`, `Save.write()`, `Save.fresh(name, look)` |
| Lượt chơi | `GAME.run` (xem `Run.start` trong `js/51-run.js`); `Run.enterRoom(r)`, `Run.updateRoomLogic(dt)`, `Run.onEnemyKilled(e)`, `Run.finish(result)` |
| Phòng | `GAME.world.rooms[]`: `{type: "start"\|"combat"\|"chest"\|"event"\|"miniboss"\|"boss", marks: {chest, npc, boss, spawns}, cleared, locked}` |
| Boss | `GAME.run.boss` (thực thể), `e.hp / e.maxHp`, `e.bs.phase`, `BOSS_IMPL`, `BOSS_ATTACKS` (`js/28-bosses.js`) |
| Sự kiện | `Events.on(name, fn, owner)`, `Events.emit(name, ctx)`; đang có: `hit`, `kill`, `hurt`, `dodge`, `attack`, `castSkill`, `skillHit`, `roomEnter`, `roomClear`, `pickupGold` |
| Sinh đồ | `genItem({dungeonId, diff, ilvl, rarity?, slot?, unique?, minRar?, find?})` (`js/22-loot.js`) |
| Thả đồ ra sàn | `dropItem(world, item, x, y)` |
| Vật thể trong hầm | `Run.makeProp(kind, x, y, room, extra)`, đẩy vào `GAME.world.props`; tương tác viết trong `Run.doInteract` |
| Sprite | thêm vào `PIXEL_SPRITES` (`js/02c-pixel-sprites.js`); NPC áo choàng: `robe({h, R, r, G, ...})`; đổi màu: `paletteVariant(key, pal)` |
| NPC thị trấn | `TOWN_PLACES` (`js/53-scene-town.js`): `{id, x, y, name, npc, who, role, open}` |

---

## M5 · Hội thoại, Chương 1, Chủ Cũ, Ám

### T5.1 · Trường save mới
- **File:** `js/20-save.js`
- **Làm:** thêm vào `Save.fresh()` (sau `stats`):
```js
story: { chapter: 0, done: [], flags: {}, ending: null },   // chapter 0 = chưa xem mở đầu
storyItems: [],          // id đồ cốt truyện, ví dụ "story_khaBadge"
lore: {},                // { ownerId: { count: 0, frags: 0, returned: false } }
am: 0,                   // chỉ số Ám 0–100 (ẩn)
sparedCount: 0,          // số Kẻ Ở Lại đã tha
```
- **Save cũ** (tạo trước M5): trong `Save.migrate`, **trước** khi điền trường thiếu, nếu `s.story === undefined` thì sau khi điền đặt `s.story.done = ["prologue"]`, `s.story.chapter = 1`, `s.story.legacy = true`. Người chơi cũ không phải xem lại mở đầu, và hầm Mỏ ở chế độ Farm vẫn giữ mở (xem T5.5).
- **Nghiệm thu:**
  - Tạo nhân vật mới: `GAME.save.story.chapter === 0`.
  - Nạp một save cũ: không lỗi, `story.chapter === 1`, `am === 0`.

### T5.2 · Khung hội thoại
- **File mới:** `js/44-ui-dialog.js` (thêm `<script>` sau `43-ui-town.js`)
- **Làm:** object `Dialog`:
```js
Dialog.say(who, text)            // → Promise, resolve khi người chơi bấm qua câu
Dialog.choice(text, options, who) // options: ["Lựa chọn A", "Lựa chọn B"] → Promise<index>
Dialog.isOpen()                   // → bool
```
- **Giao diện** (DOM trong `UI.root`):
  - Khung đáy màn hình rộng 90%, nền tối, viền tím như `.win`.
  - Bên trái là chân dung: lấy `spriteIconURL(sprite + "_idle_anim")` phóng to, `image-rendering: pixelated`.
  - Tên người nói màu theo `CHARACTERS[who].color`. `who === "narrator"` thì không có chân dung, chữ in nghiêng.
  - Chữ chạy 40 ký tự/giây. Bấm (chuột, chạm, phím F, Space hoặc Enter) khi chữ đang chạy thì hiện hết; bấm lần nữa thì sang câu tiếp.
  - Lựa chọn: danh sách nút, đi bằng phím ↑/↓ hoặc W/S, chọn bằng Enter/F, hoặc chạm trực tiếp.
  - Chuỗi `{name}` được thay bằng `GAME.save.hero.name`.
- Khi hội thoại mở: `GAME.paused = true`; khi đóng thì trả lại trạng thái cũ.
- **Nghiệm thu:** trong console chạy `await Dialog.say("mo","Xin chào {name}"); await Dialog.choice("Chọn?", ["A","B"], "mo")` → hiện đúng, chọn được, trả về index; game dừng trong lúc hội thoại.

### T5.3 · Bộ chạy kịch bản
- **File mới:** `js/50-story.js` (sau `44-ui-dialog.js`)
- **Làm:** `Story.run(scriptId) → Promise`, chạy mảng lệnh `STORY[scriptId]` theo GDD mục 11.2.
- **Lệnh bắt buộc:**
  - Thoại: `say`, `choice` (mỗi option có `label`, tùy chọn `set`, `add`, `goto`, `cond`)
  - Luồng: `label`, `goto`, `if {cond, then, else}`
  - Trạng thái: `setFlag`, `addAm {n}`
  - Đồ: `give {item}` (id đồ cốt truyện → `save.storyItems`; id `u_...` → `genItem({unique})` vào túi), `take {item}`
  - Hình, tiếng: `fade {to}` (lớp đen DOM, 0.4 s), `shake`, `sfx`, `wait {t}`
  - Mở khóa, phần thưởng: `unlock {what: "chapter"|"farm", id}`, `xp {n}`, `gold {n}`
  - Kết thúc: `end` (dừng kịch bản), `ending {id}` (để M6)
- **`Story.evalCond(str)`:** KHÔNG dùng `eval` hay `new Function`. Viết bộ phân tích nhỏ chỉ chấp nhận:
  - Biến: `flags.x`, `am`, `level`, `sparedCount`
  - Hàm: `hasItem('id')`
  - Số và `true`/`false`
  - Phép: `&& || ! < > <= >= == !=` và ngoặc `( )`
  - Chuỗi không hợp lệ → trả `false` và `console.warn`.
- `add: { am: 1 }` trong option thì cộng vào `save.am` (kẹp 0–100). `set: {k: v}` thì ghi vào `save.story.flags`.
- Sau mỗi lệnh làm thay đổi save thì `Save.write()`.
- **Nghiệm thu:** tạo kịch bản thử `STORY._test` có đủ các lệnh, `Story.run("_test")` chạy hết không lỗi; `evalCond("am < 50 && !flags.a")` trả đúng.

### T5.4 · Nhân vật & dữ liệu cốt truyện
- **File mới:** `js/18-data-story.js` (sau `17-data-lore.js` ở T5.8; nếu chưa có 17 thì đặt sau `15-data-dungeons.js`)
- **Làm:**
```js
const CHARACTERS = {
  narrator: { name: "",          sprite: null,        color: "#c9bde8" },
  mo:       { name: "Bà Mõ",     sprite: "npc_mo",    color: "#ff9aa8" },
  dong:     { name: "Bác Đồng",  sprite: "npc_smith", color: "#ffb35c" },
  xuxu:     { name: "Xu Xu",     sprite: "npc_cat",   color: "#ffd23d" },
  muc:      { name: "Cô Mực",    sprite: "npc_muc",   color: "#9ad0ff" },
  nen:      { name: "Sư Nến",    sprite: "npc_nen",   color: "#ffb13b" },
  lang:     { name: "Ông Lặng",  sprite: "npc_lang",  color: "#c8c8d0" },
  ti:       { name: "Bé Tí",     sprite: "npc_ti",    color: "#ffd0e0" },
  hoa:      { name: "Hòa",       sprite: "hoa",       color: "#7af0ff" },
  foreman:  { name: "Quản Đốc",  sprite: "ogre",      color: "#ffb3a0" },
};
const STORY = {};          // kịch bản: STORY.prologue, STORY.ch1_enter, ...
const STORY_HOOKS = {};    // STORY_HOOKS.ch1 = { onEnterDungeon, onEventRoom, onMinibossLow, onBossIntro, onBossPhase: {1: id}, onBossDead, onExit }
const STORY_ITEMS = {
  story_letter:     { name: "Lá Thư Của Kha",   desc: "\"Một tầng nữa thôi.\"" },
  story_minerBadge: { name: "Phù Hiệu Thợ Mỏ",  desc: "Khâu tên: Tuấn." },
  story_lantern:    { name: "Đèn Lồng Vỡ",      desc: "Bấc còn một nửa." },
  story_khaBadge:   { name: "Huy Hiệu Của Kha", desc: "KHA — HẠNG 214" },
};
```
- **Sprite Bé Tí:** thêm `npc_ti` vào `js/02c-pixel-sprites.js` bằng `robe({ h: "#3a2a20", R: "#ff8fc7", r: "#c85a9a", G: "#ffffff" })`, kèm dòng `Object.assign(PIXEL_SPRITES, { npc_ti: ... })` đặt sau phần NPC.
- **Thoại:** chép **nguyên văn** từ GDD 11.3 (mở đầu) và 11.4 (Chương 1) thành các kịch bản. Tên gợi ý:
  - `prologue`
  - `ch1_enter`, `ch1_event` (bộ xương thợ mỏ)
  - `ch1_hoa_intro`, `ch1_hoa_low`
  - `ch1_boss_intro`, `ch1_boss_p2`, `ch1_boss_dead`
  - `ch1_outro` (về thị trấn: Bà Mõ + Cô Mực)
- **Mẫu một kịch bản:**
```js
STORY.ch1_hoa_low = [
  { cmd: "say", who: "hoa", text: "Tôi chỉ... muốn tìm cái đèn của tôi. Không có nó tôi không thấy đường về." },
  { cmd: "choice", who: "hoa", text: "Hòa run rẩy nhìn bạn.", options: [
    { label: "Trả Đèn Lồng Vỡ", cond: "hasItem('story_lantern')", goto: "spare" },
    { label: "Kết liễu", goto: "kill" },
    { label: "Bỏ đi", cond: "!hasItem('story_lantern')", goto: "leave" } ] },
  { cmd: "label", id: "spare" }, { cmd: "say", who: "hoa", text: "Nó vỡ rồi... nhưng vẫn là của tôi. Cảm ơn." },
  { cmd: "take", item: "story_lantern" }, { cmd: "setFlag", key: "sparedHoa", value: true }, { cmd: "addAm", n: -3 },
  { cmd: "bossResult", result: "spare", drop: "u_hoaLantern" }, { cmd: "end" },
  { cmd: "label", id: "kill" }, { cmd: "say", who: "hoa", text: "...Tối quá." },
  { cmd: "setFlag", key: "killedHoa", value: true }, { cmd: "addAm", n: 10 }, { cmd: "bossResult", result: "kill" }, { cmd: "end" },
  { cmd: "label", id: "leave" }, { cmd: "say", who: "hoa", text: "Đi đi. Đừng để như tôi." },
  { cmd: "bossResult", result: "leave" }, { cmd: "end" },
];
```
  Option có `cond` sai thì **ẩn**, không hiện. Lệnh `bossResult` cài ở T5.7.
- **Nghiệm thu:** `Story.run("prologue")` chạy hết thoại mở đầu, không lỗi chính tả trong tên key.

### T5.5 · Mở đầu khi tạo nhân vật mới
- **File:** `js/53-scene-town.js`, `js/43-ui-town.js`
- **Làm:**
  - Vào thị trấn mà `save.story.chapter === 0` thì chạy `Story.run("prologue")`. Kịch bản kết thúc bằng `setFlag prologueDone`, `unlock {what:"chapter", id:1}` (→ `story.chapter = 1`, `story.done.push("prologue")`).
  - Trong lúc chạy mở đầu: hiện mũi tên chỉ Lò Rèn. Nói chuyện với Bác Đồng lần đầu thì chạy đoạn tặng vũ khí (GDD 11.3). Đồ khởi đầu đã có sẵn trong save, chỉ cần thoại.
  - **Bảng Vàng:** thêm thẻ "Cốt truyện" ở đầu cửa sổ:
    - Hiện nút **"Chương N: tên chương"** nếu `story.chapter >= N` và `"ch"+N` chưa có trong `story.done`.
    - Bấm thì `SceneManager.go("dungeon", { dungeonId: "mine", diff: "normal", mode: "story", chapter: 1 })`.
  - **Mở Farm:** với nhân vật mới, Mỏ ở chế độ Farm chỉ mở sau khi `story.done` có `"ch1"`. Kiểm tra trong `diffState()`: nếu `save.story.done` không có `"ch" + def.chapter` và đây không phải save cũ (`save.story.legacy` không có) thì khoá với lý do "Xong Chương N để mở". Ở T5.1, save cũ được gán `story.legacy = true`.
- **Nghiệm thu:**
  - Nhân vật mới: mở đầu chạy, xong thì Bảng Vàng có nút "Chương 1", Farm Mỏ đang khoá.
  - Save cũ: Farm vẫn mở.

### T5.6 · Chế độ Cốt truyện trong hầm
- **File:** `js/51-run.js`, `js/54-scene-dungeon.js`
- **Làm:**
  - `Run.start({..., mode: "story", chapter})`: lưu `run.mode = "story"`, `run.hooks = STORY_HOOKS["ch" + chapter]`. Ở chế độ này **không có đợt quái vô tận**; dùng đúng layout của hầm. Chết thì không mất gì (giống độ khó Dễ) và được hồi sinh không giới hạn tại chỗ.
  - **Móc kịch bản** (gọi `Story.run(id)`, kịch bản chạy thì game dừng):
    - Sau khi vào hầm → `hooks.onEnterDungeon`.
    - `Run.enterRoom` của phòng `event` lần đầu → `hooks.onEventRoom`. Ở chương 1, phòng sự kiện đặt thêm một vật thể `kind: "story"` (bộ xương) tại `marks.npc`; bấm F vào nó → chạy kịch bản, nhặt `story_minerBadge`.
      - **Lưu ý:** tầng có thể sinh ra không có phòng `event`. Ở chế độ story phải ép ít nhất 1 phòng `event`, bằng cách sau `generateFloor` đổi một phòng `combat` giữa đường chính thành `event`.
    - Phòng `chest` ở chương 1 có thêm đồ cốt truyện `story_lantern` (pickup kind `"story"`, nhặt bằng F, vào `save.storyItems`).
    - Phòng mini boss: khi Hòa xuất hiện → `hooks.onMinibossIntro`.
    - Phòng boss: lúc vào → `onBossIntro`; boss sang pha 2 → `onBossPhase[1]` (móc trong `Bosses.update` lúc đổi pha: `if (GAME.run.hooks) ...`); boss chết → `onBossDead`.
    - Rương cuối ở chế độ story có thêm `story_khaBadge`.
    - Rời hầm thắng: `Run.finish("win")` → về thị trấn → chạy `hooks.onExit` (kịch bản `ch1_outro`) → cuối kịch bản `unlock chapter 2` + `story.done.push("ch1")` + `xp` thưởng (GDD 6.8: nửa XP cần để lên cấp hiện tại).
  - **Chữ hiển thị:** bảng tổng kết hiện "Chương 1 · Người Vẫn Còn Đào" thay cho tên độ khó.
- **Nghiệm thu:** chơi chương 1 từ Bảng Vàng tới boss: các đoạn thoại hiện đúng lúc, nhặt được 3 đồ cốt truyện, về thị trấn có đoạn kết, `story.done` có `"ch1"`, Farm Mỏ mở.

### T5.7 · Tha / giết mini boss (Kẻ Ở Lại)
- **File:** `js/51-run.js`, `js/50-story.js`
- **Làm:**
  - Trong `Run.updateRoomLogic`: nếu `run.mode === "story"`, `run.boss` là mini boss, máu ≤ 30% và chưa hỏi → đặt `boss.invuln = 99`, dọn đạn quái và vùng nguy hiểm, chạy `hooks.onMinibossLow`.
  - Lệnh kịch bản `bossResult {result, drop?}`:
    - `"spare"`: mini boss tan thành đom đóm (hạt `#7af0ff`), bị xoá khỏi `world.enemies` **không** gọi `kill()` (để không tính giết); `save.sparedCount++`; `drop` thì `dropItem(world, genItem({ dungeonId, unique: drop, rarity: "legendary", ilvl }), x, y)`.
    - `"kill"`: gọi `kill(boss, player)` như bình thường; Ám đã cộng trong kịch bản.
    - `"leave"`: mini boss biến mất, rơi 1 món tối thiểu Hiếm.
    - Mọi kết quả đều mở cửa phòng (`Run.clearRoom`).
  - Ở chế độ Farm/Vực: mini boss không có thoại, tên hiện thêm "(Tiếng Vọng)".
- **Nghiệm thu:** chơi 2 lần chương 1: một lần có nhặt Đèn Lồng Vỡ rồi tha (nhận Đèn Lồng Của Hòa, `flags.sparedHoa`), một lần không có đèn và chọn giết (`am` tăng 10).

### T5.8 · Chủ Cũ trên đồ
- **File mới:** `js/17-data-lore.js` (sau `15-data-dungeons.js`). **Sửa:** `js/22-loot.js`, `js/41-ui-dom.js`, `js/51-run.js`, `js/42-ui-inventory.js`
- **Làm:**
  - `OWNERS`: chép đủ **12 Chủ Cũ** từ GDD 12.2 theo mẫu:
```js
OWNERS.tuan = { name: "Tuấn", title: "thợ mỏ", dungeons: ["mine"], weight: 10,
  memories: ["Còn ba xe quặng nữa là đủ tiền.", "Con gái thích đá lấp lánh.", "Ca đêm lạnh hơn ca ngày."],
  frags: ["Tuấn xuống mỏ vì nhà hết gạo.", "...", "...", "...", "..."],
  set2: { gold: 0.10 }, set3: { hpPct: 0.08 } };
```
    `dungeons` dùng id hầm: `mine` (D1), `library` (D2), `market` (D3), `camp` (D4), `well` (D5). Thỏ (`tho`) có `weight: 2` và ở mọi hầm; Người Đứng Đầu (`nguoi_dau`) có `weight: 1`.
  - `genItem`: nếu không phải đồ khởi đầu (`o.mode !== "starter"`) và không có `owner` từ đồ độc nhất → chọn Chủ Cũ theo trọng số trong số có `dungeons` chứa `o.dungeonId`; gán `it.owner = id`, `it.memory = randInt(0, 2)`. Đồ bán ở Chợ (`dailyShop`) **không** có chủ cũ.
  - `itemTooltipHTML`: thêm dòng `Chủ cũ: <tên>, <title>` và dòng ký ức in nghiêng.
  - **Đếm:** nhặt đồ trong hầm (`Run.doInteract` → pickup) hoặc giải phóng đồ (túi đồ) → `loreCount(save, ownerId)`:
```js
function loreCount(save, id) {            // đặt trong 17-data-lore.js
  const L = save.lore[id] || (save.lore[id] = { count: 0, frags: 0, returned: false });
  L.count++;
  const need = [1, 3, 6, 10, 15];
  while (L.frags < 5 && L.count >= need[L.frags]) { L.frags++; UI.toast("Ký ức mới: " + OWNERS[id].name, "#b58cff"); }
}
```
  - **Bonus bộ:** trong `gearTotals` (`js/21-stats.js`) đếm số món đang mặc theo `owner`; ≥2 thì cộng `set2`, ≥3 thì cộng thêm `set3` (các khoá giống dòng phụ: `gold`, `hpPct`, `cdr`...). Bonus không phải số (ví dụ "lăn hồi 1% máu") để dạng `set3: { effect: "lore_tho3" }` và cài ở M8; bây giờ chỉ hiện mô tả.
- **Nghiệm thu:** đồ mới rơi có Chủ Cũ trong chú thích; nhặt 3 món của cùng một người thì mở mảnh 2; mặc 2 món của Tuấn thì bảng chỉ số tăng vàng nhặt 10%.

### T5.9 · Thư Viện: Sổ Ký Ức
- **File:** `js/43-ui-town.js`, `js/53-scene-town.js`
- **Làm:**
  - Thay thoại "sắp mở" của Cô Mực bằng `UI.openLibrary()`, đổi `role` thành "Sổ Ký Ức · Trả đồ".
  - Cửa sổ liệt kê các Chủ Cũ **đã gặp** (`save.lore` có): tên, title, số món đã gặp, 5 mảnh (mảnh đã mở hiện chữ, chưa mở hiện "???" kèm số món cần), bonus bộ 2/3 món.
  - Nút **"Trả lại 1 món"**: hiện khi `frags === 5` và `!returned`. Chọn một món của người đó trong túi (không phải đồ đang mặc) → xoá món đó, `returned = true`, `am -= 2`, hiện dòng "<tên> được nhớ tên".
  - Chủ Cũ chưa gặp hiện "???" (đếm tổng số, ví dụ "Đã gặp 3/12").
- **Nghiệm thu:** dùng DEBUG nhận đồ, nhặt đủ 15 món của Tuấn → đủ 5 mảnh → trả lại được 1 lần.

### T5.10 · Ám
- **File:** `js/21-stats.js`, `js/32-render.js`, `js/42-ui-inventory.js`, `js/43-ui-town.js`, `js/53-scene-town.js`
- **Làm:**
  - **Sát thương:** trong `playerDmgMult` (`js/25-combat.js`) cộng `save.am * CONFIG.AM_DMG_PER_POINT` (0.3% mỗi điểm, tối đa 30%).
  - **Ngoại hình:** trong `Render.drawPlayer`, nếu Ám ≥ 50 thì vẽ thêm viền tím (vẽ sprite với `tint: "#5a2a8a"` lệch ±1px phía sau); nếu Ám ≥ 75 thì thêm 2 điểm đỏ ở chỗ mắt.
  - **Túi đồ:** hiện biểu tượng giọt mực 4 mức (0–24, 25–49, 50–74, 75–100) cạnh tên nhân vật, chú thích "Bạn thấy mình nặng hơn." **Không hiện con số.**
  - **Thoại NPC theo Ám** (GDD 11.10): khi nói chuyện với Bé Tí, Xu Xu, Sư Nến thì trước khi mở cửa sổ chức năng hiện 1 câu theo mức Ám (dùng `UI.toast` hoặc `Dialog.say`). Thêm Bé Tí vào thị trấn: `TOWN_PLACES` có thể thêm NPC đứng gần giếng, `role: "Hay hỏi chuyện"`, `open` = nói câu theo mức Ám.
  - Ám ≥ 75: Chợ tăng giá mua ×1.2; Bé Tí bỏ chạy khi lại gần (đổi vị trí ra xa người chơi).
  - **Giếng Thánh:** thêm nút "Rửa Ám" (−5, giá `300 * G(level)` vàng, mỗi lần về thị trấn dùng 1 lần: lưu `save.wellUsedRun = save.stats.runs`).
- **Nghiệm thu:** đặt `GAME.save.am = 80` trong console → nhân vật có viền tím và mắt đỏ, biểu tượng giọt mực mức 4, Bé Tí bỏ chạy, giá Chợ tăng; Rửa Ám giảm còn 75.

### T5.11 · Hoàn tất M5
- Chơi trọn **nhân vật mới → mở đầu → Chương 1 → về thị trấn** hai lần (tha và giết).
- Sửa `TIEN-DO.md`: M5 ✅, ghi những chỗ khác với GDD (nếu có), việc tiếp theo là M6.
- Commit.

---

## M6 · 4 hầm còn lại + Chương 2–5 + 4 kết thúc

Làm **từng hầm một**, mỗi hầm là một nhóm thẻ. Thứ tự: Thư Viện (`library`) → Chợ Đêm (`market`) → Doanh Trại (`camp`) → Đáy Giếng (`well`).

### T6.x.1 · Dữ liệu hầm
- `js/15-data-dungeons.js`: thêm `DUNGEONS.<id>`, chép cấu trúc từ `DUNGEONS.mine`:
  - `chapter`, `baseLevel` (11 / 22 / 34 / 46), `ambientDark`
  - `theme`: màu nền, tường; chọn theo không khí hầm
  - `enemyPool`, `miniboss`, `boss`
  - `rooms`: tối thiểu 4 phòng `combat` mới + 1 phòng `boss` mới; dùng chung `any_start`, `any_chest`, `any_event`, `any_mb`
  - `loot.weapons`, `loot.material`, `loot.spells`: lấy từ GDD 6.5
- `js/14-data-rooms.js`: vẽ phòng mới. **Luật:** kích thước lẻ; 3 ô giữa mỗi cạnh (ngay trong tường) để trống; không đặt `T` ở giữa cạnh. Sau khi vẽ, chạy lại bài kiểm tra sinh 500 tầng (mục "Kiểm tra sinh tầng" bên dưới).

### T6.x.2 · Quái của hầm
- `js/13-data-enemies.js`: 5 quái theo GDD 7.3 của hầm đó. Hành vi (`ai`) dùng loại có sẵn nếu được: `chaser`, `shooter`, `lobber`, `bomber`. Loại **chưa có** cần viết thêm vào `AI_BEHAVIORS` (`js/27-ai.js`):
  - `splitter`, `summoner` (D2)
  - `thief`, `stealth`, `mimic` (D3)
  - `shielder`, `pack`, `nova` (D4)
  - `eater`, `leaper`, `laser` (D5)
  Mô tả từng loại ở GDD 7.2.
- `js/02c-pixel-sprites.js`: vẽ sprite mới cho từng quái theo phong cách hiện có (12–14 cột, viền tự sinh, có `legs` hoặc `bounce`). Vẽ xong thì xuất ảnh xem trước để soát (ví dụ viết một script Node đọc `pixelGrid()` rồi ghi ra PNG).

### T6.x.3 · Mini boss và boss
- `ENEMIES`: thêm mini boss và boss với `ai: "boss"`, `boss: "<key>"`, `hpK` 12/40, `dmgK` 1.4/1.6.
- `js/28-bosses.js`: thêm `BOSS_IMPL.<key>.phases` + các đòn mới vào `BOSS_ATTACKS`, theo GDD 7.5:
  - Thủ Thư Chìm: Nước Dâng, Sổ Tên
  - Ông Chủ Cân: 2 đĩa cân + lựa chọn Giao Kèo bằng `Dialog.choice`
  - Kha: bắt chước người chơi + thoại thuyết phục
  - Vua Farm: 3 pha, pha 3 là Trái Tim
- **Luật công bằng:** mọi đòn mạnh đều có vùng báo đỏ (`createHazard` với `delay`), không đòn nào gây quá 35% máu tối đa ở độ khó Thường.

### T6.x.4 · Cốt truyện chương
- `js/18-data-story.js`: chép thoại chương từ GDD 11.5 / 11.6 / 11.7 / 11.8 thành kịch bản và `STORY_HOOKS.chN`; thêm `STORY_ITEMS` mới (Trang Thư Ướt, Cuộn Chỉ Đỏ, Huy Hiệu Gác Cổng, Tấm Bảng Hạng Hai...).
- Chương 2 kết thúc: `unlock {what: "abyss"}` (`save.unlocks.abyss = true`) để M7 dùng.
- Chương 4 (Kha): thoại thuyết phục giữa trận theo GDD 11.7; cờ `sparedKha` / `killedKha`.
- Chương 5: chọn kết thúc theo GDD 11.8 (kiểm tra điều kiện theo thứ tự); lệnh `ending {id}` → màn hình chữ "HẾT", danh sách người làm, `save.story.ending = id`.

### T6.x.5 · Đồ độc nhất của hầm
- `UNIQUES` đã có sẵn đồ cho `library`, `market`, `camp`, `well` (`js/12-data-skills.js`). Chỉ cần thêm `DUNGEONS` thì chúng tự rơi. Kiểm tra hiệu ứng trong `js/29-effects.js` có chạy đúng không.

### Kiểm tra sinh tầng (dùng sau mỗi lần vẽ phòng mới)
Viết một script Node nạp `00-config.js`, `01-util.js`, `14-data-rooms.js`, `15-data-dungeons.js`, `23-world.js` vào `vm`. Script phải:
- Sinh 500 tầng cho mỗi hầm bằng `generateFloor(DUNGEONS.x, mulberry32(seed))`.
- Từ `startPos`, loang tìm đường (BFS) qua các ô đi được.
- Báo lỗi nếu có phòng không tới được, điểm `s`/`*`/`B`/`N` nằm ở ô không tới được, hoặc tầng không có đúng 1 phòng boss và 1 phòng mini boss.

---

## M7 · Vực Không Đáy (GDD mục 9)

| Thẻ | Nội dung | File |
|---|---|---|
| T7.1 | Dữ liệu `PACTS` (12 Giao Kèo), `FLOOR_MODS` (7 biến thể), `ABYSS_CONFIG` | `js/16-data-abyss.js` (mới) |
| T7.2 | Sinh tầng Vực: `generateFloor(def, rng, { mainRooms: 4..6, endType: "stairs" hoặc "boss" })`. Phòng cuối không phải boss thì là cầu thang: vật thể `kind: "stairs"`, bấm F thì sang tầng tiếp. Pool quái trộn theo hầm chủ đạo của tầng. Màu tối hơn 15%. | `js/52-abyss.js` (mới), `js/23-world.js` (đã hỗ trợ `endType`) |
| T7.3 | Độ khó theo tầng: `monsterLevel(f)`, `mult(f)`, `eliteRate(f)` theo GDD 9.2; `G()` nhận số thực | `js/52-abyss.js`, `js/51-run.js` |
| T7.4 | Sau mỗi boss (tầng chia hết cho 5): cửa sổ chọn 1 trong 3 Giao Kèo (luôn có ít nhất 1 Giao Kèo không Đen); hiệu lực tới hết lượt (cộng vào chỉ số qua `p.dmgMods` hoặc chỉ số nhân vật) | `js/52-abyss.js`, `js/45-ui-menus.js` (mới) |
| T7.5 | Trạm (tầng 10, 20, 30...): "Mang đồ lên" hoặc "Đi tiếp" (hệ số thưởng); mở khoá điểm xuất phát `save.abyss.stations` | `js/52-abyss.js` |
| T7.6 | Mộ: chết thì `save.abyss.grave = { floor, items, gold, best }`; tới đúng tầng đó thì Mộ xuất hiện ở phòng chiến đấu đầu, nhặt bằng F; chết lần nữa trước khi nhặt thì ghi đè | `js/52-abyss.js`, `js/51-run.js` |
| T7.7 | Biến thể tầng (cứ 3 tầng), boss xoay vòng, Cái Miệng ở tầng 25/50/75 | `js/52-abyss.js`, `js/28-bosses.js` |
| T7.8 | Ông Lặng mở Cổng Vực (khi `save.unlocks.abyss`); chọn tầng xuất phát; kỷ lục tầng sâu nhất trên Bảng Vàng; hậu truyện ở các tầng 30, 50, 75, 100, 150, 200 (GDD 11.9) | `js/53-scene-town.js`, `js/43-ui-town.js` |
| T7.9 | Ám ở Vực: +1 mỗi tầng hoàn thành từ tầng 11; Giao Kèo Đen cộng Ám; phép Vực (`abyss: true`) và dòng Vực chỉ rơi ở Vực | `js/52-abyss.js`, `js/22-loot.js` |

**Nghiệm thu M7:** chơi tới tầng 30, chết rồi quay lại nhặt được Mộ, chọn Giao Kèo thấy tác dụng.

---

## M8 · Đánh bóng

| Thẻ | Nội dung |
|---|---|
| T8.1 | **Nhạc nền:** máy phát nhạc chiptune tổng hợp bằng WebAudio trong `js/04-audio.js`: `Audio.music(key)` chuyển bài mờ dần 0.5 s. Mỗi hầm, thị trấn, boss và Vực một bài (mảng nốt bass/hợp âm/giai điệu theo nhịp). Thanh âm lượng nhạc trong Cài đặt đã có sẵn. |
| T8.2 | **Cân bằng:** chạy bot với máu thật ở từng hầm/độ khó; chỉnh `CONFIG` và `hpK/dmgK` của boss để đạt mục tiêu ở GDD 17 (phòng 40–70 s, boss 60–90 s, 1–1.5 cấp mỗi lượt đúng cấp). |
| T8.3 | **Điện thoại:** thử trên điện thoại thật; nút cảm ứng không che HUD; cửa sổ DOM cuộn được; chế độ hiệu ứng Thấp; thông báo xoay ngang. |
| T8.4 | Hiệu ứng bonus bộ dạng `effect` của Chủ Cũ (T5.8) và các tinh chỉnh còn lại. |
| T8.5 | Hướng dẫn chơi lần đầu (dạng thông báo/khung gợi ý), màn hình "Hết" + danh sách người làm. |
| T8.6 | Soát toàn bộ: không lỗi console, `README.md` và `TIEN-DO.md` cập nhật, bật GitHub Pages để có link chơi. |

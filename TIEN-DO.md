# Tiến độ & ghi chú phát triển — Mini Dungeon Slayer

Đọc file này cùng [MINI-DUNGEON-SLAYER-GDD.md](MINI-DUNGEON-SLAYER-GDD.md) (thiết kế đầy đủ, là nguồn sự thật). File này ghi những gì **đã làm**, những chỗ **khác với GDD**, cách làm việc và việc **còn lại**.

Cập nhật lần cuối: 2026-10-25 · Tran Duc Long - tranduclong.id.vn

---

## 1. Trạng thái các mốc (GDD mục 16)

| Mốc | Trạng thái | Ghi chú |
|---|---|---|
| M0 · Khung dự án | ✅ Xong | |
| M1 · Đánh trong một phòng | ✅ Xong | Còn trong game ở chế độ phòng thử (`?test=1`) |
| M2 · Hầm Mỏ Bỏ Hoang hoàn chỉnh | ✅ Xong | Sinh tầng, khoá cửa, 5 quái D1, mini boss Hòa (chưa có thoại), boss Quản Đốc 3 pha, rơi đồ, rương, cổng ra, tổng kết |
| M3 · Đồ & thị trấn | ✅ Xong | Tạo nhân vật 4 dáng, thị trấn, túi đồ, Lò Rèn, Chợ, Giếng Thánh (rửa điểm), Bảng Vàng 5 độ khó, cộng điểm, save + xuất/nhập |
| M4 · 20 phép + đồ độc nhất | ✅ Xong | 20 phép Q/E, 11 Huyền Thoại có tên + 6 hiệu ứng ngẫu nhiên + 6 Thần Thoại, chữ hologram trên đầu NPC, bảng DEBUG |
| **M5 · Hội thoại & cốt truyện: mở đầu + Chương 1** | ⏳ **Làm tiếp** | Xem mục 5 |
| M6 · Hầm D2–D5 + Chương 2–5 + 4 kết thúc | Chưa làm | |
| M7 · Vực Không Đáy | Chưa làm | |
| M8 · Đánh bóng (nhạc, cân bằng, điện thoại) | Chưa làm | |

## 2. Những chỗ đã KHÁC với GDD (đã chốt, giữ nguyên)

1. **Hình ảnh:** không dùng gói 0x72. Toàn bộ nhân vật, quái, NPC, vũ khí, vật thể là **pixel art tự vẽ bằng mảng ký tự** trong `js/02c-pixel-sprites.js`, phong cách chibi, **viền đen 1px tự sinh**, đổ bóng 3–4 tông màu. Quái mới phải vẽ theo đúng kiểu này. Có sẵn đường nạp gói 0x72 (`tools/make_atlas.py`, `js/02b-atlas.js`) nhưng hiện để `null`.
   - Sprite có 3 kiểu `anim`: `walk` (body + legs: stand/a/b), `bounce` (chỉ body, khung "squash"), `static`.
   - Đổi màu nhanh bằng `paletteVariant(baseKey, pal)` (ví dụ 4 dáng nhân vật, NPC thợ rèn) và khuôn áo choàng `robe(pal)` cho NPC.
2. **Nền và tường** vẽ thủ tục trong `js/32-render.js` (`drawTileAt`) theo `theme` của từng hầm. Thêm ký tự ô: `=` đường ray (đi được), `H` mái nhà, `d` cửa nhà (thị trấn), `D` cửa sắt khi phòng khoá.
3. **Font:** VT323 (Google Fonts, có subset vietnamese). Chữ luôn vẽ trên `uiCanvas` độ phân giải cao hoặc DOM, không vẽ trên canvas thế giới.
4. **Khung hình:** màn hình logic có chiều cao khoảng 270px, chiều rộng theo tỉ lệ màn hình, phóng to theo số nguyên điểm ảnh thiết bị (`resizeView` trong `99-main.js`). Mỗi khung kiểm tra lại cỡ cửa sổ.
5. **Rung màn hình:** mặc định nhẹ (biên độ 3), chỉnh trong Cài đặt (`settings.shakeAmp` 0–6). Camera gần như không chạy theo chuột (`CAM_LEAD 8`). Người chơi đã phàn nàn rung nhiều gây chóng mặt, nên không tăng lại.
6. **Chém phá đạn:** vũ khí cận chiến chém trúng đạn quái thì đạn vỡ (đã ghi vào GDD 5.1).
7. **Nhập liệu:** phím "vừa bấm" chỉ bị xoá sau khi có ít nhất 1 bước logic (`Input.consumePresses`), để màn hình 120/144/165Hz không mất phím. Không đổi lại cơ chế này.
8. **Hologram NPC:** NPC thị trấn có bảng chữ xanh trên đầu ghi tên + việc NPC làm (`role` trong `TOWN_PLACES`, `53-scene-town.js`). NPC mới phải có `role`.
9. **Đầy túi khi về thị trấn:** đồ dư tự bán lấy vàng.
10. **Trong hầm, túi đồ chỉ xem, không thay đồ** (theo GDD).
11. **Thư Viện (Cô Mực)** và **Cổng Vực (Ông Lặng)** mới có thoại báo "sắp mở", chờ M5 và M7.

## 3. Cấu trúc code (đã có)

Nạp đúng thứ tự trong `index.html` (script thường, **không module, không fetch**, chạy được bằng `file://` và GitHub Pages).

| File | Nội dung chính |
|---|---|
| `00-config.js` | `CONFIG`, `WEAPON_TYPES` |
| `01-util.js` | RNG có seed, hình học, `SpatialHash` |
| `02-assets.js`, `02b-atlas.js`, `02c-pixel-sprites.js` | vẽ sprite, đổi màu, pixel art |
| `03-input.js` | bàn phím/chuột/cảm ứng → `Input.state` |
| `04-audio.js` | âm thanh WebAudio tổng hợp (`SFX`) — **chưa có nhạc nền** |
| `05-events.js` | `Events.on/off/emit` |
| `11-data-items.js` | `AFFIXES`, `ARMOR_CLASS`, `RELICS`, `STAT_NAMES`, `fmtStat` |
| `12-data-skills.js` | `SKILLS` (20), `UNIQUES`, `LEGEND_EFFECTS`, `MYTHICS` |
| `13-data-enemies.js` | `ENEMIES` (quái D1 + Yêu Mực + mini boss/boss) |
| `14-data-rooms.js` | mẫu phòng (luật: kích thước lẻ, 3 ô giữa mỗi cạnh để trống cho cửa) |
| `15-data-dungeons.js` | `DIFFICULTIES`, `DUNGEONS` (mới có `mine`) |
| `20-save.js` | `Save` (khoá `mds_save_v1`), tiện ích túi đồ, `addLoot` |
| `21-stats.js` | `G()`, `computePlayerStats`, Lực Chiến, `addXpTo` |
| `22-loot.js` | `RAR`, `genItem`, `itemStats`, nâng cấp, rèn lại, bán |
| `23-world.js` | `generateFloor`, va chạm ô, cửa |
| `24-entities.js` | tạo thực thể + `Player.update` |
| `25-combat.js` | `dealDamage`, trạng thái, đạn, vùng nguy hiểm, vật nhặt |
| `26-skills.js` | `Skills`, `SKILL_IMPL` (20 phép) |
| `27-ai.js` | hành vi quái |
| `28-bosses.js` | `BOSS_IMPL`, `BOSS_ATTACKS` (Quản Đốc, Hòa) |
| `29-effects.js` | `EFFECT_IMPL`, `Effects.registerRun` |
| `30-fx.js`, `31-light.js`, `32-render.js` | hiệu ứng, ánh sáng, vẽ thế giới |
| `40-ui-hud.js` | HUD, bản đồ nhỏ, nút cảm ứng, `UI.panel/toast/showBanner` |
| `41-ui-dom.js` | `Win` (cửa sổ), `el`, `btn`, icon đồ, chú thích đồ |
| `42-ui-inventory.js`, `43-ui-town.js` | túi đồ; Lò Rèn, Chợ, Giếng, Bảng Vàng, Nhân vật, Cài đặt, `UI.say` |
| `51-run.js` | `Run`: một lượt chơi (phòng, đợt quái, boss, rương, chết, tổng kết, ghi save) |
| `53-scene-town.js`, `54-scene-dungeon.js`, `55-scene-title.js` | các scene |
| `99-main.js` | `GAME`, `SceneManager`, vòng lặp, `WATERMARK` |

**Chưa có** (theo GDD mục 13.1): `16-data-abyss.js`, `17-data-lore.js`, `18-data-story.js`, `44-ui-dialog.js`, `50-story.js`, `52-abyss.js`.

## 4. Cách làm việc (bắt buộc giữ)

- **Làm từng mốc.** Xong mốc nào dừng lại để chủ dự án chơi thử, sau đó mới làm mốc tiếp theo. Báo rõ: đã làm gì, đã kiểm tra gì, chưa kiểm tra được gì.
- **Kiểm tra trước khi bàn giao:**
  - `node --check` mọi file JS.
  - Chạy game qua một server tĩnh (ví dụ `python -m http.server 8765` trong thư mục dự án), mở `http://localhost:8765/?debug=1`.
  - Cho bot tự chơi qua console: tìm đường BFS trên lưới ô, đánh quái gần nhất, nhặt đồ, mở rương, đi cổng ra.
- **Công cụ thử:**
  - `?debug=1`: hiện FPS, có nút DEBUG trong thị trấn (vàng, cấp, đồ Huyền Thoại/Thần Thoại, đủ 20 phép).
  - `?test=1`: phòng thử; phím 1–7 đổi vũ khí, 8/9 đổi phép Q/E, 0 đổi hiệu ứng Huyền Thoại.
- **Dữ liệu điều khiển logic:** thêm quái, đồ, phòng, kịch bản bằng dữ liệu (GDD mục 15). Chữ hiển thị tiếng Việt, tên biến tiếng Anh, chú thích ngắn tiếng Việt ở đầu file và hàm chính.
- **Watermark:** giữ dòng **"Tran Duc Long - tranduclong.id.vn"** ở comment đầu các file chính, README, màn hình tiêu đề, góc HUD, Cài đặt. Mỗi commit message kết thúc bằng dòng đó.
- Không thêm tên hay chữ ký của ai khác ngoài chủ dự án vào code, file và commit message.
- Save phải tương thích ngược: thêm trường mới thì cho giá trị mặc định trong `Save.fresh`, vì `Save.migrate` tự điền trường thiếu.

## 5. Việc tiếp theo: M5 (chi tiết)

Theo GDD mục 11, 12, 16:
1. **Hệ thống hội thoại** (`44-ui-dialog.js`):
   - Khung dưới màn hình, chân dung sprite phóng to, chữ chạy, lựa chọn có con trỏ.
   - Chạy được trên cả máy tính lẫn điện thoại.
   - Hàm `Dialog.say` và `Dialog.choice` trả về Promise.
2. **Bộ chạy kịch bản** (`50-story.js`):
   - Các lệnh ở GDD 11.2.
   - `cond` đánh giá an toàn, **không dùng `eval`**.
   - `STORY_HOOKS` móc vào hầm qua `Run`: vào hầm, vào phòng sự kiện, mini boss còn ≤30% máu, chuyển pha boss, boss chết, rời hầm.
3. **Dữ liệu cốt truyện** (`18-data-story.js`):
   - `CHARACTERS` (dùng sprite NPC có sẵn: `npc_mo`, `npc_smith`, `npc_cat`, `npc_nen`, `npc_muc`, `npc_lang`; Bé Tí cần vẽ thêm).
   - Kịch bản **mở đầu** (GDD 11.3) và **Chương 1** (GDD 11.4).
4. **Chế độ Cốt truyện** ở Bảng Vàng:
   - Nút "Cốt truyện: Chương 1". Hiện Mỏ đang mở sẵn ở Farm; cần đổi lại thành **mở Farm khi xong chương 1** theo GDD, nhưng không khoá save cũ đã chơi Farm.
   - Đồ cốt truyện: Phù Hiệu Thợ Mỏ, Đèn Lồng Vỡ, Huy Hiệu Của Kha.
5. **Tha/giết mini boss Hòa:**
   - Khi còn ≤30% máu thì trận đấu dừng, hiện 3 lựa chọn (cần Đèn Lồng Vỡ để tha).
   - Tha: `save.sparedCount++`, rơi Đèn Lồng Của Hòa. Giết: +10 Ám.
6. **Chủ Cũ** (`17-data-lore.js`, GDD 12):
   - 12 Chủ Cũ.
   - `genItem` gán `owner` + `memory`; chú thích đồ hiện chủ cũ và dòng ký ức.
   - Nhặt/giải phóng đồ thì đếm, mở mảnh ký ức.
   - Bonus bộ 2/3 món.
   - **Thư Viện của Cô Mực** mở Sổ Ký Ức, có chức năng "Trả lại" (−2 Ám).
7. **Ám** (`save.am` 0–100, GDD 12.3):
   - Không hiện số, chỉ hiện biểu tượng giọt mực 4 mức trong túi đồ.
   - +0.3% sát thương mỗi điểm.
   - Viền tím khi Ám ≥ 50, mắt đỏ khi Ám ≥ 75.
   - Thoại NPC thay đổi theo Ám (GDD 11.10).
   - Giếng Thánh thêm chức năng giảm Ám.
8. **Nghiệm thu:**
   - Chơi từ tạo nhân vật → mở đầu → hết chương 1, đi được cả nhánh tha lẫn giết.
   - Lựa chọn được lưu.
   - Save cũ (đã có từ M3–M4) vẫn chạy được.

## 6. Ghi chú / lỗi đã biết

- Bot không biết né nên hay chết ở boss khi để máu thật. Độ khó của boss **chưa được người thật cân chỉnh**; để cân ở M8.
- XP lúc đầu khá nhanh (một lượt Mỏ có thể lên vài cấp); để cân ở M8.
- `u_goldCrown`, `u_bookOfNames`, `m_namelessBlade`, `m_farmThrone` cần Ám/Chủ Cũ/tha mini boss (M5) mới có tác dụng thật.
- Phép Vực (`abyss: true`) chỉ nên rơi ở Vực (M7); hiện chỉ lấy được qua DEBUG.

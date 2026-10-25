# MINI DUNGEON SLAYER — Tài liệu thiết kế & đặc tả kỹ thuật (GDD)

> Phiên bản tài liệu: 1.0 · Ngôn ngữ trong game: **Tiếng Việt** · Ngôn ngữ code (tên biến/hàm/file): **tiếng Anh**
>
> Tài liệu này đủ để một lập trình viên **không có ngữ cảnh nào khác** code ra toàn bộ game. Mọi con số ở đây là giá trị khởi điểm, có thể chỉnh trong `js/00-config.js` mà không phải sửa logic.
>
> Chỗ nào ghi **[CẦN KIỂM TRA]** là chưa xác minh được 100%: khi code, kiểm tra lại, nếu sai thì dùng phương án dự phòng ghi ngay bên cạnh.

---

## MỤC LỤC
0. Quy tắc bắt buộc cho người code
1. Tổng quan game
2. Công nghệ, đồ họa, font, âm thanh
3. Điều khiển (PC + điện thoại)
4. Nhân vật, chỉ số, công thức
5. Chiến đấu
6. Trang bị & vật phẩm
7. Quái & boss
8. Hầm ngục, phòng, sinh tầng, độ khó, hình phạt khi chết
9. Vực Không Đáy (chế độ vô tận)
10. Thị trấn & giao diện
11. Cốt truyện đầy đủ (kịch bản)
12. Hệ thống "Chủ Cũ" (ký ức trên đồ) & chỉ số Ám
13. Kiến trúc code
14. Cấu trúc dữ liệu & file lưu (JSON mẫu)
15. Cách thêm nội dung mới
16. Thứ tự code (các mốc + tiêu chí nghiệm thu)
17. Bảng tham số cân bằng
18. Danh sách [CẦN KIỂM TRA]

---

## 0. QUY TẮC BẮT BUỘC CHO NGƯỜI CODE

1. **HTML + CSS + JavaScript thuần**, không framework, không game engine, không bước build bắt buộc. Mở `index.html` bằng trình duyệt (kể cả `file://`) là chơi được; đẩy lên GitHub Pages là có link chơi.
2. **Không dùng ES module (`import/export`)** vì `file://` chặn. Dùng nhiều thẻ `<script src="js/...">` theo đúng thứ tự trong mục 13. Mọi file chia sẻ một namespace toàn cục.
3. **Không dùng `fetch()` để đọc dữ liệu**, cũng vì `file://`. Toàn bộ dữ liệu (đồ, quái, phòng, cốt truyện) nằm trong file `.js` dưới dạng object. Ảnh nạp bằng `new Image()`, cách này chạy được trên `file://`.
4. **Logic tách khỏi phần vẽ.** Hàm `update(dt)` không được gọi API canvas; hàm `render()` không được thay đổi trạng thái game.
5. **Dữ liệu điều khiển logic.** Thêm quái, đồ, hầm hay chương truyện thì chỉ thêm dữ liệu, không sửa engine (xem mục 15).
6. **Vòng lặp bước thời gian cố định 60 lần/giây** (mục 13.3). Mọi tốc độ tính bằng pixel/giây, mọi thời gian tính bằng giây.
7. **Đơn vị không gian:** 1 ô (tile) = **16 pixel logic**. Màn hình logic **480 × 270** pixel, phóng to theo số nguyên.
8. **Lưu game** bằng `localStorage`, khóa `mds_save_v1`, có số phiên bản và hàm nâng cấp dữ liệu lưu cũ (migration).
9. **Mọi chữ hiển thị** gom vào dữ liệu (không viết cứng chữ rải rác trong logic), để sau này sửa thoại hay dịch dễ.
10. Code xong mỗi mốc (mục 16) phải chạy được và kiểm theo đúng tiêu chí nghiệm thu rồi mới làm mốc sau.

---

## 1. TỔNG QUAN GAME

### 1.1 Một câu
Game nhập vai hành động **pixel 2D nhìn từ trên xuống**, kiểu Soul Knight. Người chơi đánh qua các hầm ngục, farm đồ, nâng cấp đồ, theo một cốt truyện **bên ngoài dễ thương, bên trong sâu sắc**. Sau đó lao vào **Vực Không Đáy** vô tận.

### 1.2 Cảm hứng
- **Dungeon Quest (Roblox):** chọn hầm + độ khó → dọn phòng → boss → nhận đồ → về sảnh nâng cấp. Build theo đồ, không khóa class. Điểm chỉ số chia cho Vật lý / Phép / Máu. Mỗi món đồ có số ô nâng cấp cố định.
- **Soul Knight:** hình pixel, phòng khóa cửa khi vào đánh, quái hiện ra có báo trước, cảm giác đánh "đã tay" (rung, khựng, hạt bay, chữ sát thương).
- **Undertale / Orb Clash:** quái có tên tuổi có thể **tha**, game **ghi nhớ** lựa chọn của người chơi, thông điệp ẩn về chính hành vi chơi game (ở đây là "cày đồ").

### 1.3 Ba trụ cột
1. **Đánh đã tay:** mọi đòn đều có phản hồi hình ảnh và âm thanh. Đòn mạnh của quái luôn có báo trước để né được.
2. **Farm có ý nghĩa:** mỗi món đồ rơi ra **từng là của ai đó** (Chủ Cũ). Farm cũng là cách đọc truyện.
3. **Cái giá của việc cày:** chỉ số ẩn **Ám** tăng khi cày sâu và khi giết thay vì tha. Ám cho thêm sức mạnh nhưng làm thay đổi câu chuyện và kết thúc.

### 1.4 Bối cảnh
Thị trấn **Miệng Giếng** được xây trên miệng một hầm ngục không đáy gọi là **Vực**. Cả thị trấn sống nhờ đồ mạo hiểm giả mang lên. Trên quảng trường có **Bảng Vàng** xếp hạng ai mang lên nhiều đồ nhất. Nhân vật chính (người chơi đặt tên, mặc định "Mini") tới thị trấn để tìm **anh trai Kha**, người đã xuống Vực 3 tháng trước và không về.

**Sự thật** (lộ dần qua 5 chương):
- Đồ rơi trong hầm là **di vật** của những mạo hiểm giả đã chết.
- Quái là những người **ở dưới quá lâu**, ham cày tới mức bị Vực nuốt (gọi là **Kẻ Ở Lại**).
- Thị trấn biết chuyện này nhưng vẫn gửi người xuống, vì "đồ lên thì thị trấn sống".
- Trái tim của Vực là **Người Đứng Đầu**: người đầu tiên đứng hạng 1 Bảng Vàng, đã cày lâu tới mức trở thành chính cái Vực.

### 1.5 Chế độ chơi
| Chế độ | Mô tả | Mở khóa |
|---|---|---|
| **Cốt truyện** | 5 chương = 5 hầm, có cảnh thoại, sự kiện, mini boss tha được, lựa chọn ảnh hưởng kết thúc | Ngay từ đầu (chương sau mở khi xong chương trước) |
| **Farm hầm** | Chọn hầm + 1 trong 5 độ khó, dọn phòng, đánh boss, nhận đồ | Hầm mở ở Farm khi xong chương tương ứng |
| **Vực Không Đáy** | Số tầng vô hạn, Giao Kèo, Trạm, Mộ, kỷ lục tầng sâu nhất | Xong chương 2 |

### 1.6 Vòng chơi chính
```
Thị trấn ──► Bảng Hầm (chọn hầm + độ khó / Vực) ──► Lượt chơi
   ▲                                                   │
   │   (trang bị, nâng cấp, bán, giải phóng, cộng điểm) │ dọn phòng → mini boss → boss → rương
   └──────────────── về thị trấn ◄─────────────────────┘
```
Một lượt Farm: **6–9 phút**. Một tầng Vực: **2–3 phút**.

---

## 2. CÔNG NGHỆ, ĐỒ HỌA, FONT, ÂM THANH

### 2.1 Nền tảng
- Trình duyệt máy tính (Chrome, Edge, Firefox) và trình duyệt điện thoại (Chrome Android, Safari iOS). Điện thoại khuyến nghị **xoay ngang**; nếu đang dọc thì hiện thông báo "Xoay ngang để chơi".
- Phát hành: repo GitHub → bật **GitHub Pages** (Settings → Pages → nhánh `main`, thư mục `/root`) → link `https://<user>.github.io/mini-dungeon-slayer/`.

### 2.2 Hình ảnh: gói tileset
- **Tên:** 16x16 DungeonTileset II, tác giả **0x72**
- **Link:** https://0x72.itch.io/dungeontileset-ii
- **Giấy phép:** CC0, tác giả ghi "You can use this tileset for whatever you like (CC-0)" trong phần mô tả và bình luận trên itch.io. **[CẦN KIỂM TRA]** lại dòng giấy phép trên trang tải.
- **Kích thước:** ô nền và tường 16×16. Nhân vật anh hùng 16×28. Quái nhỏ 16×16. Quái to 32×36. Vũ khí cao 16–30 pixel, rộng không đều.
- **File trong gói:** ảnh lớn `0x72_DungeonTilesetII_v1.x.png` và file văn bản `tiles_list_v1.x` (mỗi dòng: `tên x y rộng cao [số_khung]`). **[CẦN KIỂM TRA]** tên file chính xác theo phiên bản tải về.
- **Cách đưa vào game** (vì không dùng `fetch`):
  1. Giải nén gói vào `assets/0x72/`.
  2. Chạy `python tools/make_atlas.py assets/0x72/tiles_list_v1.x` → sinh ra `js/02b-atlas.js` chứa `const ATLAS = { "knight_m_idle_anim": {x,y,w,h,frames}, ... }`.
  3. Script `make_atlas.py` gom các dòng có đuôi `_f0`, `_f1`... thành một sprite có nhiều khung.
- **Phương án dự phòng (bắt buộc làm):** nếu `ATLAS` hoặc ảnh không có thì `drawSprite()` vẽ hình thay thế (hình khối màu có viền, có mắt) để game vẫn chạy. Thêm một tham số `DEBUG_PLACEHOLDER` để ép dùng hình thay thế.

**Sprite dùng từ gói 0x72** (tên gốc trong gói, **[CẦN KIỂM TRA]** đối chiếu với `tiles_list`, sai thì dùng tên gần nhất):

| Nhóm | Tên sprite |
|---|---|
| Anh hùng (4 dáng) | `knight_m`, `wizzard_m` *(gói viết sai chính tả như vậy)*, `elf_m`, `lizard_m`, kèm bản nữ `_f`; mỗi dáng có `_idle_anim` (4 khung), `_run_anim` (4 khung), `_hit_anim` (1 khung) |
| NPC thị trấn | `dwarf_m` (Bác Đồng), `elf_f` (Cô Mực), `wizzard_f` (Bà Mõ), `doc` (Sư Nến), `angel` (Bé Tí), `lizard_f` (Ông Lặng). Mèo Xu Xu: vẽ bằng code **[CẦN KIỂM TRA: gói không có mèo]** |
| Quái | `goblin`, `tiny_zombie`, `imp`, `skelet`, `muddy`, `swampy`, `zombie`, `ice_zombie`, `masked_orc`, `orc_warrior`, `orc_shaman`, `necromancer`, `wogol`, `chort`, `big_zombie`, `ogre`, `big_demon`, `slug`, `tiny_slug`, `pumpkin_dude`; mỗi con có `_idle_anim`, `_run_anim` |
| Nền / tường | `floor_1`…`floor_8`, `floor_spikes_anim`, `floor_ladder`, `hole`, `wall_top_left`, `wall_top_mid`, `wall_top_right`, `wall_left`, `wall_mid`, `wall_right`, `wall_banner_red`, `wall_banner_blue`, `wall_fountain_mid_red_anim`, `wall_fountain_mid_blue_anim`, `column_top`, `column_mid`, `coulmn_base` *(gói viết sai)*, `doors_leaf_closed`, `doors_leaf_open`, `doors_frame_top`, `doors_frame_left`, `doors_frame_right` |
| Vật thể | `chest_full_open_anim`, `chest_empty_open_anim`, `chest_mimic_open_anim`, `crate`, `skull`, `coin_anim`, `flask_red`, `flask_big_red`, `flask_blue`, `flask_green`, `flask_yellow` |
| Vũ khí | `weapon_rusty_sword`, `weapon_regular_sword`, `weapon_red_gem_sword`, `weapon_knight_sword`, `weapon_golden_sword`, `weapon_lavish_sword`, `weapon_katana`, `weapon_anime_sword`, `weapon_hammer`, `weapon_big_hammer`, `weapon_axe`, `weapon_cleaver`, `weapon_mace`, `weapon_spear`, `weapon_knife`, `weapon_bow`, `weapon_arrow`, `weapon_red_magic_staff`, `weapon_green_magic_staff` |
| UI | `ui_heart_full`, `ui_heart_half`, `ui_heart_empty` |

**Thứ phải vẽ bằng code** (gói không có): đạn, hiệu ứng phép, vùng báo nguy hiểm, icon mũ/giáp/giày/nhẫn/sách phép, mèo Xu Xu, bàn tay trồi lên từ sàn ở Đáy Giếng. Các icon vẽ bằng code là **pixel art 16×16 định nghĩa bằng mảng chuỗi** (mục 13.6, `PIXEL_ICONS`).

**Đổi màu theo hầm:** dùng lại sprite quái với màu khác. Hàm `getTinted(key, color, strength)` vẽ sprite lên canvas phụ, phủ màu bằng `globalCompositeOperation="source-atop"` với độ đậm `strength` (0–1), rồi lưu cache.

### 2.3 Phong cách "đẹp như Soul Knight" (bắt buộc)
- `ctx.imageSmoothingEnabled = false` ở mọi canvas; CSS `image-rendering: pixelated`.
- Canvas thế giới 480×270, phóng to theo **số nguyên** lớn nhất vừa màn hình, phần thừa để viền đen.
- Mọi thực thể có **bóng đổ** (hình elip đen, độ trong 0.35, dưới chân).
- **Ánh sáng:** mỗi hầm có độ tối nền (0–0.75). Nguồn sáng: người chơi (bán kính 110px), đuốc trên tường (70px, chập chờn), đạn phép (24px), vụ nổ (bùng 0.2 giây). Cách làm ở mục 13.7.
- **Cảm giác đánh:** trúng đòn thì sprite nháy trắng 2 khung; đòn nặng hoặc chí mạng thì cả game khựng lại 0.05 giây; rung màn hình kiểu trauma; quái bị đẩy lùi; có chữ sát thương bật lên; quái chết nổ hạt pixel và văng xu (xu tự hút về người chơi); kiếm vung để lại vệt cong; bắn có lóe sáng ở nòng; chạy để lại bụi chân; camera hơi lệch về hướng đang ngắm (tối đa 24px).
- **Rương mở:** có cột sáng màu theo độ hiếm của món tốt nhất bên trong. Huyền Thoại thì cột sáng cam, rung màn hình và có âm "tinh". Thần Thoại thì cột sáng đỏ hồng và game chậm lại 0.3 giây.
- **Bảng màu theo độ hiếm:** Thường `#C8C8C8`, Hiếm `#4DA6FF`, Sử Thi `#B26BFF`, Huyền Thoại `#FFB13B`, Thần Thoại `#FF4D6D`.

### 2.4 Font chữ
- **Font:** **VT323** (Google Fonts, giấy phép OFL). Đã kiểm tra: CSS của Google Fonts có subset `/* vietnamese */`.
- **Link:** https://fonts.google.com/specimen/VT323
- **Cách nhúng** trong `<head>` của `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
```
```css
:root { --font: "VT323", "Courier New", monospace; }
body { font-family: var(--font); }
```
- Khi không có mạng thì dùng font dự phòng. Muốn chơi offline hoàn toàn thì tải file `.woff2` vào `assets/fonts/` và khai báo bằng `@font-face` **[CẦN KIỂM TRA]** đường dẫn file tải từ Google Fonts.
- **Không vẽ chữ trên canvas 480×270** (dấu tiếng Việt sẽ vỡ). Chữ được vẽ ở **lớp giao diện độ phân giải cao**: menu dùng DOM HTML; chữ sát thương, thanh máu boss và hội thoại dùng canvas `uiCanvas` có kích thước bằng màn hình thật (mục 13.7). Trước khi chạy game phải chờ `document.fonts.ready`.
- Chuỗi kiểm tra dấu: `"Ếch ượt ỗ ữ ặ ằ Đ — Mini Dungeon Slayer"`.

### 2.5 Âm thanh
- **Toàn bộ âm thanh tự tổng hợp bằng WebAudio**, không cần file. Hàm `tone(freq, dur, type, vol, slide)` và `noise(dur, vol, filterFreq)`, đi qua bộ nén `DynamicsCompressor` và một nhánh vang nhẹ.
- **Danh sách hiệu ứng âm thanh** (key → mô tả):
  - Đánh, vung: `swing`, `hit`, `crit`, `hurt` (người chơi bị đánh), `dodge`
  - Nhặt: `coin`, `pickup`, `potion`
  - Phòng, rương: `door_close`, `door_open`, `room_clear`, `chest_open`, `rarity_legendary`, `rarity_mythic`
  - Lên cấp, giao diện: `levelup`, `ui_click`, `ui_hover`, `ui_error`
  - Phép: `spell_fire`, `spell_ice`, `spell_lightning`, `spell_dark`, `spell_heal`
  - Boss, chết: `boss_roar`, `boss_phase`, `death`, `telegraph` (tiếng ngắn báo đòn sắp đánh)
- **Nhạc nền:** máy phát nhạc chiptune theo nhịp (mảng nốt cho bass, hợp âm, giai điệu), mỗi hầm một bài, thị trấn một bài, boss một bài, Vực một bài (nhịp chậm, u ám). Hàm `music.play(trackKey)` chuyển bài có làm mờ dần 0.5 giây.
- Âm lượng nhạc và hiệu ứng chỉnh riêng trong Cài đặt. Trình duyệt chỉ cho phát âm thanh sau lần chạm/bấm đầu tiên, nên khởi động âm thanh khi người chơi bấm nút trên màn hình tiêu đề.

---

## 3. ĐIỀU KHIỂN

### 3.1 Máy tính
| Phím | Hành động |
|---|---|
| W A S D / phím mũi tên | Di chuyển 8 hướng |
| Chuột | Ngắm |
| Chuột trái (giữ) | Đánh liên tục |
| Space hoặc Shift | Lăn né |
| Q / E | Phép 1 / Phép 2 |
| R | Uống bình máu |
| F | Tương tác (nói chuyện, mở rương, nhặt đồ, đi cầu thang) |
| Tab hoặc I | Túi đồ (trong lượt chơi chỉ xem, không bán được) |
| M | Bản đồ lớn |
| Esc | Tạm dừng |

Trong Cài đặt có tùy chọn **"Tự nhắm"** cho máy tính (mặc định tắt).

### 3.2 Điện thoại (tự bật khi phát hiện màn hình cảm ứng)
- **Joystick ảo** ở nửa trái màn hình: chạm chỗ nào thì joystick hiện ở chỗ đó, bán kính 60px màn hình.
- **Nửa phải màn hình:**
  - Nút **Đánh** to (giữ để đánh liên tục). Khi đứng gần thứ tương tác được, nút đổi icon thành bàn tay và bấm vào là tương tác.
  - Nút **Lăn**, **Phép 1**, **Phép 2**, **Bình máu** xếp vòng quanh nút Đánh.
- **Tự nhắm luôn bật:** nhắm vào quái gần nhất trong 170px, có đường nhìn thẳng (không bị tường che), ưu tiên boss rồi tinh anh. Không có quái nào thì nhắm theo hướng đang đi.
- Nút tạm dừng ở góc trên phải.
- Kích thước nút tính theo tỉ lệ chiều cao màn hình (nút Đánh = 18% chiều cao).

### 3.3 Lớp nhập liệu chung
`Input` gom mọi nguồn vào một trạng thái duy nhất, mỗi khung đọc một lần:
```js
Input.state = {
  moveX, moveY,              // -1..1, đã chuẩn hóa
  aimX, aimY,                // hướng ngắm đã chuẩn hóa
  aimWorldX, aimWorldY,      // điểm ngắm trong tọa độ thế giới
  attack,                    // đang giữ đánh
  dodgePressed, skill1Pressed, skill2Pressed,
  potionPressed, interactPressed,
  pausePressed, invPressed, mapPressed
}
```
Các biến `...Pressed` chỉ đúng trong **một khung** (cạnh lên).

---

## 4. NHÂN VẬT, CHỈ SỐ, CÔNG THỨC

### 4.1 Đường cong sức mạnh chung
```
G(L) = 1.065^(L - 1)
```
Mọi giá trị chỉ số (sát thương vũ khí, máu giáp, máu và sát thương quái, vàng) đều nhân với `G(cấp)`. Ví dụ: G(1)=1, G(10)≈1.76, G(20)≈3.31, G(30)≈6.21, G(40)≈11.7, G(50)≈21.9, G(60)≈41.1.

### 4.2 Cấp độ
- Cấp tối đa **60**.
- XP cần để lên cấp tiếp theo: `xpNeed(L) = round(50 * L^1.6)`.
- Mỗi cấp được **3 điểm chỉ số** (cấp 1 đã có sẵn 3 điểm).
- Lên cấp: hồi đầy máu, có hiệu ứng cột sáng và âm `levelup`.

### 4.3 Ba chỉ số cộng điểm (giống Dungeon Quest)
| Chỉ số | Key | Mỗi điểm |
|---|---|---|
| Sức Mạnh | `str` | +2% sát thương **vật lý** |
| Phép Lực | `int` | +2% sát thương **phép** |
| Thể Lực | `vit` | +2% máu tối đa |

- Reset toàn bộ điểm ở Giếng Thánh, giá `100 * cấp` vàng.

### 4.4 Công thức chỉ số người chơi
```
maxHP      = (60 * G(level) + Σ armor.hp) * (1 + 0.02*vit + Σ hpPct)
physMult   = (1 + 0.02*str) * (1 + Σ physPct)
spellMult  = (1 + 0.02*int) * (1 + Σ spellPct)
critChance = 0.05 + Σ critC                       (tối đa 0.75)
critMult   = 1.5  + Σ critD
atkSpeed   = 1 + Σ atkSpd                         (chia vào khoảng nghỉ giữa hai đòn)
moveSpeed  = 90 px/s * (1 + Σ move)               (tối đa ×1.6)
cdr        = min(0.5, Σ cdr)                      (giảm hồi chiêu phép)
dmgTaken   = max(0.6, 1 - Σ dr)                   (giảm sát thương nhận tối đa 40%)
```
Các `Σ ...Pct` là tổng cộng dồn từ dòng chính, dòng phụ, bonus bộ, Giao Kèo và Ám, viết dạng số thập phân (0.06 = 6%).

### 4.5 Lực Chiến (hiện ở UI để so độ mạnh)
```
itemScore(it) = round(10 * G(it.ilvl) * RAR[it.rar].mult * (1 + 0.08 * it.upg.length))
power         = Σ itemScore (7 ô trang bị) + 3 * level
recPower(L)   = round(7 * 10 * G(L) * 1.15) + 3 * L      // lực chiến khuyên dùng cho quái cấp L
```
Màu hiển thị: `power ≥ recPower` thì xanh lá; từ 75% tới dưới 100% thì vàng; dưới 75% thì đỏ.

### 4.6 Hằng số di chuyển & phòng thủ của người chơi
| Thông số | Giá trị |
|---|---|
| Bán kính va chạm | 6 px |
| Tốc độ chạy | 90 px/s |
| Lăn né | 0.30 s, đi được 70 px, bất tử 0.25 s đầu, hồi 0.8 s |
| Bất tử sau khi bị đánh | 0.5 s (nhấp nháy) |
| Bình máu | 3 lượt mỗi lần vào hầm, hồi 40% máu tối đa ngay lập tức, hồi chiêu 1.5 s. Nâng túi bình ở Chợ: 4 / 5 / 6 lượt, giá 500 / 2000 / 8000 vàng |
| Quả cầu máu (quái rơi) | hồi 6% máu tối đa |

### 4.7 Dáng nhân vật (chọn khi tạo nhân vật, chỉ là ngoại hình + vũ khí khởi đầu)
| Dáng | Sprite | Vũ khí khởi đầu | Phép khởi đầu |
|---|---|---|---|
| Hiệp Sĩ | `knight_m/f` | Kiếm Gỉ (kiếm) | Lướt Chém |
| Pháp Sư | `wizzard_m/f` | Gậy Đèn Mỏ (gậy) | Cầu Lửa |
| Thợ Săn | `elf_m/f` | Cung Gỗ Thông (cung) | Mũi Tên Xuyên |
| Thằn Lằn | `lizard_m/f` | Dao Đẽo (dao) | Bước Bóng |

Khi tạo nhân vật chọn bản nam/nữ của sprite. Vũ khí cầm trên tay được vẽ xoay theo hướng ngắm (Soul Knight). Mũ/giáp/giày **không** đổi hình nhân vật. Ám ≥ 50 thì viền sprite có lớp tím; Ám ≥ 75 thì mắt phát sáng đỏ.

---

## 5. CHIẾN ĐẤU

### 5.1 Bảy loại vũ khí
Giá trị cho đồ cấp 1, độ hiếm Thường. Sát thương thực tế = `base * G(ilvl) * RAR.mult * (1 + 0.10 * số lần nâng cấp vào dòng chính)`.

| Loại | Key | Ăn theo | Sát thương | Khoảng nghỉ (s) | Cách đánh |
|---|---|---|---|---|---|
| Kiếm | `sword` | Vật lý | 10 | 0.38 | Chém vòng cung 100°, tầm 26px. Combo 3 đòn ×1 / ×1 / ×1.6, đứt combo nếu nghỉ quá 0.6 s |
| Búa/Rìu | `heavy` | Vật lý | 22 | 0.75 | Vòng cung 140°, tầm 30px, đẩy lùi 140 |
| Giáo | `spear` | Vật lý | 13 | 0.50 | Đâm thẳng hình chữ nhật 40×10, xuyên mọi quái |
| Dao | `dagger` | Vật lý | 6 | 0.22 | Vòng cung 70°, tầm 20px, +10% tỉ lệ chí mạng |
| Cung | `bow` | Vật lý | 9 | 0.42 | Bắn mũi tên 320 px/s, sống 0.9 s |
| Gậy phép | `staff` | Phép | 9 | 0.42 | Bắn tia phép 260 px/s, nổ nhỏ bán kính 10 (gây 50% sát thương) |
| Sách phép | `tome` | Phép | 12 | 0.60 | Bắn quả cầu tự đuổi 180 px/s, xoay tối đa 4 rad/s, sống 1.6 s |

**Chém phá đạn:** vũ khí cận chiến (kiếm, búa, dao, giáo) chém trúng đạn của quái thì đạn bị phá. Vùng phá đạn là hình quạt (giáo: đường đâm) của đòn chém, có hiệu lực suốt lúc vệt chém còn hiện (0.14 s). Phá được đạn thì có tia sáng, âm `parry`, khựng 0.025 s và phát sự kiện `parry`. Vũ khí bắn xa không phá đạn.

Đánh cận chiến: một đòn trúng mỗi quái nhiều nhất 1 lần, kiểm tra bằng hình quạt (hoặc hình chữ nhật với giáo) trong đúng 1 khung lúc vung. Đạn của người chơi bay xuyên qua người chơi, bị tường chặn, không bị cột chặn (trừ khi ô là `o`).

### 5.2 Phép (2 ô Q/E): 20 phép
Sát thương = `base * G(ilvl) * RAR.mult * (physMult hoặc spellMult tùy cột "Ăn theo") * (1 + skillDmg)`. Hồi chiêu = `cd * (1 - cdr)`.

| # | Key | Tên | Ăn theo | Sát thương gốc | Hồi chiêu | Hành vi |
|---|---|---|---|---|---|---|
| 1 | `fireball` | Cầu Lửa | Phép | 28 | 4 | Quả cầu bay 220 px/s, chạm thì nổ bán kính 24, gây Bỏng |
| 2 | `whirlwind` | Lốc Xoáy | Vật lý | 7 / lần | 7 | Xoay 1.6 s, cứ 0.2 s gây sát thương trong bán kính 28; trong lúc xoay chạy được với 70% tốc độ |
| 3 | `dashslash` | Lướt Chém | Vật lý | 26 | 5 | Lướt 80px theo hướng ngắm, bất tử khi lướt, chém mọi quái trên đường |
| 4 | `icerain` | Mưa Băng | Phép | 9 × 6 mảnh | 6 | 6 mảnh băng rơi trong bán kính 40 quanh điểm ngắm, gây Chậm 40% trong 2 s |
| 5 | `chain` | Sét Xích | Phép | 20 | 5 | Tia sét trúng quái gần điểm ngắm, nảy sang 4 con nữa trong 90px, mỗi lần nảy ×0.8 |
| 6 | `stoneshield` | Khiên Đá | — | khiên = 20% máu tối đa | 12 | Khiên hấp thụ sát thương trong 4 s |
| 7 | `spring` | Suối Hồi | — | hồi 25% máu trong 3 s | 15 | Hồi máu dần |
| 8 | `piercearrow` | Mũi Tên Xuyên | Vật lý | 30 | 4 | Tia thẳng 200px xuyên mọi quái |
| 9 | `boomerang` | Rìu Bay | Vật lý | 18 | 5 | Rìu bay ra 120px rồi quay về; có thể trúng mỗi quái 2 lần (đi và về) |
| 10 | `quake` | Địa Chấn | Vật lý | 34 | 8 | Nện đất bán kính 44, Choáng 0.8 s |
| 11 | `wisps` | Đom Đóm | Phép | 6 / phát | 10 | Gọi 2 đom đóm bay quanh 8 s, mỗi con cứ 0.5 s bắn 1 phát tự đuổi |
| 12 | `blackhole` | Lỗ Đen | Phép | 5 / 0.25 s | 10 | Hố ở điểm ngắm 2 s, hút quái trong bán kính 60 |
| 13 | `poisoncloud` | Độc Vụ | Phép | 8 / s | 8 | Đám mây độc bán kính 36 tồn tại 4 s, cộng dồn Độc |
| 14 | `bladestorm` | Bão Kiếm | Vật lý | 10 / lần chạm | 10 | 6 thanh kiếm bay vòng quanh người bán kính 26 trong 5 s; mỗi kiếm trúng cùng một quái tối đa 1 lần mỗi 0.5 s |
| 15 | `meteor` | Thiên Thạch | Phép | 60 | 9 | Báo nguy hiểm ở điểm ngắm 0.8 s rồi nổ bán kính 40 |
| 16 | `shadowstep` | Bước Bóng | Vật lý | — | 8 | Dịch chuyển 90px theo hướng ngắm, tàng hình 1 s (quái mất mục tiêu), đòn kế tiếp chắc chắn chí mạng ×2 |
| 17 | `bloodpact` | Giao Kèo Máu | — | — | 10 | Mất 10% máu hiện tại, +60% mọi sát thương trong 3 s. **Chỉ rơi ở Vực** |
| 18 | `abysscall` | Tiếng Gọi Vực | Phép | 40 | 12 | Kéo mọi quái trong bán kính 120 về phía người chơi rồi nổ. **Chỉ rơi ở Vực** |
| 19 | `twinshade` | Bóng Đôi | — | 40% sát thương của bạn | 14 | Gọi một bản sao bắt chước đòn đánh thường của bạn trong 6 s. **Chỉ rơi ở Vực** |
| 20 | `corrode` | Ăn Mòn | Phép | 15 | 7 | Tia thẳng; quái trúng tia nhận thêm 25% sát thương trong 4 s. **Chỉ rơi ở Vực** |

Ở bảng trên, các phép ghi Ăn theo "—" không tính theo sát thương nhưng **giá trị hiệu ứng** vẫn nhân với `RAR.mult` (khiên to hơn, hồi nhiều hơn).

### 5.3 Trạng thái (status effects)
| Key | Tên | Hiệu ứng | Ghi chú |
|---|---|---|---|
| `burn` | Bỏng | 20% sát thương của đòn gây bỏng, chia đều trong 3 s | Bị bỏng lần mới thì làm mới thời gian, không cộng dồn |
| `poison` | Độc | Mỗi tầng 5% sát thương gốc mỗi giây, kéo dài 4 s | Cộng dồn tối đa 5 tầng |
| `slow` | Chậm | −40% tốc độ chạy | Boss chỉ bị một nửa |
| `freeze` | Đóng băng | Không cử động 1 s | Boss miễn nhiễm, chuyển thành Chậm |
| `stun` | Choáng | Không cử động, không đánh | Boss: thời gian ×0.3 |
| `bleed` | Chảy máu | 30% sát thương trong 3 s | Nặng gấp đôi nếu mục tiêu đang di chuyển |
| `shield` | Khiên | Hấp thụ sát thương trước khi trừ máu | |
| `vuln` | Ăn mòn | Nhận thêm 25% sát thương | |
| `invis` | Tàng hình | Quái không thấy | |

### 5.4 Chuỗi xử lý sát thương: `dealDamage(src, target, opts)`
```
opts = { base, type: "phys"|"spell"|"true", canCrit=true, forceCrit=false,
         knock=0, tags=[], source: "weapon"|"skill"|"dot"|"thorns" }
1. amount = opts.base                                  // đã nhân sẵn hệ số của bên gây sát thương
2. nếu src là người chơi: amount *= (1 + bonus theo loại mục tiêu: boss/elite) * (1 + bonus từ Giao Kèo/Ám)
3. chí mạng: nếu canCrit và (forceCrit hoặc random < src.critChance) → amount *= src.critMult, crit = true
4. phía mục tiêu: amount *= target.dmgTaken * (target có vuln ? 1.25 : 1)
   - khiên chắn phía trước (quái shielder): đòn vật lý trúng từ phía trước thì amount = 0, hiện chữ "CHẶN"
5. trừ vào khiên trước, phần còn lại trừ vào máu; làm tròn lên số nguyên, tối thiểu 1
6. gọi hook onHit của src (hút máu, gây bỏng, hiệu ứng độc nhất...), hook onHurt của target (phản đòn...)
7. hiệu ứng: nháy trắng, chữ sát thương (trắng = vật lý, xanh dương = phép, vàng to = chí mạng,
   xanh lá = hồi máu, tím = độc/bỏng), đẩy lùi, khựng 0.05 s nếu chí mạng hoặc vũ khí nặng
8. nếu hp ≤ 0 → kill(target, src): hook onKill, rơi đồ, cộng XP/vàng, hạt nổ
```
Người chơi đang bất tử (lăn hoặc vừa bị đánh) thì bỏ qua sát thương từ quái. Riêng DOT do người chơi tự gây (Giao Kèo Máu) vẫn tính.

### 5.5 Hệ thống sự kiện (để hiệu ứng đặc biệt không phải sửa engine)
`Events.on(name, fn)` và `Events.emit(name, ctx)`. Các sự kiện bắt buộc:
- Đánh nhau: `hit`, `kill`, `hurt`, `dodge`, `castSkill`
- Phòng: `roomEnter`, `roomClear`
- Nhặt: `pickupGold`, `pickupItem`, `potionUse`
- Lượt chơi, nhịp: `runStart`, `runEnd`, `floorStart` (Vực), `tick` (mỗi 0.25 s)

Hiệu ứng của đồ độc nhất, Giao Kèo và bonus bộ đăng ký vào các sự kiện này khi bắt đầu lượt chơi, và gỡ ra khi kết thúc.

---

## 6. TRANG BỊ & VẬT PHẨM

### 6.1 Ô trang bị (7 ô)
`weapon` (vũ khí), `spell1`, `spell2` (2 ô phép), `helm` (mũ), `chest` (giáp), `boots` (giày), `relic` (di vật: nhẫn/bùa). Túi đồ 40 ô, mở rộng thêm 10 ô mỗi lần, giá `1000 * số lần đã mở` vàng, tối đa 100 ô.

### 6.2 Độ hiếm
| Key | Tên | Hệ số (`mult`) | Số dòng phụ | Số ô nâng cấp | Hệ số dòng phụ | Mảnh khi giải phóng | Màu |
|---|---|---|---|---|---|---|---|
| `common` | Thường | 1.00 | 0 | 2 | ×1.00 | 1 | `#C8C8C8` |
| `rare` | Hiếm | 1.15 | 1 | 3 | ×1.25 | 3 | `#4DA6FF` |
| `epic` | Sử Thi | 1.35 | 2 | 4 | ×1.50 | 8 | `#B26BFF` |
| `legendary` | Huyền Thoại | 1.60 | 3 + 1 hiệu ứng độc nhất | 5 | ×1.75 | 20 | `#FFB13B` |
| `mythic` | Thần Thoại | 1.90 | 3 + 1 hiệu ứng độc nhất (+1 dòng Vực nếu rơi từ Vực) | 6 | ×2.00 | 50 | `#FF4D6D` |

### 6.3 Dòng chính theo ô
| Ô | Dòng chính | Giá trị cấp 1, Thường |
|---|---|---|
| `weapon` | Sát thương | theo loại vũ khí (5.1) |
| `spell1/2` | Sát thương / giá trị phép | theo phép (5.2) |
| `helm` | Máu | 25 |
| `chest` | Máu | 45 |
| `boots` | Máu | 20, kèm sẵn +5% tốc chạy |
| `relic` | Hiệu ứng riêng của di vật (6.7) | |

Giá trị thực tế = `giá trị gốc * G(ilvl) * RAR.mult`.

**Hệ giáp** (mũ/giáp/giày chọn 1 hệ, giống Dungeon Quest). Mỗi món giáp có thêm một dòng theo hệ:
| Hệ | Key | Dòng thêm (mũ / giáp / giày, cấp Thường) |
|---|---|---|
| Chiến Binh | `warrior` | +4% / +6% / +3% sát thương vật lý |
| Pháp Sư | `mage` | +4% / +6% / +3% sát thương phép |
| Hộ Vệ | `guardian` | +4% / +6% / +3% máu tối đa |

Các phần trăm này nhân thêm `RAR.mult`.

### 6.4 Dòng phụ (affix)
Giá trị được random đều trong khoảng, rồi nhân "hệ số dòng phụ" của độ hiếm. Không có hai dòng phụ trùng nhau trên một món.

| Key | Tên hiển thị | Khoảng | Ô được phép |
|---|---|---|---|
| `critC` | Tỉ lệ chí mạng | 2–5% | tất cả |
| `critD` | Sát thương chí mạng | 10–25% | weapon, relic, helm |
| `atkSpd` | Tốc đánh | 4–10% | weapon, relic, helm |
| `move` | Tốc chạy | 3–8% | boots, relic |
| `life` | Hút máu | 1–3% | weapon, relic |
| `cdr` | Giảm hồi chiêu | 4–10% | helm, spell, relic |
| `boss` | Sát thương lên boss | 6–15% | weapon, spell, relic |
| `elite` | Sát thương lên tinh anh | 8–18% | weapon, spell, relic |
| `regen` | Hồi máu mỗi giây | 0.3–0.8% máu tối đa | chest |
| `dodgeCd` | Giảm hồi lăn | 8–20% | boots |
| `gold` | Vàng nhặt được | 8–20% | helm, boots, relic |
| `find` | Tìm đồ hiếm | 5–12% | helm, relic |
| `thorns` | Phản đòn | 10–30% sát thương nhận | chest |
| `potion` | Hiệu quả bình máu | 10–25% | chest, relic |
| `burnC` | Tỉ lệ gây Bỏng | 5–12% | weapon |
| `skillDmg` | Sát thương phép kỹ năng | 6–15% | spell, helm |
| `hpPct` | Máu tối đa | 4–10% | helm, chest, boots |
| `dr` | Giảm sát thương nhận | 2–6% | helm, chest |

**Dòng Vực** (chỉ món Thần Thoại rơi từ Vực mới có; random 1 trong các dòng):
- `abyssDepth`: +1% sát thương cho mỗi tầng đã qua trong lượt này (tối đa +30%)
- `abyssElite`: giết tinh anh thì được thêm 1 lượt bình máu (tối đa bằng số lượt tối đa)
- `abyssAm`: +0.5% sát thương cho mỗi điểm Ám
- `abyssGrave`: nhặt lại mộ thì +20% sát thương cho tới hết lượt

`find` làm tăng tỉ lệ đồ hiếm: mọi trọng số độ hiếm trừ Thường được nhân `(1 + find)`.

### 6.5 Tên đồ (tạo từ dữ liệu)
**Vũ khí:** mỗi hầm có 7 tên, mỗi loại vũ khí 1 tên, kèm sprite.

| Hầm | Kiếm | Búa/Rìu | Giáo | Dao | Cung | Gậy | Sách |
|---|---|---|---|---|---|---|---|
| D1 Mỏ Bỏ Hoang | Kiếm Gỉ (`weapon_rusty_sword`) | Cuốc Chim (`weapon_hammer`) | Giáo Đường Ray | Dao Đẽo | Cung Gỗ Thông | Gậy Đèn Mỏ (`weapon_red_magic_staff`) | Sổ Ghi Ca |
| D2 Thư Viện Ngập Nước | Kiếm San Hô (`weapon_regular_sword`) | Búa Bìa Sách (`weapon_mace`) | Giáo Ngòi Bút | Dao Rọc Giấy | Cung Gáy Sách | Gậy Mực (`weapon_green_magic_staff`) | Sách Ướt |
| D3 Chợ Đêm Dưới Đất | Kiếm Đổi Chác (`weapon_red_gem_sword`) | Rìu Đồ Tể (`weapon_cleaver`) | Giáo Cán Cân | Dao Móc Túi | Cung Đèn Lồng | Gậy Nhang | Sổ Nợ |
| D4 Doanh Trại Băng | Kiếm Sương (`weapon_knight_sword`) | Rìu Phá Băng (`weapon_axe`) | Giáo Lính Gác | Dao Băng | Cung Tuyết Trắng | Gậy Gió Bấc | Nhật Ký Doanh Trại |
| D5 Đáy Giếng | Kiếm Vàng Rỗng (`weapon_golden_sword`) | Búa Bảng Vàng (`weapon_big_hammer`) | Giáo Đáy Giếng | Dao Bóng | Cung Mắt Vực | Gậy Lời Thì Thầm | Sách Không Tên |

Sprite mặc định khi ô bảng không ghi sprite: giáo → `weapon_spear`, dao → `weapon_knife`, cung → `weapon_bow`, sách → icon vẽ bằng code `book`. Mỗi hầm đổi màu sprite theo `dungeon.tint`.

**Giáp:** tên = `[tên theo ô + hệ] + [chất liệu theo hầm]`
- Mũ: Mũ Sắt (Chiến Binh) / Mũ Chóp (Pháp Sư) / Mũ Giáp (Hộ Vệ)
- Giáp: Giáp Xích / Áo Choàng / Giáp Tấm
- Giày: Ủng Da / Giày Vải / Ủng Sắt
- Chất liệu: D1 "Thợ Mỏ", D2 "Thư Viện", D3 "Chợ Đêm", D4 "Băng Giá", D5 "Vực Sâu"
- Ví dụ: "Áo Choàng Thư Viện", "Ủng Sắt Băng Giá"

**Phép:** tên đồ = tên phép. Phép rơi ở hầm nào:
- D1: `fireball`, `whirlwind`, `dashslash`, `stoneshield`
- D2: `icerain`, `chain`, `spring`, `wisps`
- D3: `piercearrow`, `boomerang`, `poisoncloud`, `shadowstep`
- D4: `quake`, `blackhole`, `bladestorm`, `icerain`
- D5: `meteor` + tất cả phép từ D1 tới D4
- Vực: tất cả phép, kể cả 17–20

### 6.6 Đồ độc nhất (Huyền Thoại / Thần Thoại)
Khi rơi một món Huyền Thoại, 40% là **đồ độc nhất có tên** lấy từ pool của hầm đó (cùng ô với món đã chọn, nếu pool có), 60% là đồ thường độ hiếm Huyền Thoại kèm 1 **hiệu ứng ngẫu nhiên** trong pool hiệu ứng chung của Huyền Thoại. Thần Thoại luôn là đồ độc nhất có tên.

**Đồ Huyền Thoại có tên:**
| Key | Tên | Ô / loại | Hầm | Hiệu ứng |
|---|---|---|---|---|
| `u_foremanPick` | Cuốc Của Quản Đốc | weapon/heavy | D1 | Cứ đòn thứ 3 liên tiếp gây thêm địa chấn bán kính 30, sát thương 50% |
| `u_hoaLantern` | Đèn Lồng Của Hòa | relic | D1 | Bán kính sáng +50%; quái đứng trong vùng sáng nhận thêm 10% sát thương |
| `u_vanBrush` | Bút Lông Của Vân | weapon/staff | D2 | Tia phép để lại vệt mực 1.5 s, quái đi qua bị Chậm 30% |
| `u_wetCloak` | Áo Choàng Ướt | chest | D2 | Lăn xong thì miễn sát thương từ đạn trong 1.5 s |
| `u_tiltedScale` | Cân Lệch | relic | D3 | Mỗi 100 vàng nhặt trong lượt: +1% sát thương (tối đa +25%) |
| `u_tailorShears` | Kéo Thợ May | weapon/dagger | D3 | Đòn chí mạng gây Chảy máu |
| `u_captainHelm` | Mũ Đội Trưởng | helm | D4 | Đứng yên 1 s thì nhận khiên 10% máu tối đa (hồi lại sau 6 s) |
| `u_khaSword` | Kiếm Của Kha | weapon/sword | D4 (cốt truyện) | Đòn cuối của combo phóng một sóng kiếm băng bay 100px, gây Chậm |
| `u_goldCrown` | Vương Miện Vàng | helm | D5 | +1% sát thương cho mỗi 10 Ám |
| `u_hungryBoots` | Giày Kẻ Đói | boots | D5 | Nhặt xu hồi 0.5% máu tối đa |
| `u_bookOfNames` | Sổ Tên | weapon/tome | D2, D5 | +3% sát thương cho mỗi Kẻ Ở Lại đã tha (lưu vĩnh viễn) |

**Pool hiệu ứng chung của Huyền Thoại** (cho đồ Huyền Thoại không tên):
- Giết quái thì 10% tỉ lệ nổ bán kính 20, gây 40% sát thương
- Lăn xong thì đòn kế tiếp +50% sát thương
- Dưới 30% máu thì +20% tốc đánh
- Khi vào phòng chiến đấu nhận khiên 8% máu tối đa
- Phép trúng quái thì giảm 0.5 s hồi chiêu của phép còn lại
- Mỗi 10 quái bị giết thì hồi 5% máu

**Đồ Thần Thoại** (chỉ rơi ở độ khó Điên, Ác Mộng, hoặc ở Vực từ tầng 20):
| Key | Tên | Ô / loại | Hiệu ứng |
|---|---|---|---|
| `m_farmThrone` | Ngai Vua Farm | relic | +40% mọi sát thương; cứ mỗi phòng dọn xong thì +1 Ám |
| `m_abyssHeart` | Trái Tim Vực | chest | Hồi sinh 1 lần mỗi lượt với 50% máu; sau khi hồi sinh, máu tối đa −20% tới hết lượt |
| `m_namelessBlade` | Thanh Kiếm Không Tên | weapon/sword | +2% sát thương cho mỗi Chủ Cũ đã mở đủ 5 mảnh ký ức |
| `m_echoStaff` | Gậy Tiếng Vọng | weapon/staff | Cứ tia thứ 5 thì tách thành 5 tia tỏa quạt |
| `m_fallingStarBow` | Cung Sao Rơi | weapon/bow | Mũi tên chí mạng gọi một thiên thạch nhỏ (bán kính 20, 60% sát thương) |
| `m_graveBoots` | Giày Mộ | boots | Lăn để lại vùng độc bán kính 16 trong 2 s |

### 6.7 Di vật thường (ô `relic`)
Dòng chính là hiệu ứng cố định, giá trị nhân `RAR.mult`.

| Key | Tên | Dòng chính (cấp Thường) |
|---|---|---|
| `r_copperRing` | Nhẫn Đồng | +4% tỉ lệ chí mạng |
| `r_windCharm` | Bùa Gió | +6% tốc chạy |
| `r_wolfFang` | Răng Sói | +2% hút máu |
| `r_hourglass` | Đồng Hồ Cát | +8% giảm hồi chiêu |
| `r_goldPouch` | Túi Vàng | +15% vàng |
| `r_catEye` | Mắt Mèo | +8% tìm đồ hiếm |
| `r_phoenixDown` | Lông Phượng | +20% hiệu quả bình máu |
| `r_angerStone` | Đá Giận | Dưới 30% máu thì +20% sát thương |

### 6.8 Rơi đồ
- **Cấp đồ** (`ilvl`) = cấp quái + random nguyên trong [−1, +1], kẹp trong [1, 60]. Ở Vực từ tầng 76 trở đi, `ilvl` có thể tới 70.
- **Chọn ô** khi rơi đồ: weapon 30%, spell 20%, helm 13%, chest 13%, boots 12%, relic 12%.
- **Trọng số độ hiếm theo độ khó** (Thường / Hiếm / Sử Thi / Huyền Thoại / Thần Thoại):
  - Dễ: 80 / 18 / 2 / 0 / 0
  - Thường: 65 / 28 / 6 / 1 / 0
  - Khó: 45 / 38 / 13 / 3.5 / 0.5
  - Điên: 25 / 42 / 23 / 8 / 2
  - Ác Mộng: 10 / 40 / 32 / 14 / 4
  - Vực: nội suy tuyến tính từ "Thường" ở tầng 1 tới 5 / 35 / 35 / 19 / 6 ở tầng 60, giữ nguyên từ đó trở đi
  - Thần Thoại có trọng số > 0 ở bảng trên nhưng vẫn chỉ được phép rơi ở Điên, Ác Mộng, hoặc Vực từ tầng 20; ngoài các trường hợp đó, Thần Thoại chuyển thành Huyền Thoại.
- **Nguồn rơi:**
  - Quái thường: 100% có vàng; 2% rơi đồ; 6% rơi quả cầu máu
  - Tinh anh: 25% rơi đồ (độ hiếm được tăng 1 bậc trọng số, tức dùng bảng của độ khó cao hơn 1 bậc), vàng ×4
  - Mini boss: chắc chắn 1 món, tối thiểu Hiếm
  - Boss: chắc chắn 1 món, tối thiểu Hiếm (Khó trở lên thì tối thiểu Sử Thi), cộng rương cuối hầm
  - Rương cuối hầm: Dễ 1 món, Thường 2, Khó 2, Điên 3, Ác Mộng 4
  - Phòng rương: 1 món
  - Thùng gỗ phá được: 30% rơi ít vàng
- **Vàng rơi mỗi quái thường:** `round(2 * G(L) * rand(0.8, 1.2) * diff.loot * (1 + gold))`. Tinh anh ×4, mini boss ×20, boss ×50.
- **XP mỗi quái thường:** `round(4 * L^1.2 * diff.xp)`. Tinh anh ×3, mini boss ×12, boss ×30. Xong một chương cốt truyện thưởng thêm `xpNeed(level hiện tại) * 0.5`.
- Đồ rơi nằm trên sàn, phát sáng theo màu độ hiếm, có tên nổi phía trên; nhặt bằng cách đi vào và bấm **F**. Nhặt xong hiện thông báo ở góc màn hình. Đồ nhặt trong lượt đi vào **túi lượt chơi** (`run.loot`), về tới thị trấn mới chuyển vào túi đồ chính (mục 8.6).

### 6.9 Lò Rèn: nâng cấp
- Mỗi món có số ô nâng cấp theo độ hiếm (6.2). Mỗi lần nâng cấp, người chơi **chọn 1 dòng** để tăng:
  - Dòng chính: +10% giá trị gốc của dòng chính
  - Một dòng phụ: +25% giá trị đã random của dòng đó
- **Không hoàn tác được.** Trước khi xác nhận phải hiện bản xem trước (giá trị cũ → giá trị mới).
- Giá nâng cấp (vàng), với `i` là số lần đã nâng cấp món này:
  `upgradeCost(it, i) = round(40 * G(it.ilvl) * RAR[it.rar].mult * (i + 1)^1.6)`
- Lưu lại lịch sử: `it.upg = ["main", "critC", ...]`.

### 6.10 Lò Rèn: rèn lại
- Chọn 1 dòng phụ để random lại (key mới và giá trị mới, không trùng các dòng còn lại). Các lần nâng cấp đã dồn vào dòng đó bị mất.
- Giá: mảnh ký ức theo độ hiếm [Thường —, Hiếm 2, Sử Thi 5, Huyền Thoại 12, Thần Thoại 30] cộng thêm `20 * G(ilvl)` vàng.
- Hiệu ứng độc nhất không rèn lại được.

### 6.11 Giải phóng & bán
- **Giải phóng** (thay cho "phân rã"): món đồ biến mất, trả **Mảnh Ký Ức** theo độ hiếm (6.2), đồng thời tính là đã "gặp" Chủ Cũ của món đó (mục 12).
- **Bán** ở Chợ: `sellPrice = round(6 * G(ilvl) * RAR.mult^2)` vàng.
- Có nút **"Giải phóng hàng loạt"** theo độ hiếm (chỉ những món không khóa). Món đang **khóa** (`locked`) thì không bán, không giải phóng được.

---

## 7. QUÁI & BOSS

### 7.1 Công thức chỉ số quái
```
hp    = hpK * 28 * G(L) * diff.hp   * (elite ? 3   : 1)
dmg   = dmgK * 12 * G(L) * diff.dmg * (elite ? 1.5 : 1)
speed = spd (px/s)
```
`L` = cấp quái (mục 8.4).

### 7.2 Các mẫu hành vi (`ai` key)
Mỗi hành vi là một máy trạng thái, dùng chung các trạng thái `idle → approach → windup (báo nguy hiểm) → attack → recover`. Tham số nằm trong `params` của quái.

| Key | Hành vi |
|---|---|
| `chaser` | Đuổi người chơi; vào tầm `range` thì gồng `windup` giây (sprite nháy đỏ) rồi đánh hình quạt `arc` độ, sau đó nghỉ `recover` giây |
| `shooter` | Giữ khoảng cách [min, max], đi ngang qua lại; mỗi `cd` giây gồng 0.4 s rồi bắn theo `pattern` |
| `lobber` | Ném vật bay vòng cung tới vị trí người chơi; có vòng tròn đỏ ở điểm rơi trong `flight` giây; nổ bán kính `r` |
| `bomber` | Lao tới; khi cách < 20px thì nháy trắng 0.8 s rồi nổ bán kính `r` (vụ nổ này gây sát thương cả cho quái khác) |
| `charger` | Đứng lại, vạch đường đỏ 0.6 s, lao thẳng 300 px/s; đâm vào tường thì tự choáng 1 s |
| `splitter` | Như `chaser`; chết thì tách thành `n` con nhỏ (`childId`) |
| `stealth` | Gần như tàng hình (độ trong 0.12) cho tới khi người chơi cách < 50px, rồi hiện ra và lao tới |
| `thief` | Đánh trúng thì cướp `stealPct` vàng của lượt chơi rồi bỏ chạy; giết được thì rơi lại số vàng đó ×1.5; sau 8 s chưa bị giết thì biến mất cùng số vàng |
| `mimic` | Đứng im giả làm rương; người chơi lại gần < 30px thì bật dậy |
| `summoner` | Giữ khoảng cách; mỗi `cd` giây gọi 2 `minionId` (tối đa 4 con cùng lúc) |
| `turret` | Đứng một chỗ, bắn theo `pattern` (vòng tròn, xoắn ốc, hoặc nhắm thẳng) |
| `shielder` | Đuổi chậm, xoay chậm (2 rad/s); khiên phía trước 120° chặn mọi đòn vật lý (đạn và cận chiến); phép xuyên qua khiên |
| `leaper` | Vòng tròn đỏ ở vị trí người chơi 0.7 s rồi nhảy tới, đáp xuống gây sát thương bán kính `r` |
| `pack` | Vây quanh người chơi ở bán kính 60 cùng các con cùng loại, thay phiên nhau lao vào |
| `nova` | Hiện vòng tròn quanh chính nó 1 s rồi nổ bán kính `r`, gây Chậm hoặc Đóng băng |
| `eater` | Đi tới đồ hoặc xu gần nhất trên sàn và ăn mất; mỗi lần ăn +20% máu và +10% kích thước; chết thì nhả lại mọi thứ đã ăn ×1.2 |
| `laser` | Vạch tia 0.8 s, bắn tia 0.4 s, tia quét xoay 60° |

**Kiểu đạn** (`pattern`): `aimed(n, spreadDeg)`, `ring(n)`, `spiral(n, rotSpeed)`, `burst(n, interval)`. Đạn quái mặc định: bán kính 3, tốc độ 120 px/s, màu đỏ có lõi trắng và phát sáng.

**Quy tắc công bằng:**
- Quái chỉ hiện ra sau vòng tròn báo 0.7 s.
- Không đòn nào gây quá 35% máu tối đa của người chơi khi đang mặc đồ đúng cấp ở độ khó Thường.
- Số đạn của quái trên màn hình tối đa 120.

### 7.3 Danh sách quái theo hầm
Cột `hpK` / `dmgK` / `spd` / `cost`: hệ số máu / hệ số sát thương / tốc độ (px/s) / giá ngân sách khi xếp đợt quái.

**D1 · Mỏ Bỏ Hoang** (đổi màu nâu đất `#8a6a4a`)
| Id | Tên | Sprite | `ai` | hpK | dmgK | spd | cost | Tham số |
|---|---|---|---|---|---|---|---|---|
| `mine_goblin` | Yêu Tinh Đào Mỏ | `goblin` | chaser | 0.7 | 0.7 | 70 | 1 | range 14, windup 0.35, arc 90 |
| `mine_slug` | Sên Mỏ | `tiny_slug` | chaser | 0.9 | 0.5 | 30 | 1 | để lại vệt nhớt gây Chậm 20% |
| `mine_skel` | Xương Thợ Mỏ | `skelet` | chaser | 1.0 | 1.0 | 50 | 2 | range 18, windup 0.6, arc 120 |
| `mine_mud` | Bùn Ném Đá | `muddy` | lobber | 0.8 | 0.9 | 35 | 2 | cd 2.2, flight 0.9, r 14 |
| `mine_spark` | Đốm Lửa Mỏ | `imp` | bomber | 0.5 | 2.5 | 80 | 2 | r 26 |

**D2 · Thư Viện Ngập Nước** (đổi màu xanh nước `#4a7a9a`)
| Id | Tên | Sprite | `ai` | hpK | dmgK | spd | cost | Tham số |
|---|---|---|---|---|---|---|---|---|
| `lib_swampy` | Rong Sình | `swampy` | splitter | 1.0 | 0.7 | 55 | 2 | n 2, childId `lib_swampy_s` (hpK 0.4, tách thêm 0 lần) |
| `lib_slug` | Sên Mực | `slug` | chaser | 1.2 | 0.6 | 35 | 1 | vệt mực gây Chậm 30% |
| `lib_drowned` | Người Đọc Chết Đuối | `zombie` | chaser | 1.8 | 1.0 | 40 | 3 | range 16, windup 0.7 |
| `lib_ink` | Yêu Mực | `wogol` | shooter | 0.8 | 0.8 | 50 | 2 | min 60, max 110, cd 1.8, aimed(3, 20) |
| `lib_keeper` | Thủ Thư Phụ | `necromancer` | summoner | 1.2 | 0.6 | 40 | 3 | cd 6, minionId `lib_page` (`tiny_zombie`, chaser, hpK 0.3, spd 90) |

**D3 · Chợ Đêm Dưới Đất** (đổi màu đỏ đèn lồng `#b0503a`)
| Id | Tên | Sprite | `ai` | hpK | dmgK | spd | cost | Tham số |
|---|---|---|---|---|---|---|---|---|
| `mkt_thief` | Kẻ Móc Túi | `goblin` (đổi màu tím) | thief | 0.7 | 0.6 | 95 | 2 | stealPct 0.1 |
| `mkt_mask` | Mặt Nạ Cười | `masked_orc` | stealth | 1.1 | 1.3 | 60 | 2 | lao 220 px/s |
| `mkt_lantern` | Đèn Lồng Bí | `pumpkin_dude` | chaser | 1.0 | 0.8 | 50 | 2 | để lại vệt lửa 2 s, mỗi giây gây 0.3 dmg |
| `mkt_mimic` | Rương Giả | `chest_mimic_open_anim` | mimic | 2.0 | 1.4 | 70 | 3 | chỉ xuất hiện ở phòng rương, tỉ lệ 15% |
| `mkt_fortune` | Thầy Bói | `orc_shaman` | shooter | 0.9 | 0.9 | 45 | 2 | min 70, max 120, cd 2.4, đạn tự đuổi chậm (rẽ tối đa 1.5 rad/s) |

**D4 · Doanh Trại Băng** (đổi màu băng `#9ad0f0`)
| Id | Tên | Sprite | `ai` | hpK | dmgK | spd | cost | Tham số |
|---|---|---|---|---|---|---|---|---|
| `ice_shield` | Lính Khiên | `orc_warrior` | shielder | 1.6 | 1.0 | 40 | 3 | range 16 |
| `ice_zombie` | Lính Băng Xác | `ice_zombie` | chaser | 1.3 | 1.0 | 45 | 2 | đánh trúng gây Chậm 1 s |
| `ice_wolf` | Quỷ Tuyết | `chort` | pack | 0.8 | 0.9 | 100 | 2 | lao 260 px/s, xuất hiện theo nhóm 3 con |
| `ice_archer` | Cung Thủ Tuyết | `elf_m` (đổi màu trắng) | shooter | 0.8 | 1.2 | 50 | 2 | vạch tia nhắm 0.6 s rồi bắn 1 mũi tên 260 px/s |
| `ice_mage` | Pháp Sư Sương | `wizzard_m` (đổi màu xanh) | nova | 1.0 | 1.1 | 40 | 3 | r 40, Đóng băng 0.8 s |

**D5 · Đáy Giếng** (đổi màu tím vàng `#6a3a9a`)
| Id | Tên | Sprite | `ai` | hpK | dmgK | spd | cost | Tham số |
|---|---|---|---|---|---|---|---|---|
| `abyss_hungry` | Kẻ Đói | `big_zombie` | eater | 2.5 | 1.2 | 45 | 4 | |
| `abyss_shade` | Bóng Mạo Hiểm Giả | `necromancer` (tím) | summoner | 1.2 | 0.8 | 45 | 3 | minionId là một quái **ngẫu nhiên từ D1 tới D4**, đổi màu đen |
| `abyss_hand` | Tay Vực | vẽ bằng code | leaper | 0.9 | 1.4 | 0 | 2 | không có thân; trồi lên đúng chỗ báo đỏ rồi lặn xuống |
| `abyss_eye` | Kẻ Canh Vàng | `wogol` (vàng) | laser | 1.0 | 1.3 | 30 | 3 | |
| `abyss_hollow` | Hiệp Sĩ Rỗng | `knight_f` (tím) | chaser | 2.0 | 1.5 | 55 | 4 | combo 3 đòn liền, mỗi đòn windup 0.4 |

**Tinh anh** (`elite`): tỉ lệ theo độ khó (mục 8.4). Viền phát sáng vàng, kích thước ×1.25, kèm 1 thuộc tính (2 thuộc tính ở Ác Mộng và Vực từ tầng 30):
- `fast` (Nhanh): tốc độ +40%
- `shielded` (Có Khiên): khiên bằng 30% máu, hồi lại sau 6 s không bị đánh
- `exploding` (Nổ Khi Chết): nổ bán kính 30 sau 0.8 s
- `regen` (Hồi Máu): hồi 2% máu mỗi giây
- `summoner` (Gọi Bầy): mỗi 5 s gọi 2 quái nhỏ của hầm
- `reflect` (Phản Đòn): phản 15% sát thương
- `blink` (Chớp Nhoáng): mỗi 4 s dịch chuyển tới cạnh người chơi

### 7.4 Mini boss "Kẻ Ở Lại" (mỗi hầm 1 con)
Kích thước ×1.5. Hệ số máu 12, hệ số sát thương 1.4. Trong **cốt truyện**, khi máu xuống ≤ 30% thì trận đấu dừng và mở cảnh thoại tha/giết (mục 11). Trong **Farm và Vực**, mini boss chỉ đánh, không có thoại; tên hiển thị thêm "(Tiếng Vọng)".

| Id | Tên | Sprite | Hầm | Kỹ năng | Vật cần để tha |
|---|---|---|---|---|---|
| `mb_hoa` | Hòa Đèn Lồng | `dwarf_m` (xám) | D1 | Ném đèn lồng (lobber, r 22, để lại vùng lửa 3 s); lao (charger) | **Đèn Lồng Vỡ** (đồ cốt truyện, nằm trong phòng rương của hầm) |
| `mb_van` | Vân Bút Lông | `wizzard_f` (xanh) | D2 | Bắn quạt 5 tia; vẽ vòng mực (nova, gây Chậm) | **Trang Thư Ướt** |
| `mb_lua` | Lụa Thợ May | `elf_f` (đỏ) | D3 | Ném kéo theo vòng 8 hướng (ring 8); trói chỉ (kéo người chơi lại 40px) | **Cuộn Chỉ Đỏ** |
| `mb_captain` | Đội Trưởng Sắt | `knight_m` (bạc) | D4 | Khiên trước mặt + nện đất (r 36); gọi 2 Lính Khiên | **Huy Hiệu Gác Cổng** |
| `mb_runnerup` | Á Quân | `lizard_m` (vàng) | D5 | Bắt chước 2 phép ngẫu nhiên của người chơi; lướt chém | **Tấm Bảng Hạng Hai** |

### 7.5 Boss (mỗi hầm 1 con)
Kích thước ×2. Hệ số máu 40, hệ số sát thương 1.6. Có thanh máu boss ở cạnh trên màn hình. Mỗi khi qua mốc máu sang pha mới: boss bất tử 1.2 s, rung màn hình, âm `boss_phase`, hiện tên pha. Trong mỗi pha, boss lần lượt dùng các đòn của pha đó, nghỉ 0.8–1.2 s giữa hai đòn.

**D1 · Quản Đốc Cuốc** (`ogre`, cầm `weapon_big_hammer`)
- Pha 1 (100–60%):
  - **Nện Cuốc:** vạch đường đỏ dài 120px trong 0.8 s, rồi đường đó nổ
  - **Đá Rơi:** 6 vòng tròn đỏ quanh người chơi, 1 s sau đá rơi (r 16)
  - **Húc:** như `charger`
- Pha 2 (60–25%): thêm **Gọi Thợ** (3 Yêu Tinh Đào Mỏ) và **Xe Goòng** (2 xe chạy ngang phòng theo 2 hàng có báo đỏ trước 1 s)
- Pha 3 (25–0%): nhanh hơn 25%; Nện Cuốc đánh 3 lần liên tiếp

**D2 · Thủ Thư Chìm** (`necromancer`, đổi màu xanh, kích thước ×2.2)
- Pha 1:
  - **Trang Bay:** spiral(6, 1.2 rad/s) trong 3 s
  - **Mực Xoáy:** ring(16) bắn 3 đợt
  - **Dịch Chuyển:** biến mất rồi hiện ở góc khác của phòng
- Pha 2: thêm **Nước Dâng**. Một nửa phòng (trái hoặc phải, báo trước 1.5 s) ngập nước 4 s, đứng trong nước thì Chậm 50% và mất 3% máu mỗi giây
- Pha 3: thêm **Sổ Tên**: ghim một cột sáng vào người chơi, 2 s sau nổ r 30 (phải chạy ra)

**D3 · Ông Chủ Cân** (`big_demon`, đổi màu vàng)
- Cơ chế đặc biệt: hai **đĩa cân** đứng ở hai bên phòng (vật thể có máu, không chết hẳn). Đánh vào đĩa nào thì cân lệch về phía đó. Lệch quá 60% thì xu vàng rơi như mưa ở **phía nhẹ hơn** (vùng nguy hiểm), và boss nhận thêm 30% sát thương trong 5 s.
- Pha 1:
  - **Ném Xu:** aimed(5, 30)
  - **Cái Giá:** vòng tròn đỏ lớn quanh boss r 50
- Pha 2 (50%): **Giao Kèo**. Game dừng lại, hiện lựa chọn: "Đổi 30% máu tối đa lấy ×2 sát thương tới hết trận" hoặc "Từ chối". Chấp nhận thì +8 Ám. Sau đó boss dùng thêm **Mưa Xu** (burst ring 12 × 3)

**D4 · Kha, Kẻ Ở Lại** (dùng chính sprite anh hùng mà người chơi chọn nhưng là bản giới tính kia, đổi màu xanh băng, kích thước ×1.6)
- Bắt chước người chơi:
  - **Lướt Chém** của Kha
  - **Lốc Xoáy** của Kha
  - **Sóng Kiếm Băng:** quạt 3 sóng
  - **Mưa Băng** của Kha (6 vòng tròn đỏ)
- Pha 2 (50%): trong cốt truyện, game dừng lại để mở thoại thuyết phục (mục 11, chương 4). Ở Farm, Kha dùng thêm **Bão Tuyết**: sàn đóng băng (chạy trượt, có quán tính), ring(12) mỗi 3 s.

**D5 · Vua Farm / Người Đứng Đầu** (`big_demon`, đổi màu tím vàng, kích thước ×2.5, đầu đội vương miện vẽ bằng code)
- Pha 1 "Vua":
  - **Kiếm Vàng:** 3 vạch chém đỏ nối tiếp
  - **Ném Huyền Thoại:** ném đồ phát sáng theo aimed(3, 25)
  - **Gọi Á Quân** (bóng mờ, máu thấp)
- Pha 2 "Bảng Vàng": nền phòng chia thành 9 ô; mỗi lần 6 ô sáng đỏ rồi nổ, 3 ô an toàn
- Pha 3 "Vực": boss chìm xuống sàn, chỉ còn **Trái Tim** (vật thể đứng im) cùng các **Tay Vực** trồi lên liên tục. Đánh Trái Tim tới 0 máu. Trong cốt truyện, chạy kết thúc theo mục 11.

**Boss riêng của Vực:** `abyss_maw` **Cái Miệng** (`big_zombie`, đen, kích thước ×3). Xuất hiện ở tầng 25, 50, 75...
- **Hút:** hút người chơi lại gần trong 2 s
- **Phun:** ring(20)
- **Nhai:** vòng tròn đỏ r 40 quanh nó
- Ăn mất các đồ rơi trên sàn (giống `eater`)

---

## 8. HẦM NGỤC, PHÒNG, SINH TẦNG, ĐỘ KHÓ, HÌNH PHẠT KHI CHẾT

### 8.1 Định nghĩa một hầm (dữ liệu)
```js
DUNGEONS.mine = {
  id: "mine", name: "Mỏ Bỏ Hoang", chapter: 1, baseLevel: 1,
  tint: "#8a6a4a", ambientDark: 0.55, music: "mine",
  floorTiles: ["floor_1","floor_2","floor_3"], wallBanner: "wall_banner_red",
  enemyPool: [ {id:"mine_goblin", w:5}, {id:"mine_slug", w:3}, {id:"mine_skel", w:3},
               {id:"mine_mud", w:2}, {id:"mine_spark", w:2} ],
  miniboss: "mb_hoa", boss: "boss_foreman",
  rooms: { combat:["mine_c1","mine_c2","mine_c3","mine_c4"], chest:["any_chest1"],
           miniboss:["any_mb1"], boss:["mine_boss"], start:["any_start"], event:["mine_e1"] },
  layout: { mainRooms: 7, branches: [1,2], wavesPerRoom: [2,3] },
  lootPool: { weapons: WEAPON_NAMES.mine, spells: ["fireball","whirlwind","dashslash","stoneshield"],
              uniques: ["u_foremanPick","u_hoaLantern"] },
  story: "ch1"          // id kịch bản cốt truyện dùng khi chơi ở chế độ Cốt truyện
};
```

### 8.2 Mẫu phòng (vẽ bằng chuỗi ký tự)
Kích thước phòng: chiến đấu 17×13 hoặc 21×15; rương 11×9; mini boss 19×15; boss 25×19; phòng đầu 11×9.

**Ký hiệu ô:**
| Ký tự | Ý nghĩa | Đi qua | Đạn bay qua |
|---|---|---|---|
| `#` | Tường | không | không |
| `.` | Sàn | có | có |
| `o` | Cột hoặc tảng đá | không | không |
| `~` | Nước, hố, vực | không | có |
| `^` | Gai (cứ 2 s bật lên 0.6 s, gây 8% máu tối đa) | có | có |
| `c` | Thùng gỗ phá được | không | không (đánh 2 lần thì vỡ) |
| `T` | Đuốc (đặt trên tường `#`, là nguồn sáng) | — | — |
| `s` | Điểm xuất hiện quái ưu tiên | có | có |
| `*` | Vị trí rương / đồ cốt truyện | có | có |
| `N` | NPC hoặc điểm sự kiện | có | có |
| `B` | Vị trí boss xuất hiện | có | có |

**Cửa:** không vẽ trong mẫu phòng. Bộ sinh tầng tự đục **lỗ cửa rộng 3 ô ở giữa cạnh** hướng về phòng bên cạnh. Mẫu phòng phải để trống (là `.`) 3 ô ở giữa mỗi cạnh, ngay phía trong tường, để cửa mở ra không bị chặn.

Ví dụ `mine_c1` (17×13):
```
#################
#...............#
#..o.........o..#
#.......s.......#
#...c.......c...#
#.....^^^^^.....#
#...s.......s...#
#.....^^^^^.....#
#...c.......c...#
#.......s.......#
#..o.........o..#
#...............#
#################
```
Mỗi hầm cần tối thiểu: 4 phòng chiến đấu, 1 phòng sự kiện, dùng chung phòng đầu, phòng rương, phòng mini boss, và 1 phòng boss riêng. Người code tự vẽ thêm các mẫu theo đúng ký hiệu và luật cửa ở trên.

### 8.3 Thuật toán sinh tầng: `generateFloor(dungeonDef, rng, opts)`
1. Lưới **5×5 ô lưới**, mỗi ô lưới rộng **30×24 tile**.
2. Đặt phòng đầu ở một ô lưới ngẫu nhiên. Đi ngẫu nhiên sang ô kề (không quay lại ô đã đi) cho tới khi đường chính đủ `mainRooms` phòng. Đi vào ngõ cụt thì làm lại (tối đa 50 lần, sau đó giảm `mainRooms` đi 1).
3. Loại phòng trên đường chính: `[start, combat, combat, ..., miniboss, boss]`. Phòng chiến đấu ở giữa đường có 25% thành phòng `event` (sự kiện, NPC hoặc giếng hồi máu).
4. **Nhánh phụ:** chọn số nhánh theo `branches`. Mỗi nhánh gắn một ô lưới trống kề với một phòng chiến đấu, loại phòng là `chest` (70%) hoặc `event` (30%).
5. Mỗi phòng lấy một mẫu từ `rooms[type]`, đặt vào **giữa** ô lưới của nó.
6. **Hành lang:** nối tâm cửa của hai phòng kề nhau bằng đường thẳng rộng 3 tile (hai ô lưới kề nhau luôn cùng hàng hoặc cùng cột nên đường luôn thẳng). Viền hành lang là tường.
7. Gộp tất cả vào **một bản đồ ô lớn duy nhất** (`floor.tiles`, mảng 2 chiều). Lưu `floor.rooms[]` gồm vị trí trong lưới, hình chữ nhật phòng trong bản đồ (tile), loại phòng, các cửa và trạng thái.
8. Ở Vực, phòng boss chỉ có ở tầng chia hết cho 5; các tầng khác thì phòng cuối là `stairs` (cầu thang `floor_ladder`).
9. Mọi ngẫu nhiên đi qua `rng` (mulberry32) có seed, để một seed luôn sinh ra cùng một tầng.

### 8.4 Độ khó
| Key | Tên | Cộng cấp quái | Máu | Sát thương | Đồ | XP | Tỉ lệ tinh anh | Hồi sinh tại chỗ |
|---|---|---|---|---|---|---|---|---|
| `easy` | Dễ | +0 | ×0.7 | ×0.6 | ×0.7 | ×0.8 | 0% | 1 lần |
| `normal` | Thường | +3 | ×1.0 | ×1.0 | ×1.0 | ×1.0 | 3% | 1 lần |
| `hard` | Khó | +6 | ×1.5 | ×1.3 | ×1.4 | ×1.3 | 8% | 0 |
| `insane` | Điên | +9 | ×2.2 | ×1.7 | ×2.0 | ×1.7 | 15% | 0 |
| `nightmare` | Ác Mộng | +12 | ×3.2 | ×2.2 | ×3.0 | ×2.2 | 25% | 0 |

- **Cấp quái** = `dungeon.baseLevel + diff.offset + floor(roomIndex / 3)`, với `roomIndex` là thứ tự của phòng trên đường chính.
- **Cấp gốc các hầm:** Mỏ 1, Thư Viện 11, Chợ Đêm 22, Doanh Trại 34, Đáy Giếng 46.
- **Mở khóa:** xong chương cốt truyện thì hầm đó mở ở Farm với độ khó Dễ và Thường. Độ khó tiếp theo mở khi đã thắng độ khó trước của **cùng hầm** và cấp người chơi ≥ (cấp quái của độ khó đó − 3).
- **Ngân sách quái mỗi phòng chiến đấu** = `6 + 2*roomIndex` (Vực cộng thêm `floor(tầng/5)`). Mỗi đợt dùng khoảng một nửa ngân sách còn lại (đợt cuối dùng hết). Chọn quái theo trọng số trong `enemyPool`, chỉ chọn con có `cost` ≤ ngân sách còn lại. Đợt sau bắt đầu khi số quái còn sống ≤ 1.

### 8.5 Diễn tiến trong một phòng
1. Người chơi đi vào sâu 2 tile tính từ mép phòng → cửa đóng lại (cửa thành ô cứng, âm `door_close`), bắt đầu đợt 1.
2. Quái xuất hiện ở các điểm `s`. Thiếu điểm `s` thì chọn ô sàn ngẫu nhiên cách người chơi ≥ 48px. Mỗi con có vòng tròn báo 0.7 s trước khi hiện.
3. Hết các đợt → cửa mở, âm `room_clear`, phòng tính là đã dọn. 20% tỉ lệ hiện một rương nhỏ (ít vàng + 1 món, độ hiếm theo bảng của độ khó). Tự hút hết xu còn trên sàn về người chơi.
4. **Bản đồ nhỏ** ở góc trên phải: hiện các phòng đã vào, kèm các phòng kề chúng (vẽ mờ); có biểu tượng rương, boss, cầu thang.
5. Phòng mini boss và phòng boss: vào thì đóng cửa, chạy đoạn giới thiệu (tên boss bay vào 1.5 s), xong mới đánh.
6. Trước cửa phòng boss có **giếng hồi máu**: dùng một lần, +1 lượt bình máu.

### 8.6 Kết thúc lượt chơi & hình phạt khi chết
- **Thắng** (giết boss) → mở rương cuối → hiện bảng tổng kết (thời gian, số quái đã giết, vàng, XP, danh sách đồ) → nút "Về thị trấn". Mọi thứ trong `run.loot` và `run.gold` chuyển vào tài khoản.
- **Bỏ cuộc** (menu tạm dừng → "Rời hầm"): xử lý giống chết.
- **Chết:** nếu còn lượt hồi sinh tại chỗ (Dễ, Thường) → hiện bảng "Đứng dậy?" → hồi sinh tại chỗ với 50% máu, bất tử 2 s, các quái quanh bán kính 60 bị đẩy lùi. Hết lượt hồi sinh thì áp hình phạt:

| Độ khó | Đồ nhặt trong lượt | Vàng nhặt trong lượt | Khác |
|---|---|---|---|
| Dễ | giữ hết | giữ hết | — |
| Thường | giữ hết | mất 10% | — |
| Khó | giữ hết | mất 50% | — |
| Điên | mất hết | mất hết | vẫn giữ XP |
| Ác Mộng | mất hết | mất hết | mất thêm 5% vàng đang có trong tài khoản |
| Vực | để lại trong **Mộ** ở tầng đã chết | để lại trong Mộ | xem mục 9.4 |

- XP **luôn được giữ** (XP được cộng ngay lúc giết quái).
- Đồ cốt truyện không bao giờ bị mất.

---

## 9. VỰC KHÔNG ĐÁY (CHẾ ĐỘ VÔ TẬN)

### 9.1 Cấu trúc tầng
- Mỗi tầng có 4–6 phòng (`mainRooms` = 4 + random 0–2), 0–1 nhánh phụ. Phòng cuối là cầu thang, trừ tầng chia hết cho 5 thì là phòng boss.
- **Pool quái:** quái của mọi hầm. Hầm "chủ đạo" của tầng đổi theo chu kỳ: tầng 1–5 → D1, 6–10 → D2, ..., 21–25 → D5, rồi lặp lại; 50% quái lấy từ hầm chủ đạo, 50% từ hầm bất kỳ. Màu tường và nền theo hầm chủ đạo, nhưng tối hơn 15%.
- **Boss tầng chia hết cho 5:** lần lượt Quản Đốc Cuốc → Thủ Thư Chìm → Ông Chủ Cân → Kha (bản Tiếng Vọng) → Vua Farm (bản Tiếng Vọng), rồi lặp lại. Tầng 25, 50, 75... là **Cái Miệng**.

### 9.2 Độ khó theo tầng
```
monsterLevel(f) = f ≤ 55 ? 5 + f : 60 + (f - 55) * 0.5           // không làm tròn, G nhận số thực
mult(f)         = 1.1 + 0.01 * f                                  // nhân vào cả máu và sát thương quái
eliteRate(f)    = min(0.35, 0.05 + 0.005 * f)
```
Cấp đồ rơi = `min(60, round(monsterLevel))`; từ tầng 76 trở đi, cấp đồ = `min(70, 60 + floor((f - 75) / 5))`.

### 9.3 Giao Kèo (sau mỗi boss, chọn 1 trong 3)
Mỗi Giao Kèo có lợi kèm một cái giá. Hiệu lực tới hết lượt Vực. Giao Kèo **Đen** cộng Ám khi chọn.

| Key | Tên | Lợi | Giá | Đen |
|---|---|---|---|---|
| `p_bloodfire` | Máu Đổi Lửa | +25% sát thương | −15% máu tối đa | |
| `p_greed` | Lòng Tham | +50% vàng, +30% tìm đồ | quái +20% máu | |
| `p_swift` | Chân Nhanh | +20% tốc chạy, hồi lăn −30% | bình máu hồi ít hơn 30% | |
| `p_halfheart` | Nửa Trái Tim | giết quái hồi 2% máu | không dùng được bình máu | |
| `p_twinspell` | Phép Đôi | phép Q được bắn thêm 1 lần sau 0.3 s | hồi chiêu phép +50% | |
| `p_glass` | Thủy Tinh | +60% sát thương | nhận thêm 40% sát thương | |
| `p_iron` | Thân Sắt | +40% máu tối đa | −20% tốc đánh | |
| `p_hunter` | Thợ Săn Tinh Anh | +50% sát thương lên tinh anh | tỉ lệ tinh anh ×2 | |
| `p_dark` | Bóng Tối Dễ Chịu | +35% sát thương | bán kính sáng −40% | ✔ (+3 Ám) |
| `p_hunger` | Cơn Đói | mỗi quái bị giết +0.5% sát thương (tối đa +40%) | mất 1% máu mỗi giây ngoài trận | ✔ (+3 Ám) |
| `p_forget` | Lãng Quên | +1 ô phép tạm thời (phím 3 / nút thêm), lấy một phép ngẫu nhiên | đồ nhặt được không còn Chủ Cũ | ✔ (+5 Ám) |
| `p_echo` | Tiếng Vọng | đòn đánh thường bắn thêm một bóng ma 40% sát thương | quái chết để lại một bóng ma đuổi theo (1 lần đánh trúng rồi tan) | |

Cách chọn 3 Giao Kèo: random không trùng, không lấy lại những Giao Kèo đang có hiệu lực; mỗi lần có ít nhất 1 Giao Kèo không Đen.

### 9.4 Trạm, Mộ, Biến Thể tầng
- **Trạm** (sau boss tầng 10, 20, 30...): phòng an toàn có Ông Lặng (hoặc bóng của ông ấy).
  - Lựa chọn 1: **"Mang đồ lên"**. Kết thúc lượt, giữ hết đồ và vàng, mở khóa Trạm này làm điểm xuất phát.
  - Lựa chọn 2: **"Đi tiếp"**. Tầng kế tiếp nhận hệ số thưởng ×(1 + 0.25 × số Trạm đã đi qua trong lượt), nhân vào vàng và trọng số đồ hiếm (trừ Thường).
- **Xuất phát:** từ tầng 1 hoặc từ một Trạm đã mở khóa (tầng 11, 21, 31...). Xuất phát từ Trạm không được mang Giao Kèo cũ.
- **Mộ:** chết ở Vực thì toàn bộ `run.loot` và `run.gold` chôn vào một Mộ ở tầng đó (lưu trong save). Lần sau tới đúng tầng đó, Mộ xuất hiện trong phòng chiến đấu đầu tiên; đi tới bấm F để nhặt lại tất cả. Trên Mộ có dòng chữ tự sinh: `"<tên nhân vật> nằm đây. Tầng <f>. Đã cầm <tên món tốt nhất>."` Chết lần nữa trước khi nhặt lại thì Mộ cũ mất vĩnh viễn và Mộ mới thay vào.
- **Biến thể tầng:** từ tầng 3, cứ 3 tầng random 1 biến thể (hiện tên ở đầu tầng):
  - **Tối Đen:** bán kính sáng ×0.5
  - **Sàn Băng:** chạy trượt có quán tính
  - **Nổ Dây Chuyền:** quái chết thì nổ nhỏ
  - **Mưa Thiên Thạch:** cứ 4 s có 1 thiên thạch có báo đỏ
  - **Không Bình Máu**
  - **Vàng Đôi:** vàng ×2
  - **Bầy Đàn:** ngân sách quái ×1.5, quái −30% máu
- **Kỷ lục:** lưu tầng sâu nhất và thời gian chạy nhanh nhất tới tầng 25. Hiện trên Bảng Vàng ở thị trấn.

### 9.5 Ám ở Vực
- +1 Ám mỗi tầng hoàn thành từ tầng 11 trở đi.
- +Ám khi chọn Giao Kèo Đen (theo bảng 9.3).

---

## 10. THỊ TRẤN & GIAO DIỆN

### 10.1 Bản đồ thị trấn (đi bộ được như sảnh của Soul Knight, 40×24 tile, nền `floor_*`, không có quái)
```
########################################
#......................................#
#..[LÒ RÈN]........[BẢNG VÀNG].........#
#....D1..............B.................#
#......................................#
#..[CHỢ XU XU]..............[THƯ VIỆN].#
#....D2.......................D3.......#
#......................................#
#..............(GIẾNG THÁNH)...........#
#..................W...................#
#......................................#
#..[NHÀ]................[CỔNG VỰC].....#
#....H....................V............#
#.........P............................#
########################################
```
| Ký hiệu | Chỗ | Người phụ trách | Chức năng |
|---|---|---|---|
| D1 | Lò Rèn | Bác Đồng | Nâng cấp, rèn lại |
| D2 | Chợ | Xu Xu | Bán đồ, mua bình máu, nâng túi bình, mở rộng túi đồ, quầy đồ bán hằng ngày (3 món random, giá ×4 giá bán) |
| D3 | Thư Viện | Cô Mực | Sổ Ký Ức (Chủ Cũ), Bách Khoa Quái |
| B | Bảng Vàng | Bà Mõ | Chọn hầm và độ khó, kỷ lục Vực, giao nhiệm vụ cốt truyện |
| W | Giếng Thánh | Sư Nến | Reset điểm chỉ số, giảm Ám (−5 Ám, giá `300 * G(cấp)` vàng, tối đa 1 lần mỗi lượt chơi đã hoàn thành) |
| V | Cổng Vực | Ông Lặng | Vào Vực (sau chương 2) |
| H | Nhà | — | Kho đồ (thêm 60 ô), đổi ngoại hình, cài đặt |
| P | Điểm xuất hiện | — | |

NPC đứng trước công trình của mình. Lại gần thì hiện bong bóng "F" (máy tính) hoặc nút bàn tay (điện thoại). Tòa nhà vẽ bằng ô tường và các sprite trang trí của gói 0x72; tên tòa nhà hiện trên `uiCanvas`.

### 10.2 Các màn hình (DOM overlay, CSS phong cách pixel: viền 2px, góc vuông, nền tối trong suốt)
1. **Màn hình tiêu đề:** logo "MINI DUNGEON SLAYER", các nút Tiếp tục / Chơi mới / Cài đặt. Phía sau là cảnh nền một phòng hầm có đuốc chập chờn.
2. **Tạo nhân vật:** nhập tên (tối đa 12 ký tự), chọn 1 trong 4 dáng, chọn nam/nữ, xem trước sprite.
3. **HUD trong hầm** (vẽ trên `uiCanvas`):
   - Góc trên trái: thanh máu (số `hiện tại/tối đa`), thanh khiên, cấp và thanh XP mỏng
   - Dưới thanh máu: số vàng của lượt, số lượt bình máu
   - Góc dưới phải (máy tính): 2 ô phép có vòng hồi chiêu và phím Q/E
   - Góc trên phải: bản đồ nhỏ
   - Giữa trên: thanh máu boss
   - Góc trái giữa màn hình: thông báo nhặt đồ, xếp chồng tối đa 4 dòng
4. **Túi đồ:**
   - Bên trái: 7 ô trang bị và Lực Chiến
   - Bên phải: lưới túi đồ, sắp xếp theo độ hiếm / cấp / ô
   - Rê chuột (máy tính) hoặc chạm (điện thoại) vào một món → chú thích: tên (màu theo độ hiếm), cấp đồ, dòng chính, dòng phụ, hiệu ứng độc nhất, Chủ Cũ và dòng ký ức (in nghiêng), số ô nâng cấp đã dùng / tổng
   - Đang mặc món cùng ô thì chú thích có cột so sánh: số tăng màu xanh lá ▲, số giảm màu đỏ ▼
   - Nút: Trang bị, Khóa, Giải phóng, Bán (chỉ khi đang ở Chợ)
5. **Lò Rèn:** chọn món → các ô nâng cấp → chọn dòng muốn tăng → xem trước → xác nhận. Tab "Rèn lại".
6. **Chỉ số:** cấp, XP, điểm chưa cộng, nút +/− cho Sức Mạnh, Phép Lực, Thể Lực (bấm Xác nhận mới lưu), bảng chỉ số chi tiết (mục 4.4).
7. **Bảng Hầm:** danh sách hầm có ảnh nhỏ; mỗi hầm hiện 5 độ khó có khóa/mở, cấp quái, Lực Chiến khuyên dùng (có màu), đồ độc nhất có thể rơi. Nút "Cốt truyện: Chương X" nếu chương đó chưa xong. Tab "Vực Không Đáy": tầng sâu nhất, các Trạm đã mở, Mộ hiện có.
8. **Sổ Ký Ức:** danh sách Chủ Cũ đã gặp; mỗi người có 5 mảnh ký ức (mảnh đã mở thì hiện chữ, chưa mở hiện "???"), bonus bộ, số món đã gặp.
9. **Hội thoại** (`uiCanvas` hoặc DOM): khung dưới màn hình, chân dung sprite phóng to ×4 bên trái, tên người nói, chữ chạy 40 ký tự/giây (bấm để hiện hết, bấm lần nữa để sang câu tiếp), danh sách lựa chọn có con trỏ.
10. **Tạm dừng:** Tiếp tục, Cài đặt, Rời hầm (có hỏi xác nhận, ghi rõ hình phạt sẽ bị áp).
11. **Cài đặt:** âm lượng nhạc, âm lượng hiệu ứng, rung màn hình (bật/tắt), hiện số sát thương, tự nhắm (máy tính), chất lượng hiệu ứng (Thấp/Cao, Thấp giới hạn 150 hạt), xuất/nhập file lưu (chuỗi base64 để chuyển giữa máy tính và điện thoại), xóa dữ liệu (hỏi xác nhận 2 lần).
12. **Tổng kết lượt chơi**, **Chọn Giao Kèo**, **Trạm** (mục 9).

---

## 11. CỐT TRUYỆN ĐẦY ĐỦ (KỊCH BẢN)

### 11.1 Nhân vật
- **Người chơi** (tên tự đặt, mặc định "Mini"): mọi người gọi là "nhóc". Ít nói; trong lựa chọn thoại mới thấy rõ tính cách.
- **Kha:** anh trai của người chơi. Từng là đứa trẻ lúc nào cũng muốn "mạnh hơn một chút". Xuống Vực 3 tháng trước.
- **Bà Mõ:** trưởng thị trấn, giữ Bảng Vàng. Hiền hậu, nhưng biết sự thật.
- **Bác Đồng:** thợ rèn cục cằn, tốt bụng, hay nói "đồ tốt thì phải có người dùng".
- **Xu Xu:** mèo buôn, nói giọng mời chào, đếm tiền rất nhanh; đứng về phía người chơi vào chương 3.
- **Cô Mực:** thủ thư, đeo kính, ghi chép mọi thứ; người đầu tiên nhận ra đồ có "Chủ Cũ".
- **Sư Nến:** giữ Giếng Thánh, nói ít, câu nào cũng như câu đố.
- **Ông Lặng:** gác Cổng Vực, gần như không nói. Thật ra là cha của Hòa.
- **Bé Tí:** đứa trẻ hay hỏi "hôm nay anh/chị mang gì lên?"; phản ứng với mức Ám.

### 11.2 Cách viết kịch bản (dữ liệu, chạy bằng `Story.run(scriptId)`)
Mỗi kịch bản là một mảng lệnh:
```js
STORY.ch1_intro = [
  { cmd:"fade", to:1 },
  { cmd:"say", who:"narrator", text:"Thị trấn Miệng Giếng. Nơi người ta sống nhờ những thứ được mang lên." },
  { cmd:"fade", to:0 },
  { cmd:"say", who:"mo", text:"Lại một đứa nhóc mang ba lô to hơn người. Con xuống đây làm gì?" },
  { cmd:"choice", text:"", options:[
      { label:"Con tìm anh Kha.", set:{ askedKha:true }, goto:"kha" },
      { label:"Con muốn lên Bảng Vàng.", add:{ am:1 }, goto:"board" } ] },
  { label:"kha" }, { cmd:"say", who:"mo", text:"Kha... Bà nhớ thằng bé. Nó cười to lắm." }, { cmd:"goto", to:"end" },
  { label:"board" }, { cmd:"say", who:"mo", text:"Ai cũng muốn thế. Lúc đầu." },
  { label:"end" },
  { cmd:"give", item:"story_letter" },
  { cmd:"setFlag", key:"ch1_started", value:true },
  { cmd:"unlock", what:"dungeon", id:"mine", mode:"story" }
];
```
**Các lệnh** (`Story` phải hỗ trợ đủ):
- Thoại, chọn: `say {who, text}`, `choice {text, options:[{label, set?, add?, goto?, cond?}]}`
- Luồng: `label`, `goto {to}`, `if {cond, then:[...], else:[...]}`
- Trạng thái: `setFlag {key, value}`, `addAm {n}`
- Đồ: `give {item}` (đồ cốt truyện hoặc đồ độc nhất), `take {item}`
- Hình, tiếng: `fade {to}`, `shake {power}`, `sfx {key}`, `music {key}`, `wait {t}`, `portrait {who, mood}`
- Cảnh: `spawnNpc {id, x, y}`, `moveNpc {id, x, y, t}`, `removeNpc {id}`, `camera {x, y, t}`
- Trận đấu: `startFight {bossId}`, `resumeFight`, `endFight {result: "spare"|"kill"}`
- Mở khóa, kết thúc: `unlock {what, id, mode}`, `ending {id}`, `xp {n}`, `gold {n}`
- **`cond`** là chuỗi biểu thức đơn giản, ví dụ `"flags.hasLantern && am < 50"`. Đánh giá bằng một hàm thay `flags.x`, `am`, `level`, `hasItem('id')` vào giá trị thật. **Không dùng `eval` trực tiếp trên chuỗi tùy ý**, chỉ cho phép các tên này cùng các phép `&& || ! < > <= >= ==` và số.
- `who` là một key trong `CHARACTERS` (tên hiển thị, sprite chân dung, màu tên). `narrator` thì không có chân dung, chữ in nghiêng.
- Chuỗi `{name}` trong `text` được thay bằng tên nhân vật người chơi.

**Móc kịch bản vào hầm:** `STORY_HOOKS[chapterId] = { onEnterDungeon, onRoom: { [roomType]: scriptId }, onMinibossLow: scriptId, onBossPhase: { [phaseIndex]: scriptId }, onBossDead, onExit }`.

### 11.3 Mở đầu (bắt buộc, kiêm hướng dẫn chơi)
- *Cảnh 1 · tối đen:*
  - Narrator: "Ba tháng trước, anh Kha gửi về một lá thư."
  - Narrator (chữ thư): "'Nhóc à, đồ dưới Vực đẹp lắm. Anh xuống thêm một tầng nữa thôi. Một tầng nữa là anh lên Bảng Vàng.'"
  - Narrator: "Đó là lá thư cuối cùng."
- *Cảnh 2 · thị trấn, nhạc vui:* người chơi xuất hiện ở điểm P. Bà Mõ đi tới.
  - Bà Mõ: "Lại một đứa nhóc mang ba lô to hơn người."
  - Chọn: [Con tìm anh Kha] / [Con muốn lên Bảng Vàng (+1 Ám)]
  - Tìm Kha → Bà Mõ: "Kha... Bà nhớ thằng bé. Nó cười to lắm. Nhưng Vực không trả lại người, nhóc ạ. Nó chỉ trả lại đồ."
  - Bảng Vàng → Bà Mõ: "Ai cũng muốn thế. Lúc đầu."
  - Bà Mõ: "Muốn xuống dưới thì phải có đồ. Ghé Bác Đồng đi."
- *Hướng dẫn:* mũi tên chỉ đường tới Lò Rèn.
  - Bác Đồng: "Tay không mà đòi xuống hầm à? Cầm lấy." (tặng vũ khí khởi đầu theo dáng nhân vật)
  - Bác Đồng: "Đồ tốt thì phải có người dùng. Đồ dưới đó... cũng từng có người dùng."
  - Hiện hướng dẫn cách đánh, lăn, dùng phép (theo máy tính hoặc điện thoại)
- *Xu Xu:* "Meo! Khách mới! Tặng ba bình máu, lần sau nhớ mua nhé, meo." (giải thích bình máu)
- *Bà Mõ ở Bảng Vàng:* "Mỏ Bỏ Hoang ở phía đông. Chỗ đó dễ. Ít người chết ở đó lắm." → mở Chương 1.

### 11.4 Chương 1 · Mỏ Bỏ Hoang: "Người Vẫn Còn Đào"
- **Vào hầm (cốt truyện):** Narrator: "Không khí ở đây có mùi sắt và mùi mồ hôi cũ."
- **Phòng sự kiện đầu tiên:** một bộ xương ngồi dựa tường, cầm cuốc.
  - Lại gần bấm F → Narrator: "Trên tay áo còn khâu một cái tên: 'Tuấn'."
  - Nhặt được đồ cốt truyện **Phù Hiệu Thợ Mỏ** (vật kỷ niệm, không trang bị được)
  - Hiện chú thích lần đầu về Chủ Cũ: "Từ giờ, mỗi món đồ bạn nhặt đều có tên chủ cũ. Xem ở Thư Viện."
- **Phòng rương:** chứa **Đèn Lồng Vỡ** (đồ cốt truyện) cùng 1 món đồ thường.
- **Mini boss Hòa Đèn Lồng:**
  - Khi vào phòng, Hòa: "Ai đó? ...Bố à? Không. Bố không bao giờ xuống đây."
  - Khi Hòa còn ≤ 30% máu, trận đấu dừng lại, Hòa: "Tôi chỉ... muốn tìm cái đèn của tôi. Không có nó tôi không thấy đường về."
  - Lựa chọn:
    - [Trả Đèn Lồng Vỡ] (cần có Đèn Lồng Vỡ) → Hòa: "Nó vỡ rồi... nhưng vẫn là của tôi. Cảm ơn." Hòa tan thành đom đóm. `flags.sparedHoa = true`, −3 Ám. Rơi **Đèn Lồng Của Hòa** (độc nhất) chắc chắn.
    - [Kết liễu] → Hòa: "...Tối quá." `flags.killedHoa = true`, +10 Ám. Rơi 1 món Hiếm.
    - [Bỏ đi] (không có Đèn Lồng Vỡ) → Hòa: "Đi đi. Đừng để như tôi." Hòa biến mất, không tính tha cũng không tính giết. Rơi 1 món Hiếm.
- **Boss Quản Đốc Cuốc:**
  - Lúc vào, Quản Đốc: "CA CỦA MÀY CHƯA HẾT! ĐÀO! ĐÀO TIẾP!"
  - Khi chuyển pha 2: "Bảng Vàng trả theo cân! Một cân quặng một dòng tên!"
  - Khi chết: "...Tôi đã đào bao lâu rồi? Có ai... đếm giùm tôi không?"
- **Sau boss:** trong rương cuối có thêm **Huy Hiệu Của Kha** (đồ cốt truyện).
  - Narrator: "Một huy hiệu bằng đồng. Mặt sau khắc: 'KHA — HẠNG 214'."
- **Về thị trấn:**
  - Bà Mõ: "Hạng 214... Thằng bé đã leo nhanh lắm."
  - Cô Mực tìm tới: "Nhóc, cho chị xem cái phù hiệu đó. ...Cái tên này có trong sổ của chị. Tuấn. Xuống mỏ năm ngoái. Không lên."
  - Cô Mực: "Lạ thật. Đồ nhóc mang lên... đồ nào cũng có tên."
- **Kết chương:** mở Sổ Ký Ức, mở Chương 2, mở Mỏ ở Farm. +XP chương.

### 11.5 Chương 2 · Thư Viện Ngập Nước: "Cuốn Sổ Ướt"
- **Ở thị trấn:** Cô Mực: "Dưới Vực có một thư viện cũ. Người ta bảo ở đó có bản gốc của Sổ Tên, ghi lại mọi người đã xuống. Chị muốn biết anh nhóc có trong đó không."
- **Phòng sự kiện:** một giá sách ướt.
  - Narrator: "Các trang giấy dính vào nhau. Đọc được một dòng: 'Món đồ nhớ người dùng nó lâu hơn người ta nhớ nhau.'"
- **Phòng rương:** chứa **Trang Thư Ướt**.
- **Mini boss Vân Bút Lông:**
  - Khi vào phòng: "Đừng làm ướt sổ! Tôi chép mãi mà chép không kịp!"
  - Khi ≤ 30% máu: "Mỗi ngày lại thêm tên mới. Tôi chép tới quên mất tên mình."
  - Lựa chọn:
    - [Đưa Trang Thư Ướt] → Vân: "...Đây là chữ của tôi. 'Vân'. Tôi tên là Vân." Tha, −3 Ám, rơi **Bút Lông Của Vân**.
    - [Kết liễu] → +10 Ám.
    - [Bỏ đi]
- **Boss Thủ Thư Chìm:**
  - Lúc vào: "Suỵt. Thư viện cần yên lặng. Người chết cũng cần yên lặng."
  - Khi chuyển pha 3: "Ngươi muốn xem tên ai? Tên anh ngươi à? NÓ CHƯA CHẾT. Sổ không ghi người chưa chết."
  - Khi chết: "Ghi giùm ta... một dòng cuối..."
- **Sau boss:** nhặt được **Sổ Tên** (bản rách, đồ cốt truyện; lần đầu tặng kèm đồ độc nhất Sổ Tên ở độ hiếm Huyền Thoại).
  - Narrator: "Mỗi trang là một cái tên, kèm danh sách những món đồ họ mang theo khi xuống."
  - Narrator: "Bạn nhận ra vài món. Bạn đang đeo một món trong số đó."
- **Về thị trấn:**
  - Cô Mực (run giọng): "Đồ rơi trong hầm... là di vật. Mọi món chúng ta mua bán ở chợ."
  - Cô Mực: "Kha chưa có trong sổ. Thủ Thư nói vậy đúng không? Anh nhóc vẫn còn sống."
  - Ông Lặng (lần đầu nói): "Kha đi qua cổng này. Ba tháng trước. Nó bảo tôi: 'Một tầng nữa thôi.'"
  - Ông Lặng: "Ai cũng nói vậy."
- **Kết chương:** mở **Vực Không Đáy** và Chương 3.

### 11.6 Chương 3 · Chợ Đêm Dưới Đất: "Cái Giá"
- **Ở thị trấn:** Xu Xu: "Meo... Chợ của tôi lấy hàng từ một chợ khác. Dưới đất. Tôi chưa bao giờ hỏi họ lấy hàng ở đâu."
- **Phòng sự kiện:** một quầy hàng không người.
  - Trên quầy có tấm bảng: "MUA 1 NGƯỜI — TẶNG 3 MÓN HIẾM."
  - Chọn: [Đập vỡ tấm bảng] (`flags.brokeSign`) / [Bỏ qua]
- **Phòng rương:** chứa **Cuộn Chỉ Đỏ**.
- **Mini boss Lụa Thợ May:**
  - Khi vào: "Ngồi yên, tôi đo cho. Ai xuống đây cũng được may một bộ đồ mới. Một bộ để không bao giờ lên nữa."
  - Khi ≤ 30% máu: "Tôi may áo cho người ta mặc xuống. Tôi chưa từng may áo cho ai mặc đi lên."
  - Lựa chọn:
    - [Đưa Cuộn Chỉ Đỏ] → Lụa: "Chỉ đỏ... để may áo cưới. Tôi đã định lên trên để cưới." Tha, −3 Ám, rơi **Kéo Thợ May**.
    - [Kết liễu] → +10 Ám.
    - [Bỏ đi]
- **Boss Ông Chủ Cân:**
  - Lúc vào: "Khách quý! Bên trái là vàng. Bên phải là người. Cân phải luôn thăng bằng."
  - Pha 2, Giao Kèo: "Ngươi muốn mạnh hơn không? Đưa ta một phần của ngươi." (lựa chọn ở mục 7.5)
  - Khi chết: "Thị trấn của ngươi... gửi người xuống, ta gửi đồ lên. Ngươi nghĩ ai ký hợp đồng này?"
- **Về thị trấn, đối chất với Bà Mõ:**
  - Bà Mõ: "Phải. Bà biết."
  - Bà Mõ: "Hồi bà còn trẻ, thị trấn này đói lắm. Rồi có người mang lên một thanh kiếm vàng. Rồi thêm người nữa xuống."
  - Bà Mõ: "Bảng Vàng không phải để vinh danh. Nó là để người ta muốn xuống."
  - Lựa chọn:
    - [Bà đã giết họ] (+2 Ám) → Bà Mõ: "Ừ. Bà biết."
    - [Bà cũng sợ] (−2 Ám) → Bà Mõ: "...Ừ."
  - Bà Mõ: "Anh nhóc ở Doanh Trại Băng. Người cuối cùng đi lên từ đó kể vậy."
- **Kết chương:** mở Chương 4. Xu Xu thêm câu thoại mới: "Từ giờ tôi ghi tên chủ cũ lên tem giá, meo."

### 11.7 Chương 4 · Doanh Trại Băng: "Một Tầng Nữa Thôi"
- **Vào hầm:** Narrator: "Lạnh tới mức hơi thở đóng băng giữa không trung. Ai đó đã khắc lên tường hàng trăm vạch. Đếm ngày? Hay đếm tầng?"
- **Phòng sự kiện:** một lá thư đóng băng. Đọc được thì `flags.readKhaLetter = true`.
  - Thư của Kha: "Nhóc à. Anh lên hạng 3 rồi. Còn 2 người nữa thôi."
  - Thư của Kha: "Anh không nhớ màu mắt của nhóc nữa. Lạ nhỉ. Anh chỉ nhớ con số."
- **Phòng rương:** chứa **Huy Hiệu Gác Cổng**.
- **Mini boss Đội Trưởng Sắt:**
  - Khi vào: "Doanh trại này giữ người lại cho khỏi xuống sâu hơn. Không ai nghe cả."
  - Khi ≤ 30% máu: "Tôi canh cửa này cho tới khi không còn nhớ mình canh để làm gì."
  - Lựa chọn:
    - [Trả Huy Hiệu] → Đội Trưởng: "Huy hiệu của đơn vị tôi. Chúng tôi từng có tên đơn vị." Tha, −3 Ám, rơi **Mũ Đội Trưởng**.
    - [Kết liễu] → +10 Ám.
    - [Bỏ đi]
- **Boss Kha:**
  - Lúc vào, Kha: "Nhóc? Nhóc cũng xuống đây à? ...Tốt. Đồ của nhóc xịn đấy. Đưa đây, anh cần thêm một chút nữa thôi."
  - Pha 1: đánh bình thường.
  - Ở 50% máu, trận đấu dừng lại, Kha: "Anh sắp lên hạng 1 rồi. Nhóc hiểu không? Hạng 1!"
  - Các lựa chọn thuyết phục (hiện những lựa chọn đủ điều kiện, mỗi lựa chọn đúng +1 điểm thuyết phục):
    1. [Đưa Huy Hiệu Hạng 214] (cần Huy Hiệu Của Kha): "Anh từng vui ở hạng 214 mà." +1
    2. [Đọc lá thư của anh] (cần `flags.readKhaLetter`): "Anh quên màu mắt em rồi đấy." +1
    3. [Gọi tên anh: "Kha."] (luôn có): +1 nếu Ám < 60, không thì Kha đáp: "Nhóc nói giống chúng nó." (+0)
    4. [Tấn công] (luôn có): bỏ qua thuyết phục, đánh tiếp
  - Người chơi chọn lần lượt cho tới khi chọn Tấn công hoặc không còn lựa chọn nào.
  - **Đủ ≥ 2 điểm → Tha:**
    - Kha khựng lại: "...Mắt màu nâu. Mắt nhóc màu nâu, giống mẹ."
    - Trận đấu kết thúc. `flags.sparedKha = true`, −5 Ám.
    - Kha: "Anh không đi lên được nữa đâu. Người anh đã nặng như cái Vực rồi. Nhưng nhóc thì đi được."
    - Kha đưa **Kiếm Của Kha** (độc nhất).
  - **Dưới 2 điểm hoặc chọn Tấn công:** đánh tiếp pha 2. Kha chết thì `flags.killedKha = true`, +15 Ám, rơi Kiếm Của Kha.
    - Kha: "Hạng... mấy... rồi..."
- **Về thị trấn:**
  - Nếu tha:
    - Bà Mõ: "Nó còn sống? ...Vậy là còn kịp."
    - Bé Tí: "Anh/chị tìm được anh rồi hả? Thích quá!"
  - Nếu giết:
    - Bà Mõ im lặng.
    - Bé Tí: "Sao anh/chị không cười?"
- **Kết chương:** mở Chương 5. Ông Lặng: "Dưới cùng là Đáy Giếng. Người đứng đầu ở đó. Người đầu tiên."

### 11.8 Chương 5 · Đáy Giếng: "Người Đứng Đầu"
- **Vào hầm:** Narrator: "Ở đây không có tường. Chỉ có những tấm bảng vàng khổng lồ, khắc kín tên người."
- **Phòng sự kiện:** một tấm Bảng Vàng cũ. Hạng 1 bị cào mất tên. Hạng 2 ghi "Á QUÂN".
- **Phòng rương:** chứa **Tấm Bảng Hạng Hai**.
- **Mini boss Á Quân:**
  - Khi vào: "Ta về nhì. Cả đời ta về nhì. Ngươi nghĩ ta để ngươi vượt mặt sao?"
  - Khi ≤ 30% máu: "Hạng hai... cũng là một cái tên mà, đúng không?"
  - Lựa chọn:
    - [Đưa Tấm Bảng] → Á Quân: "...Ừ. Cũng là một cái tên." Tha, −3 Ám, rơi **Giày Kẻ Đói**.
    - [Kết liễu] → +10 Ám.
    - [Bỏ đi]
- **Boss Vua Farm:**
  - Lúc vào: "Chào mừng, người chơi. Ta đã đợi rất lâu một người cày giỏi như ta."
  - Pha 2: "Ta là người đầu tiên lên hạng 1. Rồi ta xuống thêm một tầng để giữ hạng. Rồi một tầng nữa."
  - Pha 3: "Giờ ta là cái Vực. Mỗi kẻ muốn mạnh hơn đều là một viên gạch của ta."
- **Trước khi đánh Trái Tim (pha 3 ở 10% máu)**, game dừng lại chọn kết thúc. Kiểm tra điều kiện theo thứ tự:
  1. **Kết thúc bí mật "Giấc Ngủ Của Vực"**
     - Điều kiện: tha cả 5 mini boss + `sparedKha` + Ám < 20 + đã mở mảnh ký ức thứ 5 của Chủ Cũ `nguoi_dau` (mục 12.2)
     - Lựa chọn hiện ra: [Đọc tên ông ấy: "Phúc."]
     - Narrator: "Bạn nhớ cái tên bị cào khỏi Bảng Vàng. Ở góc Sổ Tên, có ai đó đã chép lại nó."
     - Người Đứng Đầu: "...Đã lâu lắm rồi không ai gọi ta như thế."
     - Vực ngủ yên. Mọi Kẻ Ở Lại đã tha lên được mặt đất.
  2. **Kết thúc A "Về Nhà"**
     - Điều kiện: `sparedKha` + Ám < 50
     - Lựa chọn: [Phá Trái Tim] / [Ở lại thay Kha]
     - Phá Trái Tim → Vực không sinh đồ mới trong một thời gian; Kha về thị trấn.
       - Narrator: "Thị trấn nghèo đi. Nhưng Bảng Vàng giờ ghi tên những người đã mất, thay vì những con số."
     - Ở lại → chuyển sang kết thúc B.
  3. **Kết thúc B "Người Gác Mới"**
     - Điều kiện: `sparedKha` + Ám ≥ 50, hoặc chọn [Ở lại]
     - Narrator: "Bạn ngồi xuống chỗ Ông Lặng từng ngồi. Bạn sẽ là người hỏi mỗi kẻ đi qua: 'Một tầng nữa thôi à?'"
     - Kha về nhà.
  4. **Kết thúc C "Vua Mới"**
     - Điều kiện: `killedKha`
     - Người Đứng Đầu: "Ngươi giống ta. Ngồi đi."
     - Không có lựa chọn.
     - Narrator: "Ở trên kia, người ta khắc thêm một cái tên lên hạng 1. Cả thị trấn vỗ tay."
- **Sau mọi kết thúc:**
  - Hiện chữ "HẾT", danh sách người làm (credits), tên kết thúc đạt được
  - Lưu `story.ending = id`. Mở Đáy Giếng ở Farm.
  - Vực vẫn mở, kèm câu dẫn hậu truyện: "Vực vẫn thở. Và bạn vẫn quay lại."

### 11.9 Hậu truyện ở Vực
Câu thoại hiện khi lần đầu tới các tầng 30, 50, 75, 100, 150, 200 (theo kết thúc đã đạt):
- **Tầng 50:**
  - Kết thúc A: Kha (qua bóng ma): "Nhóc vẫn xuống à? ...Nhớ mang theo cái tên của mình."
  - Kết thúc C: "Ngươi đang cày cho ai vậy, Vua?"
- **Tầng 100** (mọi kết thúc): "Bạn đã xuống sâu hơn bất kỳ ai trong Sổ Tên. Không còn ai để vượt mặt nữa. Vậy bạn đang đi xuống vì điều gì?"
- **Tầng 200:** "Có lẽ đây là lúc nghỉ ngơi. Trò chơi vẫn sẽ ở đây khi bạn quay lại."
- Các tầng 30, 75, 150: người code viết thêm theo đúng tinh thần trên (câu ngắn, không trách người chơi, chỉ đặt câu hỏi).

### 11.10 Thoại phụ theo mức Ám (NPC thị trấn, random khi nói chuyện)
| Ám | Bé Tí | Xu Xu | Sư Nến |
|---|---|---|---|
| 0–24 | "Hôm nay anh/chị mang gì lên?" | "Meo, khách quen!" | "Giếng vẫn trong." |
| 25–49 | "Anh/chị đi lâu quá." | "Dạo này khách ít cười, meo." | "Nước giếng gợn rồi." |
| 50–74 | (đứng xa hơn 2 tile) "...Chào." | "Giá hôm nay hơi cao, meo. Đừng giận." | "Đừng nhìn xuống giếng lâu." |
| 75–100 | (bỏ chạy khi người chơi lại gần) | giá mua ×1.2 | "Ta không còn thấy bóng ngươi dưới nước." |

---

## 12. HỆ THỐNG "CHỦ CŨ" & CHỈ SỐ ÁM

### 12.1 Chủ Cũ
- Mỗi món đồ rơi ra (trừ đồ khởi đầu, đồ từ Giao Kèo Lãng Quên và đồ bán ở Chợ) được gán `owner`. Chủ Cũ được random từ danh sách những người **thuộc hầm đó** (ở Vực thì random từ mọi hầm). Món độc nhất có tên thì có Chủ Cũ cố định.
- Chú thích của món đồ hiện thêm:
  - "Chủ cũ: <tên>"
  - một dòng `memory` random trong 3 dòng của người đó
- **Mảnh ký ức:** mỗi lần **nhặt** hoặc **giải phóng** một món của Chủ Cũ X thì `lore[X].count++`. Mở mảnh ký ức thứ k khi `count` đạt [1, 3, 6, 10, 15]. Mở mảnh mới thì hiện thông báo "Ký ức mới: <tên>".
- **Bonus bộ:** mặc cùng lúc ≥ 2 món của cùng Chủ Cũ → bonus 2 món; ≥ 3 món → bonus 3 món.
- **Trả lại:** ở Thư Viện, nếu đã mở đủ 5 mảnh ký ức của X, có thể "Trả lại" một món của X → món đó biến mất, −2 Ám, mỗi Chủ Cũ chỉ trả được 1 lần, nhận danh hiệu "<tên> được nhớ tên" (lưu trong save, hiện trong Sổ Ký Ức).

### 12.2 Danh sách 12 Chủ Cũ
Mỗi người có: `id`, tên, hầm, 3 dòng `memory` (dòng hiện ngắn trên đồ), 5 mảnh ký ức, bonus 2 món, bonus 3 món.

1. **`tuan` · Tuấn, thợ mỏ** (D1)
   - Dòng trên đồ:
     - "Còn ba xe quặng nữa là đủ tiền."
     - "Con gái thích đá lấp lánh."
     - "Ca đêm lạnh hơn ca ngày."
   - Mảnh ký ức:
     1. "Tuấn xuống mỏ vì nhà hết gạo."
     2. "Anh đào được một viên đá xanh, giữ lại cho con gái."
     3. "Quản Đốc bảo: thêm một ca nữa, tên anh sẽ lên bảng."
     4. "Anh làm thêm một ca. Rồi thêm một ca."
     5. "Viên đá xanh vẫn nằm trong túi áo, chưa ai mang về."
   - Bonus: 2 món +10% vàng · 3 món +8% máu tối đa
2. **`hoa` · Hòa, người cầm đèn** (D1)
   - Dòng trên đồ:
     - "Bố dặn đừng đi quá chỗ có ánh sáng."
     - "Đèn còn nửa bấc."
     - "Tối quá."
   - Mảnh ký ức:
     1. "Hòa là con của người gác cổng."
     2. "Cậu muốn chứng minh mình không chỉ là 'con của ông Lặng'."
     3. "Cậu đi quá chỗ có ánh sáng."
     4. "Đèn vỡ ở tầng ba."
     5. "Ông Lặng vẫn để đèn sáng ở cổng mỗi đêm."
   - Bonus: 2 món +30% bán kính sáng · 3 món +12% sát thương trong vùng sáng
3. **`van` · Vân, người chép sổ** (D2)
   - Dòng trên đồ:
     - "Chữ phải thẳng hàng."
     - "Thêm một tên nữa."
     - "Tên mình viết thế nào nhỉ?"
   - Mảnh ký ức:
     1. "Vân chép sổ cho thị trấn từ năm mười hai tuổi."
     2. "Cô thấy sổ dày lên mỗi tuần."
     3. "Cô xuống để tìm bản gốc."
     4. "Cô chép không kịp."
     5. "Trang cuối cô chép là tên của chính mình, nhưng bị nhòe nước."
   - Bonus: 2 món +8% giảm hồi chiêu · 3 món phép +15% sát thương
4. **`thuy` · Thủy, người bơi giỏi nhất** (D2)
   - Dòng trên đồ:
     - "Nín thở. Một, hai, ba."
     - "Dưới nước yên lặng lắm."
     - "Không ai bơi xuống sâu bằng mình."
   - Mảnh ký ức:
     1. "Thủy từng thắng mọi cuộc thi bơi ở thị trấn."
     2. "Cô nghe nói dưới thư viện có đồ quý."
     3. "Cô nín thở lâu hơn bình thường."
     4. "Lâu hơn nữa."
     5. "Huy chương bơi của cô treo ở chợ, giá 30 xu."
   - Bonus: 2 món +10% tốc chạy · 3 món lăn hồi 1% máu
5. **`lua` · Lụa, thợ may** (D3)
   - Dòng trên đồ:
     - "Đường kim phải đều."
     - "Áo này để mặc lên trên."
     - "Chỉ đỏ còn một cuộn."
   - Mảnh ký ức:
     1. "Lụa may áo cho người xuống Vực."
     2. "Người ta trả bằng đồ mang lên."
     3. "Cô để dành một cuộn chỉ đỏ cho áo cưới."
     4. "Người hứa cưới cô không lên nữa."
     5. "Cô xuống tìm anh ấy, mặc chiếc áo cô tự may."
   - Bonus: 2 món +10% chí mạng · 3 món chí mạng gây Chảy máu
6. **`son` · Sơn, người bán hàng rong** (D3)
   - Dòng trên đồ:
     - "Mua một tặng một!"
     - "Lời một xu cũng là lời."
     - "Hàng này lấy ở đâu ấy nhỉ?"
   - Mảnh ký ức:
     1. "Sơn bán đồ mạo hiểm giả mang lên."
     2. "Giá tốt nhất ở chợ là giá dưới đất."
     3. "Anh xuống để mua tận gốc."
     4. "Ông Chủ Cân hỏi anh trả bằng gì."
     5. "Anh trả bằng chính mình."
   - Bonus: 2 món +15% vàng · 3 món giá bán đồ +20%
7. **`minh` · Minh, lính gác** (D4)
   - Dòng trên đồ:
     - "Đứng thẳng."
     - "Không ai được qua."
     - "Ca gác này dài quá."
   - Mảnh ký ức:
     1. "Minh được giao gác cửa doanh trại."
     2. "Cửa giữ người không xuống sâu hơn."
     3. "Mọi người vẫn xuống."
     4. "Anh bắt đầu đếm số người đi qua."
     5. "Con số cuối cùng khắc trên tường: 1.204."
   - Bonus: 2 món +5% giảm sát thương nhận · 3 món đứng yên thì có khiên
8. **`kha` · Kha** (D4, chỉ là Chủ Cũ của Kiếm Của Kha và một số món ở Doanh Trại Băng)
   - Dòng trên đồ:
     - "Một tầng nữa thôi."
     - "Hạng 214."
     - "Nhóc à."
   - Mảnh ký ức:
     1. "Kha luôn muốn mạnh hơn một chút."
     2. "Cậu lên Bảng Vàng ở hạng 900."
     3. "Rồi hạng 214. Cậu viết thư về khoe."
     4. "Cậu không viết thư nữa."
     5. (Nếu tha) "Cậu nhớ ra màu mắt của em." / (Nếu giết) "Cậu lên tới hạng 2."
   - Bonus: 2 món +10% sát thương · 3 món combo kiếm nhanh hơn 15%
9. **`a_quan` · Á Quân** (D5)
   - Dòng trên đồ:
     - "Chỉ thiếu một chút."
     - "Lần sau."
     - "Hạng hai."
   - Mảnh ký ức:
     1. "Ông ta luôn về nhì."
     2. "Người về nhất luôn là cùng một người."
     3. "Ông ta xuống sâu hơn để vượt mặt."
     4. "Người kia cũng xuống sâu hơn."
     5. "Họ vẫn đang đi xuống."
   - Bonus: 2 món +12% sát thương lên boss · 3 món +12% sát thương lên tinh anh
10. **`ngoc` · Ngọc, người nhặt đồ** (D5)
    - Dòng trên đồ:
      - "Cái này đẹp quá."
      - "Thêm cái này nữa."
      - "Túi đầy rồi."
    - Mảnh ký ức:
      1. "Ngọc không đánh nhau giỏi."
      2. "Cô đi sau người khác để nhặt đồ."
      3. "Túi cô nặng dần."
      4. "Cô không chạy nổi nữa."
      5. "Túi của cô vẫn còn ở đó, đầy ắp."
    - Bonus: 2 món +10% tìm đồ · 3 món nhặt đồ hồi 3% máu
11. **`tho` · Thỏ, đứa trẻ** (D1–D5, hiếm: trọng số thấp)
    - Dòng trên đồ:
      - "Em lớn rồi mà."
      - "Cho em đi với."
      - "Em tìm thấy cái này!"
    - Mảnh ký ức:
      1. "Thỏ trốn theo một nhóm mạo hiểm giả."
      2. "Không ai để ý thêm một cái bóng nhỏ."
      3. "Em nhặt được một con dao bé xíu."
      4. "Nhóm của em không quay lại."
      5. "Bé Tí ở thị trấn là em gái của Thỏ."
    - Bonus: 2 món +8% tốc đánh · 3 món lăn không tốn hồi chiêu một lần mỗi phòng
12. **`nguoi_dau` · Người Đứng Đầu** (D5, cực hiếm)
    - Dòng trên đồ:
      - "Hạng 1."
      - "Ta xứng đáng."
      - "Ta đã từng có tên."
    - Mảnh ký ức:
      1. "Ông là người đầu tiên mang lên một thanh kiếm vàng."
      2. "Thị trấn dựng Bảng Vàng để vinh danh ông."
      3. "Người ta bắt đầu muốn vượt ông."
      4. "Ông xuống sâu hơn để giữ hạng."
      5. "Tên ông là Phúc. Không ai nhớ."
    - Bonus: 2 món +15% sát thương · 3 món +1 Ám mỗi phòng nhưng +25% sát thương
    - Mảnh ký ức thứ 5 cần để mở **kết thúc bí mật** (lựa chọn "Đọc tên ông ấy" chỉ hiện nếu đã mở mảnh này)

Điều kiện đầy đủ của kết thúc bí mật nằm ở mục 11.8.

### 12.3 Ám
- Phạm vi 0–100, bắt đầu ở 0. Lưu ở `save.am`.
- **Tăng:**
  - Chọn "Bảng Vàng" ở mở đầu: +1
  - Giết một Kẻ Ở Lại: +10
  - Giết Kha: +15
  - Chấp nhận Giao Kèo của Ông Chủ Cân: +8
  - Vực từ tầng 11: +1 mỗi tầng
  - Giao Kèo Đen: theo bảng 9.3
  - Đồ Ngai Vua Farm: +1 mỗi phòng
- **Giảm:**
  - Tha một Kẻ Ở Lại: −3
  - Tha Kha: −5
  - Giếng Thánh: −5 (tốn vàng)
  - Trả đồ cho Chủ Cũ: −2
  - Chọn "Bà cũng sợ": −2
- **Hiệu ứng:**
  - +0.3% sát thương cho mỗi điểm Ám (tối đa +30%)
  - Đổi ngoại hình (mục 4.7) và thoại NPC (11.10)
  - Quyết định kết thúc (mục 11.8)
- **Không bao giờ hiện con số Ám trực tiếp.** Chỉ có một biểu tượng giọt mực trong túi đồ, đậm dần theo 4 mức. Chú thích của biểu tượng: "Bạn thấy mình nặng hơn."

---

## 13. KIẾN TRÚC CODE

### 13.1 Cây thư mục
```
mini-dungeon-slayer/
├─ index.html                 # khung trang, các canvas, nạp CSS/JS theo thứ tự
├─ css/
│  └─ style.css               # giao diện DOM pixel, nút cảm ứng, responsive
├─ assets/
│  ├─ 0x72/                   # gói tileset 0x72 (ảnh png + tiles_list)
│  └─ fonts/                  # (tùy chọn) VT323.woff2 để chơi offline
├─ tools/
│  └─ make_atlas.py           # tiles_list → js/02b-atlas.js
├─ js/
│  ├─ 00-config.js            # CONFIG: hằng số, tham số cân bằng
│  ├─ 01-util.js              # toán, RNG có seed, easing, va chạm hình học
│  ├─ 02-assets.js            # nạp ảnh, drawSprite, getTinted, animation, hình thay thế
│  ├─ 02b-atlas.js            # (sinh tự động) ATLAS
│  ├─ 02c-pixel-icons.js      # PIXEL_ICONS: icon 16×16 vẽ bằng mảng chuỗi
│  ├─ 03-input.js             # bàn phím, chuột, cảm ứng, joystick ảo → Input.state
│  ├─ 04-audio.js             # sfx tổng hợp, máy phát nhạc
│  ├─ 05-events.js            # Events.on/emit
│  ├─ 10-data-rarity.js       # RAR, AFFIXES, ABYSS_AFFIXES
│  ├─ 11-data-items.js        # WEAPON_TYPES, WEAPON_NAMES, ARMOR_NAMES, RELICS, UNIQUES, MYTHICS, LEGEND_EFFECTS, STORY_ITEMS
│  ├─ 12-data-skills.js       # SKILLS (20 phép)
│  ├─ 13-data-enemies.js      # ENEMIES, ELITE_MODS, MINIBOSSES, BOSSES
│  ├─ 14-data-rooms.js        # ROOMS (mẫu phòng)
│  ├─ 15-data-dungeons.js     # DUNGEONS, DIFFICULTIES
│  ├─ 16-data-abyss.js        # PACTS, FLOOR_MODS, ABYSS_CONFIG
│  ├─ 17-data-lore.js         # OWNERS (Chủ Cũ)
│  ├─ 18-data-story.js        # CHARACTERS, STORY, STORY_HOOKS, ENDINGS, NPC_LINES
│  ├─ 20-save.js              # Save.load/save/migrate/export/import
│  ├─ 21-stats.js             # G(), computePlayerStats(), xpNeed(), power
│  ├─ 22-loot.js              # rollRarity, genItem, dropLoot, sell/salvage/upgrade/reroll
│  ├─ 23-world.js             # generateFloor, tile map, va chạm ô, cửa, bản đồ nhỏ
│  ├─ 24-entities.js          # tạo Player, Enemy, Projectile, Pickup, Hazard, Npc
│  ├─ 25-combat.js            # dealDamage, kill, status, đánh bằng vũ khí
│  ├─ 26-skills.js            # cài đặt hành vi 20 phép
│  ├─ 27-ai.js                # các hành vi quái + kiểu đạn
│  ├─ 28-bosses.js            # đòn đánh và pha của boss
│  ├─ 29-effects.js           # hiệu ứng độc nhất, Giao Kèo, bonus bộ (đăng ký vào Events)
│  ├─ 30-fx.js                # hạt, rung, khựng, chữ sát thương, nháy trắng, vệt chém
│  ├─ 31-light.js             # lớp ánh sáng
│  ├─ 32-render.js            # vẽ thế giới, camera, sắp xếp theo y, bóng đổ
│  ├─ 40-ui-hud.js            # HUD trên uiCanvas
│  ├─ 41-ui-dom.js            # tiện ích tạo DOM (panel, nút, chú thích)
│  ├─ 42-ui-inventory.js
│  ├─ 43-ui-town.js           # Lò Rèn, Chợ, Thư Viện, Giếng Thánh, Bảng Hầm, Nhà
│  ├─ 44-ui-dialog.js         # khung hội thoại và lựa chọn
│  ├─ 45-ui-menus.js          # tiêu đề, tạo nhân vật, tạm dừng, cài đặt, tổng kết, Giao Kèo, Trạm
│  ├─ 50-story.js             # Story.run, đánh giá điều kiện, các lệnh
│  ├─ 51-run.js               # Run: điều khiển một lượt chơi (cốt truyện / farm / Vực)
│  ├─ 52-abyss.js             # logic riêng của Vực (tầng, Trạm, Mộ, biến thể)
│  ├─ 53-scene-town.js
│  ├─ 54-scene-dungeon.js
│  ├─ 55-scene-title.js
│  └─ 99-main.js              # khởi động, SceneManager, vòng lặp
└─ README.md                  # cách chạy, cách đưa lên GitHub Pages, giấy phép tài nguyên
```
`index.html` nạp các file JS **đúng thứ tự tên file** ở trên, bằng `<script src>` thường (không `defer` lẫn lộn, không `type="module"`).

### 13.2 Trạng thái toàn cục
```js
const GAME = {
  save: null,          // dữ liệu lưu (mục 14.1)
  scene: null,         // scene hiện tại
  overlays: [],        // ngăn xếp UI phủ lên (hội thoại, menu); overlay trên cùng nhận input
  run: null,           // lượt chơi hiện tại (mục 14.3), null nếu đang ở thị trấn
  world: null,         // tầng hiện tại: tiles, rooms, entities
  time: 0,             // giây, tính theo game (bị dừng khi pause)
  paused: false, hitstop: 0, slowmo: 1,
  rng: null,           // RNG của lượt chơi
  view: { w:480, h:270, scale:1, camX:0, camY:0, shake:0 }
};
```

### 13.3 Vòng lặp game (`99-main.js`)
```js
const STEP = 1/60; let acc = 0, last = performance.now();
function frame(now){
  let dt = Math.min(0.1, (now - last) / 1000); last = now;
  Input.poll();                                   // gom input một lần mỗi khung
  if (GAME.hitstop > 0) { GAME.hitstop -= dt; dt = 0; }
  acc += dt * GAME.slowmo;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  render(acc / STEP);                             // alpha để nội suy (không bắt buộc)
  Input.endFrame();                               // xóa các cờ ...Pressed
  requestAnimationFrame(frame);
}
function update(dt){
  const top = GAME.overlays[GAME.overlays.length-1];
  if (top && top.blocking) { top.update(dt); return; }   // hội thoại hoặc menu đang dừng game
  if (!GAME.paused) { GAME.time += dt; GAME.scene.update(dt); }
  FX.update(dt); Audio.update(dt);
}
function render(alpha){ GAME.scene.render(alpha); UI.renderHud(); GAME.overlays.forEach(o => o.render && o.render()); }
```
**Thứ tự trong `DungeonScene.update(dt)`:**
1. `Player.update` (di chuyển, lăn, đánh, phép, bình máu)
2. `AI.updateAll` (quái)
3. `Bosses.update`
4. `Projectiles.update` (di chuyển, va chạm tường và thực thể)
5. `Hazards.update` (vùng lửa, độc, vòng báo nguy hiểm, gai)
6. `Status.updateAll` (bỏng, độc...)
7. `Pickups.update` (xu tự hút, nhặt)
8. `Run.updateRoomLogic` (cửa, đợt quái, dọn xong phòng)
9. `Events.emit("tick")` mỗi 0.25 s
10. Xóa các thực thể `dead`
11. `Camera.update`

### 13.4 Scene
Mỗi scene là object `{ enter(params), exit(), update(dt), render(alpha), onInput? }`. `SceneManager.go(name, params)` gọi `exit` của scene cũ, làm mờ màn hình đen 0.3 s, rồi gọi `enter` của scene mới.
- `title`: màn hình tiêu đề, tạo nhân vật
- `town`: thị trấn đi bộ được
- `dungeon`: dùng chung cho Cốt truyện, Farm và Vực; tham số `{mode, dungeonId, diff, floor, startStation}`

### 13.5 Thực thể (object thường, không dùng class kế thừa)
```js
// trường chung
{ id, kind:"player"|"enemy"|"proj"|"pickup"|"hazard"|"npc"|"prop",
  x, y, vx, vy, r, team:0|1,            // team 0 = người chơi, 1 = quái
  hp, maxHp, shield, dead:false,
  sprite:"goblin", anim:"idle", animT:0, flip:false, tint:null, scale:1,
  flash:0, iframes:0, knockX:0, knockY:0,
  status:{ burn:{t,dps}, poison:{t,stacks,dps}, slow:{t,amt}, freeze:{t}, stun:{t}, bleed:{t,dps}, vuln:{t} },
  z:0 }                                  // độ cao (dùng khi nhảy hoặc ném vòng cung)
```
Các hàm tạo thực thể trong `24-entities.js`:
- `createPlayer(save) → player`: tính chỉ số bằng `computePlayerStats`
- `createEnemy(defId, level, opts{elite, mods, x, y}) → enemy`: gắn `ai`, `params`, `aiState`
- `createProjectile({x, y, angle, speed, r, dmg, type, team, pierce, life, homing, sprite, color, onHit, onExpire}) → proj`
- `createPickup({kind: "gold"|"item"|"orb"|"story", x, y, value|item}) → pickup`
- `createHazard({kind, x, y, r, t, delay, dps, onTrigger}) → hazard` (vòng tròn báo nguy hiểm cũng là một hazard có `delay`)
- `createNpc(charId, x, y, scriptId) → npc`

`GAME.world.entities` là một mảng duy nhất. Để tra cứu nhanh có thêm các danh sách con `world.enemies`, `world.projs`, cập nhật lại mỗi khung. Va chạm thực thể với thực thể dùng **lưới không gian** (`SpatialHash`, ô 32px).

### 13.6 Các hàm và module chính (input → output, nhiệm vụ)
| File | Hàm / object | Input → Output | Nhiệm vụ |
|---|---|---|---|
| 01-util | `mulberry32(seed)` | số → hàm `rng()` trả [0,1) | RNG có seed |
| | `rand(rng,a,b)`, `randInt`, `pick(rng,arr)`, `weighted(rng,[{w,...}])` | | Tiện ích ngẫu nhiên |
| | `clamp, lerp, dist, angleTo, normalize, circleRect, segCircle, arcHit(cx,cy,ang,arcDeg,range,tx,ty,tr)` | | Hình học |
| 02-assets | `Assets.load(onDone)` | → nạp ảnh 0x72, đợi font | Tải tài nguyên |
| | `drawSprite(ctx, key, frame, x, y, {flip, scale, tint, alpha, flash})` | | Vẽ sprite từ ATLAS (hoặc hình thay thế) |
| | `getTinted(key, frame, color, strength)` | → canvas đã đổi màu (cache) | Đổi màu sprite |
| | `animFrame(key, anim, t, fps=8)` | → số thứ tự khung | Chọn khung animation |
| | `drawIcon(ctx, iconKey, x, y, scale)` | | Vẽ `PIXEL_ICONS` |
| 03-input | `Input.init(canvas)`, `Input.poll()`, `Input.endFrame()`, `Input.state`, `Input.isTouch` | | Gom input |
| 04-audio | `Audio.init()`, `Audio.sfx(key)`, `Audio.music(key)`, `Audio.setVolume(kind, v)` | | Âm thanh |
| 05-events | `Events.on(name, fn, owner)`, `Events.off(owner)`, `Events.emit(name, ctx)` | | Sự kiện |
| 20-save | `Save.load()` | → save | Đọc localStorage, tự migrate, lỗi thì tạo save mới (`newSave`) |
| | `Save.write()` | | Ghi save (gọi khi về thị trấn, khi đổi đồ, mỗi 30 s ở thị trấn) |
| | `Save.export()` / `Save.import(str)` | chuỗi base64 | Chuyển save giữa các máy |
| | `Save.migrate(obj)` | → obj | Nâng dữ liệu lưu cũ lên phiên bản mới |
| 21-stats | `G(L)`, `xpNeed(L)` | | Công thức 4.1, 4.2 |
| | `computePlayerStats(save, run)` | → `{maxHp, physMult, spellMult, critChance, critMult, atkSpeed, moveSpeed, cdr, dmgTaken, lifesteal, ...}` | Cộng dồn mọi nguồn chỉ số (4.4) |
| | `itemScore(it)`, `playerPower(save)`, `recPower(L)` | | Lực Chiến (4.5) |
| | `addXp(save, n)` | → số cấp đã lên | Lên cấp, cộng điểm |
| 22-loot | `rollRarity(rng, diffKey, {find, bonusTier, abyssFloor})` | → key độ hiếm | Bảng 6.8 |
| | `genItem(rng, {dungeonId, ilvl, rarity, slot?, forceUnique?, abyss?})` | → item (14.2) | Sinh đồ |
| | `itemStats(it)` | → `{main, lines[], unique}` đã tính số | Dùng cho chú thích và cho stats |
| | `dropLoot(source, x, y)` | | Tạo pickup khi quái chết hoặc mở rương |
| | `upgradeCost(it)`, `applyUpgrade(it, lineKey)`, `rerollCost(it)`, `reroll(it, lineIdx, rng)`, `salvage(save, it)`, `sell(save, it)` | | Lò Rèn và Chợ |
| 23-world | `generateFloor(def, rng, opts)` | → `{tiles, w, h, rooms[], startPos, lights[]}` | Mục 8.3 |
| | `isSolid(tx, ty)`, `blocksProj(tx, ty)`, `tileAt(x, y)` | | Va chạm ô |
| | `moveAndCollide(ent, dx, dy)` | | Đi từng trục, trượt dọc tường |
| | `lineOfSight(x1, y1, x2, y2)` | → bool | Đi từng bước 4px |
| | `setDoors(room, closed)` | | Đóng/mở cửa |
| | `roomAt(x, y)` | → room \| null | |
| 25-combat | `dealDamage(src, tgt, opts)` | → số sát thương thực | Mục 5.4 |
| | `kill(tgt, src)` | | Rơi đồ, XP, sự kiện |
| | `applyStatus(tgt, key, params)`, `Status.updateAll(dt)` | | Trạng thái |
| | `weaponAttack(player)` | | Hitbox cận chiến hoặc tạo đạn theo loại vũ khí |
| 26-skills | `SKILL_IMPL[key].cast(player, item, aim)` | | Hành vi từng phép |
| | `castSkill(player, slot)` | | Kiểm tra hồi chiêu, gọi `cast`, phát sự kiện |
| 27-ai | `AI.updateAll(dt)`, `AI_BEHAVIORS[key](e, dt, world)` | | Máy trạng thái của quái |
| | `Patterns.aimed/ring/spiral/burst(e, params)` | | Kiểu đạn |
| 28-bosses | `BOSS_IMPL[id] = {phases:[{until, attacks:[...]}], attacks:{name:(boss, dt) → done?}}` | | Logic boss |
| | `Bosses.update(dt)` | | Chọn đòn, đổi pha |
| 29-effects | `Effects.registerRun(save, run)` | | Đăng ký hiệu ứng độc nhất, Giao Kèo, bonus bộ, dòng Vực vào Events |
| 30-fx | `FX.particles(x, y, {n, color, speed, life, gravity})`, `FX.shake(trauma)`, `FX.hitstop(t)`, `FX.number(x, y, val, kind)`, `FX.trail(...)`, `FX.flashScreen(color, t)` | | Cảm giác đánh |
| 31-light | `Light.render(ctx, world, cam)` | | Lớp tối và nguồn sáng |
| 32-render | `Render.world(ctx, world, cam)` | | Nền → bóng đổ → thực thể (sắp theo y) → hiệu ứng → ánh sáng → lóe sáng cộng màu |
| 40-ui-hud | `UI.renderHud()` | | Vẽ trên uiCanvas |
| 41..45 | `UI.open(panelName, params)`, `UI.close()`, `UI.toast(text, color)`, `UI.tooltip(item, compareWith)` | | Giao diện DOM |
| 44 | `Dialog.say(who, text)` → Promise; `Dialog.choice(text, options)` → Promise<index> | | Hội thoại |
| 50-story | `Story.run(scriptId)` → Promise; `Story.evalCond(str)` → bool | | Chạy kịch bản bằng `async/await` |
| 51-run | `Run.start({mode, dungeonId, diff, floor})`, `Run.enterRoom(room)`, `Run.updateRoomLogic(dt)`, `Run.spawnWave(room)`, `Run.onPlayerDeath()`, `Run.finish(result)` | | Một lượt chơi |
| 52-abyss | `Abyss.nextFloor()`, `Abyss.offerPacts()`, `Abyss.station()`, `Abyss.placeGrave()`, `Abyss.collectGrave()`, `Abyss.floorMod(f)` | | Vực |

**`PIXEL_ICONS`** (02c): mỗi icon là `{ palette: {"a":"#...", ...}, rows: ["....aa....", ...] }` (16 hàng × 16 ký tự, dấu `.` là trong suốt). Vẽ một lần vào canvas phụ rồi cache. Icon bắt buộc:
- Giáp: `helm_warrior`, `helm_mage`, `helm_guardian`, `chest_*` (3 hệ), `boots_*` (3 hệ)
- Khác: `ring`, `charm`, `book`, `scroll` (phép), `skull`, `grave`, `key`, `cat_merchant`
- 20 icon phép: `skill_<key>`
- Bắt buộc có viền tối 1px và đổ bóng 1 pixel phía dưới phải, để nhìn đồng bộ với gói 0x72.

### 13.7 Vẽ hình
- **3 lớp canvas** đặt chồng lên nhau trong `#game`:
  1. `worldCanvas`: kích thước 480×270, CSS phóng to theo số nguyên lớn nhất vừa màn hình
  2. `uiCanvas`: kích thước bằng màn hình thật × `devicePixelRatio`, dùng cho chữ, HUD và thanh máu
  3. `#ui-root`: lớp `div` chứa menu DOM
- **Camera:** bám theo người chơi với `lerp 0.15`, lệch về hướng ngắm, làm tròn tọa độ về số nguyên trước khi vẽ (tránh rung hình pixel). Bị kẹp trong biên của tầng.
- **Bộ nhớ đệm nền:** mỗi tầng vẽ toàn bộ nền và tường một lần vào một canvas phụ lớn; mỗi khung chỉ cắt phần đang nhìn thấy để vẽ. Đóng/mở cửa thì chỉ vẽ lại vùng cửa.
- **Tường 0x72:** ô tường có ô sàn ngay bên dưới thì vẽ `wall_mid` (mặt tường) và `wall_top_mid` ở ô phía trên; tường ở rìa trái/phải dùng `wall_left` / `wall_right`; các ô tường khác (lõi đặc) tô màu nền tối `#1a1424`. **[CẦN KIỂM TRA]** tên các sprite góc tường trong `tiles_list`; nếu thiếu thì vẽ đường viền đơn giản.
- **Ánh sáng** (`31-light.js`):
  1. Canvas `light` cùng kích thước thế giới, tô đen với độ trong `ambientDark`
  2. Với mỗi nguồn sáng, vẽ gradient tròn trắng → trong suốt với `globalCompositeOperation = "destination-out"` (đục lỗ trên lớp tối)
  3. Vẽ `light` đè lên `worldCanvas`
  4. Vẽ thêm vầng sáng màu của phép và vụ nổ bằng `"lighter"`
  5. Hiệu ứng thấp: bỏ bước 4, giảm số nguồn sáng còn 12
- **Chữ sát thương** được vẽ trên `uiCanvas`: đổi tọa độ thế giới sang màn hình (`(x - camX) * scale`), font VT323 cỡ 18–30px theo độ lớn số, có viền đen 3px.

### 13.8 Thích ứng điện thoại
- Thẻ `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`
- CSS `touch-action: none` cho vùng game; chặn kéo trang và menu khi nhấn giữ.
- Thích ứng màn hình tai thỏ bằng `env(safe-area-inset-*)`.
- Đổi kích thước hoặc xoay màn hình thì tính lại `scale`, đặt lại kích thước `uiCanvas`, vẽ lại các nút.
- Chơi trong ứng dụng (không phải trình duyệt) thì yêu cầu toàn màn hình (`requestFullscreen`) khi bấm "Chơi" (nếu trình duyệt hỗ trợ).
- Hiệu năng: tối đa 300 hạt (chế độ Thấp: 150), 120 đạn quái, ~60 quái cùng lúc. Mục tiêu 60 khung/giây trên điện thoại tầm trung.

---

## 14. CẤU TRÚC DỮ LIỆU & FILE LƯU (JSON MẪU)

### 14.1 Save (`localStorage["mds_save_v1"]`)
```json
{
  "v": 1,
  "created": 1767225600000,
  "playTime": 3600,
  "hero": { "name": "Mini", "look": "knight", "sex": "m", "level": 12, "xp": 840,
            "points": { "str": 20, "int": 0, "vit": 16 }, "unspent": 0 },
  "gold": 15230,
  "shards": 42,
  "invCap": 40, "stashCap": 60, "potionMax": 3,
  "inventory": [ /* item (14.2) */ ],
  "stash": [],
  "equip": { "weapon": "it_7f3a", "spell1": "it_19bc", "spell2": null,
             "helm": "it_aa01", "chest": null, "boots": null, "relic": null },
  "story": { "chapter": 2, "done": ["prologue","ch1"], "ending": null,
             "flags": { "sparedHoa": true, "killedHoa": false, "readKhaLetter": false } },
  "storyItems": ["story_letter", "story_minerBadge", "story_khaBadge"],
  "unlocks": { "dungeons": { "mine": { "story": true, "maxDiff": "hard" }, "library": { "story": false, "maxDiff": null } },
               "abyss": false },
  "abyss": { "best": 0, "bestTime25": null, "stations": [1], "grave": null, "seenMilestones": [] },
  "lore": { "tuan": { "count": 4, "frags": 3, "returned": false } },
  "sparedCount": 1,
  "am": 6,
  "stats": { "kills": 1203, "deaths": 4, "runs": 21, "bossKills": 9, "itemsFound": 160 },
  "daily": { "date": "2026-10-25", "shop": [] },
  "settings": { "music": 0.6, "sfx": 0.8, "shake": true, "numbers": true, "autoAim": false, "fxQuality": "high" }
}
```
`newSave(name, look, sex)` tạo save có đồ khởi đầu, `story.chapter = 0` (chưa xem mở đầu).

### 14.2 Món đồ
```json
{
  "uid": "it_7f3a",
  "base": "mine_sword",
  "slot": "weapon",
  "wtype": "sword",
  "armorClass": null,
  "skill": null,
  "rar": "epic",
  "ilvl": 12,
  "main": { "key": "dmg", "base": 10 },
  "aff": [ { "k": "critC", "v": 0.054 }, { "k": "life", "v": 0.027 } ],
  "upg": [ "main", "critC" ],
  "unique": null,
  "abyssAff": null,
  "owner": "tuan",
  "memory": 1,
  "locked": false,
  "isNew": true,
  "source": { "mode": "farm", "dungeon": "mine", "diff": "hard", "floor": null }
}
```
- `main.base` là giá trị gốc (cấp 1, Thường). Giá trị hiển thị và giá trị dùng để tính được tính lại mỗi lần bằng `itemStats(it)`. **Không lưu số đã nhân** vào save, để khi đổi cân bằng thì đồ cũ tự cập nhật theo.
- `skill`: key phép, nếu đây là đồ ô `spell`.
- `memory`: thứ tự dòng ký ức (0–2) của Chủ Cũ.

### 14.3 Lượt chơi (`GAME.run`, không lưu vào save, trừ Mộ)
```json
{
  "mode": "story|farm|abyss",
  "dungeonId": "mine", "diff": "normal", "floor": 1, "seed": 918273,
  "loot": [], "gold": 0, "xpGained": 0, "kills": 0, "time": 0,
  "revivesLeft": 1, "potions": 3,
  "pacts": [], "floorMod": null, "stationsPassed": 0, "rewardMult": 1,
  "roomIndex": 0, "currentRoom": null
}
```

### 14.4 Định nghĩa dữ liệu (mẫu)
```js
ENEMIES.mine_goblin = { name:"Yêu Tinh Đào Mỏ", sprite:"goblin", tint:null, ai:"chaser",
  hpK:0.7, dmgK:0.7, spd:70, r:6, cost:1,
  params:{ range:14, windup:0.35, arc:90, recover:0.5 } };

SKILLS.fireball = { name:"Cầu Lửa", icon:"skill_fireball", scale:"spell", base:28, cd:4,
  desc:"Bắn quả cầu lửa nổ khi chạm, gây Bỏng.",
  params:{ speed:220, radius:24, burn:true } };

UNIQUES.u_foremanPick = { name:"Cuốc Của Quản Đốc", slot:"weapon", wtype:"heavy", rar:"legendary",
  dungeon:"mine", owner:"tuan", sprite:"weapon_hammer",
  desc:"Mỗi đòn thứ 3 liên tiếp gây địa chấn nhỏ (50% sát thương).",
  effect:"foremanQuake" };                 // key trong EFFECT_IMPL (29-effects.js)

OWNERS.tuan = { name:"Tuấn", title:"thợ mỏ", dungeons:["mine"], weight:10,
  memories:["Còn ba xe quặng nữa là đủ tiền.","Con gái thích đá lấp lánh.","Ca đêm lạnh hơn ca ngày."],
  frags:["...","...","...","...","..."],
  set2:{ gold:0.10 }, set3:{ hpPct:0.08 } };

PACTS.p_glass = { name:"Thủy Tinh", gain:"+60% sát thương", cost:"Nhận thêm 40% sát thương",
  dark:false, am:0, mods:{ dmgPct:0.6, dmgTakenPct:0.4 } };

STORY_HOOKS.ch1 = { onEnterDungeon:"ch1_enter", onRoom:{ event:"ch1_skeleton" },
  onMinibossLow:"ch1_hoa", onBossIntro:"ch1_boss_intro", onBossPhase:{ 1:"ch1_boss_p2" },
  onBossDead:"ch1_boss_dead", onExit:"ch1_outro" };
```

---

## 15. CÁCH THÊM NỘI DUNG MỚI (không sửa engine)

- **Thêm quái:**
  - Thêm một mục vào `ENEMIES` với `ai` đã có sẵn.
  - Đưa id của quái vào `enemyPool` của hầm.
  - Cần hành vi mới thì viết một hàm vào `AI_BEHAVIORS` (đây là chỗ duy nhất phải viết code).
- **Thêm đồ:**
  - Vũ khí hoặc giáp thường: thêm tên vào `WEAPON_NAMES` / `ARMOR_NAMES`.
  - Đồ độc nhất: thêm vào `UNIQUES`, viết hiệu ứng trong `EFFECT_IMPL`.
  - Phép: thêm vào `SKILLS` và `SKILL_IMPL`.
- **Thêm hầm hoặc chương:**
  1. Vẽ các mẫu phòng vào `ROOMS`.
  2. Thêm một mục vào `DUNGEONS` (cấp gốc, pool quái, mini boss, boss, pool đồ).
  3. Viết `STORY.chN_*` và `STORY_HOOKS.chN`.
  4. Thêm boss vào `BOSSES` + `BOSS_IMPL`.
  5. Thêm Chủ Cũ vào `OWNERS`.
  6. Thêm một dòng mở khóa ở kịch bản kết thúc chương trước.
- **Thêm Giao Kèo hoặc biến thể tầng:** thêm vào `PACTS` / `FLOOR_MODS` với `mods` dạng số. Hiệu ứng phức tạp thì thêm `effect` key.
- **Đổi cân bằng:** chỉ sửa `CONFIG` và các bảng dữ liệu. Save không lưu số đã nhân, nên đồ cũ tự cập nhật theo.
- **Đổi save:** tăng `v`, viết thêm một bước trong `Save.migrate`.

---

## 16. THỨ TỰ CODE (CÁC MỐC + TIÊU CHÍ NGHIỆM THU)

Làm **lần lượt**, xong mốc nào chạy thử mốc đó.

**M0 · Khung dự án**
- Việc cần làm:
  - Tạo cây thư mục, `index.html`, `style.css`, `00-config`, `01-util`, `99-main` với vòng lặp
  - `02-assets` có hình thay thế; `03-input` chạy được trên cả máy tính và cảm ứng
  - `tools/make_atlas.py`; README hướng dẫn GitHub Pages
- Nghiệm thu:
  - Mở `index.html` qua `file://`: thấy một ô vuông di chuyển được bằng WASD và bằng joystick ảo trên điện thoại
  - Màn hình phóng to theo số nguyên, chữ tiếng Việt hiện đúng dấu

**M1 · Đánh trong một phòng**
- Việc cần làm:
  - Bản đồ ô cứng một phòng, va chạm với tường
  - Người chơi đi, lăn, đánh bằng kiếm và gậy
  - 3 quái (`chaser`, `shooter`, `bomber`); `dealDamage`; HUD máu
  - FX: nháy trắng, chữ sát thương, rung màn hình, khựng, hạt, bóng đổ; ánh sáng; sfx cơ bản
- Nghiệm thu:
  - Đánh quái thấy "đã tay"; lăn né được đạn
  - Chết → nút chơi lại
  - Chạy 60 khung/giây với 30 quái

**M2 · Một hầm hoàn chỉnh (Mỏ Bỏ Hoang, chế độ Farm, độ khó Thường)**
- Việc cần làm:
  - `generateFloor`, cửa, các đợt quái, bản đồ nhỏ
  - Đủ 5 quái D1, mini boss Hòa (không thoại), boss Quản Đốc Cuốc đủ 3 pha
  - Rơi vàng và đồ, nhặt đồ, rương cuối, bảng tổng kết
- Nghiệm thu:
  - Chơi hết một lượt trong 6–9 phút
  - Seed cố định thì sinh ra cùng một tầng
  - Không có phòng nào bị kẹt (không vào được hoặc không ra được)

**M3 · Đồ & thị trấn**
- Việc cần làm:
  - Toàn bộ mục 6: sinh đồ, chú thích, so sánh, trang bị, túi đồ
  - Thị trấn đi bộ được; Lò Rèn (nâng cấp, rèn lại), Chợ, Giếng Thánh (reset điểm), Bảng Hầm
  - Cấp độ và điểm chỉ số; Lực Chiến; 5 độ khó + hình phạt khi chết; save, xuất/nhập save
- Nghiệm thu:
  - Vòng chơi trọn vẹn: thị trấn → hầm → đồ → nâng cấp → hầm khó hơn
  - Tải lại trang không mất tiến độ

**M4 · 20 phép + đồ độc nhất + hệ thống sự kiện**
- Nghiệm thu: mỗi phép và mỗi hiệu ứng độc nhất có thể kiểm thử được trong phòng thử (`?debug=1` mở menu sinh đồ và sinh quái)

**M5 · Hội thoại & cốt truyện: mở đầu + Chương 1**
- Việc cần làm:
  - `Story`, khung hội thoại, NPC, cờ cốt truyện, đồ cốt truyện, móc kịch bản vào hầm
  - Tha/giết mini boss; Chủ Cũ + Sổ Ký Ức; Ám
- Nghiệm thu:
  - Chơi từ mở đầu tới hết chương 1, cả nhánh tha lẫn nhánh giết
  - Lựa chọn được lưu lại

**M6 · Hầm D2–D5 + Chương 2–5 + các kết thúc**
- Việc cần làm: toàn bộ quái, mini boss, boss, kịch bản, thoại theo Ám
- Nghiệm thu: đạt được cả 4 kết thúc bằng các save thử

**M7 · Vực Không Đáy**
- Việc cần làm: tầng vô tận, Giao Kèo, Trạm, Mộ, biến thể tầng, Cái Miệng, kỷ lục, hậu truyện
- Nghiệm thu: chơi tới tầng 30; chết rồi nhặt lại được Mộ

**M8 · Đánh bóng**
- Việc cần làm:
  - Nhạc từng hầm, đủ sfx
  - Cài đặt; tối ưu hiệu năng điện thoại; thông báo xoay ngang
  - Cân bằng theo mục 17
- Nghiệm thu:
  - Không có lỗi trong console
  - Chơi mượt trên điện thoại Android tầm trung

**Chế độ debug** (`?debug=1` trên URL):
- Bất tử, mở khóa toàn bộ, +1 cấp, +10.000 vàng
- Sinh đồ theo độ hiếm, nhảy tới tầng Vực bất kỳ, đặt giá trị Ám
- Hiện khung va chạm, hiện số khung/giây

---

## 17. BẢNG THAM SỐ CÂN BẰNG (`CONFIG`)
```js
const CONFIG = {
  TILE: 16, VIEW_W: 480, VIEW_H: 270,
  G_BASE: 1.065, LEVEL_CAP: 60, POINTS_PER_LEVEL: 3, XP_A: 50, XP_P: 1.6,
  STAT_PCT: 0.02, BASE_HP: 60, BASE_CRIT: 0.05, BASE_CRIT_MULT: 1.5,
  MOVE_SPEED: 90, DODGE_T: 0.30, DODGE_DIST: 70, DODGE_IFRAME: 0.25, DODGE_CD: 0.8,
  HURT_IFRAME: 0.5, POTIONS: 3, POTION_HEAL: 0.40, POTION_CD: 1.5, ORB_HEAL: 0.06,
  ENEMY_HP_BASE: 28, ENEMY_DMG_BASE: 12, ELITE_HP: 3, ELITE_DMG: 1.5,
  MINIBOSS_HP: 12, MINIBOSS_DMG: 1.4, BOSS_HP: 40, BOSS_DMG: 1.6,
  ITEM_DROP: 0.02, ELITE_ITEM_DROP: 0.25, ORB_DROP: 0.06,
  GOLD_BASE: 2, XP_BASE: 4, XP_EXP: 1.2,
  UPGRADE_BASE: 40, UPGRADE_EXP: 1.6, UPGRADE_MAIN: 0.10, UPGRADE_AFF: 0.25,
  SELL_BASE: 6, ROOM_BUDGET_BASE: 6, ROOM_BUDGET_STEP: 2,
  SPAWN_TELEGRAPH: 0.7, MAX_ENEMY_BULLETS: 120, MAX_PARTICLES: 300,
  AM_DMG_PER_POINT: 0.003, AM_MAX: 100,
  ABYSS_MULT_BASE: 1.1, ABYSS_MULT_STEP: 0.01
};
```
**Mục tiêu cân bằng** (dùng để chỉnh số):
- Người chơi mặc đồ Hiếm đúng cấp, độ khó Thường: một phòng chiến đấu mất 40–70 s, boss mất 60–90 s, mất khoảng 30–50% máu mỗi phòng nếu né trung bình.
- Lên cấp: khoảng 1–1.5 cấp mỗi lượt Farm đúng cấp; tổng khoảng 70–90 lượt để lên cấp 60.
- Huyền Thoại đầu tiên thường rơi khi người chơi ở cấp 15–25 (độ khó Khó).
- Tầng Vực trung bình của người chơi đã xong cốt truyện, đồ Sử Thi/Huyền Thoại cấp 60: tầng 35–50.

---

## 18. DANH SÁCH [CẦN KIỂM TRA]
1. Dòng giấy phép CC0 trên trang tải gói 0x72 DungeonTileset II (tác giả đã ghi CC-0 trong mô tả và bình luận, nhưng cần nhìn trực tiếp).
2. Tên file chính xác của ảnh và `tiles_list` trong gói, theo phiên bản tải về.
3. Tên chính xác của từng sprite trong `tiles_list` (đặc biệt các tên viết sai chính tả `wizzard`, `coulmn`; các tên góc tường; các vũ khí; `chest_mimic_open_anim`). Sprite nào không có thì dùng tên gần nhất hoặc icon vẽ bằng code.
4. Gói 0x72 không có mèo, sách, mũ/giáp/giày: đã chủ động vẽ bằng code. Kiểm tra xem bản tải về có thêm sprite nào thay được không.
5. Đường dẫn file `.woff2` của VT323 nếu muốn chơi offline hoàn toàn.
6. Nhân vật NPC dùng sprite anh hùng (`elf_f`, `wizzard_f`...) có thể trùng với dáng người chơi chọn; nếu trùng thì đổi màu NPC.

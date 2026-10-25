# Mini Dungeon Slayer

Game nhập vai hành động pixel 2D nhìn từ trên xuống, kiểu Soul Knight. Thiết kế đầy đủ: [MINI-DUNGEON-SLAYER-GDD.md](MINI-DUNGEON-SLAYER-GDD.md).

**Tiến độ:**
- M0 + M1: cảm giác đánh.
- M2: hầm Mỏ Bỏ Hoang hoàn chỉnh (sinh tầng ngẫu nhiên, phòng khóa cửa, mini boss Hòa, boss Quản Đốc Cuốc 3 pha, rơi đồ, rương, tổng kết).
- M4: 20 phép Q/E, 11 đồ Huyền Thoại có tên + 6 hiệu ứng Huyền Thoại ngẫu nhiên + 6 đồ Thần Thoại, chữ hologram trên đầu NPC, bảng DEBUG (`?debug=1`) trong thị trấn.
- M3: tạo nhân vật (4 dáng), thị trấn đi bộ được, túi đồ + so sánh, Lò Rèn (nâng cấp, rèn lại), Chợ (bán, túi bình máu, mở rộng túi, quầy hằng ngày), Giếng Thánh (rửa điểm), Bảng Vàng (5 độ khó), cộng điểm chỉ số, lưu game, xuất/nhập save.

## Chơi
- Bấm đúp `index.html` là chơi được, không cần cài gì.
- Thêm `?debug=1` sau đường dẫn để hiện FPS và số thực thể; `?test=1` để vào phòng thử.
- Điều khiển máy tính:
  - WASD để đi, chuột để ngắm, giữ chuột trái để đánh
  - Space để lăn, R để uống bình máu
  - Phím 1–7 để đổi vũ khí khi thử nghiệm
- Điện thoại: joystick bên trái để đi; các nút bên phải gồm ⚔ đánh, » lăn, ♥ bình máu, ⇄ đổi vũ khí.

## Hình pixel (gói 0x72)
1. Tải [16x16 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) của 0x72 (CC0).
2. Giải nén vào `assets/0x72/` (trong đó có file `.png` và `tiles_list_v1.x`).
3. Chạy lệnh sau ở thư mục gốc dự án:
   `python tools/make_atlas.py assets/0x72/tiles_list_v1.7` (đổi tên file cho đúng phiên bản).
4. Tải lại trang. Chưa có gói thì game tự dùng hình thay thế.

## Đưa lên GitHub Pages
Đẩy repo lên GitHub → Settings → Pages → Source: nhánh `main`, thư mục `/ (root)` → link chơi có dạng `https://<user>.github.io/mini-dungeon-slayer/`.

## Tài nguyên
- Hình: 0x72 · 16x16 DungeonTileset II (CC0)
- Font: VT323 (Google Fonts, OFL)
- Âm thanh: tự tổng hợp bằng WebAudio

---
Tran Duc Long - tranduclong.id.vn

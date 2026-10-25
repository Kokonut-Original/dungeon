"""Sinh js/02b-atlas.js từ file tiles_list của gói 0x72 DungeonTileset II.

Cách dùng (chạy ở thư mục gốc dự án):
    python tools/make_atlas.py assets/0x72/tiles_list_v1.7

Mỗi dòng tiles_list có dạng:  tên x y rộng cao [số_khung]
- Nếu có số khung: các khung xếp ngang liền nhau.
- Nếu tên có đuôi _f0, _f1...: gộp lại thành một sprite nhiều khung.
Ảnh png được tìm trong cùng thư mục với tiles_list (file .png lớn nhất).
"""
import json
import os
import re
import sys


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    path = sys.argv[1]
    folder = os.path.dirname(path)
    pngs = [f for f in os.listdir(folder) if f.lower().endswith(".png")]
    if not pngs:
        sys.exit("Không thấy file .png trong " + folder)
    png = max(pngs, key=lambda f: os.path.getsize(os.path.join(folder, f)))

    atlas = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            parts = line.split()
            if len(parts) < 5:
                continue
            name = parts[0]
            try:
                x, y, w, h = (int(v) for v in parts[1:5])
            except ValueError:
                continue
            frames = int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 1
            m = re.match(r"^(.*)_f(\d+)$", name)
            if m:  # dạng tên_f0, tên_f1...: gộp vào một sprite
                base, idx = m.group(1), int(m.group(2))
                e = atlas.setdefault(base, {"x": x, "y": y, "w": w, "h": h, "frames": 0})
                if idx == 0:
                    e["x"], e["y"] = x, y
                e["frames"] = max(e["frames"], idx + 1)
            else:
                atlas[name] = {"x": x, "y": y, "w": w, "h": h, "frames": frames}

    rel_png = os.path.relpath(os.path.join(folder, png), ".").replace("\\", "/")
    out = os.path.join("js", "02b-atlas.js")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("/* 02b-atlas: sinh tự động bởi tools/make_atlas.py — không sửa tay */\n")
        fh.write("const ATLAS = " + json.dumps(atlas, ensure_ascii=False, separators=(",", ":")) + ";\n")
        fh.write("const ATLAS_IMAGE = " + json.dumps(rel_png) + ";\n")
    print(f"Đã ghi {out}: {len(atlas)} sprite, ảnh {rel_png}")


if __name__ == "__main__":
    main()

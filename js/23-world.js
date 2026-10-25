/* 23-world: sinh tầng nhiều phòng (GDD 8.3), bản đồ ô, va chạm ô, cửa, đường nhìn */
const T = CONFIG.TILE;
const SOLID_SET = new Set(["#", "o", "c", "T", "D", "H", "d"]);
const BLOCK_PROJ = new Set(["#", "o", "c", "T", "D", "H", "d"]);  // nước ~ thì đạn bay qua; H = mái nhà, d = cửa nhà
const NO_WALK = new Set(["#", "o", "c", "T", "~", "D", "H", "d"]);
const GRID = 5, CELL_W = 30, CELL_H = 24;

/** world rỗng dùng chung */
function emptyWorld(w, h, fill = "#") {
  const tiles = []; for (let y = 0; y < h; y++) tiles.push(new Array(w).fill(fill));
  return { tiles, w, h, pw: w * T, ph: h * T, lights: [], spawns: [], crates: {}, rooms: [], marks: [],
    entities: [], enemies: [], projs: [], hazards: [], pickups: [], props: [], player: null,
    hash: new SpatialHash(32), floorSeed: 1234, dirty: true, theme: null, spikeT: 0 };
}

/** dập mẫu phòng vào world tại (ox, oy); trả danh sách điểm đặc biệt */
function stampRoom(world, tpl, ox, oy) {
  const marks = { spawns: [], chest: null, npc: null, boss: null };
  tpl.map.forEach((row, y) => [...row].forEach((ch, x) => {
    const tx = ox + x, ty = oy + y, px = (tx + 0.5) * T, py = (ty + 0.5) * T;
    let t = ch;
    if (ch === "s") { marks.spawns.push({ x: px, y: py }); t = "."; }
    else if (ch === "*") { marks.chest = { x: px, y: py }; t = "."; }
    else if (ch === "N") { marks.npc = { x: px, y: py }; t = "."; }
    else if (ch === "B") { marks.boss = { x: px, y: py }; t = "."; }
    world.tiles[ty][tx] = t;
  }));
  return marks;
}

/** sau khi xong bản đồ: tạo danh sách đuốc, thùng */
function scanTiles(world) {
  world.lights = []; world.crates = {};
  for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
    const ch = world.tiles[y][x];
    if (ch === "T") world.lights.push({ x: (x + 0.5) * T, y: (y + 1) * T, r: 70, color: "#ffb35a", flicker: true });
    if (ch === "c") world.crates[x + "," + y] = 2;
  }
}

/** world một phòng (phòng thử M1) */
function buildWorldFromRoom(roomId) {
  const tpl = ROOMS[roomId], h = tpl.map.length, w = tpl.map[0].length;
  const world = emptyWorld(w, h);
  const m = stampRoom(world, tpl, 0, 0);
  world.spawns = m.spawns; scanTiles(world);
  return world;
}

/**
 * Sinh một tầng (GDD 8.3).
 * def: định nghĩa hầm; rng: hàm ngẫu nhiên; opts: {mainRooms, branches, endType: "boss"|"stairs"}
 * Trả world có world.rooms[] = {id, gx, gy, type, x, y, w, h, doors[], links[], marks, cleared, visited, known}
 */
function generateFloor(def, rng, opts = {}) {
  const lay = def.layout, wantMain = opts.mainRooms || lay.mainRooms;
  let path = null;
  for (let tries = 0; tries < 200 && !path; tries++) {
    const len = Math.max(3, wantMain - Math.floor(tries / 50));
    const start = [Math.floor(rng() * GRID), Math.floor(rng() * GRID)], p = [start], used = new Set([start.join()]);
    while (p.length < len) {
      const [cx, cy] = p[p.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy])
        .filter(([x, y]) => x >= 0 && y >= 0 && x < GRID && y < GRID && !used.has(x + "," + y));
      if (!nb.length) break;
      const n = nb[Math.floor(rng() * nb.length)]; p.push(n); used.add(n.join());
    }
    if (p.length === len) path = p;
  }
  // loại phòng trên đường chính
  const endType = opts.endType || "boss";
  const types = path.map((_, i) => i === 0 ? "start" : i === path.length - 1 ? endType : i === path.length - 2 && endType === "boss" ? "miniboss" : "combat");
  for (let i = 2; i < types.length - 2; i++) if (types[i] === "combat" && rng() < 0.25) { types[i] = "event"; break; }
  const cells = path.map((c, i) => ({ gx: c[0], gy: c[1], type: types[i], main: i }));
  const links = []; for (let i = 1; i < cells.length; i++) links.push([i - 1, i]);
  // nhánh phụ
  const occ = new Set(cells.map(c => c.gx + "," + c.gy));
  const nBr = opts.branches != null ? opts.branches : lay.branches[0] + Math.floor(rng() * (lay.branches[1] - lay.branches[0] + 1));
  for (let b = 0; b < nBr; b++) {
    const hosts = cells.map((c, i) => i).filter(i => cells[i].type === "combat");
    for (let t = 0; t < 20; t++) {
      const hi = hosts[Math.floor(rng() * hosts.length)]; if (hi == null) break;
      const h = cells[hi], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [h.gx + dx, h.gy + dy])
        .filter(([x, y]) => x >= 0 && y >= 0 && x < GRID && y < GRID && !occ.has(x + "," + y));
      if (!dirs.length) continue;
      const [x, y] = dirs[Math.floor(rng() * dirs.length)];
      cells.push({ gx: x, gy: y, type: rng() < 0.7 ? "chest" : "event", main: -1 }); occ.add(x + "," + y);
      links.push([hi, cells.length - 1]); break;
    }
  }

  const world = emptyWorld(GRID * CELL_W, GRID * CELL_H);
  world.theme = def.theme;
  // dập phòng vào giữa ô lưới
  world.rooms = cells.map((c, i) => {
    const pool = def.rooms[c.type] || def.rooms.combat, tplId = pool[Math.floor(rng() * pool.length)], tpl = ROOMS[tplId];
    const w = tpl.map[0].length, h = tpl.map.length, x = c.gx * CELL_W + Math.floor((CELL_W - w) / 2), y = c.gy * CELL_H + Math.floor((CELL_H - h) / 2);
    const marks = stampRoom(world, tpl, x, y);
    return { id: i, gx: c.gx, gy: c.gy, type: c.type, main: c.main, tplId, x, y, w, h, marks, doors: [], links: [],
      cleared: c.type === "start" || c.type === "chest" || c.type === "event", visited: false, known: false, locked: false };
  });
  // cửa + hành lang
  for (const [ai, bi] of links) {
    const A = world.rooms[ai], B = world.rooms[bi];
    A.links.push(bi); B.links.push(ai);
    if (A.gy === B.gy) {                                       // ngang
      const [L, Rr] = A.gx < B.gx ? [A, B] : [B, A], my = L.y + Math.floor(L.h / 2);
      const x0 = L.x + L.w - 1, x1 = Rr.x;
      for (let x = x0; x <= x1; x++) for (let dy = -1; dy <= 1; dy++) world.tiles[my + dy][x] = ".";
      L.doors.push({ tiles: [[x0, my - 1], [x0, my], [x0, my + 1]], to: Rr.id, dir: "e" });
      Rr.doors.push({ tiles: [[x1, my - 1], [x1, my], [x1, my + 1]], to: L.id, dir: "w" });
    } else {                                                   // dọc
      const [U, D] = A.gy < B.gy ? [A, B] : [B, A], mx = U.x + Math.floor(U.w / 2);
      const y0 = U.y + U.h - 1, y1 = D.y;
      for (let y = y0; y <= y1; y++) for (let dx = -1; dx <= 1; dx++) world.tiles[y][mx + dx] = ".";
      U.doors.push({ tiles: [[mx - 1, y0], [mx, y0], [mx + 1, y0]], to: D.id, dir: "s" });
      D.doors.push({ tiles: [[mx - 1, y1], [mx, y1], [mx + 1, y1]], to: U.id, dir: "n" });
    }
  }
  scanTiles(world);
  world.floorSeed = Math.floor(rng() * 1e9);
  const st = world.rooms[0];
  world.startPos = { x: (st.x + st.w / 2) * T, y: (st.y + st.h / 2 + 1) * T };
  return world;
}

/** phòng chứa điểm (x, y) theo pixel; inset = số ô thụt vào từ tường (để biết đã "vào hẳn" phòng) */
function roomAt(world, x, y, inset = 0) {
  const tx = x / T, ty = y / T;
  for (const r of world.rooms) if (tx >= r.x + inset && tx < r.x + r.w - inset && ty >= r.y + inset && ty < r.y + r.h - inset) return r;
  return null;
}
/** đóng/mở toàn bộ cửa của phòng */
function setDoors(world, room, closed) {
  world.dirtyTiles = world.dirtyTiles || [];
  for (const d of room.doors) for (const [x, y] of d.tiles) { world.tiles[y][x] = closed ? "D" : "."; world.dirtyTiles.push([x, y]); }
  room.locked = closed; world.dirty = true;
}

function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) return "#";
  return world.tiles[ty][tx];
}
const tileAtPx = (world, x, y) => tileAt(world, Math.floor(x / T), Math.floor(y / T));
const isSolidPx = (world, x, y) => NO_WALK.has(tileAtPx(world, x, y));
const blocksProjPx = (world, x, y) => BLOCK_PROJ.has(tileAtPx(world, x, y));

/** hình tròn (x,y,r) có chạm ô cứng không */
function circleHitsSolid(world, x, y, r, set = NO_WALK) {
  const x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((y - r) / T), y1 = Math.floor((y + r) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!set.has(tileAt(world, tx, ty))) continue;
    const cx = clamp(x, tx * T, tx * T + T), cy = clamp(y, ty * T, ty * T + T);
    if (dist2(cx, cy, x, y) < r * r) return true;
  }
  return false;
}

/** di chuyển từng trục và trượt dọc tường. Trả true nếu có va tường */
function moveAndCollide(world, e, dx, dy, set = NO_WALK) {
  let hit = false;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
  const sx = dx / steps, sy = dy / steps;
  for (let i = 0; i < steps; i++) {
    if (sx) { if (!circleHitsSolid(world, e.x + sx, e.y, e.r, set)) e.x += sx; else hit = true; }
    if (sy) { if (!circleHitsSolid(world, e.x, e.y + sy, e.r, set)) e.y += sy; else hit = true; }
  }
  return hit;
}

/** đường nhìn thẳng giữa 2 điểm (bước 4px, chỉ tường/cột chặn) */
function lineOfSight(world, x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 4);
  for (let i = 1; i < n; i++) { const t = i / n; if (blocksProjPx(world, lerp(x1, x2, t), lerp(y1, y2, t))) return false; }
  return true;
}

/** đánh trúng thùng gỗ ở ô (tx,ty): 2 lần thì vỡ, 30% rơi ít vàng */
function hitCrate(world, tx, ty) {
  const k = tx + "," + ty; if (!(k in world.crates)) return false;
  world.crates[k]--; FX.particles((tx + 0.5) * T, (ty + 0.5) * T, { n: 6, color: "#a0703a", speed: 60, life: 0.4 });
  if (world.crates[k] <= 0) {
    delete world.crates[k]; world.tiles[ty][tx] = "."; world.dirty = true; (world.dirtyTiles = world.dirtyTiles || []).push([tx, ty]);
    FX.particles((tx + 0.5) * T, (ty + 0.5) * T, { n: 14, color: "#c08a4a", speed: 110, life: 0.6, gravity: 200 }); Audio.sfx("hit");
    if (Math.random() < 0.3) for (let i = 0; i < 3; i++) world.pickups.push(createPickup({ kind: "gold", x: (tx + 0.5) * T, y: (ty + 0.5) * T, value: Math.max(1, Math.round(G(GAME.run ? GAME.run.level : 1))), vx: rand(-60, 60), vy: rand(-60, 60) }));
  }
  return true;
}

/** ô sàn ngẫu nhiên (trong phòng room nếu có) cách điểm (x,y) ít nhất minD px */
function randomFloorPos(world, x, y, minD, room = null) {
  for (let i = 0; i < 300; i++) {
    const tx = room ? randInt(room.x + 2, room.x + room.w - 3) : randInt(1, world.w - 2);
    const ty = room ? randInt(room.y + 2, room.y + room.h - 3) : randInt(1, world.h - 2);
    if (tileAt(world, tx, ty) !== "." && tileAt(world, tx, ty) !== "=") continue;
    const px = (tx + 0.5) * T, py = (ty + 0.5) * T;
    if (dist2(px, py, x, y) >= minD * minD) return { x: px, y: py };
  }
  return room ? { x: (room.x + room.w / 2) * T, y: (room.y + room.h / 2) * T } : { x: world.pw / 2, y: world.ph / 2 };
}

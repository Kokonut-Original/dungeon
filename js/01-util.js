/* 01-util: toán học, RNG có seed, hình học va chạm */
const TAU = Math.PI * 2;

/** RNG có seed: cùng seed luôn cho cùng dãy số */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = { rng: Math.random };                       // RNG hiện hành (lượt chơi gán lại)
const rand = (a, b, rng = R.rng) => a + (b - a) * rng();
const randInt = (a, b, rng = R.rng) => Math.floor(rand(a, b + 1, rng));
const pick = (arr, rng = R.rng) => arr[Math.floor(rng() * arr.length)];
/** chọn theo trọng số: list = [{w, ...}] */
function weighted(list, rng = R.rng) {
  let s = 0; for (const o of list) s += o.w;
  let r = rng() * s;
  for (const o of list) { r -= o.w; if (r <= 0) return o; }
  return list[list.length - 1];
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
function normalize(x, y) { const l = Math.hypot(x, y); return l > 1e-6 ? [x / l, y / l] : [0, 0]; }

/** mục tiêu (tx,ty,tr) có nằm trong hình quạt tâm (cx,cy), hướng ang, góc arcDeg, tầm range không */
function arcHit(cx, cy, ang, arcDeg, range, tx, ty, tr) {
  const d = Math.hypot(tx - cx, ty - cy);
  if (d > range + tr) return false;
  if (d < tr + 2) return true;
  return Math.abs(angDiff(ang, Math.atan2(ty - cy, tx - cx))) <= (arcDeg * Math.PI / 360) + Math.asin(Math.min(1, tr / d));
}
/** đoạn thẳng (x1,y1)-(x2,y2) có chạm hình tròn không */
function segCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1;
  const t = clamp(((cx - x1) * dx + (cy - y1) * dy) / l, 0, 1);
  return dist2(x1 + dx * t, y1 + dy * t, cx, cy) <= r * r;
}

/** lưới không gian để tra va chạm nhanh */
class SpatialHash {
  constructor(cell = 32) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  key(cx, cy) { return cx * 73856093 ^ cy * 19349663; }
  insert(e) {
    const c = this.cell, x0 = Math.floor((e.x - e.r) / c), x1 = Math.floor((e.x + e.r) / c),
      y0 = Math.floor((e.y - e.r) / c), y1 = Math.floor((e.y + e.r) / c);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const k = this.key(x, y); let b = this.map.get(k); if (!b) { b = []; this.map.set(k, b); } b.push(e);
    }
  }
  query(x, y, r, out = []) {
    out.length = 0; const c = this.cell, seen = new Set();
    for (let cx = Math.floor((x - r) / c); cx <= Math.floor((x + r) / c); cx++)
      for (let cy = Math.floor((y - r) / c); cy <= Math.floor((y + r) / c); cy++) {
        const b = this.map.get(this.key(cx, cy)); if (!b) continue;
        for (const e of b) if (!seen.has(e)) { seen.add(e); out.push(e); }
      }
    return out;
  }
}

let _uid = 1;
const uid = (p = "e") => p + (_uid++).toString(36);
const isDebug = () => /[?&]debug=1/.test(location.search);

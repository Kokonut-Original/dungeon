/* 03-input: gom bàn phím, chuột, cảm ứng (joystick ảo + nút) vào Input.state */
const Input = {
  isTouch: false,
  state: { moveX: 0, moveY: 0, aimX: 1, aimY: 0, aimWorldX: 0, aimWorldY: 0, hasMouseAim: false,
    attack: false, dodgePressed: false, skill1Pressed: false, skill2Pressed: false, potionPressed: false,
    interactPressed: false, pausePressed: false, invPressed: false, mapPressed: false, debug1: false, debug2: false },
  keys: {}, pressed: {}, mouse: { x: 0, y: 0, down: false },
  stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 },             // joystick ảo (toạ độ CSS px)
  buttons: [],                                               // nút cảm ứng {key, x, y, r, id, down}
  touchHeld: {},

  init(el) {
    addEventListener("keydown", e => {
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
      if (["Space", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    });
    addEventListener("keyup", e => { this.keys[e.code] = false; });
    addEventListener("blur", () => { this.keys = {}; this.mouse.down = false; });
    el.addEventListener("mousemove", e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.state.hasMouseAim = true; });
    el.addEventListener("mousedown", e => { if (e.button === 0) this.mouse.down = true; this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    addEventListener("mouseup", e => { if (e.button === 0) this.mouse.down = false; });
    el.addEventListener("contextmenu", e => e.preventDefault());
    el.addEventListener("touchstart", e => this.onTouch(e, "start"), { passive: false });
    el.addEventListener("touchmove", e => this.onTouch(e, "move"), { passive: false });
    el.addEventListener("touchend", e => this.onTouch(e, "end"), { passive: false });
    el.addEventListener("touchcancel", e => this.onTouch(e, "end"), { passive: false });
    this.layoutButtons();
    addEventListener("resize", () => this.layoutButtons());
  },

  /** vị trí các nút cảm ứng theo kích thước màn hình (GDD 3.2) */
  layoutButtons() {
    const w = innerWidth, h = innerHeight, big = h * 0.09, small = h * 0.06;
    const ax = w - big * 1.6, ay = h - big * 1.6;
    this.buttons = [
      { key: "attack", x: ax, y: ay, r: big, icon: "⚔" },
      { key: "dodge", x: ax - big * 2.1, y: ay + big * 0.4, r: small, icon: "»" },
      { key: "skill1", x: ax - big * 1.7, y: ay - big * 1.3, r: small, icon: "Q" },
      { key: "skill2", x: ax - big * 0.2, y: ay - big * 2.0, r: small, icon: "E" },
      { key: "potion", x: ax + big * 1.0, y: ay - big * 1.9, r: small * 0.85, icon: "♥" },
      { key: "pause", x: w - small * 1.2, y: small * 1.2, r: small * 0.7, icon: "II" },
      { key: "weapon", x: w - small * 3.0, y: small * 1.2, r: small * 0.7, icon: "⇄" },
    ];
  },

  onTouch(e, type) {
    e.preventDefault();
    this.isTouch = true;
    for (const t of e.changedTouches) {
      const x = t.clientX, y = t.clientY;
      if (type === "start") {
        const b = this.buttons.find(b => Math.hypot(b.x - x, b.y - y) < b.r * 1.25);
        if (b) { b.id = t.identifier; if (!b.down) this.touchHeld[b.key + "P"] = true; b.down = true; continue; }
        if (x < innerWidth * 0.5 && this.stick.id === null) Object.assign(this.stick, { id: t.identifier, ox: x, oy: y, x, y });
      } else if (type === "move") {
        if (t.identifier === this.stick.id) { this.stick.x = x; this.stick.y = y; }
      } else {
        if (t.identifier === this.stick.id) this.stick.id = null;
        for (const b of this.buttons) if (b.id === t.identifier) { b.down = false; b.id = null; }
      }
    }
  },

  btn(key) { const b = this.buttons.find(b => b.key === key); return !!(b && b.down); },

  /** gọi đầu mỗi khung hình: tính Input.state. toWorld(cssX, cssY) -> [wx, wy] do scene cung cấp */
  poll(toWorld, playerPos, autoTarget) {
    const k = this.keys, p = this.pressed, s = this.state, tp = this.touchHeld;
    let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    let my = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (this.stick.id !== null) {
      const R = innerHeight * 0.11, dx = this.stick.x - this.stick.ox, dy = this.stick.y - this.stick.oy, l = Math.hypot(dx, dy);
      if (l > R * 0.15) { const f = Math.min(1, l / R); mx = dx / l * f; my = dy / l * f; }
    }
    const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
    s.moveX = mx; s.moveY = my;

    // ngắm: chuột trên máy tính; tự nhắm khi cảm ứng (hoặc khi không có chuột)
    if (!this.isTouch && s.hasMouseAim && toWorld && playerPos) {
      const [wx, wy] = toWorld(this.mouse.x, this.mouse.y);
      s.aimWorldX = wx; s.aimWorldY = wy;
      const [ax, ay] = normalize(wx - playerPos.x, wy - playerPos.y); if (ax || ay) { s.aimX = ax; s.aimY = ay; }
    } else if (playerPos) {
      if (autoTarget) { const [ax, ay] = normalize(autoTarget.x - playerPos.x, autoTarget.y - playerPos.y); s.aimX = ax; s.aimY = ay; s.aimWorldX = autoTarget.x; s.aimWorldY = autoTarget.y; }
      else if (mx || my) { const [ax, ay] = normalize(mx, my); s.aimX = ax; s.aimY = ay; s.aimWorldX = playerPos.x + ax * 60; s.aimWorldY = playerPos.y + ay * 60; }
    }
    s.attack = this.mouse.down || !!k.KeyJ || this.btn("attack");
    s.dodgePressed = !!(p.Space || p.ShiftLeft || p.ShiftRight || tp.dodgeP);
    s.skill1Pressed = !!(p.KeyQ || tp.skill1P);
    s.skill2Pressed = !!(p.KeyE || tp.skill2P);
    s.potionPressed = !!(p.KeyR || tp.potionP);
    s.interactPressed = !!(p.KeyF || tp.attackP);
    s.pausePressed = !!(p.Escape || tp.pauseP);
    s.invPressed = !!(p.Tab || p.KeyI);
    s.mapPressed = !!p.KeyM;
    s.debug1 = !!p.Digit1; s.debug2 = !!p.Digit2; s.debug3 = !!p.Digit3; s.debug4 = !!p.Digit4;
  },
  endFrame() { this.pressed = {}; this.touchHeld = {}; },
  /** sau bước logic đầu tiên: tắt các cờ "vừa bấm" để không kích hoạt 2 lần trong cùng khung */
  consumePresses() {
    const s = this.state;
    s.dodgePressed = s.skill1Pressed = s.skill2Pressed = s.potionPressed = s.interactPressed = s.pausePressed = s.invPressed = s.mapPressed = false;
    this.pressedUsed = this.pressed; this.pressed = {}; this.touchHeldUsed = this.touchHeld; this.touchHeld = {};
  },
};

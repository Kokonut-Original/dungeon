/* 05-events: hệ thống sự kiện, để hiệu ứng đặc biệt không phải sửa engine (GDD 5.5) */
const Events = {
  map: {},
  /** đăng ký fn cho sự kiện name; owner dùng để gỡ hàng loạt */
  on(name, fn, owner = null) { (this.map[name] ||= []).push({ fn, owner }); },
  /** gỡ mọi handler của owner */
  off(owner) { for (const k in this.map) this.map[k] = this.map[k].filter(h => h.owner !== owner); },
  emit(name, ctx) { const l = this.map[name]; if (l) for (const h of l) h.fn(ctx); },
};

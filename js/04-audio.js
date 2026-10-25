/* 04-audio: hiệu ứng âm thanh tổng hợp bằng WebAudio (không cần file) */
const Audio = {
  ctx: null, master: null, sfxGain: null, musicGain: null, vol: { sfx: 0.8, music: 0.6 }, last: {},

  /** gọi sau lần chạm/bấm đầu tiên (trình duyệt chặn âm thanh trước đó) */
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(comp);
    this.sfxGain = c.createGain(); this.sfxGain.gain.value = this.vol.sfx; this.sfxGain.connect(this.master);
    this.musicGain = c.createGain(); this.musicGain.gain.value = this.vol.music; this.musicGain.connect(this.master);
    const len = c.sampleRate * 1, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },

  tone(freq, dur, type = "square", vol = 0.1, slide = 0, delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.1, freq = 1200, type = "lowpass", delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },

  /** phát hiệu ứng theo key (GDD 2.5); chống phát dồn cùng key trong 30ms */
  sfx(key) {
    if (!this.ctx) return;
    const now = performance.now(); if (this.last[key] && now - this.last[key] < 30) return; this.last[key] = now;
    const S = SFX[key]; if (S) S(this);
  },
  setVolume(kind, v) { this.vol[kind] = v; if (kind === "sfx" && this.sfxGain) this.sfxGain.gain.value = v; if (kind === "music" && this.musicGain) this.musicGain.gain.value = v; },
  update() {},
};

const SFX = {
  swing: a => { a.noise(0.09, 0.08, 3000, "bandpass"); a.tone(520, 0.06, "triangle", 0.03, -260); },
  hit: a => { a.noise(0.07, 0.14, 900); a.tone(180, 0.08, "square", 0.06, -90); },
  crit: a => { a.noise(0.12, 0.18, 1400); a.tone(880, 0.12, "square", 0.06, -500); a.tone(1320, 0.1, "triangle", 0.04, 0, 0.03); },
  hurt: a => { a.tone(220, 0.18, "sawtooth", 0.09, -140); a.noise(0.12, 0.1, 700); },
  dodge: a => { a.noise(0.16, 0.07, 2200, "highpass"); },
  shoot: a => { a.tone(700, 0.08, "square", 0.04, -400); },
  magic: a => { a.tone(600, 0.14, "sine", 0.06, 500); a.tone(900, 0.1, "triangle", 0.03, 300, 0.02); },
  enemy_shoot: a => { a.tone(420, 0.07, "square", 0.025, -200); },
  explode: a => { a.noise(0.4, 0.22, 600); a.tone(90, 0.35, "sine", 0.12, -50); },
  death: a => { a.noise(0.2, 0.12, 1000); a.tone(300, 0.2, "square", 0.05, -220); },
  telegraph: a => { a.tone(1200, 0.05, "square", 0.025); },
  spawn: a => { a.tone(300, 0.25, "sine", 0.04, 400); },
  door_close: a => { a.noise(0.25, 0.15, 400); a.tone(70, 0.25, "square", 0.08, -20); },
  door_open: a => { a.noise(0.3, 0.1, 500); a.tone(110, 0.2, "square", 0.05, 60); },
  room_clear: a => { [0, 4, 7, 12].forEach((n, i) => a.tone(523 * Math.pow(2, n / 12), 0.25, "triangle", 0.06, 0, i * 0.07)); },
  boss_roar: a => { a.tone(110, 0.6, "sawtooth", 0.1, -50); a.noise(0.5, 0.12, 500); },
  boss_phase: a => { a.tone(80, 0.9, "sawtooth", 0.12, 40); a.noise(0.8, 0.15, 300); [0, 3, 7].forEach((n, i) => a.tone(220 * Math.pow(2, n / 12), 0.4, "square", 0.05, 0, 0.2 + i * 0.1)); },
  chest_open: a => { a.noise(0.2, 0.1, 800); [0, 4, 7, 12].forEach((n, i) => a.tone(659 * Math.pow(2, n / 12), 0.2, "triangle", 0.06, 0, 0.1 + i * 0.06)); },
  rarity_legendary: a => { [0, 7, 12, 19].forEach((n, i) => a.tone(784 * Math.pow(2, n / 12), 0.5, "triangle", 0.07, 0, i * 0.08)); a.noise(0.8, 0.06, 6000, "highpass", 0.3); },
  pickup: a => { a.tone(880, 0.08, "square", 0.04); a.tone(1320, 0.1, "square", 0.04, 0, 0.06); },
  spell_fire: a => { a.noise(0.35, 0.12, 900); a.tone(220, 0.3, "sawtooth", 0.05, 200); },
  spell_ice: a => { [0, 1, 2].forEach(i => a.tone(1800 + i * 300, 0.12, "triangle", 0.03, -400, i * 0.06)); a.noise(0.2, 0.05, 6000, "highpass"); },
  spell_lightning: a => { a.noise(0.25, 0.18, 3000, "bandpass"); a.tone(1200, 0.15, "square", 0.04, -900); },
  spell_dark: a => { a.tone(140, 0.5, "sine", 0.1, -60); a.tone(70, 0.6, "sawtooth", 0.04, 30); },
  spell_heal: a => { [0, 4, 7].forEach((n, i) => a.tone(660 * Math.pow(2, n / 12), 0.35, "sine", 0.05, 0, i * 0.08)); },
  parry: a => { a.tone(1500, 0.07, "square", 0.05, -700); a.noise(0.06, 0.08, 4000, "highpass"); },
  coin: a => { a.tone(1320, 0.06, "square", 0.03); a.tone(1760, 0.08, "square", 0.025, 0, 0.04); },
  potion: a => { a.tone(400, 0.25, "sine", 0.07, 400); a.tone(800, 0.2, "sine", 0.04, 300, 0.08); },
  ui_click: a => { a.tone(660, 0.05, "square", 0.04); },
  levelup: a => { [0, 4, 7, 12, 16].forEach((n, i) => a.tone(523 * Math.pow(2, n / 12), 0.3, "square", 0.05, 0, i * 0.06)); },
};

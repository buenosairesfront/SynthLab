// SynthLab audio engine: polyphonic subtractive / FM / wavetable / additive synth on Web Audio.
(function () {
  const SL = (window.SL = window.SL || {});
  const NH = 64; // harmonics per PeriodicWave

  SL.clone = (o) => JSON.parse(JSON.stringify(o));
  SL.get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  SL.set = (o, p, v) => {
    const k = p.split('.');
    let a = o;
    for (let i = 0; i < k.length - 1; i++) a = a[k[i]];
    a[k[k.length - 1]] = v;
  };
  SL.merge = (base, over) => {
    const r = SL.clone(base);
    (function m(a, b) {
      for (const k in b) {
        const v = b[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object') m(a[k], v);
        else a[k] = Array.isArray(v) ? v.slice() : v;
      }
    })(r, over || {});
    return r;
  };
  SL.mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  SL.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SL.NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  SL.noteName = (m) => SL.NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

  SL.DEFAULT = {
    osc1: { wave: 'sawtooth', oct: 0, semi: 0, detune: 0, pw: 0.5, level: 0.8 },
    osc2: { wave: 'sawtooth', oct: 0, semi: 0, detune: 7, pw: 0.5, level: 0 },
    noise: 0,
    uni: { voices: 1, detune: 20 },
    filter: { type: 'lowpass', cutoff: 18000, q: 0.7, slope: 12, env: 0, key: 0 },
    amp: { a: 0.005, d: 0.3, s: 0.85, r: 0.25 },
    fenv: { a: 0.005, d: 0.35, s: 0, r: 0.3 },
    penv: { amt: 0, decay: 0.08 },
    lfo: { wave: 'sine', rate: 5, depth: 0, target: 'pitch' },
    fm: { ratio: 2, index: 0, env: 0, decay: 0.8 },
    wt: { table: 'basic', pos: 0 },
    add: { h: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12, 0.11, 0.1, 0.09, 0.08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    fx: { drive: 0, crush: 0, delay: 0, time: 0.32, fb: 0.35, reverb: 0 },
    glide: 0,
    mono: false,
    vol: 0.8,
  };

  // ---------- harmonic recipes (Fourier coefficients for one cycle) ----------
  SL.harm = function (wave, pw) {
    const re = new Float32Array(NH + 1), im = new Float32Array(NH + 1);
    const PI = Math.PI;
    for (let n = 1; n <= NH; n++) {
      switch (wave) {
        case 'sine': if (n === 1) im[1] = 1; break;
        case 'sawtooth': im[n] = (2 / (PI * n)) * (n % 2 ? 1 : -1); break;
        case 'square': if (n % 2) im[n] = 4 / (PI * n); break;
        case 'triangle': if (n % 2) im[n] = (8 / (PI * PI * n * n)) * (((n - 1) / 2) % 2 ? -1 : 1); break;
        case 'pulse': {
          const d = pw == null ? 0.5 : pw;
          re[n] = Math.sin(2 * PI * n * d) / (PI * n);
          im[n] = (1 - Math.cos(2 * PI * n * d)) / (PI * n);
          break;
        }
      }
    }
    return { re, im };
  };
  SL.amps = (h) => { const a = []; for (let n = 1; n <= NH; n++) a.push(Math.hypot(h.re[n], h.im[n])); return a; };
  // one cycle, normalised to [-1,1]
  SL.cycle = function (h, N) {
    N = N || 256;
    const out = new Float32Array(N);
    let mx = 1e-9;
    for (let i = 0; i < N; i++) {
      const x = (2 * Math.PI * i) / N;
      let s = 0;
      for (let n = 1; n < h.re.length; n++) if (h.re[n] || h.im[n]) s += h.re[n] * Math.cos(n * x) + h.im[n] * Math.sin(n * x);
      out[i] = s;
      mx = Math.max(mx, Math.abs(s));
    }
    for (let i = 0; i < N; i++) out[i] /= mx;
    return out;
  };
  SL.dft = function (fn, N) {
    N = N || 1024;
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++) x[i] = fn(i / N);
    const re = new Float32Array(NH + 1), im = new Float32Array(NH + 1);
    for (let n = 1; n <= NH; n++) {
      let a = 0, b = 0;
      for (let i = 0; i < N; i++) { const ph = (2 * Math.PI * n * i) / N; a += x[i] * Math.cos(ph); b += x[i] * Math.sin(ph); }
      re[n] = (2 * a) / N; im[n] = (2 * b) / N;
    }
    return { re, im };
  };
  SL.fromAmps = function (amps) {
    const re = new Float32Array(NH + 1), im = new Float32Array(NH + 1);
    for (let n = 1; n <= Math.min(NH, amps.length); n++) im[n] = amps[n - 1];
    return { re, im };
  };

  // ---------- wavetables ----------
  const FR = 32;
  function lerpH(a, b, t) {
    const re = new Float32Array(NH + 1), im = new Float32Array(NH + 1);
    for (let n = 0; n <= NH; n++) { re[n] = a.re[n] * (1 - t) + b.re[n] * t; im[n] = a.im[n] * (1 - t) + b.im[n] * t; }
    return { re, im };
  }
  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
  SL.TABLES = {
    basic: { name: 'Básica', desc: 'Seno → triángulo → sierra → cuadrada', gen(p) {
      const sh = ['sine', 'triangle', 'sawtooth', 'square'].map((w) => SL.harm(w));
      const x = p * 3, i = Math.min(2, Math.floor(x));
      return lerpH(sh[i], sh[i + 1], x - i);
    } },
    pwm: { name: 'Pulso', desc: 'Ancho de pulso de 50% a 3%', gen: (p) => SL.harm('pulse', 0.5 - p * 0.47) },
    vocal: { name: 'Vocal', desc: 'Formantes que recorren A-E-I-O-U', gen(p) {
      const V = [[800, 1150, 2900], [400, 1600, 2700], [300, 2300, 3000], [450, 800, 2830], [325, 700, 2530]];
      const x = p * 4, i = Math.min(3, Math.floor(x)), t = x - i;
      const F = V[i].map((f, k) => f * (1 - t) + V[i + 1][k] * t);
      const a = [];
      for (let n = 1; n <= NH; n++) {
        let s = 0.15 / n;
        F.forEach((f, k) => { s += [1, 0.6, 0.3][k] * Math.exp(-Math.pow(n * 110 - f, 2) / (2 * 90 * 90)); });
        a.push(s);
      }
      return SL.fromAmps(a);
    } },
    sync: { name: 'Sync', desc: 'Hard sync: un oscilador reiniciado por otro', gen(p) {
      const r = 1 + p * 7;
      return SL.dft((t) => 2 * ((r * t) % 1) - 1, 1024);
    } },
    fold: { name: 'Wavefold', desc: 'Seno plegado (estilo West Coast)', gen(p) {
      const g = 1 + p * 9;
      return SL.dft((t) => Math.sin(g * Math.sin(2 * Math.PI * t)), 1024);
    } },
    sweep: { name: 'Espectral', desc: 'Un pico de armónicos que barre hacia arriba', gen(p) {
      const c = 1 + p * 40, a = [];
      for (let n = 1; n <= NH; n++) a.push(Math.exp(-Math.pow(n - c, 2) / 18) + 0.25 / n);
      return SL.fromAmps(a);
    } },
    digital: { name: 'Digital', desc: 'Armónicos aleatorios que se van sumando', gen(p) {
      const r = rng(7), a = [], top = 3 + Math.floor(p * 60);
      for (let n = 1; n <= NH; n++) { const v = r(), w = r(); a.push(n <= top && (n === 1 || v > 0.45) ? w / Math.sqrt(n) : 0); }
      return SL.fromAmps(a);
    } },
  };
  const tableCache = {};
  SL.tableFrames = function (name) {
    if (!tableCache[name]) { const t = SL.TABLES[name]; tableCache[name] = []; for (let i = 0; i < FR; i++) tableCache[name].push(t.gen(i / (FR - 1))); }
    return tableCache[name];
  };
  SL.WT_FRAMES = FR;

  // ---------- envelope model (mirrors the scheduling below; used by visuals) ----------
  SL.envValue = function (e, t, tOff) {
    const a = Math.max(e.a, 0.001), d = Math.max(e.d, 0.001);
    const held = (x) => (x < a ? x / a : e.s + (1 - e.s) * Math.exp(-(x - a) / (d / 3)));
    if (t < 0) return 0;
    if (tOff == null || t < tOff) return held(t);
    return held(tOff) * Math.exp(-(t - tOff) / (Math.max(e.r, 0.001) / 4));
  };

  const BUILTIN = { sine: 1, triangle: 1, sawtooth: 1, square: 1 };

  // ---------------------------- Voice ----------------------------
  class Voice {
    constructor(e, note, t, vel, freq) {
      const c = e.ctx, p = e.patch;
      this.e = e; this.note = note; this.t0 = t; this.vel = vel; this.tOff = null; this.dead = false;
      this.freq = freq || SL.mtof(note);
      this.vca = c.createGain(); this.vca.gain.value = 0;
      this.trem = c.createGain(); this.trem.gain.value = p.lfo.target === 'amp' ? 1 - p.lfo.depth / 2 : 1;
      this.pan = c.createStereoPanner();
      this.f1 = c.createBiquadFilter(); this.f2 = c.createBiquadFilter();
      this.mix = c.createGain(); this.mix.gain.value = 0.55;
      this.pitch = c.createConstantSource(); this.pitch.offset.value = 0;
      this.fenv = c.createConstantSource(); this.fenv.offset.value = 0;
      this.mod = c.createOscillator(); this.modG = c.createGain(); this.modG.gain.value = 0;
      this.mod.connect(this.modG);
      this.mix.connect(this.f1); this.f1.connect(this.f2); this.f2.connect(this.trem);
      this.trem.connect(this.vca); this.vca.connect(this.pan); this.pan.connect(e.bus);
      this.fenv.connect(this.f1.detune); this.fenv.connect(this.f2.detune);
      e.lfoCut.connect(this.f1.detune); e.lfoCut.connect(this.f2.detune);
      e.lfoAmp.connect(this.trem.gain); e.lfoPan.connect(this.pan.pan);
      this.pitch.connect(this.mod.detune); e.lfoPitch.connect(this.mod.detune);
      this.g1 = c.createGain(); this.g2 = c.createGain(); this.gn = c.createGain();
      this.g1.connect(this.mix); this.g2.connect(this.mix); this.gn.connect(this.mix);
      this.srcs = [this.pitch, this.fenv, this.mod];
      this.o1 = []; this.o1det = [];
      const n = SL.clamp(Math.round(p.uni.voices), 1, 7);
      for (let i = 0; i < n; i++) {
        const o = c.createOscillator();
        const sp = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
        this.o1det.push(sp);
        if (n > 1) { const pn = c.createStereoPanner(); pn.pan.value = sp * 0.85; o.connect(pn); pn.connect(this.g1); }
        else o.connect(this.g1);
        this.pitch.connect(o.detune); e.lfoPitch.connect(o.detune); this.modG.connect(o.frequency);
        this.o1.push(o); this.srcs.push(o);
      }
      this.o2 = c.createOscillator(); this.o2.connect(this.g2);
      this.pitch.connect(this.o2.detune); e.lfoPitch.connect(this.o2.detune);
      this.srcs.push(this.o2);
      this.nz = c.createBufferSource(); this.nz.buffer = e.noiseBuf; this.nz.loop = true; this.nz.connect(this.gn);
      this.srcs.push(this.nz);

      this.applyWaves(); this.applyDetune(); this.applyLevels(); this.applyFilter(t, true);
      this.setFreq(this.freq, t, 0);

      // envelopes
      const peak = 0.25 + 0.75 * vel;
      this.peak = peak;
      env(this.vca.gain, t, peak, p.amp);
      const fe = p.filter.env * 7200;
      if (fe) env(this.fenv.offset, t, fe, p.fenv);
      if (p.penv.amt) { this.pitch.offset.setValueAtTime(p.penv.amt * 100, t); this.pitch.offset.setTargetAtTime(0, t, Math.max(p.penv.decay, 0.002) / 3); }
      if (p.fm.index && p.fm.env) {
        const g = this.modG.gain, pk = this.modDepth(1);
        g.setValueAtTime(pk, t); g.setTargetAtTime(pk * (1 - p.fm.env), t, Math.max(p.fm.decay, 0.01) / 3);
      }
      this.srcs.forEach((s) => s.start(t));
      this.o1[0].onended = () => this.dispose();
    }
    oscF(o) { return this.freq * Math.pow(2, (o.oct || 0) + (o.semi || 0) / 12); }
    modDepth(envFactor) {
      const p = this.e.patch;
      return p.fm.index * this.oscF(p.osc1) * p.fm.ratio * envFactor;
    }
    setFreq(f, t, glide) {
      const p = this.e.patch;
      this.freq = f;
      const set = (prm, v) => { if (glide > 0) prm.setTargetAtTime(v, t, glide / 3); else prm.setValueAtTime(v, t); };
      const f1 = this.oscF(p.osc1);
      this.o1.forEach((o) => set(o.frequency, f1));
      set(this.o2.frequency, this.oscF(p.osc2));
      set(this.mod.frequency, f1 * p.fm.ratio);
    }
    applyWaves() {
      const p = this.e.patch;
      const w1 = this.e.waveFor(p.osc1), w2 = this.e.waveFor(p.osc2);
      this.o1.forEach((o) => (w1 ? o.setPeriodicWave(w1) : (o.type = p.osc1.wave)));
      w2 ? this.o2.setPeriodicWave(w2) : (this.o2.type = p.osc2.wave);
    }
    applyDetune() {
      const p = this.e.patch, t = this.e.ctx.currentTime;
      this.o1.forEach((o, i) => o.detune.setTargetAtTime(p.osc1.detune + this.o1det[i] * p.uni.detune, t, 0.01));
      this.o2.detune.setTargetAtTime(p.osc2.detune, t, 0.01);
    }
    applyLevels() {
      const p = this.e.patch, t = this.e.ctx.currentTime;
      this.g1.gain.setTargetAtTime(p.osc1.level / Math.sqrt(this.o1.length), t, 0.01);
      this.g2.gain.setTargetAtTime(p.osc2.level, t, 0.01);
      this.gn.gain.setTargetAtTime(p.noise, t, 0.01);
    }
    applyFilter(t, now) {
      const f = this.e.patch.filter;
      const cut = SL.clamp(f.cutoff * Math.pow(2, ((this.note - 60) / 12) * f.key), 10, 20000);
      const resDb = (q) => 20 * Math.log10(q);
      const lphp = f.type === 'lowpass' || f.type === 'highpass';
      this.f1.type = f.type;
      this.f2.type = f.slope === 24 ? f.type : 'allpass';
      const set = (prm, v) => (now ? (prm.value = v) : prm.setTargetAtTime(v, t, 0.015));
      set(this.f1.frequency, cut); set(this.f2.frequency, cut);
      set(this.f1.Q, lphp ? resDb(f.q) : f.q);
      set(this.f2.Q, lphp ? -3.01 : f.slope === 24 ? f.q : 0.0001);
    }
    update(path) {
      const t = this.e.ctx.currentTime;
      if (/^(osc[12]\.(wave|pw)|wt\.|add\.)/.test(path)) this.applyWaves();
      else if (/^(osc[12]\.(oct|semi)|fm\.ratio)/.test(path)) { this.setFreq(this.freq, t, 0); this.updateMod(); }
      else if (path === 'fm.index' || path === 'fm.env') this.updateMod();
      else if (/^(osc[12]\.detune|uni\.detune)/.test(path)) this.applyDetune();
      else if (/^(osc[12]\.level|noise)/.test(path)) this.applyLevels();
      else if (/^filter\.(type|cutoff|q|slope|key)/.test(path)) this.applyFilter(t);
    }
    updateMod() {
      const p = this.e.patch, g = this.modG.gain, t = this.e.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(this.modDepth(p.fm.env ? 1 - p.fm.env : 1), t, 0.02);
    }
    release(t) {
      if (this.tOff != null) return;
      const p = this.e.patch;
      this.tOff = t;
      const r = Math.max(p.amp.r, 0.005);
      hold(this.vca.gain, t); this.vca.gain.setTargetAtTime(0, t, r / 4);
      if (p.filter.env) { hold(this.fenv.offset, t); this.fenv.offset.setTargetAtTime(0, t, Math.max(p.fenv.r, 0.005) / 4); }
      const end = t + r * 1.8 + 0.05;
      this.srcs.forEach((s) => { try { s.stop(end); } catch (err) {} });
    }
    kill() {
      const t = this.e.ctx.currentTime;
      this.tOff = this.tOff == null ? t : Math.min(this.tOff, t);
      hold(this.vca.gain, t); this.vca.gain.setTargetAtTime(0, t, 0.006);
      this.srcs.forEach((s) => { try { s.stop(t + 0.05); } catch (err) {} });
    }
    dispose() {
      if (this.dead) return;
      this.dead = true;
      try { this.pan.disconnect(); this.vca.disconnect(); } catch (err) {}
      const e = this.e;
      try { e.lfoCut.disconnect(this.f1.detune); e.lfoCut.disconnect(this.f2.detune); e.lfoAmp.disconnect(this.trem.gain); e.lfoPan.disconnect(this.pan.pan); e.lfoPitch.disconnect(this.mod.detune); this.o1.forEach((o) => e.lfoPitch.disconnect(o.detune)); e.lfoPitch.disconnect(this.o2.detune); } catch (err) {}
    }
  }
  function env(prm, t, peak, e) {
    const a = Math.max(e.a, 0.001), d = Math.max(e.d, 0.001);
    prm.cancelScheduledValues(t);
    prm.setValueAtTime(0, t);
    prm.linearRampToValueAtTime(peak, t + a);
    prm.setTargetAtTime(peak * e.s, t + a, d / 3);
  }
  function hold(prm, t) {
    if (prm.cancelAndHoldAtTime) prm.cancelAndHoldAtTime(t);
    else { const v = prm.value; prm.cancelScheduledValues(t); prm.setValueAtTime(v, t); }
  }

  // ---------------------------- Engine ----------------------------
  class Engine {
    constructor() {
      this.patch = SL.clone(SL.DEFAULT);
      this.voices = []; this.held = new Map(); this.listeners = new Set();
      this.waves = {}; this.lfoPhase = 0; this.lfoVal = 0; this.shVal = 0; this.wtFrameLive = 0;
      this.monoStack = []; this.monoV = null;
    }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    emit(path, v) { this.listeners.forEach((f) => f(path, v)); }
    ensure() {
      if (!this.ctx) this.init();
      if (this.ctx.state !== 'running') this.ctx.resume();
      return this.ctx;
    }
    init() {
      const c = (this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }));
      const G = (v) => { const g = c.createGain(); g.gain.value = v == null ? 1 : v; return g; };
      this.bus = G(1);
      this.drive = c.createWaveShaper(); this.drive.oversample = '4x';
      this.crush = c.createWaveShaper();
      this.post = G(1);
      this.master = G(this.patch.vol);
      this.bus.connect(this.drive); this.drive.connect(this.crush); this.crush.connect(this.post); this.post.connect(this.master);
      // delay
      this.dSend = G(0); this.dly = c.createDelay(2); this.dFb = G(0.35); this.dTone = c.createBiquadFilter();
      this.dTone.type = 'lowpass'; this.dTone.frequency.value = 3500;
      this.post.connect(this.dSend); this.dSend.connect(this.dly); this.dly.connect(this.dTone); this.dTone.connect(this.dFb); this.dFb.connect(this.dly); this.dTone.connect(this.master);
      // reverb
      this.rSend = G(0); this.conv = c.createConvolver(); this.conv.buffer = this.makeIR(2.8);
      this.post.connect(this.rSend); this.rSend.connect(this.conv); this.conv.connect(this.master);
      // out
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -12; this.comp.ratio.value = 6; this.comp.attack.value = 0.003; this.comp.release.value = 0.2;
      this.ana = c.createAnalyser(); this.ana.fftSize = 4096; this.ana.smoothingTimeConstant = 0.75;
      this.master.connect(this.comp); this.comp.connect(this.ana); this.ana.connect(c.destination);
      this.split = c.createChannelSplitter(2); this.comp.connect(this.split);
      this.anaL = c.createAnalyser(); this.anaR = c.createAnalyser(); this.anaL.fftSize = this.anaR.fftSize = 2048;
      this.split.connect(this.anaL, 0); this.split.connect(this.anaR, 1);
      // noise
      const nb = (this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)).getChannelData(0);
      for (let i = 0; i < nb.length; i++) nb[i] = Math.random() * 2 - 1;
      // lfo
      this.lfoOsc = c.createOscillator(); this.lfoOscG = G(1);
      this.lfoSH = c.createConstantSource(); this.lfoSH.offset.value = 0; this.lfoSHG = G(0);
      this.lfoBus = G(1);
      this.lfoOsc.connect(this.lfoOscG); this.lfoSH.connect(this.lfoSHG);
      this.lfoOscG.connect(this.lfoBus); this.lfoSHG.connect(this.lfoBus);
      this.lfoPitch = G(0); this.lfoCut = G(0); this.lfoAmp = G(0); this.lfoPan = G(0);
      [this.lfoPitch, this.lfoCut, this.lfoAmp, this.lfoPan].forEach((g) => this.lfoBus.connect(g));
      this.lfoOsc.start(); this.lfoSH.start();
      // response probes for filter visual
      this.probe1 = c.createBiquadFilter(); this.probe2 = c.createBiquadFilter();
      this.applyLfo(); this.applyFx();
      this.lastTick = performance.now();
      setInterval(() => this.tick(), 20);
    }
    makeIR(sec) {
      const c = this.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1);
      }
      return b;
    }
    waveFor(o) {
      if (BUILTIN[o.wave]) return null;
      let key, h;
      if (o.wave === 'pulse') { const d = Math.round(o.pw * 100) / 100; key = 'p' + d; if (!this.waves[key]) h = SL.harm('pulse', d); }
      else if (o.wave === 'wavetable') { const f = this.wtFrame(); key = 'w' + this.patch.wt.table + f; if (!this.waves[key]) h = SL.tableFrames(this.patch.wt.table)[f]; }
      else if (o.wave === 'additive') { key = 'a' + this.patch.add.h.map((v) => v.toFixed(2)).join(','); if (!this.waves[key]) h = SL.fromAmps(this.patch.add.h); }
      else if (o.wave === 'custom' && this.customH) { key = 'c' + this.customId; if (!this.waves[key]) h = this.customH; }
      else return null;
      if (h) this.waves[key] = this.ctx.createPeriodicWave(h.re, h.im);
      return this.waves[key];
    }
    setCustom(h) { this.customH = h; this.customId = (this.customId || 0) + 1; this.voices.forEach((v) => v.applyWaves()); }
    wtFrame() {
      const p = this.patch;
      let pos = p.wt.pos;
      if (p.lfo.target === 'wt' && p.lfo.depth > 0) pos = SL.clamp(pos + this.lfoVal * p.lfo.depth * 0.5, 0, 1);
      return Math.round(pos * (SL.WT_FRAMES - 1));
    }
    tick() {
      const now = performance.now(), dt = Math.min(0.1, (now - this.lastTick) / 1000);
      this.lastTick = now;
      const l = this.patch.lfo;
      const prev = this.lfoPhase;
      this.lfoPhase += dt * l.rate;
      const ph = this.lfoPhase % 1;
      if (Math.floor(this.lfoPhase) !== Math.floor(prev)) {
        this.shVal = Math.random() * 2 - 1;
        if (l.wave === 'sh') this.lfoSH.offset.setValueAtTime(this.shVal, this.ctx.currentTime);
      }
      this.lfoVal = { sine: Math.sin(2 * Math.PI * ph), triangle: 1 - 4 * Math.abs(ph - 0.5), square: ph < 0.5 ? 1 : -1, sawtooth: 2 * ph - 1, sh: this.shVal }[l.wave] || 0;
      const f = this.wtFrame();
      if (f !== this.wtFrameLive) {
        this.wtFrameLive = f;
        if (this.patch.osc1.wave === 'wavetable' || this.patch.osc2.wave === 'wavetable') this.voices.forEach((v) => v.applyWaves());
      }
      this.voices = this.voices.filter((v) => !v.dead);
    }
    applyLfo() {
      if (!this.ctx) return;
      const l = this.patch.lfo, t = this.ctx.currentTime, d = l.depth;
      const st = (g, v) => g.gain.setTargetAtTime(v, t, 0.02);
      st(this.lfoPitch, l.target === 'pitch' ? d * 1200 : 0);
      st(this.lfoCut, l.target === 'cutoff' ? d * 4800 : 0);
      st(this.lfoAmp, l.target === 'amp' ? d / 2 : 0);
      st(this.lfoPan, l.target === 'pan' ? d : 0);
      if (l.wave === 'sh') { st(this.lfoOscG, 0); st(this.lfoSHG, 1); }
      else { st(this.lfoOscG, 1); st(this.lfoSHG, 0); this.lfoOsc.type = l.wave; }
      this.lfoOsc.frequency.setTargetAtTime(l.rate, t, 0.02);
      this.voices.forEach((v) => v.trem.gain.setTargetAtTime(l.target === 'amp' ? 1 - d / 2 : 1, t, 0.02));
    }
    applyFx() {
      if (!this.ctx) return;
      const f = this.patch.fx, t = this.ctx.currentTime;
      if (f.drive > 0.001) {
        const k = 1 + f.drive * 30, n = 2048, cv = new Float32Array(n), nm = Math.tanh(k);
        for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; cv[i] = Math.tanh(k * x) / nm; }
        this.drive.curve = cv;
      } else this.drive.curve = null;
      if (f.crush > 0.001) {
        const bits = Math.max(1, Math.round(12 - f.crush * 11)), L = Math.pow(2, bits - 1), n = 4096, cv = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; cv[i] = Math.round(x * L) / L; }
        this.crush.curve = cv;
      } else this.crush.curve = null;
      this.dSend.gain.setTargetAtTime(f.delay, t, 0.02);
      this.dly.delayTime.setTargetAtTime(f.time, t, 0.05);
      this.dFb.gain.setTargetAtTime(f.fb, t, 0.02);
      this.rSend.gain.setTargetAtTime(f.reverb * 1.4, t, 0.02);
      this.master.gain.setTargetAtTime(this.patch.vol, t, 0.02);
    }
    set(path, v, silent) {
      SL.set(this.patch, path, v);
      if (this.ctx) {
        const top = path.split('.')[0];
        if (top === 'lfo') this.applyLfo();
        else if (top === 'fx' || path === 'vol') this.applyFx();
        else this.voices.forEach((x) => x.update(path));
      }
      if (!silent) this.emit(path, v);
    }
    load(patch, keepVoices) {
      this.patch = SL.merge(SL.DEFAULT, patch || {});
      if (!keepVoices) this.allOff(true);
      if (this.ctx) { this.applyLfo(); this.applyFx(); this.voices.forEach((v) => { v.applyWaves(); v.applyLevels(); v.applyDetune(); v.applyFilter(this.ctx.currentTime); }); }
      this.emit('*', null);
    }
    limit() {
      const live = this.voices.filter((v) => !v.dead);
      if (live.length > 14) live.slice(0, live.length - 14).forEach((v) => v.kill());
    }
    noteOn(note, vel, freq) {
      this.ensure();
      vel = vel == null ? 0.85 : vel;
      const t = this.ctx.currentTime, p = this.patch;
      if (p.mono) {
        this.monoStack = this.monoStack.filter((n) => n !== note); this.monoStack.push(note);
        const v = this.monoV;
        if (v && v.tOff == null && !v.dead) { v.note = note; v.setFreq(freq || SL.mtof(note), t, p.glide); v.applyFilter(t); return v; }
      }
      const old = this.held.get(note);
      if (old) old.release(t);
      const v = new Voice(this, note, t, vel, freq);
      this.voices.push(v); this.held.set(note, v);
      if (p.mono) this.monoV = v;
      this.limit();
      return v;
    }
    noteOff(note) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (this.patch.mono && this.monoV) {
        this.monoStack = this.monoStack.filter((n) => n !== note);
        if (this.monoStack.length) {
          const n = this.monoStack[this.monoStack.length - 1];
          this.monoV.note = n; this.monoV.setFreq(SL.mtof(n), t, this.patch.glide);
          return;
        }
        this.monoV.release(t); this.monoV = null; this.held.clear();
        return;
      }
      const v = this.held.get(note);
      if (v) { v.release(t); this.held.delete(note); }
    }
    setHeldFreq(note, f) {
      const v = this.held.get(note);
      if (v) v.setFreq(f, this.ctx.currentTime, 0.02);
    }
    play(note, when, dur, vel) {
      this.ensure();
      const v = new Voice(this, note, Math.max(when, this.ctx.currentTime), vel == null ? 0.85 : vel);
      v.release(v.t0 + dur);
      this.voices.push(v); this.limit();
      return v;
    }
    allOff(hard) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.voices.forEach((v) => (hard ? v.kill() : v.release(t)));
      this.held.clear(); this.monoStack = []; this.monoV = null;
    }
    latestVoice() {
      for (let i = this.voices.length - 1; i >= 0; i--) if (!this.voices[i].dead) return this.voices[i];
      return null;
    }
    now() { return this.ctx ? this.ctx.currentTime : 0; }
  }

  // ---------------------------- step clock ----------------------------
  class Clock {
    constructor(e) { this.e = e; this.timer = null; }
    start(interval, step) {
      this.stop();
      const c = this.e.ensure();
      this.interval = interval; this.step = step; this.i = 0; this.next = c.currentTime + 0.06;
      this.timer = setInterval(() => {
        while (this.next < c.currentTime + 0.12) {
          this.step(this.i, this.next);
          this.next += typeof this.interval === 'function' ? this.interval() : this.interval;
          this.i++;
        }
      }, 25);
    }
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
    get running() { return !!this.timer; }
  }

  SL.Engine = Engine;
  SL.Clock = Clock;
  SL.engine = new Engine();
  SL.clock = new Clock(SL.engine);
  // fire a callback at an audio time (for visual sync)
  SL.at = (when, fn) => setTimeout(fn, Math.max(0, (when - SL.engine.now()) * 1000));
})();

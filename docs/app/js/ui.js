// UI helpers, controls and visualisations.
(function () {
  const SL = window.SL, E = SL.engine;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);

  SL.C = { bg: '#0B0B14', panel: '#151527', line: '#26264a', text: '#EDEBFF', dim: '#8C89B5', pink: '#FF4FD8', cyan: '#3EF0FF', lime: '#B6FF3B', orange: '#FFB23E', violet: '#8A7DFF', red: '#FF5A6E' };

  const h = (SL.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    kids.flat(9).forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  });

  // ---- per-screen lifecycle ----
  SL.disposers = [];
  SL.onDispose = (fn) => SL.disposers.push(fn);
  SL.disposeScreen = () => { SL.disposers.splice(0).forEach((f) => { try { f(); } catch (e) { console.error(e); } }); };
  SL.listen = (fn) => SL.onDispose(E.on(fn));

  // ---- animation loop ----
  const drawers = new Set();
  SL.anim = (fn) => { drawers.add(fn); SL.onDispose(() => drawers.delete(fn)); };
  (function loop() { drawers.forEach((f) => { try { f(); } catch (e) { console.error(e); drawers.delete(f); } }); requestAnimationFrame(loop); })();

  SL.fit = function (cv) {
    const r = cv.getBoundingClientRect(), d = DPR();
    const w = Math.max(1, Math.round(r.width * d)), hh = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    return { g: cv.getContext('2d'), w, h: hh, d };
  };

  // ---- formatting ----
  SL.fmt = {
    hz: (v) => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : Math.round(v) + ' Hz'),
    sec: (v) => (v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s'),
    pct: (v) => Math.round(v * 100) + '%',
    bip: (v) => (v > 0 ? '+' : '') + Math.round(v * 100) + '%',
    num: (v) => (Math.abs(v) < 10 ? (+v).toFixed(2) : Math.round(v)).toString(),
  };
  const F = SL.fmt;

  // option labels are keys under opt.* (or full keys like tables.vocal) in the language files
  const WAVES = ['sine', 'triangle', 'sawtooth', 'square', 'pulse'].map((w) => [w, w]);
  const WAVES_ALL = WAVES.concat([['wavetable', 'wavetable'], ['additive', 'additive']]);
  const ENVF = (k) => ({ [k + '.a']: { min: 0.001, max: 5, log: 1, f: F.sec }, [k + '.d']: { min: 0.005, max: 5, log: 1, f: F.sec }, [k + '.s']: { min: 0, max: 1, f: F.pct }, [k + '.r']: { min: 0.005, max: 8, log: 1, f: F.sec } });
  SL.CT = Object.assign({
    'osc1.wave': { opts: WAVES }, 'osc1.waveAll': { k: 'osc1.wave', opts: WAVES_ALL },
    'osc1.oct': { min: -2, max: 2, step: 1, f: (v) => (v > 0 ? '+' : '') + v },
    'osc1.detune': { min: -100, max: 100, step: 1, f: (v) => Math.round(v) + ' ct' },
    'osc1.pw': { min: 0.02, max: 0.98, step: 0.01, f: F.pct },
    'osc1.level': { min: 0, max: 1, f: F.pct },
    'osc2.wave': { opts: WAVES }, 'osc2.waveAll': { k: 'osc2.wave', opts: WAVES_ALL },
    'osc2.oct': { min: -2, max: 2, step: 1, f: (v) => (v > 0 ? '+' : '') + v },
    'osc2.semi': { min: -12, max: 12, step: 1, f: (v) => (v > 0 ? '+' : '') + v + ' st' },
    'osc2.detune': { min: -100, max: 100, step: 1, f: (v) => Math.round(v) + ' ct' },
    'osc2.pw': { min: 0.02, max: 0.98, step: 0.01, f: F.pct },
    'osc2.level': { min: 0, max: 1, f: F.pct },
    noise: { min: 0, max: 1, f: F.pct },
    'uni.voices': { min: 1, max: 7, step: 1, f: (v) => v + 'x' },
    'uni.detune': { min: 0, max: 100, step: 1, f: (v) => Math.round(v) + ' ct' },
    'filter.type': { opts: [['lowpass', 'Low-pass'], ['highpass', 'High-pass'], ['bandpass', 'Band-pass'], ['notch', 'Notch']] },
    'filter.cutoff': { min: 20, max: 20000, log: 1, f: F.hz },
    'filter.q': { min: 0.3, max: 30, log: 1, f: (v) => v.toFixed(1) },
    'filter.slope': { opts: [[12, '12 dB/oct'], [24, '24 dB/oct']] },
    'filter.env': { min: -1, max: 1, step: 0.01, f: F.bip },
    'filter.key': { min: 0, max: 1, f: F.pct },
    'penv.amt': { min: 0, max: 48, step: 1, f: (v) => v + ' st' },
    'penv.decay': { min: 0.005, max: 1, log: 1, f: F.sec },
    'lfo.wave': { opts: ['sine', 'triangle', 'square', 'sawtooth', 'sh'].map((w) => [w, w]) },
    'lfo.rate': { min: 0.05, max: 40, log: 1, f: (v) => v.toFixed(2) + ' Hz' },
    'lfo.depth': { min: 0, max: 1, f: F.pct },
    'lfo.target': { opts: ['pitch', 'cutoff', 'amp', 'pan', 'wt'].map((x) => [x, x]) },
    'fm.ratio': { min: 0.25, max: 12, step: 0.01, snap: 1, f: (v) => v.toFixed(2) },
    'fm.index': { min: 0, max: 20, step: 0.05, f: (v) => v.toFixed(2) },
    'fm.env': { min: 0, max: 1, f: F.pct },
    'fm.decay': { min: 0.02, max: 4, log: 1, f: F.sec },
    'wt.table': { opts: Object.keys(SL.TABLES).map((k) => [k, 'tables.' + k]) },
    'wt.pos': { min: 0, max: 1, f: F.pct },
    'fx.drive': { min: 0, max: 1, f: F.pct },
    'fx.crush': { min: 0, max: 1, f: (v) => (v ? Math.max(1, Math.round(12 - v * 11)) + ' bits' : 'off') },
    'fx.delay': { min: 0, max: 0.9, f: F.pct },
    'fx.time': { min: 0.02, max: 1.2, f: F.sec },
    'fx.fb': { min: 0, max: 0.9, f: F.pct },
    'fx.reverb': { min: 0, max: 1, f: F.pct },
    glide: { min: 0, max: 1, f: F.sec },
    mono: { opts: [[false, 'poly'], [true, 'mono']] },
    vol: { min: 0, max: 1, f: F.pct },
  }, ENVF('amp'), ENVF('fenv'));

  SL.optLabel = (lab) => {
    let v = SL.t('opt.' + lab);
    if (v !== 'opt.' + lab) return v;
    v = SL.t(String(lab));
    return typeof v === 'string' ? v : String(lab);
  };

  // ---- slider / segmented control bound to engine params ----
  SL.control = function (spec) {
    const key = typeof spec === 'string' ? spec : spec.k;
    const def = Object.assign({}, SL.CT[key] || {}, typeof spec === 'object' ? spec : {});
    const path = def.k || key;
    def.l = def.l || SL.tc(path);
    if (def.opts) {
      const btns = def.opts.map(([v, lab]) => h('button', { class: 'seg', onclick: () => { E.ensure(); E.set(path, v); } }, SL.optLabel(lab)));
      const sync = () => { const cur = SL.get(E.patch, path); btns.forEach((b, i) => b.classList.toggle('on', def.opts[i][0] === cur)); };
      sync();
      SL.listen((p) => (p === path || p === '*') && sync());
      return h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, def.l), h('div', { class: 'segs' }, btns));
    }
    const toPos = (v) => (def.log ? Math.log(v / def.min) / Math.log(def.max / def.min) : (v - def.min) / (def.max - def.min));
    const fromPos = (p) => {
      let v = def.log ? def.min * Math.pow(def.max / def.min, p) : def.min + p * (def.max - def.min);
      if (def.step) v = Math.round(v / def.step) * def.step;
      if (def.snap && Math.abs(v - Math.round(v)) < 0.06) v = Math.round(v);
      return +v.toFixed(5);
    };
    const inp = h('input', { type: 'range', min: 0, max: 1000, step: 1 });
    const val = h('span', { class: 'ctl-v' });
    const fmt = def.f || F.num;
    const sync = () => { const v = SL.get(E.patch, path); inp.value = Math.round(toPos(v) * 1000); val.textContent = fmt(v); fill(); };
    const fill = () => inp.style.setProperty('--p', inp.value / 10 + '%');
    inp.addEventListener('input', () => { E.ensure(); const v = fromPos(inp.value / 1000); E.set(path, v); val.textContent = fmt(v); fill(); });
    sync();
    SL.listen((p) => (p === path || p === '*') && sync());
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, def.l, val), inp);
  };

  // ---- glowing line helper ----
  function glow(g, color, width, blur) { g.strokeStyle = color; g.lineWidth = width; g.shadowColor = color; g.shadowBlur = blur; g.lineJoin = 'round'; g.lineCap = 'round'; }
  function grid(g, w, hh, d) {
    g.strokeStyle = 'rgba(138,125,255,0.09)'; g.lineWidth = 1;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo((w * i) / 8, 0); g.lineTo((w * i) / 8, hh); g.stroke(); }
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, (hh * i) / 4); g.lineTo(w, (hh * i) / 4); g.stroke(); }
  }
  SL.label = (g, txt, x, y, d, color, align) => { g.shadowBlur = 0; g.fillStyle = color || SL.C.dim; g.font = `${11 * d}px system-ui,sans-serif`; g.textAlign = align || 'left'; g.fillText(txt, x, y); };

  // ---- visualisers: each is (canvas) => draw() ----
  const tbuf = new Float32Array(4096), fbuf = new Float32Array(2048);
  SL.viz = {};
  SL.viz.scope = (cv, opts) => () => {
    const { g, w, h: hh, d } = SL.fit(cv);
    g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
    if (!E.ctx) return SL.label(g, SL.t('viz.playNote'), 10 * d, 18 * d, d);
    E.ana.getFloatTimeDomainData(tbuf);
    let s = 0;
    for (let i = 1; i < 2000; i++) if (tbuf[i - 1] < 0 && tbuf[i] >= 0) { s = i; break; }
    const N = (opts && opts.n) || 1024;
    g.beginPath();
    for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * w, y = hh / 2 - tbuf[s + i] * hh * 0.42; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    glow(g, SL.C.cyan, 2.2 * d, 14 * d); g.stroke();
    g.shadowBlur = 0; SL.label(g, SL.t('viz.scope'), 10 * d, 16 * d, d);
  };
  const fx = (f, w) => (w * Math.log(f / 20)) / Math.log(1000);
  const xf = (x, w) => 20 * Math.pow(1000, x / w);
  SL.viz.spectrum = (cv, opts) => {
    opts = opts || {};
    const freqs = new Float32Array(160), m1 = new Float32Array(160), m2 = new Float32Array(160), ph = new Float32Array(160);
    for (let i = 0; i < 160; i++) freqs[i] = 20 * Math.pow(1000, i / 159);
    let drag = false;
    if (opts.filter) {
      const setFrom = (ev) => {
        const r = cv.getBoundingClientRect();
        const x = SL.clamp((ev.clientX - r.left) / r.width, 0, 1), y = SL.clamp((ev.clientY - r.top) / r.height, 0, 1);
        E.ensure();
        E.set('filter.cutoff', Math.round(20 * Math.pow(1000, x)));
        E.set('filter.q', +(0.3 * Math.pow(100, 1 - y)).toFixed(2));
      };
      cv.addEventListener('pointerdown', (ev) => { drag = true; cv.setPointerCapture(ev.pointerId); setFrom(ev); });
      cv.addEventListener('pointermove', (ev) => drag && setFrom(ev));
      cv.addEventListener('pointerup', () => (drag = false));
      cv.style.touchAction = 'none';
    }
    return () => {
      const { g, w, h: hh, d } = SL.fit(cv);
      g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
      [100, 1000, 10000].forEach((f) => SL.label(g, F.hz(f), fx(f, w) + 3 * d, hh - 6 * d, d));
      if (E.ctx) {
        E.ana.getFloatFrequencyData(fbuf);
        const bin = E.ctx.sampleRate / E.ana.fftSize;
        const grad = g.createLinearGradient(0, 0, 0, hh);
        grad.addColorStop(0, 'rgba(255,79,216,0.85)'); grad.addColorStop(1, 'rgba(138,125,255,0.05)');
        g.beginPath(); g.moveTo(0, hh);
        for (let x = 0; x <= w; x += 2 * d) {
          const f0 = xf(x, w), f1 = xf(x + 2 * d, w);
          let mx = -140;
          for (let b = Math.floor(f0 / bin); b <= Math.ceil(f1 / bin) && b < fbuf.length; b++) mx = Math.max(mx, fbuf[b]);
          const y = hh - SL.clamp((mx + 100) / 90, 0, 1) * hh;
          g.lineTo(x, y);
        }
        g.lineTo(w, hh); g.closePath(); g.fillStyle = grad; g.shadowBlur = 0; g.fill();
      }
      if (opts.filter && E.ctx) {
        const f = E.patch.filter, p1 = E.probe1, p2 = E.probe2;
        let cut = f.cutoff;
        const v = E.latestVoice();
        if (v && f.env) cut *= Math.pow(2, f.env * 6 * SL.envValue(E.patch.fenv, E.now() - v.t0, v.tOff == null ? null : v.tOff - v.t0));
        if (E.patch.lfo.target === 'cutoff') cut *= Math.pow(2, E.lfoVal * E.patch.lfo.depth * 4);
        cut = SL.clamp(cut, 20, 20000);
        const lphp = f.type === 'lowpass' || f.type === 'highpass';
        p1.type = f.type; p1.frequency.value = cut; p1.Q.value = lphp ? 20 * Math.log10(f.q) : f.q;
        p1.getFrequencyResponse(freqs, m1, ph);
        if (f.slope === 24) { p2.type = f.type; p2.frequency.value = cut; p2.Q.value = lphp ? -3.01 : f.q; p2.getFrequencyResponse(freqs, m2, ph); }
        g.beginPath();
        for (let i = 0; i < 160; i++) {
          const mag = m1[i] * (f.slope === 24 ? m2[i] : 1);
          const db = 20 * Math.log10(Math.max(mag, 1e-5));
          const y = hh * 0.45 - (db / 48) * hh * 0.45;
          const x = (i / 159) * w;
          i ? g.lineTo(x, SL.clamp(y, 0, hh)) : g.moveTo(x, SL.clamp(y, 0, hh));
        }
        glow(g, SL.C.lime, 2.5 * d, 12 * d); g.stroke();
        const cx = fx(cut, w), cy = hh * (1 - Math.log(f.q / 0.3) / Math.log(100));
        g.beginPath(); g.arc(cx, cy, 9 * d, 0, 7); g.fillStyle = 'rgba(182,255,59,0.25)'; g.fill(); glow(g, SL.C.lime, 2 * d, 10 * d); g.stroke();
        SL.label(g, SL.t('viz.filter'), 10 * d, 16 * d, d);
      } else SL.label(g, SL.t('viz.spectrum'), 10 * d, 16 * d, d);
    };
  };

  // one cycle of osc1 (and osc2 if audible)
  SL.oscCycle = function (o) {
    const p = E.patch;
    if (o.wave === 'wavetable') return SL.cycle(SL.tableFrames(p.wt.table)[E.wtFrameLive != null ? E.wtFrame() : 0], 256);
    if (o.wave === 'additive') return SL.cycle(SL.fromAmps(p.add.h), 256);
    if (o.wave === 'custom' && E.customH) return SL.cycle(E.customH, 256);
    return SL.cycle(SL.harm(o.wave, o.pw), 256);
  };
  SL.viz.wave = (cv) => () => {
    const { g, w, h: hh, d } = SL.fit(cv), p = E.patch;
    g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
    const draw = (cyc, color, cycles) => {
      g.beginPath();
      const N = 256 * cycles;
      for (let i = 0; i <= N; i++) { const x = (i / N) * w, y = hh / 2 - cyc[i % 256] * hh * 0.38; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      glow(g, color, 2.5 * d, 14 * d); g.stroke();
    };
    let c1 = SL.oscCycle(p.osc1);
    if (p.fm.index > 0) {
      const r = p.fm.ratio, I = p.fm.index, c = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = (2 * Math.PI * i) / 256; c[i] = Math.sin(x + I * Math.sin(r * x)); }
      c1 = c;
    }
    if (p.osc2.level > 0.01) draw(SL.oscCycle(p.osc2), SL.C.orange, 2);
    draw(c1, SL.C.pink, 2);
    g.shadowBlur = 0; SL.label(g, SL.t('viz.cycle'), 10 * d, 16 * d, d);
  };

  SL.viz.adsr = (cv, key) => {
    key = key || 'amp';
    const MAXW = 0.27, SUS = 0.14;
    const tx = (t, w) => Math.sqrt(t / 5) * MAXW * w;
    const xt = (x, w) => 5 * Math.pow(SL.clamp(x / (MAXW * w), 0, 1), 2);
    let drag = null;
    const pts = (w, hh) => {
      const e = E.patch[key], pad = 14 * DPR(), top = 26 * DPR(), bot = hh - pad;
      const xa = pad + tx(e.a, w), xd = xa + tx(e.d, w), xs = xd + SUS * w, xr = xs + tx(e.r, w);
      const ys = bot - (bot - top) * e.s;
      return { pad, top, bot, xa, xd, xs, xr, ys };
    };
    cv.style.touchAction = 'none';
    const pos = (ev) => { const r = cv.getBoundingClientRect(), d = DPR(); return [(ev.clientX - r.left) * d, (ev.clientY - r.top) * d]; };
    cv.addEventListener('pointerdown', (ev) => {
      const { w, h: hh } = SL.fit(cv), P = pts(w, hh), [x, y] = pos(ev);
      const c = [['a', P.xa, P.top], ['d', P.xd, P.ys], ['r', P.xr, P.bot]];
      let best = null, bd = 1e9;
      c.forEach(([n, px, py]) => { const dd = Math.hypot(px - x, py - y); if (dd < bd) { bd = dd; best = n; } });
      drag = best; cv.setPointerCapture(ev.pointerId); E.ensure();
    });
    cv.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const { w, h: hh } = SL.fit(cv), P = pts(w, hh), [x, y] = pos(ev), r3 = (v) => +v.toFixed(3);
      if (drag === 'a') E.set(key + '.a', r3(Math.max(0.001, xt(x - P.pad, w))));
      if (drag === 'd') { E.set(key + '.d', r3(Math.max(0.005, xt(x - P.xa, w)))); E.set(key + '.s', r3(SL.clamp((P.bot - y) / (P.bot - P.top), 0, 1))); }
      if (drag === 'r') E.set(key + '.r', r3(Math.max(0.005, xt(x - P.xs, w))));
    });
    cv.addEventListener('pointerup', () => (drag = null));
    const col = key === 'amp' ? SL.C.orange : SL.C.lime;
    return () => {
      const { g, w, h: hh, d } = SL.fit(cv), P = pts(w, hh), e = E.patch[key];
      g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
      g.beginPath(); g.moveTo(P.pad, P.bot); g.lineTo(P.xa, P.top);
      for (let i = 1; i <= 30; i++) { const t = (i / 30) * e.d * 1.5, x = P.xa + (tx(e.d, w) * i) / 30; g.lineTo(x, P.bot - (P.bot - P.top) * (e.s + (1 - e.s) * Math.exp(-t / (e.d / 3)))); }
      g.lineTo(P.xs, P.ys);
      for (let i = 1; i <= 30; i++) { const t = (i / 30) * e.r, x = P.xs + (tx(e.r, w) * i) / 30; g.lineTo(x, P.bot - (P.ys > 0 ? (P.bot - P.ys) * Math.exp(-t / (e.r / 4)) : 0)); }
      const grad = g.createLinearGradient(0, P.top, 0, P.bot);
      grad.addColorStop(0, col + '55'); grad.addColorStop(1, col + '00');
      glow(g, col, 2.5 * d, 12 * d); g.stroke();
      g.lineTo(P.xr, P.bot); g.lineTo(P.pad, P.bot); g.fillStyle = grad; g.shadowBlur = 0; g.fill();
      [[P.xa, P.top, 'A'], [P.xd, P.ys, 'D/S'], [P.xr, P.bot, 'R']].forEach(([x, y, l]) => {
        g.beginPath(); g.arc(x, y, 8 * d, 0, 7); g.fillStyle = SL.C.bg; g.fill(); glow(g, col, 2 * d, 8 * d); g.stroke();
        SL.label(g, l, x, y - 13 * d, d, SL.C.text, 'center');
      });
      // playhead
      const v = E.latestVoice();
      if (v && !v.dead) {
        const t = E.now() - v.t0, off = v.tOff == null ? null : v.tOff - v.t0;
        if (t >= 0) {
          const val = SL.envValue(e, t, off != null && off <= t ? off : null);
          let x;
          if (t < e.a) x = P.pad + tx(e.a, w) * (t / Math.max(e.a, 0.001));
          else if (off == null || t < off) x = P.xa + Math.min(1, (t - e.a) / Math.max(e.d * 1.5, 0.01)) * (P.xs - P.xa);
          else x = P.xs + Math.min(1, (t - off) / Math.max(e.r, 0.01)) * (P.xr - P.xs);
          const y = P.bot - (P.bot - P.top) * val;
          g.beginPath(); g.arc(x, y, 6 * d, 0, 7); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 18 * d; g.fill();
        }
      }
      g.shadowBlur = 0; SL.label(g, SL.t(key === 'amp' ? 'viz.ampEnv' : 'viz.filtEnv') + ' · ' + SL.t('viz.drag'), 10 * d, 16 * d, d);
    };
  };

  SL.viz.lfo = (cv) => {
    const hist = new Float32Array(200);
    let i = 0;
    return () => {
      const { g, w, h: hh, d } = SL.fit(cv), l = E.patch.lfo;
      g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
      hist[i++ % 200] = E.lfoVal * l.depth;
      g.beginPath();
      for (let k = 0; k < 200; k++) { const v = hist[(i + k) % 200], x = (k / 199) * w * 0.85, y = hh / 2 - v * hh * 0.4; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      glow(g, SL.C.violet, 2.5 * d, 12 * d); g.stroke();
      const y = hh / 2 - E.lfoVal * l.depth * hh * 0.4;
      g.beginPath(); g.arc(w * 0.85, y, 8 * d, 0, 7); g.fillStyle = SL.C.violet; g.fill();
      const tl = SL.t('viz.targets.' + l.target);
      g.shadowBlur = 0; SL.label(g, 'LFO → ' + tl + '   ' + l.rate.toFixed(2) + ' Hz', 10 * d, 16 * d, d);
      g.beginPath(); g.moveTo(w * 0.85 + 12 * d, y); g.lineTo(w - 10 * d, y); g.setLineDash([4 * d, 4 * d]); g.strokeStyle = SL.C.violet; g.lineWidth = d; g.stroke(); g.setLineDash([]);
    };
  };

  // Bessel J_n(x) via series
  SL.bessel = function (n, x) {
    n = Math.abs(n);
    let s = 0, fact = 1;
    for (let k = 1; k <= n; k++) fact *= k;
    let kf = 1;
    for (let k = 0; k < 40; k++) {
      if (k > 0) kf *= k;
      const term = (Math.pow(-1, k) / (kf * fact * pf(n, k))) * Math.pow(x / 2, 2 * k + n);
      s += term;
      if (Math.abs(term) < 1e-9 && k > x) break;
    }
    return s;
    function pf(n, k) { let r = 1; for (let i = 1; i <= k; i++) r *= n + i; return r; }
  };
  SL.viz.fm = (cv) => () => {
    const { g, w, h: hh, d } = SL.fit(cv), p = E.patch.fm;
    g.clearRect(0, 0, w, hh); grid(g, w, hh, d);
    const MAXH = 12, bars = new Map();
    for (let n = -30; n <= 30; n++) {
      let f = 1 + n * p.ratio;
      const a = SL.bessel(n, p.index) * (f < 0 ? -1 : 1);
      f = Math.abs(f);
      if (f > MAXH) continue;
      const k = f.toFixed(3);
      bars.set(k, (bars.get(k) || 0) + a);
    }
    const base = hh - 22 * d;
    for (let k = 1; k <= MAXH; k++) { const x = 12 * d + (k / MAXH) * (w - 24 * d); SL.label(g, k + 'f', x, hh - 6 * d, d, SL.C.dim, 'center'); }
    bars.forEach((a, k) => {
      const f = +k, x = 12 * d + (f / MAXH) * (w - 24 * d), bh = Math.min(1, Math.abs(a)) * (base - 30 * d);
      const harmonic = Math.abs(f - Math.round(f)) < 0.01;
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - bh);
      glow(g, harmonic ? SL.C.cyan : SL.C.orange, 4 * d, 10 * d); g.stroke();
    });
    g.shadowBlur = 0;
    SL.label(g, SL.t('viz.fm'), 10 * d, 16 * d, d);
    SL.label(g, SL.t('viz.harmonic'), 10 * d, 32 * d, d, SL.C.cyan); SL.label(g, SL.t('viz.inharmonic'), w / 2, 32 * d, d, SL.C.orange);
  };

  SL.viz.wt3d = (cv) => {
    const cache = {};
    return () => {
      const { g, w, h: hh, d } = SL.fit(cv), p = E.patch;
      const name = p.wt.table;
      if (!cache[name]) cache[name] = SL.tableFrames(name).map((f) => SL.cycle(f, 96));
      const fr = cache[name], N = fr.length, cur = E.ctx ? E.wtFrame() : Math.round(p.wt.pos * (N - 1));
      g.clearRect(0, 0, w, hh);
      const ox = w * 0.28, oy = hh * 0.5, ww = w * 0.62, amp = hh * 0.12;
      for (let k = N - 1; k >= 0; k--) {
        const sx = 10 * d + (k / (N - 1)) * ox, sy = hh * 0.22 + (k / (N - 1)) * oy;
        g.beginPath();
        for (let i = 0; i < 96; i++) { const x = sx + (i / 95) * ww, y = sy + 30 * d - fr[k][i] * amp; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        if (k === cur) { glow(g, SL.C.pink, 3 * d, 18 * d); }
        else { g.shadowBlur = 0; g.strokeStyle = `rgba(62,240,255,${0.12 + 0.35 * (1 - Math.abs(k - cur) / N)})`; g.lineWidth = d; }
        g.stroke();
      }
      g.shadowBlur = 0; SL.label(g, SL.t('viz.wt') + ' · ' + SL.t('tables.' + name).toUpperCase() + ' · ' + SL.t('viz.frame') + ' ' + (cur + 1) + '/' + N, 10 * d, 16 * d, d);
    };
  };

  SL.viz.harm = (cv) => {
    const N = 24;
    let drag = false;
    cv.style.touchAction = 'none';
    const setFrom = (ev) => {
      const r = cv.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      const i = SL.clamp(Math.floor(x * N), 0, N - 1);
      const v = +SL.clamp((0.95 - y) / 0.5, 0, 1).toFixed(2);
      const hs = E.patch.add.h.slice(); hs[i] = v;
      E.set('add.h', hs);
    };
    cv.addEventListener('pointerdown', (ev) => { drag = true; cv.setPointerCapture(ev.pointerId); E.ensure(); setFrom(ev); });
    cv.addEventListener('pointermove', (ev) => drag && setFrom(ev));
    cv.addEventListener('pointerup', () => (drag = false));
    return () => {
      const { g, w, h: hh, d } = SL.fit(cv), hs = E.patch.add.h;
      g.clearRect(0, 0, w, hh);
      const bw = w / N;
      hs.forEach((v, i) => {
        const x = i * bw, y0 = hh * 0.95, bh = v * hh * 0.5;
        const grad = g.createLinearGradient(0, y0 - bh, 0, y0);
        grad.addColorStop(0, SL.C.pink); grad.addColorStop(1, SL.C.violet + '44');
        g.fillStyle = grad; g.fillRect(x + bw * 0.15, y0 - bh, bw * 0.7, bh);
        if (i < 9 || i % 4 === 3) SL.label(g, String(i + 1), x + bw / 2, hh * 0.99, d, SL.C.dim, 'center');
      });
      const cyc = SL.cycle(SL.fromAmps(hs), 256);
      g.beginPath();
      for (let i = 0; i <= 512; i++) { const x = (i / 512) * w, y = hh * 0.23 - cyc[i % 256] * hh * 0.17; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      glow(g, SL.C.cyan, 2.2 * d, 12 * d); g.stroke();
      g.shadowBlur = 0; SL.label(g, SL.t('viz.harm'), 10 * d, 14 * d, d);
    };
  };

  // ---- stage: canvas with chips to switch visualisers ----
  SL.stage = function (list, opts) {
    opts = opts || {};
    const cv = h('canvas', { class: 'stage-cv' });
    const chips = h('div', { class: 'chips' });
    const wrap = h('div', { class: 'stage' + (opts.tall ? ' tall' : '') }, cv, chips);
    let cur = null, drawFn = null, cvEl = cv;
    function pick(name) {
      cur = name;
      const fresh = h('canvas', { class: 'stage-cv' });
      wrap.replaceChild(fresh, cvEl); cvEl = fresh;
      const mk = { scope: SL.viz.scope, spectrum: SL.viz.spectrum, filter: (c) => SL.viz.spectrum(c, { filter: true }), wave: SL.viz.wave, adsr: (c) => SL.viz.adsr(c, 'amp'), fenv: (c) => SL.viz.adsr(c, 'fenv'), lfo: SL.viz.lfo, fm: SL.viz.fm, wt3d: SL.viz.wt3d, harm: SL.viz.harm }[name];
      drawFn = mk(fresh);
      [...chips.children].forEach((b) => b.classList.toggle('on', b.dataset.v === name));
    }
    if (list.length > 1) list.forEach((n) => chips.append(h('button', { class: 'chip', 'data-v': n, onclick: () => pick(n) }, SL.t('viz.tabs.' + n))));
    pick(list[0]);
    SL.anim(() => drawFn && drawFn());
    wrap.pick = pick;
    return wrap;
  };

  // ---- keyboard ----
  SL.keyboard = function (opts) {
    opts = opts || {};
    let base = opts.start || 48;
    const span = opts.span || 17;
    const el = h('div', { class: 'kb' });
    const active = new Map();
    const black = (m) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
    let keys = [];
    function build() {
      el.innerHTML = ''; keys = [];
      const whites = [];
      for (let m = base; m < base + span; m++) if (!black(m)) whites.push(m);
      const ww = 100 / whites.length;
      let wi = 0;
      for (let m = base; m < base + span; m++) {
        const k = h('div', { class: 'key ' + (black(m) ? 'blk' : 'wht'), 'data-n': m });
        if (black(m)) k.style.cssText = `left:${wi * ww - ww * 0.32}%;width:${ww * 0.64}%`;
        else { k.style.cssText = `left:${wi * ww}%;width:${ww}%`; if (m % 12 === 0) k.append(h('span', null, SL.noteName(m))); wi++; }
        keys.push(k); el.append(k);
      }
    }
    build();
    const noteAt = (x, y) => { const t = document.elementFromPoint(x, y); const k = t && t.closest && t.closest('.key'); return k && el.contains(k) ? +k.dataset.n : null; };
    const on = (m) => { const k = el.querySelector(`[data-n="${m}"]`); k && k.classList.add('down'); (opts.onNote || ((n) => E.noteOn(n)))(m); };
    const off = (m) => { const k = el.querySelector(`[data-n="${m}"]`); k && k.classList.remove('down'); (opts.offNote || ((n) => E.noteOff(n)))(m); };
    el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); const m = noteAt(ev.clientX, ev.clientY); if (m == null) return; el.setPointerCapture && el.setPointerCapture(ev.pointerId); active.set(ev.pointerId, m); on(m); });
    el.addEventListener('pointermove', (ev) => {
      if (!active.has(ev.pointerId)) return;
      const m = noteAt(ev.clientX, ev.clientY), old = active.get(ev.pointerId);
      if (m != null && m !== old) { off(old); active.set(ev.pointerId, m); on(m); }
    });
    const up = (ev) => { if (!active.has(ev.pointerId)) return; off(active.get(ev.pointerId)); active.delete(ev.pointerId); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.shift = (n) => { active.forEach((m) => off(m)); active.clear(); base = SL.clamp(base + n, 24, 84); build(); };
    SL.onDispose(() => active.forEach((m) => off(m)));
    return el;
  };

  // ---- small svg icons for answer options ----
  SL.svgWave = function (wave, color) {
    const cyc = SL.cycle(SL.harm(wave, 0.25), 64);
    let d = '';
    for (let i = 0; i <= 128; i++) d += (i ? 'L' : 'M') + ((i / 128) * 96 + 2).toFixed(1) + ',' + (20 - cyc[i % 64] * 15).toFixed(1);
    return `<svg viewBox="0 0 100 40" class="ico"><path d="${d}" fill="none" stroke="${color || SL.C.cyan}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  };
  SL.svgEnv = function (e, color) {
    const tw = (t) => Math.sqrt(Math.min(t, 5) / 5) * 30;
    const xa = 2 + tw(e.a), xd = xa + tw(e.d), xs = xd + 20, xr = xs + tw(e.r), ys = 36 - 32 * e.s;
    return `<svg viewBox="0 0 100 40" class="ico"><path d="M2,36 L${xa},4 L${xd},${ys} L${xs},${ys} L${xr},36" fill="none" stroke="${color || SL.C.orange}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  };
  SL.svgFilter = function (type, color) {
    const p = { lowpass: 'M2,12 L50,12 Q62,4 70,20 L90,38', highpass: 'M10,38 L30,20 Q38,4 50,12 L98,12', bandpass: 'M10,38 Q40,30 50,6 Q60,30 90,38', notch: 'M2,10 L38,10 Q50,10 50,38 Q50,10 62,10 L98,10' }[type];
    return `<svg viewBox="0 0 100 40" class="ico"><path d="${p}" fill="none" stroke="${color || SL.C.lime}" stroke-width="3"/></svg>`;
  };

  SL.toast = function (msg, kind) {
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    document.body.append(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2200);
  };
})();

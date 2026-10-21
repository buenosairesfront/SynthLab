// Experimental lab: each experiment builds its own screen body.
(function () {
  const SL = window.SL, E = SL.engine, h = SL.h, C = SL.C;
  const PENTA = [0, 3, 5, 7, 10];

  function slider(label, min, max, val, fmt, on, log) {
    const toP = (v) => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min));
    const fromP = (p) => (log ? min * Math.pow(max / min, p) : min + p * (max - min));
    const inp = h('input', { type: 'range', min: 0, max: 1000, value: Math.round(toP(val) * 1000) });
    const v = h('span', { class: 'ctl-v' }, fmt(val));
    const fill = () => inp.style.setProperty('--p', inp.value / 10 + '%');
    fill();
    inp.addEventListener('input', () => { const x = fromP(inp.value / 1000); v.textContent = fmt(x); fill(); on(x); });
    return h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, label, v), inp);
  }
  SL.slider = slider;
  const card = (...k) => h('div', { class: 'card' }, ...k);
  const dock = (opts) => { const kb = SL.keyboard(opts); return h('div', { class: 'dock' }, h('div', { class: 'dock-row' }, h('button', { class: 'pill', onclick: () => kb.shift(-12) }, '− oct'), h('button', { class: 'pill', onclick: () => kb.shift(12) }, '+ oct')), kb); };
  const canvas = (cls) => h('canvas', { class: cls || 'stage-cv' });

  SL.LAB = [
    // ------------------------------------------------------------------
    { id: 'string', name: 'Cuerda física', col: C.cyan, desc: 'Karplus-Strong: una cuerda hecha con ruido y un delay.', build(root) {
      const st = { damp: 0.996, bright: 0.5, exc: 'noise', last: null, t0: 0, N: 100 };
      E.load({ fx: { reverb: 0.25 } });
      const cv = canvas();
      const ks = (note) => {
        const c = E.ensure(), sr = c.sampleRate, f = SL.mtof(note), N = Math.max(2, Math.round(sr / f));
        const len = Math.floor(sr * 3.5), out = new Float32Array(len), line = new Float32Array(N);
        let lp = 0;
        for (let i = 0; i < N; i++) {
          const x = st.exc === 'noise' ? Math.random() * 2 - 1 : st.exc === 'saw' ? (i / N) * 2 - 1 : Math.sin((Math.PI * i) / N);
          lp = lp + (0.1 + st.bright * 0.9) * (x - lp); line[i] = lp;
        }
        const b = 0.5 - (1 - st.bright) * 0.45;
        for (let i = 0; i < len; i++) {
          const k = i % N, nx = (i + 1) % N;
          out[i] = line[k];
          line[k] = st.damp * ((1 - b) * line[k] + b * line[nx]);
        }
        const buf = c.createBuffer(1, len, sr); buf.copyToChannel(out, 0);
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = buf; g.gain.value = 0.7; src.connect(g); g.connect(E.bus); src.start();
        st.last = out; st.t0 = c.currentTime; st.N = N;
      };
      SL.anim(() => {
        const { g, w, h: hh, d } = SL.fit(cv);
        g.clearRect(0, 0, w, hh);
        g.strokeStyle = 'rgba(138,125,255,0.25)'; g.lineWidth = d;
        [[0.06, hh / 2], [0.94, hh / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x * w, y, 6 * d, 0, 7); g.fillStyle = C.violet; g.fill(); });
        let amp = 0;
        g.beginPath();
        const s0 = st.last ? Math.floor((E.now() - st.t0) * E.ctx.sampleRate) : 0;
        for (let i = 0; i <= 120; i++) {
          let y = 0;
          if (st.last && s0 < st.last.length - st.N) {
            const k = s0 + Math.floor((i / 120) * st.N);
            y = st.last[k] * Math.sin((Math.PI * i) / 120);
            amp = Math.max(amp, Math.abs(st.last[k]));
          }
          const x = w * 0.06 + (i / 120) * w * 0.88, yy = hh / 2 - y * hh * 0.35;
          i ? g.lineTo(x, yy) : g.moveTo(x, yy);
        }
        g.strokeStyle = C.cyan; g.lineWidth = 3 * d; g.shadowColor = C.cyan; g.shadowBlur = 10 + amp * 30 * d; g.stroke();
        g.shadowBlur = 0; SL.label(g, 'LA CUERDA (el buffer del delay, en vivo)', 10 * d, 16 * d, d);
      });
      const exc = h('div', { class: 'segs' }, [['noise', 'Ruido'], ['saw', 'Rampa'], ['sine', 'Suave']].map(([v, l]) => h('button', { class: 'seg' + (v === st.exc ? ' on' : ''), onclick: (ev) => { st.exc = v; [...exc.children].forEach((b) => b.classList.toggle('on', b === ev.target)); } }, l)));
      root.append(h('div', { class: 'stage' }, cv), h('div', { class: 'scroll' },
        card(h('p', { html: 'Un pulso corto de <b>ruido</b> entra a una línea de delay del largo de un período. Cada vuelta se promedia con su vecino (un filtro pasa-bajos) y pierde un poco de energía. Resultado: <b>una cuerda pulsada</b>, físicamente plausible, con cero osciladores.' })),
        card(slider('Sustain (realimentación)', 0.95, 0.9995, st.damp, (v) => v.toFixed(4), (v) => (st.damp = v)),
          slider('Brillo', 0, 1, st.bright, SL.fmt.pct, (v) => (st.bright = v)),
          h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, 'Excitación'), exc))),
        dock({ start: 48, onNote: (n) => ks(n), offNote: () => {} }));
    } },
    // ------------------------------------------------------------------
    { id: 'lissa', name: 'Lissajous y ring mod', col: C.pink, desc: 'Dos osciladores dibujando en el plano X/Y.', build(root) {
      const c = E.ensure();
      const a = c.createOscillator(), b = c.createOscillator(), ga = c.createGain(), gb = c.createGain(), mg = c.createChannelMerger(2), out = c.createGain();
      const ring = c.createGain(), ringOut = c.createGain();
      a.frequency.value = 220; b.frequency.value = 330;
      ga.gain.value = gb.gain.value = 0.5; out.gain.value = 0;
      a.connect(ga); b.connect(gb); ga.connect(mg, 0, 0); gb.connect(mg, 0, 1); mg.connect(out); out.connect(E.bus);
      a.connect(ring); ring.gain.value = 0; b.connect(ring.gain); ring.connect(ringOut); ringOut.gain.value = 0; ringOut.connect(E.bus);
      a.start(); b.start();
      E.load({});
      const st = { ratio: 1.5, det: 0.3, on: false, ring: false };
      const apply = () => {
        const t = c.currentTime, f = 110;
        a.frequency.setTargetAtTime(f, t, 0.02); b.frequency.setTargetAtTime(f * st.ratio + st.det, t, 0.02);
        out.gain.setTargetAtTime(st.on && !st.ring ? 0.6 : 0, t, 0.03);
        ringOut.gain.setTargetAtTime(st.on && st.ring ? 0.9 : 0, t, 0.03);
        lab.textContent = 'Ratio ' + st.ratio.toFixed(3) + (Math.abs(st.ratio - Math.round(st.ratio * 4) / 4) < 0.01 ? ' (simple: figura estable)' : '');
      };
      SL.onDispose(() => { try { a.stop(); b.stop(); out.disconnect(); ringOut.disconnect(); } catch (e) {} });
      const cv = canvas(), bx = new Float32Array(2048), by = new Float32Array(2048);
      const lab = h('div', { class: 'mini' });
      let drag = false;
      const setXY = (ev) => {
        const r = cv.getBoundingClientRect();
        const x = SL.clamp((ev.clientX - r.left) / r.width, 0, 1), y = SL.clamp((ev.clientY - r.top) / r.height, 0, 1);
        let ratio = 1 + x * 3;
        const near = [1, 1.25, 1.333, 1.5, 1.667, 2, 2.5, 3, 3.5, 4].find((q) => Math.abs(q - ratio) < 0.04);
        if (near) ratio = near;
        st.ratio = ratio; st.det = (1 - y) * 3; apply();
      };
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', (ev) => { drag = true; cv.setPointerCapture(ev.pointerId); st.on = true; setXY(ev); });
      cv.addEventListener('pointermove', (ev) => drag && setXY(ev));
      cv.addEventListener('pointerup', () => { drag = false; if (!hold.classList.contains('on')) { st.on = false; apply(); } });
      SL.anim(() => {
        const { g, w, h: hh, d } = SL.fit(cv);
        g.fillStyle = 'rgba(11,11,20,0.35)'; g.fillRect(0, 0, w, hh);
        E.anaL.getFloatTimeDomainData(bx); E.anaR.getFloatTimeDomainData(by);
        const s = Math.min(w, hh) * 0.42, cx = w / 2, cy = hh / 2;
        g.beginPath();
        for (let i = 0; i < 2048; i++) { const x = cx + bx[i] * s * 1.4, y = cy - by[i] * s * 1.4; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = st.ring ? C.orange : C.pink; g.lineWidth = 2 * d; g.shadowColor = g.strokeStyle; g.shadowBlur = 14 * d; g.stroke();
        g.shadowBlur = 0; SL.label(g, 'X = osc A · Y = osc B · arrastrá el dedo', 10 * d, 16 * d, d);
      });
      const hold = h('button', { class: 'pill', onclick: () => { hold.classList.toggle('on'); st.on = hold.classList.contains('on'); apply(); } }, 'Sostener');
      const rb = h('button', { class: 'pill', onclick: () => { st.ring = !st.ring; rb.classList.toggle('on', st.ring); apply(); } }, 'Ring mod');
      root.append(h('div', { class: 'stage tall' }, cv), h('div', { class: 'scroll' },
        card(lab, h('div', { class: 'row' }, hold, rb)),
        card(h('p', { html: 'El osc A va al canal izquierdo y el osc B al derecho. Dibujando izquierdo vs. derecho aparecen las <b>figuras de Lissajous</b>: con ratios simples (3:2 = quinta, 2:1 = octava) la figura es estable — es lo que el oído percibe como <b>consonancia</b>. Arriba/abajo desafina y la figura gira.' }),
          h('p', { html: '<b>Ring mod</b> multiplica las dos ondas: suena la suma y la resta de frecuencias, nunca las originales. Metálico, robótico (las voces de los Daleks).' }))));
      apply();
    } },
    // ------------------------------------------------------------------
    { id: 'chaos', name: 'Secuenciador del caos', col: C.lime, desc: 'El mapa logístico decide qué nota toca.', build(root) {
      E.load({ osc1: { wave: 'square' }, amp: { a: 0.002, d: 0.22, s: 0, r: 0.2 }, filter: { cutoff: 600, env: 0.5, q: 4 }, fenv: { d: 0.15 }, fx: { delay: 0.25, time: 0.36, fb: 0.4, reverb: 0.3 } });
      const st = { r: 3.5, x: 0.4, hist: [], bpm: 140 };
      const bif = h('canvas'), cv = canvas();
      let bifReady = false;
      const drawBif = () => {
        const { g, w, h: hh } = SL.fit(cv);
        bif.width = w; bif.height = hh;
        const b = bif.getContext('2d');
        b.fillStyle = 'rgba(182,255,59,0.18)';
        for (let px = 0; px < w; px += 2) {
          const r = 2.8 + (px / w) * 1.2;
          let x = 0.5;
          for (let i = 0; i < 200; i++) x = r * x * (1 - x);
          for (let i = 0; i < 120; i++) { x = r * x * (1 - x); b.fillRect(px, hh - x * hh * 0.9 - hh * 0.05, 1.5, 1.5); }
        }
        bifReady = true;
      };
      SL.anim(() => {
        const { g, w, h: hh, d } = SL.fit(cv);
        if (!bifReady || bif.width !== w) drawBif();
        g.clearRect(0, 0, w, hh); g.drawImage(bif, 0, 0);
        const px = ((st.r - 2.8) / 1.2) * w;
        g.strokeStyle = C.pink; g.lineWidth = 2 * d; g.shadowColor = C.pink; g.shadowBlur = 10 * d;
        g.beginPath(); g.moveTo(px, 0); g.lineTo(px, hh); g.stroke();
        st.hist.forEach((x, i) => { const a = (i + 1) / st.hist.length; g.beginPath(); g.arc(px, hh - x * hh * 0.9 - hh * 0.05, (4 + 6 * a) * d, 0, 7); g.fillStyle = `rgba(62,240,255,${a})`; g.fill(); });
        g.shadowBlur = 0; SL.label(g, 'DIAGRAMA DE BIFURCACIÓN · r = ' + st.r.toFixed(3), 10 * d, 16 * d, d);
      });
      const step = (i, when) => {
        st.x = st.r * st.x * (1 - st.x);
        if (!isFinite(st.x) || st.x <= 0 || st.x >= 1) st.x = 0.37;
        const deg = Math.floor(st.x * 10), note = 48 + Math.floor(deg / 5) * 12 + PENTA[deg % 5];
        E.play(note, when, 0.12, 0.6 + st.x * 0.4);
        SL.at(when, () => { st.hist.push(st.x); if (st.hist.length > 8) st.hist.shift(); });
      };
      const play = h('button', { class: 'btn big', onclick: () => { if (SL.clock.running) { SL.clock.stop(); play.textContent = '▶ Reproducir'; } else { SL.clock.start(() => 60 / st.bpm / 2, step); play.textContent = '■ Detener'; } } }, '▶ Reproducir');
      SL.onDispose(() => SL.clock.stop());
      root.append(h('div', { class: 'stage tall' }, cv), h('div', { class: 'scroll' },
        card(play, slider('r (caos)', 2.8, 4, st.r, (v) => v.toFixed(3), (v) => (st.r = v)), slider('Tempo', 60, 220, st.bpm, (v) => Math.round(v) + ' bpm', (v) => (st.bpm = v)), SL.control('filter.cutoff'), SL.control('osc1.wave')),
        card(h('p', { html: 'Cada paso calcula <b>x = r·x·(1−x)</b> y convierte x en una nota de la escala pentatónica. Con r bajo, x se estabiliza en un valor: <b>una nota repetida</b>. Al subir r se divide en 2, 4, 8 valores: <b>patrones que se repiten</b>. Pasado ~3.57 entra en <b>caos</b>: nunca se repite. Buscá las "ventanas" de orden dentro del caos (por ejemplo, cerca de r = 3.83 aparece un ciclo de 3).' }))));
    } },
    // ------------------------------------------------------------------
    { id: 'draw', name: 'Dibujá tu onda', col: C.orange, desc: 'Dibujá un ciclo con el dedo y tocalo.', build(root) {
      const N = 256, wave = new Float32Array(N);
      for (let i = 0; i < N; i++) wave[i] = Math.sin((2 * Math.PI * i) / N);
      E.load({ osc1: { wave: 'custom' }, fx: { reverb: 0.15 } });
      const cv = canvas(), sp = canvas('spec-cv');
      let last = null, amps = [];
      const commit = () => {
        let m = 0; for (let i = 0; i < N; i++) m += wave[i]; m /= N;
        const hh = SL.dft((t) => wave[Math.floor(t * N) % N] - m, N);
        amps = SL.amps(hh).slice(0, 32);
        E.setCustom(hh);
      };
      commit();
      const paint = (ev) => {
        const r = cv.getBoundingClientRect();
        const i = SL.clamp(Math.floor(((ev.clientX - r.left) / r.width) * N), 0, N - 1);
        const v = SL.clamp(1 - (2 * (ev.clientY - r.top)) / r.height, -1, 1);
        if (last) { const [li, lv] = last, a = Math.min(li, i), b = Math.max(li, i); for (let k = a; k <= b; k++) wave[k] = b === a ? v : lv + ((v - lv) * (k - li)) / (i - li); }
        else wave[i] = v;
        last = [i, v];
      };
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', (ev) => { cv.setPointerCapture(ev.pointerId); last = null; paint(ev); });
      cv.addEventListener('pointermove', (ev) => { if (ev.buttons || ev.pressure) { paint(ev); } });
      cv.addEventListener('pointerup', () => { last = null; commit(); });
      SL.anim(() => {
        let { g, w, h: hh, d } = SL.fit(cv);
        g.clearRect(0, 0, w, hh);
        g.strokeStyle = 'rgba(138,125,255,0.2)'; g.beginPath(); g.moveTo(0, hh / 2); g.lineTo(w, hh / 2); g.stroke();
        g.beginPath();
        for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * w, y = hh / 2 - wave[i] * hh * 0.45; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = C.orange; g.lineWidth = 3 * d; g.shadowColor = C.orange; g.shadowBlur = 14 * d; g.stroke();
        g.shadowBlur = 0; SL.label(g, 'DIBUJÁ UN CICLO', 10 * d, 16 * d, d);
        ({ g, w, h: hh, d } = SL.fit(sp));
        g.clearRect(0, 0, w, hh);
        const mx = Math.max(1e-6, ...amps), bw = w / 32;
        amps.forEach((a, i) => { const bh = (a / mx) * (hh - 22 * d); g.fillStyle = i === 0 ? C.cyan : C.violet; g.fillRect(i * bw + bw * 0.15, hh - 4 * d - bh, bw * 0.7, bh); });
        SL.label(g, 'ARMÓNICOS DE TU ONDA (Fourier)', 8 * d, 14 * d, d);
      });
      const preset = (fn) => () => { for (let i = 0; i < N; i++) wave[i] = fn(i / N); commit(); };
      root.append(h('div', { class: 'stage' }, cv), h('div', { class: 'scroll' },
        card(h('div', { class: 'spec-wrap' }, sp), h('div', { class: 'row wrap' },
          h('button', { class: 'pill', onclick: preset((t) => Math.sin(2 * Math.PI * t)) }, 'Seno'),
          h('button', { class: 'pill', onclick: preset((t) => 2 * t - 1) }, 'Sierra'),
          h('button', { class: 'pill', onclick: preset((t) => (t < 0.5 ? 1 : -1)) }, 'Cuadrada'),
          h('button', { class: 'pill', onclick: preset(() => Math.random() * 2 - 1) }, 'Ruido'),
          h('button', { class: 'pill', onclick: preset((t) => Math.sin(2 * Math.PI * t) * (t < 0.5 ? 1 : 0.2) + 0.3 * Math.sin(10 * Math.PI * t)) }, 'Rara'))),
        card(h('p', { html: 'La forma que dibujás se descompone en armónicos (análisis de <b>Fourier</b>) y se vuelve un oscilador real. Probá picos filosos (más agudos) vs. curvas suaves (más graves y redondos).' }), SL.control('filter.cutoff'), SL.control('amp.r'))),
        dock({ start: 48 }));
    } },
    // ------------------------------------------------------------------
    { id: 'xy', name: 'Pad XY', col: C.violet, desc: 'Tocá y arrastrá para controlar dos parámetros a la vez.', build(root) {
      const MAPS = [
        { n: 'Filtro', base: { osc1: { wave: 'sawtooth' }, uni: { voices: 3, detune: 15 }, fx: { delay: 0.2, reverb: 0.3 } }, x: ['filter.cutoff', 60, 12000, 1], y: ['filter.q', 0.5, 25, 1] },
        { n: 'Wavetable', base: { osc1: { wave: 'wavetable' }, wt: { table: 'fold' }, lfo: { target: 'wt' }, fx: { reverb: 0.3 } }, x: ['wt.pos', 0, 1, 0], y: ['lfo.depth', 0, 1, 0] },
        { n: 'FM', base: { osc1: { wave: 'sine' }, fx: { reverb: 0.35 } }, x: ['fm.ratio', 0.5, 8, 0], y: ['fm.index', 0, 12, 0] },
        { n: 'Wobble', base: { osc1: { wave: 'sawtooth', oct: -1 }, osc2: { level: 0.6, detune: 12, oct: -1 }, filter: { cutoff: 400, q: 8 }, lfo: { target: 'cutoff', depth: 0.6 }, fx: { drive: 0.4 } }, x: ['lfo.rate', 0.5, 16, 1], y: ['filter.cutoff', 100, 3000, 1] },
        { n: 'Dub delay', base: { osc1: { wave: 'triangle' }, amp: { a: 0.002, d: 0.2, s: 0.2, r: 0.2 }, fx: { delay: 0.55 } }, x: ['fx.time', 0.05, 1, 0], y: ['fx.fb', 0, 0.92, 0] },
      ];
      let map = MAPS[0], note = 45, down = false;
      const trail = [];
      const cv = canvas();
      const setMap = (m) => { map = m; E.load(m.base); [...segs.children].forEach((b, i) => b.classList.toggle('on', MAPS[i] === m)); };
      const val = (spec, t) => (spec[3] ? spec[1] * Math.pow(spec[2] / spec[1], t) : spec[1] + t * (spec[2] - spec[1]));
      const move = (ev) => {
        const r = cv.getBoundingClientRect();
        const x = SL.clamp((ev.clientX - r.left) / r.width, 0, 1), y = SL.clamp(1 - (ev.clientY - r.top) / r.height, 0, 1);
        E.set(map.x[0], +val(map.x, x).toFixed(4)); E.set(map.y[0], +val(map.y, y).toFixed(4));
        trail.push({ x: x, y: y, life: 1 });
      };
      cv.style.touchAction = 'none';
      cv.addEventListener('pointerdown', (ev) => { cv.setPointerCapture(ev.pointerId); down = true; move(ev); E.noteOn(note, 0.8); });
      cv.addEventListener('pointermove', (ev) => down && move(ev));
      const up = () => { if (down) { down = false; E.noteOff(note); } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      SL.onDispose(up);
      SL.anim(() => {
        const { g, w, h: hh, d } = SL.fit(cv);
        g.fillStyle = 'rgba(11,11,20,0.25)'; g.fillRect(0, 0, w, hh);
        g.strokeStyle = 'rgba(138,125,255,0.12)'; g.lineWidth = d;
        for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo((w * i) / 6, 0); g.lineTo((w * i) / 6, hh); g.stroke(); g.beginPath(); g.moveTo(0, (hh * i) / 6); g.lineTo(w, (hh * i) / 6); g.stroke(); }
        for (let i = trail.length - 1; i >= 0; i--) {
          const p = trail[i]; p.life -= 0.02;
          if (p.life <= 0) { trail.splice(i, 1); continue; }
          g.beginPath(); g.arc(p.x * w, (1 - p.y) * hh, (4 + 18 * p.life) * d, 0, 7);
          g.fillStyle = `hsla(${280 + p.x * 80},100%,65%,${p.life * 0.5})`; g.fill();
        }
        g.shadowBlur = 0;
        SL.label(g, 'X → ' + (SL.CT[map.x[0]] || {}).l, 10 * d, hh - 10 * d, d, C.text);
        g.save(); g.translate(16 * d, hh - 30 * d); g.rotate(-Math.PI / 2); SL.label(g, 'Y → ' + (SL.CT[map.y[0]] || {}).l, 0, 0, d, C.text); g.restore();
      });
      const segs = h('div', { class: 'segs' }, MAPS.map((m) => h('button', { class: 'seg', onclick: () => setMap(m) }, m.n)));
      const notes = h('div', { class: 'segs' }, [[33, 'A1'], [45, 'A2'], [57, 'A3'], [69, 'A4']].map(([n, l]) => h('button', { class: 'seg' + (n === note ? ' on' : ''), onclick: (ev) => { note = n; [...notes.children].forEach((b) => b.classList.toggle('on', b === ev.target)); } }, l)));
      root.append(h('div', { class: 'stage xl' }, cv), h('div', { class: 'scroll' },
        card(h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, 'Mapa'), segs), h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, 'Nota'), notes)),
        card(h('p', { html: 'Como un Kaoss Pad: tocar suena, arrastrar mueve <b>dos parámetros a la vez</b>. Controlar dos cosas juntas genera gestos imposibles con una perilla sola.' }))));
      setMap(MAPS[0]);
    } },
    // ------------------------------------------------------------------
    { id: 'crush', name: 'Destructor', col: C.red, desc: 'Saturación y bitcrush: mirá la función de transferencia.', build(root) {
      E.load({ osc1: { wave: 'sine' } });
      const cv = canvas();
      SL.anim(() => {
        const { g, w, h: hh, d } = SL.fit(cv), f = E.patch.fx;
        g.clearRect(0, 0, w, hh);
        const k = 1 + f.drive * 30, nm = Math.tanh(k), bits = f.crush ? Math.max(1, Math.round(12 - f.crush * 11)) : 0, L = Math.pow(2, bits - 1);
        const tf = (x) => { let y = f.drive > 0.001 ? Math.tanh(k * x) / nm : x; if (bits) y = Math.round(y * L) / L; return y; };
        const S = Math.min(w * 0.42, hh * 0.8), ox = 14 * d, oy = hh / 2;
        g.strokeStyle = 'rgba(138,125,255,0.3)'; g.lineWidth = d; g.strokeRect(ox, oy - S / 2, S, S);
        g.beginPath();
        for (let i = 0; i <= 200; i++) { const x = (i / 200) * 2 - 1; const px = ox + ((x + 1) / 2) * S, py = oy - (tf(x) * S) / 2; i ? g.lineTo(px, py) : g.moveTo(px, py); }
        g.strokeStyle = C.red; g.lineWidth = 2.5 * d; g.shadowColor = C.red; g.shadowBlur = 10 * d; g.stroke();
        const x0 = ox + S + 20 * d, W = w - x0 - 10 * d;
        g.beginPath(); g.shadowBlur = 0;
        for (let i = 0; i <= 200; i++) { const s = Math.sin((i / 200) * Math.PI * 4); g.lineTo(x0 + (i / 200) * W, oy - (s * S) / 2.4); }
        g.strokeStyle = 'rgba(62,240,255,0.35)'; g.lineWidth = 1.5 * d; g.stroke();
        g.beginPath();
        for (let i = 0; i <= 200; i++) { const s = tf(Math.sin((i / 200) * Math.PI * 4)); g.lineTo(x0 + (i / 200) * W, oy - (s * S) / 2.4); }
        g.strokeStyle = C.cyan; g.lineWidth = 2.5 * d; g.shadowColor = C.cyan; g.shadowBlur = 10 * d; g.stroke();
        g.shadowBlur = 0; SL.label(g, 'ENTRADA → SALIDA', ox, 16 * d, d); SL.label(g, 'SENO ANTES / DESPUÉS', x0, 16 * d, d);
      });
      const sc = h('canvas', { class: 'stage-cv' }), sv = SL.viz.spectrum(sc);
      SL.anim(sv);
      root.append(h('div', { class: 'stage' }, cv), h('div', { class: 'scroll' },
        card(SL.control('fx.drive'), SL.control('fx.crush'), SL.control('osc1.wave')),
        card(h('div', { class: 'spec-wrap tall' }, sc)),
        card(h('p', { html: 'Toda distorsión es una <b>función de transferencia</b>: para cada valor de entrada, devuelve uno de salida. Si la curva es una recta, nada cambia. Si se dobla (saturación) o se vuelve escalera (bitcrush), la onda se deforma y nacen <b>armónicos nuevos</b> — miralos en el espectro.' }))),
        dock({ start: 48 }));
    } },
  ];
})();

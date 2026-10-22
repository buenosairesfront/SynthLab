// Course structure: modules, lessons, recipes, ear-training quizzes.
// All visible text lives in web/lang/<idioma>.js and is read with SL.t().
(function () {
  const SL = window.SL, t = (k, v) => SL.t(k, v);
  const S = (seen, path, vals) => vals.every((v) => seen[path] && seen[path].has(v));
  const ARP = { notes: [48, 55, 60, 63, 60, 55], step: 0.22, dur: 0.16 };
  const SLOW = { notes: [48, 51, 55, 58], step: 1.4, dur: 1.0 };
  const PLUCKS = { notes: [60, 63, 67, 70, 72, 70, 67, 63], step: 0.18, dur: 0.1 };
  const isInt = (r) => Math.abs(r - Math.round(r)) <= 0.15;

  // tasks: one check per entry of les.<id>.tasks in the language file
  SL.MODULES = [
    { id: 'fund', col: '#3EF0FF', ico: 'sine', lessons: [
      { id: 'f1', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine' } }, freqSlider: true,
        tasks: [(p, s) => s.freq && [...s.freq].some((f) => f < 80), (p, s) => s.freq && [...s.freq].some((f) => f > 2000), (p, s) => s.freq && [...s.freq].some((f) => Math.abs(f - 440) < 5)] },
      { id: 'f2', viz: ['spectrum', 'scope'], patch: { osc1: { wave: 'sine' } }, ctl: ['osc1.wave'],
        tasks: [(p, s) => S(s, 'osc1.wave', ['sine']) || p.osc1.wave === 'sine', (p, s) => S(s, 'osc1.wave', ['sawtooth']), (p, s) => S(s, 'osc1.wave', ['square'])] },
    ] },
    { id: 'osc', col: '#FF4FD8', ico: 'sawtooth', lessons: [
      { id: 'o1', viz: ['wave', 'spectrum', 'scope'], ctl: ['osc1.wave', 'osc1.oct'],
        tasks: [(p, s) => S(s, 'osc1.wave', ['sine', 'triangle', 'sawtooth', 'square']), (p) => p.osc1.oct < 0] },
      { id: 'o2', viz: ['wave', 'spectrum'], patch: { osc1: { wave: 'pulse', pw: 0.5 } }, ctl: ['osc1.pw'],
        tasks: [(p) => p.osc1.pw < 0.1, (p, s) => s['osc1.pw'] && s['osc1.pw'].size > 12] },
      { id: 'o3', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sawtooth' }, osc2: { wave: 'sawtooth', level: 0, detune: 0 } }, ctl: ['osc2.level', 'osc2.detune', 'osc2.semi', 'uni.voices', 'uni.detune'],
        tasks: [(p) => p.osc2.level > 0.3 && Math.abs(p.osc2.detune) >= 8, (p) => p.uni.voices >= 5 && p.uni.detune >= 25, (p) => p.osc2.semi === 7 && p.osc2.level > 0.2] },
      { id: 'o4', viz: ['spectrum', 'scope'], patch: { osc1: { level: 0 }, noise: 0.7 }, ctl: ['noise', 'osc1.level', 'filter.cutoff'],
        tasks: [(p) => p.noise > 0.2 && p.filter.cutoff < 800, (p) => p.noise > 0.1 && p.osc1.level > 0.3] },
    ] },
    { id: 'filt', col: '#B6FF3B', ico: 'lowpass', lessons: [
      { id: 'fl1', viz: ['filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1200, q: 1 } }, ctl: ['filter.cutoff'],
        tasks: [(p) => p.filter.cutoff < 300, (p) => p.filter.cutoff > 8000, (p, s) => s['filter.cutoff'] && s['filter.cutoff'].size > 20] },
      { id: 'fl2', viz: ['filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 800, q: 1 } }, ctl: ['filter.q', 'filter.cutoff'],
        tasks: [(p) => p.filter.q > 12, (p, s) => p.filter.q > 8 && s['filter.cutoff'] && s['filter.cutoff'].size > 15] },
      { id: 'fl3', viz: ['filter'], patch: { osc1: { wave: 'sawtooth' }, noise: 0.25, filter: { cutoff: 1500, q: 3 } }, ctl: ['filter.type', 'filter.cutoff', 'filter.q'],
        tasks: [(p, s) => S(s, 'filter.type', ['lowpass', 'highpass', 'bandpass', 'notch']), (p) => p.filter.type === 'bandpass' && p.filter.cutoff > 800 && p.filter.cutoff < 2500] },
      { id: 'fl4', viz: ['filter'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 700, q: 2 } }, ctl: ['filter.slope', 'filter.key', 'filter.cutoff'], mode: 'pattern', pattern: { notes: [36, 48, 60, 72, 84, 72, 60, 48], step: 0.3, dur: 0.25 },
        tasks: [(p, s) => S(s, 'filter.slope', [12, 24]), (p) => p.filter.key > 0.7] },
    ] },
    { id: 'env', col: '#FFB23E', ico: 'env', lessons: [
      { id: 'e1', viz: ['adsr', 'scope'], ctl: ['amp.a', 'amp.d', 'amp.s', 'amp.r'], mode: 'pattern', pattern: { notes: [48, 55, 60, 55], step: 0.8, dur: 0.45 },
        tasks: [(p) => p.amp.s < 0.05 && p.amp.d < 0.3, (p) => p.amp.a > 1, (p) => p.amp.a < 0.02 && p.amp.r < 0.06 && p.amp.s > 0.9] },
      { id: 'e2', viz: ['fenv', 'filter'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 250, q: 4, env: 0.5 }, fenv: { a: 0.005, d: 0.3, s: 0 } }, ctl: ['filter.env', 'fenv.a', 'fenv.d', 'fenv.s', 'filter.cutoff', 'filter.q'], mode: 'pattern', pattern: ARP,
        tasks: [(p) => p.fenv.d < 0.15 && p.filter.env > 0.2, (p) => p.fenv.a > 0.5 && p.filter.env > 0.2, (p) => p.filter.env < -0.2] },
      { id: 'e3', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine', oct: -1 }, amp: { a: 0.001, d: 0.35, s: 0, r: 0.2 }, penv: { amt: 0, decay: 0.06 } }, ctl: ['penv.amt', 'penv.decay', 'amp.d'], mode: 'pattern', pattern: { notes: [36, null, 36, null, 36, null, 36, 36], step: 0.25, dur: 0.2 },
        tasks: [(p) => p.penv.amt > 24, (p) => p.penv.amt > 18 && p.penv.decay < 0.08] },
    ] },
    { id: 'lfo', col: '#8A7DFF', ico: 'triangle', lessons: [
      { id: 'l1', viz: ['lfo', 'filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1500, q: 5 }, lfo: { depth: 0.3, rate: 5, target: 'pitch' } }, ctl: ['lfo.target', 'lfo.rate', 'lfo.depth'],
        tasks: [(p) => p.lfo.target === 'pitch' && p.lfo.rate > 4 && p.lfo.rate < 7 && p.lfo.depth > 0.01 && p.lfo.depth < 0.1, (p) => p.lfo.target === 'amp' && p.lfo.depth > 0.3, (p) => p.lfo.target === 'cutoff' && p.lfo.rate >= 1 && p.lfo.rate <= 4 && p.lfo.depth > 0.3] },
      { id: 'l2', viz: ['lfo', 'spectrum'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1200, q: 6 }, lfo: { depth: 0.5, rate: 3, target: 'cutoff', wave: 'sine' } }, ctl: ['lfo.wave', 'lfo.rate', 'lfo.depth', 'lfo.target'],
        tasks: [(p) => p.lfo.wave === 'sh' && p.lfo.target === 'cutoff', (p) => p.lfo.wave === 'square' && p.lfo.target === 'pitch', (p) => p.lfo.rate > 25 && p.lfo.target === 'pitch' && p.lfo.depth > 0.1] },
    ] },
    { id: 'add', col: '#3EF0FF', ico: 'square', lessons: [
      { id: 'a1', viz: ['harm', 'spectrum'], patch: { osc1: { wave: 'additive' }, add: { h: [1].concat(Array(23).fill(0)) } }, presets: true,
        tasks: [(p) => { const h = p.add.h; return h[0] > 0.5 && h[2] > 0.15 && h[4] > 0.08 && h[1] < 0.05 && h[3] < 0.05 && h[5] < 0.05; }, (p) => p.add.h.filter((v) => v > 0.05).length >= 10, (p) => [0, 1, 3, 7].every((i) => p.add.h[i] > 0.4)] },
      { id: 'a2', viz: ['harm', 'scope'], patch: { osc1: { wave: 'additive' }, add: { h: [1].concat(Array(23).fill(0)) } }, fourier: true,
        tasks: [(p, s) => s.fourier && s.fourier.has('saw'), (p, s) => s.fourier && s.fourier.has('square')] },
    ] },
    { id: 'fm', col: '#FFB23E', ico: 'fm', lessons: [
      { id: 'm1', viz: ['fm', 'scope', 'spectrum'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 1, index: 0 } }, ctl: ['fm.index', 'fm.ratio'],
        tasks: [(p) => p.fm.index > 3, (p, s) => p.fm.index > 1.5 && s['fm.ratio'] && s['fm.ratio'].has(2) && s['fm.ratio'].has(3)] },
      { id: 'm2', viz: ['fm', 'spectrum'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 2, index: 2.5 }, amp: { a: 0.002, d: 2.5, s: 0, r: 1.5 } }, ctl: ['fm.ratio', 'fm.index'], mode: 'pattern', pattern: { notes: [60, 67, 72, 79], step: 0.9, dur: 0.5 },
        tasks: [(p) => !isInt(p.fm.ratio) && p.fm.index > 2, (p) => p.fm.ratio === 1 && p.fm.index > 1 && p.fm.index < 2.5] },
      { id: 'm3', viz: ['fm', 'adsr'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 1, index: 4, env: 0.3, decay: 0.8 }, amp: { a: 0.002, d: 1.5, s: 0.2, r: 0.6 } }, ctl: ['fm.env', 'fm.decay', 'fm.index', 'fm.ratio'], mode: 'pattern', pattern: { notes: [57, 60, 64, 67, 64, 60], step: 0.4, dur: 0.35 },
        tasks: [(p) => p.fm.env > 0.8 && p.fm.decay < 0.5, (p) => p.fm.decay > 2 && p.fm.env > 0.4] },
    ] },
    { id: 'wt', col: '#FF4FD8', ico: 'wt', lessons: [
      { id: 'w1', viz: ['wt3d', 'spectrum', 'scope'], patch: { osc1: { wave: 'wavetable' }, wt: { table: 'basic', pos: 0 } }, ctl: ['wt.table', 'wt.pos'],
        tasks: [(p, s) => s['wt.pos'] && [...s['wt.pos']].some((v) => v < 0.05) && [...s['wt.pos']].some((v) => v > 0.95), (p, s) => s['wt.table'] && s['wt.table'].size >= 4] },
      { id: 'w2', viz: ['wt3d', 'lfo', 'spectrum'], patch: { osc1: { wave: 'wavetable' }, wt: { table: 'vocal', pos: 0.5 }, lfo: { target: 'wt', rate: 0.5, depth: 0.8 }, filter: { cutoff: 9000 } }, ctl: ['wt.table', 'wt.pos', 'lfo.rate', 'lfo.depth', 'lfo.wave'],
        tasks: [(p) => p.lfo.rate > 4 && p.lfo.depth > 0.4, (p) => p.lfo.wave === 'sh' && p.wt.table === 'digital'] },
    ] },
    { id: 'fx', col: '#B6FF3B', ico: 'fx', lessons: [
      { id: 'x1', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine' } }, ctl: ['fx.drive', 'fx.crush', 'osc1.wave'],
        tasks: [(p) => p.fx.drive > 0.5 && p.osc1.wave === 'sine', (p) => p.fx.crush > 0.7] },
      { id: 'x2', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'triangle' }, amp: { a: 0.002, d: 0.2, s: 0, r: 0.2 } }, ctl: ['fx.delay', 'fx.time', 'fx.fb', 'fx.reverb'], mode: 'pattern', pattern: { notes: [72, null, null, 79, null, null, 75, null], step: 0.2, dur: 0.1 },
        tasks: [(p) => p.fx.delay > 0.2 && p.fx.fb > 0.6, (p) => p.fx.reverb > 0.6] },
    ] },
  ];

  // ---------------------------- RECIPES ----------------------------
  // steps: parameter changes; their explanations are rcp.<id>.steps in the language file
  SL.RECIPES = [
    { id: 'acid', col: '#B6FF3B', pattern: { notes: [36, 36, 48, 36, 39, 36, 46, 36, 36, 43, 36, 48, 36, 39, 41, 36], step: 0.13, dur: 0.1 },
      base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 0.3, s: 0.6, r: 0.05 } },
      steps: [{}, { 'osc1.wave': 'sawtooth' }, { 'filter.slope': 24, 'filter.cutoff': 280 }, { 'filter.q': 16 }, { 'filter.env': 0.55, 'fenv.d': 0.18, 'fenv.s': 0 }, { 'fx.drive': 0.35, 'fx.delay': 0.18, 'fx.time': 0.39 }],
      ctl: ['filter.cutoff', 'filter.q', 'filter.env', 'fenv.d'] },
    { id: 'pad', col: '#8A7DFF', pattern: SLOW, base: { osc1: { wave: 'sawtooth' } },
      steps: [{}, { 'uni.voices': 5, 'uni.detune': 22 }, { 'amp.a': 0.9, 'amp.r': 1.8, 'amp.s': 0.9 }, { 'filter.cutoff': 1800, 'filter.q': 1.5 }, { 'lfo.target': 'cutoff', 'lfo.rate': 0.25, 'lfo.depth': 0.25 }, { 'fx.reverb': 0.65 }],
      ctl: ['uni.detune', 'amp.a', 'filter.cutoff', 'fx.reverb'] },
    { id: 'pluck', col: '#3EF0FF', pattern: PLUCKS, base: { osc1: { wave: 'square' } },
      steps: [{}, { 'amp.s': 0, 'amp.d': 0.25, 'amp.r': 0.2 }, { 'filter.cutoff': 400, 'filter.env': 0.6, 'fenv.d': 0.12, 'filter.q': 3 }, { 'osc2.wave': 'sawtooth', 'osc2.oct': 1, 'osc2.level': 0.35 }, { 'fx.delay': 0.3, 'fx.time': 0.27, 'fx.fb': 0.45, 'fx.reverb': 0.35 }],
      ctl: ['fenv.d', 'filter.cutoff', 'fx.delay'] },
    { id: 'lead', col: '#FF4FD8', pattern: { notes: [72, 72, 74, 75, 75, 74, 72, 70], step: 0.3, dur: 0.27 }, base: { osc1: { wave: 'sawtooth' } },
      steps: [{}, { 'uni.voices': 7, 'uni.detune': 35 }, { mono: true, glide: 0.06 }, { 'lfo.target': 'pitch', 'lfo.rate': 5.5, 'lfo.depth': 0.03 }, { 'fx.delay': 0.25, 'fx.time': 0.3, 'fx.reverb': 0.45 }],
      ctl: ['uni.detune', 'glide', 'lfo.depth'] },
    { id: 'reese', col: '#FFB23E', pattern: { notes: [31, 31, 31, 34], step: 0.9, dur: 0.85 }, base: { osc1: { wave: 'sawtooth', oct: -1 } },
      steps: [{}, { 'osc2.wave': 'sawtooth', 'osc2.oct': -1, 'osc2.level': 0.8, 'osc2.detune': 18 }, { 'filter.cutoff': 900, 'filter.q': 2, 'filter.slope': 24 }, { 'lfo.target': 'cutoff', 'lfo.rate': 0.6, 'lfo.depth': 0.15, 'fx.drive': 0.4 }],
      ctl: ['osc2.detune', 'filter.cutoff', 'fx.drive'] },
    { id: 'bell', col: '#3EF0FF', pattern: { notes: [72, 79, 76, 84], step: 1.0, dur: 0.6 }, base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 3, s: 0, r: 2.5 } },
      steps: [{}, { 'fm.ratio': 1, 'fm.index': 2 }, { 'fm.ratio': 3.5, 'fm.index': 3.5 }, { 'fm.env': 0.85, 'fm.decay': 1.2 }, { 'fx.reverb': 0.5 }],
      ctl: ['fm.ratio', 'fm.index', 'fm.decay'] },
    { id: 'kick', col: '#FF5A6E', pattern: { notes: [36, null, null, null, 36, null, null, null], step: 0.13, dur: 0.3 }, base: { osc1: { wave: 'sine', oct: -1 }, amp: { a: 0.001, d: 1.5, s: 0, r: 0.1 } },
      steps: [{}, { 'amp.d': 0.4 }, { 'penv.amt': 36, 'penv.decay': 0.045 }, { 'fx.drive': 0.45 }],
      ctl: ['penv.amt', 'penv.decay', 'amp.d'] },
    { id: 'snare', col: '#B6FF3B', pattern: { notes: [72, 96, 96, 96, 60, 96, 96, 96], step: 0.15, dur: 0.05 }, base: { osc1: { wave: 'triangle', level: 0 }, noise: 0, amp: { a: 0.001, d: 0.15, s: 0, r: 0.12 } },
      steps: [{ noise: 0.8 }, { 'filter.type': 'highpass', 'filter.cutoff': 6000, 'filter.key': 1 }, { 'osc1.level': 0.6, 'penv.amt': 12, 'penv.decay': 0.03 }, { 'fx.reverb': 0.25 }],
      ctl: ['filter.cutoff', 'amp.d', 'noise'] },
    { id: 'growl', col: '#FF4FD8', pattern: { notes: [36, null, 36, 36, null, 39, 36, null], step: 0.18, dur: 0.16 }, base: { osc1: { wave: 'wavetable', oct: -1 }, wt: { table: 'vocal', pos: 0.2 } },
      steps: [{}, { 'lfo.target': 'wt', 'lfo.rate': 6, 'lfo.depth': 0.9 }, { 'uni.voices': 3, 'uni.detune': 12 }, { 'fx.drive': 0.6 }, { 'wt.table': 'sync' }],
      ctl: ['wt.table', 'lfo.rate', 'fx.drive'] },
    { id: 'epiano', col: '#FFB23E', pattern: { notes: [57, 64, 60, 67, 65, 60, 64, 55], step: 0.42, dur: 0.38 }, base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 1.8, s: 0.15, r: 0.5 } },
      steps: [{}, { 'fm.ratio': 1, 'fm.index': 3 }, { 'fm.env': 0.85, 'fm.decay': 0.25 }, { 'lfo.target': 'amp', 'lfo.rate': 4.5, 'lfo.depth': 0.25, 'fx.reverb': 0.3 }],
      ctl: ['fm.index', 'fm.decay', 'lfo.depth'] },
  ];

  // ---------------------------- EAR TRAINING ----------------------------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sound = (p, seq) => ({ p, seq: seq || [[57, 0, 1.0]] });
  const arp = (notes, step, dur) => notes.map((n, i) => [n, i * step, dur]);
  // id: key under q.<id> in the language file; opts are sound specs, labelled in order by q.<id>.o (or by labels)
  function choose(id, opts, labels) {
    const L = labels || t('q.' + id + '.o');
    opts.forEach((o, i) => (o.label = L[i]));
    return { prompt: t('q.' + id + '.p'), options: opts, answer: Math.floor(Math.random() * opts.length) };
  }

  const Q = {
    pitchHigher() {
      const a = 48 + Math.floor(Math.random() * 18), b = a + pick([1, 2, 3, 5, -1, -2, -3, -5]);
      const tri = { osc1: { wave: 'triangle' } };
      const q = choose('pitchHigher', [{ s: sound(tri, [[a, 0, 0.6]]) }, { s: sound(tri, [[b, 0, 0.6]]) }]);
      q.answer = b > a ? 1 : 0;
      q.play = sound(tri, [[a, 0, 0.6], [b, 0.8, 0.6]]);
      return q;
    },
    interval() {
      const a = 48 + Math.floor(Math.random() * 12);
      return choose('interval', [12, 7, 4].map((iv) => ({ s: sound({ osc1: { wave: 'sawtooth' }, filter: { cutoff: 1500 } }, [[a, 0, 0.6], [a + iv, 0.7, 0.8]]) })));
    },
    pureRich: () => choose('pureRich', [{ icon: SL.svgWave('sine'), s: sound({ osc1: { wave: 'sine' } }) }, { icon: SL.svgWave('sawtooth'), s: sound({ osc1: { wave: 'sawtooth' } }) }]),
    wave() {
      const W = ['sine', 'triangle', 'sawtooth', 'square'];
      return choose('wave', W.map((w) => ({ icon: SL.svgWave(w), s: sound({ osc1: { wave: w } }, [[pick([45, 52, 57]), 0, 1.1]]) })), W.map((w) => t('waveLong.' + w)));
    },
    pulse: () => choose('pulse', [{ icon: SL.svgWave('square'), s: sound({ osc1: { wave: 'pulse', pw: 0.5 } }) }, { icon: SL.svgWave('pulse'), s: sound({ osc1: { wave: 'pulse', pw: 0.08 } }) }]),
    unison: () => choose('unison', [{ s: sound({ osc1: { wave: 'sawtooth' } }, [[57, 0, 1.4]]) }, { s: sound({ osc1: { wave: 'sawtooth' }, uni: { voices: 5, detune: 30 } }, [[57, 0, 1.4]]) }]),
    filterType() {
      const T = ['lowpass', 'highpass', 'bandpass', 'notch'], seq = arp([45, 52, 57, 64], 0.3, 0.28);
      return choose('filterType', T.map((ty) => ({ icon: SL.svgFilter(ty), s: sound({ osc1: { wave: 'sawtooth' }, noise: 0.15, filter: { type: ty, cutoff: ty === 'notch' ? 1200 : ty === 'lowpass' ? 600 : 1800, q: ty === 'bandpass' ? 4 : ty === 'notch' ? 0.8 : 2 } }, seq) })), ['Low-pass', 'High-pass', 'Band-pass', 'Notch']);
    },
    bright: () => choose('bright', [{ s: sound({ filter: { cutoff: 300 } }) }, { s: sound({ filter: { cutoff: 6000 } }) }]),
    reso() {
      const seq = [[45, 0, 2.0]], sweep = { a: 1.0, d: 1, s: 0 };
      return choose('reso', [{ s: sound({ filter: { cutoff: 200, q: 0.8, env: 0.7 }, fenv: sweep }, seq) }, { s: sound({ filter: { cutoff: 200, q: 18, env: 0.7 }, fenv: sweep }, seq) }]);
    },
    envShape() {
      const E = [{ a: 0.002, d: 0.2, s: 0, r: 0.15 }, { a: 1.0, d: 0.5, s: 0.9, r: 1.0 }, { a: 0.003, d: 0.1, s: 1, r: 0.02 }, { a: 1.4, d: 0.1, s: 1, r: 0.02 }];
      return choose('envShape', E.map((e) => ({ icon: SL.svgEnv(e), s: sound({ osc1: { wave: 'sawtooth' }, filter: { cutoff: 2500 }, amp: e }, [[57, 0, 1.4]]) })));
    },
    filtEnvDir() {
      const seq = arp([45, 52, 57], 0.6, 0.55), f = { cutoff: 250, q: 4, env: 0.7 };
      return choose('filtEnvDir', [{ s: sound({ filter: f, fenv: { a: 0.005, d: 0.5, s: 0 } }, seq) }, { s: sound({ filter: f, fenv: { a: 0.5, d: 0.5, s: 0.8 } }, seq) }]);
    },
    lfoTarget: () => choose('lfoTarget', ['pitch', 'amp', 'cutoff'].map((tg) => ({ s: sound({ filter: { cutoff: 1200, q: 4 }, lfo: { target: tg, rate: 5, depth: tg === 'pitch' ? 0.08 : 0.7 } }, [[57, 0, 2]]) }))),
    lfoRate: () => choose('lfoRate', [1, 8].map((r) => ({ s: sound({ filter: { cutoff: 900, q: 6 }, lfo: { target: 'cutoff', rate: r, depth: 0.6 } }, [[45, 0, 2.2]]) }))),
    harmonics() {
      const H = [[1], [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7, 0, 1 / 9, 0, 1 / 11], [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11]];
      return choose('harmonics', H.map((hs) => ({ s: sound({ osc1: { wave: 'additive' }, add: { h: hs.concat(Array(24 - hs.length).fill(0)) } }, [[52, 0, 1.2]]) })));
    },
    fmHarm: () => choose('fmHarm', [2, 3.41].map((r) => ({ s: sound({ osc1: { wave: 'sine' }, fm: { ratio: r, index: 3 }, amp: { a: 0.002, d: 1.5, s: 0, r: 1 } }, [[64, 0, 1.2]]) }))),
    fmIndex: () => choose('fmIndex', [0.5, 6].map((i) => ({ s: sound({ osc1: { wave: 'sine' }, fm: { ratio: 1, index: i } }) }))),
    wtMove() {
      const b = { osc1: { wave: 'wavetable' }, wt: { table: 'vocal', pos: 0.4 } };
      return choose('wtMove', [{ s: sound(b, [[45, 0, 2]]) }, { s: sound(SL.merge(b, { lfo: { target: 'wt', rate: 2, depth: 0.9 } }), [[45, 0, 2]]) }]);
    },
    wtTable() {
      const T = ['vocal', 'sync', 'fold'];
      return choose('wtTable', T.map((tb) => ({ s: sound({ osc1: { wave: 'wavetable' }, wt: { table: tb, pos: 0.5 }, lfo: { target: 'wt', rate: 0.6, depth: 1, wave: 'triangle' } }, [[45, 0, 2.2]]) })), T.map((tb) => t('tables.' + tb)));
    },
    fxType() {
      const F = [{ fx: { drive: 0.8 } }, { fx: { crush: 0.8 } }, { fx: { delay: 0.5, fb: 0.5, time: 0.25 } }, { fx: { reverb: 0.8 } }];
      return choose('fxType', F.map((f) => ({ s: sound(SL.merge({ osc1: { wave: 'triangle' }, amp: { a: 0.002, d: 0.25, s: 0, r: 0.2 } }, f), arp([60, 67], 0.6, 0.15)) })));
    },
  };
  SL.QUIZ_GEN = Q;
  SL.QUIZZES = {
    fund: ['pitchHigher', 'interval', 'pureRich'],
    osc: ['wave', 'pulse', 'unison'],
    filt: ['filterType', 'bright', 'reso'],
    env: ['envShape', 'filtEnvDir'],
    lfo: ['lfoTarget', 'lfoRate'],
    add: ['harmonics', 'pureRich'],
    fm: ['fmHarm', 'fmIndex'],
    wt: ['wtMove', 'wtTable'],
    fx: ['fxType'],
  };
  SL.makeQuiz = function (gens, n) {
    const out = [];
    for (let i = 0; i < (n || 6); i++) out.push(Q[gens[i % gens.length]]());
    return shuffle(out);
  };
  SL.shuffle = shuffle;

  // match-the-sound challenges: the user moves one control to match a hidden target
  SL.MATCHES = [
    { id: 'mcut', col: '#B6FF3B', path: 'filter.cutoff', base: { osc1: { wave: 'sawtooth' }, filter: { q: 3 } }, target: () => Math.round(200 * Math.pow(30, Math.random())), start: 2000, seq: arp([45, 52, 57, 52], 0.28, 0.25), err: (u, tg) => Math.abs(Math.log2(u / tg)) * 55, viz: 'filter' },
    { id: 'matk', col: '#FFB23E', path: 'amp.a', base: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 3000 } }, target: () => +(0.01 * Math.pow(150, Math.random())).toFixed(3), start: 0.1, seq: arp([57, 64], 1.3, 1.1), err: (u, tg) => Math.abs(Math.log2(u / tg)) * 30, viz: 'adsr' },
    { id: 'mres', col: '#3EF0FF', path: 'filter.q', base: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 700 } }, target: () => +(0.5 * Math.pow(50, Math.random())).toFixed(2), start: 2, seq: arp([45, 52, 57, 52], 0.28, 0.25), err: (u, tg) => Math.abs(Math.log2(u / tg)) * 30, viz: 'filter' },
    { id: 'mfm', col: '#FF4FD8', path: 'fm.ratio', base: { osc1: { wave: 'sine' }, fm: { index: 3 }, amp: { a: 0.002, d: 1.5, s: 0.2, r: 0.6 } }, target: () => pick([1, 2, 3, 4, 5, 6, 7]), start: 1.5, seq: arp([60, 64], 0.9, 0.7), err: (u, tg) => Math.abs(u - tg) * 45, viz: 'fm' },
    { id: 'mwt', col: '#8A7DFF', path: 'wt.pos', base: { osc1: { wave: 'wavetable' }, wt: { table: 'vocal' } }, target: () => +Math.random().toFixed(2), start: 0.5, seq: [[48, 0, 1.4]], err: (u, tg) => Math.abs(u - tg) * 220, viz: 'wt3d' },
  ];
})();

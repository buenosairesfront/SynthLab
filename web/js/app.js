// App shell: navigation, screens, progress, language, install.
(function () {
  const SL = window.SL, E = SL.engine, h = SL.h, C = SL.C, t = (k, v) => SL.t(k, v);
  const REPO = 'https://github.com/buenosairesfront/SynthLab';

  // ---------------- persistence ----------------
  const KEY = 'synthlab.v1';
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S = Object.assign({ done: {}, best: {}, xp: 0, recipes: {}, play: null, seq: null }, S);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const addXp = (n) => { S.xp += n; save(); xpChip.textContent = S.xp + ' XP'; xpChip.classList.remove('pop'); void xpChip.offsetWidth; xpChip.classList.add('pop'); };

  // ---------------- install as a desktop app (PWA) ----------------
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; installBtn.hidden = false; });
  window.addEventListener('appinstalled', () => { installEvt = null; installBtn.hidden = true; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('../sw.js').catch(() => {});

  // ---------------- shell ----------------
  const app = document.getElementById('app');
  const backBtn = h('button', { class: 'back', 'aria-label': 'back', onclick: () => history.back() }, '‹');
  const title = h('div', { class: 'title' });
  const installBtn = h('button', { class: 'pill inst', hidden: true, onclick: async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; installBtn.hidden = true; } });
  const langSel = h('select', { class: 'lang', 'aria-label': 'language', onchange: () => { SL.setLang(langSel.value); relabel(); go(tab, true); } },
    SL.LANGS.map((k) => h('option', { value: k }, window.SL_LANG[k].name)));
  langSel.value = SL.lang;
  const xpChip = h('div', { class: 'xp' }, S.xp + ' XP');
  const view = h('div', { class: 'view' });
  const ICONS = { learn: 'M3 12h3l3-7 4 14 3-7h5', play: 'M4 4h16v16H4zM9 4v10M15 4v10', lab: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3', retos: 'M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z' };
  const tabbar = h('nav', { class: 'tabs' }, Object.keys(ICONS).map((id) => h('button', { class: 'tab', 'data-t': id, onclick: () => go(id) }, h('span', { html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="${ICONS[id]}"/></svg>` }), h('b'))));
  app.append(h('header', { class: 'top' }, backBtn, title, installBtn, langSel, xpChip), view, tabbar);
  function relabel() {
    [...tabbar.children].forEach((b) => (b.querySelector('b').textContent = t('ui.tabs.' + b.dataset.t)));
    installBtn.textContent = '⤓ ' + t('ui.install');
    document.title = 'SynthLab';
  }
  relabel();

  let stack = [], tab = 'learn';
  function render() {
    SL.disposeScreen();
    SL.clock.stop();
    E.allOff(true);
    document.querySelectorAll('.toast').forEach((x) => x.remove());
    const cur = stack[stack.length - 1];
    view.innerHTML = ''; view.className = 'view' + (cur.fixed ? ' fixed' : '');
    view.scrollTop = 0;
    title.textContent = cur.title();
    backBtn.style.visibility = stack.length > 1 ? 'visible' : 'hidden';
    tabbar.style.display = stack.length > 1 ? 'none' : '';
    [...tabbar.children].forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    cur.build(view);
  }
  // in-app navigation is mirrored in the browser history, so the browser's back button works
  function push(scr) { stack.push(scr); history.pushState({ d: stack.length }, ''); render(); }
  function replace(scr) { stack[stack.length - 1] = scr; render(); }
  function back() { if (stack.length > 1) history.back(); }
  window.addEventListener('popstate', () => { if (stack.length > 1) { stack.pop(); render(); } });
  function go(tb, keep) {
    const depth = stack.length;
    tab = tb; stack = [ROOTS[tb]()];
    if (depth > 1 && !keep) history.go(-(depth - 1));
    render();
  }
  const scr = (titleFn, build, fixed) => ({ title: typeof titleFn === 'function' ? titleFn : () => titleFn, build, fixed });

  const card = (...k) => h('div', { class: 'card' }, ...k);
  const ring = (frac, col) => {
    const r = 16, c = 2 * Math.PI * r;
    return h('span', { class: 'ring', html: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" stroke="#26264a" stroke-width="4" fill="none"/><circle cx="20" cy="20" r="${r}" stroke="${col}" stroke-width="4" fill="none" stroke-dasharray="${c * frac} ${c}" stroke-linecap="round" transform="rotate(-90 20 20)"/></svg><b>${Math.round(frac * 100)}%</b>` });
  };
  const modIcon = (m) => {
    const ic = { sine: SL.svgWave('sine', m.col), sawtooth: SL.svgWave('sawtooth', m.col), square: SL.svgWave('square', m.col), triangle: SL.svgWave('triangle', m.col), lowpass: SL.svgFilter('lowpass', m.col), env: SL.svgEnv({ a: 0.3, d: 0.5, s: 0.6, r: 1 }, m.col) };
    if (ic[m.ico]) return ic[m.ico];
    if (m.ico === 'fm') return `<svg viewBox="0 0 100 40" class="ico"><path d="${fmPath()}" fill="none" stroke="${m.col}" stroke-width="2.5"/></svg>`;
    if (m.ico === 'wt') return `<svg viewBox="0 0 100 40" class="ico">${[0, 1, 2, 3].map((k) => `<path d="M${4 + k * 6},${30 - k * 6} q10,-16 20,0 t20,0 t20,0" fill="none" stroke="${m.col}" stroke-opacity="${0.3 + k * 0.23}" stroke-width="2"/>`).join('')}</svg>`;
    return `<svg viewBox="0 0 100 40" class="ico"><path d="M2,20 L20,20 L26,4 L32,36 L38,8 L44,30 L50,20 L98,20" fill="none" stroke="${m.col}" stroke-width="2.5"/></svg>`;
  };
  function fmPath() { let d = ''; for (let i = 0; i <= 100; i++) { const x = (i / 100) * 4 * Math.PI; d += (i ? 'L' : 'M') + (i * 0.96 + 2).toFixed(1) + ',' + (20 - 15 * Math.sin(x + 2.5 * Math.sin(2 * x))).toFixed(1); } return d; }
  const lessonCount = () => SL.MODULES.reduce((a, m) => a + m.lessons.length, 0);
  const modDone = (m) => m.lessons.filter((l) => S.done[l.id]).length;
  const mt = (m) => t('mods.' + m.id + '.t');

  function hero() {
    const cv = h('canvas', { class: 'hero-cv' });
    let tt = 0;
    SL.anim(() => {
      const { g, w, h: hh, d } = SL.fit(cv);
      tt += 0.012;
      g.clearRect(0, 0, w, hh);
      [C.pink, C.cyan, C.violet].forEach((col, k) => {
        g.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = i / 200, ph = x * Math.PI * 2 * (2 + k), env = Math.sin(Math.PI * x);
          const y = hh / 2 + env * hh * 0.3 * (Math.sin(ph + tt * (1 + k)) * 0.6 + 0.4 * Math.sin(ph * (2 + k * 0.5) - tt * 2));
          i ? g.lineTo(x * w, y) : g.moveTo(x * w, y);
        }
        g.strokeStyle = col; g.lineWidth = 2.2 * d; g.shadowColor = col; g.shadowBlur = 12 * d; g.globalAlpha = 0.85; g.stroke();
      });
      g.globalAlpha = 1; g.shadowBlur = 0;
    });
    const doneN = Object.keys(S.done).length, tot = lessonCount();
    return h('div', { class: 'hero' }, cv, h('div', { class: 'hero-t' }, h('h1', null, 'SynthLab'), h('p', null, t('ui.heroNote') + ' · ' + t('ui.heroStats', { a: doneN, b: tot, c: Object.keys(S.recipes).length, d: SL.RECIPES.length })), h('div', { class: 'bar' }, h('i', { style: `width:${(doneN / tot) * 100}%` }))));
  }

  // ---------------- LEARN ----------------
  const learnScreen = () => scr(() => t('ui.titles.learn'), (v) => {
    v.append(hero());
    const next = (() => { for (const m of SL.MODULES) for (let i = 0; i < m.lessons.length; i++) if (!S.done[m.lessons[i].id]) return [m, i]; return null; })();
    if (next) v.append(h('button', { class: 'cta', style: `--c:${next[0].col}`, onclick: () => push(lessonScreen(next[0], next[1])) }, h('small', null, t('ui.continue')), t('les.' + next[0].lessons[next[1]].id + '.t'), h('span', null, '›')));
    v.append(h('h2', null, t('ui.modules')));
    SL.MODULES.forEach((m, i) => {
      const fr = modDone(m) / m.lessons.length;
      v.append(h('button', { class: 'mod', style: `--c:${m.col}`, onclick: () => push(moduleScreen(m)) },
        h('div', { class: 'mod-ico', html: modIcon(m) }),
        h('div', { class: 'mod-t' }, h('small', null, t('ui.module', { n: i + 1 })), h('b', null, mt(m)), h('span', null, t('mods.' + m.id + '.sub'))),
        ring(fr, m.col)));
    });
    v.append(h('h2', null, t('ui.recipes')), h('p', { class: 'muted pad' }, t('ui.recipesSub')));
    v.append(h('div', { class: 'grid' }, SL.RECIPES.map((r) => h('button', { class: 'rcp' + (S.recipes[r.id] ? ' done' : ''), style: `--c:${r.col}`, onclick: () => push(recipeScreen(r)) }, h('b', null, t('rcp.' + r.id + '.name')), h('span', null, t('rcp.' + r.id + '.desc'))))));
    v.append(h('a', { class: 'gh', href: REPO, target: '_blank', rel: 'noopener' }, h('span', { html: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>' }), 'GitHub'));
  });

  const moduleScreen = (m) => scr(() => mt(m), (v) => {
    v.append(h('div', { class: 'mod-head', style: `--c:${m.col}` }, h('div', { class: 'mod-ico big', html: modIcon(m) }), h('p', null, t('mods.' + m.id + '.sub'))));
    m.lessons.forEach((l, i) => v.append(h('button', { class: 'les' + (S.done[l.id] ? ' done' : ''), style: `--c:${m.col}`, onclick: () => push(lessonScreen(m, i)) }, h('i', null, S.done[l.id] ? '✓' : String(i + 1)), h('b', null, t('les.' + l.id + '.t')), h('span', null, '›'))));
    const q = SL.QUIZZES[m.id];
    if (q) v.append(h('button', { class: 'cta', style: `--c:${m.col}`, onclick: () => push(quizScreen(m.id, q, 'q-' + m.id)) }, h('small', null, t('ui.earTraining') + (S.best['q-' + m.id] != null ? ' · ' + t('ui.best', { n: S.best['q-' + m.id] }) : '')), t('ui.moduleQuiz'), h('span', null, '›')));
  });

  // ---------------- dock: hold / pattern / keyboard ----------------
  const ARP_DEFAULT = { notes: [48, 55, 60, 63, 60, 55], step: 0.25, dur: 0.2 };
  function lessonDock(L, ctx) {
    const pat = L.pattern || ARP_DEFAULT;
    const kb = SL.keyboard({ start: 48 });
    const holdB = h('button', { class: 'pill' + (L.mode !== 'pattern' ? ' hint' : '') }, t('ui.hold'));
    const patB = h('button', { class: 'pill' + (L.mode === 'pattern' ? ' hint' : '') }, t('ui.pattern'));
    ctx.droneNote = 48;
    ctx.droneOn = () => { stopPat(); if (ctx.drone) E.noteOff(ctx.droneNote); ctx.drone = true; E.noteOn(ctx.droneNote, 0.8, L.freqSlider ? ctx.freq : undefined); holdB.classList.add('on'); holdB.classList.remove('hint'); };
    ctx.droneOff = () => { if (ctx.drone) E.noteOff(ctx.droneNote); ctx.drone = false; holdB.classList.remove('on'); };
    const stopPat = () => { SL.clock.stop(); patB.classList.remove('on'); patB.textContent = t('ui.pattern'); };
    holdB.onclick = () => (ctx.drone ? ctx.droneOff() : ctx.droneOn());
    patB.onclick = () => {
      if (SL.clock.running) return stopPat();
      ctx.droneOff();
      SL.clock.start(pat.step, (i, when) => { const n = pat.notes[i % pat.notes.length]; if (n != null) E.play(n, when, pat.dur); });
      patB.classList.add('on'); patB.classList.remove('hint'); patB.textContent = t('ui.patternStop');
    };
    SL.onDispose(() => { stopPat(); ctx.droneOff(); });
    return h('div', { class: 'dock' }, h('div', { class: 'dock-row' }, holdB, patB, h('span', { class: 'sp' }), h('button', { class: 'pill', onclick: () => kb.shift(-12) }, '−'), h('button', { class: 'pill', onclick: () => kb.shift(12) }, '+')), kb);
  }

  // ---------------- LESSON ----------------
  const lessonScreen = (m, idx) => scr(() => mt(m), (v) => {
    const L = m.lessons[idx], key = 'les.' + L.id;
    E.load(L.patch || {});
    const ctx = { freq: 220 }, seen = {};
    const stage = SL.stage(L.viz);
    const scroll = h('div', { class: 'scroll' });
    v.append(stage, scroll);
    v.append(lessonDock(L, ctx));
    scroll.append(h('div', { class: 'les-h', style: `--c:${m.col}` }, h('small', null, t('ui.lessonOf', { a: idx + 1, b: m.lessons.length })), h('h3', null, t(key + '.t'))));
    scroll.append(card(h('div', { class: 'prose', html: t(key + '.text') })));
    const mark = (k, val) => { (seen[k] = seen[k] || new Set()).add(val); check(); };
    if (L.freqSlider) {
      scroll.append(card(SL.slider(t('ui.freq'), 30, 4000, 220, (f) => Math.round(f) + ' Hz · ' + SL.noteName(Math.round(69 + 12 * Math.log2(f / 440))), (f) => {
        ctx.freq = f; mark('freq', Math.round(f));
        if (!ctx.drone) ctx.droneOn(); else E.setHeldFreq(ctx.droneNote, f);
      }, true)));
    }
    if (L.ctl) scroll.append(card(L.ctl.map((c) => SL.control(c))));
    if (L.presets) {
      const P = { sine: [1], saw: Array.from({ length: 24 }, (_, i) => 1 / (i + 1)), square: Array.from({ length: 24 }, (_, i) => (i % 2 ? 0 : 1 / (i + 1))), organ: [1, 0.8, 0, 0.6, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.3], hollow: [0, 0, 1, 0, 0.6, 0, 0, 0, 0.4], random: null };
      scroll.append(card(h('div', { class: 'row wrap' }, Object.keys(P).map((k) => h('button', { class: 'pill', onclick: () => {
        const src = P[k] || Array.from({ length: 24 }, () => (Math.random() > 0.5 ? Math.random() : 0));
        E.set('add.h', src.concat(Array(24).fill(0)).slice(0, 24).map((x) => +x.toFixed(2)));
      } }, t('ui.presets.' + k))))));
    }
    if (L.fourier) {
      let timer = null;
      const build = (kind) => () => {
        clearInterval(timer);
        const hs = Array(24).fill(0);
        let n = 0;
        if (!ctx.drone) ctx.droneOn();
        timer = setInterval(() => {
          while (n < 24 && kind === 'square' && n % 2) n++;
          if (n >= 24) { clearInterval(timer); mark('fourier', kind); return; }
          hs[n] = +(1 / (n + 1)).toFixed(3); n++;
          E.set('add.h', hs.slice());
        }, 380);
      };
      SL.onDispose(() => clearInterval(timer));
      scroll.append(card(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: build('saw') }, t('ui.buildSaw')), h('button', { class: 'btn', onclick: build('square') }, t('ui.buildSquare')))));
    }
    // tasks
    const texts = t(key + '.tasks');
    const taskEls = L.tasks.map((_, i) => h('li', null, h('i'), h('span', null, texts[i])));
    scroll.append(card(h('h4', null, t('ui.tryThis')), h('ul', { class: 'tasks' }, taskEls)));
    let completed = !!S.done[L.id];
    function check() {
      let all = true;
      L.tasks.forEach((fn, i) => {
        let ok = false; try { ok = !!fn(E.patch, seen); } catch (e) {}
        if (ok && !taskEls[i].classList.contains('ok')) { taskEls[i].classList.add('ok'); if (!taskEls[i].dataset.once) { taskEls[i].dataset.once = 1; SL.toast('✓ ' + texts[i].split(':')[0]); } }
        if (!taskEls[i].classList.contains('ok')) all = false;
      });
      if (all && !completed) { completed = true; S.done[L.id] = 1; addXp(25); save(); SL.toast(t('ui.lessonDone'), 'win'); doneB.classList.add('glow'); }
    }
    SL.listen((path, val) => {
      if (path !== '*') mark(path, val);
      if (ctx.drone && /^(uni\.voices|filter\.env|fenv\.|amp\.|penv\.|fm\.env|fm\.decay|mono)/.test(path)) { clearTimeout(ctx.rt); ctx.rt = setTimeout(() => ctx.drone && ctx.droneOn(), 120); }
    });
    const nextL = idx + 1 < m.lessons.length;
    const doneB = h('button', { class: 'btn primary', onclick: () => { if (!S.done[L.id]) { S.done[L.id] = 1; addXp(10); save(); } nextL ? replace(lessonScreen(m, idx + 1)) : replace(quizScreen(m.id, SL.QUIZZES[m.id], 'q-' + m.id)); } }, nextL ? t('ui.nextLesson') : t('ui.toQuiz'));
    scroll.append(h('div', { class: 'row end pad' }, doneB));
    check();
  }, true);

  // ---------------- RECIPE ----------------
  function recipePatch(r, upto) {
    const p = SL.merge(SL.DEFAULT, r.base);
    r.steps.slice(0, upto + 1).forEach((set) => Object.keys(set).forEach((k) => SL.set(p, k, set[k])));
    return p;
  }
  const recipeScreen = (r) => scr(() => t('rcp.' + r.id + '.name'), (v) => {
    let i = 0, tween = null;
    const texts = t('rcp.' + r.id + '.steps');
    E.load(r.base);
    const stage = SL.stage(['scope', 'filter', 'adsr', 'spectrum']);
    const scroll = h('div', { class: 'scroll' });
    const kb = SL.keyboard({ start: 48 });
    const playB = h('button', { class: 'pill hint' }, t('ui.listen'));
    const startPat = () => { const pat = r.pattern; SL.clock.start(pat.step, (k, when) => { const n = pat.notes[k % pat.notes.length]; if (n != null) E.play(n, when, pat.dur); }); playB.textContent = t('ui.stop'); playB.classList.add('on'); playB.classList.remove('hint'); };
    const stopPat = () => { SL.clock.stop(); playB.textContent = t('ui.listen'); playB.classList.remove('on'); };
    playB.onclick = () => { E.ensure(); SL.clock.running ? stopPat() : startPat(); };
    v.append(stage, scroll, h('div', { class: 'dock' }, h('div', { class: 'dock-row' }, playB, h('span', { class: 'sp' }), h('button', { class: 'pill', onclick: () => kb.shift(-12) }, '−'), h('button', { class: 'pill', onclick: () => kb.shift(12) }, '+')), kb));
    const dots = h('div', { class: 'dots' }, r.steps.map(() => h('i')));
    const txt = h('div', { class: 'prose step-t' });
    const changes = h('div', { class: 'changes' });
    const prev = h('button', { class: 'btn' }, t('ui.prev')), next = h('button', { class: 'btn primary' }, t('ui.next'));
    const extra = h('div');
    scroll.append(h('div', { class: 'les-h', style: `--c:${r.col}` }, h('small', null, t('ui.recipe')), h('h3', null, t('rcp.' + r.id + '.name'))), card(dots, txt, changes, h('div', { class: 'row end' }, prev, next)), extra);
    function show(n, animate) {
      i = n;
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i));
      txt.innerHTML = `<p><b>${t('ui.step', { n: i + 1 })}</b> ${texts[i]}</p>`;
      const set = r.steps[i];
      changes.innerHTML = '';
      Object.keys(set).forEach((k) => {
        const def = SL.CT[k] || {}, val = set[k];
        const shown = def.f && typeof val === 'number' ? def.f(val) : def.opts ? SL.optLabel((def.opts.find((o) => o[0] === val) || [0, val])[1]) : val;
        changes.append(h('span', { class: 'chg' }, SL.tc(k) + ': ' + shown));
      });
      const target = recipePatch(r, i);
      cancelAnimationFrame(tween);
      const from = SL.clone(E.patch), t0 = performance.now(), dur = animate ? 700 : 0;
      const paths = [];
      (function walk(o, pre) { for (const k in o) { const p = pre ? pre + '.' + k : k; if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) walk(o[k], p); else paths.push(p); } })(target, '');
      const nonNum = paths.filter((p) => typeof SL.get(target, p) !== 'number');
      const num = paths.filter((p) => typeof SL.get(target, p) === 'number' && SL.get(from, p) !== SL.get(target, p));
      nonNum.forEach((p) => { if (JSON.stringify(SL.get(from, p)) !== JSON.stringify(SL.get(target, p))) E.set(p, SL.get(target, p)); });
      const discrete = { 'uni.voices': 1, 'osc1.oct': 1, 'osc2.oct': 1, 'osc2.semi': 1, 'filter.slope': 1 };
      (function frame() {
        const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        num.forEach((p) => {
          const a = SL.get(from, p), b = SL.get(target, p);
          let val = discrete[p] ? (k < 1 ? a : b) : a + (b - a) * e;
          if (p === 'filter.cutoff' && a > 0 && b > 0) val = a * Math.pow(b / a, e);
          E.set(p, val);
        });
        if (k < 1) tween = requestAnimationFrame(frame);
      })();
      prev.disabled = i === 0;
      next.textContent = i === r.steps.length - 1 ? t('ui.finished') : t('ui.next');
      extra.innerHTML = '';
      if (i === r.steps.length - 1) {
        if (!S.recipes[r.id]) { S.recipes[r.id] = 1; addXp(20); save(); SL.toast(t('ui.recipeDone'), 'win'); }
        extra.append(card(h('h4', null, t('ui.tweak')), r.ctl.map((c) => SL.control(c)), h('button', { class: 'btn primary wide', onclick: () => { S.play = SL.clone(E.patch); save(); go('play'); } }, t('ui.openPlay'))));
      }
    }
    prev.onclick = () => i > 0 && show(i - 1, true);
    next.onclick = () => { if (i < r.steps.length - 1) { show(i + 1, true); if (!SL.clock.running) startPat(); } else back(); };
    SL.onDispose(() => cancelAnimationFrame(tween));
    show(0, false);
  }, true);

  // ---------------- QUIZ ----------------
  function playSpec(s) {
    E.ensure();
    SL.clock.stop();
    E.load(s.p);
    const t0 = E.now() + 0.06;
    s.seq.forEach(([n, st, d]) => E.play(n, t0 + st, d));
  }
  // modId: module id for the title (or 'mix'); gens: question generators; id: key for the best score
  const quizScreen = (modId, gens, id) => scr(() => (modId === 'mix' ? t('ui.mix') : t('ui.quizPrefix', { m: t('mods.' + modId + '.t') })), (v) => {
    const qs = SL.makeQuiz(gens, 6);
    let i = 0, score = 0;
    const body = h('div', { class: 'quiz' });
    v.append(body);
    function q() {
      body.innerHTML = '';
      if (i >= qs.length) return end();
      const Q = qs[i], target = Q.play || Q.options[Q.answer].s;
      let answered = false;
      const listen = h('button', { class: 'listen', onclick: () => { playSpec(target); listen.classList.remove('pulse'); void listen.offsetWidth; listen.classList.add('pulse'); } }, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' }), t('ui.listenBig'));
      const opts = Q.options.map((o, k) => {
        const replay = h('button', { class: 'replay', onclick: (ev) => { ev.stopPropagation(); playSpec(o.s); } }, '🔊');
        return h('div', { class: 'opt', role: 'button', onclick: () => choose(k) }, o.icon ? h('span', { html: o.icon }) : null, h('b', null, o.label), replay);
      });
      const fb = h('div', { class: 'fb' });
      const nextB = h('button', { class: 'btn primary wide hidden', onclick: () => { i++; q(); } }, i === qs.length - 1 ? t('ui.seeResult') : t('ui.next'));
      function choose(k) {
        if (answered) return;
        answered = true;
        const ok = k === Q.answer;
        if (ok) score++;
        opts[Q.answer].classList.add('right');
        if (!ok) opts[k].classList.add('wrong');
        body.classList.add('answered');
        fb.textContent = ok ? t('ui.good') : t('ui.was', { x: Q.options[Q.answer].label });
        fb.className = 'fb ' + (ok ? 'ok' : 'bad');
        nextB.classList.remove('hidden');
      }
      body.classList.remove('answered');
      body.append(h('div', { class: 'qbar' }, qs.map((_, k) => h('i', { class: k < i ? 'd' : k === i ? 'c' : '' }))), h('h3', null, Q.prompt), listen, h('div', { class: 'opts' + (opts.length > 3 ? ' g2' : '') }, opts), fb, nextB);
      setTimeout(() => listen.click(), 250);
    }
    function end() {
      const pct = Math.round((score / qs.length) * 100);
      const prev = S.best[id];
      if (prev == null || pct > prev) S.best[id] = pct;
      addXp(score * 5); save();
      body.append(h('div', { class: 'result' }, h('div', { class: 'big-score' }, pct + '%'), h('p', null, t('ui.correct', { a: score, b: qs.length, x: score * 5 })), h('p', { class: 'muted' }, pct === 100 ? t('ui.gold') : pct >= 66 ? t('ui.veryGood') : t('ui.keepTrying')),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => back() }, t('ui.back')), h('button', { class: 'btn primary', onclick: () => replace(quizScreen(modId, gens, id)) }, t('ui.again')))));
    }
    q();
  });

  // ---------------- MATCH ----------------
  const matchScreen = (M) => scr(() => t('match.' + M.id), (v) => {
    let round = 0, total = 0, target;
    const ROUNDS = 3;
    const stage = SL.stage([M.viz, 'scope']);
    const scroll = h('div', { class: 'scroll' });
    v.append(stage, scroll);
    const playWith = (val) => {
      E.ensure(); E.allOff(true);
      const keep = E.patch;
      E.patch = SL.clone(keep); SL.set(E.patch, M.path, val);
      const t0 = E.now() + 0.05;
      M.seq.forEach(([n, st, d]) => E.play(n, t0 + st, d));
      E.patch = keep;
    };
    const info = h('div', { class: 'prose' });
    const res = h('div', { class: 'fb' });
    const ctlBox = h('div');
    const checkB = h('button', { class: 'btn primary wide' }, t('ui.check'));
    function start() {
      target = M.target();
      E.load(M.base); E.set(M.path, M.start);
      ctlBox.innerHTML = ''; ctlBox.append(SL.control(M.path));
      info.innerHTML = `<p>${t('ui.round', { a: round + 1, b: ROUNDS })}</p>`;
      res.textContent = ''; res.className = 'fb';
      checkB.textContent = t('ui.check'); checkB.onclick = check;
    }
    function check() {
      const u = SL.get(E.patch, M.path), sc = Math.max(0, Math.round(100 - M.err(u, target)));
      total += sc;
      const f = SL.CT[M.path].f || SL.fmt.num;
      res.textContent = t('ui.matchRes', { s: sc, t: f(target), u: f(u) });
      res.className = 'fb ' + (sc > 70 ? 'ok' : 'bad');
      round++;
      if (round < ROUNDS) { checkB.textContent = t('ui.nextRound'); checkB.onclick = start; }
      else {
        const avg = Math.round(total / ROUNDS);
        if (S.best[M.id] == null || avg > S.best[M.id]) S.best[M.id] = avg;
        addXp(Math.round(avg / 10)); save();
        checkB.textContent = t('ui.avg', { n: avg }); checkB.onclick = () => replace(matchScreen(M));
      }
    }
    scroll.append(h('div', { class: 'les-h', style: `--c:${M.col}` }, h('small', null, t('ui.matchKicker')), h('h3', null, t('match.' + M.id))),
      card(info, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => playWith(target) }, t('ui.target')), h('button', { class: 'btn', onclick: () => playWith(SL.get(E.patch, M.path)) }, t('ui.yours'))), ctlBox, checkB, res));
    start();
  }, true);

  // ---------------- PLAY ----------------
  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10, 12], major: [0, 2, 4, 5, 7, 9, 11, 12], penta: [0, 3, 5, 7, 10, 12, 15, 17], phrygian: [0, 1, 3, 5, 7, 8, 10, 12], blues: [0, 3, 5, 6, 7, 10, 12, 15] };
  const playScreen = () => scr(() => t('ui.titles.play'), (v) => {
    E.load(S.play || { osc1: { wave: 'sawtooth' }, filter: { cutoff: 2400, q: 3 }, uni: { voices: 3, detune: 14 }, fx: { reverb: 0.2 } });
    let saveT;
    SL.listen(() => { clearTimeout(saveT); saveT = setTimeout(() => { S.play = SL.clone(E.patch); save(); }, 400); });
    const stage = SL.stage(['scope', 'filter', 'wave', 'adsr', 'fenv', 'lfo', 'wt3d', 'fm']);
    const scroll = h('div', { class: 'scroll' });
    const PANELS = {
      osc: ['osc1.waveAll', 'osc1.oct', 'osc1.pw', 'osc1.level', 'osc1.detune', 'uni.voices', 'uni.detune', 'osc2.waveAll', 'osc2.oct', 'osc2.semi', 'osc2.detune', 'osc2.level', 'noise'],
      filter: ['filter.type', 'filter.cutoff', 'filter.q', 'filter.slope', 'filter.env', 'filter.key', 'fenv.a', 'fenv.d', 'fenv.s', 'fenv.r'],
      amp: ['amp.a', 'amp.d', 'amp.s', 'amp.r', 'penv.amt', 'penv.decay', 'mono', 'glide', 'vol'],
      lfo: ['lfo.target', 'lfo.wave', 'lfo.rate', 'lfo.depth'],
      fmwt: ['fm.ratio', 'fm.index', 'fm.env', 'fm.decay', 'wt.table', 'wt.pos'],
      fx: ['fx.drive', 'fx.crush', 'fx.delay', 'fx.time', 'fx.fb', 'fx.reverb'],
      seq: null,
    };
    const tabs = h('div', { class: 'ptabs' });
    const panel = h('div', { class: 'card' });
    let curPanel = 'osc';
    const presets = h('select', { class: 'sel', onchange: () => { const r = SL.RECIPES.find((x) => x.id === presets.value); E.load(presets.value === 'init' ? {} : recipePatch(r, r.steps.length - 1)); S.play = SL.clone(E.patch); save(); presets.value = ''; showPanel(curPanel); } },
      h('option', { value: '' }, t('ui.loadPreset')), h('option', { value: 'init' }, t('ui.init')), SL.RECIPES.map((r) => h('option', { value: r.id }, t('rcp.' + r.id + '.name'))));
    const showPanel = (k) => {
      curPanel = k;
      [...tabs.children].forEach((b) => b.classList.toggle('on', b.dataset.k === k));
      SL.disposers = SL.disposers.filter((d) => !d.panel || (d(), false));
      panel.innerHTML = '';
      const before = SL.disposers.length;
      if (k === 'seq') panel.append(seqPanel());
      else PANELS[k].forEach((c) => panel.append(SL.control(c)));
      SL.disposers.slice(before).forEach((d) => (d.panel = true));
    };
    Object.keys(PANELS).forEach((k) => tabs.append(h('button', { class: 'ptab', 'data-k': k, onclick: () => showPanel(k) }, t('ui.panels.' + k))));
    const kb = SL.keyboard({ start: 48, span: 25 });
    scroll.append(h('div', { class: 'row pad' }, presets), tabs, panel);
    v.append(stage, scroll, h('div', { class: 'dock' }, h('div', { class: 'dock-row' }, h('button', { class: 'pill', onclick: () => kb.shift(-12) }, t('ui.octDown')), h('button', { class: 'pill', onclick: () => kb.shift(12) }, t('ui.octUp')), h('span', { class: 'sp' }), h('button', { class: 'pill', onclick: () => E.allOff(true) }, t('ui.panic'))), kb));
    showPanel('osc');
  }, true);

  function seqPanel() {
    const q = (S.seq = S.seq || { steps: [0, null, 3, null, 4, null, 2, 5, 0, null, 3, null, 7, 6, 4, 2], bpm: 120, scale: 'minor', root: 48, gate: 0.6 });
    if (!SCALES[q.scale]) q.scale = 'minor';
    const grid = h('div', { class: 'seq' });
    const cells = [];
    const note = (deg) => q.root + SCALES[q.scale][deg];
    for (let r = 7; r >= 0; r--) for (let c = 0; c < 16; c++) {
      const el = h('i', { 'data-r': r, 'data-c': c, class: c % 4 === 0 ? 'b' : '' });
      el.onclick = () => { q.steps[c] = q.steps[c] === r ? null : r; save(); paint(); if (q.steps[c] != null) E.play(note(q.steps[c]), E.now() + 0.01, 0.15); };
      cells.push(el); grid.append(el);
    }
    const paint = () => cells.forEach((el) => el.classList.toggle('on', q.steps[+el.dataset.c] === +el.dataset.r));
    paint();
    const playB = h('button', { class: 'btn primary' }, SL.clock.running ? t('ui.seqStop') : t('ui.seqPlay'));
    playB.onclick = () => {
      if (SL.clock.running) { SL.clock.stop(); playB.textContent = t('ui.seqPlay'); cells.forEach((el) => el.classList.remove('now')); return; }
      SL.clock.start(() => 60 / q.bpm / 4, (i, when) => {
        const c = i % 16, d = q.steps[c];
        if (d != null) E.play(note(d), when, (60 / q.bpm / 4) * q.gate * 1.8, c % 4 === 0 ? 0.95 : 0.75);
        SL.at(when, () => cells.forEach((el) => el.classList.toggle('now', +el.dataset.c === c)));
      });
      playB.textContent = t('ui.seqStop');
    };
    const scaleSel = h('div', { class: 'segs' }, Object.keys(SCALES).map((k) => h('button', { class: 'seg' + (k === q.scale ? ' on' : ''), onclick: (ev) => { q.scale = k; save(); [...scaleSel.children].forEach((b) => b.classList.toggle('on', b === ev.target)); } }, t('ui.scales.' + k))));
    return h('div', null,
      h('div', { class: 'row' }, playB, h('button', { class: 'btn', onclick: () => { q.steps = q.steps.map(() => (Math.random() < 0.65 ? Math.floor(Math.random() * 8) : null)); save(); paint(); } }, t('ui.random')), h('button', { class: 'btn', onclick: () => { q.steps = q.steps.map(() => null); save(); paint(); } }, t('ui.clear'))),
      grid,
      SL.slider(t('ui.tempo'), 60, 200, q.bpm, (x) => Math.round(x) + ' bpm', (x) => { q.bpm = x; save(); }),
      SL.slider(t('ui.gate'), 0.1, 1, q.gate, SL.fmt.pct, (x) => { q.gate = x; save(); }),
      SL.slider(t('ui.root'), 36, 60, q.root, (x) => SL.noteName(Math.round(x)), (x) => { q.root = Math.round(x); save(); }),
      h('div', { class: 'ctl' }, h('div', { class: 'ctl-l' }, t('ui.scale')), scaleSel),
      h('p', { class: 'muted' }, t('ui.seqHint')));
  }

  // ---------------- LAB ----------------
  const labScreen = () => scr(() => t('ui.titles.lab'), (v) => {
    v.append(h('p', { class: 'muted pad' }, t('ui.labSub')));
    v.append(h('div', { class: 'grid' }, SL.LAB.map((x) => h('button', { class: 'rcp lab', style: `--c:${x.col}`, onclick: () => push(scr(() => t('lab.' + x.id + '.name'), (vv) => x.build(vv), true)) }, h('b', null, t('lab.' + x.id + '.name')), h('span', null, t('lab.' + x.id + '.desc'))))));
  });

  // ---------------- RETOS ----------------
  const retosScreen = () => scr(() => t('ui.titles.retos'), (v) => {
    const all = [...new Set(Object.values(SL.QUIZZES).flat())];
    v.append(h('button', { class: 'cta', style: `--c:${C.pink}`, onclick: () => push(quizScreen('mix', all, 'q-all')) }, h('small', null, t('ui.mixSub') + (S.best['q-all'] != null ? ' · ' + t('ui.best', { n: S.best['q-all'] }) : '')), t('ui.mix'), h('span', null, '›')));
    v.append(h('h2', null, t('ui.matchTitle')), h('p', { class: 'muted pad' }, t('ui.matchSub')));
    v.append(h('div', { class: 'grid' }, SL.MATCHES.map((M) => h('button', { class: 'rcp', style: `--c:${M.col}`, onclick: () => push(matchScreen(M)) }, h('b', null, t('match.' + M.id)), h('span', null, S.best[M.id] != null ? t('ui.bestPts', { n: S.best[M.id] }) : t('ui.notPlayed'))))));
    v.append(h('h2', null, t('ui.byModule')));
    SL.MODULES.forEach((m) => {
      const id = 'q-' + m.id;
      v.append(h('button', { class: 'les', style: `--c:${m.col}`, onclick: () => push(quizScreen(m.id, SL.QUIZZES[m.id], id)) }, h('i', null, S.best[id] != null ? S.best[id] + '' : '·'), h('b', null, mt(m)), h('span', null, '›')));
    });
  });

  const ROOTS = { learn: learnScreen, play: playScreen, lab: labScreen, retos: retosScreen };

  // ---------------- splash ----------------
  const splash = h('div', { class: 'splash' }, h('div', { class: 'logo', html: '<svg viewBox="0 0 108 108"><path d="M18,54 C26,26 34,26 40,54 S54,82 60,54 L68,30 L68,78 L76,54 L90,54" fill="none" stroke="#FF4FD8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18,72 L90,72" stroke="#3EF0FF" stroke-width="3" stroke-linecap="round"/></svg>' }), h('h1', null, 'SynthLab'), h('p', null, t('ui.splashSub')), h('button', { class: 'btn primary big' }, t('ui.splashBtn')), h('small', null, t('ui.splashHint')));
  splash.addEventListener('click', () => {
    E.ensure();
    const t0 = E.now();
    [60, 64, 67, 72].forEach((n, k) => E.play(n, t0 + 0.05 + k * 0.07, 0.4, 0.5));
    splash.classList.add('out');
    setTimeout(() => splash.remove(), 500);
  });
  document.body.append(splash);
  document.addEventListener('pointerdown', () => { if (E.ctx && E.ctx.state !== 'running') E.ctx.resume(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { SL.clock.stop(); E.allOff(true); } });
  history.replaceState({ d: 1 }, '');
  go('learn');
})();

// Translation core: picks the language (saved choice → browser language → English) and resolves keys.
(function () {
  const SL = (window.SL = window.SL || {}), L = window.SL_LANG;
  SL.LANGS = ['es', 'en', 'de', 'zh', 'ja', 'hi'].filter((k) => L[k]);
  const pick = () => {
    try { const s = localStorage.getItem('synthlab.lang'); if (s && L[s]) return s; } catch (e) {}
    for (const x of navigator.languages || [navigator.language || 'en']) { const k = String(x).slice(0, 2).toLowerCase(); if (L[k]) return k; }
    return L.en ? 'en' : 'es';
  };
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  SL.lang = pick();
  // SL.t('ui.next') or SL.t('ui.best', {n: 80}); falls back to Spanish, then to the key itself
  SL.t = (p, v) => {
    let s = get(L[SL.lang], p);
    if (s == null) s = get(L.es, p);
    if (s == null) return p;
    if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
    return s;
  };
  // control labels use dotted parameter paths as keys ('filter.cutoff')
  SL.tc = (k) => ((L[SL.lang] || {}).ctl || {})[k] || L.es.ctl[k] || k;
  SL.setLang = (l) => { if (!L[l]) return; SL.lang = l; try { localStorage.setItem('synthlab.lang', l); } catch (e) {} document.documentElement.lang = l; };
  document.documentElement.lang = SL.lang;
})();

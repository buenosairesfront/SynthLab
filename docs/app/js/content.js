// Course content: modules, lessons, recipes, ear-training quizzes.
(function () {
  const SL = window.SL;
  const S = (seen, path, vals) => vals.every((v) => seen[path] && seen[path].has(v));
  const ARP = { notes: [48, 55, 60, 63, 60, 55], step: 0.22, dur: 0.16 };
  const SLOW = { notes: [48, 51, 55, 58], step: 1.4, dur: 1.0 };
  const PLUCKS = { notes: [60, 63, 67, 70, 72, 70, 67, 63], step: 0.18, dur: 0.1 };

  SL.MODULES = [
    {
      id: 'fund', t: 'Fundamentos del sonido', col: '#3EF0FF', ico: 'sine',
      sub: 'Onda, frecuencia, timbre y armónicos',
      lessons: [
        {
          id: 'f1', t: 'Una onda, una frecuencia', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine' } }, freqSlider: true,
          text: `<p>Todo sonido es <b>aire que vibra</b>. Un sintetizador genera esa vibración con un <b>oscilador</b>: un circuito (o código) que repite una forma una y otra vez.</p>
<p>Cuántas veces por segundo se repite es la <b>frecuencia</b>, en Hertz (Hz). Más Hz = más agudo. Cada vez que <b>duplicás</b> la frecuencia subís una <b>octava</b>: 110 → 220 → 440 Hz son la misma nota "La" en tres alturas.</p>
<p>Prendé <b>Sostener</b> abajo, mové la frecuencia y mirá cómo las ondas se aprietan en el osciloscopio y el pico se corre a la derecha en el espectro.</p>`,
          tasks: [['Bajá a menos de 80 Hz (casi lo sentís más que oírlo)', (p, s) => s.freq && [...s.freq].some((f) => f < 80)], ['Subí a más de 2000 Hz', (p, s) => s.freq && [...s.freq].some((f) => f > 2000)], ['Encontrá 440 Hz (el La de afinación) ±5 Hz', (p, s) => s.freq && [...s.freq].some((f) => Math.abs(f - 440) < 5)]],
        },
        {
          id: 'f2', t: 'Timbre: por qué un piano no suena a flauta', viz: ['spectrum', 'scope'], patch: { osc1: { wave: 'sine' } },
          ctl: ['osc1.wave'],
          text: `<p>Dos instrumentos pueden tocar la misma nota y sonar distinto. Esa diferencia es el <b>timbre</b>, y viene de los <b>armónicos</b>: frecuencias extra que suenan junto a la principal (la <b>fundamental</b>), en múltiplos exactos: 2×, 3×, 4×...</p>
<p>La onda <b>seno</b> es la única "pura": un solo pico en el espectro. Cualquier otra forma es en realidad una suma de senos.</p>
<p>Cambiá la forma de onda y contá los picos en el <b>Espectro</b>. La sierra tiene <i>todos</i> los armónicos; la cuadrada solo los <i>impares</i>.</p>`,
          tasks: [['Mirá el seno: un solo pico', (p, s) => S(s, 'osc1.wave', ['sine']) || p.osc1.wave === 'sine'], ['Probá la sierra (todos los armónicos)', (p, s) => S(s, 'osc1.wave', ['sawtooth'])], ['Probá la cuadrada (solo impares: 1, 3, 5...)', (p, s) => S(s, 'osc1.wave', ['square'])]],
        },
      ],
    },
    {
      id: 'osc', t: 'Osciladores', col: '#FF4FD8', ico: 'sawtooth',
      sub: 'Formas de onda, pulso, detune, unison y ruido',
      lessons: [
        {
          id: 'o1', t: 'Las cuatro formas clásicas', viz: ['wave', 'spectrum', 'scope'], ctl: ['osc1.wave', 'osc1.oct'],
          text: `<p><b>Seno</b>: suave, puro, ideal para sub-bajos.<br><b>Triángulo</b>: como el seno pero con un poquito de armónicos impares, suena a flauta.<br><b>Sierra</b>: brillante y rica — la reina de la síntesis sustractiva (cuerdas, brass, leads).<br><b>Cuadrada</b>: hueca, "de videojuego", tipo clarinete.</p>
<p>Elegir la onda es elegir la <b>materia prima</b>: después el filtro le va a sacar lo que sobre.</p>`,
          tasks: [['Escuchá las 4 formas', (p, s) => S(s, 'osc1.wave', ['sine', 'triangle', 'sawtooth', 'square'])], ['Bajá una octava', (p) => p.osc1.oct < 0]],
        },
        {
          id: 'o2', t: 'Pulso y ancho de pulso (PW)', viz: ['wave', 'spectrum'], patch: { osc1: { wave: 'pulse', pw: 0.5 } }, ctl: ['osc1.pw'],
          text: `<p>Una onda de <b>pulso</b> es una cuadrada a la que le podés cambiar cuánto tiempo está "arriba". Con 50% es una cuadrada perfecta; si la achicás se vuelve <b>nasal y fina</b>.</p>
<p>Fijate en el espectro: al cambiar el ancho, aparecen y desaparecen "huecos" entre los armónicos. Con 33% falta cada 3er armónico; con 25% falta cada 4°.</p>
<p>Si movés el PW mientras suena (a mano o con un LFO) obtenés el clásico <b>PWM</b>: un coro grueso típico de los synths de los 80.</p>`,
          tasks: [['Llevalo a menos de 10%', (p) => p.osc1.pw < 0.1], ['Mové el ancho mientras suena una nota sostenida', (p, s) => s['osc1.pw'] && s['osc1.pw'].size > 12]],
        },
        {
          id: 'o3', t: 'Detune y unison: el sonido gordo', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sawtooth' }, osc2: { wave: 'sawtooth', level: 0, detune: 0 } }, ctl: ['osc2.level', 'osc2.detune', 'osc2.semi', 'uni.voices', 'uni.detune'],
          text: `<p>Si sumás un segundo oscilador apenas <b>desafinado</b> (unos cents; 100 cents = 1 semitono), las dos ondas entran y salen de fase: se escucha un <b>batido</b>, un movimiento que hace al sonido más vivo.</p>
<p>El <b>unison</b> lleva la idea al extremo: varias copias del oscilador, cada una un poco desafinada y repartida en el estéreo. Así nace el famoso <b>supersaw</b> del trance y el EDM.</p>
<p>Con <b>semitonos</b> podés poner el OSC 2 en otro intervalo: +7 es una quinta, +12 una octava.</p>`,
          tasks: [['Subí el OSC 2 y desafinalo ±10 ct: escuchá el batido', (p) => p.osc2.level > 0.3 && Math.abs(p.osc2.detune) >= 8], ['Hacé un supersaw: 5+ voces y 25+ ct de dispersión', (p) => p.uni.voices >= 5 && p.uni.detune >= 25], ['Poné el OSC 2 una quinta arriba (+7)', (p) => p.osc2.semi === 7 && p.osc2.level > 0.2]],
        },
        {
          id: 'o4', t: 'Ruido', viz: ['spectrum', 'scope'], patch: { osc1: { level: 0 }, noise: 0.7 }, ctl: ['noise', 'osc1.level', 'filter.cutoff'],
          text: `<p>El <b>ruido blanco</b> tiene <i>todas</i> las frecuencias a la vez, al azar: el espectro es una meseta y el osciloscopio un caos.</p>
<p>Solo no tiene altura, pero es clave para <b>percusión</b> (hi-hats, redoblantes), viento, olas y para darle "aire" o ataque a otros sonidos. Pasado por un filtro se vuelve muy expresivo.</p>`,
          tasks: [['Bajá el cutoff y escuchá cómo el ruido se vuelve "viento"', (p) => p.noise > 0.2 && p.filter.cutoff < 800], ['Mezclá un poco de ruido con el oscilador', (p) => p.noise > 0.1 && p.osc1.level > 0.3]],
        },
      ],
    },
    {
      id: 'filt', t: 'Filtros', col: '#B6FF3B', ico: 'lowpass',
      sub: 'Cutoff, resonancia, tipos y pendientes',
      lessons: [
        {
          id: 'fl1', t: 'Low-pass: el corazón de la sustractiva', viz: ['filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1200, q: 1 } }, ctl: ['filter.cutoff'],
          text: `<p>La síntesis <b>sustractiva</b> arranca con una onda rica en armónicos y le <b>quita</b> parte con un filtro.</p>
<p>El <b>low-pass</b> (pasa-bajos) deja pasar lo grave y atenúa lo que está por encima del <b>cutoff</b>. Cutoff bajo = oscuro y apagado; alto = brillante.</p>
<p>La curva verde es la respuesta del filtro sobre el espectro. <b>Arrastrá el punto</b> directamente sobre el gráfico (horizontal = cutoff).</p>`,
          tasks: [['Oscurecelo por debajo de 300 Hz', (p) => p.filter.cutoff < 300], ['Abrilo por encima de 8 kHz', (p) => p.filter.cutoff > 8000], ['Hacé un barrido completo mientras suena', (p, s) => s['filter.cutoff'] && s['filter.cutoff'].size > 20]],
        },
        {
          id: 'fl2', t: 'Resonancia', viz: ['filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 800, q: 1 } }, ctl: ['filter.q', 'filter.cutoff'],
          text: `<p>La <b>resonancia</b> (Q) realimenta el filtro y genera un <b>pico</b> justo en el cutoff: esa frecuencia se enfatiza y el sonido se vuelve "chillón", "líquido".</p>
<p>Con resonancia alta, al barrer el cutoff se escucha un silbido que recorre los armónicos uno por uno: el sonido del <b>acid</b> (TB-303).</p>
<p>En el gráfico, el eje <b>vertical</b> del punto controla la resonancia.</p>`,
          tasks: [['Subí la resonancia por encima de 12', (p) => p.filter.q > 12], ['Con resonancia alta, barré el cutoff', (p, s) => p.filter.q > 8 && s['filter.cutoff'] && s['filter.cutoff'].size > 15]],
        },
        {
          id: 'fl3', t: 'Otros tipos: HP, BP y Notch', viz: ['filter'], patch: { osc1: { wave: 'sawtooth' }, noise: 0.25, filter: { cutoff: 1500, q: 3 } }, ctl: ['filter.type', 'filter.cutoff', 'filter.q'],
          text: `<p><b>High-pass</b>: lo contrario, saca los graves. Ideal para limpiar y para sonidos finitos.<br><b>Band-pass</b>: deja solo una franja: suena a teléfono, a radio, a "wah".<br><b>Notch</b>: saca solo una franja angosta; suave, tipo phaser.</p>
<p>Mirá cómo cambia la forma de la curva verde con cada tipo.</p>`,
          tasks: [['Probá los 4 tipos', (p, s) => S(s, 'filter.type', ['lowpass', 'highpass', 'bandpass', 'notch'])], ['Hacé un sonido de "teléfono": band-pass cerca de 1–2 kHz', (p) => p.filter.type === 'bandpass' && p.filter.cutoff > 800 && p.filter.cutoff < 2500]],
        },
        {
          id: 'fl4', t: 'Pendiente y keytracking', viz: ['filter'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 700, q: 2 } }, ctl: ['filter.slope', 'filter.key', 'filter.cutoff'], mode: 'pattern', pattern: { notes: [36, 48, 60, 72, 84, 72, 60, 48], step: 0.3, dur: 0.25 },
          text: `<p>La <b>pendiente</b> dice cuán fuerte atenúa el filtro después del cutoff: 12 dB/octava es suave; 24 dB/oct es más drástico y "Moog".</p>
<p>El <b>keytracking</b> hace que el cutoff siga a la nota: si no, las notas agudas suenan opacas (porque sus armónicos quedan fuera) y las graves brillantes. Con 100%, el filtro se mueve igual que el teclado.</p>`,
          tasks: [['Compará 12 y 24 dB', (p, s) => S(s, 'filter.slope', [12, 24])], ['Subí el keytracking por encima de 70% y escuchá las notas agudas', (p) => p.filter.key > 0.7]],
        },
      ],
    },
    {
      id: 'env', t: 'Envolventes', col: '#FFB23E', ico: 'env',
      sub: 'ADSR de volumen, de filtro y de pitch',
      lessons: [
        {
          id: 'e1', t: 'ADSR: la forma del sonido en el tiempo', viz: ['adsr', 'scope'], ctl: ['amp.a', 'amp.d', 'amp.s', 'amp.r'], mode: 'pattern', pattern: { notes: [48, 55, 60, 55], step: 0.8, dur: 0.45 },
          text: `<p>Una nota no solo tiene altura y timbre: tiene una <b>forma en el tiempo</b>. La envolvente <b>ADSR</b> la describe:</p>
<p><b>A</b>ttack: cuánto tarda en llegar al máximo.<br><b>D</b>ecay: cuánto tarda en caer hasta...<br><b>S</b>ustain: el nivel en que se queda mientras mantenés la tecla.<br><b>R</b>elease: cuánto tarda en apagarse cuando soltás.</p>
<p>Arrastrá los puntos en el gráfico. El punto blanco te muestra en vivo dónde está la nota.</p>`,
          tasks: [['Hacé un pluck: sustain 0 y decay corto (<0.3 s)', (p) => p.amp.s < 0.05 && p.amp.d < 0.3], ['Hacé un pad: attack mayor a 1 s', (p) => p.amp.a > 1], ['Hacé un órgano: attack y release muy cortos, sustain al máximo', (p) => p.amp.a < 0.02 && p.amp.r < 0.06 && p.amp.s > 0.9]],
        },
        {
          id: 'e2', t: 'Envolvente de filtro', viz: ['fenv', 'filter'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 250, q: 4, env: 0.5 }, fenv: { a: 0.005, d: 0.3, s: 0 } }, ctl: ['filter.env', 'fenv.a', 'fenv.d', 'fenv.s', 'filter.cutoff', 'filter.q'], mode: 'pattern', pattern: ARP,
          text: `<p>Una segunda ADSR puede mover el <b>cutoff</b> en cada nota. Así el sonido arranca brillante y se oscurece (o al revés): es lo que hace que un bajo "hable".</p>
<p><b>Env → cutoff</b> dice cuánto mueve la envolvente al filtro (y en qué dirección, si es negativo). En la vista <b>Filtro</b> vas a ver la curva saltar con cada nota.</p>`,
          tasks: [['Decay de filtro muy corto (<0.15 s): sonido "plucky"', (p) => p.fenv.d < 0.15 && p.filter.env > 0.2], ['Attack de filtro lento (>0.5 s): sonido que "se abre"', (p) => p.fenv.a > 0.5 && p.filter.env > 0.2], ['Probá una cantidad negativa', (p) => p.filter.env < -0.2]],
        },
        {
          id: 'e3', t: 'Envolvente de pitch: de un seno a un bombo', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine', oct: -1 }, amp: { a: 0.001, d: 0.35, s: 0, r: 0.2 }, penv: { amt: 0, decay: 0.06 } }, ctl: ['penv.amt', 'penv.decay', 'amp.d'], mode: 'pattern', pattern: { notes: [36, null, 36, null, 36, null, 36, 36], step: 0.25, dur: 0.2 },
          text: `<p>Si la altura cae muy rápido al inicio de la nota, el oído no lo escucha como "glissando" sino como un <b>golpe</b>.</p>
<p>Un seno grave + caída de pitch rápida + decay de volumen corto = un <b>bombo electrónico</b> (como el de una 808/909). Así de simple.</p>`,
          tasks: [['Subí el pitch env a más de 24 semitonos', (p) => p.penv.amt > 24], ['Encontrá un kick con pegada: decay de pitch < 80 ms', (p) => p.penv.amt > 18 && p.penv.decay < 0.08]],
        },
      ],
    },
    {
      id: 'lfo', t: 'LFO y modulación', col: '#8A7DFF', ico: 'triangle',
      sub: 'Vibrato, trémolo, wah y más',
      lessons: [
        {
          id: 'l1', t: 'Un oscilador que mueve perillas', viz: ['lfo', 'filter', 'scope'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1500, q: 5 }, lfo: { depth: 0.3, rate: 5, target: 'pitch' } }, ctl: ['lfo.target', 'lfo.rate', 'lfo.depth'],
          text: `<p>Un <b>LFO</b> (Low Frequency Oscillator) es un oscilador tan lento que no se oye: en lugar de sonar, <b>mueve otro parámetro</b>.</p>
<p>LFO → <b>pitch</b> = vibrato. LFO → <b>volumen</b> = trémolo. LFO → <b>cutoff</b> = wah / wobble (el bajo del dubstep). LFO → <b>paneo</b> = el sonido gira de lado a lado (¡usá auriculares!).</p>`,
          tasks: [['Vibrato sutil: pitch, 4–7 Hz, profundidad < 10%', (p) => p.lfo.target === 'pitch' && p.lfo.rate > 4 && p.lfo.rate < 7 && p.lfo.depth > 0.01 && p.lfo.depth < 0.1], ['Trémolo: destino volumen', (p) => p.lfo.target === 'amp' && p.lfo.depth > 0.3], ['Wobble: destino cutoff, 1–4 Hz', (p) => p.lfo.target === 'cutoff' && p.lfo.rate >= 1 && p.lfo.rate <= 4 && p.lfo.depth > 0.3]],
        },
        {
          id: 'l2', t: 'Formas, velocidad y el salto al audio', viz: ['lfo', 'spectrum'], patch: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 1200, q: 6 }, lfo: { depth: 0.5, rate: 3, target: 'cutoff', wave: 'sine' } }, ctl: ['lfo.wave', 'lfo.rate', 'lfo.depth', 'lfo.target'],
          text: `<p>La forma del LFO es la forma del movimiento: seno = suave, cuadrada = salta entre dos valores (trino), sierra = sube y cae de golpe, <b>S&H</b> (sample &amp; hold) = valores al azar: el sonido "computadora de película".</p>
<p>¿Y si lo acelerás mucho? Por encima de ~20 Hz el LFO deja de ser movimiento y se vuelve <b>timbre</b>: aparecen frecuencias nuevas. Eso es, en el fondo, la <b>síntesis FM</b>. Probalo con destino pitch.</p>`,
          tasks: [['Probá S&H en el cutoff', (p) => p.lfo.wave === 'sh' && p.lfo.target === 'cutoff'], ['Probá la cuadrada en pitch (trino)', (p) => p.lfo.wave === 'square' && p.lfo.target === 'pitch'], ['Llevá el LFO a pitch a más de 25 Hz: ¡timbre nuevo!', (p) => p.lfo.rate > 25 && p.lfo.target === 'pitch' && p.lfo.depth > 0.1]],
        },
      ],
    },
    {
      id: 'add', t: 'Síntesis aditiva', col: '#3EF0FF', ico: 'square',
      sub: 'Construir sonidos sumando senos',
      lessons: [
        {
          id: 'a1', t: 'Dibujá con armónicos', viz: ['harm', 'spectrum'], patch: { osc1: { wave: 'additive' }, add: { h: [1].concat(Array(23).fill(0)) } }, presets: true,
          text: `<p>La aditiva es lo opuesto a la sustractiva: en vez de esculpir, <b>sumás senos</b> uno por uno. Cada barra es un armónico (1 = fundamental, 2 = el doble de frecuencia, etc.).</p>
<p>Fourier demostró que <b>cualquier</b> sonido periódico se puede armar así. Arriba ves la onda que resulta de tu mezcla.</p>
<p>Dibujá con el dedo sobre las barras o usá los presets.</p>`,
          tasks: [['Armá una cuadrada: solo impares (1, 3, 5, 7...) decrecientes', (p) => { const h = p.add.h; return h[0] > 0.5 && h[2] > 0.15 && h[4] > 0.08 && h[1] < 0.05 && h[3] < 0.05 && h[5] < 0.05; }], ['Prendé al menos 10 armónicos', (p) => p.add.h.filter((v) => v > 0.05).length >= 10], ['Hacé un sonido de órgano: 1, 2, 4 y 8 fuertes', (p) => [0, 1, 3, 7].every((i) => p.add.h[i] > 0.4)]],
        },
        {
          id: 'a2', t: 'Fourier en acción', viz: ['harm', 'scope'], patch: { osc1: { wave: 'additive' }, add: { h: [1].concat(Array(23).fill(0)) } }, fourier: true,
          text: `<p>Mirá cómo se construye una <b>sierra</b> sumando armónicos con amplitud 1/n: primero un seno, después se suma el 2° (a la mitad), el 3° (a un tercio)... y la onda se va afilando.</p>
<p>Lo mismo con la <b>cuadrada</b> (solo impares). Tocá el botón y escuchá cómo el timbre se va "llenando".</p>`,
          tasks: [['Construí la sierra completa', (p, s) => s.fourier && s.fourier.has('saw')], ['Construí la cuadrada completa', (p, s) => s.fourier && s.fourier.has('square')]],
        },
      ],
    },
    {
      id: 'fm', t: 'Síntesis FM', col: '#FFB23E', ico: 'fm',
      sub: 'Portadora, moduladora, ratio e índice',
      lessons: [
        {
          id: 'm1', t: 'Portadora y moduladora', viz: ['fm', 'scope', 'spectrum'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 1, index: 0 } }, ctl: ['fm.index', 'fm.ratio'],
          text: `<p>En FM un oscilador (la <b>moduladora</b>) mueve la frecuencia de otro (la <b>portadora</b>) tan rápido que se generan <b>bandas laterales</b>: nuevas frecuencias en portadora ± 1×, 2×, 3×... la moduladora.</p>
<p>El <b>índice</b> es cuánto modula: con 0 es un seno puro; al subirlo aparecen cada vez más bandas y el sonido se vuelve brillante, metálico. El gráfico FM las calcula en vivo (funciones de Bessel).</p>
<p>Fue la tecnología del Yamaha DX7, el sonido de los 80.</p>`,
          tasks: [['Subí el índice a más de 3 y mirá aparecer bandas', (p) => p.fm.index > 3], ['Con índice alto, probá ratio 2 y ratio 3', (p, s) => p.fm.index > 1.5 && s['fm.ratio'] && s['fm.ratio'].has(2) && s['fm.ratio'].has(3)]],
        },
        {
          id: 'm2', t: 'Ratios: armónico vs. campana', viz: ['fm', 'spectrum'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 2, index: 2.5 }, amp: { a: 0.002, d: 2.5, s: 0, r: 1.5 } }, ctl: ['fm.ratio', 'fm.index'], mode: 'pattern', pattern: { notes: [60, 67, 72, 79], step: 0.9, dur: 0.5 },
          text: `<p>Si el ratio es un <b>número entero</b> (1, 2, 3...), todas las bandas caen sobre armónicos: el sonido es "afinado" (barras celestes).</p>
<p>Si el ratio <b>no es entero</b> (1.41, 3.5...), aparecen frecuencias <b>inarmónicas</b> (barras naranjas): campanas, metales, gongs, vidrio. Es lo que la sustractiva no puede hacer fácil.</p>`,
          tasks: [['Hacé una campana: ratio no entero (ej. 3.5) con índice > 2', (p) => Math.abs(p.fm.ratio - Math.round(p.fm.ratio)) > 0.15 && p.fm.index > 2], ['Ratio 1 con índice ~1–2: sonido tipo bronce', (p) => p.fm.ratio === 1 && p.fm.index > 1 && p.fm.index < 2.5]],
        },
        {
          id: 'm3', t: 'Envolvente de índice: el e-piano', viz: ['fm', 'adsr'], patch: { osc1: { wave: 'sine' }, fm: { ratio: 1, index: 4, env: 0.3, decay: 0.8 }, amp: { a: 0.002, d: 1.5, s: 0.2, r: 0.6 } }, ctl: ['fm.env', 'fm.decay', 'fm.index', 'fm.ratio'], mode: 'pattern', pattern: { notes: [57, 60, 64, 67, 64, 60], step: 0.4, dur: 0.35 },
          text: `<p>Los instrumentos reales son más brillantes al principio del golpe. En FM eso se logra con una <b>envolvente sobre el índice</b>: arranca alto (muchas bandas, brillo) y decae (más puro).</p>
<p>Ratio 1, índice alto que decae rápido = el famoso <b>e-piano FM</b>. Ratio no entero + decay largo = campana tubular.</p>`,
          tasks: [['Env de índice > 80% con decay < 0.5 s', (p) => p.fm.env > 0.8 && p.fm.decay < 0.5], ['Probá decay de índice largo (>2 s)', (p) => p.fm.decay > 2 && p.fm.env > 0.4]],
        },
      ],
    },
    {
      id: 'wt', t: 'Wavetable', col: '#FF4FD8', ico: 'wt',
      sub: 'Tablas de ondas y morphing',
      lessons: [
        {
          id: 'w1', t: '¿Qué es una wavetable?', viz: ['wt3d', 'spectrum', 'scope'], patch: { osc1: { wave: 'wavetable' }, wt: { table: 'basic', pos: 0 } }, ctl: ['wt.table', 'wt.pos'],
          text: `<p>Una <b>wavetable</b> es una pila de ciclos de onda distintos (acá, 32 "cuadros"). La <b>posición</b> elige cuál suena. Al moverla el timbre se <b>transforma</b> gradualmente de una onda a otra.</p>
<p>Fue invento de PPG en los 80 y hoy es la base de Serum y Vital. Cada tabla esconde un universo: probá <b>Vocal</b> (vocales A-E-I-O-U), <b>Sync</b>, <b>Wavefold</b>...</p>`,
          tasks: [['Recorré la tabla Básica de punta a punta', (p, s) => s['wt.pos'] && [...s['wt.pos']].some((v) => v < 0.05) && [...s['wt.pos']].some((v) => v > 0.95)], ['Probá 4 tablas distintas', (p, s) => s['wt.table'] && s['wt.table'].size >= 4]],
        },
        {
          id: 'w2', t: 'Escanear la tabla con un LFO', viz: ['wt3d', 'lfo', 'spectrum'], patch: { osc1: { wave: 'wavetable' }, wt: { table: 'vocal', pos: 0.5 }, lfo: { target: 'wt', rate: 0.5, depth: 0.8 }, filter: { cutoff: 9000 } }, ctl: ['wt.table', 'wt.pos', 'lfo.rate', 'lfo.depth', 'lfo.wave'],
          text: `<p>El verdadero poder de las wavetables es <b>moverlas</b>. Con el LFO apuntando a la posición, el timbre "habla", respira, gruñe.</p>
<p>Lento = evolución tipo pad. Rápido + tabla Vocal o Sync = el <b>growl</b> del bass music. S&H = robot.</p>`,
          tasks: [['Hacé un growl: LFO a más de 4 Hz', (p) => p.lfo.rate > 4 && p.lfo.depth > 0.4], ['Usá S&H sobre la tabla Digital', (p) => p.lfo.wave === 'sh' && p.wt.table === 'digital']],
        },
      ],
    },
    {
      id: 'fx', t: 'Efectos', col: '#B6FF3B', ico: 'fx',
      sub: 'Saturación, bitcrush, delay y reverb',
      lessons: [
        {
          id: 'x1', t: 'Saturación y bitcrush', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'sine' } }, ctl: ['fx.drive', 'fx.crush', 'osc1.wave'],
          text: `<p>La <b>saturación</b> "aplasta" los picos de la onda (mirá el osciloscopio: el seno se vuelve casi cuadrado). Al deformar la onda se crean <b>armónicos nuevos</b>: más calor, más presencia.</p>
<p>El <b>bitcrush</b> reduce la resolución: la onda se vuelve una escalera. Sonido lo-fi, 8-bit, digital y sucio.</p>`,
          tasks: [['Saturá un seno hasta que parezca cuadrado', (p) => p.fx.drive > 0.5 && p.osc1.wave === 'sine'], ['Bajá a 4 bits o menos', (p) => p.fx.crush > 0.7]],
        },
        {
          id: 'x2', t: 'Delay y reverb: el espacio', viz: ['scope', 'spectrum'], patch: { osc1: { wave: 'triangle' }, amp: { a: 0.002, d: 0.2, s: 0, r: 0.2 } }, ctl: ['fx.delay', 'fx.time', 'fx.fb', 'fx.reverb'], mode: 'pattern', pattern: { notes: [72, null, null, 79, null, null, 75, null], step: 0.2, dur: 0.1 },
          text: `<p>El <b>delay</b> repite el sonido después de un tiempo; el <b>feedback</b> decide cuántas repeticiones. Sincronizado con el ritmo genera patrones nuevos.</p>
<p>La <b>reverb</b> simula miles de reflexiones de una sala: pone el sonido en un espacio. Un pluck seco + reverb = un ambiente enorme.</p>`,
          tasks: [['Delay con feedback > 60%', (p) => p.fx.delay > 0.2 && p.fx.fb > 0.6], ['Llevá la reverb arriba del 60%', (p) => p.fx.reverb > 0.6]],
        },
      ],
    },
  ];

  // ---------------------------- RECIPES ----------------------------
  SL.RECIPES = [
    { id: 'acid', name: 'Bajo ácido 303', col: '#B6FF3B', desc: 'El chillido líquido del acid house.', pattern: { notes: [36, 36, 48, 36, 39, 36, 46, 36, 36, 43, 36, 48, 36, 39, 41, 36], step: 0.13, dur: 0.1 },
      base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 0.3, s: 0.6, r: 0.05 } },
      steps: [
        ['Empezamos con un seno: limpio pero sin carácter.', {}],
        ['Cambiamos a <b>sierra</b>: todos los armónicos, mucho material para filtrar.', { 'osc1.wave': 'sawtooth' }],
        ['Filtro <b>low-pass 24 dB</b> bien cerrado: el sonido se vuelve grave y redondo.', { 'filter.slope': 24, 'filter.cutoff': 280 }],
        ['Subimos la <b>resonancia</b>: aparece el "chillido".', { 'filter.q': 16 }],
        ['<b>Envolvente de filtro</b> corta: cada nota hace "uuíp".', { 'filter.env': 0.55, 'fenv.d': 0.18, 'fenv.s': 0 }],
        ['Un poco de <b>saturación</b> y delay para el toque final.', { 'fx.drive': 0.35, 'fx.delay': 0.18, 'fx.time': 0.39 }],
      ], ctl: ['filter.cutoff', 'filter.q', 'filter.env', 'fenv.d'] },
    { id: 'pad', name: 'Pad cálido', col: '#8A7DFF', desc: 'Una nube de cuerdas sintéticas.', pattern: SLOW,
      base: { osc1: { wave: 'sawtooth' } },
      steps: [
        ['Una sierra sola, con ataque inmediato: suena a órgano de juguete.', {}],
        ['<b>Unison</b> de 5 voces desafinadas: se vuelve ancho y coral.', { 'uni.voices': 5, 'uni.detune': 22 }],
        ['<b>Attack y release lentos</b>: ahora las notas aparecen y se desvanecen.', { 'amp.a': 0.9, 'amp.r': 1.8, 'amp.s': 0.9 }],
        ['Low-pass a ~1.8 kHz para que sea cálido, no chillón.', { 'filter.cutoff': 1800, 'filter.q': 1.5 }],
        ['LFO lento al <b>cutoff</b>: el pad respira.', { 'lfo.target': 'cutoff', 'lfo.rate': 0.25, 'lfo.depth': 0.25 }],
        ['Y mucha <b>reverb</b>.', { 'fx.reverb': 0.65 }],
      ], ctl: ['uni.detune', 'amp.a', 'filter.cutoff', 'fx.reverb'] },
    { id: 'pluck', name: 'Pluck', col: '#3EF0FF', desc: 'Notas cortas y brillantes, como una cuerda pulsada.', pattern: PLUCKS,
      base: { osc1: { wave: 'square' } },
      steps: [
        ['Una cuadrada sostenida.', {}],
        ['Sin sustain y con decay corto: ya es percusivo.', { 'amp.s': 0, 'amp.d': 0.25, 'amp.r': 0.2 }],
        ['Filtro cerrado + envolvente de filtro rapidísima: el "click" brillante inicial.', { 'filter.cutoff': 400, 'filter.env': 0.6, 'fenv.d': 0.12, 'filter.q': 3 }],
        ['Sumamos un OSC 2 sierra una octava arriba.', { 'osc2.wave': 'sawtooth', 'osc2.oct': 1, 'osc2.level': 0.35 }],
        ['<b>Delay</b> rítmico y reverb: listo para un tema de house melódico.', { 'fx.delay': 0.3, 'fx.time': 0.27, 'fx.fb': 0.45, 'fx.reverb': 0.35 }],
      ], ctl: ['fenv.d', 'filter.cutoff', 'fx.delay'] },
    { id: 'lead', name: 'Supersaw lead', col: '#FF4FD8', desc: 'El lead gigante del trance y el EDM.', pattern: { notes: [72, 72, 74, 75, 75, 74, 72, 70], step: 0.3, dur: 0.27 },
      base: { osc1: { wave: 'sawtooth' } },
      steps: [
        ['Sierra pelada.', {}],
        ['<b>7 voces</b> de unison bien abiertas: el supersaw.', { 'uni.voices': 7, 'uni.detune': 35 }],
        ['<b>Mono + glide</b>: las notas se deslizan como una voz.', { mono: true, glide: 0.06 }],
        ['<b>Vibrato</b> sutil con el LFO.', { 'lfo.target': 'pitch', 'lfo.rate': 5.5, 'lfo.depth': 0.03 }],
        ['Delay y reverb para el estadio.', { 'fx.delay': 0.25, 'fx.time': 0.3, 'fx.reverb': 0.45 }],
      ], ctl: ['uni.detune', 'glide', 'lfo.depth'] },
    { id: 'reese', name: 'Bajo Reese', col: '#FFB23E', desc: 'Dos sierras peleándose: drum & bass.', pattern: { notes: [31, 31, 31, 34], step: 0.9, dur: 0.85 },
      base: { osc1: { wave: 'sawtooth', oct: -1 } },
      steps: [
        ['Una sierra grave.', {}],
        ['Segunda sierra <b>desafinada</b>: aparece el batido amenazante.', { 'osc2.wave': 'sawtooth', 'osc2.oct': -1, 'osc2.level': 0.8, 'osc2.detune': 18 }],
        ['Low-pass para domarlo.', { 'filter.cutoff': 900, 'filter.q': 2, 'filter.slope': 24 }],
        ['Un poco de LFO al cutoff y saturación: movimiento y mugre.', { 'lfo.target': 'cutoff', 'lfo.rate': 0.6, 'lfo.depth': 0.15, 'fx.drive': 0.4 }],
      ], ctl: ['osc2.detune', 'filter.cutoff', 'fx.drive'] },
    { id: 'bell', name: 'Campana FM', col: '#3EF0FF', desc: 'Metal y cristal con dos senos.', pattern: { notes: [72, 79, 76, 84], step: 1.0, dur: 0.6 },
      base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 3, s: 0, r: 2.5 } },
      steps: [
        ['Un seno con decay largo.', {}],
        ['Moduladora en ratio 1: tono más rico pero afinado.', { 'fm.ratio': 1, 'fm.index': 2 }],
        ['Ratio <b>3.5</b>: ¡bandas inarmónicas, campana!', { 'fm.ratio': 3.5, 'fm.index': 3.5 }],
        ['Envolvente de índice: el golpe brilla y el resto queda puro.', { 'fm.env': 0.85, 'fm.decay': 1.2 }],
        ['Reverb.', { 'fx.reverb': 0.5 }],
      ], ctl: ['fm.ratio', 'fm.index', 'fm.decay'] },
    { id: 'kick', name: 'Bombo', col: '#FF5A6E', desc: 'Un kick de cero, sin samples.', pattern: { notes: [36, null, null, null, 36, null, null, null], step: 0.13, dur: 0.3 },
      base: { osc1: { wave: 'sine', oct: -1 }, amp: { a: 0.001, d: 1.5, s: 0, r: 0.1 } },
      steps: [
        ['Un seno grave: un "uuum" sin golpe.', {}],
        ['Decay corto: ya es un "bum".', { 'amp.d': 0.4 }],
        ['<b>Envolvente de pitch</b> rápida: el golpe.', { 'penv.amt': 36, 'penv.decay': 0.045 }],
        ['Saturación para pegada y cuerpo.', { 'fx.drive': 0.45 }],
      ], ctl: ['penv.amt', 'penv.decay', 'amp.d'] },
    { id: 'snare', name: 'Redoblante y hi-hat', col: '#B6FF3B', desc: 'Percusión con ruido filtrado.', pattern: { notes: [72, 96, 96, 96, 60, 96, 96, 96], step: 0.15, dur: 0.05 },
      base: { osc1: { wave: 'triangle', level: 0 }, noise: 0, amp: { a: 0.001, d: 0.15, s: 0, r: 0.12 } },
      steps: [
        ['Ruido puro con decay corto: ya suena a percusión.', { noise: 0.8 }],
        ['<b>High-pass</b> alto: solo queda lo brillante — hi-hat.', { 'filter.type': 'highpass', 'filter.cutoff': 6000, 'filter.key': 1 }],
        ['Un triángulo con pitch env le da "cuerpo" en las notas graves: redoblante.', { 'osc1.level': 0.6, 'penv.amt': 12, 'penv.decay': 0.03 }],
        ['Reverb corta para el espacio.', { 'fx.reverb': 0.25 }],
      ], ctl: ['filter.cutoff', 'amp.d', 'noise'] },
    { id: 'growl', name: 'Growl wavetable', col: '#FF4FD8', desc: 'Bajo que "habla" para bass music.', pattern: { notes: [36, null, 36, 36, null, 39, 36, null], step: 0.18, dur: 0.16 },
      base: { osc1: { wave: 'wavetable', oct: -1 }, wt: { table: 'vocal', pos: 0.2 } },
      steps: [
        ['Una wavetable de formantes, quieta.', {}],
        ['LFO rápido escaneando la tabla: empieza a hablar.', { 'lfo.target': 'wt', 'lfo.rate': 6, 'lfo.depth': 0.9 }],
        ['Más voces con unison.', { 'uni.voices': 3, 'uni.detune': 12 }],
        ['Saturación fuerte.', { 'fx.drive': 0.6 }],
        ['Cambiamos a la tabla Sync: más agresivo.', { 'wt.table': 'sync' }],
      ], ctl: ['wt.table', 'lfo.rate', 'fx.drive'] },
    { id: 'epiano', name: 'E-piano FM', col: '#FFB23E', desc: 'El Rhodes digital de los 80.', pattern: { notes: [57, 64, 60, 67, 65, 60, 64, 55], step: 0.42, dur: 0.38 },
      base: { osc1: { wave: 'sine' }, amp: { a: 0.002, d: 1.8, s: 0.15, r: 0.5 } },
      steps: [
        ['Un seno con decay de piano.', {}],
        ['FM ratio 1, índice moderado.', { 'fm.ratio': 1, 'fm.index': 3 }],
        ['Envolvente de índice rápida: el "tine" del golpe.', { 'fm.env': 0.85, 'fm.decay': 0.25 }],
        ['Trémolo suave + reverb.', { 'lfo.target': 'amp', 'lfo.rate': 4.5, 'lfo.depth': 0.25, 'fx.reverb': 0.3 }],
      ], ctl: ['fm.index', 'fm.decay', 'lfo.depth'] },
  ];

  // ---------------------------- EAR TRAINING ----------------------------
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sound = (p, seq) => ({ p, seq: seq || [[57, 0, 1.0]] });
  const arp = (notes, step, dur) => notes.map((n, i) => [n, i * step, dur]);
  // generic: pick an answer among option specs [{label, icon, s}]
  function choose(prompt, opts) { const answer = Math.floor(Math.random() * opts.length); return { prompt, options: opts, answer }; }

  const WAVE_LAB = { sine: 'Seno', triangle: 'Triángulo', sawtooth: 'Sierra', square: 'Cuadrada' };
  const Q = {
    pitchHigher() {
      const a = 48 + Math.floor(Math.random() * 18), b = a + pick([1, 2, 3, 5, -1, -2, -3, -5]);
      const ans = b > a ? 1 : 0;
      return { prompt: '¿Cuál de las dos notas es más aguda?', play: sound({ osc1: { wave: 'triangle' } }, [[a, 0, 0.6], [b, 0.8, 0.6]]), options: [{ label: 'La primera', s: sound({ osc1: { wave: 'triangle' } }, [[a, 0, 0.6]]) }, { label: 'La segunda', s: sound({ osc1: { wave: 'triangle' } }, [[b, 0, 0.6]]) }], answer: ans };
    },
    interval() {
      const a = 48 + Math.floor(Math.random() * 12);
      const opts = [[12, 'Octava'], [7, 'Quinta'], [4, 'Tercera mayor']].map(([iv, l]) => ({ label: l, s: sound({ osc1: { wave: 'sawtooth' }, filter: { cutoff: 1500 } }, [[a, 0, 0.6], [a + iv, 0.7, 0.8]]) }));
      return choose('¿Qué intervalo escuchás?', opts);
    },
    pureRich() {
      return choose('¿Es un tono puro o rico en armónicos?', [{ label: 'Puro (seno)', icon: SL.svgWave('sine'), s: sound({ osc1: { wave: 'sine' } }) }, { label: 'Rico (sierra)', icon: SL.svgWave('sawtooth'), s: sound({ osc1: { wave: 'sawtooth' } }) }]);
    },
    wave() {
      return choose('¿Qué forma de onda es?', Object.keys(WAVE_LAB).map((w) => ({ label: WAVE_LAB[w], icon: SL.svgWave(w), s: sound({ osc1: { wave: w } }, [[pick([45, 52, 57]), 0, 1.1]]) })));
    },
    pulse() {
      return choose('¿Pulso ancho (cuadrada) o angosto?', [{ label: 'Ancho 50%', icon: SL.svgWave('square'), s: sound({ osc1: { wave: 'pulse', pw: 0.5 } }) }, { label: 'Angosto 8%', icon: SL.svgWave('pulse'), s: sound({ osc1: { wave: 'pulse', pw: 0.08 } }) }]);
    },
    unison() {
      return choose('¿Un oscilador solo o unison desafinado?', [{ label: 'Uno solo', s: sound({ osc1: { wave: 'sawtooth' } }, [[57, 0, 1.4]]) }, { label: 'Unison', s: sound({ osc1: { wave: 'sawtooth' }, uni: { voices: 5, detune: 30 } }, [[57, 0, 1.4]]) }]);
    },
    filterType() {
      const T = { lowpass: 'Low-pass', highpass: 'High-pass', bandpass: 'Band-pass', notch: 'Notch' };
      const seq = arp([45, 52, 57, 64], 0.3, 0.28);
      return choose('¿Qué tipo de filtro está actuando?', Object.keys(T).map((t) => ({ label: T[t], icon: SL.svgFilter(t), s: sound({ osc1: { wave: 'sawtooth' }, noise: 0.15, filter: { type: t, cutoff: t === 'notch' ? 1200 : t === 'lowpass' ? 600 : 1800, q: t === 'bandpass' ? 4 : t === 'notch' ? 0.8 : 2 } }, seq) })));
    },
    bright() {
      const c = pick([[300, 'Oscuro'], [6000, 'Brillante']]);
      return choose('¿Cutoff alto (brillante) o bajo (oscuro)?', [{ label: 'Oscuro · ~300 Hz', s: sound({ filter: { cutoff: 300 } }) }, { label: 'Brillante · ~6 kHz', s: sound({ filter: { cutoff: 6000 } }) }]);
    },
    reso() {
      const seq = [[45, 0, 2.0]];
      return choose('¿Hay mucha resonancia en el barrido?', [{ label: 'Poca', s: sound({ filter: { cutoff: 200, q: 0.8, env: 0.7 }, fenv: { a: 1.0, d: 1, s: 0 } }, seq) }, { label: 'Mucha', s: sound({ filter: { cutoff: 200, q: 18, env: 0.7 }, fenv: { a: 1.0, d: 1, s: 0 } }, seq) }]);
    },
    envShape() {
      const E = { Pluck: { a: 0.002, d: 0.2, s: 0, r: 0.15 }, Pad: { a: 1.0, d: 0.5, s: 0.9, r: 1.0 }, 'Órgano': { a: 0.003, d: 0.1, s: 1, r: 0.02 }, 'Swell': { a: 1.4, d: 0.1, s: 1, r: 0.02 } };
      return choose('¿Qué envolvente de volumen tiene?', Object.keys(E).map((k) => ({ label: k, icon: SL.svgEnv(E[k]), s: sound({ osc1: { wave: 'sawtooth' }, filter: { cutoff: 2500 }, amp: E[k] }, [[57, 0, 1.4]]) })));
    },
    filtEnvDir() {
      return choose('El filtro en cada nota... ', [{ label: 'Se cierra (brillo → oscuro)', s: sound({ filter: { cutoff: 250, q: 4, env: 0.7 }, fenv: { a: 0.005, d: 0.5, s: 0 } }, arp([45, 52, 57], 0.6, 0.55)) }, { label: 'Se abre lento (oscuro → brillo)', s: sound({ filter: { cutoff: 250, q: 4, env: 0.7 }, fenv: { a: 0.5, d: 0.5, s: 0.8 } }, arp([45, 52, 57], 0.6, 0.55)) }]);
    },
    lfoTarget() {
      const T = { pitch: 'Vibrato (pitch)', amp: 'Trémolo (volumen)', cutoff: 'Wah (cutoff)' };
      return choose('¿A qué está conectado el LFO?', Object.keys(T).map((t) => ({ label: T[t], s: sound({ filter: { cutoff: 1200, q: 4 }, lfo: { target: t, rate: 5, depth: t === 'pitch' ? 0.08 : 0.7 } }, [[57, 0, 2]]) })));
    },
    lfoRate() {
      return choose('¿El LFO es lento o rápido?', [{ label: 'Lento (~1 Hz)', s: sound({ filter: { cutoff: 900, q: 6 }, lfo: { target: 'cutoff', rate: 1, depth: 0.6 } }, [[45, 0, 2.2]]) }, { label: 'Rápido (~8 Hz)', s: sound({ filter: { cutoff: 900, q: 6 }, lfo: { target: 'cutoff', rate: 8, depth: 0.6 } }, [[45, 0, 2.2]]) }]);
    },
    harmonics() {
      const H = { 'Solo fundamental': [1], 'Solo impares': [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7, 0, 1 / 9, 0, 1 / 11], 'Todos': [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11] };
      return choose('¿Qué armónicos contiene?', Object.keys(H).map((k) => ({ label: k, s: sound({ osc1: { wave: 'additive' }, add: { h: H[k].concat(Array(24 - H[k].length).fill(0)) } }, [[52, 0, 1.2]]) })));
    },
    fmHarm() {
      return choose('¿Sonido armónico o inarmónico (campana)?', [{ label: 'Armónico (ratio 2)', s: sound({ osc1: { wave: 'sine' }, fm: { ratio: 2, index: 3 }, amp: { a: 0.002, d: 1.5, s: 0, r: 1 } }, [[64, 0, 1.2]]) }, { label: 'Inarmónico (ratio 3.41)', s: sound({ osc1: { wave: 'sine' }, fm: { ratio: 3.41, index: 3 }, amp: { a: 0.002, d: 1.5, s: 0, r: 1 } }, [[64, 0, 1.2]]) }]);
    },
    fmIndex() {
      return choose('¿Índice de FM bajo o alto?', [{ label: 'Bajo (0.5)', s: sound({ osc1: { wave: 'sine' }, fm: { ratio: 1, index: 0.5 } }) }, { label: 'Alto (6)', s: sound({ osc1: { wave: 'sine' }, fm: { ratio: 1, index: 6 } }) }]);
    },
    wtMove() {
      return choose('¿La posición de la wavetable se mueve o está quieta?', [{ label: 'Quieta', s: sound({ osc1: { wave: 'wavetable' }, wt: { table: 'vocal', pos: 0.4 } }, [[45, 0, 2]]) }, { label: 'Se mueve', s: sound({ osc1: { wave: 'wavetable' }, wt: { table: 'vocal', pos: 0.4 }, lfo: { target: 'wt', rate: 2, depth: 0.9 } }, [[45, 0, 2]]) }]);
    },
    wtTable() {
      const T = ['vocal', 'sync', 'fold'];
      return choose('¿Qué tabla suena? (escaneada de punta a punta)', T.map((t) => ({ label: SL.TABLES[t].name, s: sound({ osc1: { wave: 'wavetable' }, wt: { table: t, pos: 0.5 }, lfo: { target: 'wt', rate: 0.6, depth: 1, wave: 'triangle' } }, [[45, 0, 2.2]]) })));
    },
    fxType() {
      const F = { 'Saturación': { fx: { drive: 0.8 } }, 'Bitcrush': { fx: { crush: 0.8 } }, 'Delay': { fx: { delay: 0.5, fb: 0.5, time: 0.25 } }, 'Reverb': { fx: { reverb: 0.8 } } };
      return choose('¿Qué efecto escuchás?', Object.keys(F).map((k) => ({ label: k, s: sound(SL.merge({ osc1: { wave: 'triangle' }, amp: { a: 0.002, d: 0.25, s: 0, r: 0.2 } }, F[k]), arp([60, 67], 0.6, 0.15)) })));
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
    { id: 'mcut', name: 'Igualá el cutoff', col: '#B6FF3B', path: 'filter.cutoff', base: { osc1: { wave: 'sawtooth' }, filter: { q: 3 } }, target: () => Math.round(200 * Math.pow(30, Math.random())), start: 2000, seq: arp([45, 52, 57, 52], 0.28, 0.25), err: (u, t) => Math.abs(Math.log2(u / t)) * 55, viz: 'filter' },
    { id: 'matk', name: 'Igualá el attack', col: '#FFB23E', path: 'amp.a', base: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 3000 } }, target: () => +(0.01 * Math.pow(150, Math.random())).toFixed(3), start: 0.1, seq: arp([57, 64], 1.3, 1.1), err: (u, t) => Math.abs(Math.log2(u / t)) * 30, viz: 'adsr' },
    { id: 'mres', name: 'Igualá la resonancia', col: '#3EF0FF', path: 'filter.q', base: { osc1: { wave: 'sawtooth' }, filter: { cutoff: 700 } }, target: () => +(0.5 * Math.pow(50, Math.random())).toFixed(2), start: 2, seq: arp([45, 52, 57, 52], 0.28, 0.25), err: (u, t) => Math.abs(Math.log2(u / t)) * 30, viz: 'filter' },
    { id: 'mfm', name: 'Igualá el ratio FM', col: '#FF4FD8', path: 'fm.ratio', base: { osc1: { wave: 'sine' }, fm: { index: 3 }, amp: { a: 0.002, d: 1.5, s: 0.2, r: 0.6 } }, target: () => pick([1, 2, 3, 4, 5, 6, 7]), start: 1.5, seq: arp([60, 64], 0.9, 0.7), err: (u, t) => Math.abs(u - t) * 45, viz: 'fm' },
    { id: 'mwt', name: 'Igualá la posición WT', col: '#8A7DFF', path: 'wt.pos', base: { osc1: { wave: 'wavetable' }, wt: { table: 'vocal' } }, target: () => +Math.random().toFixed(2), start: 0.5, seq: [[48, 0, 1.4]], err: (u, t) => Math.abs(u - t) * 220, viz: 'wt3d' },
  ];
})();

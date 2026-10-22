<p align="center">
  <img src="site/img/filter.jpg" width="200" alt="SynthLab: resonancia del filtro">
  <img src="site/img/wavetable.jpg" width="200" alt="SynthLab: wavetable 3D">
  <img src="site/img/fm.jpg" width="200" alt="SynthLab: síntesis FM">
  <img src="site/img/chaos.jpg" width="200" alt="SynthLab: secuenciador del caos">
</p>

<h1 align="center">SynthLab</h1>
<p align="center"><b>Conocé la síntesis de sonido viendo y escuchando.</b><br>
Un acercamiento breve al mundo de la síntesis, para tener una noción de cómo funciona.<br>
Web app · sin descargas · código abierto · sin dependencias</p>

<p align="center">
  <a href="https://buenosairesfront.github.io/SynthLab/"><b>🌐 Página</b></a> ·
  <a href="https://buenosairesfront.github.io/SynthLab/app/"><b>▶ Abrir SynthLab</b></a>
</p>

<p align="center">Español · English · Deutsch · 中文 · 日本語 · हिन्दी</p>

---

SynthLab es una introducción corta e interactiva a la síntesis: no es un curso completo, sino un recorrido para entender las ideas centrales y empezar a entrenar el oído. Tiene un sintetizador de verdad y gráficos en vivo: cada vez que movés un parámetro, **ves** lo que **escuchás**. Hay osciloscopio, espectro, la curva del filtro (que se arrastra con el dedo o el mouse), un ADSR editable con la nota corriendo, la wavetable en 3D y las bandas laterales de FM calculadas en tiempo real.

**No hace falta descargar nada:** se abre en el navegador, en la computadora o en el celular. Si querés, la podés instalar en la computadora como app (y funciona sin conexión).

## ✨ Qué tiene

| Sección | Contenido |
|---|---|
| **Conocer** | 24 lecciones breves en 9 módulos, con tareas que se marcan solas cuando las cumplís ("hacé un pluck", "hacé una campana"). |
| **Recetas** | 10 sonidos clásicos paso a paso: bajo ácido 303, pad, pluck, supersaw, Reese, campana FM, bombo, redoblante/hi-hat, growl wavetable, e-piano FM. |
| **Tocar** | Sintetizador completo y secuenciador de 16 pasos con escalas y presets. |
| **Lab** | Cuerda física (Karplus-Strong), Lissajous y ring mod, secuenciador del caos (mapa logístico), "dibujá tu onda" (Fourier), pad XY tipo Kaoss, Destructor (saturación/bitcrush). |
| **Retos** | Entrenamiento de oído: 19 tipos de preguntas y 5 desafíos de "igualá el sonido". Puntos XP y mejores puntajes. |

### Recorrido

1. **Fundamentos del sonido**: frecuencia, octavas, timbre, armónicos
2. **Osciladores**: formas de onda, pulso/PWM, detune, unison, ruido
3. **Filtros**: low-pass, resonancia, HP/BP/notch, pendiente, keytracking
4. **Envolventes**: ADSR de amplitud, de filtro y de pitch
5. **LFO y modulación**: vibrato, trémolo, wah, S&H, LFO a audio
6. **Síntesis aditiva**: dibujar armónicos, Fourier en acción
7. **Síntesis FM**: portadora/moduladora, ratios, índice, e-piano
8. **Wavetable**: tablas, posición, escaneo con LFO
9. **Efectos**: saturación, bitcrush, delay, reverb

### El motor de síntesis

Polifónico (14 voces), sobre Web Audio API:

- 2 osciladores (seno, triángulo, sierra, cuadrada, pulso con PW, wavetable, aditiva) + ruido
- Unison de hasta 7 voces con apertura estéreo
- Filtro LP/HP/BP/Notch de 12 o 24 dB/oct, resonancia y keytracking
- Dos ADSR (amplitud y filtro) + envolvente de pitch
- LFO (seno, triángulo, cuadrada, sierra, S&H) hacia pitch, cutoff, volumen, paneo o wavetable
- FM con ratio, índice y envolvente de índice
- 7 wavetables generadas por síntesis de Fourier (Básica, Pulso, Vocal, Sync, Wavefold, Espectral, Digital)
- Saturación, bitcrush, delay con feedback y reverb por convolución
- Modo mono con glide

## 💻 Instalarla en la computadora (opcional)

SynthLab es una web app instalable:

- **Chrome / Edge:** abrí la app y tocá **Instalar** (arriba en la app o en la página), o el ícono de instalar en la barra de direcciones, o el menú **⋮ → Instalar SynthLab**.
- **Safari (Mac):** **Archivo → Agregar al Dock**.

Queda como una app más en tu computadora y funciona sin conexión.

## 🌍 Idiomas

La app y la página están en **español, inglés, alemán, chino, japonés e hindi**. El idioma se elige solo según el navegador y se puede cambiar con el selector de arriba. Los textos están en `web/lang/<código>.js` (app) y `site/landing-i18n.js` (página); para sumar un idioma, copiá `web/lang/es.js`, traducilo y agregalo en `web/index.html` y en `web/js/i18n.js`.

## 🗂 Estructura del repositorio

```
web/              La app (HTML + JS puro, sin dependencias)
  index.html      Shell y estilos
  lang/*.js       Textos de cada idioma (es, en, de, zh, ja, hi)
  js/i18n.js      Elección de idioma y traducción de textos
  js/engine.js    Motor de audio: voces, filtros, envolventes, LFO, FM, wavetables, efectos
  js/ui.js        Controles, teclado multitáctil y visualizaciones en Canvas
  js/content.js   Estructura de lecciones, recetas y retos de oído
  js/lab.js       Experimentos del laboratorio
  js/app.js       Navegación, pantallas, progreso (localStorage), instalación
site/             Página de presentación, manifiesto, service worker, íconos y capturas
docs/             Sitio armado para GitHub Pages (generado por scripts/build-site.sh)
scripts/          Armado del sitio
```

## 🛠 Desarrollo

Levantá un servidor local y abrí la app:

```bash
python3 -m http.server -d web 8000     # → http://localhost:8000
```

Después de cambiar algo en `web/` o `site/`, regenerá `docs/` (página + app + lista de archivos para uso sin conexión):

```bash
./scripts/build-site.sh
```

## 🌐 Publicación (GitHub Pages)

El workflow `.github/workflows/pages.yml` publica la carpeta `docs/` en cada push a `main`. En **Settings → Pages**, la fuente tiene que estar en **GitHub Actions**.

- `https://buenosairesfront.github.io/SynthLab/` → página
- `https://buenosairesfront.github.io/SynthLab/app/` → la app

## 📄 Licencia

[MIT](LICENSE)

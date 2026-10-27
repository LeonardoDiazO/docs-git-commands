---
name: Guías locales (Fichero)
description: Guías de consulta rápida con forma de fichero de biblioteca, generadas desde la instalación real
colors:
  madera-bmad: "#1d2a24"
  madera-bmad-2: "#26362e"
  madera-bmad-3: "#33463c"
  madera-git: "#2d1c17"
  madera-git-2: "#3a2620"
  madera-git-3: "#4b322a"
  carton: "#f1ece0"
  carton-gastado: "#e6dfcf"
  carton-faltante: "#d9d3c3"
  tinta: "#1d1e1b"
  tinta-2: "#4a473f"
  tinta-3: "#6e695d"
  rojo-renglon: "#b5412c"
  laton: "#c19a4b"
  laton-claro: "#e2c98a"
  sobre-madera: "#e9e2d0"
  sobre-madera-2: "#b9b4a2"
  ok: "#3f7d5e"
  aviso: "#e58a74"
  aviso-texto: "#efb3a3"
  papel: "#fffdf6"
  filete: "#d6cdb8"
  pliegue: "#cfc6b1"
  faltante: "#d9d3c3"
  brillo: "#ffffff88"
  junta: "#00000033"
  guia-ocre: "#d6b162"
  guia-verde: "#8fb39a"
  guia-azul: "#8fa9c4"
  guia-salmon: "#e3957a"
  guia-lila: "#b9a3c4"
  guia-gris: "#b5b0a3"
typography:
  rotulo:
    fontFamily: '"Archivo Narrow",sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.08em"
  titulo-hoja:
    fontFamily: '"Archivo Narrow",sans-serif'
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
  titulo-ficha:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  body-hoja:
    fontFamily: "Atkinson, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  signatura:
    fontFamily: '"Courier Prime",monospace'
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  codigo:
    fontFamily: '"Courier Prime",monospace'
    fontSize: "15px"
    fontWeight: 400
  etiqueta:
    fontFamily: '"Archivo Narrow",sans-serif'
    fontSize: "14px"
    fontWeight: 700
    letterSpacing: "0.14em"
  meta:
    fontFamily: '"Courier Prime",monospace'
    fontSize: "13px"
    fontWeight: 400
  sello:
    fontFamily: '"Archivo Narrow",sans-serif'
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.12em"
rounded:
  ficha: "3px"
  control: "2px"
  sello: "2px"
  perforacion: "50%"
spacing:
  gap-fichas: "18px"
  ficha-x: "18px"
  frente-x: "36px"
  movil-x: "16px"
components:
  ficha:
    backgroundColor: "{colors.carton}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.ficha}"
    padding: "12px 18px 26px"
  ficha-reemplazada:
    backgroundColor: "{colors.carton-gastado}"
    textColor: "{colors.tinta}"
  ficha-faltante:
    backgroundColor: "{colors.carton-faltante}"
    textColor: "{colors.tinta-2}"
  boton-copiar:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.carton}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  boton-copiar-hecho:
    backgroundColor: "{colors.ok}"
    textColor: "{colors.carton}"
  portaetiqueta:
    backgroundColor: "{colors.laton}"
    textColor: "{colors.tinta}"
    padding: "4px"
  buscador:
    backgroundColor: "{colors.carton}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.ficha}"
---

# Design System: Guías locales (Fichero)

## Overview

**Creative North Star: "El fichero de biblioteca"**

Cada guía es un mueble de fichero. El marco (barra lateral, frente del cajón, fondo) es madera oscura teñida; dentro, cada skill, comando o paso es una ficha de cartulina hueso con su signatura mecanografiada, un renglón rojo bajo la cabecera y la perforación de la varilla abajo al centro. Las guías de división de color, con la pestaña asomando a distinta altura del borde derecho, son la navegación. El título del cajón activo va en un portaetiquetas de latón.

El mundo es dueño del marco y respeta la lectura: la columna de lectura (fichas y la hoja de "Empezar") es cartulina clara con tipografía legible y medida real; la máquina de escribir solo aparece en signaturas, comandos y código. Rechaza la documentación genérica de árbol lateral, sans neutra y acento azul.

Cada guía es una edición con su madera propia: verde tinta para BMAD + Claude, tierra roja para Git + S3. Todo lo demás es compartido por el motor `scripts/fichero.mjs`.

**Key Characteristics:**
- Estado expresado por forma, no solo por color: ficha sólida (instalada), esquina doblada (reemplazada), título tachado sobre cartulina más oscura (falta).
- Una banderita roja marca la última ficha usada y su cajón.
- Placeholders `<así>` subrayados en rojo discontinuo; al rellenarlos pasan a subrayado latón continuo.
- Todo autocontenido: tipografías incrustadas, iconos SVG propios, sin red.

## Colors

Madera oscura como marco, cartulina como superficie de lectura, rojo de renglón y latón como únicos acentos.

### Primary
- **Rojo renglón** (#b5412c): renglón bajo la cabecera de cada ficha, estados "reemplazada/falta", placeholders sin rellenar, banderita, caret de los campos.

### Secondary
- **Latón** (#c19a4b) y **Latón claro** (#e2c98a): portaetiquetas, títulos de grupo, anillo de foco, selección de texto, indicadores de estado "ok", placeholders rellenos.

### Neutral
- **Madera BMAD** (#1d2a24 / #26362e / #33463c) y **Madera Git** (#2d1c17 / #3a2620 / #4b322a): fondo, riel, paneles. Se intercambian con `html[data-edicion]`.
- **Cartulina** (#f1ece0): fichas, hoja, buscador, campos. **Cartulina gastada** (#e6dfcf) para reemplazadas, **cartulina faltante** (#d9d3c3) para lo no instalado.
- **Tinta** (#1d1e1b), **tinta 2** (#4a473f), **tinta 3** (#6e695d): texto sobre cartulina, de principal a metadatos.
- **Sobre madera** (#e9e2d0 / #b9b4a2): texto sobre el marco.

### Guías de división
Ocre #d6b162, verde #8fb39a, azul #8fa9c4, salmón #e3957a, lila #b9a3c4, gris #b5b0a3. Solo como fondo de las pestañas del riel, con texto en tinta plena (contraste ≥ 4.5:1).

- **Papel** (#fffdf6) y **filete** (#d6cdb8): fondo y borde de las cajas de comando y código, y de las notas. **Pliegue** (#cfc6b1): el triángulo de la esquina doblada.
- **Aviso** (#e58a74 / #efb3a3): rombo y texto de "hay versión nueva" en la banda de estado, sobre la madera.

### Named Rules
**La regla del renglón.** El rojo pertenece a la ficha (renglón, estado, placeholder, bandera, sello). En el marco solo aparece para una cosa: avisar que hay versión nueva (rombo y texto de la banda de estado, contador "N nuevas" de la pestaña Novedades). Nunca como fondo de áreas grandes.

**La regla de la tinta plena en las guías.** Sobre las pestañas de color el texto es siempre `tinta`; los grises de tinta no alcanzan contraste sobre ellas.

## Typography

**Body Font:** Atkinson Hyperlegible (incrustada como "Atkinson"), con system-ui de respaldo
**Label Font:** Archivo Narrow 600/700
**Mono Font:** Courier Prime 400/700

**Character:** una sans de alta legibilidad para leer, una condensada de rótulo para lo que en un fichero estaría estampado o impreso en la etiqueta, y una máquina de escribir para lo que en una ficha se teclearía.

### Hierarchy
- **Rótulo** (Archivo Narrow 700, 20px, mayúsculas, +0.08em): título del cajón en el portaetiquetas.
- **Título de hoja** (Archivo Narrow 700, 24px): secciones de la hoja "Empezar".
- **Título de ficha** (Atkinson 700, 18px/1.25, `text-wrap: balance`).
- **Body** (Atkinson 400, 16px/1.55; 17px/1.6 en la hoja, máx. 68ch).
- **Signatura** (Courier Prime 700, 19px; 16px si pasa de 11 caracteres).
- **Código y comandos** (Courier Prime 400, 14-15px).
- **Etiqueta de grupo** (Archivo Narrow 700, 14px, mayúsculas, +0.14em, latón).
- **Meta** (Courier Prime 400, 13px): subtítulo de ficha, contadores, clave/valor.
- **Sello** (Archivo Narrow 700, 12px, mayúsculas, +0.12em): sellos "Nueva", "Tu versión", "Actualizar".

### Named Rules
**La regla de la máquina de escribir.** Courier Prime solo para signaturas, comandos, código, placeholders y metadatos clave/valor. Nunca en párrafos ni títulos.

## Layout

Riel fijo de 260px a la izquierda (sticky, alto completo) y frente del cajón sticky arriba con portaetiquetas, banda de estado y buscador a todo el ancho. Las fichas van en rejilla `repeat(auto-fill, minmax(min(var(--min), 100%), 1fr))` con 18px de separación; `--min` es 310px en BMAD y 460px en Git (bloques de código largos). La hoja de lectura tiene máx. 76ch.

Por debajo de 860px: el riel pasa arriba y las guías se vuelven una fila de pestañas desplazable; el frente deja de ser sticky; una columna `minmax(0, 1fr)`; el panel "Tus valores" arranca cerrado; el botón Copiar de los bloques de código sube a su propia fila; márgenes de 16px.

## Elevation & Depth

Profundidad física, no decorativa: las fichas se apoyan sobre la madera con una sombra corta más una difusa. El frente del cajón proyecta una sombra hacia abajo sobre el interior. Los campos y la perforación usan sombra interior.

### Shadow Vocabulary
- **Ficha** (`box-shadow: 0 1px 0 rgba(0,0,0,.25), 0 8px 18px -6px rgba(0,0,0,.45)`): toda ficha y hoja.
- **Frente** (`box-shadow: 0 10px 18px -14px #000`): cabecera sticky.
- **Perforación** (`box-shadow: inset 0 1px 2px #000a`): agujero de la varilla, del color de la madera.
- **Foco de ficha** (`0 0 0 3px` latón claro + sombra de ficha): ficha destino de un enlace.

## Shapes

Esquinas casi rectas como el papel real: 3px en fichas, hoja, buscador y pestañas; 2px en botones y campos. La ficha reemplazada recorta su esquina superior derecha 26px con `clip-path` y dibuja el pliegue con un triángulo. La perforación es un círculo de 11px.

## Components

- **Ficha**: cabecera (signatura + subtítulo + bandera) con renglón rojo de 1.5px a sangre; título; descripción; caja de comando con botón Copiar; metadatos clave/valor; enlaces "antes ←" y "→ sigue"; perforación.
- **Copiar**: botón tinta con icono SVG; al copiar pasa a verde "Copiado" con check durante 1.4s. Copia el texto con los placeholders ya sustituidos.
- **Guía del riel**: pestaña de color con nombre y número de fichas; la activa llega al borde del marco; la banderita marca el cajón de la última ficha usada.
- **Portaetiquetas**: marco latón de 4px con línea interior clara y etiqueta de cartulina.
- **Banda de estado**: puntos llenos latón = ok; rombo salmón = aviso; incluye "Sincronizada" y aviso de antigüedad tras 7 días.
- **Sello de fechador**: rectángulo de borde 1.5px en tinta roja girado −3° ("Nueva", "Actualizar") o verde girado 2° ("Tu versión"), como el sello de devolución de una ficha de préstamo.
- **Ficha de resumen** (Novedades → Tu equipo): herramienta, "Tuya / Última" en Courier 18px, veredicto, y el comando o enlace de actualización para el sistema donde se sincronizó.
- **Ficha de versión**: signatura = número de versión; notas de la fuente con encabezados desde h3; las de más de 14 líneas se pliegan en "Ver notas completas"; las anteriores a la tuya van en cartulina gastada.
- **Ruta**: pasos numerados en círculo rojo unidos por un filete vertical; cada paso es una caja de comando copiable más una línea de explicación.
- **Código copiable**: todo `code` del texto se copia con un clic (cursor de copia, fondo latón al pasar) y muestra el aviso "Copiado" abajo al centro.
- **Buscador**: cartulina, icono lupa, atajo `/`, Esc limpia. Los resultados son copias de las fichas en un cajón temporal.

## Do's and Don'ts

- **Do** dar las variantes por sistema (win32, darwin, linux) en `guide.config.json`; la página muestra la del sistema donde se sincronizó.
- **Do** generar desde datos: si algo puede leerse de la máquina, va en `sync.mjs`, no a mano.
- **Do** mantener la columna de lectura calmada: el mundo vive en el marco, la cabecera de ficha y la forma de los estados.
- **Do** copiar `scripts/fichero.mjs` al otro repo cuando lo cambies; el motor es el mismo.
- **Don't** escalonar las guías por la izquierda: se lee como árbol de carpetas (corregido en la revisión).
- **Don't** usar etiquetas pequeñas sobre títulos (eyebrows), emoji como iconos, ni sombras duras desplazadas.
- **Don't** usar grises de tinta sobre las pestañas de color.

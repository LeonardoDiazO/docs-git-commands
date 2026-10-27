// Motor del "fichero": convierte un objeto de datos en un index.html autocontenido
// (tipografías, estilos y scripts incrustados; abre con doble clic y funciona sin internet).
// Idéntico en docs-bmad-method y docs-git-commands: si lo cambias, cópialo al otro repo (scripts/lib/ completo).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import './marcado.js';
import './novedades.js';

const LIB = dirname(fileURLToPath(import.meta.url));
const { esc, phText, copyBtn, ICON } = globalThis.Marcado;
export const md = globalThis.Marcado.md;
export { esc };
export const Novedades = globalThis.Novedades;

// ---------- Fichas ----------
function card(c, drawer) {
  const state = c.state || 'ok';
  const stateNote = state === 'deprecated'
    ? `<p class="estado">Reemplazada${c.forward ? ` por <a href="#${esc(c.forward)}" data-go="${esc(c.forward)}">${esc(c.forward)}</a>` : ''}</p>`
    : state === 'missing' ? `<p class="estado">${esc(c.missingNote || 'No instalada en este proyecto')}</p>` : '';
  const links = (c.links || []).map(l =>
    `<a class="enlace" href="#${esc(l.id)}" data-go="${esc(l.id)}">${l.dir === 'prev' ? ICON.prev : ''}<span>${esc(l.label)}</span>${l.dir === 'next' ? ICON.next : ''}</a>`).join('');
  const meta = (c.meta || []).filter(m => m[1]).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const cmd = c.cmd ? `<div class="comando"><code>${phText(c.cmd)}</code>${copyBtn()}</div>` : '';
  const search = [c.call, c.title, c.desc, c.cmd, c.search, drawer.label].join(' ').toLowerCase();
  return `<article class="ficha" id="${esc(c.id)}" data-state="${state}" data-drawer="${drawer.id}"${c.os ? ` data-solo-os="${esc(c.os)}"` : ''} data-search="${esc(search)}" tabindex="-1">
  <header><span class="signatura${(c.call || '').length > 11 ? ' larga' : ''}">${esc(c.call || '')}</span><span class="sub">${esc(c.sub || '')}</span><span class="bandera" title="Aquí te quedaste">${ICON.flag}</span></header>
  <h3>${esc(c.title)}</h3>
  ${c.desc ? `<p class="desc">${globalThis.Marcado.inline(c.desc)}</p>` : ''}${stateNote}
  ${cmd}
  ${c.body ? `<div class="cuerpo">${c.body}</div>` : ''}
  ${meta ? `<dl class="meta">${meta}</dl>` : ''}
  ${links ? `<nav class="enlaces">${links}</nav>` : ''}
</article>`;
}

function drawerHtml(d, page) {
  const intro = d.intro ? `<div class="intro">${d.intro}</div>` : '';
  if (d.type === 'sheet') return `<section class="cajon" id="cajon-${d.id}" data-id="${d.id}" hidden><div class="hoja">${d.html}</div></section>`;
  if (d.type === 'novedades') {
    const n = page.novedades;
    return `<section class="cajon" id="cajon-${d.id}" data-id="${d.id}" hidden><div class="novedades-cuerpo">${globalThis.Novedades.render(globalThis.Novedades.toolsFor(n, n.syncOs), n.snapshot.data, { fetchedAt: n.snapshot.fetchedAt, live: false })}</div></section>`;
  }
  const groups = d.groups || [{ cards: d.cards || [] }];
  const body = groups.map(g => `${g.label ? `<h2 class="grupo">${esc(g.label)}</h2>` : ''}<div class="fichas">${g.cards.map(c => card(c, d)).join('')}</div>`).join('');
  return `<section class="cajon" id="cajon-${d.id}" data-id="${d.id}" hidden>${intro}${body}${d.after || ''}</section>`;
}

const font = (dir, file) => readFileSync(join(dir, file)).toString('base64');
const libSrc = f => readFileSync(join(LIB, f), 'utf8');

export function render(page) {
  const fd = page.fontsDir;
  const faces = [
    ['Atkinson', 400, 'atkinson-hyperlegible-latin-400-normal.woff2'],
    ['Atkinson', 700, 'atkinson-hyperlegible-latin-700-normal.woff2'],
    ['Courier Prime', 400, 'courier-prime-latin-400-normal.woff2'],
    ['Courier Prime', 700, 'courier-prime-latin-700-normal.woff2'],
    ['Archivo Narrow', 600, 'archivo-narrow-latin-600-normal.woff2'],
    ['Archivo Narrow', 700, 'archivo-narrow-latin-700-normal.woff2'],
  ].map(([f, w, file]) => `@font-face{font-family:"${f}";font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${font(fd, file)}) format("woff2")}`).join('\n');

  const tabs = page.drawers.map((d, i) =>
    `<a class="guia" href="#${d.id}" data-tab="${d.id}" style="--tab:${d.color};--pos:${i % 4}"><span class="pestana">${esc(d.short || d.label)}</span><span class="cuenta">${d.count ?? ''}</span></a>`).join('');

  const status = page.status.map(s =>
    `<li data-state="${s.state || 'info'}"${s.tool ? ` data-tool="${esc(s.tool)}"` : ''}><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span><span class="h">${esc(s.hint || '')}</span></li>`).join('');

  const ph = page.placeholders?.length ? `<details class="rellenar"><summary>Tus valores</summary><p>Se sustituyen en todos los comandos y frases.</p>${page.placeholders
    .map(p => `<label><span>&lt;${esc(p.token)}&gt;</span><input data-fill="${esc(p.token)}" placeholder="${esc(p.example || '')}" spellcheck="false" autocomplete="off"></label>`).join('')}<button type="button" class="limpiar">Borrar valores</button></details>` : '';

  // Novedades: configuración completa (con variantes por sistema) + lo instalado en el sistema donde se sincronizó.
  const nov = page.novedades || null;
  const syncOs = page.syncOs || 'win32';
  const osPicker = `<li class="sistema" data-state="info"><label><span class="k">Sistema</span><select id="sistema" aria-label="Sistema operativo para los comandos">${
    Object.entries(globalThis.Novedades.OS_NAME).map(([k, v]) => `<option value="${k}"${k === syncOs ? ' selected' : ''}>${v}</option>`).join('')}</select></label><span class="h"></span></li>`;

  return `<!doctype html>
<html lang="es" data-edicion="${page.edition}" data-os="${syncOs}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="generator" content="fichero.mjs · ${esc(page.generatedAt)}">
<style>
${faces}
${CSS}
</style>
</head>
<body>
<div class="mueble">
  <aside class="riel" aria-label="Cajones">
    <div class="rotulo"><span class="titulo">${esc(page.title)}</span></div>
    <nav class="guias">${tabs}</nav>
    ${ph}
    <p class="pie">Generado ${esc(page.generatedHuman)}<br><code>${esc(page.syncCmd)}</code> para actualizar</p>
  </aside>
  <main>
    <header class="frente">
      <div class="portaetiqueta"><h1 id="titulo-cajon">${esc(page.drawers[0].label)}</h1></div>
      <ul class="estado-barra" aria-label="Estado">${osPicker}${status}<li data-state="info" class="antiguedad" hidden><span class="k">Inventario</span><span class="v"></span><span class="h">Ejecuta ${esc(page.syncCmd)}</span></li></ul>
      <label class="buscador">${ICON.search}<input type="search" id="buscar" placeholder="${esc(page.searchHint)}" data-corto="${esc(page.searchHintShort || page.searchHint)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>
    </header>
    <div class="interior" style="--min:${page.cardMin || 310}px">
      ${page.drawers.map(d => drawerHtml(d, page)).join('\n')}
      <section class="cajon" id="cajon-resultados" data-id="resultados" hidden><p class="intro sin" hidden>Ninguna ficha coincide. Prueba con el código (por ejemplo <code>${esc(page.searchExample)}</code>) o una palabra en inglés.</p></section>
    </div>
  </main>
</div>
<div class="aviso" role="status" aria-live="polite"></div>
<script>
window.FICHERO=${JSON.stringify({ key: page.storeKey, generatedAt: page.generatedAt, staleDays: page.staleDays || 7, first: page.drawers[0].id, syncOs, novedades: nov }).replace(/</g, '\\u003c')};
${libSrc('marcado.js')}
${libSrc('novedades.js')}
${JS}
</script>
</body>
</html>`;
}

const CSS = String.raw`
:root{
  --madera:#1d2a24; --madera-2:#26362e; --madera-3:#33463c; --veta:#3f5549;
  --carton:#f1ece0; --carton-2:#e6dfcf; --tinta:#1d1e1b; --tinta-2:#4a473f; --tinta-3:#6e695d;
  --rojo:#b5412c; --laton:#c19a4b; --laton-claro:#e2c98a;
  --sobre-madera:#e9e2d0; --sobre-madera-2:#b9b4a2;
  --ok:#3f7d5e; --aviso:#e58a74; --aviso-texto:#efb3a3;
  --papel:#fffdf6; --filete:#d6cdb8; --pliegue:#cfc6b1; --faltante:#d9d3c3; --brillo:#ffffff88; --junta:#00000033;
  --sombra:0 1px 0 rgba(0,0,0,.25),0 8px 18px -6px rgba(0,0,0,.45);
  --t-rapida:180ms; --curva:cubic-bezier(.16,1,.3,1);
}
html[data-edicion="git"]{ --madera:#2d1c17; --madera-2:#3a2620; --madera-3:#4b322a; --veta:#5a3d33; }
*{box-sizing:border-box}
[hidden]{display:none!important}
html{color-scheme:dark;scrollbar-color:var(--veta) var(--madera)}
body{margin:0;background:var(--madera);color:var(--sobre-madera);font:400 16px/1.55 "Atkinson",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
::selection{background:var(--laton-claro);color:var(--tinta)}
:focus-visible{outline:2px solid var(--laton-claro);outline-offset:2px;border-radius:2px}
a{color:inherit;text-underline-offset:3px}
code,kbd,pre{font-family:"Courier Prime",ui-monospace,monospace}
.mueble{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100vh}

/* ---- riel de guías ---- */
.riel{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:24px 0 20px 18px;background:var(--madera-2);border-right:1px solid var(--junta);display:flex;flex-direction:column;gap:22px}
.rotulo{padding-right:18px}
.rotulo .titulo{display:block;font:700 22px/1.1 "Archivo Narrow",sans-serif;color:var(--sobre-madera);text-wrap:balance}
.guias{display:flex;flex-direction:column;gap:3px}
.guia{--pos:0;position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-right:calc(var(--pos)*11px + 14px);padding:9px 14px 9px 12px;background:var(--tab);color:var(--tinta);text-decoration:none;border-radius:3px;font:600 15px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.02em;box-shadow:0 1px 0 #0004;transition:margin var(--t-rapida) var(--curva)}
.guia:hover{margin-right:calc(var(--pos)*11px + 8px)}
.guia[aria-current="true"]{margin-right:-1px;border-radius:3px 0 0 3px;box-shadow:0 2px 0 #0005,0 6px 14px -6px #000a}
.guia .cuenta{font:700 13px/1 "Courier Prime",monospace;color:var(--tinta)}
.guia .cuenta[data-nuevas]{padding:2px 6px;background:var(--rojo);color:var(--carton);border-radius:2px}
.guia.con-bandera .pestana::after{content:"";display:inline-block;width:7px;height:7px;margin-left:7px;background:var(--rojo);clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%)}
.rellenar{margin-right:18px;padding:14px;background:var(--madera-3);border-radius:3px;font-size:14px}
.rellenar summary{cursor:pointer;font:700 13px/1 "Archivo Narrow",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--laton-claro)}
.rellenar p{margin:8px 0 10px;color:var(--sobre-madera-2)}
.rellenar label{display:grid;gap:3px;margin-bottom:9px}
.rellenar label span{font:400 13px/1 "Courier Prime",monospace;color:var(--sobre-madera-2)}
.rellenar input{width:100%;padding:7px 8px;background:var(--carton);color:var(--tinta);border:0;border-radius:2px;font:400 14px "Courier Prime",monospace;caret-color:var(--rojo)}
.rellenar input::placeholder{color:var(--tinta-3)}
.limpiar{background:none;border:0;padding:0;color:var(--sobre-madera-2);font:inherit;text-decoration:underline;cursor:pointer}
.pie{margin:auto 18px 0 0;font-size:13px;color:var(--sobre-madera-2)}
.pie code{color:var(--laton-claro)}

/* ---- frente del cajón ---- */
main{min-width:0}
.frente{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:auto 1fr;gap:14px 24px;align-items:center;padding:22px 36px 18px;background:var(--madera);border-bottom:1px solid #0004;box-shadow:0 10px 18px -14px #000}
.portaetiqueta{padding:4px;background:var(--laton);border-radius:3px;box-shadow:inset 0 0 0 1px var(--laton-claro),0 2px 0 #0006}
.portaetiqueta h1{margin:0;padding:6px 18px 5px;background:var(--carton);color:var(--tinta);font:700 20px/1.1 "Archivo Narrow",sans-serif;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;min-width:12ch;text-align:center}
.estado-barra{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0;padding:0;list-style:none;font-size:14px}
.estado-barra li{display:flex;align-items:baseline;gap:6px}
.estado-barra li::before{content:"";align-self:center;width:9px;height:9px;flex:none;border:1.5px solid var(--sobre-madera-2);border-radius:50%}
.estado-barra li[data-state="ok"]::before{background:var(--laton-claro);border-color:var(--laton-claro)}
.estado-barra li[data-state="warn"]::before{border-radius:0;transform:rotate(45deg);border-color:var(--aviso);background:var(--aviso)}
.estado-barra .k{color:var(--sobre-madera-2)}
.estado-barra .v{font-weight:700}
.estado-barra .h{color:var(--aviso-texto)}
.estado-barra .h:empty{display:none}
.estado-barra li[data-state="ok"] .h{color:var(--laton-claro)}
.sistema label{display:flex;align-items:baseline;gap:6px}
.sistema select{padding:1px 22px 1px 6px;background:var(--madera-3) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23e2c98a' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 6px center/10px;color:var(--sobre-madera);border:1px solid var(--veta);border-radius:2px;font:700 14px "Atkinson",sans-serif;appearance:none;cursor:pointer}
.sistema select:focus-visible{outline:2px solid var(--laton-claro)}
.sistema option{background:var(--madera-2);color:var(--sobre-madera)}
html[data-os="win32"] [data-solo-os]:not([data-solo-os~="win32"]),
html[data-os="darwin"] [data-solo-os]:not([data-solo-os~="darwin"]),
html[data-os="linux"] [data-solo-os]:not([data-solo-os~="linux"]){display:none}
.buscador{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:inset 0 1px 0 var(--brillo)}
.buscador svg{width:18px;height:18px;flex:none;fill:none;stroke:var(--tinta-3);stroke-width:1.6}
.buscador input{flex:1;min-width:0;padding:12px 0;background:none;border:0;outline:0;color:var(--tinta);font:400 17px "Atkinson",sans-serif;caret-color:var(--rojo)}
.buscador input::placeholder{color:var(--tinta-3)}
.buscador kbd{padding:1px 7px;border:1px solid var(--tinta-3);border-radius:3px;color:var(--tinta-3);font-size:13px}
.buscador:focus-within{box-shadow:0 0 0 2px var(--laton-claro)}

/* ---- interior: fichas ---- */
.interior{padding:26px 36px 80px}
.cajon[data-entrando]{animation:sacar 300ms var(--curva)}
@keyframes sacar{from{transform:translateY(-10px);opacity:.4}to{transform:none;opacity:1}}
.intro{max-width:72ch;margin:0 0 22px;color:var(--sobre-madera);font-size:16px}
.intro p{margin:0 0 10px}
.intro code{padding:0 4px;border-radius:2px;background:#ffffff14;color:var(--laton-claro)}
.hoja code,.desc code,.cuerpo p code,.notas code,.ruta p code{padding:0 4px;border-radius:2px;background:#0000000f;font-size:.95em}
code.copiable{cursor:copy;overflow-wrap:anywhere;transition:background var(--t-rapida)}
.hoja .comando code,.ruta .comando code{padding:3px 0 0;background:none}
code.copiable:hover{background:var(--laton-claro);color:var(--tinta)}
.grupo{margin:34px 0 14px;font:700 14px/1 "Archivo Narrow",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--laton)}
.grupo:first-child,.intro+.grupo{margin-top:0}
.fichas{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(var(--min),100%),1fr));gap:18px;align-items:start}
.fichas.lista{grid-template-columns:minmax(0,82ch)}
.fichas.resumenes{grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))}
.ficha{position:relative;min-width:0;display:flex;flex-direction:column;gap:6px;min-height:200px;padding:12px 18px 26px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);scroll-margin-top:190px}
.ficha::after{content:"";position:absolute;left:50%;bottom:8px;width:11px;height:11px;margin-left:-5.5px;border-radius:50%;background:var(--madera);box-shadow:inset 0 1px 2px #000a}
.ficha header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;margin:0 -18px;padding:2px 18px 10px;border-bottom:1.5px solid var(--rojo)}
.signatura{font:700 19px/1 "Courier Prime",monospace;letter-spacing:.04em}
.signatura.larga{font-size:16px;letter-spacing:0;overflow-wrap:anywhere}
.sub{flex:0 1 auto;min-width:0;font:400 13px/1.3 "Courier Prime",monospace;color:var(--tinta-3)}
.bandera{display:none;margin-left:auto;color:var(--rojo)}
.bandera svg{width:16px;height:16px;fill:currentColor;stroke:currentColor;stroke-width:1.2}
.ficha.aqui .bandera{display:block}
.ficha h3{margin:8px 0 0;font:700 18px/1.25 "Atkinson",sans-serif;text-wrap:balance}
.desc{margin:0;color:var(--tinta-2);font-size:15px;line-height:1.5}
.estado{margin:0;font:400 14px "Courier Prime",monospace;color:var(--rojo)}
.estado a{color:inherit;font-weight:700}
.ficha[data-state="deprecated"]{background-color:var(--carton-2);clip-path:polygon(0 0,calc(100% - 26px) 0,100% 26px,100% 100%,0 100%)}
.ficha[data-state="deprecated"]::before{content:"";position:absolute;top:0;right:0;width:26px;height:26px;background:linear-gradient(225deg,transparent 50%,var(--pliegue) 50%);box-shadow:-2px 2px 3px #0002}
.ficha[data-state="missing"]{background-color:var(--faltante)}
.ficha[data-state="missing"] h3{text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:var(--rojo);color:var(--tinta-2)}
.ficha[data-state="missing"] .signatura{color:var(--tinta-3)}
.comando,.codigo{position:relative;display:flex;align-items:flex-start;gap:8px;margin-top:6px;padding:7px 8px 7px 10px;background:var(--papel);border:1px solid var(--filete);border-radius:2px}
.comando code{flex:1;min-width:0;padding-top:3px;font-size:15px;overflow-wrap:anywhere}
.codigo pre{flex:1;min-width:0;margin:0;overflow-x:auto;font-size:14px;line-height:1.5;padding:3px 0}
.codigo .c{color:var(--tinta-3)}
.ph{border-bottom:1.5px dashed var(--rojo);color:var(--rojo)}
.ph.lleno{border-bottom-style:solid;color:inherit;border-bottom-color:var(--laton)}
.copiar{flex:none;display:inline-flex;align-items:center;gap:5px;padding:4px 8px;background:var(--tinta);color:var(--carton);border:0;border-radius:2px;font:600 13px/1 "Archivo Narrow",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:background var(--t-rapida)}
.copiar:hover{background:var(--madera-3)}
.copiar svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6}
.copiar svg:nth-child(2){display:none}
.copiar.hecho{background:var(--ok)}
.copiar.hecho svg:first-child{display:none}.copiar.hecho svg:nth-child(2){display:block}
.cuerpo{font-size:15px;color:var(--tinta-2)}
.cuerpo p{margin:6px 0}
.cuerpo .codigo{margin:6px 0}
.meta{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;margin:6px 0 0;font-size:13px}
.meta div{display:contents}
.meta dt{color:var(--tinta-3);font-family:"Courier Prime",monospace}
.meta dd{margin:0;color:var(--tinta-2)}
.enlaces{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px}
.enlace{display:inline-flex;align-items:center;gap:4px;font:400 14px "Courier Prime",monospace;color:var(--tinta-2)}
.enlace svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6}
.enlace:hover{color:var(--rojo)}
.ficha:target,.ficha.foco{box-shadow:0 0 0 3px var(--laton-claro),var(--sombra)}
mark{background:#e2c98a99;color:inherit;border-radius:2px}

/* ---- sello de fechador: lo nuevo frente a lo tuyo ---- */
.sello{margin-left:auto;padding:3px 7px 2px;border:1.5px solid currentColor;border-radius:2px;font:700 12px/1 "Archivo Narrow",sans-serif;letter-spacing:.12em;text-transform:uppercase;transform:rotate(-3deg);color:var(--rojo)}
.sello[data-rel="tuya"]{color:var(--ok);transform:rotate(2deg)}
.ficha.version{min-height:0}
.ficha.version[data-rel="anterior"]{background-color:var(--carton-2)}
.notas{font-size:15px;color:var(--tinta-2);line-height:1.55;overflow-wrap:anywhere}
.notas h4,.notas h5,.notas h6{margin:12px 0 4px;font:700 13px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--tinta-3)}
.notas ul,.notas ol{margin:4px 0;padding-left:1.2em}
.notas li{margin:3px 0}
.notas p{margin:6px 0}
.notas a{color:var(--rojo)}
.mas summary{cursor:pointer;margin-top:6px;font:400 14px "Courier Prime",monospace;color:var(--rojo)}
.ficha.resumen{min-height:0}
.versiones{display:grid;gap:6px;margin:10px 0 0}
.versiones div{display:grid;grid-template-columns:7ch 1fr;align-items:baseline;gap:8px}
.versiones dt{font:700 12px/1 "Archivo Narrow",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--tinta-3)}
.versiones dd{margin:0;font:700 18px/1.2 "Courier Prime",monospace}
.ficha.resumen[data-rel="nueva"] .versiones div:last-child dd{color:var(--rojo)}
.veredicto{margin:4px 0 0;font-weight:700}

/* ---- hoja de lectura y rutas ---- */
.hoja{max-width:80ch;padding:34px 46px 40px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);font-size:17px;line-height:1.6}
.hoja h2{margin:34px 0 10px;font:700 24px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.01em;text-wrap:balance}
.hoja h2:first-child{margin-top:0}
.hoja h3{margin:24px 0 6px;font:700 18px/1.3 "Atkinson",sans-serif}
.hoja p,.hoja li{max-width:68ch}
.hoja a{color:var(--rojo)}
.hoja ol,.hoja ul{padding-left:1.3em}
.hoja li{margin:4px 0}
.ruta{margin:18px 0 26px}
.ruta h3{margin:0 0 10px}
.ruta ol{list-style:none;margin:0;padding:0;counter-reset:paso;display:grid;gap:10px}
.ruta li{position:relative;counter-increment:paso;margin:0;padding-left:40px;max-width:none}
.ruta li::before{content:counter(paso);position:absolute;left:0;top:6px;width:26px;height:26px;display:grid;place-items:center;border:1.5px solid var(--rojo);border-radius:50%;font:700 14px/1 "Courier Prime",monospace;color:var(--rojo);background:var(--carton)}
.ruta li:not(:last-child)::after{content:"";position:absolute;left:13px;top:34px;bottom:-12px;width:1.5px;background:var(--filete)}
.ruta .comando{margin:0;max-width:52ch}
.ruta p{margin:4px 0 0;font-size:15px;color:var(--tinta-2)}
.nota{margin:16px 0;padding:12px 16px;background:var(--papel);border:1px solid var(--filete);border-radius:2px}
.nota p{margin:4px 0}
.tabla{overflow-x:auto;margin:14px 0}
table{border-collapse:collapse;width:100%;font-size:15px}
th,td{padding:7px 10px;text-align:left;vertical-align:top;border-bottom:1px solid var(--filete)}
th{font:700 13px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--tinta-3)}
td{font-variant-numeric:tabular-nums}
.cajon>.intro .tabla,.cajon>.tabla{background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);padding:6px 14px}
.cajon>.intro .tabla td:first-child{font-family:"Courier Prime",monospace}
td[data-state="warn"]{color:var(--rojo);font-weight:700}

/* ---- aviso de copiado ---- */
.aviso{position:fixed;left:50%;bottom:24px;z-index:20;padding:8px 14px;background:var(--tinta);color:var(--carton);border-radius:3px;max-width:calc(100vw - 32px);overflow-wrap:anywhere;font:400 14px "Courier Prime",monospace;box-shadow:var(--sombra);transform:translate(-50%,12px);opacity:0;pointer-events:none;transition:opacity var(--t-rapida),transform var(--t-rapida) var(--curva)}
.aviso.ver{opacity:1;transform:translate(-50%,0)}

@media (max-width:860px){
  .mueble{grid-template-columns:1fr}
  .riel{position:static;height:auto;padding:16px;gap:12px}
  .guias{flex-direction:row;overflow-x:auto;gap:4px;padding-bottom:4px;margin-right:-16px}
  .guia,.guia:hover{margin-right:0;margin-top:calc(var(--pos)*4px);flex:none;border-radius:3px 3px 0 0}
  .guia[aria-current="true"]{margin-right:0;margin-top:-4px;border-radius:3px 3px 0 0}
  .rellenar{margin-right:0}
  .pie{display:none}
  .frente{position:static;padding:16px;grid-template-columns:1fr}
  .interior{padding:18px 16px 60px}
  .fichas,.fichas.lista,.fichas.resumenes{grid-template-columns:minmax(0,1fr)}
  .codigo{flex-wrap:wrap}
  .codigo .copiar{order:-1;margin-left:auto}
  .codigo pre{flex-basis:100%}
  .hoja{padding:22px 18px}
  .ruta li{padding-left:36px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const JS = String.raw`
(function(){
  var F=window.FICHERO, $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(F.key+':'+k));localStorage.setItem(F.key+':'+k,JSON.stringify(v))}catch(e){return null}}
  var drawers=$$('.cajon'), tabs=$$('.guia'), title=$('#titulo-cajon'), q=$('#buscar'), results=$('#cajon-resultados'), aviso=$('.aviso');
  var narrow=window.matchMedia('(max-width:860px)').matches;

  function show(id,focusCard){
    var d=document.getElementById('cajon-'+id); if(!d) return;
    drawers.forEach(function(x){x.hidden=x!==d});
    tabs.forEach(function(t){t.setAttribute('aria-current',t.dataset.tab===id?'true':'false')});
    var tab=tabs.filter(function(t){return t.dataset.tab===id})[0];
    title.textContent=tab?tab.querySelector('.pestana').textContent:'Resultados';
    d.setAttribute('data-entrando','');setTimeout(function(){d.removeAttribute('data-entrando')},320);
    if(id!=='resultados') store('cajon',id);
    if(focusCard){var c=document.getElementById(focusCard); if(c){c.classList.add('foco');c.scrollIntoView({block:'center'});setTimeout(function(){c.classList.remove('foco')},1600)}}
    else window.scrollTo(0,0);
  }
  function route(){
    var h=decodeURIComponent(location.hash.slice(1));
    if(!h){show(store('cajon')||F.first);return}
    if(document.getElementById('cajon-'+h)){show(h);return}
    var c=document.getElementById(h);
    if(c&&c.classList.contains('ficha')){if(q.value){q.value='';search()}show(c.dataset.drawer,h)}
  }
  window.addEventListener('hashchange',route);

  // Bandera: última ficha con la que interactuaste
  function flag(card){
    $$('.ficha.aqui').forEach(function(x){x.classList.remove('aqui')});
    tabs.forEach(function(t){t.classList.remove('con-bandera')});
    if(card&&card.dataset.ref) card=document.getElementById(card.dataset.ref);
    if(!card||!card.id) return;
    card.classList.add('aqui');
    var t=tabs.filter(function(t){return t.dataset.tab===card.dataset.drawer})[0]; if(t) t.classList.add('con-bandera');
    store('ficha',card.id);
  }
  document.addEventListener('click',function(e){var c=e.target.closest('.ficha'); if(c&&!e.target.closest('[data-go],a')) flag(c)});

  // Copiar: botones y cualquier fragmento de código del texto
  var avisoT;
  function notify(msg){aviso.innerHTML='';var k=document.createElement('strong');k.textContent='Copiado ';k.style.fontFamily='"Archivo Narrow",sans-serif';aviso.appendChild(k);aviso.appendChild(document.createTextNode(msg));aviso.classList.add('ver');clearTimeout(avisoT);avisoT=setTimeout(function(){aviso.classList.remove('ver')},1300)}
  function copy(text,done){
    text=text.replace(/ /g,' ');
    function fallback(){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(_){}t.remove()}
    if(navigator.clipboard&&window.isSecureContext!==false){navigator.clipboard.writeText(text).then(done,fallback)}else fallback();
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copiar');
    if(b){
      var code=b.parentElement.querySelector('code');
      copy(code.innerText,function(){b.classList.add('hecho');b.querySelector('span').textContent='Copiado';setTimeout(function(){b.classList.remove('hecho');b.querySelector('span').textContent='Copiar'},1400)});
      return;
    }
    var c=e.target.closest('code.copiable');
    if(c&&!window.getSelection().toString()) copy(c.innerText,function(){notify(c.innerText.length>60?c.innerText.slice(0,60)+'…':c.innerText)});
  });

  document.addEventListener('keydown',function(e){
    var c=e.target.closest&&e.target.closest('code.copiable');
    if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();copy(c.innerText,function(){notify(c.innerText.length>60?c.innerText.slice(0,60)+'…':c.innerText)})}
  });

  // Placeholders rellenables
  var fills=$$('[data-fill]');
  function applyFills(){
    var vals={}; fills.forEach(function(i){vals[i.dataset.fill]=i.value.trim()});
    $$('.ph').forEach(function(s){var v=vals[s.dataset.ph]; s.textContent=v?v:'<'+s.dataset.ph+'>'; s.classList.toggle('lleno',!!v)});
    store('valores',vals);
  }
  if(fills.length){
    var panel=$('.rellenar'); if(panel&&!narrow) panel.open=true;
    var saved=store('valores')||{}; fills.forEach(function(i){i.value=saved[i.dataset.fill]||''; i.addEventListener('input',applyFills)});
    applyFills();
    var clr=$('.limpiar'); if(clr) clr.addEventListener('click',function(){fills.forEach(function(i){i.value=''});applyFills()});
  }

  // Búsqueda en todos los cajones; los resultados son copias, las fichas originales no se mueven
  var before=null;
  function search(){
    var term=q.value.trim().toLowerCase();
    $$('.fichas',results).forEach(function(x){x.remove()});
    if(!term){ if(before){show(before);before=null} return }
    if(!before){var cur=drawers.filter(function(d){return !d.hidden})[0]; before=cur&&cur.dataset.id!=='resultados'?cur.dataset.id:store('cajon')}
    var words=term.split(/\s+/), grid=document.createElement('div'), n=0;
    grid.className='fichas'; results.appendChild(grid);
    $$('.cajon:not(#cajon-resultados) .ficha').forEach(function(c){
      if(!words.every(function(w){return (c.dataset.search||'').indexOf(w)>-1})) return;
      var k=c.cloneNode(true); k.dataset.ref=c.id; k.removeAttribute('id'); grid.appendChild(k); n++;
    });
    if(fills.length) applyFills();
    $('.sin',results).hidden=n>0;
    show('resultados'); title.textContent=n+(n===1?' ficha':' fichas');
  }
  if(narrow) q.placeholder=q.dataset.corto;
  q.addEventListener('input',search);
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();q.focus()}
    if(e.key==='Escape'&&document.activeElement===q){q.value='';search();q.blur()}
  });

  // Antigüedad del inventario local (lo instalado solo se lee al sincronizar)
  var days=Math.floor((Date.now()-new Date(F.generatedAt).getTime())/864e5), ant=$('.antiguedad');
  if(ant&&days>=F.staleDays){ant.hidden=false;ant.dataset.state='warn';ant.querySelector('.v').textContent='hace '+days+' días'}

  // Sistema operativo: se detecta el de quien mira la página (o el elegido a mano) y decide qué comandos
  // y fichas se muestran. Lo instalado solo se conoce para el sistema donde se sincronizó.
  var NV=window.Novedades, osSel=$('#sistema'), detected=NV.detectOs(navigator), os=store('os')||detected||F.syncOs;
  function paintStatus(tools,data){
    tools.forEach(function(t){
      var li=$('.estado-barra [data-tool="'+t.id+'"]'), d=data&&data[t.id]; if(!li) return;
      li.hidden=t.unknown; if(t.unknown||!d||!d.latest) return;
      var newer=t.installed&&NV.cmp(d.latest,t.installed)>0;
      li.dataset.state=newer?'warn':'ok'; li.querySelector('.h').textContent=newer?'última '+d.latest:'al día';
    });
  }
  function paintNews(tools,data,meta){
    var box=$('.novedades-cuerpo'); if(box) box.innerHTML=NV.render(tools,data,meta);
    var nuevas=NV.counts(tools,data), tab=tabs.filter(function(t){return t.dataset.tab==='novedades'})[0];
    if(tab){var ct=tab.querySelector('.cuenta'); ct.textContent=nuevas?nuevas+(nuevas===1?' nueva':' nuevas'):tools[0]&&tools[0].unknown?'ver':'al día'; if(nuevas) ct.setAttribute('data-nuevas',''); else ct.removeAttribute('data-nuevas')}
    paintStatus(tools,data);
    if(fills.length) applyFills();
  }
  function loadNews(){
    var N=F.novedades; if(!N) return;
    var tools=NV.toolsFor(N,os), same=os===F.syncOs;
    current=tools; // si cambias de sistema antes de que responda la consulta, se descarta la respuesta vieja
    if(same) paintNews(tools,N.snapshot.data,{fetchedAt:N.snapshot.fetchedAt,live:false});
    var cache=store('novedades:'+os);
    if(cache&&Date.now()-new Date(cache.fetchedAt).getTime()<36e5){paintNews(tools,cache.data,{fetchedAt:cache.fetchedAt,live:true});return}
    if(!same) paintNews(tools,{},{});
    if(!window.fetch) return;
    NV.fetchAll(tools,function(u,o){return fetch(u,o)}).then(function(data){
      var ok=Object.keys(data).some(function(k){return data[k]&&data[k].latest}); if(!ok) return;
      if(same) Object.keys(data).forEach(function(k){if(data[k].error&&N.snapshot.data[k]) data[k]=N.snapshot.data[k]});
      var at=new Date().toISOString(); store('novedades:'+os,{fetchedAt:at,data:data});
      if(tools===current) paintNews(tools,data,{fetchedAt:at,live:true});
    }).catch(function(){});
  }
  var current=null;
  function setOs(v,manual){
    os=v; document.documentElement.dataset.os=v; if(osSel) osSel.value=v;
    if(manual) store('os',v===detected?null:v);
    var h=$('.sistema .h'); if(h) h.textContent=v===detected?'detectado':'elegido a mano';
    loadNews();
    if(q.value) search();
  }
  if(osSel) osSel.addEventListener('change',function(){setOs(osSel.value,true)});
  setOs(os,false);

  route();
  var last=store('ficha'); if(last) flag(document.getElementById(last));
})();
`;

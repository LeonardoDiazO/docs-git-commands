// Motor del "fichero": convierte un objeto de datos en un index.html autocontenido
// (tipografías, estilos y scripts incrustados, abre con doble clic y sin internet).
// Compartido entre docs-bmad-method y docs-git-commands: si lo cambias, cópialo al otro repo.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Markdown mínimo (párrafos, títulos, listas, tablas, código, citas) ----------
function inline(s) {
  // El código se aparta primero para que **negrita con `código`** funcione.
  const codes = [];
  const marked = String(s).replace(/`([^`]+)`/g, (_, c) => `@@${codes.push(c) - 1}@@`);
  return esc(marked)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\(#([^)\s]+)\)/g, '<a href="#$2">$1</a>')
    .replace(/@@(\d+)@@/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}

export function md(src = '') {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(codeBlock(buf.join('\n')));
      continue;
    }
    if (/^#{2,4} /.test(l)) {
      const lvl = l.match(/^#+/)[0].length;
      out.push(`<h${lvl}>${inline(l.replace(/^#+ /, ''))}</h${lvl}>`);
      i++;
      continue;
    }
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|[\s:|-]+\|$/.test(r));
      const [head, ...rest] = body;
      out.push(`<div class="tabla"><table><thead><tr>${cells(head).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest
        .map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.) /.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.) /, ''));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (/^> /.test(l)) {
      const buf = [];
      while (i < lines.length && /^> ?/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, ''));
      out.push(`<aside class="nota">${md(buf.join('\n'))}</aside>`);
      continue;
    }
    if (/^(---|\s*)$/.test(l)) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{2,4} |\||> |\s*([-*]|\d+\.) )/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// Placeholders <como-este> se vuelven spans rellenables desde el panel lateral.
export function phText(code) {
  return esc(code).replace(/&lt;([a-z][a-z0-9-]*)&gt;/gi, (_, t) => `<span class="ph" data-ph="${t}">&lt;${t}&gt;</span>`);
}

export function codeBlock(code) {
  const html = phText(code).replace(/^(\s*#.*)$/gm, '<span class="c">$1</span>');
  return `<div class="codigo"><pre><code>${html}</code></pre>${copyBtn()}</div>`;
}

const ICON = {
  copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
  search: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"/></svg>',
  prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H4M7.5 4.5L4 8l3.5 3.5"/></svg>',
  flag: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2.5h8l-2 3 2 3H4"/></svg>',
};
export const icon = n => ICON[n];
const copyBtn = (label = 'Copiar') =>
  `<button class="copiar" type="button" aria-label="${label}">${ICON.copy}${ICON.check}<span>${label}</span></button>`;

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
  return `<article class="ficha" id="${esc(c.id)}" data-state="${state}" data-drawer="${drawer.id}" data-search="${esc(search)}" tabindex="-1">
  <header><span class="signatura${(c.call || '').length > 11 ? ' larga' : ''}">${esc(c.call || '')}</span><span class="sub">${esc(c.sub || '')}</span><span class="bandera" title="Aquí te quedaste">${ICON.flag}</span></header>
  <h3>${esc(c.title)}</h3>
  ${c.desc ? `<p class="desc">${esc(c.desc)}</p>` : ''}${stateNote}
  ${cmd}
  ${c.body ? `<div class="cuerpo">${c.body}</div>` : ''}
  ${meta ? `<dl class="meta">${meta}</dl>` : ''}
  ${links ? `<nav class="enlaces">${links}</nav>` : ''}
</article>`;
}

function drawerHtml(d) {
  const intro = d.intro ? `<div class="intro">${d.intro}</div>` : '';
  if (d.type === 'sheet') return `<section class="cajon" id="cajon-${d.id}" data-id="${d.id}" hidden><div class="hoja">${d.html}</div></section>`;
  const groups = d.groups || [{ cards: d.cards || [] }];
  const body = groups.map(g => `${g.label ? `<h2 class="grupo">${esc(g.label)}</h2>` : ''}<div class="fichas">${g.cards.map(c => card(c, d)).join('')}</div>`).join('');
  return `<section class="cajon" id="cajon-${d.id}" data-id="${d.id}" hidden>${intro}${body}${d.after || ''}</section>`;
}

const font = (dir, file) => readFileSync(join(dir, file)).toString('base64');

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
    `<li data-state="${s.state || 'info'}"><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span>${s.hint ? `<span class="h">${esc(s.hint)}</span>` : ''}</li>`).join('');

  const ph = page.placeholders?.length ? `<details class="rellenar"><summary>Tus valores</summary><p>Se sustituyen en todos los comandos.</p>${page.placeholders
    .map(p => `<label><span>&lt;${esc(p.token)}&gt;</span><input data-fill="${esc(p.token)}" placeholder="${esc(p.example || '')}" spellcheck="false" autocomplete="off"></label>`).join('')}<button type="button" class="limpiar">Borrar valores</button></details>` : '';

  return `<!doctype html>
<html lang="es" data-edicion="${page.edition}">
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
      <ul class="estado-barra" aria-label="Estado de la instalación">${status}<li data-state="info" class="antiguedad" hidden><span class="k">Guía</span><span class="v"></span><span class="h">Ejecuta ${esc(page.syncCmd)}</span></li></ul>
      <label class="buscador">${ICON.search}<input type="search" id="buscar" placeholder="${esc(page.searchHint)}" data-corto="${esc(page.searchHintShort || page.searchHint)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>
    </header>
    <div class="interior" style="--min:${page.cardMin || 310}px">
      ${page.drawers.map(drawerHtml).join('\n')}
      <section class="cajon" id="cajon-resultados" data-id="resultados" hidden><p class="intro sin" hidden>Ninguna ficha coincide. Prueba con el código (por ejemplo <code>${esc(page.searchExample)}</code>) o una palabra en inglés.</p></section>
    </div>
  </main>
</div>
<script>
window.FICHERO=${JSON.stringify({ key: page.storeKey, generatedAt: page.generatedAt, staleDays: page.staleDays || 7, first: page.drawers[0].id })};
${JS}
</script>
</body>
</html>`;
}

const CSS = String.raw`
:root{
  --madera:#1d2a24; --madera-2:#26362e; --madera-3:#33463c; --veta:#3f5549;
  --carton:#f1ece0; --carton-2:#e6dfcf; --tinta:#1d1e1b; --tinta-2:#4a473f; --tinta-3:#6e695d;
  --rojo:#b5412c; --azul-renglon:rgba(64,104,140,.16); --laton:#c19a4b; --laton-claro:#e2c98a;
  --sobre-madera:#e9e2d0; --sobre-madera-2:#b9b4a2;
  --ok:#3f7d5e; --aviso:#b5412c;
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
.riel{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:24px 0 20px 18px;background:var(--madera-2);border-right:1px solid #0003;display:flex;flex-direction:column;gap:22px}
.rotulo{padding-right:18px}
.rotulo .titulo{display:block;font:700 22px/1.1 "Archivo Narrow",sans-serif;color:var(--sobre-madera);text-wrap:balance}
.guias{display:flex;flex-direction:column;gap:3px}
.guia{--pos:0;position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-right:calc(var(--pos)*11px + 14px);padding:9px 14px 9px 12px;background:var(--tab);color:var(--tinta);text-decoration:none;border-radius:3px;font:600 15px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.02em;box-shadow:0 1px 0 #0004;transition:margin var(--t-rapida) var(--curva)}
.guia:hover{margin-right:calc(var(--pos)*11px + 8px)}
.guia[aria-current="true"]{margin-right:-1px;border-radius:3px 0 0 3px;box-shadow:0 2px 0 #0005,0 6px 14px -6px #000a}
.guia .cuenta{font:700 13px/1 "Courier Prime",monospace;color:var(--tinta)}
.guia.con-bandera .pestana::after{content:"";display:inline-block;width:7px;height:7px;margin-left:7px;background:var(--rojo);clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%)}
.rellenar{margin-right:18px;padding:14px;background:var(--madera-3);border-radius:4px;font-size:14px}
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
.portaetiqueta h1{margin:0;padding:6px 18px 5px;background:var(--carton);color:var(--tinta);font:700 20px/1.1 "Archivo Narrow",sans-serif;letter-spacing:.08em;text-transform:uppercase;border-radius:1px;min-width:12ch;text-align:center}
.estado-barra{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0;padding:0;list-style:none;font-size:14px}
.estado-barra li{display:flex;align-items:baseline;gap:6px}
.estado-barra li::before{content:"";align-self:center;width:9px;height:9px;flex:none;border:1.5px solid var(--sobre-madera-2);border-radius:50%}
.estado-barra li[data-state="ok"]::before{background:var(--laton-claro);border-color:var(--laton-claro)}
.estado-barra li[data-state="warn"]::before{border-radius:0;transform:rotate(45deg);border-color:#e58a74;background:#e58a74}
.estado-barra .k{color:var(--sobre-madera-2)}
.estado-barra .v{font-weight:700}
.estado-barra .h{color:#efb3a3}
.buscador{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:inset 0 1px 0 #fff8}
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
.intro code,.hoja code,.desc code{padding:0 4px;border-radius:2px;background:#0000000f;font-size:.95em}
.intro code{background:#ffffff14;color:var(--laton-claro)}
.grupo{margin:34px 0 14px;font:700 14px/1 "Archivo Narrow",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--laton)}
.grupo:first-child{margin-top:0}
.fichas{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(var(--min),100%),1fr));gap:18px;align-items:start}
.ficha{position:relative;min-width:0;display:flex;flex-direction:column;gap:6px;min-height:200px;padding:12px 18px 26px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);scroll-margin-top:190px}
.ficha::after{content:"";position:absolute;left:50%;bottom:8px;width:11px;height:11px;margin-left:-5.5px;border-radius:50%;background:var(--madera);box-shadow:inset 0 1px 2px #000a}
.ficha header{display:flex;align-items:baseline;gap:10px;margin:0 -18px;padding:2px 18px 10px;border-bottom:1.5px solid var(--rojo)}
.signatura{font:700 19px/1 "Courier Prime",monospace;letter-spacing:.04em}
.signatura.larga{font-size:16px;letter-spacing:0;overflow-wrap:anywhere}
.sub{flex:none;font:400 13px/1 "Courier Prime",monospace;color:var(--tinta-3)}
.bandera{display:none;margin-left:auto;color:var(--rojo)}
.bandera svg{width:16px;height:16px;fill:currentColor;stroke:currentColor;stroke-width:1.2}
.ficha.aqui .bandera{display:block}
.ficha h3{margin:8px 0 0;font:700 18px/1.25 "Atkinson",sans-serif;text-wrap:balance}
.desc{margin:0;color:var(--tinta-2);font-size:15px;line-height:1.5}
.estado{margin:0;font:400 14px "Courier Prime",monospace;color:var(--rojo)}
.estado a{color:inherit;font-weight:700}
.ficha[data-state="deprecated"]{background-color:var(--carton-2);clip-path:polygon(0 0,calc(100% - 26px) 0,100% 26px,100% 100%,0 100%)}
.ficha[data-state="deprecated"]::before{content:"";position:absolute;top:0;right:0;width:26px;height:26px;background:linear-gradient(225deg,transparent 50%,#cfc6b1 50%);box-shadow:-2px 2px 3px #0002}
.ficha[data-state="missing"]{background-color:#d9d3c3}
.ficha[data-state="missing"] h3{text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:var(--rojo);color:var(--tinta-2)}
.ficha[data-state="missing"] .signatura{color:var(--tinta-3)}
.comando,.codigo{position:relative;display:flex;align-items:flex-start;gap:8px;margin-top:6px;padding:7px 8px 7px 10px;background:#fffdf6;border:1px solid #d6cdb8;border-radius:2px}
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
.ficha[hidden]{display:none}
mark{background:#e2c98a99;color:inherit;border-radius:1px}

/* ---- hoja de lectura ---- */
.hoja{max-width:76ch;padding:34px 46px 40px;background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);font-size:17px;line-height:1.6}
.hoja h2{margin:34px 0 10px;font:700 24px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.01em;text-wrap:balance}
.hoja h2:first-child{margin-top:0}
.hoja h3{margin:24px 0 6px;font:700 18px/1.3 "Atkinson",sans-serif}
.hoja p,.hoja li{max-width:68ch}
.hoja a{color:var(--rojo)}
.hoja ol,.hoja ul{padding-left:1.3em}
.hoja li{margin:4px 0}
.nota{margin:16px 0;padding:12px 16px;background:#fffdf6;border:1px solid #d6cdb8;border-radius:2px}
.nota p{margin:4px 0}
.tabla{overflow-x:auto;margin:14px 0}
table{border-collapse:collapse;width:100%;font-size:15px}
th,td{padding:7px 10px;text-align:left;vertical-align:top;border-bottom:1px solid #d6cdb8}
th{font:700 13px/1.2 "Archivo Narrow",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--tinta-3)}
td{font-variant-numeric:tabular-nums}
.cajon>.tabla{background:var(--carton);color:var(--tinta);border-radius:3px;box-shadow:var(--sombra);padding:6px 14px}
.cajon>.tabla td:first-child{font-family:"Courier Prime",monospace}
td[data-state="warn"]{color:var(--rojo);font-weight:700}

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
  .fichas{grid-template-columns:minmax(0,1fr)}
  .codigo{flex-wrap:wrap}
  .codigo .copiar{order:-1;margin-left:auto}
  .codigo pre{flex-basis:100%}
  .hoja{padding:22px 18px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const JS = String.raw`
(function(){
  var F=window.FICHERO, $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(F.key+':'+k));localStorage.setItem(F.key+':'+k,JSON.stringify(v))}catch(e){return null}}
  var drawers=$$('.cajon'), tabs=$$('.guia'), title=$('#titulo-cajon'), q=$('#buscar'), results=$('#cajon-resultados');

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
    if(!card) return;
    card.classList.add('aqui');
    var t=tabs.filter(function(t){return t.dataset.tab===card.dataset.drawer})[0]; if(t) t.classList.add('con-bandera');
    store('ficha',card.id);
  }
  document.addEventListener('click',function(e){var c=e.target.closest('.ficha'); if(c&&!e.target.closest('[data-go]')) flag(c)});

  // Copiar (con los valores rellenados)
  document.addEventListener('click',function(e){
    var b=e.target.closest('.copiar'); if(!b) return;
    var box=b.parentElement, code=box.querySelector('code');
    var text=code.innerText.replace(/ /g,' ');
    var done=function(){b.classList.add('hecho');b.querySelector('span').textContent='Copiado';setTimeout(function(){b.classList.remove('hecho');b.querySelector('span').textContent='Copiar'},1400)};
    if(navigator.clipboard&&window.isSecureContext!==false){navigator.clipboard.writeText(text).then(done,fallback)}else fallback();
    function fallback(){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(_){}t.remove()}
  });

  // Placeholders rellenables
  var fills=$$('[data-fill]');
  function applyFills(){
    var vals={}; fills.forEach(function(i){vals[i.dataset.fill]=i.value.trim()});
    $$('.ph').forEach(function(s){var v=vals[s.dataset.ph]; s.textContent=v?v:'<'+s.dataset.ph+'>'; s.classList.toggle('lleno',!!v)});
    store('valores',vals);
  }
  if(fills.length){
    var panel=$('.rellenar'); if(panel&&window.matchMedia('(min-width:861px)').matches) panel.open=true;
    var saved=store('valores')||{}; fills.forEach(function(i){i.value=saved[i.dataset.fill]||''; i.addEventListener('input',applyFills)});
    applyFills();
    var clr=$('.limpiar'); if(clr) clr.addEventListener('click',function(){fills.forEach(function(i){i.value=''});applyFills()});
  }

  // Búsqueda en todos los cajones
  // Los resultados son copias: las fichas originales nunca salen de su cajón.
  var cards=$$('.ficha'), before=null;
  function search(){
    var term=q.value.trim().toLowerCase();
    $$('.fichas',results).forEach(function(x){x.remove()});
    if(!term){ if(before){show(before);before=null} return }
    if(!before){var cur=drawers.filter(function(d){return !d.hidden})[0]; before=cur&&cur.dataset.id!=='resultados'?cur.dataset.id:store('cajon')}
    var words=term.split(/\s+/), grid=document.createElement('div'), n=0;
    grid.className='fichas'; results.appendChild(grid);
    cards.forEach(function(c){
      if(!words.every(function(w){return c.dataset.search.indexOf(w)>-1})) return;
      var k=c.cloneNode(true); k.dataset.ref=c.id; k.removeAttribute('id'); grid.appendChild(k); n++;
    });
    if(fills.length) applyFills();
    $('.sin',results).hidden=n>0;
    show('resultados'); title.textContent=n+(n===1?' ficha':' fichas');
  }
  if(window.matchMedia('(max-width:860px)').matches) q.placeholder=q.dataset.corto;
  q.addEventListener('input',search);
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();q.focus()}
    if(e.key==='Escape'&&document.activeElement===q){q.value='';search();q.blur()}
  });

  // Antigüedad de la guía
  var days=Math.floor((Date.now()-new Date(F.generatedAt).getTime())/864e5), ant=$('.antiguedad');
  if(ant&&days>=F.staleDays){ant.hidden=false;ant.dataset.state='warn';ant.querySelector('.v').textContent='hace '+days+' días'}

  route();
  var last=store('ficha'); if(last) flag(document.getElementById(last));
})();
`;

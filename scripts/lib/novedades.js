// Novedades: descarga las últimas versiones y notas de cada herramienta, las compara con lo instalado
// y genera las fichas. El mismo código corre en Node (copia de respaldo al sincronizar) y en la página
// (consulta en vivo al abrirla, con caché de 1 hora). Requiere globalThis.Marcado.
(function (root) {
  const vparts = v => (String(v || '').match(/\d+/g) || []).map(Number);
  function cmp(a, b) {
    const x = vparts(a), y = vparts(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
    return 0;
  }
  const clean = v => String(v || '').replace(/^v/, '');

  // ---- intérpretes por formato de fuente ----
  const PARSE = {
    'gh-releases': (j, s) => (Array.isArray(j) ? j : [j]).filter(r => !r.draft && !r.prerelease).map(r => ({
      version: clean(r.tag_name), date: r.published_at, url: r.html_url, body: trim(r.body || '', s.cut),
    })),
    // Etiquetas sin releases (git oficial): solo versiones estables, con enlace a sus notas.
    'gh-tags': (j, s) => (Array.isArray(j) ? j : []).map(r => r.name).filter(n => /^v?\d+\.\d+\.\d+$/.test(n)).map(n => {
      const v = clean(n);
      const url = s.notes ? s.notes.replace('{v}', v) : s.link;
      return { version: v, url, body: s.notes ? `Notas de la versión: [${v}](${url})` : '' };
    }),
    'md-changelog': (t, s) => t.split(/^## /m).slice(1).map(sec => {
      const nl = sec.indexOf('\n');
      return { version: clean(sec.slice(0, nl).trim()), body: trim(sec.slice(nl + 1), s.cut), url: s.link };
    }),
    'rst-changelog': (t, s) => {
      const out = [];
      const re = /^(\d+\.\d+\.\d+)\r?\n=+\r?\n([\s\S]*?)(?=^\d+\.\d+\.\d+\r?\n=+|$(?![\s\S]))/gm;
      let m;
      while ((m = re.exec(t)) && out.length < 20) {
        out.push({ version: m[1], url: s.link, body: trim(m[2].replace(/``([^`]+)``/g, '`$1`').replace(/^\* ([a-z-]+):`([^`]+)`:/gm, '* **$2** ($1):'), s.cut) });
      }
      return out;
    },
  };
  function trim(body, cut) {
    let b = String(body).replace(/\r/g, '');
    if (cut) { const i = b.search(new RegExp(cut, 'm')); if (i > -1) b = b.slice(0, i); }
    return b.replace(/<!--[\s\S]*?-->/g, '').trim();
  }

  async function fetchTool(tool, fetchImpl) {
    const s = tool.source;
    const res = await fetchImpl(s.url, { headers: s.url.includes('api.github.com') ? { Accept: 'application/vnd.github+json' } : {} });
    if (!res.ok) throw new Error(`${res.status} ${s.url}`);
    const payload = /changelog/.test(s.kind) ? await res.text() : await res.json();
    const entries = PARSE[s.kind](payload, s).sort((a, b) => cmp(b.version, a.version));
    return { latest: entries[0] && entries[0].version, entries, fetchedAt: new Date().toISOString() };
  }

  async function fetchAll(tools, fetchImpl) {
    const out = {};
    await Promise.all(tools.map(async t => {
      try { out[t.id] = await fetchTool(t, fetchImpl); } catch (e) { out[t.id] = { error: String(e.message || e) }; }
    }));
    return out;
  }

  // ---- presentación ----
  const fecha = d => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  function relation(v, installed) {
    if (!installed) return 'sin-dato';
    const c = cmp(v, installed);
    return c > 0 ? 'nueva' : c === 0 ? 'tuya' : 'anterior';
  }
  const SELLO = { nueva: 'Nueva', tuya: 'Tu versión', anterior: '', 'sin-dato': '' };

  function pick(tool, d) {
    const inst = tool.installed;
    const newer = d.entries.filter(e => inst && cmp(e.version, inst) > 0);
    const mine = d.entries.filter(e => inst && cmp(e.version, inst) === 0);
    const max = tool.take || 4;
    if (newer.length) return [...newer.slice(0, max * 2), ...mine];
    return d.entries.slice(0, max);
  }

  function versionCard(tool, e) {
    const { md, esc, ICON } = root.Marcado;
    const rel = relation(e.version, tool.installed);
    const lines = e.body.split('\n');
    const long = lines.length > 14;
    const head = md(long ? lines.slice(0, 14).join('\n') : e.body, { base: 3 });
    const rest = long ? `<details class="mas"><summary>Ver notas completas</summary>${md(lines.slice(14).join('\n'), { base: 3 })}</details>` : '';
    return `<article class="ficha version" id="v-${esc(tool.id)}-${esc(e.version).replace(/[^a-z0-9]+/gi, '-')}" data-drawer="novedades" data-rel="${rel}" data-search="${esc(`${tool.label} ${e.version} ${e.body}`.toLowerCase())}" tabindex="-1">
  <header><span class="signatura">${esc(e.version)}</span><span class="sub">${esc(tool.label)}${e.date ? ' · ' + fecha(e.date) : ''}</span>${SELLO[rel] ? `<span class="sello" data-rel="${rel}">${SELLO[rel]}</span>` : ''}</header>
  <div class="notas">${head || '<p>Sin notas publicadas.</p>'}${rest}</div>
  ${e.url ? `<nav class="enlaces"><a class="enlace" href="${esc(e.url)}" target="_blank" rel="noopener"><span>Ver en la fuente</span>${ICON.out}</a></nav>` : ''}
</article>`;
  }

  function summaryCard(tool, d) {
    const { esc, phText, copyBtn, ICON } = root.Marcado;
    const latest = d && d.latest;
    const rel = latest ? relation(latest, tool.installed) : 'sin-dato';
    // unknown: la página se mira en un sistema distinto al que se sincronizó, así que no se sabe qué hay instalado aquí.
    const state = !tool.installed && !tool.unknown ? 'missing' : 'ok';
    const verdict = tool.unknown ? `Versión instalada desconocida en ${OS_NAME[tool.os] || 'este sistema'}: ejecuta la sincronización aquí` : !tool.installed ? 'No instalada' : !latest ? 'Sin conexión con la fuente' : rel === 'nueva' ? `Hay versión nueva: ${latest}` : 'Estás en la última versión';
    const up = tool.update || {};
    const action = rel === 'nueva' || !tool.installed
      ? (up.cmd ? `<div class="comando"><code>${phText(up.cmd)}</code>${copyBtn()}</div>` : '') +
        (up.link ? `<nav class="enlaces"><a class="enlace" href="${esc(up.link)}" target="_blank" rel="noopener"><span>${esc(up.linkLabel || 'Descargar')}</span>${ICON.out}</a></nav>` : '')
      : '';
    return `<article class="ficha resumen" id="resumen-${esc(tool.id)}" data-drawer="novedades" data-state="${state === 'missing' ? 'missing' : 'ok'}" data-rel="${rel}" data-search="${esc(`${tool.label} ${verdict}`.toLowerCase())}" tabindex="-1">
  <header><span class="signatura">${esc(tool.label)}</span>${rel === 'nueva' ? '<span class="sello" data-rel="nueva">Actualizar</span>' : ''}</header>
  <dl class="versiones"><div><dt>Tuya</dt><dd>${esc(tool.installed || '—')}</dd></div><div><dt>Última</dt><dd>${esc(latest || '¿?')}</dd></div></dl>
  <p class="veredicto">${esc(verdict)}</p>
  ${up.note && (rel === 'nueva' || !tool.installed) ? `<p class="desc">${root.Marcado.inline(up.note)}</p>` : ''}
  ${tool.note ? `<p class="desc">${root.Marcado.inline(tool.note)}</p>` : ''}
  ${action}
</article>`;
  }

  function render(tools, data, meta) {
    const { esc } = root.Marcado;
    const when = meta && meta.fetchedAt ? new Date(meta.fetchedAt) : null;
    const origin = meta && meta.live ? 'en vivo' : 'copia de la última sincronización';
    const stamp = when ? `${when.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}, ${when.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : '';
    let html = `<div class="intro"><p>Lo último de cada herramienta frente a lo que tienes instalado. Consultado <strong>${esc(origin)}</strong>${stamp ? ` el ${esc(stamp)}` : ''}; la página vuelve a consultar al abrirla (como mucho una vez por hora).</p></div>`;
    html += `<h2 class="grupo">Tu equipo</h2><div class="fichas resumenes">${tools.map(t => summaryCard(t, data[t.id])).join('')}</div>`;
    for (const t of tools) {
      const d = data[t.id];
      if (!d || d.error || !d.entries) continue;
      const list = pick(t, d);
      const newer = list.filter(e => relation(e.version, t.installed) === 'nueva').length;
      html += `<h2 class="grupo">${esc(t.label)} · ${newer ? `${newer} ${newer === 1 ? 'versión nueva' : 'versiones nuevas'} desde la tuya` : 'últimas versiones'}</h2><div class="fichas lista">${list.map(e => versionCard(t, e)).join('')}</div>`;
    }
    return html;
  }

  function counts(tools, data) {
    return tools.reduce((n, t) => n + ((data[t.id] && data[t.id].latest && t.installed && cmp(data[t.id].latest, t.installed) > 0) ? 1 : 0), 0);
  }

  // Elige la variante de cada campo según el sistema: { "win32": …, "darwin": …, "linux": …, "default": … }.
  const OS_KEYS = ['win32', 'darwin', 'linux', 'default'];
  function resolve(tool, platform) {
    const out = {};
    for (const [k, v] of Object.entries(tool)) {
      const byOs = v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length && Object.keys(v).every(x => OS_KEYS.includes(x));
      out[k] = byOs ? (v[platform] !== undefined ? v[platform] : v.default) : v;
    }
    return out;
  }

  const OS_NAME = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };

  // Herramientas listas para un sistema: variantes resueltas y versión instalada solo si ese sistema
  // es el mismo donde se sincronizó (lo instalado es un dato de esa máquina).
  function toolsFor(nov, os) {
    return nov.raw.map(t => {
      const r = resolve(t, os);
      const same = os === nov.syncOs;
      return { ...r, os, installed: same ? (nov.installed[t.id] || null) : null, unknown: !same, note: same && nov.notes && nov.notes[t.id] ? nov.notes[t.id] : r.note };
    });
  }

  // Sistema de quien mira la página (solo en el navegador).
  function detectOs(nav) {
    const p = ((nav.userAgentData && nav.userAgentData.platform) || nav.platform || nav.userAgent || '').toLowerCase();
    if (/win/.test(p)) return 'win32';
    if (/mac|iphone|ipad/.test(p)) return 'darwin';
    if (/linux|x11|cros/.test(p)) return 'linux';
    return null;
  }

  root.Novedades = { fetchAll, render, counts, cmp, resolve, toolsFor, detectOs, OS_NAME };
})(typeof globalThis !== 'undefined' ? globalThis : window);

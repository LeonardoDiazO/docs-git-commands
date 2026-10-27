// Markdown mínimo + utilidades de marcado. Se usa igual en Node (sync) y en el navegador (novedades en vivo):
// en Node se importa por efecto y se lee de globalThis.Marcado; en la página se incrusta tal cual.
(function (root) {
  const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const ICON = {
    copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
    search: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H4M7.5 4.5L4 8l3.5 3.5"/></svg>',
    flag: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2.5h8l-2 3 2 3H4"/></svg>',
    out: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2.5h4.5V7M13.5 2.5L7 9M11.5 9.5v4h-9v-9h4"/></svg>',
  };

  const copyBtn = (label = 'Copiar') =>
    `<button class="copiar" type="button" aria-label="${label}">${ICON.copy}${ICON.check}<span>${label}</span></button>`;

  // Placeholders <como-este> se vuelven spans rellenables desde el panel lateral.
  const phText = code => esc(code).replace(/&lt;([a-z][a-z0-9-]*)&gt;/gi, (_, t) => `<span class="ph" data-ph="${t}">&lt;${t}&gt;</span>`);

  const codeBlock = code =>
    `<div class="codigo"><pre><code>${phText(code).replace(/^(\s*#.*)$/gm, '<span class="c">$1</span>')}</code></pre>${copyBtn()}</div>`;

  function inline(s) {
    // El código se aparta primero para que **negrita con `código`** funcione.
    const codes = [];
    const marked = String(s).replace(/`([^`]+)`/g, (_, c) => `@@${codes.push(c) - 1}@@`);
    return esc(marked)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\[([^\]]+)\]\(#([^)\s]+)\)/g, '<a href="#$2">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/@@(\d+)@@/g, (_, i) => `<code class="copiable" tabindex="0" role="button" title="Clic o Enter para copiar">${phText(codes[+i])}</code>`);
  }

  // ```ruta Título  →  pasos "comando | explicación", numerados y copiables.
  function ruta(title, lines) {
    const steps = lines.filter(l => l.trim()).map(l => {
      const [cmd, ...rest] = l.split(' | ');
      return `<li><div class="comando"><code>${phText(cmd.trim())}</code>${copyBtn()}</div><p>${inline(rest.join(' | ').trim())}</p></li>`;
    }).join('');
    return `<section class="ruta"><h3>${inline(title)}</h3><ol>${steps}</ol></section>`;
  }

  function md(src = '', opts = {}) {
    // base: nivel con el que debe empezar el encabezado más alto del texto (evita saltos h2 → h5).
    const levels = (String(src).match(/^#{1,4} /gm) || []).map(h => h.trim().length);
    const shift = opts.base && levels.length ? opts.base - Math.min(...levels) : (opts.shift || 0);
    const lines = String(src).replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      const fence = l.match(/^```(\S*)\s*(.*)$/);
      if (fence) {
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push(fence[1] === 'ruta' ? ruta(fence[2], buf) : codeBlock(buf.join('\n')));
        continue;
      }
      if (/^#{1,4} /.test(l)) {
        const lvl = Math.min(6, Math.max(2, l.match(/^#+/)[0].length + shift));
        out.push(`<h${lvl}>${inline(l.replace(/^#+ /, '').replace(/^[^\p{L}\p{N}`*]+/u, ''))}</h${lvl}>`);
        i++;
        continue;
      }
      if (/^\|/.test(l) || (/\|/.test(l) && /^\s*-+\s*\|/.test(lines[i + 1] || ''))) {
        const rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) rows.push(lines[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const body = rows.filter(r => !/^\|?[\s:|-]+\|?$/.test(r.trim()));
        const [head, ...rest] = body;
        out.push(`<div class="tabla"><table><thead><tr>${cells(head).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest
          .map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*([-*]|\d+\.) /.test(l)) {
        const ordered = /^\s*\d+\./.test(l);
        const items = [];
        while (i < lines.length && (/^\s*([-*]|\d+\.) /.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          if (/^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.) /, ''));
          else items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        out.push(`<${tag}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
        continue;
      }
      if (/^> /.test(l)) {
        const buf = [];
        while (i < lines.length && /^> ?/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, ''));
        out.push(`<aside class="nota">${md(buf.join('\n'), opts)}</aside>`);
        continue;
      }
      if (/^(---|\s*)$/.test(l)) { i++; continue; }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(```|#{1,4} |\||> |\s*([-*]|\d+\.) )/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
    return out.join('\n');
  }

  root.Marcado = { esc, md, inline, phText, codeBlock, copyBtn, ICON };
})(typeof globalThis !== 'undefined' ? globalThis : window);

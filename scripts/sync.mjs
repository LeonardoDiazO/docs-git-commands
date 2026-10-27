// npm run sync: lee content/ (tus comandos y las frases para Claude), tu configuración de git y las versiones
// instaladas de git, gh y aws; descarga sus novedades (copia de respaldo; la página las vuelve a consultar en vivo)
// y regenera index.html y README.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { render, md, Novedades } from './lib/fichero.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfgFile = JSON.parse(readFileSync(join(ROOT, 'guide.config.json'), 'utf8'));
const sh = cmd => { try { return execSync(cmd, { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const COLORS = ['#e3957a', '#8fb39a', '#8fa9c4', '#d6b162', '#b9a3c4', '#b5b0a3'];
// GUIA_PLATFORM permite probar la salida de otro sistema (win32, darwin, linux).
const PLATFORM = process.env.GUIA_PLATFORM || process.platform;
const OS_NAME = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }[PLATFORM] || PLATFORM;

// ---------- content/comandos.md → cajones y fichas ----------
const src = readFileSync(join(ROOT, 'content/comandos.md'), 'utf8').replace(/\r/g, '');
const sections = src.split(/^## /m).slice(1).map(s => {
  const nl = s.indexOf('\n');
  return { title: s.slice(0, nl).trim(), body: s.slice(nl + 1) };
});

const placeholders = [];
const conv = sections.find(s => /^Convenciones/i.test(s.title));
if (conv) for (const m of conv.body.matchAll(/^\|\s*`<([^>]+)>`\s*\|\s*([^|]+)\|\s*([^|]+)\|/gm))
  placeholders.push({ token: m[1], desc: m[2].trim(), example: m[3].trim().split(/`,\s*`/)[0].replace(/`/g, '') });

const drawers = [];
sections.filter(s => /^\d+\./.test(s.title)).forEach((s, si) => {
  const num = s.title.match(/^(\d+)\./)[1];
  const name = s.title.replace(/^\d+\.\s*/, '');
  const [intro, ...entries] = s.body.split(/^### /m);
  const cards = entries.map((e, ei) => {
    const nl = e.indexOf('\n');
    const title = e.slice(0, nl).trim().replace(/`/g, '');
    const body = e.slice(nl + 1).replace(/\n---\s*$/m, '').trim();
    return {
      id: `${num}-${slug(title)}`, call: `${num}.${ei + 1}`, sub: name.split(' — ')[0], title,
      body: md(body.replace(/\*\*¿Qué hace\?\*\*\s*/g, '')), search: body,
    };
  });
  drawers.push({
    id: slug(name.split(' — ')[0]), label: name, short: name.split(' — ')[0], color: COLORS[si % COLORS.length],
    intro: intro.replace(/^---\s*$/gm, '').trim() ? md(intro.replace(/^---\s*$/gm, '')) : '', cards,
  });
});

// ---------- Git con Claude ----------
const gc = JSON.parse(readFileSync(join(ROOT, 'content/git-claude.json'), 'utf8'));
drawers.unshift({
  id: 'con-claude', label: 'Git con Claude', short: 'Con Claude', color: '#d6b162',
  intro: md('Lo que copias aquí se pega en Claude Code. Claude ejecuta git por ti, pero **nunca hace push ni crea PRs si no se lo pides**. Los valores de la izquierda también se sustituyen en estas frases.'),
  groups: gc.grupos.map(g => ({ label: g.label, cards: g.fichas.map(f => ({ id: 'claude-' + slug(f.title), sub: 'Claude Code', ...f })) })),
});

// ---------- Tu configuración ----------
const cfg = Object.fromEntries((sh('git config --global --list') || '').split('\n').filter(Boolean).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
const gitVersion = (sh('git --version') || '').replace('git version ', '') || null;
const ghVersion = ((sh('gh --version') || '').match(/gh version (\S+)/) || [])[1] || null;
const awsVersion = ((sh('aws --version') || '').match(/aws-cli\/(\S+)/) || [])[1] || null;
const ghCopies = [...new Set((sh(process.platform === 'win32' ? 'where gh' : 'which -a gh') || '').split(/\r?\n/).filter(Boolean))];
const RECOMMENDED = [
  ['user.name', 'Tu nombre en los commits', null],
  ['user.email', 'Tu correo en los commits', null],
  ['init.defaultBranch', 'Rama inicial de los repos nuevos', 'main'],
  PLATFORM === 'win32'
    ? ['core.autocrlf', 'Convierte CRLF↔LF al guardar y al sacar archivos, para no ensuciar los diffs en Windows', 'true']
    : ['core.autocrlf', 'Convierte CRLF a LF al hacer commit (por si llega un archivo de Windows)', 'input'],
  ['pull.rebase', 'Qué hace git pull cuando divergen las ramas', 'false'],
  ['fetch.prune', 'Borra referencias a ramas remotas eliminadas en cada fetch', 'true'],
  ...(PLATFORM === 'win32' ? [['core.longpaths', 'Permite rutas de más de 260 caracteres en Windows', 'true']] : []),
];
const configCards = RECOMMENDED.map(([key, desc, value]) => {
  const cur = cfg[key];
  const shown = key === 'user.email' && cur ? cur.replace(/^(.).*(@.*)$/, '$1…$2') : cur;
  return {
    id: 'config-' + slug(key), call: key, sub: cur ? 'configurado' : 'sin configurar', title: shown || 'Sin valor', desc,
    state: cur ? 'ok' : 'missing', missingNote: value ? `Sugerido: ${value}` : 'Configúralo antes de commitear',
    cmd: cur ? null : `git config --global ${key} ${value ?? '"<valor>"'}`,
  };
});
const aliases = Object.entries(cfg).filter(([k]) => k.startsWith('alias.'));
drawers.push({
  id: 'configuracion', label: 'Tu configuración', short: 'Configuración', color: '#b5b0a3',
  intro: md(`Leída de \`git config --global\` al sincronizar en ${OS_NAME}; las sugerencias son para ese sistema. Las fichas tachadas no están configuradas: copia el comando para fijarlas.${aliases.length ? '' : ' No tienes alias definidos.'}`),
  groups: [{ label: 'Ajustes', cards: configCards }, ...(aliases.length ? [{ label: 'Tus alias', cards: aliases.map(([k, v]) => ({ id: 'alias-' + slug(k), call: 'git ' + k.slice(6), sub: 'alias', title: v, cmd: 'git ' + k.slice(6) })) }] : [])],
});

// ---------- novedades (copia de respaldo; la página consulta en vivo al abrirse) ----------
const installedOf = { git: gitVersion, gh: ghVersion, aws: awsVersion };
const tools = cfgFile.novedades.map(t => Novedades.resolve(t, PLATFORM)).map(t => ({
  ...t, installed: installedOf[t.id] || null,
  note: t.id === 'gh' && ghCopies.length > 1 ? `Tienes ${ghCopies.length} copias instaladas: ${ghCopies.map(p => `\`${p}\``).join(', ')}. Se usa la primera; desinstala la otra para evitar versiones mezcladas.` : t.note,
}));
const NOW = new Date();
const newsData = await Novedades.fetchAll(tools, (u, o) => fetch(u, { ...o, signal: AbortSignal.timeout(15000) }));
const newCount = Novedades.counts(tools, newsData);
drawers.unshift({ id: 'novedades', label: 'Novedades', color: '#e3957a', type: 'novedades' });
drawers.forEach(d => { d.count = d.type === 'novedades' ? (newCount ? `${newCount} ${newCount === 1 ? 'nueva' : 'nuevas'}` : 'al día') : (d.groups || [{ cards: d.cards }]).reduce((n, g) => n + g.cards.length, 0); });

const human = NOW.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
writeFileSync(join(ROOT, 'index.html'), render({
  edition: 'git', cardMin: 460, title: 'Guía Git + S3', storeKey: 'guia-git', fontsDir: join(ROOT, 'assets/fonts'),
  generatedAt: NOW.toISOString(), generatedHuman: human, syncCmd: 'npm run sync',
  searchHint: 'Buscar comando o tarea (stash, deshacer commit, cherry-pick…)', searchHintShort: 'Buscar comando o tarea', searchExample: 'stash',
  placeholders, drawers,
  novedades: { tools, snapshot: { data: newsData, fetchedAt: NOW.toISOString() } },
  status: [
    { label: 'Inventario', value: `${human} · ${OS_NAME}`, state: 'ok' },
    { tool: 'git', label: 'Git', value: gitVersion || 'no encontrado', state: gitVersion ? 'ok' : 'warn' },
    { tool: 'gh', label: 'GitHub CLI', value: ghVersion || 'falta', state: ghVersion ? 'ok' : 'warn', hint: ghVersion ? '' : 'necesario para PRs' },
    { tool: 'aws', label: 'AWS CLI', value: awsVersion || 'falta', state: awsVersion ? 'ok' : 'warn', hint: awsVersion ? '' : 'necesario para S3' },
  ],
}));

// README generado: qué es, cómo se usa, estructura y la referencia completa (se lee en VS Code o GitHub)
const newsLines = tools.map(t => { const d = newsData[t.id] || {}; return `| ${t.label} | ${t.installed || '—'} | ${d.latest || 'sin conexión'} | ${d.latest && t.installed && Novedades.cmp(d.latest, t.installed) > 0 ? '**actualizar**' : 'al día'} |`; });
const readme = [
  '# Guía Git + S3', '',
  `> **Abre \`index.html\`** (doble clic): buscador, copiar con un clic, valores rellenables y novedades en vivo. Este README lo genera \`npm run sync\` (${human}); para cambiar comandos edita \`content/comandos.md\`.`, '',
  '## Novedades', '', '| Herramienta | Tuya | Última | Estado |', '|---|---|---|---|', ...newsLines, '',
  '## Cómo se mantiene al día', '',
  '- **Novedades** (Git para Windows, GitHub CLI, AWS CLI): la página las consulta en vivo al abrirse, como mucho una vez por hora. Sin internet muestra la copia de la última sincronización.',
  '- **Lo instalado** (versiones y `git config --global`): se lee al ejecutar `npm run sync`, o desde `guias/` con `actualizar-guias.cmd` (Windows) o `./actualizar-guias.sh` (macOS/Linux). Los comandos de actualización se eligen para el sistema donde sincronizas.', '',
  '## Estructura', '',
  '| Ruta | Qué es | ¿Se edita? |', '|---|---|---|',
  '| `content/comandos.md` | Tu referencia de Git y S3: cada `## N.` es un cajón y cada `###` una ficha | Sí |',
  '| `content/git-claude.json` | Frases para pedirle a Claude tareas de git | Sí |',
  '| `guide.config.json` | Fuentes de novedades y comandos de actualización | Sí |',
  '| `scripts/sync.mjs` | Lee contenido, configuración y versiones; genera `index.html` y este README | Al cambiar qué se lee |',
  '| `scripts/lib/` | Motor compartido con `docs-bmad-method` (idéntico en ambos repos) | Copiar al otro repo si cambia |',
  '| `assets/fonts/` | Tipografías OFL incrustadas en la página | No |',
  '| `index.html`, `README.md` | Generados | No |',
  '| `PRODUCT.md`, `DESIGN.md`, `.impeccable/` | Contexto de producto y sistema visual (skill impeccable) | Al rediseñar |', '',
  '---', '',
  src.replace(/^# .*\n/, '').trim(), '',
].join('\n');
writeFileSync(join(ROOT, 'README.md'), readme);

console.log(`Guía Git regenerada: ${drawers.reduce((n, d) => n + (+d.count || 0), 0)} fichas en ${drawers.length} cajones · ${placeholders.length} valores rellenables · novedades: ${tools.map(t => `${t.id} ${newsData[t.id]?.latest || 'sin conexión'}`).join(', ')}`);
if (newCount) console.log(`${newCount} herramienta(s) con versión nueva. Revisa el cajón Novedades.`);

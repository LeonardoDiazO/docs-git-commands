// npm run sync: lee README.md (fuente de los comandos), content/git-claude.json y tu configuración de git,
// y regenera index.html. README.md no se sobrescribe: edítalo para cambiar o añadir comandos.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { render, md } from './fichero.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sh = cmd => { try { return execSync(cmd, { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const COLORS = ['#e3957a', '#8fb39a', '#8fa9c4', '#d6b162', '#b9a3c4', '#b5b0a3'];

// ---------- README → cajones y fichas ----------
const src = readFileSync(join(ROOT, 'README.md'), 'utf8').replace(/\r/g, '');
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
    intro: intro.replace(/---/g, '').trim() ? md(intro.replace(/^---\s*$/gm, '')) : '', cards,
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
const gitVersion = (sh('git --version') || '').replace('git version ', '');
const ghVersion = ((sh('gh --version') || '').match(/gh version (\S+)/) || [])[1];
const awsVersion = ((sh('aws --version') || '').match(/aws-cli\/(\S+)/) || [])[1];
const RECOMMENDED = [
  ['user.name', 'Tu nombre en los commits', null],
  ['user.email', 'Tu correo en los commits', null],
  ['init.defaultBranch', 'Rama inicial de los repos nuevos', 'main'],
  ['core.autocrlf', 'En Windows convierte CRLF↔LF para no ensuciar los diffs', 'true'],
  ['pull.rebase', 'Qué hace git pull cuando divergen las ramas', 'false'],
  ['fetch.prune', 'Borra referencias a ramas remotas eliminadas en cada fetch', 'true'],
  ['core.longpaths', 'Permite rutas largas en Windows', 'true'],
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
  intro: md(`Leída de \`git config --global\` al sincronizar. Las fichas tachadas no están configuradas: copia el comando para fijarlas.${aliases.length ? '' : ' No tienes alias definidos.'}`),
  groups: [{ label: 'Ajustes', cards: configCards }, ...(aliases.length ? [{ label: 'Tus alias', cards: aliases.map(([k, v]) => ({ id: 'alias-' + slug(k), call: 'git ' + k.slice(6), sub: 'alias', title: v, cmd: 'git ' + k.slice(6) })) }] : [])],
});
drawers.forEach(d => { d.count = (d.groups || [{ cards: d.cards }]).reduce((n, g) => n + g.cards.length, 0); });

const NOW = new Date();
const human = NOW.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
writeFileSync(join(ROOT, 'index.html'), render({
  edition: 'git', cardMin: 460, title: 'Guía Git + S3', storeKey: 'guia-git', fontsDir: join(ROOT, 'assets/fonts'),
  generatedAt: NOW.toISOString(), generatedHuman: human, syncCmd: 'npm run sync', searchHintShort: 'Buscar comando o tarea',
  searchHint: 'Buscar comando o tarea (stash, deshacer commit, cherry-pick…)', searchExample: 'stash',
  placeholders, drawers,
  status: [
    { label: 'Sincronizada', value: human, state: 'ok' },
    { label: 'Git', value: gitVersion || 'no encontrado', state: gitVersion ? 'ok' : 'warn' },
    { label: 'GitHub CLI', value: ghVersion || 'falta', state: ghVersion ? 'ok' : 'warn', hint: ghVersion ? '' : 'necesario para PRs' },
    { label: 'AWS CLI', value: awsVersion || 'falta', state: awsVersion ? 'ok' : 'warn', hint: awsVersion ? '' : 'necesario para S3' },
  ],
}));
console.log(`Guía Git regenerada: ${drawers.reduce((n, d) => n + d.count, 0)} fichas en ${drawers.length} cajones · ${placeholders.length} valores rellenables`);

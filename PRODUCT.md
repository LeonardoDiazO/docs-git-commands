# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Página estática local (`index.html` autocontenido, abre con doble clic, sin servidor ni internet) generada por un script Node (`npm run sync`) a partir de contenido Markdown + datos leídos de la instalación local. El `README.md` se mantiene como respaldo legible en VS Code/GitHub. Decidido por el usuario (2026-10-26).

## Users

Un solo usuario: desarrollador full-stack (Java/Spring, .NET, Next.js, Python) que trabaja con Claude Code y el método BMAD. Consulta estas guías en medio de una tarea, con el editor y la terminal abiertos al lado: necesita encontrar un comando, skill o paso del flujo en segundos, copiarlo y volver al trabajo.

## Product Purpose

Dos guías personales de referencia que viven en `guias/`:

- `docs-bmad-method`: cómo usar BMAD v6 dentro de Claude Code (fases, skills, agentes, orden de uso) + inventario de lo que Claude tiene instalado (skills, agentes, plugins) y comandos/atajos de Claude Code.
- `docs-git-commands`: referencia de Git y AWS S3 con explicaciones, + cómo trabajar Git con Claude (commits, PRs, code-review, conflictos).

Éxito: encontrar lo que busca sin hacer scroll largo, copiar un comando listo para pegar, y confiar en que lo que dice la guía coincide con lo instalado hoy.

## Positioning

No es documentación genérica: refleja **la instalación real de esta máquina** (versión BMAD instalada vs. publicada, skills y agentes presentes) y se regenera con un comando. Ninguna guía pública puede decir qué tiene instalado este usuario.

## Operating Context

- Se abre desde el explorador de archivos o el navegador, en local. El usuario trabaja en Windows 11, pero las guías deben funcionar igual en macOS y Linux: el sync detecta el sistema y elige los comandos de actualización correspondientes.
- Las novedades (versiones y changelogs de BMAD, Claude Code, Git, GitHub CLI y AWS CLI) se consultan en vivo al abrir la página, con caché de 1 hora y copia de respaldo del último sync.
- Se actualiza con `npm run sync` (lee `_bmad/_config`, `~/.claude/skills`, `~/.claude/agents`, plugins instalados, `npm view bmad-method version`, `git --version`) y avisa si hay una versión nueva de BMAD.
- Idioma: español.

## Capabilities and Constraints

- Buscador instantáneo, copiar comandos con un clic, navegación por secciones.
- Los placeholders de comandos Git (`<mi-rama>`, `<rama-base>`, ...) pueden rellenarse una vez y se sustituyen en todos los comandos.
- Sin dependencias en tiempo de ejecución (todo inline); sin publicación en GitHub (decisión del usuario: estos repos son locales).
- Los comandos de Claude Code listados a mano deben verificarse contra `/help`; lo detectado automáticamente se marca como tal.

## Evidence on Hand

- `docs-bmad-method/README.md` (904 líneas, describe un modelo BMAD antiguo "v1.0" con Orchestrator — desactualizado frente a BMAD 6.x).
- `docs-git-commands/README.md` (698 líneas, Git + AWS S3, vigente).
- Manifiestos BMAD instalados en `REPOSITORIOS PERSONAL/_bmad/_config/` (v6.1.0; publicada 6.12.4).

## Product Principles

1. Lo instalado es la verdad: lo que pueda leerse de la máquina se genera, no se escribe a mano.
2. Encontrar y copiar en segundos vale más que leer de corrido.
3. Desactualización visible: si algo está viejo, la guía lo dice arriba.
4. Español claro y directo, explicaciones cortas debajo de cada comando.

# SkillVault

Portal para descubrir, publicar e instalar skills reutilizables en formato **SKILL.md** — el estándar de habilidades de Claude Code / Anthropic.

---

## ¿Qué es un SKILL.md?

Un SKILL.md es un archivo de instrucciones estructurado que le enseña a un AI harness (Claude Code, Codex, Cursor, etc.) a ejecutar una tarea específica. Define triggers, herramientas permitidas, compatibilidad y puede incluir recursos y scripts adjuntos.

```yaml
---
name: "db-migrate"
description: "Genera y aplica migraciones de base de datos seguras"
version: "1.0.0"
schema_version: "1.1"
metadata:
  type: infra
  triggers:
    - "/db-migrate"
    - "migrar base de datos"
  tools:
    - Read
    - Write
    - PowerShell
compatibility:
  - claude
  - codex
---
```

---

## Features

- **Catálogo** — búsqueda, filtros por tipo y ordenamiento
- **Detalle de skill** — árbol de archivos adjuntos, preview inline, descarga `.zip`
- **Publicar** — wizard de 3 pasos con editor CodeMirror, carga desde carpeta local o `.zip`
- **Dashboard** — estadísticas, historial de versiones, editor en vivo
- **CLI** — instalar, buscar, listar y eliminar skills desde la terminal

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Base de datos | SQLite via `@libsql/client` + Drizzle ORM |
| Editor | CodeMirror 6 (carga dinámica, SSR-safe) |
| Validación | Zod |
| ZIP | jszip |
| Frontmatter | gray-matter |
| CLI | Node.js ESM puro (sin dependencias externas) |

---

## Inicio rápido

### Portal web

```bash
# Instalar dependencias
pnpm install --ignore-scripts

# Inicializar base de datos con skills de ejemplo
pnpm tsx src/lib/db/migrate.ts
pnpm tsx src/lib/db/seed.ts

# Servidor de desarrollo
pnpm dev
```

El portal corre en `http://localhost:3000` (o el siguiente puerto libre).

### Variables de entorno

```env
# Opcional — ruta personalizada a la DB
DATABASE_URL=./skills-vault.db
```

---

## CLI

### Instalación global

```bash
cd cli
npm install -g .
```

### Comandos

```bash
# Instalar un skill desde el portal
skillvault install db-migrate --harness claude --scope global

# Buscar skills
skillvault search "database migration"

# Listar skills instalados localmente
skillvault list
skillvault list --harness cursor

# Eliminar un skill
skillvault remove db-migrate --harness claude --scope global
```

### Flags globales

| Flag | Default | Descripción |
|---|---|---|
| `--harness` | `claude` | Harness destino: `claude`, `codex`, `opencode`, `agy`, `cursor` |
| `--scope` | `global` | `global` (`~/.claude/skills/`) o `local` (`.claude/skills/`) |
| `--server` | `http://localhost:3010` | URL del portal |
| `--force` | — | Sobreescribir si ya está instalado |

### Rutas de instalación por harness

| Harness | Global | Extensión |
|---|---|---|
| `claude` | `~/.claude/skills/` | `.md` |
| `codex` | `~/.codex/skills/` | `.md` |
| `opencode` | `~/.opencode/skills/` | `.md` |
| `agy` | `~/.agy/skills/` | `.md` |
| `cursor` | `~/.cursor/rules/` | `.mdc` |

---

## Estructura del repositorio

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Catálogo
│   │   ├── skills/[slug]/            # Detalle de skill
│   │   ├── publish/                  # Wizard de publicación
│   │   ├── dashboard/                # Panel de gestión
│   │   └── api/skills/               # API routes
│   ├── components/
│   │   ├── wizard/                   # Pasos del wizard
│   │   ├── dashboard/                # Tabla, editor, versiones
│   │   └── FileTree.tsx              # Árbol de archivos adjuntos
│   └── lib/
│       ├── db/                       # Schema Drizzle + migración + seed
│       └── skill-schema.ts           # Validación Zod del SKILL.md
├── cli/
│   ├── bin/skillvault.js             # Entry point
│   └── src/
│       ├── commands/                 # install, search, list, remove
│       ├── api.js                    # Cliente HTTP del portal
│       ├── config.js                 # Rutas por harness
│       └── ui.js                     # Colores ANSI
└── skills-vault.db                   # SQLite (no versionado)
```

---

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/skills` | Listar/buscar skills (`?q=`, `?type=`, `?sort=`) |
| `POST` | `/api/skills` | Publicar nuevo skill |
| `GET` | `/api/skills/:slug` | Detalle + rawContent |
| `PATCH` | `/api/skills/:slug` | Editar skill |
| `GET` | `/api/skills/:slug/files` | Listar archivos adjuntos |
| `POST` | `/api/skills/:slug/files` | Subir archivos adjuntos |
| `GET` | `/api/skills/:slug/download` | Descargar skill como `.zip` |
| `POST` | `/api/skills/:slug/install` | Registrar instalación (contador) |
| `GET` | `/api/skills/:slug/versions` | Historial de versiones |
| `POST` | `/api/validate` | Validar frontmatter sin publicar |

---

## Licencia

MIT

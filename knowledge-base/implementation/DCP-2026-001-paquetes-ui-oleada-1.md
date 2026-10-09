---
artifact: development-context-pack
okf: google-okf-v0.2
id: DCP-2026-001
title: "Development Context Pack: PackageStatus y PackageCard (oleada 1 de DSP-2026-002)"
generated: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/DSP-2026-002-componentes-ui-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageStatus.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageCard.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/visual-design-registry.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/react-component-architecture.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/component-module-contract.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
provenance:
  created_by: development-handoff-builder
  method: derived-from-component-specifications-and-existing-code
  confidence: medium
human-reviewed: false
---

# Development Context Pack: PackageStatus y PackageCard

Written for: Developers y coding agents que implementarán la oleada 1, y QA que verificará la evidencia.

## Scope and identity

- Artifact ID: `DCP-2026-001`
- Component or capability: `CMP-ATOM-001` PackageStatus y `CMP-ORG-001` PackageCard, subconjunto de `DSP-2026-002` (a su vez derivado de `DSP-2026-001`).
- Context source: specs `CMP-PackageStatus.md` y `CMP-PackageCard.md`, diseños Stitch enlazados en cada spec, `ADR-004` y `ADR-005`.
- Owner: por confirmar.
- Estado: `REQUIRES_REVIEW`. No es una autorización de implementación hasta resolver los bloqueos de "Next action".

## Content

### Objective

Implementar dos componentes React presentacionales en el portal Next.js 16 / React 19 (`ADR-004`), conformes a su especificación **y** a su diseño visual en Stitch, con stories de Storybook (`ADR-005`).

### Included work

**1. `PackageStatus` (CMP-ATOM-001)**
- Props: `value: 'draft' | 'published' | 'retired'`, `version?`, `warning?`, `compact?`. Sin callbacks.
- Píldora `rounded-full`, 12px, icono inicial, nunca solo color: Borrador = gris con borde punteado + `edit_note`; Publicado = verde + `check_circle`; Retirado = neutro + `archive`. El aviso de retiro es una línea ámbar aparte con icono de advertencia, no un color de estado.
- Un valor desconocido es un error, no un fallback silencioso.
- Etiquetas localizables: reutilizar `packageStatusLabel` de `src/lib/packages/ui.ts`.
- Compatible con Server Components (sin estado ni eventos).
- Diseño: Stitch `1874775286672335993` / `2dd84f1ca2ef4ec0b6edeba82e8ff05d`.

**2. `PackageCard` (CMP-ORG-001)**
- Props: `package` (identidad, descripción, rol, estado, versión, `skillCount?`), `actions` (`edit`, `duplicate`, `review`, `retire`), `disabled`, `warningText?`. Callback `onEvent(event)` con unión discriminada (`open`, `edit`, `duplicate`, `review`, `retire`) (nombres propuestos).
- Variantes `maintenance` y `public-readonly`; estados draft, published, retired con aviso, disabled (acciones deshabilitadas con texto explicativo). El skeleton de carga lo posee el grid, no la tarjeta.
- Compone `PackageStatus`. Elemento semántico `article`, nombre accesible del enlace a partir del nombre del paquete, foco visible, estado con texto, aviso de retiro anunciado.
- Icono, meta (rol y versión) y acciones: elementos privados del mismo archivo, no exportados (D-8).
- Requiere límite de cliente (`"use client"`) por los eventos.
- Diseño: Stitch `1874775286672335993` / `db8519d701bc4a8e9c735ff190a21b6c`.

**3. Transversal**
- Ambos modos (claro y oscuro) en los dos componentes (D-7).
- Stories de Storybook: una por variante y estado de cada spec, en claro y oscuro.
- Pruebas: unitarias de contrato y de estados, interacción y teclado, accesibilidad, y verificación visual contra el diseño Stitch.
- Ubicación propuesta: `src/components/packages/` (junto a los `*Client.tsx`).

### Excluded work

- `CMP-ORG-002` PackageSearchPanel, `CMP-ORG-003` PackageSkillPicker, el grid de tarjetas, la plantilla y la página.
- Sustituir la tabla actual de `PackageCatalogClient.tsx` por tarjetas (cambio de layout de SCR-001): requiere decisión aparte.
- Servicios, rutas, permisos, auditoría, versionado, instalación y CLI.
- Publicar los componentes como librería o extraerlos a otro framework.
- Instalar y configurar Storybook: es prerrequisito, ver "Next action".
- Crear, editar o borrar diseños en Stitch.

### Decisions and constraints

| ID | Decisión o restricción | Fuente |
|---|---|---|
| D-1 | Frontend: Next.js sobre React; Angular descartado. Los selectores `sv-*` y todo lo de NPM en las specs son históricos no normativos. | ADR-004 |
| D-2 | Storybook para desarrollar, documentar y probar componentes. No está instalado. | ADR-005 |
| D-3 | Regla de estados canónica (píldora, icono, nunca solo color; Retirado neutro; aviso de retiro aparte). | CMP-ATOM-001, registro visual |
| D-4 | Los componentes no importan servicios, router ni APIs; las decisiones de permisos quedan fuera. | CMP-ORG-001, react-component-architecture |
| D-5 | WCAG 2.2 AA es criterio de release. | specs |
| D-6 | Implementar contra spec **y** diseño; no inferir visuales solo de la spec. | specs |
| D-7 | **Se soportan ambos modos (claro y oscuro).** El portal es oscuro por defecto y tiene selector de tema (`data-theme`, `ThemeToggle`). | decisión humana (human:ianache), 2026-10-08 |
| D-8 | `PackageCard` implementa icono, meta y acciones como elementos **privados** en esta versión; no se exportan ni se especifican aparte. | decisión humana (human:ianache), 2026-10-08 |

### Assumptions and open questions

| ID | Supuesto o pregunta | Efecto |
|---|---|---|
| A-1 | ~~Supuesto: subcomponentes privados dentro de `PackageCard`.~~ **Resuelto por D-8.** | Alcance de `PackageCard` cerrado. |
| Q-1 | ~~Soporte de tema.~~ **Resuelto por D-7:** ambos modos. | Abre Q-8 y Q-9. |
| Q-2 | `PackageSummary.status` es `string`, pero la spec exige un enumerado y tratar un valor desconocido como error. Además `packageStatusLabel` hoy devuelve el valor crudo ante un estado desconocido (fallback silencioso). ¿Cómo se valida en el borde del componente? | Afecta contrato y pruebas. |
| Q-3 | La implementación actual de estado (en `PackageCatalogClient.tsx`) pinta Retirado en rojo y en mayúsculas, contra la regla D-3. ¿Se alinea al integrar? | Fuera de este pack; riesgo de inconsistencia. |
| Q-4 | `PackageSummary` ya expone `skillCount?` y `retiredSkillCount?`. Esto contradice la brecha de `component-traceability-report.md` (que decía que no existía) y responde la pregunta de origen del contador. Falta confirmar si el aviso de Skills retirados usa `retiredSkillCount`. | Menor; confirmar. |
| Q-5 | Copy final de estados, icono de severidad y tokens semánticos oficiales (pendientes en las specs). | Mientras tanto se usan los valores del diseño Stitch. |
| Q-6 | Nombres de props y callbacks propuestos (`onEvent`, etc.) y ubicación `src/components/packages/`. | Se confirman en la revisión de la spec. |
| Q-7 | Propietario de cada componente: por confirmar en las specs. | Necesario para revisión. |
| Q-8 | **Bloqueante.** Los diseños Stitch (`2dd84f1c…`, `db8519d7…`) son solo `SkillVault Light`. No existe referencia visual para el modo oscuro de ninguno de los dos componentes. El proyecto tiene un design system oscuro (`SkillVault`, `assets/9764606991015693018`) pero sin pantallas de estos componentes. ¿Se crean diseños oscuros en Stitch o se deriva el oscuro de los tokens existentes del portal? | Sin referencia oscura, el criterio "implementar contra el diseño" (D-6) no es verificable en ese modo. |
| Q-9 | Estilos: los diseños usan colores fijos; el portal usa variables CSS (`--raised`, `--teal`, `--muted`, etc., con `[data-theme="light"]`). Propuesta (no decidida): estilar con las variables del portal para obtener ambos modos y mapear a ellas los valores del diseño claro. Hay que confirmar el mapeo de los colores de estado de D-3 (verde, gris punteado, neutro) en ambos modos y su contraste. | Define el sistema de estilos de ambos componentes. |
| Q-10 | **Bloqueante, sistema de diseño.** El portal ya tiene un design system versionado en `_ds/skillvault/` (`styles.css`, `readme.md`, importado por `src/app/globals.css`): dirección cálida/editorial, acento marrón/dorado `--sv-accent: #a9772e`, éxito `--sv-teal: #0f9488`, peligro `--sv-danger: #b3392f`, Space Grotesk y JetBrains Mono, tokens para claro (`--sv-bg: #f7f5f0`) y oscuro (`--sv-dark-bg: #16140f`). Los diseños Stitch de estos componentes usan otro sistema (`SkillVault Light`: azul `#2250d4`, grises fríos, Geist e IBM Plex Sans). No coinciden. Esto contradice "tokens oficiales no identificados" de las specs y de `design-token-contract.md`. ¿Cuál es el sistema canónico para `CMP-*`? | Si es `_ds/skillvault`, los diseños Stitch vigentes están fuera de sistema y hay que regenerarlos; Q-8 y Q-9 se reducen a mapear tokens existentes. |

### Risks and dependencies

- **Storybook** no está instalado; su compatibilidad con Next.js 16 / React 19 no está verificada (ADR-005 lo deja abierto). Sin él no hay evidencia de pruebas.
- **Diseños** verificados solo por su código HTML, no visualmente; el diseño de `PackageStatus` es una pantalla nueva (`2dd84f1c…`) creada por una edición, no la original. Hay pantallas duplicadas pendientes de borrar en Stitch.
- **Tema y tokens**: ambos modos soportados (D-7); riesgo de que el modo oscuro no tenga diseño de referencia (Q-8) y de rehacer estilos (Q-9). El contraste de los badges de estado debe cumplir WCAG 2.2 AA en ambos modos.
- **Integración**: la tarjeta cambia el layout de SCR-001 respecto a la tabla actual; no incluida aquí.
- **Dependencia de orden:** `PackageStatus` primero; `PackageCard` lo compone.
- **Seguridad:** la tarjeta renderiza texto escapado; las URL usan el `slug` validado; ningún dato sensible; las decisiones de permisos se quedan en la capa superior.
- **Fallos:** valor de estado inválido (Q-2); texto largo en nombre o descripción; acciones deshabilitadas.
- **Observabilidad:** no aplica (componentes presentacionales sin servicios).
- **Rollout y rollback:** los componentes se añaden sin sustituir la tabla actual, por lo que no afectan a la pantalla hasta una integración posterior; revertir es retirar los archivos nuevos.

## Verification

- Review: pendiente; no existe artefacto de revisión humana de las specs ni de los diseños.
- Traceability: https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/component-traceability-report.md
- Handoff: https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/DSP-2026-002-componentes-ui-paquetes.md
- Cadena de trazabilidad: `US-001` → `UXR-001`/`UXR-002` → `SCR-001` (y `SCR-005` para el estado) → `CMP-ATOM-001`/`CMP-ORG-001` → diseño Stitch → stories y pruebas.
- Test/evidence expectations:
  - Unitarias: todos los estados, valor desconocido, versión ausente, aviso, acciones opcionales.
  - Interacción: activación por teclado y contenido de los eventos.
  - Accesibilidad: estado sin depender del color, contraste, foco visible, nombre, rol y valor.
  - Visual: cada estado y variante contra el diseño Stitch, en móvil y escritorio, y en claro y oscuro (el oscuro sin diseño de referencia: Q-8).
  - Se mantienen `next build` y `tsx --test` existentes.
  - Este pack no aporta evidencia de ejecución.

## Next action

- Owner: por confirmar (Product Owner, UX, Arquitectura y Dev lead).
- Action: (0) resolver Q-10 (sistema de diseño canónico), que condiciona Q-8 y Q-9; (1) resolver Q-8 (diseño oscuro) y Q-9 (mapeo a variables del portal); (2) instalar y verificar Storybook con Next.js 16 / React 19; (3) revisión humana de las 2 specs y los 2 diseños; (4) asignar propietario.
- Gate: pasa a `READY_FOR_DEV` solo cuando Q-8 y Q-9 estén resueltos, Storybook funcione y exista revisión humana registrada; hasta entonces permanece `REQUIRES_REVIEW` y `human-reviewed: false`. D-7 y D-8 ya están decididas.

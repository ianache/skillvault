---
artifact: development-context-pack
okf: google-okf-v0.2
id: DCP-2026-001
title: "Development Context Pack: PackageStatus y PackageCard (oleada 1 de DSP-2026-002)"
generated: "2026-10-08T00:00:00-05:00"
verified: false
status: READY_FOR_DEV
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
- Owner: `human:ianache` para `PackageStatus` y `PackageCard` (decisión humana (human:ianache), 2026-10-09).
- Estado: `READY_FOR_DEV` (2026-10-09): specs y diseños con revisión humana de `human:ianache` y Storybook verificado. Este DCP como documento sigue con `human-reviewed: false`.

## Content

### Objective

Implementar dos componentes React presentacionales en el portal Next.js 16 / React 19 (`ADR-004`), conformes a su especificación **y** a su diseño visual en Stitch, con stories de Storybook (`ADR-005`).

### Included work

**1. `PackageStatus` (CMP-ATOM-001)**
- Props: `value: 'draft' | 'published' | 'retired'`, `version?`, `warning?`, `compact?`. Sin callbacks.
- Píldora `rounded-full`, 12px, icono inicial, nunca solo color: Borrador = gris con borde punteado + `edit_note`; Publicado = verde + `check_circle`; Retirado = neutro + `archive`. El aviso de retiro es una línea ámbar aparte con icono de advertencia, no un color de estado.
- Un valor desconocido es un error visible, no un fallback silencioso (D-14): valida su entrada y muestra el estado de error del diseño; el tipo estricto se aplica en el mapeo desde `PackageSummary.status`.
- Etiquetas localizables: reutilizar `packageStatusLabel` de `src/lib/packages/ui.ts`.
- Compatible con Server Components (sin estado ni eventos).
- Diseño canónico: Stitch `1874775286672335993`, claro `b7be4588b6cf4bb7bb978c5061a3dc0b` y oscuro `aef5a5f1b84c4b57900c216cca0892cb` (design systems del portal).

**2. `PackageCard` (CMP-ORG-001)**
- Props: `package` (identidad, descripción, rol, estado, versión, `skillCount?`), `actions` (`edit`, `duplicate`, `review`, `retire`), `disabled`, `warningText?`. Callback `onEvent(event)` con unión discriminada (`open`, `edit`, `duplicate`, `review`, `retire`) (nombres confirmados, D-16). El aviso de Skills retirados usa `retiredSkillCount` (D-15).
- Variantes `maintenance` y `public-readonly`; estados draft, published, retired con aviso, disabled (acciones deshabilitadas con texto explicativo). El skeleton de carga lo posee el grid, no la tarjeta.
- Compone `PackageStatus`. Elemento semántico `article`, nombre accesible del enlace a partir del nombre del paquete, foco visible, estado con texto, aviso de retiro anunciado.
- Icono, meta (rol y versión) y acciones: elementos privados del mismo archivo, no exportados (D-8).
- Requiere límite de cliente (`"use client"`) por los eventos.
- Diseño canónico: Stitch `1874775286672335993`, claro `ee54232acf3a4329a697efa9a1c40230` y oscuro `9d68e663c80c4b768859ad536998dc97` (design systems del portal).

**3. Transversal**
- Ambos modos (claro y oscuro) en los dos componentes (D-7).
- Stories de Storybook: una por variante y estado de cada spec, en claro y oscuro.
- Pruebas: unitarias de contrato y de estados, interacción y teclado, accesibilidad, y verificación visual contra el diseño Stitch canónico.
- Ubicación confirmada (D-16): `src/components/packages/` (junto a los `*Client.tsx`).

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
| D-2 | Storybook para desarrollar, documentar y probar componentes. Instalado y verificado (2026-10-09): 10.6.1, `@storybook/nextjs-vite`, addons a11y y docs. | ADR-005 |
| D-3 | Regla de estados canónica (píldora, icono, nunca solo color; Retirado neutro; aviso de retiro aparte). | CMP-ATOM-001, registro visual |
| D-4 | Los componentes no importan servicios, router ni APIs; las decisiones de permisos quedan fuera. | CMP-ORG-001, react-component-architecture |
| D-5 | WCAG 2.2 AA es criterio de release. | specs |
| D-6 | Implementar contra spec **y** diseño; no inferir visuales solo de la spec. | specs |
| D-7 | **Se soportan ambos modos (claro y oscuro).** El portal es oscuro por defecto y tiene selector de tema (`data-theme`, `ThemeToggle`). | decisión humana (human:ianache), 2026-10-08 |
| D-8 | `PackageCard` implementa icono, meta y acciones como elementos **privados** en esta versión; no se exportan ni se especifican aparte. | decisión humana (human:ianache), 2026-10-08 |
| D-9 | **Sistema de diseño canónico: `_ds/skillvault`** (acento marrón `#a9772e`, Space Grotesk y JetBrains Mono, tokens claro y oscuro). Los diseños Stitch en el sistema azul "SkillVault Light" quedan como referencia estructural no canónica. | decisión humana (human:ianache), 2026-10-08 |
| D-10 | **Retirado es neutro**, según los diseños (no rojo). Se diferencia de Borrador por borde sólido e icono; el aviso de retiro es una línea ámbar aparte. | decisión humana (human:ianache), 2026-10-08 |
| D-11 | **Estilos en línea con `var(--…)`** del design system del portal, en ambos modos. | decisión humana (human:ianache), 2026-10-08 |
| D-12 | **Token de foco:** anillo de 2px con `--accent` (ya aplicado globalmente por `globals.css`; los componentes no deben anularlo). | decisión humana (human:ianache), 2026-10-08 |
| D-13 | **Responsive con CSS grid y flex intrínsecos** (`repeat(auto-fit, minmax(…))`, `flex-wrap`), sin media queries ni `:hover` en los estilos en línea. Si hiciera falta un breakpoint exacto o un estado hover, se reabre esta decisión. | decisión humana (human:ianache), 2026-10-08 |
| D-14 | **Estado desconocido = error visible.** `PackageStatus` valida su entrada y muestra el estado de error del diseño; no cae al valor crudo ni usa `packageStatusLabel` como fallback. El tipo estricto (`draft` \| `published` \| `retired`) se aplica en el borde, en el mapeo desde `PackageSummary.status` (que es `string`). | decisión humana (human:ianache), 2026-10-09 |
| D-15 | El aviso de Skills retirados de `PackageCard` usa `retiredSkillCount` de `PackageSummary`. | decisión humana (human:ianache), 2026-10-09 |
| D-16 | Se aceptan los nombres propuestos de props y callbacks (`onEvent`, `onFiltersChange`, `onClear`, `onSelectionChange`, `onSaveDraft`) y la ubicación `src/components/packages/`. | decisión humana (human:ianache), 2026-10-09 |

### Assumptions and open questions

| ID | Supuesto o pregunta | Efecto |
|---|---|---|
| A-1 | ~~Supuesto: subcomponentes privados dentro de `PackageCard`.~~ **Resuelto por D-8.** | Alcance de `PackageCard` cerrado. |
| Q-1 | ~~Soporte de tema.~~ **Resuelto por D-7:** ambos modos. | Abre Q-8 y Q-9. |
| Q-2 | ~~Validación del estado y tipo de `PackageSummary.status`.~~ **Resuelto por D-14.** | Contrato y pruebas de `PackageStatus`. |
| Q-3 | ~~Estado Retirado en rojo en la implementación actual.~~ **Resuelto por D-10:** neutro. El catálogo actual (`PackageCatalogClient.tsx`) debe alinearse al integrar; fuera de este pack. | Riesgo de inconsistencia hasta la integración. |
| Q-4 | ~~Origen del contador y aviso de Skills retirados.~~ **Resuelto por D-15:** `PackageSummary.skillCount?` y `retiredSkillCount?` ya existen. | Corrige la brecha de `component-traceability-report.md`. |
| Q-5 | Copy final de estados e icono de severidad del aviso de retiro (pendientes en las specs). Los tokens ya están definidos en `design-token-contract.md`. | Mientras tanto se usan los textos y los iconos del diseño Stitch canónico. |
| Q-6 | ~~Nombres de props/callbacks y ubicación.~~ **Resuelto por D-16.** | Sin cambios pendientes de nomenclatura. |
| Q-7 | ~~Propietario de cada componente.~~ **Resuelto para la oleada 1:** `human:ianache` para `PackageStatus` y `PackageCard`. Siguen "por confirmar" `PackageSearchPanel` y `PackageSkillPicker` (fuera de este pack). | La asignación de propietario no equivale a la revisión humana. |
| Q-8 | ~~Diseños canónicos claro y oscuro.~~ **Resuelto:** 8 pantallas generadas con `SkillVault Portal Light` y `Dark`; verificadas en HTML, revisión visual humana pendiente. | Los ids están en las specs. |
| Q-9 | ~~Estilos y foco.~~ **Resuelto por D-11 y D-12.** | Ver Q-11 y las notas de Storybook. |
| Q-10 | ~~Sistema de diseño canónico.~~ **Resuelto por D-9:** `_ds/skillvault`. | Los diseños Stitch actuales son referencia estructural; se regeneran con los design systems de Stitch creados desde los tokens canónicos. |
| Q-11 | ~~Responsive y hover con estilos en línea.~~ **Resuelto por D-13.** | Sin pendientes de diseño ni de estilos. |
| Q-12 | **Divergencias entre el diseño aprobado de `PackageCard` y la spec.** El diseño muestra: (a) un estado **"Bloqueado"** con icono de candado y una acción **"Reactivar"** para paquetes retirados; (b) en la variante pública, las acciones **"Instalar Paquete"** y **"Ver Ficha"**, un contador de descargas y una valoración (★). La spec solo define los estados `draft \| published \| retired`, las acciones `edit \| duplicate \| review \| retire`, y no define las acciones de la variante pública. Se implementó **lo que dice la spec**; en la variante pública solo se ofrece "Ver ficha" (evento `open`), porque el DSP-2026-001 fija que la instalación es exclusiva del CLI. ¿Se amplía la spec (nuevo estado, acción y datos) o se corrige el diseño? | No bloquea; hasta decidir, esos elementos del diseño no se implementan. |

### Risks and dependencies

- **Storybook** instalado y verificado con Next.js 16.2.10 / React 19.2.4 (2026-10-09). Siguen sin decidir ejecutor de pruebas automatizado, regresión visual y CI (ADR-005).
- **Diseños** canónicos (D-9) verificados solo por su código HTML; los diseños del sistema azul anteriores deben eliminarse en Stitch, no visualmente; el diseño de `PackageStatus` es una pantalla nueva (`2dd84f1c…`) creada por una edición, no la original. Hay pantallas duplicadas pendientes de borrar en Stitch.
- **Estilos en línea**: sin media queries ni `:hover` (D-13); un `outline: 0` anularía el foco global (D-12).
- **Tema y tokens**: ambos modos soportados (D-7); riesgo de que el modo oscuro no tenga diseño de referencia (Q-8) y de rehacer estilos (Q-9). El contraste de los badges de estado debe cumplir WCAG 2.2 AA en ambos modos.
- **Integración**: la tarjeta cambia el layout de SCR-001 respecto a la tabla actual; no incluida aquí.
- **Scripts de prueba:** `pnpm test` solo ejecuta `src/lib/review/*.test.ts`; los tests de `src/lib/packages` (19) no corren con él y se ejecutaron explícitamente con `tsx --test`. Conviene decidir si se añaden al script.
- **Dependencia de orden:** `PackageStatus` primero; `PackageCard` lo compone.
- **Seguridad:** la tarjeta renderiza texto escapado; las URL usan el `slug` validado; ningún dato sensible; las decisiones de permisos se quedan en la capa superior.
- **Fallos:** valor de estado inválido (Q-2); texto largo en nombre o descripción; acciones deshabilitadas.
- **Observabilidad:** no aplica (componentes presentacionales sin servicios).
- **Rollout y rollback:** los componentes se añaden sin sustituir la tabla actual, por lo que no afectan a la pantalla hasta una integración posterior; revertir es retirar los archivos nuevos.

## Verification

- Review: aprobada para las specs `CMP-ATOM-001` y `CMP-ORG-001` y sus 4 diseños: aprobación de `human:ianache`, 2026-10-09, resultado "aprobado" (checklist `RVW-2026-001`; declaración del revisor: "todo es conforme"). Registro en https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/RVW-2026-001-checklist-revision-humana-oleada-1.md. Este DCP como documento sigue sin revisión humana.
- Traceability: https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/component-traceability-report.md
- Handoff: https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/DSP-2026-002-componentes-ui-paquetes.md
- Cadena de trazabilidad: `US-001` → `UXR-001`/`UXR-002` → `SCR-001` (y `SCR-005` para el estado) → `CMP-ATOM-001`/`CMP-ORG-001` → diseño Stitch → stories y pruebas.
- Test/evidence expectations:
  - Unitarias: todos los estados, valor desconocido, versión ausente, aviso, acciones opcionales.
  - Interacción: activación por teclado y contenido de los eventos.
  - Accesibilidad: estado sin depender del color, contraste, foco visible, nombre, rol y valor.
  - Visual: cada estado y variante contra el diseño Stitch canónico, en móvil y escritorio, y en claro y oscuro (el oscuro sin diseño de referencia: Q-8).
  - Se mantienen `next build` y `tsx --test` existentes.
  - Evidencia de la verificación de Storybook y de `PackageStatus` (2026-10-09), en la rama `feat/storybook-package-status` (sin commit):
    - `storybook build` correcto con Next.js 16.2.10 / React 19.2.4; avisos benignos de directiva `use client` y de telemetría.
    - `tsc --noEmit` sin errores y ESLint sin hallazgos en los archivos nuevos.
    - Tests: 19 de `src/lib/packages` y 143 de `pnpm test` pasan; `parsePackageStatus` se escribió test-first (falló antes de existir).
    - Navegador, claro y oscuro: Space Grotesk y JetBrains Mono cargadas; píldora de 20px; Borrador punteado; contraste medido del texto de estado 5,23 / 5,13 / 5,23:1 en claro y 6,64 / 5,49 / 6,64:1 en oscuro (todos por encima de 4,5:1); línea de aviso 5,83:1 en claro; el estado desconocido muestra "Estado desconocido" sin renderizar el valor recibido.
    - `PackageCard` implementado test-first (2026-10-09): `packageCardHref`, `formatSkillCount`, `retiredSkillsNote` y `formatPackageVersion` fallaron antes de existir; 24 tests de `src/lib/packages` pasan. 13 stories (variantes, estados, contenido largo, 360px y rejilla de 3 columnas) y 2 pruebas de interacción con `play`: orden de teclado (enlace del título y luego acciones), eventos `edit` y `retire` con su `slug`, y acciones deshabilitadas que no emiten eventos. Control negativo: forzando acciones deshabilitadas, la prueba de teclado falla y el error aparece en consola.
    - Navegador, `PackageCard`: contraste de todos los textos 5,23 a 16,91:1 en claro y 6,42 a 14,81:1 en oscuro (aviso 5,83 y 7,89:1); sin desbordamiento horizontal a 360px; con teclado real el foco es `solid 2px rgb(169,119,46)` con 2px de separación (anillo global del portal, D-12); rejilla de 3 columnas con `repeat(auto-fit, minmax(300px, 1fr))` (D-13).
    - Pendiente de evidencia: pruebas de interacción y teclado de `PackageStatus`, escaneo de accesibilidad con el addon (no ejecutado) y verificación visual contra el diseño; `PackageCard` implementado (ver evidencia).

## Next action

- Owner: `human:ianache` (propietario de ambos componentes). La revisión humana de specs y diseños debe quedar registrada aparte; roles de apoyo (Product Owner, UX, Arquitectura, Dev lead) por confirmar.
- Action: decidir Q-12 (divergencias del diseño); ejecutar el escaneo del addon a11y sobre las stories; integrar `PackageCard` en el catálogo (fuera de este pack); decidir si los tests de `src/lib/packages` entran en `pnpm test`.
- Gate: cumplido para `READY_FOR_DEV` (revisión humana de specs y diseños registrada; Storybook funcionando con una story de `PackageStatus`). Aprobar este DCP como documento requiere una revisión humana aparte.

---
artifact: review-checklist
okf: google-okf-v0.2
id: RVW-2026-001
title: "Checklist de revisión humana: PackageStatus y PackageCard (oleada 1)"
generated: "2026-10-09T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/implementation/DCP-2026-001-paquetes-ui-oleada-1.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageStatus.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-PackageCard.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/design-token-contract.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/atomic-components/visual-design-registry.md
provenance:
  created_by: development-handoff-builder
  method: derived-from-component-specifications-and-decisions
  confidence: medium
human-reviewed: false
---

# Checklist de revisión humana: PackageStatus y PackageCard

Written for: el propietario (`human:ianache`) que revisó specs y diseños antes de pasar `DCP-2026-001` a `READY_FOR_DEV`.

Esta checklist ayuda a revisar; no es la revisión. Un agente no marca casillas ni establece `human-reviewed: true`. La revisión ocurre cuando una persona completa el registro del final.

## Cómo revisar

1. Abre cada pantalla de Stitch. Los diseños se verificaron solo por su código HTML, así que **nadie ha visto aún las capturas**.
2. Revisa claro y oscuro por separado.
3. Marca cada ítem como cumple, no cumple o no aplica, y anota la desviación.

## Enlaces de diseño (proyecto `1874775286672335993`)

| Componente | Claro | Oscuro |
|---|---|---|
| CMP-ATOM-001 PackageStatus | [b7be4588…](https://stitch.withgoogle.com/projects/1874775286672335993?node-id=b7be4588b6cf4bb7bb978c5061a3dc0b) | [aef5a5f1…](https://stitch.withgoogle.com/projects/1874775286672335993?node-id=aef5a5f1b84c4b57900c216cca0892cb) |
| CMP-ORG-001 PackageCard | [ee54232a…](https://stitch.withgoogle.com/projects/1874775286672335993?node-id=ee54232acf3a4329a697efa9a1c40230) | [9d68e663…](https://stitch.withgoogle.com/projects/1874775286672335993?node-id=9d68e663c80c4b768859ad536998dc97) |

## A. Transversal (ambos componentes, ambos modos)

| # | Comprobación | Fuente |
|---|---|---|
| A1 | Fondo cálido: claro `#f7f5f0`, oscuro `#16140f`; tarjetas blancas / `#221f19` | design-token-contract |
| A2 | Acento marrón `#a9772e`; no hay azul como acento | D-9 |
| A3 | Tipografía: Space Grotesk para la interfaz y JetBrains Mono para versiones, slugs y etiquetas | D-9 |
| A4 | Estados como píldora redondeada de 12px con icono inicial: Borrador gris con borde punteado y `edit_note`; Publicado teal con `check_circle`; Retirado neutro con borde sólido y `archive` | D-3, D-10 |
| A5 | Retirado **no** es rojo ni ámbar; el aviso de retiro es una línea ámbar aparte con icono de advertencia | D-10 |
| A6 | Ningún estado depende solo del color (hay texto e icono) | WCAG 2.2 AA |
| A7 | Foco visible: anillo de 2px con el acento, en cada elemento interactivo | D-12 |
| A8 | Contraste de texto y badges legible en ambos modos (mínimo 4,5:1 para texto, 3:1 para bordes e iconos) | WCAG 2.2 AA |
| A9 | Responsive sin depender de breakpoints exactos (columnas que se adaptan, contenido que no se desborda a 360px) | D-13 |
| A10 | Textos en español y etiquetas de estado coherentes con `packageStatusLabel` (Borrador, Publicado, Retirado) | specs |

## B. CMP-ATOM-001 PackageStatus

| # | Comprobación |
|---|---|
| B1 | Aparecen los 3 estados en tamaño normal y compacto |
| B2 | El sufijo de versión (por ejemplo `v1.2.0`) se muestra en monoespaciada |
| B3 | Aviso de retiro como línea ámbar aparte bajo el badge, no como color del estado |
| B4 | Estado desconocido: se muestra como **error visible**, no como el valor crudo (D-14) |
| B5 | Estado de carga como placeholder |
| B6 | Contenedor de 360px: el contenido se ajusta sin desbordar |
| B7 | La spec y el diseño coinciden en variantes y estados (contrato en `CMP-PackageStatus.md`) |
| B8 | Accesibilidad: `role="status"` o `role="note"` según el contexto; el aviso de retiro se anuncia |

## C. CMP-ORG-001 PackageCard

| # | Comprobación |
|---|---|
| C1 | Contenido de la tarjeta: icono, nombre, descripción, rol, estado, versión, contador de Skills y acciones |
| C2 | Aviso de Skills retirados basado en `retiredSkillCount` (D-15) |
| C3 | Acciones Editar, Duplicar, Revisar y Retirar en la variante de mantenimiento; acciones reducidas en la de solo lectura |
| C4 | Estados: borrador, publicado, retirado con aviso, deshabilitado (acciones inactivas con texto explicativo) y esqueleto de carga |
| C5 | Rejilla de 3 columnas en escritorio y una columna en móvil |
| C6 | Descripción larga y nombre largo no rompen el diseño |
| C7 | Semántica: `article`, nombre accesible del enlace a partir del nombre del paquete, orden de teclado lógico |
| C8 | El icono, el bloque meta y las acciones aparecen como partes de la misma tarjeta (privadas en esta versión, D-8) |
| C9 | La tarjeta contiene `PackageStatus` con el mismo aspecto que en su propia hoja |

## D. Specs

| # | Comprobación |
|---|---|
| D1 | Contrato TypeScript de cada spec vigente; los nombres de props y callbacks son los confirmados (D-16) |
| D2 | Sección "Reconciliación con ADR-004" correcta: React, sin selectores `sv-*`, sin NPM |
| D3 | Los estados y variantes de la tabla de comportamiento coinciden con los del diseño |
| D4 | Propietario correcto (`human:ianache`) |
| D5 | Las preguntas abiertas restantes (Q-5) están aceptadas |

## Limitaciones conocidas de los diseños (no son defectos a corregir en esta revisión)

- Los estilos del diseño usan hexadecimales y clases de Tailwind; el desarrollo debe usar `var(--…)` (D-11).
- Los diseños de Stitch no muestran el anillo de foco global del portal ni estados hover; el foco proviene de `globals.css` (D-12).
- El color de Retirado en el portal actual (rojo, en `PackageCatalogClient.tsx`) cambiará al integrar; fuera de este pack.

## Registro de revisión

| Campo | Valor |
|---|---|
| Revisor | `human:ianache` |
| Fecha | 2026-10-09 |
| Resultado | aprobado |
| Observaciones | Ninguna: el revisor declaró "todo es conforme. Tiene mi aprobación". |
| Componentes cubiertos | CMP-ATOM-001, CMP-ORG-001 |
| Modos revisados | claro y oscuro, según la declaración del revisor |

Registrado por el agente a partir de la declaración del revisor en la conversación; no se completó la tabla casilla por casilla.

## Alcance de la aprobación

- Aprobados: las specs `CMP-PackageStatus.md` y `CMP-PackageCard.md` (`verified: true`) y sus 4 diseños (claro y oscuro).
- No cubiertos: `CMP-ORG-002` y `CMP-ORG-003`, `DCP-2026-001` y `DSP-2026-002` como documentos (siguen con `human-reviewed: false`), y `ADR-005` (`verified: false`).

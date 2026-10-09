---
artifact: visual-design-registry
okf: google-okf-v0.2
id: VDR-001
title: "Visual design registry — paquetes de Skills"
generated:
  by: web-atomic-component-designer/0.3.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
---

# Visual design registry

Cada CMP-* debe enlazar a su diseño en Stitch o Claude Design (`references/visual-design-link-template.md`). Stitch proyecto `1874775286672335993` (SkillVault, design system SkillVault Light). CMP-ATOM-001 y los 3 organismos con spec tienen diseño; el resto está `pending`. Duplicados sin uso a eliminar en Stitch: SearchPanel `2568125a3b5349baa1c7bf79d6a14f33`; SkillPicker `03bff45a0fec48fa932d471d0f671d14`; PackageCard `9834137732064cdfafa4254ed53c6124`, `d8eb3fa8982d464799b67312eefa9a89`, `dbabe18c61244b2895f234a4e6e14e38`; PackageStatus `669d4feb3b9e48e9851750e8eb64c379`; SearchPanel `1a3f07cd786c4642b8eea0e87252df32`. No se han inventado ids.

| CMP-ID | Nivel | Spec | Herramienta | Project / screen | Estado |
|---|---|---|---|---|---|
| CMP-ATOM-001 | atom | components/CMP-PackageStatus.md | stitch | 1874775286672335993 / 2dd84f1ca2ef4ec0b6edeba82e8ff05d | pending — regenerar con DS canónico (el id actual es referencia no canónica) |
| CMP-ATOM-002 | atom | falta spec | por decidir | — | pending |
| CMP-ATOM-003 | atom | falta spec | por decidir | — | pending |
| CMP-MOL-001 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-002 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-003 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-004 | molecule | falta spec | por decidir | — | pending |
| CMP-ORG-001 | organism | components/CMP-PackageCard.md | stitch | 1874775286672335993 / db8519d701bc4a8e9c735ff190a21b6c | pending — regenerar con DS canónico (el id actual es referencia no canónica) |
| CMP-ORG-002 | organism | components/CMP-PackageSearchPanel.md | stitch | 1874775286672335993 / 95553adaab1d43939d07ad2cb9a224b6 | pending — regenerar con DS canónico (el id actual es referencia no canónica) |
| CMP-ORG-003 | organism | components/CMP-PackageSkillPicker.md | stitch | 1874775286672335993 / 652b2f937ad744e38cdb07334bfa1437 | pending — regenerar con DS canónico (el id actual es referencia no canónica) |
| CMP-ORG-004 | organism | falta spec | por decidir | — | pending |
| CMP-TPL-001 | template | falta spec | por decidir | — | pending |
| CMP-PAGE-001 | page | falta spec | por decidir | — | pending |

URL base: `https://stitch.withgoogle.com/projects/1874775286672335993?node-id=<screen_id>`

## Acciones pendientes

0. Eliminar en Stitch los duplicados listados arriba.

1. Decidir herramienta (Stitch o Claude Design; este último requiere `/design-login`).
2. Crear los diseños y actualizar `visual_design` en cada spec y esta tabla.
3. Redactar las 9 specs faltantes (ya con bloque `visual_design`).

## Consistencia entre diseños (2026-10-08)

Regla canónica de estados (fuente: CMP-ATOM-001): píldora `rounded-full`, 12px, icono inicial, nunca solo color. Borrador = slate con borde punteado + `edit_note`; Publicado = emerald + `check_circle`; Retirado = neutral + `archive`. El aviso de retiro es una línea ámbar aparte.

| CMP | Estado tras regenerar (verificado en HTML) |
|---|---|
| CMP-ATOM-001 `2dd84f1c…` | Corregido: tokens SkillVault Light, IBM Plex Sans. |
| CMP-ORG-001 `db8519d7…` | Corregido (v2): badges canónicos, IBM Plex, foco #2250d4. |
| CMP-ORG-002 `95553ada…` | Enlazada por el usuario (v2): opciones de estado y roles correctos, chips canónicos; **sin carga de IBM Plex Sans y sin estilos de foco**. La alternativa `2568125a…` sí los tiene. |
| CMP-ORG-003 `652b2f93…` | Corregido (v3): badges canónicos (hex), IBM Plex, foco #2250d4, aviso de retiro aparte, con Borrador. Reemplaza a `03bff45a…`. |

Pendiente general: revisión visual humana de las 4 pantallas (solo se verificó el código HTML).

## Modo oscuro

decisión humana (human:ianache), 2026-10-08: los componentes soportan claro y oscuro. Todos los diseños Stitch vigentes son solo `SkillVault Light`; falta referencia visual para el modo oscuro de los 4 componentes (el proyecto tiene el design system oscuro `SkillVault`, `assets/9764606991015693018`, sin pantallas de estos componentes).

## Sistema de diseño canónico (decisión humana (human:ianache), 2026-10-08)

`_ds/skillvault` es el sistema canónico. Design systems de Stitch creados desde sus tokens: **SkillVault Portal Light** (`assets/9009552743441703194`) y **SkillVault Portal Dark** (`assets/12691038429936688410`). Los diseños de la tabla anterior usan el sistema azul "SkillVault Light" y no son canónicos; se regeneran en claro y oscuro. Mientras tanto las specs quedan con `visual_design.status: pending`.

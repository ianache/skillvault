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

Cada CMP-* debe enlazar a su diseño en Stitch o Claude Design (`references/visual-design-link-template.md`). Stitch proyecto `1874775286672335993` (SkillVault, design system SkillVault Light). CMP-ATOM-001 y los 3 organismos con spec tienen diseño; el resto está `pending`. Pantallas no canónicas a eliminar en Stitch: ver la lista de "Consistencia entre diseños".

| CMP-ID | Nivel | Spec | Herramienta | Project / screen | Estado |
|---|---|---|---|---|---|
| CMP-ATOM-001 | atom | components/CMP-PackageStatus.md | stitch | 1874775286672335993 / claro `b7be4588b6cf4bb7bb978c5061a3dc0b`, oscuro `aef5a5f1b84c4b57900c216cca0892cb` | linked (diseño canónico; revisado por human:ianache, 2026-10-09) |
| CMP-ATOM-002 | atom | falta spec | por decidir | — | pending |
| CMP-ATOM-003 | atom | falta spec | por decidir | — | pending |
| CMP-MOL-001 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-002 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-003 | molecule | falta spec | por decidir | — | pending |
| CMP-MOL-004 | molecule | falta spec | por decidir | — | pending |
| CMP-ORG-001 | organism | components/CMP-PackageCard.md | stitch | 1874775286672335993 / claro `ee54232acf3a4329a697efa9a1c40230`, oscuro `9d68e663c80c4b768859ad536998dc97` | linked (diseño canónico; revisado por human:ianache, 2026-10-09) |
| CMP-ORG-002 | organism | components/CMP-PackageSearchPanel.md | stitch | 1874775286672335993 / claro `56719e4f643d400e95bc6252657b9666`, oscuro `af91096679544801a9ef8918f7ede828` | linked (diseño canónico; revisión humana pendiente) |
| CMP-ORG-003 | organism | components/CMP-PackageSkillPicker.md | stitch | 1874775286672335993 / claro `21ff5a2089e24deb886c2d1506985c82`, oscuro `ef6203dda288420090f3b991a025bd44` | linked (diseño canónico; revisión humana pendiente) |
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

Los 8 diseños vigentes (4 claros y 4 oscuros) se generaron con los design systems de Stitch creados desde `_ds/skillvault` y cumplen, según el HTML, la regla de estados: píldora con icono y etiqueta, Borrador punteado, Publicado teal, Retirado neutro, aviso de retiro aparte. Revisión visual humana: aprobados `CMP-ATOM-001` y `CMP-ORG-001` (`human:ianache`, 2026-10-09); pendientes `CMP-ORG-002` y `CMP-ORG-003`.

### Diseños en el sistema azul de Stitch (no canónicos, descartar)

- `2dd84f1ca2ef4ec0b6edeba82e8ff05d`
- `669d4feb3b9e48e9851750e8eb64c379`
- `db8519d701bc4a8e9c735ff190a21b6c`
- `9834137732064cdfafa4254ed53c6124`
- `d8eb3fa8982d464799b67312eefa9a89`
- `dbabe18c61244b2895f234a4e6e14e38`
- `95553adaab1d43939d07ad2cb9a224b6`
- `2568125a3b5349baa1c7bf79d6a14f33`
- `1a3f07cd786c4642b8eea0e87252df32`
- `652b2f937ad744e38cdb07334bfa1437`
- `03bff45a0fec48fa932d471d0f671d14`
- `b220ab2518e94b3e80b06f5ff19b4d72`

## Sistema de diseño canónico (decisión humana (human:ianache), 2026-10-08)

`_ds/skillvault` es el sistema canónico. Design systems de Stitch creados desde sus tokens: **SkillVault Portal Light** (`assets/9009552743441703194`) y **SkillVault Portal Dark** (`assets/12691038429936688410`). Los diseños de la tabla anterior usan el sistema azul "SkillVault Light" y no son canónicos; se regeneran en claro y oscuro. Las specs quedan con `visual_design.status: linked` apuntando a los diseños canónicos.

---
artifact: development-scope-pack
okf: google-okf-v0.2
id: DSP-2026-001
title: "Paquetes de Skills por rol: catálogo, consumo público y UX/UI"
generated: "2026-10-07T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/ux-requirements/UXR-002-mantenimiento-paquete.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/ux-requirements/UXR-003-instalacion-independiente.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/ux-requirements/UXR-004-versiones-y-ejecucion.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/components/CMP-001-paquetes-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-003-revision-publicacion-paquete.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-004-catalogo-publico-paquetes.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-005-detalle-paquete-publico.md
  - https://github.com/ianache/skillvault/blob/master/knowledge-base/design/screens/SCR-006-progreso-resultado-instalacion.md
provenance:
  created_by: development-scope-pack-builder
  method: derived-from-rcp-user-stories-and-ux-specifications
  confidence: medium
human-reviewed: false
scope_state: DRAFT
sprint:
  id: null
  name: null
---

# Paquetes de Skills por rol: catálogo, consumo público y UX/UI

## Scope and Identity

- Scope ID: `DSP-2026-001`
- Product: `SkillVault`
- Scope state: `DRAFT`
- Sprint: No asignado; alcance candidato para planificación Scrum.
- UX/UI status: artefactos `UXR`, `FLW`, `SCR` y `CMP` en `draft`, pendientes de revisión humana.

## Objective

Delimitar el desarrollo candidato para mantener paquetes de Skills por rol, permitir su consulta y consumo público, y proporcionar una especificación UX/UI trazable para orientar la solución sin convertir exploraciones visuales en diseño gobernado.

## Source RCPs

- `RCP-2026-10-05-SKILLS-PACKAGES` — Catálogo de paquetes de Skills relacionados por rol.

## Included User Stories

- `US-001` — Catálogo de paquetes de Skills por rol.
  - Source: [US-001](https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md)
- `US-002` — Consultar, instalar, descargar y ejecutar un paquete público de Skills.
  - Source: [US-002](https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md)

## Included UX/UI Specification

La cadena de diseño incluida en este DSP es:

`US-001/US-002 → UXR-001..UXR-004 → FLW-001/FLW-002 → SCR-001..SCR-006 → CMP-001`

### UX Requirements

- `UXR-001`: descubrir y comprender paquetes, estados, versiones y Skills retirados.
- `UXR-002`: mantener identidad, rol y referencias canónicas del paquete.
- `UXR-003`: mostrar instalación independiente por Skill y rollback transaccional.
- `UXR-004`: representar políticas `pinned`/`latest` y ejecución individual por Skill.

### User Flows

- `FLW-001`: mantenimiento por usuarios `author` o `admin`; incluye `SCR-001`, `SCR-002` y `SCR-003`.
- `FLW-002`: consulta, descarga e instalación pública; incluye `SCR-004`, `SCR-005` y `SCR-006`.

### Screen Specifications

- Mantenimiento: `SCR-001` catálogo, `SCR-002` editor, `SCR-003` revisión/publicación.
- Consumo: `SCR-004` catálogo público, `SCR-005` detalle, `SCR-006` progreso/resultado de instalación.
- Cada screen declara estados, responsive, WCAG 2.2 AA, requisitos de teclado, componentes y preguntas abiertas.

### Component Set

- `CMP-001` define los componentes candidatos `CMP-PackageCard`, `CMP-PackageStatus`, `CMP-SkillReferenceList`, `CMP-PackageEditor`, `CMP-InstallProgress`, `CMP-InstallResult`, `CMP-RetiredSkillWarning` y `CMP-VersionPolicy`.

## Excluded Work

- Crear o modificar el contenido interno de Skills individuales.
- Incorporar `af-requirements-orchestrator` al registro o al paquete.
- Resolver automáticamente incompatibilidades, dependencias u orden de ejecución entre Skills.
- Asignar el DSP a un Sprint o comprometer una fecha de entrega.
- Crear automáticamente un proyecto Stitch o aprobar un diseño visual gobernado.
- Implementar componentes UI antes de revisar y aprobar las especificaciones UX/UI.

## Dependencies and Constraints

- Dependencia funcional: `US-002` depende de que `US-001` produzca un paquete publicado.
- Las referencias deben apuntar a Skills canónicos existentes; el nombre confirmado para el modelo conceptual es `af-conceptual-model-designer`.
- El mantenimiento corresponde a usuarios con rol Keycloak `author` o `admin`.
- El paquete puede conservar un dato de propietario o equipo para atribución, pero no se usa para restringir el acceso.
- Cualquier usuario puede consultar y descargar paquetes y Skills publicados.
- La relación paquete–Skill es de pertenencia; orden, dependencia y obligatoriedad quedan fuera del alcance actual.
- La instalación procesa cada Skill de forma independiente según su harness y ruta destino.
- La instalación de paquetes es exclusiva desde el CLI; la UI web no modifica el filesystem local.
- Si falla un Skill, la operación completa se detiene y revierte lo instalado previamente.
- El paquete puede usar versiones `pinned` o `latest` según su configuración.
- Los Skills retirados se omiten del contenido instalable y se muestra una advertencia visible.
- La ejecución se solicita individualmente por Skill; no existe ejecución del paquete como conjunto.
- Estados previstos: `draft`, `published`, `published_with_deprecated_or_retired_skills` y `retired`.
- Publicación, auditoría y versionado del paquete deben seguir las reglas aplicadas a Skills individuales.
- La distribución del paquete debe ofrecer manifiesto JSON y ZIP.
- El ZIP debe contener el JSON de metadatos del paquete y un ZIP independiente por cada Skill instalable; los Skills retirados se omiten y generan una advertencia visible.
- El CLI debe resolver `global` hacia la ruta global del harness y `project` hacia la ruta local inferida desde el directorio de ejecución, mostrando la ruta y solicitando confirmación antes de escribir.
- Si existen archivos destino, el CLI debe informar el conflicto y solicitar confirmación de sobreescritura o usar la opción explícita de fuerza disponible; ante incompatibilidad debe informar y permitir continuar o abortar.
- La activación posterior depende de la descripción y metadatos de cada `SKILL.md`; no forma parte de una operación web separada.
- Los registros operativos de instalación se retienen 7 días; las consultas/exportaciones de auditoría se retienen indefinidamente y quedan reservadas al rol `admin`.
- Las instalaciones del CLI son anónimas. Las descargas deben registrar actor autenticado o `anonymous`, fecha/hora, origen IP, paquete, Skill, versión y formato.
- No se limita el tamaño de las descargas; se propone un máximo configurable de 10 descargas por IP cada 30 minutos, sin pantalla UI de configuración en este alcance.
- Los artefactos UX/UI deben conservar tokens semánticos, WCAG 2.2 AA y preguntas abiertas explícitas.
- El gate UX preflight requiere un proyecto Stitch gobernado activo para explorar/generar diseño externo; ningún agente puede crearlo por sí mismo.

## QA and Acceptance Evidence

- `US-001/AC-1` a `US-001/AC-3`: validar mantenimiento, referencias canónicas y rechazo de referencias inválidas.
- `US-002/AC-1`: validar consulta pública de paquetes publicados con rol, composición, estado y versión.
- `US-002/AC-2`: validar descarga e instalación independiente por Skill, incluyendo detención y rollback ante fallo.
- `US-002/AC-3`: validar que la ejecución se ofrezca individualmente y no como ejecución del paquete.
- UX: comprobar trazabilidad `US → UXR → FLW → SCR`, estados default/loading/empty/error/disabled aplicables, responsive y WCAG 2.2 AA.
- UX: revisar que las advertencias de Skills retirados no dependan solo del color y que rollback/fallo sean anunciados de forma accesible.
- Evidencia requerida: pruebas automatizadas y/o manuales trazadas a US/AC y revisión humana UX/PO/Arquitectura. No existe evidencia de ejecución aportada por este DSP.

## Provider Handoff

El equipo de desarrollo/QA recibe un alcance candidato, no una autorización de implementación. Debe:

- Implementar únicamente US-001 y US-002 dentro de los límites anteriores.
- Consumir UXR, FLW, SCR y CMP como especificación UX/UI en revisión, no como aprobación visual final.
- Mantener trazabilidad `RCP → US → UXR → FLW → SCR/CMP → cambio → prueba/evidencia`.
- Elevar preguntas abiertas de UX, harness, rollback y Design System antes de comprometer una solución.
- Documentar desviaciones y solicitar revisión para cualquier cambio de alcance.
- No asignar Sprint ni marcar el DSP como listo sin revisión humana.

## Open Questions and Blockers

- Mensajes de rollback y rollback incompleto.
- Implementar el esquema de auditoría con los campos confirmados, sin datos adicionales.
- Implementar la extensión del flujo de revisión para aceptar `resourceType: package` y `resourceType: skill`.
- Regla para guardar borradores vacíos o sin rol.
- Copy y severidad visual para Skills retirados y versiones `pinned`/`latest`.
- Design System y tokens semánticos oficiales para los SCR.
- No existe un proyecto Stitch gobernado activo para `DSP-2026-001`; el preflight UX permanece bloqueado para exploración externa.
- El DSP debe permanecer en `DRAFT`/`REQUIRES_REVIEW` hasta completar revisión humana y resolver los bloqueos aplicables.

## Definition of Ready

- Las historias incluidas tienen IDs estables, URLs fuente y criterios de aceptación identificables.
- La cadena UX/UI `US → UXR → FLW → SCR → CMP` es resoluble.
- Las exclusiones, dependencias y restricciones están revisadas.
- Las preguntas bloqueantes de instalación, rollback, Design System y contenido UX tienen respuesta aprobada o un plan explícito.
- Dev, QA, UX y Arquitectura conocen sus responsabilidades y la evidencia esperada.
- Existe decisión humana sobre si y cuándo crear/reutilizar un proyecto Stitch gobernado.

## Definition of Done

- Las User Stories incluidas cumplen sus criterios de aceptación.
- Las pruebas y evidencias requeridas están disponibles.
- Se preserva la trazabilidad `RCP → User Story → UXR → FLW → SCR/CMP → evidencia de entrega`.
- Las reglas de publicación, versionado, instalación, descarga, rollback y ejecución individual están documentadas y aprobadas.
- Las especificaciones UX/UI pasan revisión humana; cualquier diseño externo queda registrado como referencia y no sustituye al artefacto canónico.
- No se han introducido cambios fuera del alcance sin una nueva revisión del DSP.

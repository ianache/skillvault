---
type: changelog
id: KB-CHANGELOG
title: Changelog de la base de conocimiento
status: draft
generated:
  by: architecture-adr-writer/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - knowledge-base/index.md
---

# Changelog

## 2026-10-08 — ADR-005 y reconciliación con ADR-004

- Alta de `architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md`: Storybook para las pruebas de componentes UI (decisión de `human:ianache`; `verified: false` hasta revisar el texto).
- `implementation/DSP-2026-002-componentes-ui-paquetes.md` y `design/components/CMP-Package{Status,Card,SearchPanel,SkillPicker}.md` reconciliados con ADR-004 (React) y ADR-005 (Storybook).
- Actualización de `index.md`.
- Alta de `design/atomic-components/react-component-architecture.md` y `component-module-contract.md`, que reemplazan a `angular-library-architecture.md` y `npm-package-contract.md` (marcados `lifecycle: superseded`, sin borrarlos).
- Alta de `implementation/DSP-2026-002-componentes-ui-paquetes.md` en el índice (faltaba).
- Decisión Q-10 (opción A, decisión humana (human:ianache), 2026-10-08): sistema de diseño canónico `_ds/skillvault`. Reescrito `design-token-contract.md`; specs `CMP-Package*` a `visual_design.status: pending`; `DCP-2026-001`, `DSP-2026-002` y registro actualizados; design systems de Stitch `assets/9009552743441703194` y `assets/12691038429936688410` creados.
- `CMP-ORG-002` enlazado al diseño Stitch v2 `95553adaab1d43939d07ad2cb9a224b6` indicado por el usuario (spec, registro visual y DSP-2026-002); desviaciones anotadas (IBM Plex Sans y foco).
- `CMP-ORG-003` enlazado al diseño Stitch v3 `652b2f937ad744e38cdb07334bfa1437` (spec, registro visual y DSP-2026-002).
- Decisiones humanas registradas en `DCP-2026-001`, `DSP-2026-002`, specs y registro visual: ambos modos de tema (claro y oscuro) y subcomponentes privados de `PackageCard`.
- Alta de `implementation/DCP-2026-001-paquetes-ui-oleada-1.md`: Development Context Pack de `CMP-ATOM-001` y `CMP-ORG-001` (`REQUIRES_REVIEW`).
- Skill `web-atomic-component-designer` 0.4.0: neutral al framework (se toma de la ADR aceptada), sección `## Component contract` en lugar de `## Angular contract`, nueva plantilla `component-module-contract-template.md`; el validador acepta ambos encabezados.
- Specs `CMP-Package*.md`: encabezado renombrado a `## Component contract`.
- Reconciliación con ADR-004/ADR-005 de `ui-inventory.md`, `micro-ui-boundary-analysis.md`, `component-traceability-report.md`, `atomic-component-catalog.md`, `visual-test-matrix.md` y `accessibility-matrix.md`.

## 2026-10-08 — ADR-004

- Alta de `architecture/adrs/ADR-004-nextjs-react-frontend-web.md`, que formaliza el uso de Next.js sobre React para el frontend web.
- Aprobación humana de ADR-004 por `human:ianache`; se establece `verified: true`.
- Actualización de `index.md` para reflejar la aprobación y verificación de la ADR.

## 2026-10-08

- Alta de la extracción Atomic Design de componentes para paquetes de Skills: inventario UI, catálogo atómico, análisis de frontera frontend, especificaciones de `PackageCard`, `PackageStatus`, `PackageSearchPanel` y `PackageSkillPicker`, contratos de tokens/Angular/NPM, matrices de accesibilidad y pruebas visuales, y reporte de trazabilidad. Todos quedan en `REQUIRES_REVIEW` por falta de decisiones sobre Angular, Design System, tokens, ownership y publicación.

## 2026-10-07

- Actualización de `implementation/DSP-2026-001-paquetes-skills-por-rol.md`: incorporación explícita de la especificación UX/UI `US → UXR → FLW → SCR → CMP`, gates de revisión y dependencia de proyecto Stitch gobernado.
- Alta de UXR-001..UXR-004, FLW-001..FLW-002, CMP-001 y SCR-001..SCR-006 derivados de DSP-2026-001; todos quedan en `status: draft` y con revisión humana pendiente.

- Alta de `implementation/DSP-2026-001-paquetes-skills-por-rol.md` como alcance candidato derivado de RCP-2026-10-05-SKILLS-PACKAGES, US-001 y US-002; queda pendiente de revisión humana y conserva los bloqueos técnicos de US-002.

- IMD-001: documentadas respuestas propuestas para IM-Q3 (auditoria por identidad de usuario) e IM-Q5 (snapshot de version inmutable, referencias fijadas y ejecucion independiente por Skill).
- IMD-001 mantiene las compuertas humanas para cardinalidad y retencion de auditoria, reintentos, compensacion y artefactos no disponibles.
- IMD-001: decision humana para IM-Q3 — registrar quien creo y quien mantiene cada paquete.

## 2026-10-05

- Actualización de IMD-001 y RCP: se confirmó la cardinalidad M:N entre usuario y `Role`; la revisión de implementación encontró Drizzle con `users.roles` como JSON y no Prisma ni tabla intermedia.
- Actualización del modelo conceptual por respuestas IM-Q1..IM-Q6: asociación `Role`–paquete solo conceptual, acceso e instalación independiente de roles, relación Skill–paquete M:N y todos los conceptos candidatos al glosario.
- Corrección terminológica: el concepto se denomina únicamente `Role`; se eliminó la calificación anterior no canónica.
- Actualización del RCP, US-001 e IMD-001 con las respuestas humanas: mantenimiento por roles Keycloak `author`/`admin`, catálogo público, pertenencia como única relación y estado `published_with_deprecated_or_retired_skills`.
- Alta de `requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md` para consultar, instalar, descargar y ejecutar paquetes públicos; quedan abiertas las decisiones técnicas de empaquetado, ejecución, versiones y fallos parciales.
- Actualización de `business/information-model/IMD-001-skill-packages.md`: incorporación de `USUARIO` y `ROL_KEYCLOAK`, reglas de ciclo de vida y relación de pertenencia.
- Alta del modelo conceptual `business/information-model/IMD-001-skill-packages.md`; validación estructural: 4 conceptos, 5 relaciones, 0 errores y 0 avisos.
- Alta del Requirement Context Pack `requirements/context-packs/RCP-2026-10-05-skills-packages.md` y de la User Story `requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md` para el catálogo de paquetes de Skills relacionados por rol.
- Alta de README OKF v0.2 en las siete categorías disciplinares de `knowledge-base`, con inventario de Skills registrados y contenido esperado.
- Actualización de los Skills de arquitectura y Skills relacionados para enrutar nuevos artefactos OKF v0.2 a `knowledge-base/` por disciplina: `business`, `requirements`, `architecture`, `design`, `testing`, `implementation` y `deployment`.
- Alta de `architecture/architecture-discovery-brief-2026-10-05.md`.
- Alta de `architecture/adrs/ADR-001-rbac-por-capacidades-y-middleware.md` en estado `Propuesto`.
- Alta de `architecture/adrs/ADR-002-doble-control-en-aprobacion-de-skills.md` en estado `Propuesto`.
- Alta de `architecture/adrs/ADR-003-sincronizacion-de-roles-keycloak-db-local.md` en estado `Propuesto`.
- Alta de `index.md` y `changelog.md` para mantener el inventario de la base de conocimiento.
- 2026-10-08 — Alta de `implementation/TD-2026-001-diseno-tecnico-paquetes-skills.md` para traducir DSP-2026-001 a un diseño técnico candidato; permanece en `REQUIRES_REVIEW` y conserva preguntas abiertas sobre instalación local, propiedad, manifiesto, harnesses y migración.
- 2026-10-08 — Actualización de `TD-2026-001` y `DSP-2026-001`: se registran decisiones humanas sobre instalación exclusiva por CLI, propiedad compartida por equipo, retención operativa de 7 días, distribución JSON+ZIP y aprobación del modelo/estados; se amplían las precisiones pendientes del contrato por harness y auditoría.
- 2026-10-08 — Alta de `implementation/API-2026-001-contrato-paquetes-skills.md`: contrato API candidato para mantenimiento, revisión, catálogo público y descargas JSON/ZIP de paquetes; la instalación permanece exclusiva del CLI y el artefacto queda en `REQUIRES_REVIEW`.
- 2026-10-08 — Actualización de `API-2026-001`, `TD-2026-001` y `DSP-2026-001` con evidencia de las APIs actuales, sincronización Keycloak→`users`, CLI sin login, auditoría indefinida exclusiva de `admin`, ausencia de límite de tamaño y rate limit propuesto de 10 descargas por IP cada 30 minutos configurable en BD.
- 2026-10-08 — Actualización de `API-2026-001`, `TD-2026-001` y `DSP-2026-001` con las respuestas de cierre: rutas actuales por harness verificadas en el CLI, `project` inferido desde `process.cwd()` con confirmación, ZIP con un ZIP por Skill y JSON de metadatos, conflictos de sobreescritura e incompatibilidades informados interactivamente, activación gobernada por `SKILL.md`, membresía de equipos con fuente Keycloak e instalaciones anónimas con auditoría de descargas.
- 2026-10-08 — Actualización transversal de `API-2026-001`, `TD-2026-001` y `DSP-2026-001`: se elimina la dependencia de membresía/capacidades de equipo; cualquier usuario puede consultar y descargar paquetes publicados, el mantenimiento usa roles/capacidades de plataforma, se confirma el conjunto mínimo de auditoría y se establece como requisito extender el flujo de revisión para aceptar `resourceType: package`.
- 2026-10-08 — Cierre de las preguntas individualizadas de `API-2026-001`: advertencia visual con `⚠️` ante incompatibilidad, sin control de equipos, auditoría sin campos adicionales y aceptación de `resourceType: "package" | "skill"` en el flujo de revisión.
- 2026-10-08 — Alta de `implementation/IMP-2026-001-diseno-implementacion-paquetes-skills.md` como especificación candidata para implementar DSP-2026-001; queda pendiente de revisión humana antes de generar el plan detallado y modificar código.
- 2026-10-08 — Alta de `implementation/PLN-2026-001-plan-implementacion-paquetes-skills.md` como plan TDD candidato para implementar IMP-2026-001; queda pendiente de revisión humana antes de modificar código.
- 2026-10-08 — Inicio de implementación de `DSP-2026-001` conforme a `IMP-2026-001` y `PLN-2026-001`: migraciones/esquemas de paquetes, validación y serialización JSON/ZIP, revisión polimórfica, APIs públicas/administrativas, auditoría/rate limit, CLI de instalación y pantallas iniciales; permanece pendiente el cierre de verificación integral y revisión final.

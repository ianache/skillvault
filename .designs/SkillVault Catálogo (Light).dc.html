# SkillVault — Design Doc

**Autor:** UX/UI · **Estado:** Draft · **Última actualización:** 2026-07-19

## 1. Resumen

SkillVault es la plataforma de catálogo de skills para agentes AI (harness). Este documento define el sistema de diseño visual usado en la pantalla de Dashboard/Login y sirve como referencia para implementación y futuras pantallas.

## 2. Contexto y objetivo

- **Problema:** el equipo necesita una interfaz consistente para explorar el catálogo de skills, ver métricas de adopción y autenticarse vía SSO.
- **Objetivo:** estandarizar tokens visuales (color, tipografía, espaciado, componentes) para que cualquier pantalla nueva de SkillVault sea consistente sin reinventar decisiones de estilo.
- **No-objetivos:** este documento no cubre arquitectura de backend, modelo de datos ni lógica de autenticación Keycloak.

## 3. Principios de diseño

1. **Denso pero legible** — dashboard técnico para desarrolladores; prioriza datos sobre decoración.
2. **Oscuro por defecto** — superficie oscura tipo "vault" con acentos cálidos que comunican valor/curaduría.
3. **Monoespaciado para datos** — cualquier cifra, métrica o identificador usa fuente monoespaciada; el resto usa la fuente de interfaz.

## 4. Tokens visuales

### 4.1 Color

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0b0d10` | Fondo general de la app |
| `--sidebar-bg` | `#101317` | Fondo del panel lateral |
| `--surface` | `#14181d` | Tarjetas (KPIs, listas) |
| `--surface-alt` | `#161b24` | Botones secundarios |
| `--border` | `#1f242b` | Bordes de tarjetas y separadores |
| `--border-strong` | `#232830` | Bordes de controles interactivos |
| `--text` | `#f2f0ea` | Texto primario |
| `--text-dim` | `#8b9099` | Texto secundario / labels |
| `--text-faint` | `#5b616b` | Texto terciario / metadata |
| `--accent-gold` | `#cfa554` | Acento primario (marca, iconos activos, CTAs) |
| `--accent-teal` | `#4fd1c5` | Acento secundario (datos positivos, estado operativo) |
| `--accent-indigo` | `#8f94ff` | Acento terciario (categoría de dato: contribuyentes) |

### 4.2 Tipografía

| Uso | Fuente | Peso | Tamaño |
|---|---|---|---|
| Display / UI (headings, nav, botones) | Space Grotesk | 500–700 | 13.5–28px |
| Datos / métricas / monoespaciado | JetBrains Mono | 400–600 | 11–26px |

- Line-height ajustado (`1` a `1.3`) para densidad de dashboard.
- `letter-spacing: -0.01em` en headings grandes.

### 4.3 Espaciado y radios

- Grid base: **4px**.
- Padding de tarjeta: `20px` (comfortable) / `16px` (compact, vía tweak de densidad).
- Radio de tarjetas: `12px`. Radio de controles pequeños (íconos, botones): `7–9px`.
- Gap estándar entre elementos de layout: `16–18px`.

## 5. Layout

- **Estructura de dos paneles:** sidebar fijo (264px) + contenido principal fluido (`max-width: 1400px`).
- Sidebar: logo, navegación vertical, CTA de login SSO, panel de versión/estado — todo centrado verticalmente en el viewport.
- Contenido principal: grid de KPIs (`repeat(auto-fit, minmax(190px,1fr))`) + 3 columnas de "Top 5" (`repeat(auto-fit, minmax(300px,1fr))`).

## 6. Componentes

| Componente | Descripción |
|---|---|
| **Logo mark** | Módulo hexagonal dorado sobre fondo degradado, representa un "paquete de skill" en el repositorio. |
| **Nav item** | Fila ícono + label, estado activo con fondo `rgba(accent-gold, 0.12)` y color de ícono/texto en acento. |
| **Botón SSO Keycloak** | Botón secundario con ícono de llave, fondo `--surface-alt`, hover `#1b212b`. |
| **Panel de versión/estado** | Card pequeña en la base del sidebar: versión (`vX.Y.Z`, mono) + label "Status" + indicador circular de 9px (color `--accent-teal`, halo `rgba(accent-teal,0.18)`) para estado operacional agregado de servicios. |
| **KPI card** | Ícono en badge de color, valor grande monoespaciado, label secundario, delta opcional (`+N`, color teal). Animación de entrada `fadeUp` escalonada. |
| **Top-5 list card** | Título + filas rank/nombre/valor + barra de progreso relativa al máximo del set. |

## 7. Estados e interacción

- Hover en botones: oscurecimiento sutil de fondo + borde más claro.
- Delta positivo: chip teal translúcido.
- Estado operacional: punto sólido con halo (`box-shadow`) — verde/teal = operativo. (Variantes ámbar/rojo pendientes de definir para incidentes parciales/totales.)

## 8. Accesibilidad

- Contraste texto primario sobre fondo oscuro: alto (>10:1).
- Contraste texto secundario (`--text-dim` sobre `--surface`): validar en implementación (~4.6:1, cumple AA para texto normal).
- Objetivo pendiente: foco visible (`:focus-visible`) en botones y nav items — no definido aún en esta iteración.

## 9. Abierto / próximos pasos

- Definir variantes de color del indicador de estado para incidentes (ámbar, rojo).
- Extender el sistema a pantallas de detalle (Top Desarrolladores, Top Pulsos, Top Stacks) marcadas como ideas futuras en el sketch original.
- Confirmar tokens en Tailwind/CSS variables reales al integrar con el código de `skill-review-workflow`.

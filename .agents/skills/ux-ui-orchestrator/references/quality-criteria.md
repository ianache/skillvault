# Atributos de calidad del diseño UX/UI

Complementan a `audit_ux.py`, que solo verifica lo determinista (existencia, enlaces, campos). Estos atributos exigen juicio: evalúalos por SCR y a nivel conjunto, y cita evidencia (archivo y sección). Sin evidencia, el hallazgo no se registra.

## Contenido
- Atributos
- Severidad
- Cómo registrar un hallazgo

## Atributos

| Atributo | Pregunta de evaluación | Señal de fallo |
|---|---|---|
| Trazable | ¿Cada SCR llega a una US por FLW→UXR, y cada UXR baja a algún SCR? | SCR u UXR huérfano; DTM sin entrada para un SCR |
| Completo en estados | ¿`required_states` cubre default, loading, empty, error y disabled cuando aplican, más los estados del flujo (sin permisos, éxito, conflicto)? | Estado omitido sin justificación ni pregunta |
| Consistente | ¿FLW y SCR coinciden en ambos sentidos? ¿Los mismos conceptos usan los mismos términos del glosario en etiquetas y mensajes? | FLW lista SCR con otro `flow`; etiquetas con sinónimos |
| Sin invención | ¿Permisos, campos, contenido y tokens salen de una fuente? | Campo o regla que aparece solo en la exploración |
| Verificable | ¿Cada AC es observable en la interfaz (qué se ve, qué se habilita, qué mensaje)? | AC con "debe ser intuitivo" o sin resultado visible |
| Accesible con evidencia | ¿El ARP evaluó contraste, foco, teclado, nombres accesibles, errores, objetivos táctiles y reflow? | `pass` sin evaluar; "WCAG AA" citado de una herramienta |
| Reutilizable | ¿Se usó un CMP existente antes de crear uno nuevo? ¿La variación está documentada? | Componente duplicado; reutilizable "porque aparece dos veces" |
| Semántico | ¿Se usan TKN semánticos y no valores crudos (hex, px sueltos)? | Valores crudos en SCR/CMP |
| Gobernado | ¿Cada SCR del alcance tiene `governed_design` y la divergencia Stitch↔Figma no está `open`? | Handoff basado en un artefacto Stitch |
| Vigente | ¿Las referencias Stitch/Figma se verificaron en vivo y no están obsoletas? | `STALE_FIGMA_REFERENCE`; `project_ref` sin evidencia |
| Decisión humana explícita | ¿Cada DD, aprobación y gate registra quién, cuándo y por qué? | Aprobación sin autor; `verified` fabricado |

## Severidad

- **Bloqueante:** impide el gate o hace que Stitch/Desarrollo inventen (SCR sin `flow`, divergencia abierta, falta `governed_design`, pregunta crítica oculta).
- **Mayor:** degrada la calidad del diseño pero el flujo puede avanzar con riesgo declarado (estado omitido justificable, ARP `inconclusive`).
- **Menor:** forma o redacción (etiqueta inconsistente, tokens por normalizar).

## Cómo registrar un hallazgo

En la sección 3 de la UXS: ID `Q-UXS-n`, qué está mal, severidad, artefacto y sección, skill dueño y estado (Abierto / Corregido). Si lo corrigió un skill, anota la verificación que lo confirma (preflight, gate, ARP).

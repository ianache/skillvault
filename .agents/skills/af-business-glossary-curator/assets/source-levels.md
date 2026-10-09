# Niveles de fuente

| Nivel | Qué es | Ejemplos | ¿Respalda una definición? |
|---|---|---|---|
| **N1 — Primaria** | La fuente que origina o gobierna el término. | Norma o estándar (ISO, IEC, IEEE, W3C, IETF RFC); ley o regulación; documentación oficial del propietario del producto o del fabricante (p. ej. `docs.gitlab.com` para "merge request"); documento corporativo aprobado o verificado por un humano; acta aprobada o verificada con la decisión del dueño del negocio. Un acta o documento interno en `draft` es N2 hasta que se verifique. | Sí, por sí sola. |
| **N2 — Secundaria confiable** | Fuente interna o reconocida que usa el término, pero que no lo gobierna o todavía no está verificada. | Artefacto de `knowledge-base/` en `draft` (p. ej. una visión construida en una sesión con el responsable); fichas formales del curso; libros o glosarios profesionales reconocidos. | Sí. Si existe una fuente N1, hay que buscarla y agregarla. |
| **N3 — Terciaria** | Fuente divulgativa o no controlada. | Wikipedia, blogs, foros, texto generado por IA. | No. Solo sirve como pista para llegar a una N1 o N2. |

El conocimiento propio del modelo no es una fuente de ningún nivel.

## Formato de una fuente

```
- [N1] Título o identificador — localizador (URL, archivo:Lnn o sección) — consultada AAAA-MM-DD
```

- Las fuentes del repositorio se citan con ruta relativa a la raíz y número de línea o sección.
- Las fuentes web llevan URL completa y fecha de consulta.
- Si la fuente no se pudo consultar, no la cites: registra el vacío (`Clasificación: gap`) y abre una pregunta.

# Flujo de revision de skills

SkillVault revisa cada skill nuevo y cada nueva version antes de publicarla. Una propuesta pendiente no aparece en el catalogo publico ni puede descargarse o instalarse.

## Roles y permisos

- **Author**: crea propuestas, consulta sus propias propuestas y puede editar o reenviar las que estan `pending` o `changes_requested`.
- **Reviewer**: consulta la cola de revision, agrega comentarios generales o por archivo y puede aprobar, pedir cambios o rechazar propuestas.
- **Admin**: tiene los permisos de author y reviewer para atender solicitudes operativas. Las decisiones conservan la identidad de quien las toma.

Solo el author de una propuesta puede editarla. Un author no puede aprobar su propia propuesta. Los reviewers no pueden editar el contenido ni los adjuntos enviados por un author.

## Envio de un author

1. Cree un skill desde **Publicar**, complete el wizard y seleccione **Enviar a revision**. El endpoint `POST /api/skills` crea una propuesta en lugar de publicar directamente.
2. Consulte **Mis propuestas** para ver el estado, reviewer, comentarios y la fecha de actualizacion.
3. Si el reviewer pide cambios, abra la propuesta, actualice `SKILL.md` o los adjuntos y reenviela. El reenvio devuelve la propuesta a `pending` y elimina la decision anterior.
4. Para un skill ya publicado, el editor del dashboard envia una nueva version a revision. No modifica la version publica en ese momento.

No puede haber dos propuestas abiertas para el mismo slug y version. Los archivos adjuntos deben tener rutas relativas, unicas y sin recorridos como `../`.

## Decision de un reviewer

1. Abra **Revision** y seleccione una propuesta pendiente.
2. Revise `SKILL.md`, los adjuntos y los comentarios. Puede dejar un comentario general o asociarlo a `SKILL.md` o a un archivo adjunto.
3. Seleccione **Aprobar**, **Pedir cambios** o **Rechazar**. Pedir cambios y rechazar requieren un comentario general.
4. Una aprobacion activa inmediatamente el contenido propuesto. El sistema actualiza el skill publicado, sus archivos y el historial de versiones en una sola transaccion.

Los estados finales son `approved` y `rejected`. Las propuestas `changes_requested` pueden volver a enviarse para una nueva revision.

## Version publicada mientras hay una propuesta pendiente

Al enviar una nueva version de un skill existente, la version publicada sigue visible en el catalogo y continua disponible para descarga e instalacion. La nueva version la reemplaza solo despues de que un reviewer la apruebe. Para un skill nuevo, no existe contenido publico hasta la aprobacion.

## Migraciones

Ejecute la migracion de acuerdo con la base de datos configurada:

```bash
# SQLite
pnpm migrate:review-workflow

# MySQL
pnpm migrate:review-workflow:mysql
```

Las migraciones crean las tablas de solicitudes, archivos y comentarios de revision. Los skills publicados existentes permanecen publicados y no se convierten en propuestas.

## No incluido

Esta primera version no incluye notificaciones por email, webhooks, comentarios a nivel de linea ni publicacion programada.

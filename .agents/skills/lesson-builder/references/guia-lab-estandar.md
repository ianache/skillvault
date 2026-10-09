# Estándar para Guías de Laboratorio
 
## Principios fundamentales
 
1. **Autocontenida**: el alumno no necesita instrucciones verbales adicionales
2. **Paso a paso**: cada acción es un paso numerado; sin saltos implícitos
3. **Verificable**: cada ejercicio tiene un "Resultado esperado" visible
4. **Contextualizada**: explica el POR QUÉ de cada paso importante
5. **Gradual**: de lo simple a lo complejo
## Nivel de detalle según audiencia
 
| Audiencia  | Detalle                                                  |
|------------|----------------------------------------------------------|
| Básico     | Cada clic y comando. Nada implícito.                     |
| Intermedio | Comandos completos, algunos pasos agrupados.             |
| Avanzado   | Objetivos claros, pasos de alto nivel, sin andamiaje.    |
 
## Estructura de cada ejercicio
 
```
══════════════════════════════════════════════════════
EJERCICIO [N]: [Título descriptivo]
Duración estimada: [N minutos]
══════════════════════════════════════════════════════
 
CONTEXTO
[1-2 oraciones: qué se hace y por qué es relevante]
 
PASOS
1. [Verbo imperativo + objeto + detalle]
   → Comando o UI exacta
   ℹ️ NOTA: [Explicación si el paso no es intuitivo]
   ⚠️ PRECAUCIÓN: [Advertencia si puede fallar]
 
2. [Siguiente acción]
   → Código o menú exacto
 
RESULTADO ESPERADO
[Lo que el alumno debe ver/obtener]
Ejemplo de salida:
  > output aquí
 
✓ CHECKPOINT
[Pregunta de verificación: "¿Cuántos registros devolvió? ___"]
══════════════════════════════════════════════════════
```
 
## Convenciones tipográficas
 
| Elemento          | Formato                       |
|-------------------|-------------------------------|
| Comandos          | `código monoespaciado`        |
| Archivos y rutas  | `nombre-archivo.ext`          |
| Variables         | `[NOMBRE_VARIABLE]`           |
| UI / menús        | **Archivo** → **Guardar como**|
| Notas             | ℹ️ NOTA:                      |
| Advertencias      | ⚠️ PRECAUCIÓN:                |
| Errores comunes   | ❌ ERROR FRECUENTE:            |
| Verificación      | ✓ CHECKPOINT:                 |
 
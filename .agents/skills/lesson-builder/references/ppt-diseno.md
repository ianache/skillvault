# Diseño PPT para Lecciones — Referencia técnica
 
## Canvas y layout base (pptxgenjs — LAYOUT_16x9)
 
Canvas: 10" × 5.625"
 
```
┌────────────────────────────────────────────────────────┐
│ BARRA SUPERIOR  y=0, h=0.7"                             │
│  Logo x=0.2 w=0.5 | Título slide x=1.0 w=8.0           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ÁREA DE CONTENIDO  y=0.85, h=4.2"                      │
│    Texto izq: x=0.4 w=5.8                               │
│    Imagen/gráfico: x=6.5 w=3.2                          │
│    Texto full: x=0.4 w=9.2                              │
│                                                         │
├────────────────────────────────────────────────────────┤
│ PIE  y=5.35, h=0.275"  │  Curso | Lección N | Slide N  │
└────────────────────────────────────────────────────────┘
```
 
## Coordenadas frecuentes (pulgadas)
 
| Elemento           | x   | y    | w   | h    |
|--------------------|-----|------|-----|------|
| Barra superior     | 0   | 0    | 10  | 0.7  |
| Logo               | 0.2 | 0.1  | 0.5 | 0.5  |
| Título de slide    | 1.0 | 0.12 | 8.5 | 0.55 |
| Cuerpo full        | 0.4 | 0.85 | 9.2 | 4.5  |
| Cuerpo izquierda   | 0.4 | 0.85 | 5.8 | 4.2  |
| Imagen derecha     | 6.5 | 0.85 | 3.2 | 4.0  |
| Pie de página      | 0   | 5.35 | 10  | 0.275|
 
## Paletas
 
### Oscura (tech/data)
```
fondo:    #1a2b4a    acento:   #00a8e8
texto:    #ffffff    secund.:  #b0c4de
apoyo:    #243860    verde:    #00d4a0
```
 
### Clara (gestión/negocio)
```
fondo:    #ffffff    primario: #0056a3
acento:   #f5a623   texto:    #1a1a2e
sep:      #e0e0e0   bg sección: #f0f4f8
```
 
### Neutra
```
fondo:    #f8f9fa   primario: #2d3748
acento:   #4a90d9  éxito:    #48bb78
advertencia: #ed8936  error: #e53e3e
```
 
## Tipografía
 
| Elemento       | Fuente      | Tamaño | Peso    |
|----------------|-------------|--------|---------|
| Título slide   | Calibri     | 32pt   | Bold    |
| Subtítulo      | Calibri     | 24pt   | Regular |
| Cuerpo         | Calibri     | 18pt   | Regular |
| Código inline  | Courier New | 16pt   | Regular |
| Pie de página  | Calibri     | 10pt   | Regular |
 
## Reglas de contenido
 
1. **Regla 7×7**: máx. 7 bullets por slide, 7 palabras por bullet
2. **Un concepto por slide**: no mezclar temas
3. **Notas del presentador**: `slide.addNotes()` con el script completo
4. **Animaciones**: solo Appear o Fade — sin efectos complejos
5. **Consistencia**: logo, número de slide y pie en TODOS los slides
6. **Contraste**: mínimo 4.5:1 entre texto y fondo
## Slides especiales
 
### Slide de cita / definición
```javascript
slide.addShape(pptx.ShapeType.RECTANGLE, {
  x: 0.3, y: 2.0, w: 9.4, h: 1.6,
  fill: { color: "00a8e8" }, line: { color: "00a8e8" }
});
slide.addText('"[Definición]"', {
  x: 0.5, y: 2.1, w: 9.0, h: 1.4,
  fontSize: 22, bold: true, color: "FFFFFF", align: "center"
});
```
 
### Slide de código
```javascript
slide.addShape(pptx.ShapeType.RECTANGLE, {
  x: 0.4, y: 1.2, w: 9.2, h: 3.8,
  fill: { color: "0d1117" }, line: { color: "30363d" }
});
slide.addText('[código]', {
  x: 0.6, y: 1.3, w: 8.8, h: 3.6,
  fontFace: "Courier New", fontSize: 14,
  color: "c9d1d9", valign: "top"
});
```
 
### Slide de dos columnas
- Izquierda: x=0.4 w=4.3
- Divisor:   x=4.85 y=0.8 w=0.05 h=4.5
- Derecha:   x=5.1 w=4.5
 
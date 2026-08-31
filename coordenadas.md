# Coordenadas de la cotización HYM

Este archivo documenta las posiciones de la plantilla `assets/cotizacion-hym.pdf` y de los textos que agrega el software. Debe actualizarse cada vez que se cambie una posición en `app.js`.

Las posiciones de fecha, cliente, descripción, total y condiciones también pueden modificarse desde el botón `Ajustar texto` de la previsualización. Al guardar, el software conserva los valores en el almacenamiento local con la clave `hym_quote_layout` y los aplica a los PDF posteriores.

## Sistema de coordenadas

- Tamaño de página: **595.50 × 842.25 puntos** (A4).
- Origen PDF `(0, 0)`: esquina **inferior izquierda**.
- `X` aumenta hacia la derecha.
- `Y` aumenta hacia arriba.
- Para bajar un texto se reduce `Y`.
- Para subir un texto se aumenta `Y`.
- Las posiciones del software representan la línea base del texto, no su borde superior.
- Conversión desde una coordenada medida desde arriba: `Y PDF = 842.25 - Y superior`.

Ejemplo: mover el cliente 2 puntos hacia arriba significa cambiar `(80, 619)` por `(80, 621)`.

## Datos variables agregados por el software

| Dato | X | Y | Tamaño | Alineación o límite | Observación |
|---|---:|---:|---:|---|---|
| Fecha | 60 | 665 | 11 | Izquierda | Se escribe a la derecha de `Lima,` |
| Nombre del cliente | 80 | 619 | 12 | Izquierda, negrita | Se escribe a la derecha de `Cliente:` |
| Número de ítem | 46 | 450 inicial | 10 | Izquierda, negrita | `Y` cambia según la altura de cada ítem |
| Centro de imagen | 115 | Depende del ítem | - | Máximo 70 × 44 | La imagen queda centrada alrededor del `Y` del ítem |
| Descripción | 164 | 450 inicial | 9 | Izquierda, ancho máximo 190 | Divide el texto en líneas y continúa en páginas adicionales |
| Cantidad | Área X=360 a 405 | 450 inicial | 10 | Derecha | Borde real de columna: X=359.54 a 412.69 |
| Valor unitario | Área X=420 a 476 | 450 inicial | 10 | Derecha | Borde real de columna: X=412.69 a 489.71 |
| Valor parcial | Área X=493 a 558 | 450 inicial | 10 | Derecha, negrita | Borde real de columna: X=489.71 a 569.26 |
| Costo total | Área X=493 a 558 | 233 | 13 | Centrado, negrita | Casilla real: X=489.71 a 569.26; Y=215.24 a 269.53 |
| Condiciones comerciales | 38 | 156 inicial | 9 | Izquierda, ancho máximo 500 | Cada línea baja 12 puntos |

### Área dinámica de los ítems

- Primera línea base: `Y=450`.
- Altura disponible administrada por el software: `192 puntos`.
- Límite visual superior del cuerpo de la tabla: `Y=469.38`.
- Límite visual inferior del cuerpo de la tabla: `Y=269.53`.
- Altura mínima asignada por ítem: `24 puntos`.
- Separación de líneas de descripción: tamaño de letra + `2 puntos`.
- El tamaño de la descripción se mantiene en `9` para conservar la legibilidad.
- Cuando una descripción supera el espacio disponible, continúa en una página nueva sin eliminar líneas.
- La cantidad, el valor unitario, el valor parcial y la imagen se dibujan en el primer segmento del ítem.
- El costo total y las condiciones comerciales se dibujan en la última página.

## Límites exactos de la tabla

### Líneas verticales

| Línea | X | Desde Y | Hasta Y | Uso |
|---|---:|---:|---:|---|
| Borde izquierdo | 26.24 | 215.62 | 574.05 | Inicio de tabla |
| Ítem / Imagen | 72.08 | 269.91 | 574.05 | Separador |
| Imagen / Descripción | 157.48 | 269.91 | 574.05 | Separador |
| Descripción / Cantidad | 359.54 | 269.91 | 574.05 | Límite derecho de descripción |
| Cantidad / Valor unitario | 412.69 | 269.91 | 574.05 | Separador |
| Valor unitario / Valor parcial | 489.71 | 215.62 | 574.05 | Separador |
| Borde derecho | 569.26 | 215.62 | 574.05 | Fin de tabla |

### Líneas horizontales

| Línea | Y | Desde X | Hasta X | Uso |
|---|---:|---:|---:|---|
| Borde superior | 574.42 | 25.86 | 569.64 | Inicio de cabecera |
| Cabecera / cuerpo | 469.38 | 25.86 | 569.64 | Inicio de los ítems |
| Cuerpo / total | 269.53 | 25.86 | 569.64 | Fin de los ítems |
| Borde inferior | 215.24 | 25.86 | 569.64 | Fin de tabla |

## Texto fijo de la plantilla

Las cajas se expresan como `X izquierda`, `X derecha`, `Y inferior` y `Y superior`, usando el sistema PDF.

| Texto | X izquierda | X derecha | Y inferior | Y superior |
|---|---:|---:|---:|---:|
| HYM | 140.74 | 207.63 | 780.59 | 809.42 |
| SERVICIOS | 213.73 | 366.26 | 780.59 | 809.42 |
| GENERALES | 372.37 | 534.33 | 780.59 | 809.42 |
| INTERCOMUNICADORES, | 163.42 | 295.11 | 765.20 | 776.04 |
| CÁMARAS | 297.40 | 353.28 | 765.20 | 776.04 |
| DE | 355.57 | 369.31 | 765.20 | 776.04 |
| SEGURIDAD, | 371.61 | 437.13 | 765.20 | 776.04 |
| ELECTRICIDAD, | 439.42 | 511.65 | 765.20 | 776.04 |
| DRYWALL | 311.57 | 363.50 | 753.83 | 764.67 |
| Lima, | 25.86 | 56.16 | 665.22 | 676.06 |
| Cliente: | 25.86 | 73.87 | 619.29 | 631.45 |
| ITEM | 36.45 | 61.85 | 522.57 | 533.40 |
| IMAGEN | 93.07 | 136.46 | 522.57 | 533.40 |
| DESCRIPCIÓN | 221.62 | 295.40 | 522.57 | 533.40 |
| CANT | 370.72 | 401.50 | 522.57 | 533.40 |
| VALOR (unitario) | 432.87 | 469.51 | 527.82 | 538.65 |
| UNIT. | 436.98 | 465.41 | 518.06 | 528.90 |
| VALOR (parcial) | 511.16 | 547.80 | 534.57 | 545.41 |
| PARCIAL | 506.27 | 552.68 | 522.57 | 533.40 |
| S/. | 522.17 | 536.79 | 510.56 | 521.40 |
| COSTO | 405.21 | 443.56 | 243.18 | 254.02 |
| TOTAL | 445.85 | 480.32 | 243.18 | 254.02 |
| CONDICIONES | 37.86 | 123.88 | 180.63 | 192.79 |
| COMERCIALES | 126.46 | 212.63 | 180.63 | 192.79 |

## Cómo solicitar un ajuste

Usar preferentemente este formato:

```text
Elemento: Nombre del cliente
Posición actual: X=80, Y=621
Posición solicitada: X=80, Y=623
```

También se puede indicar un desplazamiento:

```text
Elemento: Descripción
Cambio: mover 3 puntos a la izquierda y 2 puntos hacia abajo
Resultado esperado: X=161, Y inicial=428
```

## Historial de cambios de coordenadas

| Fecha | Elemento | Antes | Después | Motivo |
|---|---|---|---|---|
| 2026-08-30 | Mapa inicial | - | Documento completo | Crear referencia común para futuros ajustes |
| 2026-08-30 | Descripción | Y inicial 430, tamaño adaptable | Y inicial 450, tamaño 9 y paginación | Evitar cualquier pérdida de texto |
| 2026-08-30 | Nombre del cliente | X=80, Y=621 | X=80, Y=619 | Alinear visualmente con `Cliente:` |
| 2026-08-30 | Coordenadas variables | Valores fijos en código | Editor visual y almacenamiento local | Permitir ajuste manual en tiempo real |

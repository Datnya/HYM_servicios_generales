# Mapa ASCII de coordenadas - Cotización HYM V2

Fuente analizada: `assets/cotizacion-hym.pdf`  
Página: A4, `595.50 × 842.25 puntos`  
Palabras detectadas en la capa de texto: **24**

## Referencia de coordenadas

El origen `(0,0)` está en la esquina inferior izquierda. `X` aumenta hacia la derecha y `Y` aumenta hacia arriba.

```text
                         Y = 842.25
                             ↑
                             │
             (0,842.25)      │      (595.50,842.25)
                  +----------+-----------+
                  |                      |
                  |                      |
                  |                      |
                  |                      |
                  +----------------------+ → X
             (0,0)                    (595.50,0)
```

## Mapa ASCII de la página

Este dibujo es proporcional de manera aproximada. Cada código `Pxx` corresponde a una palabra cuya caja exacta aparece en la tabla inferior.

```text
 Y
842 +--------------------------------------------------------------------------------+
    |                                                                                |
810 |                  P12 HYM       P13 SERVICIOS          P14 GENERALES            |
780 |                     P15 INTERCOMUNICADORES, P16 CÁMARAS P17 DE                  |
770 |                                                  P18 SEGURIDAD, P19 ELECTRICIDA,|
754 |                                        P20 DRYWALL                             |
    |                                                                                |
700 | [logotipo HYM]                [logotipos de marcas: zona gráfica]              |
    |                                                                                |
676 | P21 Lima,                                                                      |
650 |                                                                                |
631 | P22 Cliente:                                                                   |
600 |                                                                                |
574 +------+-----------+---------------------------+-------+----------+--------------+
    |      |           |                           |       | P05 VALOR|  P07 VALOR   |
545 |      |           |                           |       |          |              |
533 |P01   |P02        |       P03                 | P04   | P06 UNIT.| P08 PARCIAL |
516 |ITEM  |IMAGEN     |       DESCRIPCIÓN         | CANT  |          |  P09 S/.     |
469 +------+-----------+---------------------------+-------+----------+--------------+
    |      |           |                           |       |          |              |
    |      |           |      CUERPO PARA          |       |          |              |
400 |      |           |      DATOS VARIABLES      |       |          |              |
    |      |           |                           |       |          |              |
    |      |           |                           |       |          |              |
270 +------+-----------+---------------------------+-------+----------+--------------+
254 |                                                           P10 COSTO P11 TOTAL  |
215 +-----------------------------------------------------------+--------------------+
193 |     P23 CONDICIONES  P24 COMERCIALES                                           |
170 |                                                                                |
    |                                                                                |
  0 +--------------------------------------------------------------------------------+
    0       72         157                         360     413        490          595 X
```

## Coordenadas exactas de cada palabra

La caja de cada palabra se expresa mediante:

- `X0`: borde izquierdo.
- `X1`: borde derecho.
- `Y0`: borde inferior.
- `Y1`: borde superior.
- `CX`, `CY`: centro calculado de la palabra.

| ID | Palabra detectada | X0 | X1 | Y0 | Y1 | CX | CY |
|---|---|---:|---:|---:|---:|---:|---:|
| P01 | ITEM | 36.45 | 61.85 | 522.57 | 533.40 | 49.15 | 527.98 |
| P02 | IMAGEN | 93.07 | 136.46 | 522.57 | 533.40 | 114.77 | 527.98 |
| P03 | DESCRIPCIÓN | 221.62 | 295.40 | 522.57 | 533.40 | 258.51 | 527.98 |
| P04 | CANT | 370.72 | 401.50 | 522.57 | 533.40 | 386.11 | 527.98 |
| P05 | VALOR (unitario) | 432.87 | 469.51 | 527.82 | 538.65 | 451.19 | 533.24 |
| P06 | UNIT. | 436.98 | 465.41 | 518.06 | 528.90 | 451.19 | 523.48 |
| P07 | VALOR (parcial) | 511.16 | 547.80 | 534.57 | 545.40 | 529.48 | 539.99 |
| P08 | PARCIAL | 506.27 | 552.68 | 522.57 | 533.40 | 529.48 | 527.98 |
| P09 | S/. | 522.17 | 536.79 | 510.56 | 521.40 | 529.48 | 515.98 |
| P10 | COSTO | 405.21 | 443.56 | 243.18 | 254.02 | 424.38 | 248.60 |
| P11 | TOTAL | 445.85 | 480.32 | 243.18 | 254.02 | 463.09 | 248.60 |
| P12 | HYM | 140.74 | 207.63 | 780.59 | 809.42 | 174.19 | 795.01 |
| P13 | SERVICIOS | 213.73 | 366.26 | 780.59 | 809.42 | 290.00 | 795.01 |
| P14 | GENERALES | 372.37 | 534.33 | 780.59 | 809.42 | 453.35 | 795.01 |
| P15 | INTERCOMUNICADORES, | 163.42 | 295.11 | 765.20 | 776.04 | 229.26 | 770.62 |
| P16 | CÁMARAS | 297.40 | 353.28 | 765.20 | 776.04 | 325.34 | 770.62 |
| P17 | DE | 355.57 | 369.31 | 765.20 | 776.04 | 362.44 | 770.62 |
| P18 | SEGURIDAD, | 371.61 | 437.13 | 765.20 | 776.04 | 404.37 | 770.62 |
| P19 | ELECTRICIDA, | 439.42 | 511.65 | 765.20 | 776.04 | 475.54 | 770.62 |
| P20 | DRYWALL | 311.57 | 363.50 | 753.83 | 764.67 | 337.54 | 759.25 |
| P21 | Lima, | 25.86 | 56.16 | 665.22 | 676.06 | 41.01 | 670.64 |
| P22 | Cliente: | 25.86 | 73.87 | 619.29 | 631.45 | 49.87 | 625.37 |
| P23 | CONDICIONES | 37.86 | 123.88 | 180.63 | 192.79 | 80.87 | 186.71 |
| P24 | COMERCIALES | 126.46 | 212.63 | 180.63 | 192.79 | 169.54 | 186.71 |

## Elementos gráficos sin palabras extraíbles

El PDF contiene imágenes y logotipos que visualmente incluyen letras, pero no forman parte de la capa de texto. Por eso no aparecen como palabras independientes en la tabla:

- Logotipo circular de HYM.
- Hagroy Electronic.
- ZKTeco Perú.
- Opalux.
- Hikvision.
- Imagen fotográfica de fondo del encabezado.

Estas zonas sí tienen posición visual, pero para medir sus letras individualmente sería necesario aplicar reconocimiento óptico de caracteres sobre las imágenes, y esas coordenadas serían aproximadas, no coordenadas nativas del PDF.

## Comprobación

- Total extraído de la capa de texto: **24 palabras**.
- Total representado en el mapa: **24 palabras (`P01` a `P24`)**.
- Sistema usado en todas las tablas: coordenadas PDF con origen inferior izquierdo.

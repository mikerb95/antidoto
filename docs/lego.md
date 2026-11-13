# Bricks Serious Play: estado actual e interfaz

Documento de traspaso para afinar el diseño visual del módulo de construcción con fichas 3D.
Fecha: 2026-11-12.

## 1. Qué es

Un juego de construcción con fichas tipo LEGO en 3D, pensado para eventos y talleres
corporativos. Se juega en celular y en computador, solo o en equipo, en modo libre o con retos.
Vive en la biblioteca de actividades como un segundo tipo de actividad (aparte de las
experiencias pixel).

Documentos de fondo:

- `docs/investigacion-construccion-3d.md`: investigación de usabilidad, táctil, psicología del
  juego, color y render.
- `docs/plan-construccion-3d.md`: plan de 8 fases.

## 2. Estado

| Fase | Qué es | Estado |
| --- | --- | --- |
| 1 | Banco de pruebas de render | Hecha (falta medir en celulares reales) |
| 2 | Motor de construcción (encaje, giros, guardado) | Hecha, con pruebas |
| 3 | Constructor en celular y computador | Hecha (falta probar gestos reales con personas) |
| 4 | Piezas especiales (inclinadas, redondas, ventanas, puertas, translúcidas) | Hecha |
| 5 | Retos individuales (5 de fábrica), entrega y foto de la obra | Hecha |
| 6 | Equipos en vivo: La Torre, Obra en Equipo, Relevo, Teléfono Roto | Hecha |
| 7 | Galería de cierre: votación, mural, reporte | Escrita y migrada, prueba final pendiente |
| 8 | Pulido: calidad automática, modo foto, guía completa, revisión legal | Sin empezar |

**Oculto.** El módulo está apagado desde el 2026-10-13 con el interruptor
`BRICKS_VISIBLE = false` en `src/lib/bricks/visible.ts`. Apagado, las páginas responden 404
(incluido el constructor de prueba). Para trabajar el diseño en local hay que ponerlo en `true`
temporalmente y regresarlo a `false` al terminar, salvo que el usuario diga otra cosa.

Pendientes conocidos fuera del diseño: bisagras por pasos, prueba de la galería con 4 o 5
celulares, revisión legal del nombre ("Serious Play" es parte de una marca de LEGO).

## 3. Pantallas

| Pantalla | Ruta | Quién la ve | Componente principal |
| --- | --- | --- | --- |
| Constructor de prueba | `/admin/escena/construir` | Cualquier admin, no guarda | `Builder.tsx` |
| Banco de render | `/admin/escena/ladrillos` | Solo super | `lab/BrickLab.tsx` |
| Reto individual (jugador) | `/mision?...` | Jugador con código | `Builder.tsx` + `ChallengeLayer.tsx` |
| Celular en equipo | `/construir` | Jugador con PIN | `TeamPlayerApp.tsx` + `TeamLayer.tsx` |
| Proyector del anfitrión | `/admin/equipos/[id]` | Anfitrión | `HostScreen.tsx` (+ `GalleryStage.tsx`) |
| Cierre en el celular (votación) | dentro de `/construir` | Jugador | `TeamClosing.tsx` |
| Reporte de la sesión | `/admin/reporte/equipos/[id]` | Admin | página del servidor |
| Tarjetas de biblioteca | `/admin/biblioteca/...` | Admin | `BuildThumb.tsx` |
| Foto de la obra | `/obra/[id]` | Público con enlace | imagen |

Todo el código visual está en `src/components/bricks/`. Hojas de estilo:

- `builder/builder.module.css` (756 líneas): constructor.
- `builder/challenge.module.css` (405): capa del reto (reloj, Entregar, ventanas).
- `team/team.module.css` (357): detalles del modo equipos en el celular y la votación.
- `team/host.module.css` (565): proyector.

## 4. La interfaz hoy

### 4.1 Lo que se ve

El lienzo 3D es **claro**: fondo de estudio en degradado claro, placa base verde LEGO
(`#237841`), plástico brillante, luz cálida (`#FFF8EE`) con sombras. Esto se cambió el
2026-10-13 porque el usuario encontró feo el fondo oscuro y la placa gris.

Toda la interfaz alrededor sigue siendo **oscura**: barra superior, bandeja de piezas, barra de
acciones, ventanas de reto, guía y ayuda son paneles sólidos en `#0f181d` (casi negro) con
texto `#e8f4f8` y bordes celestes al 12-18 % de opacidad. El resultado es una escena luminosa
encerrada en un marco negro, sobria y pesada. El usuario la describe como "muy oscura, sobria"
y quiere refinarla.

### 4.2 Colores que usa la interfaz (escritos a mano, sin variables)

| Uso | Valor |
| --- | --- |
| Paneles (barra, bandeja, acciones, ventanas) | `#0f181d` |
| Paneles secundarios / tarjetas en ventanas | `#16222a`, `#1f303a` |
| Texto principal | `#e8f4f8` |
| Texto atenuado | `rgb(232 244 248 / 0.55-0.75)` |
| Acento, foco, "Poner" | `#3bc8f3` con sombra sólida `#1c99ca` |
| Acento claro (marca, enlaces, títulos de ayuda) | `#80dcff` |
| Botón de toast | `#0c5c7d` |
| Aviso (pieza tope, reloj, ganadores) | `#fac80a` (el amarillo LEGO) |
| Error | `#ffb3b8`, `#ff6d77` |
| Fondo detrás del lienzo mientras carga | `#e9eef1` |

No hay tokens: los valores se repiten en las cuatro hojas (unos 200 usos). Un primer paso
sensato del rediseño es pasarlos a variables en `.root` de cada hoja.

Marca Antídoto: `#80DCFF`, `#3BC8F3`, `#1C99CA`, `#0C5C7D`, `#0F181D`. Fuentes: Cal Sans
(títulos), Poppins (texto), Modulus (disponible, no se usa aquí).

### 4.3 Constructor (`Builder.tsx`)

**Celular (vertical primero):**

1. **Barra superior** oscura: botón Salir, rótulo de marca en mayúsculas celestes (10 px), título
   de la obra en Cal Sans 17 px, contador de piezas (o "12 de 40" si el reto tiene tope; en
   amarillo al llenarse), botones de foto, ayuda y sonido (44 px, iconos lineales propios en
   `builder/icons.tsx`).
2. **Lienzo 3D** a pantalla completa entre barra y bandeja. Encima: botón "Centrar la vista"
   abajo a la derecha, insignias abajo a la izquierda, guía del primer minuto arriba al centro
   (una línea con paso numerado y "Saltar", nunca modal) y una mano animada que muestra el gesto
   de arrastrar.
3. **Barra de acciones**: con una pieza seleccionada muestra Girar, Pintar, Mover, Duplicar,
   Eliminar; sin selección, Deshacer, Girar, Rehacer, Soltar, y el botón grande **Poner** en
   celeste con sombra sólida (efecto de botón físico que se hunde).
4. **Bandeja** oscura: pestañas (Ladrillos, Placas, Tejas, Inclinadas, Redondas, Ventanas),
   fila de piezas con miniatura 3D renderizada de 56 px en tarjetas de 72 px, y debajo los
   colores: fila esencial de 11 muestras y "Ver todos" para las 23 agrupadas por familia
   (Neutros, Azules, Cálidos, Rosas, Verdes, Tierras, Especiales). Las translúcidas y la
   metálica tienen muestra con degradado propio.
5. **Ayuda**: hoja que sube desde abajo con los controles de celular y computador.
6. **Toast** claro (`#e8f4f8` sobre texto oscuro), el único elemento claro de la interfaz.

**Computador (desde 900 px):** rejilla con la bandeja a la izquierda (300 px, piezas en 3
columnas, colores en varias filas), barra superior arriba y la barra de acciones flotando
centrada sobre el lienzo, con bordes redondeados de 20 px y sombra.

### 4.4 Reto individual (`ChallengeLayer.tsx`, `challenge.module.css`)

Sobre el constructor: reloj y botón "Entregar" arriba, chip del reto, estado de guardado.
Ventanas (bienvenida con el enunciado y reglas, perfil del jugador, confirmación de entrega,
foto final) que suben desde abajo en celular y se centran en computador. Mismo lenguaje oscuro
con acento celeste.

### 4.5 Equipos en el celular (`TeamLayer.tsx`, `team.module.css`)

Insignia del equipo con su color ("Equipo Rojo", etc.), aviso de turno (Relevo), botón para ver
el modelo (Teléfono Roto), giro sorpresa, créditos, altura de la torre, lista de compañeros con
estado desconectado, pantalla de espera con pulso, y la votación de cierre: rejilla de tarjetas
con la foto de cada obra, casillas de categoría, ganadores y opción de ocultar la propia.

### 4.6 Proyector (`HostScreen.tsx`, `host.module.css`)

La escena 3D de todas las obras ocupa la pantalla y los paneles flotan encima, sólidos y
oscuros, con textos grandes para leerse desde el fondo de la sala. Partes: barra superior con
reloj y PIN pequeño; sala de espera con la URL, el PIN gigante y la rejilla de equipos que se
van uniendo; tablero durante el juego con enunciado, giro y ranking; final con podio por
equipo; galería con rejilla de fotos numeradas, conteo de votos y categorías; botón del mural.

## 5. Restricciones a respetar al rediseñar

- **Nada de `backdrop-filter` / blur sobre el lienzo.** Los paneles son sólidos a propósito:
  el desenfoque sobre WebGL castiga a los celulares de gama media. Se puede usar opacidad.
- **Celular primero**, objetivos táctiles de al menos 44 px, acciones en el tercio inferior
  (zona del pulgar), respetar `safe-area-inset`.
- **El lienzo no se toca desde React.** El motor es three.js puro (`builder/engine.ts`,
  `stage.ts`); React solo dibuja los paneles y lee el estado con `useSyncExternalStore`. El
  lint del React Compiler prohíbe mutar objetos de three o hacer `setState` en efectos.
- **Colores de las fichas**: son los 23 de LEGO con sus nombres oficiales
  (`src/lib/bricks/palette.ts`). No cambiarlos ni reordenarlos (el índice se guarda en las
  obras). El usuario pidió explícitamente que se vean como LEGO de verdad.
- **Movimiento reducido**: ya hay bloque `prefers-reduced-motion`; mantenerlo en lo nuevo.
- **Proyector**: legible a 10 metros, alto contraste, sin texto pequeño.
- Preferencias del usuario para cualquier diseño: **nunca franjas de color en el borde
  izquierdo de las tarjetas** (`border-left` de acento); usar punto de color, tinte de fondo o
  sombra. **Nunca em dashes** en textos de la interfaz.

## 6. Ideas de dirección (sin decidir)

- Llevar los paneles al mismo mundo claro del lienzo: superficies blancas o gris muy claro,
  sombra suave, para que la escena y la interfaz se lean como una sola pieza.
- Usar el lenguaje físico de las fichas en la interfaz: botones con canto y sombra sólida
  (como ya hace "Poner"), esquinas redondeadas generosas, un toque de stud como detalle.
- Acentos con el amarillo, rojo y azul de las fichas además del celeste Antídoto, sin
  perder la identidad de la marca.
- Tarjetas de pieza más grandes y vivas en la bandeja; muestras de color tipo ficha 1x1 vista
  desde arriba.
- Proyector: decidir si se mantiene oscuro (funciona bien en salas con poca luz) o pasa a claro.

## 7. Cómo ver los cambios

1. Poner `BRICKS_VISIBLE = true` en `src/lib/bricks/visible.ts`.
2. `npm run dev` y entrar como admin a `/admin/escena/construir` (no guarda, ideal para iterar).
3. Capturas automáticas: `.claude-tmp/lab/build-shot.mjs <png> [ancho] [alto] "<pasos>"` con
   pasos como `noguide,part:Ladrillo 2x2,place,tab:Placas,color:Amarillo brillante,help,colors,wait:ms`
   (usa la sesión guardada en `.claude-tmp/lab/auth.json`). Ojo: el login tiene límite de 5
   intentos cada 15 minutos.
4. Probar a 390 px de ancho (celular) y a 1440 px (computador). Para el proyector hace falta
   abrir una sala desde `/admin/biblioteca/equipos/[modo]` con la base local.
5. Al terminar, regresar el interruptor a `false`.

## Kits de piezas (2026-11-12)

Al asignar un reto de construcción se puede elegir un kit: Duck polybag (6 piezas), Window
Exploration Bag (48) o Starter kit (210 construibles de 234). El participante construye solo con
esas piezas, en sus colores y cantidades; la bandeja muestra cuántas quedan de cada una.

- Catálogo e inventario: `src/lib/bricks/kits.ts` (cada sustitución anotada en `from`).
- Se guarda en la tabla `activity_code_kit`; sin fila, el reto usa todas las piezas.
- Replicar no acepta kit (el modelo pide piezas exactas). Con kit, la base arranca vacía.
- El servidor rechaza obras que se pasen del kit (`validateWork`).
- Se agregaron 7 colores al final de la paleta (verde oscuro, rosa oscuro, azul medio, plata y
  tres transparentes) para respetar los colores reales de las bolsas.
- Falta: kits en las salas de equipo (el Starter sirve para grupos de hasta 4).

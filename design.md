# LDT — Referencia de estilo
> Rejilla editorial en grises zinc sobre fondo oscuro, con el rojo y el verde del escudo como puntuación.

**Tema:** solo oscuro · **Fuente:** DM Sans · **Tokens:** `app/globals.css` (`@theme`) · **Componentes base:** `components/ui/`

Este documento es la fuente de verdad del diseño de la app de la LigaDolorenseDeTocho. Nació de una referencia de estilo externa (Awesomic: sistema claro, zinc, acento naranja) y se adaptó a la liga. Cada vez que se tome una decisión de diseño nueva, se anota en la **Bitácora** y se actualiza la sección que corresponda.

La idea de fondo no cambió respecto a la referencia: **los grises cargan casi toda la interfaz, el color es puntuación y no decoración, los bordes finos sustituyen a las sombras y las esquinas son generosas.** Lo que cambió es el tema (oscuro), el acento (el escudo) y que esta app no es solo una landing: también tiene tablas, rosters y paneles de administración.

---

## Bitácora de decisiones

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-09-25 | **Solo tema oscuro.** Se invierte la escala zinc de la referencia: el fondo es `#09090b` y el texto `#fafafa`. | Decisión de Abel. La app ya era oscura y así se mantiene la identidad. No se mantiene un modo claro (sería el doble de trabajo en cada componente). |
| 2026-09-25 | **Acento = colores del escudo** (rojo `#c1272d`, verde `#006837`) en lugar del naranja `#ff5a00`. | Que la app se sienta de LDT y no de otra marca. |
| 2026-09-25 | **Se elimina el degradado rosa→amarillo** en todo el sitio. | Rompe la regla “el color es puntuación”. Competía con todo lo demás y no tenía relación con el escudo. |
| 2026-09-25 | **DM Sans** (Google Fonts, variable) en lugar de Cosmica. | Cosmica es de pago. DM Sans es el sustituto que sugiere la referencia; se carga con `next/font`. |
| 2026-09-25 | **Colores de estado permitidos** (éxito, aviso, peligro), solo en insignias de estado y mensajes de formulario. | Una app de liga necesita distinguir de un vistazo *programado / finalizado / suspendido*. La referencia prohibía cualquier otro color; aquí se permite con reglas estrictas. |
| 2026-09-25 | **Dos densidades:** pública (editorial, radios de 36px) y administración (compacta, radios de 24px). | Los títulos de 64px y las tarjetas de 36px funcionan en la portada, no en una tabla de 40 jugadores. |
| 2026-09-25 | **El botón primario es claro** (`#fafafa` con texto oscuro), no rojo. | Es la inversión fiel del “botón negro” de la referencia. El rojo se reserva para acentos y así no se gasta. |
| 2026-09-25 | **El anillo de foco es verde** (`#3fbf7f`). | En rojo se confundiría con un error de validación. |
| 2026-09-25 | **Franja tricolor** (verde, blanco, rojo) como firma visual, una por vista como máximo. | Toma los colores del escudo (Dolores Hidalgo, cuna de la Independencia) en un detalle pequeño y reconocible. |
| 2026-09-25 | **Sin fotos por ahora.** Las secciones de imagen se diseñan para verse bien vacías. | Todavía no hay fotos de partidos. Cuando existan, ver la sección *Imágenes*. |
| 2026-09-25 | **Orden de migración:** tokens y componentes base → páginas públicas → administración. | Se ven resultados pronto y la administración se migra ya con los componentes probados. |

---

## Principios

1. **Gris primero.** Si dudas entre poner color o no, no lo pongas. El 95 % de la pantalla usa la escala zinc.
2. **El borde es la elevación.** Tarjetas, modales e inputs se separan del fondo con un cambio de superficie y un borde de 1px, nunca con `shadow-*`.
3. **Esquinas generosas y consistentes.** Hay cinco radios con nombre, y ningún contenedor visible lleva menos de 12px.
4. **Tipografía que manda.** Los títulos son grandes y en peso 600. El texto de cuerpo es compacto, de 15px.
5. **El escudo es puntuación.** El rojo y el verde aparecen poco, y por eso cuando aparecen se notan.

---

## Tokens — Color

Todos viven en `app/globals.css` dentro de `@theme`. Cada `--color-x` genera `bg-x`, `text-x`, `border-x`, `ring-x`, `fill-x`, etc. Se pueden usar con opacidad: `bg-rojo/15`.

### Superficies y bordes

| Token | Valor | Clase | Rol |
|---|---|---|---|
| `--color-canvas` | `#09090b` | `bg-canvas` | Fondo de la página. Es el más oscuro permitido (nunca `#000`). También es el fondo de los inputs, que así se ven “hundidos”. |
| `--color-superficie` | `#18181b` | `bg-superficie` | Tarjetas, modales, paneles. |
| `--color-superficie-2` | `#27272a` | `bg-superficie-2` | Nivel elevado: hover de filas y botones, tarjeta destacada, insignia neutra. |
| `--color-borde` | `#27272a` | `border-borde` | El borde fino de 1px de todo: tarjetas, inputs, divisores de tabla. |
| `--color-borde-fuerte` | `#3f3f46` | `border-borde-fuerte` | Botón secundario, insignia de contorno, hover de bordes. |

### Texto

| Token | Valor | Clase | Rol | Contraste (canvas / superficie / sup-2) |
|---|---|---|---|---|
| `--color-tinta` | `#fafafa` | `text-tinta` | Títulos, texto principal, números del marcador. | 19.1 / 17.0 / 14.3 |
| `--color-tinta-2` | `#d4d4d8` | `text-tinta-2` | Párrafos, etiquetas de formularios, texto de botones secundarios. | 13.5 / 12.0 / 10.1 |
| `--color-tenue` | `#a1a1aa` | `text-tenue` | Metadatos (fecha, sede), ayuda, subtítulos. **Es el gris más claro que pasa AA en todas las superficies.** | 7.8 / 6.9 / 5.8 |
| `--color-apagado` | `#71717a` | `text-apagado` | Placeholders, deshabilitado, decoración. **No sirve para texto que haya que leer** (no pasa AA sobre superficie). | 4.1 / 3.7 / 3.1 |

### Escudo (acento)

| Token | Valor | Clase | Rol |
|---|---|---|---|
| `--color-rojo` | `#c1272d` | `bg-rojo` | **Solo relleno**: insignia de acento con texto `tinta` encima (contraste 5.8). Como texto sobre oscuro no pasa (3.4). |
| `--color-rojo-hover` | `#a51f25` | `hover:bg-rojo-hover` | Hover de un relleno rojo. |
| `--color-rojo-claro` | `#f2646a` | `text-rojo-claro` | Rojo para **texto e íconos** sobre oscuro (6.5 / 5.7 / 4.8). También se usa para errores y peligro. |
| `--color-verde` | `#006837` | `bg-verde` | **Solo relleno**: insignia de acento con texto `tinta` encima (6.9). Como texto no pasa (2.9). |
| `--color-verde-hover` | `#00804a` | `hover:bg-verde-hover` | Hover de un relleno verde. |
| `--color-verde-claro` | `#3fbf7f` | `text-verde-claro` | Verde para **texto e íconos** (8.5 / 7.6 / 6.4). También se usa para éxito. |

### Semánticos

| Token | Valor | Rol |
|---|---|---|
| `--color-aviso` | `#fbbf24` | Estados pendientes (“Inscripciones”). |
| `--color-foco` | `#3fbf7f` | Anillo de foco del teclado (`:focus-visible` global) y borde de un input enfocado. |
| éxito | `verde-claro` | Estados positivos o activos (“En curso”) y toasts de éxito. |
| peligro | `rojo-claro` | Estados negativos (“Suspendido”), errores de formulario y acciones destructivas. |

### Reglas del color
- **Rojo y verde de relleno: máximo uno o dos elementos por vista.** Sirven para lo excepcional: la categoría destacada, “Campeón”, la jornada actual.
- **Los colores de estado solo van en insignias de estado, mensajes de formulario y toasts.** Nunca en títulos, fondos de sección o botones normales.
- **Un estado nunca depende solo del color:** la insignia de estado lleva punto y texto.
- **Nada de degradados**, salvo la franja tricolor.
- **Nunca `#000` ni `#fff` puros.** Los extremos son `canvas` y `tinta`.
- La paleta por defecto de Tailwind (`gray-*`, `pink-*`…) sigue existiendo mientras dure la migración. **En código nuevo no se usa.** Cuando termine la migración se puede apagar con `--color-*: initial;` en `@theme`.

---

## Tipografía

**DM Sans**, variable (pesos 100–1000), cargada en `app/layout.tsx` con `next/font/google` y conectada a `--font-sans`. Es la única familia del sitio.

| Clase | Tamaño | Interlineado | Tracking | Peso sugerido | Uso |
|---|---|---|---|---|---|
| `text-display` | 64px | 1.12 | −0.02em | `font-semibold` | Título del hero de la portada. Solo desde `lg`. |
| `text-titulo-lg` | 56px | 1.15 | −0.02em | `font-semibold` | Hero de páginas públicas en escritorio. |
| `text-titulo` | 40px | 1.2 | −0.01em | `font-semibold` | Títulos de página. Hero en móvil. |
| `text-titulo-sm` | 32px | 1.25 | — | `font-semibold` / `font-bold` | Títulos de sección y números grandes (stats). |
| `text-subtitulo` | 20px | 1.5 | — | `font-semibold` | Título de tarjeta y de modal. |
| `text-cuerpo-lg` | 18px | 1.45 | — | normal | Párrafo de introducción bajo un título grande. |
| `text-cuerpo` | 15px | 1.45 | — | normal | **Texto por defecto** (ya está en `<body>`). |
| `text-meta` | 13px | 1.5 | — | normal / `font-medium` | Etiquetas de formularios, metadatos, botones `sm`, celdas de tablas densas. |
| `text-leyenda` | 12px | 1.6 | — | `font-medium` | Insignias, notas al pie, errores de campo. |

**Títulos responsivos.** Un título de 64px no cabe en un teléfono. La escala baja con el ancho de pantalla:
```
Hero:            text-titulo sm:text-titulo-lg lg:text-display
Título página:   text-titulo-sm sm:text-titulo
Título sección:  text-subtitulo sm:text-titulo-sm
```

**Reglas**
- Títulos siempre en 600 o más. Nunca un título en peso normal.
- El cuerpo va en `tinta-2` y los títulos en `tinta`. Esa diferencia de tono ordena la lectura sin cambiar el tamaño.
- Los números del marcador y las estadísticas van en `tabular-nums`, para que no bailen al cambiar.
- Las MAYÚSCULAS con `tracking-wider` solo en etiquetas muy cortas (encabezados de columna, “VS”). Nunca en párrafos.
- Adaptación respecto a la referencia: se agregó tracking negativo en los tamaños de 40px o más, porque DM Sans en peso 600 se ve suelta sin él.

---

## Espaciado y layout

La unidad base es **4px**, igual que la escala por defecto de Tailwind (`1` = 4px). No hacen falta tokens de espaciado:

| Concepto | Valor | Clase |
|---|---|---|
| Separación entre elementos | 8px | `gap-2` |
| Relleno de tarjeta pública | 28px (20px en móvil) | `p-5 sm:p-7` (ya en `<Tarjeta>`) |
| Relleno de panel admin | 24px (20px en móvil) | `p-5 sm:p-6` (ya en `<Tarjeta variante="panel">`) |
| Separación entre tarjetas de una rejilla | 16px | `gap-4` |
| Separación entre secciones de página | 80px (48px en móvil) | `py-12 sm:py-20` |
| Margen lateral de página | 16px en móvil, 24px desde `sm` | `px-4 sm:px-6` |
| Ancho máximo de página | 1200px | `max-w-pagina mx-auto` |
| Ancho máximo de texto corrido | ~65 caracteres | `max-w-2xl` |

---

## Geometría

| Clase | Radio | Para |
|---|---|---|
| `rounded-insignia` | 12px | Insignias y chips. |
| `rounded-control` | 14px | Botones, inputs, selects, botón de cerrar. |
| `rounded-item` | 16px | Elementos **dentro** de una tarjeta: fila de partido, celda de logo, miniatura. |
| `rounded-panel` | 24px | Tarjetas de administración y modales. |
| `rounded-tarjeta` | 36px | Tarjetas de las páginas públicas. |
| `rounded-full` | píldora | Solo el botón de acción del header, los avatares y los puntos de estado. |

**Regla de anidado:** el radio de adentro es menor que el de afuera. Si una tarjeta de 36px tiene relleno de 28px, sus elementos internos usan `rounded-item` (16px), nunca 36px.

**Prohibido:** `rounded-sm`, `rounded`, `rounded-md` y `rounded-lg` en contenedores visibles (todos miden menos de 12px).

---

## Elevación

| Elemento | Tratamiento |
|---|---|
| Tarjeta, panel, modal | Cambio de superficie (`bg-superficie`) + `border border-borde`. **Sin sombra.** |
| Hover de algo clicable | Sube un nivel: `hover:bg-superficie-2` y/o `hover:border-borde-fuerte`. |
| Botón primario | `shadow-boton`: un bisel interno de 1px arriba y 2px abajo. Es la única sombra del sistema. |
| Header fijo | `bg-canvas/80 backdrop-blur` + `border-b border-borde`. |
| Fondo detrás de un modal | `bg-canvas/80 backdrop-blur-sm`. |

---

## Componentes base (ya implementados)

Viven en `components/ui/` y usan `cn()` de `lib/cn.ts`. **Para unir clases usa `cn()`, no `twMerge`:** `twMerge` no conoce nuestros tamaños de texto y borraría `text-cuerpo` al verlo junto a `text-tinta`.

### Botón — `components/ui/boton.tsx`
```tsx
<Boton variante="primario">Guardar</Boton>
<Boton variante="secundario" tamano="sm">Cancelar</Boton>
<Link href="/equipos" className={claseBoton({ variante: 'secundario', tamano: 'lg' })}>Ver equipos</Link>
```
| Variante | Aspecto | Cuándo |
|---|---|---|
| `primario` | Relleno `tinta`, texto `canvas`, `shadow-boton` | La acción más importante de la vista. **Idealmente una sola.** |
| `secundario` | Contorno `borde-fuerte`, texto `tinta-2` | Acciones de apoyo. |
| `fantasma` | Sin fondo, texto `tenue`; el hover lo rellena | Acciones dentro de tablas y tarjetas (“Editar”, “Ver roster”). |
| `peligro` | Contorno y texto `rojo-claro` | Borrar, dar de baja. Siempre con confirmación. |

Tamaños: `sm` (32px de alto, para tablas), `md` (40px, por defecto) y `lg` (48px, hero y formularios). `pildora` solo para la acción del header. `anchoCompleto` para formularios y móvil. El peso es `font-medium` (500): la referencia usaba 400, pero sobre fondo oscuro el texto delgado se ve borroso.

### Insignia — `components/ui/insignia.tsx`
```tsx
<Insignia>Varonil Libre</Insignia>
<Insignia tono="contorno">Campo 2</Insignia>
<Insignia tono="exito">En curso</Insignia>
<Insignia tono="rojo">Campeón</Insignia>
```
Tonos: `neutro` (por defecto), `contorno`, `exito`, `aviso`, `peligro` (estos tres con punto automático), `rojo`, `verde`.

### Tarjeta — `components/ui/tarjeta.tsx`
```tsx
<Tarjeta as="section">…</Tarjeta>                       // pública, 36px
<Tarjeta variante="panel">…</Tarjeta>                   // admin, 24px
<Tarjeta variante="destacada">…</Tarjeta>               // resalta un bloque
<Link href="…" className={claseTarjeta({ interactiva: true })}>…</Link>
```
`destacada` es la inversión de la “tarjeta oscura” de la referencia: en un fondo oscuro, lo que resalta es la superficie un nivel **más clara**.

### Campos de formulario — `components/ui/campo.ts`
Son strings, no componentes, para que `{...register()}` de react-hook-form siga yendo directo al `<input>`.
```tsx
<label htmlFor="nombre" className={claseEtiqueta}>Nombre</label>
<input id="nombre" className={claseCampo} aria-invalid={!!error} {...register('nombre')} />
{error && <span className={claseError}>{error}</span>}
```
- `claseCampo` sirve igual para `<input>`, `<select>` y `<textarea>`.
- Con `aria-invalid` el borde se pone rojo solo.
- **Reemplaza a `inputClass` de `lib/team-ui.ts`**, que es del diseño viejo y se borra al terminar la migración.

### Ya adaptados (sin cambiar cómo se usan)
- **`Modal`**: `bg-superficie`, `rounded-panel`, borde fino, título `text-subtitulo`, botón de cerrar con ícono SVG.
- **`FormInput`**: usa `claseCampo`, conecta `<label>` con `<input>` por `id` y anuncia el error al lector de pantalla.
- **`LoadingButton`**: es el `Boton` primario `lg` a todo lo ancho. Se desactiva mientras carga (evita el doble envío). Las props `btnColor` y `textColor` quedan **obsoletas** y ya no hacen nada: bórralas al migrar login y registro.
- **`Spinner`**: colores por defecto para fondo oscuro; ya no trae `mr-2`.
- **Toasts** (`<Toaster>` en `layout.tsx`): superficie oscura, borde fino, ícono verde o rojo.

---

## Estados → tono de insignia

| Dominio | Valor | Tono | Nota |
|---|---|---|---|
| Partido | `programado` | `contorno` | Es el estado normal; no merece color. |
| Partido | `finalizado` | `neutro` | El marcador ya dice todo. |
| Partido | `suspendido` | `peligro` | |
| Partido | `isForfeit` | `aviso` | Texto “Default”. |
| Temporada | `inscripciones` | `aviso` | |
| Temporada | `activa` | `exito` | Texto “En curso”. |
| Temporada | `cerrada` | `contorno` | |
| Equipo/partido | categoría | `neutro` | “Varonil Libre”, “Mixto”… |

Esto sustituye a `claseEstadoPartido` (`lib/game-ui.ts`) y `claseEstado` (`lib/season-ui.ts`). **Pendiente:** crear `tonoEstadoPartido` y `tonoEstadoTemporada` con el tipo `Record<…, TonoInsignia>`.

---

## Patrones de página (por construir)

Son las piezas que se arman **con** los componentes base durante la migración. Cuando una se construya, pasa a “implementado” con la ruta de su archivo.

### Header
Fijo, `h-16`, `bg-canvas/80 backdrop-blur`, `border-b border-borde`. Logo a la izquierda y nombre “LIGADOLORENSEDETOCHO” en `text-tinta font-bold`, **sin degradado**. Enlaces en `text-meta font-medium text-tenue hover:text-tinta`; el enlace activo en `text-tinta` con una raya de 2px `bg-rojo` debajo. Menú móvil en `bg-superficie` con `border-b border-borde`. Opcional: `franja-tricolor` justo debajo del header (cuenta como la franja de la vista).

### Hero de portada
Alineado a la izquierda (no centrado), `pt-16 sm:pt-24`. Título en la escala responsiva de hero, en `tinta`. Debajo, un párrafo `text-cuerpo-lg text-tenue max-w-2xl`. CTA: `primario lg` (“Ver temporada actual”) + `secundario lg` (“Equipos”).

### Bloque de estadísticas
Fila de 3 bloques. El número en `text-titulo-sm sm:text-titulo font-semibold tabular-nums text-tinta` y la etiqueta en `text-meta text-tenue`. Ejemplos: equipos inscritos, partidos jugados, jugadores.

### Tarjeta de partido
`rounded-item border border-borde bg-superficie`. Arriba, una fila de metadatos en `text-meta text-tenue` con insignias (categoría `neutro` y estado según la tabla). En medio, una rejilla `1fr auto 1fr`: nombres en `font-semibold text-tinta` y marcador en `text-subtitulo font-bold tabular-nums`. Si el partido no se ha jugado, en lugar del marcador va “VS” en `text-leyenda tracking-wider text-apagado`. El ganador puede ir en `tinta` y el perdedor en `tenue`.

### Tablas (equipos, jugadores, posiciones)
Dentro de `<Tarjeta variante="panel" className="p-0 overflow-hidden">`. Encabezados en `text-leyenda uppercase tracking-wider text-tenue`, sin fondo. Filas con `border-t border-borde`, `hover:bg-superficie-2/50` y celdas `px-4 py-3 text-meta`. Nada de filas de colores alternos (cebra). En móvil, desplazamiento horizontal (`overflow-x-auto`) o una tarjeta por fila.

### Cinta de logos (marquee)
Logos en `grayscale opacity-60`; al pasar el mouse vuelven al color (`hover:grayscale-0 hover:opacity-100`). Así la cinta no compite con el contenido; es prueba social, como en la referencia.

### Estados vacíos / “Próximamente”
`rounded-item border border-dashed border-borde-fuerte` y texto `text-meta text-apagado`, centrado. Un solo mensaje corto y, si aplica, un botón `secundario sm` con la acción que lo llenaría.

---

## Densidad: pública vs administración

| | Páginas públicas (`/`, `/equipos`, `/jugadores`, `/ligas/…`) | Administración (`/manejar-*`) |
|---|---|---|
| Tarjetas | `<Tarjeta>` (36px, p-7) | `<Tarjeta variante="panel">` (24px, p-6) |
| Título de página | hasta `text-display` | `text-titulo-sm` como máximo |
| Botones | `md` / `lg` | `sm` / `md` |
| Texto de tablas | `text-cuerpo` | `text-meta` |
| Separación entre secciones | `py-12 sm:py-20` | `py-8` |

---

## Imágenes

**Hoy no hay fotos de partidos.** Mientras tanto:
- No se inventan secciones de foto. La galería de la portada queda como estado vacío (ver *Estados vacíos*), sin rejilla de huecos grises.
- Los logos de equipo son la única imagen: van en `rounded-item` dentro de un recuadro `bg-canvas border border-borde`, con `object-contain`.

Cuando haya fotos (dato para el futuro):
- Fotografía real, sin filtros, sin duotono y sin texto encima.
- Radio `rounded-tarjeta`, o `rounded-t-tarjeta` si la foto es el encabezado de una tarjeta.
- Una foto horizontal a todo el ancho puede servir de respiro entre secciones, como en la referencia.

---

## Qué hacer / Qué no hacer

### Hacer
- Usar **tokens** (`bg-superficie`, `text-tenue`, `rounded-panel`) en todo el código nuevo.
- Usar `<Boton>` / `claseBoton()` para **todo** lo que parezca botón, incluidos los `<Link>`.
- Una sola acción `primario` por vista.
- Separar con bordes finos y cambios de superficie.
- Unir clases con `cn()`.
- Marcar el estado de un campo con `aria-invalid` y dejar que el estilo reaccione solo.

### No hacer
- No usar la paleta vieja: `gray-*`, `pink-*`, `yellow-*` ni degradados.
- No poner `shadow-*` en tarjetas.
- No usar radios menores a 12px en contenedores.
- No usar `rojo` ni `verde` como color de **texto** (no se leen): para texto van `rojo-claro` y `verde-claro`.
- No usar `text-apagado` para información que haya que leer.
- No escribir `#000`, `#fff` ni colores hexadecimales sueltos en los componentes.
- No poner más de una franja tricolor por vista.

---

## Guía de migración (clase vieja → nueva)

| Antes | Ahora |
|---|---|
| `bg-gray-950`, `bg-black` | `bg-canvas` (o nada: el `<body>` ya lo tiene) |
| `bg-gray-900`, `bg-gray-900/40`, `bg-gray-950/40` | `bg-superficie` (o `<Tarjeta>`) |
| `bg-gray-800`, `hover:bg-gray-900` | `bg-superficie-2`, `hover:bg-superficie-2` |
| `border-gray-800` | `border-borde` |
| `border-gray-700`, `border-gray-600` | `border-borde-fuerte` |
| `text-white` | `text-tinta` |
| `text-gray-200`, `text-gray-300` | `text-tinta-2` |
| `text-gray-400` | `text-tenue` |
| `text-gray-500`, `text-gray-600`, `text-gray-700` | `text-apagado` (solo si es decorativo; si hay que leerlo, `text-tenue`) |
| `text-pink-*`, `hover:text-pink-500` | `text-tinta` / `hover:text-tinta` (el acento ya no es rosa) |
| `text-red-*` (errores) | `text-rojo-claro` |
| `bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent` | `text-tinta font-bold` |
| Botón con degradado | `claseBoton({ variante: 'primario' })` |
| Botón `rounded-full border border-gray-600 …` | `claseBoton({ variante: 'secundario', tamano: 'sm' })` |
| `rounded-full border px-2 py-0.5 …` (etiqueta) | `<Insignia tono="…">` |
| `rounded-lg`, `rounded-md` en contenedores | `rounded-item` / `rounded-panel` / `rounded-tarjeta` |
| `rounded-xl` / `rounded-2xl` en secciones | `<Tarjeta>` |
| `inputClass` | `claseCampo` |
| `focus:border-pink-500`, `ring-pink-500` | Nada: el foco ya lo resuelven `claseCampo` y el `:focus-visible` global. |
| `twMerge(…)` | `cn(…)` |
| `max-w-5xl` (contenedor de página) | `max-w-pagina` |

---

## Estado de la migración

**Base**
- [x] Tokens en `app/globals.css` (`@theme`)
- [x] DM Sans en `app/layout.tsx`
- [x] `lib/cn.ts`
- [x] `components/ui/`: `boton`, `insignia`, `tarjeta`, `campo`
- [x] Adaptados: `modal`, `form-input`, `loading-button`, `spinner`, toasts
- [ ] Borrar `tailwind.config.ts` (no se usa en Tailwind v4)
- [ ] `tonoEstadoPartido` y `tonoEstadoTemporada` en `lib/`

**Públicas**
- [ ] `components/header.tsx` + `header-nav.tsx` + `auth-menu.tsx`
- [ ] `components/footer.tsx`
- [ ] `app/page.tsx` (hero, marquee, secciones) + `seccion-placeholder`, `marquee-equipos`
- [ ] `components/partido-tarjeta.tsx`, `partido-compacto.tsx`, `partido-detalle-modal.tsx`
- [ ] `app/equipos/*`
- [ ] `app/jugadores/*`
- [ ] `app/ligas/*`
- [ ] `app/login/*`, `app/register/*`

**Administración**
- [ ] `app/manejar-equipos/*`
- [ ] `app/manejar-jugadores/*`
- [ ] `app/manejar-partidos/*`
- [ ] `app/manejar-temporadas/*`

**Cierre**
- [ ] Borrar `inputClass`, `claseEstadoPartido`, `claseEstado` y las props obsoletas de `LoadingButton`
- [ ] Apagar la paleta por defecto de Tailwind (`--color-*: initial;`) y corregir lo que falle

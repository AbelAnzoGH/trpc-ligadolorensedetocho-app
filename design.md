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
| 2026-09-25 | **Header y footer migrados como ejemplo modelo** (los hizo Claude; el resto de páginas las migra Abel con ellos como referencia). | Tener una pieza real y comentada con la cual comparar vale más que la guía en abstracto. |
| 2026-09-25 | **La franja tricolor vive en el header** y hace de borde inferior (el header no lleva `border-b`). Como el header está en todas las páginas, **ninguna página agrega otra franja**. | Firma constante en todo el sitio y sin decidir página por página. |
| 2026-09-25 | **Enlaces de admin en un desplegable “Administrar”** en escritorio; en móvil van listados en su propio grupo. | Nueve elementos en la barra no caben ni se leen. En móvil hay espacio vertical de sobra. |
| 2026-09-25 | **Rutas del menú centralizadas en `lib/navegacion.ts`** (`enlacesPublicos`, `enlacesAdmin`, `esRutaActiva`). | Header y footer tenían la lista duplicada a mano y el footer ya se había quedado sin “Temporadas”. |
| 2026-09-25 | **Enlace activo marcado con `aria-current="page"`** y estilizado con `aria-[current=page]:…`. | Un solo atributo sirve al lector de pantalla y al estilo; no puede desincronizarse. |
| 2026-09-25 | **Nueva forma de trabajo:** Claude escribe el código, muestra la propuesta (capturas y resumen) y **pregunta antes de aplicarla**. Si hay dudas, Abel indica cómo lo necesita. | Decisión de Abel. Sustituye al reparto anterior (Claude la base, Abel las páginas). |
| 2026-09-25 | **El nombre se escribe junto, “LIGADOLORENSEDETOCHO”**, también en el título de la portada. Para que quepa se creó el token `text-marca`, un tamaño fluido que depende del ancho de pantalla. | Decisión de Abel: es la forma del nombre de la liga. Con 20 letras sin espacios no se puede partir en líneas; en lugar de eso se ajusta el tamaño. |
| 2026-09-25 | **Botones del hero:** “Ver equipos” (primario) y “Ver jugadores” (secundario). | Aprobado por Abel. |
| 2026-09-25 | **Los estados vacíos van en `text-tenue`**, no en `text-apagado` (corrección). | El aviso sí hay que leerlo, y `apagado` no pasa contraste AA. El patrón contradecía la regla de color. |
| 2026-09-25 | **Migración completa pantalla por pantalla**, un commit por pantalla, sin push. | Decisión de Abel: que todas las ventanas armonicen entre sí. |
| 2026-09-25 | **`claseCampo` ya no trae `block w-full`** y mide 40px de alto (`px-3.5 py-2`). Etiqueta, ayuda y error ya no traen margen: la separación la pone `claseGrupoCampo` (`flex flex-col gap-2`). Nuevo: `claseCasilla` para checkboxes. | Las pantallas de admin ponen anchos propios (`w-24`, `min-w-40`); si chocan dos anchos gana el que Tailwind escribe después en el CSS, no el último en el `className`. Con 40px, un input y un `<Boton>` md quedan parejos en la misma fila. |
| 2026-09-25 | **Tonos de estado implementados:** `tonoEstadoPartido`, `tonoDefault` (`lib/game-ui.ts`) y `tonoEstadoTemporada` (`lib/season-ui.ts`). | Sustituyen a `claseEstadoPartido` y `claseEstado`, que quedan como `@deprecated` hasta la limpieza final. |
| 2026-09-25 | **En un partido jugado, el perdedor se atenúa** (nombre y marcador en `tenue`); en un empate, ninguno. | El resultado se entiende sin leer los números. |
| 2026-09-25 | **Nuevos componentes compartidos:** `Pagina`, `EncabezadoPagina`, `TituloSeccion` (`ui/pagina.tsx`), `Cargando`, `MensajeError`, `Vacio` (`ui/estado.tsx`), `Avatar` (`ui/avatar.tsx`) y `claseEnlace` (`ui/enlace.ts`). | Todas las pantallas repetían a mano su encabezado, su “Cargando…”, su error en rojo y su lista vacía, cada una distinta. Con componentes, armonizan por construcción. |
| 2026-09-25 | **/equipos pasa de tabla a rejilla de tarjetas** (cada una es un `<button>`). | Pocas columnas de datos y el logo es lo que identifica al equipo. Un `<button>` real reemplaza al `<tr role="button">` que había que programar a mano para el teclado. |
| 2026-09-25 | **Todo logo de equipo se pinta con `LogoEquipo`** (también en `PartidoTarjeta`). | Un equipo sin logo muestra sus iniciales en todas partes, en vez de “s/l” en un sitio e iniciales en otro. |
| 2026-09-25 | **El número de camiseta** va en `text-subtitulo font-bold tabular-nums text-tinta` con el “#” en `apagado`. | Antes iba en rosa y en monoespaciada. El número es lo que se lee; el “#” solo acompaña. |
| 2026-09-25 | **Login y registro pasan al español** (“Bienvenido de vuelta”, “Correo electrónico”, “Crear cuenta”…), también sus toasts. | Eran las únicas pantallas en inglés; armonizar también es hablar igual en todo el sitio. |
| 2026-09-25 | **Las páginas de acceso son la única excepción centrada** (`components/acceso.tsx`). | Un formulario corto y solo en la pantalla se lee mejor en una columna angosta y centrada. |
| 2026-09-25 | **Esquema único para /manejar-\***: antetítulo “Administración”, título corto, columna `max-w-4xl` (`ContenidoAdmin`) y bloques como tarjetas de panel con pasos numerados. El borde rosa del “bloque activo” pasa a `border-borde-fuerte`. | Las cuatro pantallas ya compartían la estructura, pero cada una con clases propias. |
| 2026-09-25 | **Sin emojis en la interfaz:** “✅ playoffs / ❌ playoffs” pasa a una `<Insignia tono="peligro">` que solo aparece si NO está disponible. | Es la misma regla de la tarjeta pública: solo se avisa lo que no es normal. |
| 2026-09-25 | **Ojo con `space-y-*` en Tailwind v4:** pone el margen *abajo* de cada hijo con especificidad cero, así que un `mb-0` en un hijo lo anula. | Nos pasó en /manejar-jugadores: el título quedó pegado a los filtros. |
| 2026-09-25 | **Migración terminada.** Todas las pantallas usan el sistema; se borraron `inputClass`, `claseEstadoPartido`, `claseEstado`, las props viejas de `LoadingButton` y `tailwind.config.ts`, y se apagó la paleta por defecto de Tailwind. | A partir de aquí, lo nuevo se construye con los componentes y patrones de este documento; lo que no exista se agrega aquí primero. |
| 2026-09-25 | **Pendiente (comportamiento, no diseño):** “Eliminar” no pide confirmación en ninguna pantalla. La regla del botón `peligro` dice que debería. | Queda anotado; se decide aparte porque cambia cómo funciona la app. |
| 2026-09-25 | **Plantel editable en un modal** (`components/plantel-modal.tsx`), abierto con “Plantel” (`fantasma sm`) desde cada equipo en /manejar-equipos y desde cada inscripción en /manejar-temporadas. Dos modos con `claseChip`: “Jugador nuevo” y “Ya registrado”. | Decisión de Abel: registrar un plantel desde el equipo es más rápido que ir persona por persona en /manejar-jugadores. Un solo componente en los dos lugares para que se vean y funcionen igual. |

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
- **La paleta por defecto de Tailwind está apagada** (`--color-*: initial;` al inicio de `@theme`). `gray-800`, `pink-500`, `white`… no existen: si alguien los escribe, no se genera ninguna clase y se nota al instante. Un color nuevo se agrega como token en `globals.css` y aquí.

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
| `text-marca` | fluido: 20–64px | 1.1 | −0.02em | `font-semibold` | **Solo** para “LIGADOLORENSEDETOCHO” en tamaño de título. Se calcula como `(100vw − 4rem) / 12.6`: el nombre en DM Sans 600 mide 12.56 veces el tamaño de la letra, así que siempre ocupa una línea. Llega a 64px desde unos 870px de ancho. Si se cambia el peso, hay que volver a medir: en 700 mide 12.70 y ya no cabría. |

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
| Header fijo | `bg-canvas/80 backdrop-blur-lg` + `franja-tricolor` abajo (en lugar de borde). |
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
Tonos: `neutro` (por defecto), `contorno`, `exito`, `aviso`, `peligro` (estos tres con punto automático), `rojo`, `verde`. Acepta `title` para el texto al pasar el mouse (p. ej. `QB` → “Quarterback”).

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
<div className={claseGrupoCampo}>
    <label htmlFor="nombre" className={claseEtiqueta}>Nombre</label>
    <input id="nombre" className={`${claseCampo} w-full`} aria-invalid={!!error} {...register('nombre')} />
    {error && <span className={claseError}>{error}</span>}
</div>
```
- `claseCampo` sirve igual para `<input>`, `<select>` y `<textarea>`. **No trae ancho**: agrégalo tú (`w-full`, `w-24`, `min-w-40`…).
- Mide 40px de alto, igual que `<Boton>` md.
- Con `aria-invalid` el borde se pone rojo solo.
- `claseGrupoCampo` (`flex flex-col gap-2`) separa etiqueta, campo y mensaje. Etiqueta, ayuda y error no traen margen propio.
- `claseCasilla` para checkboxes y radios: tamaño 16px y palomita en `verde-claro` (`accent-color`).
- Sustituyó a `inputClass` (diseño viejo, ya borrado).

### Página — `components/ui/pagina.tsx`
Esqueleto de toda página interior (todas menos la portada):
```tsx
<Header />
<Pagina>
    <EncabezadoPagina titulo="Equipos de la liga" descripcion="…" acciones={<Boton>Nuevo</Boton>} />
    <TituloSeccion descripcion="…">Plantel</TituloSeccion>
    …
</Pagina>
```
- `Pagina`: `<main>` con `max-w-pagina` y los mismos márgenes que el header (el título queda alineado con el logo). Relleno: `pt-10 pb-16`, y `sm:pt-14 sm:pb-20`.
- `EncabezadoPagina`: título `text-titulo-sm sm:text-titulo font-semibold`, descripción `text-cuerpo text-tenue`, `antetitulo` opcional (`text-leyenda uppercase tracking-wider text-tenue`, p. ej. “Administración”) y `acciones` a la derecha.
- `TituloSeccion`: `text-subtitulo font-semibold` con descripción y acciones opcionales.

### Estados — `components/ui/estado.tsx`
```tsx
{cargando && <Cargando texto="Cargando equipos…" />}
{error && <MensajeError>Error: {error}</MensajeError>}
{vacia && <Vacio accion={<Boton variante="secundario" tamano="sm">Crear</Boton>}>Todavía no hay equipos.</Vacio>}
```
- `Cargando`: spinner de 32px + texto `text-meta text-tenue`, centrado, con `role="status"`.
- `MensajeError`: caja `rounded-item border-rojo-claro/30 bg-rojo-claro/10 text-rojo-claro`, con `role="alert"`.
- `Vacio`: patrón de *Estados vacíos* (borde punteado) con acción opcional.

### Avatar — `components/ui/avatar.tsx`
Foto redonda de un jugador (`rounded-full border-borde bg-superficie-2`, `object-cover`). Sin foto, muestra iniciales en `tinta-2`. Es la única forma de pintar a una persona en el sitio.

### Enlace en texto — `components/ui/enlace.ts`
`claseEnlace`: `font-medium text-tinta-2` con subrayado `decoration-borde-fuerte underline-offset-4`, que se enciende al hover. Para enlaces dentro de una frase. Los enlaces que parecen botón usan `claseBoton`.

### Ya adaptados (sin cambiar cómo se usan)
- **`Modal`**: `bg-superficie`, `rounded-panel`, borde fino, título `text-subtitulo`, botón de cerrar con ícono SVG.
- **`FormInput`**: usa `claseCampo`, conecta `<label>` con `<input>` por `id` y anuncia el error al lector de pantalla.
- **`LoadingButton`**: es el `Boton` primario `lg` a todo lo ancho. Se desactiva mientras carga (evita el doble envío). Acepta `variante`; las props viejas `btnColor` y `textColor` ya se borraron.
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

Implementado en `tonoEstadoPartido` y `tonoDefault` (`lib/game-ui.ts`) y en `tonoEstadoTemporada` (`lib/season-ui.ts`):
```tsx
<Insignia tono={tonoEstadoPartido[p.status]}>{etiquetaEstadoPartido[p.status]}</Insignia>
<Insignia tono={tonoEstadoTemporada[t.status]}>{etiquetaEstado[t.status]}</Insignia>
```

---

## Patrones de página (por construir)

Son las piezas que se arman **con** los componentes base durante la migración. Cuando una se construya, pasa a “implementado” con la ruta de su archivo.

### Header — ✅ implementado
`components/header.tsx` (servidor) + `header-nav.tsx` (cliente) + `menu-admin.tsx` + `boton-salir.tsx`. Rutas en `lib/navegacion.ts`.
- Fijo, `h-16`, `bg-canvas/80 backdrop-blur-lg`, **`franja-tricolor` como borde inferior** (sin `border-b`).
- Logo + “LIGADOLORENSEDETOCHO” en `font-bold tracking-tight text-tinta`, sin degradado.
- Enlaces de escritorio: `text-meta font-medium text-tenue hover:text-tinta`. El activo (`aria-current="page"`) en `text-tinta` con una raya de 2px `bg-rojo` debajo, hecha con `after:`.
- Admin (escritorio): botón “Administrar” con desplegable (`rounded-item`, `bg-superficie`, borde fino, filas `rounded-control`). Se cierra con Escape, con un clic fuera o al elegir un enlace. Es un *disclosure*, no un `role="menu"`.
- Sesión: `BotonSalir` (`secundario sm`), un `<button>` real que funciona con teclado.
- Móvil: botón hamburguesa `size-10`. El panel va en `bg-superficie`, con filas de 44px de alto (`h-11 rounded-item`); el activo lleva `bg-superficie-2`. El grupo “Administración” va con título, y “Salir” a todo lo ancho al final.

### Footer — ✅ implementado
`components/footer.tsx`. Mismo ancho y márgenes que el header (`max-w-pagina px-4 sm:px-6`) para que los bordes queden alineados. Solo `border-t border-borde`, sin fondo propio. Marca a la izquierda (logo `h-12` + nombre + “Tocho bandera · Dolores Hidalgo, Gto.” en `text-meta text-tenue`). Columna “La liga” con los enlaces de `enlacesPublicos` (dos columnas en móvil). Copyright en `text-leyenda text-tenue`, separado por un borde fino.

### Hero de portada — ✅ implementado
`app/page.tsx`. Alineado a la izquierda (no centrado), `pt-16 sm:pt-24`.
- Arriba, `<Insignia tono="contorno">Tocho bandera · Dolores Hidalgo, Gto.</Insignia>`.
- `<h1>` en dos partes: “Bienvenido a la” en `text-subtitulo sm:text-titulo-sm lg:text-titulo text-tinta-2`, y debajo “LIGADOLORENSEDETOCHO” en `text-marca text-tinta` (con `wrap-anywhere` solo como seguro para pantallas de menos de 300px).
- Párrafo en `text-cuerpo-lg text-tenue max-w-2xl`.
- Botones: `primario lg` “Ver equipos” y `secundario lg` “Ver jugadores”.
- Debajo, la cinta de logos y luego las secciones (`<SeccionPlaceholder>`, que es una `<Tarjeta>` pública con estado vacío).

### Bloque de estadísticas
Fila de 3 bloques. El número en `text-titulo-sm sm:text-titulo font-semibold tabular-nums text-tinta` y la etiqueta en `text-meta text-tenue`. Ejemplos: equipos inscritos, partidos jugados, jugadores.

### Tarjeta de partido — ✅ implementado
Tres versiones que comparten el mismo lenguaje:
- **`components/partido-tarjeta.tsx`** (rol de admin y lista completa): `rounded-item border border-borde bg-superficie px-4 py-3`. Arriba, metadatos en `text-meta text-tenue` (la fecha en `tinta-2 font-medium`) con insignias: categoría `neutro`, estado según la tabla y `Default` en `aviso`. En medio, una rejilla `1fr auto 1fr`: nombres en `font-semibold` y marcador en `text-subtitulo font-bold tabular-nums`. Si no se ha jugado, “VS” en `text-leyenda uppercase tracking-wider text-apagado`. Los logos van en un recuadro de `size-8 rounded-insignia bg-canvas border-borde`.
- **`components/partido-compacto.tsx`** (rol público): es un `<button>` con aspecto de tarjeta interactiva (`hover:bg-superficie-2 hover:border-borde-fuerte`). Marcador en `text-titulo-sm` con dos dígitos (“00” en `apagado` si no se ha jugado). Solo lleva insignia si el estado NO es normal.
- **`components/partido-detalle-modal.tsx`**: logos de 72px, marcador en `text-titulo-sm`, detalles en una lista `<dl>` con `divide-y divide-borde rounded-item`, y el aviso de default en una caja `aviso/10`.

En un partido jugado, **el perdedor va en `tenue`** y el ganador en `tinta`. En un empate, los dos en `tinta`.

### Barra de filtros — ✅ implementado (/equipos)
Fila de selects (`claseGrupoCampo` + `claseCampo` con `min-w-40`) alineados abajo (`flex flex-wrap items-end gap-3`), **sin caja**, separada del contenido con `border-b border-borde pb-6`. Debajo, una línea de resumen en `text-meta text-tenue` (“8 equipos en LDT VII”), con la temporada como `claseEnlace`.

Cuando hay muchos filtros (/jugadores), van en una rejilla debajo del selector de temporada: `grid grid-cols-2 gap-3 lg:grid-cols-[…]` con `[&>*]:min-w-0`, para que un `<select>` con opciones largas no desborde su celda. **Buscar** va primero y más ancho. **Limpiar filtros** es un `<Boton variante="fantasma">` alineado con los campos (`self-end`) y desactivado si no hay filtros. En teléfono, Buscar y Limpiar van a lo ancho y el resto de dos en dos. Si los filtros dejan la lista vacía, el `<Vacio>` ofrece también “Limpiar filtros”.

### Tarjeta de jugador — ✅ implementado (/jugadores)
`rounded-panel border-borde bg-superficie overflow-hidden`, con la foto arriba de borde a borde (`aspect-[4/3] object-cover`; sin foto, iniciales en `text-titulo text-tenue` sobre `superficie-2`). El número va sobre la foto, en una píldora `bg-canvas/80 backdrop-blur-sm`. Debajo: nombre `text-cuerpo-lg font-semibold`, equipo en `text-meta text-tenue`, categoría como `<Insignia>`, posiciones con `tono="contorno"` y las estadísticas en un `<dl>` de dos columnas (`tabular-nums`) empujado al fondo con `mt-auto`. “No disponible para playoffs” es una `<Insignia tono="peligro">`. No es clicable, así que no reacciona al hover.

### Rejilla de equipos — ✅ implementado (/equipos y página de temporada)
`grid gap-3 sm:grid-cols-2 lg:grid-cols-3` de **`<TarjetaEquipo>`** (`components/tarjeta-equipo.tsx`), un `<button>` con `claseTarjeta({ variante: 'panel', interactiva: true })`: `LogoEquipo` de 56px, nombre en `text-cuerpo-lg font-semibold` y, debajo, la categoría como `<Insignia>` y el número de jugadores en `text-meta text-tenue`. Con `mostrarCategoria={false}` oculta la insignia cuando la categoría ya está en el título del grupo.

### Grupos dentro de una sección
Cuando una sección se divide (equipos por categoría, partidos por jornada):
- **Por categoría:** título `text-leyenda font-medium uppercase tracking-wider text-tenue` (“VARONIL LIBRE · 3”).
- **Por jornada:** título `text-cuerpo font-semibold text-tinta-2`, con el día en `font-normal text-tenue` (“Jornada 5 · domingo, 4 de octubre de 2026”).
- Entre grupos, `space-y-8`. Entre secciones de una página, `space-y-12` a `space-y-16`.

### Lista de temporadas — ✅ implementado (/ligas)
Una sección por liga (`TituloSeccion` con su nombre) y una rejilla de tarjetas-enlace (`<Link className={claseTarjeta({ variante: 'panel', interactiva: true })}>`): “Temporada VII” en `text-cuerpo-lg font-semibold`, número de equipos en `text-meta text-tenue` y el estado como `<Insignia tono={tonoEstadoTemporada[…]}>` a la derecha.

### Miga de pan — ✅ implementado (página de temporada)
Encima del `EncabezadoPagina`: `<Link className="mb-6 inline-flex items-center gap-1.5 text-meta text-tenue hover:text-tinta">← Todas las temporadas</Link>`. Solo en páginas que dependen de otra (una temporada depende de /ligas).

### Encabezado de temporada — ✅ implementado
El título es el nombre (“LDT VII”). En la descripción van el estado como `<Insignia>` y un resumen (“8 equipos · 12 partidos”). Las secciones (Rol de juegos, Equipos) usan `TituloSeccion`. El filtro de categoría del rol va en las `acciones` del título, con la etiqueta en `sr-only` porque “Todas las categorías” ya dice qué filtra.

### Plantel (lista de jugadores en un modal) — ✅ implementado
`ul.divide-y.divide-borde`. En cada fila: `Avatar` de 52px, nombre `font-semibold text-tinta`, posiciones como `<Insignia tono="contorno" title="Quarterback">QB</Insignia>` y el número de camiseta a la derecha.

### Plantel editable (modal de administración) — ✅ implementado
`components/plantel-modal.tsx`. Mismo aspecto de fila que el *Plantel* público, pero con `Avatar` de 40px y un “Quitar” (`peligro sm`) a la derecha del número. Si el equipo tiene varias inscripciones, arriba va un `<select>` “Temporada y categoría”. Debajo, separado por `border-t border-borde pt-5`, el formulario “Agregar jugador”: los modos como chips (`claseChip` sobre `<button aria-pressed>`), los campos de la persona en `grid sm:grid-cols-2`, y el único primario, “Agregar al plantel”, a todo lo ancho. Los avisos (“ya hay una persona con ese nombre”, “el #7 ya lo usa…”) van en `text-meta text-aviso`, sin caja, como en *Rol de admin*. Si la temporada está cerrada, el formulario y los “Quitar” desaparecen y queda una `<Nota>`.

### Acceso (login y registro) — ✅ implementado
`components/acceso.tsx`: columna `max-w-md` centrada con el logo (`h-12`), título `text-titulo-sm`, descripción en `tenue`, el formulario dentro de una `<Tarjeta variante="panel" className="sm:p-8">` y, debajo, la línea “¿No tienes cuenta? Regístrate” con `claseEnlace`. El formulario solo lleva campos (`FormInput`) y el `LoadingButton`, que es el único botón primario.

### Páginas de administración — ✅ implementado (/manejar-equipos; mismo esquema en las demás)
```tsx
<Header />
<Pagina>
    <ContenidoAdmin>                       {/* max-w-4xl, alineado a la izquierda */}
        <EncabezadoPagina
            antetitulo="Administración"
            titulo="Equipos"                 {/* corto: el menú ya dice "Administrar" */}
            descripcion={<>… <Link className={claseEnlace}>Temporadas</Link></>}
            acciones={<Link className={claseBoton({ variante: 'secundario', tamano: 'sm' })}>Ver listado público</Link>}
        />
        <Panel />
    </ContenidoAdmin>
</Pagina>
```
- **Cada bloque de trabajo** es una `<Tarjeta variante="panel" as="section">` con su `<TituloSeccion>`. Si los bloques se recorren en orden, llevan número: `<TituloSeccion paso={1}>Ligas</TituloSeccion>`, con el número en `tenue`.
- **Bloque activo** (el que depende de lo elegido arriba; antes llevaba borde rosa): `className="border-borde-fuerte"`.
- **Formularios:** `space-y-5`; campos con `claseGrupoCampo` y `claseCampo`; grupos opcionales en un `<fieldset className="rounded-item border border-borde p-4">`; casillas con `claseCasilla` y etiqueta `text-meta text-tinta-2`.
- **Botones del formulario:** `Boton` primario (“Crear equipo”, “Guardar cambios”) y `secundario` para “Cancelar”. Mientras guarda: “Guardando…” y deshabilitado.
- **Listas:** `claseLista` y `claseFila` (`components/ui/lista.ts`). En cada fila: datos a la izquierda (nombre en `font-semibold text-tinta` y detalle en `text-meta text-tenue`) y botones a la derecha en `claseAccionesFila`: “Editar” como `fantasma sm` y “Eliminar” como `peligro sm`. Las filas no reaccionan al hover.
- **Selector de imagen** (`components/selector-imagen.tsx`): vista previa `size-20 rounded-item` con borde punteado; el botón nativo de archivo tiene el aspecto de un `secundario sm` (vía `file:`); “Quitar logo/foto” como enlace en `rojo-claro`.

### Tarjeta de persona con subformularios — ✅ implementado (/manejar-jugadores)
Cuando una tarjeta administra varias cosas (la persona y sus membresías):
- La tarjeta es un `<Tarjeta variante="panel" as="li">`, con los datos arriba (nombre `text-cuerpo-lg font-semibold`) y sus botones en `claseAccionesFila`.
- Cada elemento hijo (una membresía) es una fila `rounded-item border border-borde bg-canvas p-3` con `Avatar`, número de camiseta, nombre, `<Insignia>` de categoría y estadísticas en `text-leyenda tabular-nums text-tenue`. **El historial** (otras temporadas) va con `opacity-60`.
- **Un subformulario abierto** (editar o agregar una membresía) usa `rounded-item border border-borde-fuerte bg-canvas p-4`: el borde fuerte marca “esto es lo que estás editando”. Botones `sm`.
- Acción para abrir un subformulario: `<Boton variante="secundario" tamano="sm">+ Agregar…</Boton>`.

### Chips seleccionables — ✅ implementado (posiciones y categorías de temporada)
Una sola clase, **`claseChip(activa)`** (`components/ui/chip.ts`), sobre un `<label>` con checkbox oculto (posiciones) o sobre un `<button aria-pressed>` (categorías). Forma de insignia (`rounded-insignia border px-3 py-1 text-meta font-semibold`). Si no está elegido: `border-borde-fuerte text-tenue`. Si está elegido: `border-verde-claro/50 bg-verde-claro/15 text-verde-claro` (el verde de “activo”, como la casilla y el foco). Con el checkbox oculto, el foco del teclado se dibuja en la etiqueta con `has-[:focus-visible]:outline-…`. Deshabilitado: `opacity-50`.

### Rol de admin y captura de resultados — ✅ implementado (/manejar-partidos)
- **Pasos:** 1 Sedes, 2 Temporada de trabajo (bloque activo, con “Trabajando en LDT VII” como enlace), 3 Nuevo partido, 4 El rol. Mismos títulos de jornada que la página pública.
- **Acciones de un partido:** van dentro de `PartidoTarjeta`, separadas por `border-t border-borde pt-3`. “Capturar resultado” como `secundario sm` (es la principal de la fila, pero un primario por fila serían diez en pantalla); “Editar / reprogramar” y “Suspender/Reactivar” como `fantasma sm`; “Borrar” como `peligro sm`.
- **Modal de marcador:** dos campos grandes (`cn(claseCampo, 'h-14 py-0 text-center text-titulo-sm font-bold tabular-nums')`) con el nombre del equipo como etiqueta. “Guardar resultado” es el único primario, a todo lo ancho. Debajo, separadas por `border-t`: “Ganado por default” (botones `secundario`) y “Deshacer resultado” (`peligro`).
- **Avisos dentro de un formulario** (“Hay menos de dos equipos…”, “los otros partidos de la jornada son en otro día”): `text-meta text-aviso`, sin caja.
- **Fecha y hora** (`campos-fecha.tsx`): selects de `claseCampo` con `px-2.5` (vía `cn`). Los dos puntos de la hora van en `tenue`.

### Nota informativa — ✅ implementado
`<Nota>` (`components/ui/estado.tsx`): `rounded-item border border-borde bg-canvas px-4 py-3 text-meta text-tenue`. Para lo que conviene saber y **no** es un error (“Esta temporada está cerrada…”). Es neutra a propósito: amarilla o roja parecería un problema.

### Controles compactos dentro de una fila
Si un `<select>` va junto a botones `sm` en una fila de lista, se compacta a su altura con `cn(claseCampo, 'h-8 py-0 text-meta')`. **Con `cn()`, no con un template string:** `py-0` y el `py-2` de `claseCampo` chocan, y con un template string ganaría el que Tailwind escriba después en el CSS.

### Tablas (equipos, jugadores, posiciones)
Dentro de `<Tarjeta variante="panel" className="p-0 overflow-hidden">`. Encabezados en `text-leyenda uppercase tracking-wider text-tenue`, sin fondo. Filas con `border-t border-borde`, `hover:bg-superficie-2/50` y celdas `px-4 py-3 text-meta`. Nada de filas de colores alternos (cebra). En móvil, desplazamiento horizontal (`overflow-x-auto`) o una tarjeta por fila.

### Cinta de logos (marquee) — ✅ implementado
`components/marquee-equipos.tsx`. `border-y border-borde`, sin fondo. Logos en `grayscale opacity-60`; al pasar el mouse vuelven al color (`hover:grayscale-0 hover:opacity-100`), y la cinta se pausa. Así no compite con el contenido; es prueba social, como en la referencia. Los desvanecidos de los bordes van `from-canvas` a transparente (única excepción a “sin degradados”: no decoran, desvanecen). Cada logo lleva el nombre del equipo como texto alternativo.

### Estados vacíos / “Próximamente” — ✅ implementado
En `components/seccion-placeholder.tsx`. `rounded-item border border-dashed border-borde-fuerte` y texto `text-meta font-medium text-tenue`, centrado. Un solo mensaje corto y, si aplica, un botón `secundario sm` con la acción que lo llenaría.

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
- No usar degradados (salvo la franja tricolor y el desvanecido de la cinta de logos). La paleta vieja ya ni existe.
- No poner `shadow-*` en tarjetas.
- No usar radios menores a 12px en contenedores.
- No usar `rojo` ni `verde` como color de **texto** (no se leen): para texto van `rojo-claro` y `verde-claro`.
- No usar `text-apagado` para información que haya que leer.
- No escribir `#000`, `#fff` ni colores hexadecimales sueltos en los componentes.
- No poner otra franja tricolor en las páginas: la del header ya es la única de cada vista.
- No escribir rutas del menú a mano: agregarlas a `lib/navegacion.ts`.

---

## Guía de migración (clase vieja → nueva)

> Histórica: la migración terminó el 2026-09-25. Se conserva como diccionario por si aparece código viejo (una rama antigua, un ejemplo copiado de internet).

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
- [x] Borrar `tailwind.config.ts` (no se usa en Tailwind v4)
- [x] `tonoEstadoPartido` y `tonoEstadoTemporada` en `lib/`
- [x] Componentes de partido compartidos: `partido-tarjeta`, `partido-compacto`, `partido-detalle-modal`, `logo-equipo`, `selector-temporada`

**Públicas**
- [x] `components/header.tsx` + `header-nav.tsx` + `menu-admin.tsx` + `boton-salir.tsx` (sustituye a `auth-menu.tsx`) + `lib/navegacion.ts`
- [x] `components/footer.tsx`
- [x] `app/page.tsx` (hero, marquee, secciones) + `seccion-placeholder`, `marquee-equipos`
- [x] `app/equipos/*` (+ `ui/pagina`, `ui/estado`, `ui/avatar`, `ui/enlace`)
- [x] `app/jugadores/*`
- [x] `app/ligas/*` (+ `components/tarjeta-equipo.tsx`, compartida con /equipos)
- [x] `app/login/*`, `app/register/*` (+ `components/acceso.tsx`)

**Administración**
- [x] `app/manejar-equipos/*` (+ `ui/lista.ts`, `ContenidoAdmin`, `selector-imagen`)
- [x] `app/manejar-jugadores/*`
- [x] `app/manejar-partidos/*`
- [x] `app/manejar-temporadas/*` (+ `ui/chip.ts`, `Nota`)

**Cierre**
- [x] Borrar `inputClass`, `claseEstadoPartido`, `claseEstado` y las props obsoletas de `LoadingButton`
- [x] Apagar la paleta por defecto de Tailwind (`--color-*: initial;`). No hubo que corregir nada: se verificó que todas las clases de color del proyecto usan tokens.

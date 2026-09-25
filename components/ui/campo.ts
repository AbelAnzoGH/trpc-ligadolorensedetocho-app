/**
 * Clases para campos de formulario: <input>, <select>, <textarea>.
 *
 * Son strings y no componentes porque los formularios del sitio usan
 * react-hook-form con `{...register('nombre')}` directo sobre el <input>,
 * y envolverlo en un componente complicaría pasar el ref. Así:
 *
 *   <div className={claseGrupoCampo}>
 *       <label htmlFor="nombre" className={claseEtiqueta}>Nombre</label>
 *       <input id="nombre" className={`${claseCampo} w-full`} {...register('nombre')} />
 *       {error && <span className={claseError}>{error}</span>}
 *   </div>
 *
 * Reglas:
 *   - claseCampo NO trae ancho ni `display`: cada pantalla pone el suyo
 *     (`w-full`, `w-24`, `min-w-40`…). Si trajera `w-full` y alguien le
 *     sumara `w-24`, ganaría el que Tailwind escriba después en el CSS, no
 *     el que escribiste al final: un bug difícil de ver.
 *   - Etiqueta, ayuda y error NO traen margen: la separación la pone el
 *     contenedor (claseGrupoCampo), así se ve igual en todas partes.
 */

/**
 * - 40px de alto (py-2 + texto de 15px + borde): igual que un <Boton> md,
 *   para que un input y un botón en la misma fila queden parejos.
 * - bg-canvas: el campo se ve "hundido" tanto sobre el fondo como sobre una tarjeta.
 * - aria-[invalid=true]: si el input tiene aria-invalid, el borde se pone rojo solo.
 * - outline-none + ring: el foco se marca con borde verde y un halo suave, en vez
 *   del contorno global, que en un campo de texto se vería doble.
 */
export const claseCampo =
    'rounded-control border border-borde bg-canvas px-3.5 py-2 ' +
    'text-cuerpo text-tinta placeholder:text-apagado ' +
    'outline-none transition-colors hover:border-borde-fuerte ' +
    'focus:border-foco focus:ring-3 focus:ring-foco/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    'aria-[invalid=true]:border-rojo-claro aria-[invalid=true]:focus:ring-rojo-claro/20';

/** Contenedor de etiqueta + campo + mensaje. */
export const claseGrupoCampo = 'flex flex-col gap-2';

export const claseEtiqueta = 'text-meta font-medium text-tinta-2';

/** Texto de ayuda debajo del campo. */
export const claseAyuda = 'text-leyenda text-tenue';

/** Mensaje de error debajo del campo. */
export const claseError = 'text-leyenda text-rojo-claro';

/** Casilla (checkbox/radio): el color de la palomita es el verde del foco. */
export const claseCasilla = 'size-4 shrink-0 accent-verde-claro';

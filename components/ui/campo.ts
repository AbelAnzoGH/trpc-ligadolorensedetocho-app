/**
 * Clases para campos de formulario: <input>, <select>, <textarea>.
 *
 * Son strings y no componentes porque los formularios del sitio usan
 * react-hook-form con `{...register('nombre')}` directo sobre el <input>,
 * y envolverlo en un componente complicaría pasar el ref. Así:
 *
 *   <label htmlFor="nombre" className={claseEtiqueta}>Nombre</label>
 *   <input id="nombre" className={claseCampo} {...register('nombre')} />
 *   {error && <span className={claseError}>{error}</span>}
 *
 * Reemplaza a `inputClass` de lib/team-ui.ts (que era para el diseño viejo).
 */

/**
 * - bg-canvas: el campo se ve "hundido" tanto sobre el fondo como sobre una tarjeta.
 * - aria-[invalid=true]: si el input tiene aria-invalid, el borde se pone rojo solo.
 * - outline-none + ring: el foco se marca con borde verde y un halo suave, en vez
 *   del contorno global, que en un campo de texto se vería doble.
 */
export const claseCampo =
    'block w-full rounded-control border border-borde bg-canvas px-4 py-2.5 ' +
    'text-cuerpo text-tinta placeholder:text-apagado ' +
    'outline-none transition-colors hover:border-borde-fuerte ' +
    'focus:border-foco focus:ring-3 focus:ring-foco/20 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    'aria-[invalid=true]:border-rojo-claro aria-[invalid=true]:focus:ring-rojo-claro/20';

export const claseEtiqueta = 'mb-2 block text-meta font-medium text-tinta-2';

/** Texto de ayuda debajo del campo. */
export const claseAyuda = 'mt-1.5 block text-leyenda text-tenue';

/** Mensaje de error debajo del campo. */
export const claseError = 'mt-1.5 block text-leyenda text-rojo-claro';

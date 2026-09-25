/**
 * Lista administrable: filas separadas por una línea fina dentro de un marco.
 * La usan todos los paneles de /manejar-* para que sus listados se vean igual.
 *
 *   <ul className={claseLista}>
 *       <li className={claseFila}>
 *           <span className="min-w-0">…datos…</span>
 *           <span className={claseAccionesFila}>
 *               <Boton variante="fantasma" tamano="sm">Editar</Boton>
 *               <Boton variante="peligro" tamano="sm">Eliminar</Boton>
 *           </span>
 *       </li>
 *   </ul>
 *
 * Las filas no reaccionan al hover: lo clicable son sus botones, no la fila.
 */
export const claseLista = 'divide-y divide-borde overflow-hidden rounded-item border border-borde';

export const claseFila = 'flex flex-wrap items-center justify-between gap-3 px-4 py-3';

/** Contenedor de los botones al final de la fila. */
export const claseAccionesFila = 'flex shrink-0 flex-wrap gap-1.5';

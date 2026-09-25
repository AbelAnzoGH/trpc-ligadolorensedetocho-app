/**
 * Enlace dentro de un texto ("…en LDT VII", "¿Ya tienes cuenta? Inicia sesión").
 *
 * Subrayado fino en gris que se enciende al pasar el mouse. Así se reconoce
 * como enlace sin necesitar un color de acento: en este sistema el color es
 * puntuación, no se gasta en cada link.
 *
 *   <Link href="…" className={claseEnlace}>LDT VII</Link>
 */
export const claseEnlace =
    'font-medium text-tinta-2 underline decoration-borde-fuerte underline-offset-4 ' +
    'transition-colors hover:text-tinta hover:decoration-tinta';

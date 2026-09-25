import { cn } from '@/lib/cn';

/**
 * Chip que se prende y se apaga (posiciones de un jugador, categorías de una
 * temporada). Es una clase y no un componente porque cada caso lo monta
 * sobre algo distinto: un <label> con checkbox oculto, o un <button
 * aria-pressed>. Lo que importa es que se VEAN igual.
 *
 *   <button aria-pressed={activa} className={claseChip(activa)}>Mixto</button>
 *
 * Apagado: contorno gris. Prendido: verde claro, el verde de "activo"
 * (el mismo de la casilla y del anillo de foco).
 *
 * `has-[:focus-visible]` dibuja el foco del teclado en la etiqueta cuando el
 * checkbox de adentro está oculto (sr-only); en un <button> no estorba,
 * porque ahí ya actúa el :focus-visible global.
 */
export const claseChip = (activa: boolean, className?: string) =>
    cn(
        'cursor-pointer select-none rounded-insignia border px-3 py-1 text-meta font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco',
        activa
            ? 'border-verde-claro/50 bg-verde-claro/15 text-verde-claro'
            : 'border-borde-fuerte text-tenue hover:border-tenue hover:text-tinta',
        className,
    );

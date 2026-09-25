import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Botón del sistema de diseño.
 *
 * Se exporta de DOS formas, porque en el sitio hay botones que son <button>
 * y otros que son <Link> (navegan a otra página) y los dos deben verse igual:
 *
 *   <Boton variante="primario">Guardar</Boton>
 *
 *   <Link href="/equipos" className={claseBoton({ variante: 'secundario' })}>
 *       Ver equipos
 *   </Link>
 *
 * Reglas (ver design.md → Componentes):
 *   - primario:   la acción MÁS importante de la vista. Idealmente una sola.
 *   - secundario: acciones de apoyo ("Cancelar", "Ver jugadores").
 *   - fantasma:   acciones de poco peso dentro de tablas y tarjetas ("Editar").
 *   - peligro:    borrar, dar de baja. Siempre con confirmación.
 */

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ' +
    'transition-colors select-none ' +
    'disabled:pointer-events-none disabled:opacity-50';

const variantes: Record<VarianteBoton, string> = {
    // Relleno claro sobre fondo oscuro: el máximo contraste del sistema.
    primario: 'bg-tinta text-canvas shadow-boton hover:bg-tinta-2',
    secundario:
        'border border-borde-fuerte text-tinta-2 hover:border-tenue hover:bg-superficie-2 hover:text-tinta',
    fantasma: 'text-tenue hover:bg-superficie-2 hover:text-tinta',
    peligro: 'border border-rojo-claro/40 text-rojo-claro hover:border-rojo-claro hover:bg-rojo/15',
};

const tamanos: Record<TamanoBoton, string> = {
    sm: 'h-8 px-3 text-meta',
    md: 'h-10 px-4 text-cuerpo',
    lg: 'h-12 px-6 text-cuerpo',
};

type OpcionesBoton = {
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    /** Forma de píldora. Solo para la acción principal del header. */
    pildora?: boolean;
    /** Ocupa todo el ancho de su contenedor (formularios, móvil). */
    anchoCompleto?: boolean;
    className?: string;
};

export function claseBoton({
    variante = 'primario',
    tamano = 'md',
    pildora = false,
    anchoCompleto = false,
    className,
}: OpcionesBoton = {}) {
    return cn(
        base,
        variantes[variante],
        tamanos[tamano],
        pildora ? 'rounded-full' : 'rounded-control',
        anchoCompleto && 'w-full',
        className,
    );
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & OpcionesBoton;

export default function Boton({
    variante,
    tamano,
    pildora,
    anchoCompleto,
    className,
    // Por defecto "button", no "submit": un <button> dentro de un <form>
    // envía el formulario si no se le dice otra cosa, y eso sorprende.
    type = 'button',
    ...resto
}: BotonProps) {
    return (
        <button
            type={type}
            className={claseBoton({ variante, tamano, pildora, anchoCompleto, className })}
            {...resto}
        />
    );
}

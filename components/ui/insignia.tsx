import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Etiqueta pequeña: categoría, estado de un partido, estado de una temporada.
 *
 *   <Insignia>Varonil Libre</Insignia>
 *   <Insignia tono="contorno">Campo 2</Insignia>
 *   <Insignia tono="exito">En curso</Insignia>        ← lleva punto de color
 *   <Insignia tono="rojo">Campeón</Insignia>          ← acento del escudo, con moderación
 *
 * Tonos:
 *   neutro / contorno → la gran mayoría. Información, no alerta.
 *   exito / aviso / peligro → SOLO para estados (ver design.md → Estados).
 *   rojo / verde → colores del escudo. Máximo uno o dos por vista.
 */

export type TonoInsignia =
    | 'neutro'
    | 'contorno'
    | 'exito'
    | 'aviso'
    | 'peligro'
    | 'rojo'
    | 'verde';

// Todas llevan `border` (aunque sea transparente) para que midan lo mismo
// de alto, tengan o no contorno visible.
const tonos: Record<TonoInsignia, string> = {
    neutro: 'border-transparent bg-superficie-2 text-tinta-2',
    contorno: 'border-borde-fuerte text-tinta-2',
    exito: 'border-verde-claro/30 bg-verde-claro/10 text-verde-claro',
    aviso: 'border-aviso/30 bg-aviso/10 text-aviso',
    peligro: 'border-rojo-claro/30 bg-rojo-claro/10 text-rojo-claro',
    rojo: 'border-transparent bg-rojo text-tinta',
    verde: 'border-transparent bg-verde text-tinta',
};

/** Los tonos de estado muestran un punto, así el estado no depende solo del color del texto. */
const conPuntoPorDefecto: Record<TonoInsignia, boolean> = {
    neutro: false,
    contorno: false,
    exito: true,
    aviso: true,
    peligro: true,
    rojo: false,
    verde: false,
};

export default function Insignia({
    tono = 'neutro',
    punto,
    title,
    className,
    children,
}: {
    tono?: TonoInsignia;
    /** Fuerza mostrar u ocultar el punto. Si no se pasa, depende del tono. */
    punto?: boolean;
    /** Texto al pasar el mouse (p. ej. "Quarterback" para "QB"). */
    title?: string;
    className?: string;
    children: ReactNode;
}) {
    const mostrarPunto = punto ?? conPuntoPorDefecto[tono];

    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-insignia border px-2 py-0.5 text-leyenda font-medium',
                tonos[tono],
                className,
            )}
        >
            {/* bg-current: el punto toma el mismo color que el texto. */}
            {mostrarPunto && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
            {children}
        </span>
    );
}

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Contenedor con fondo de superficie y borde fino. Es la pieza con la que
 * se arma casi todo: secciones de la portada, paneles de administración,
 * el contenido de un modal.
 *
 *   <Tarjeta>…</Tarjeta>                              ← pública, radio 36px
 *   <Tarjeta variante="panel" as="section">…</Tarjeta> ← administración, radio 24px
 *   <Tarjeta variante="destacada">…</Tarjeta>         ← un bloque que debe resaltar
 *
 * Para una tarjeta que es un enlace completo (p. ej. la de un equipo):
 *   <Link href="…" className={claseTarjeta({ interactiva: true })}>…</Link>
 *
 * No lleva sombra: en este sistema la elevación es el borde de 1px.
 */

export type VarianteTarjeta = 'publica' | 'panel' | 'destacada';

const variantes: Record<VarianteTarjeta, string> = {
    publica: 'rounded-tarjeta p-5 sm:p-7',
    panel: 'rounded-panel p-5 sm:p-6',
    destacada: 'rounded-tarjeta border-borde-fuerte bg-superficie-2 p-5 sm:p-7',
};

type OpcionesTarjeta = {
    variante?: VarianteTarjeta;
    /** Reacciona al hover. Úsalo solo si toda la tarjeta es clicable. */
    interactiva?: boolean;
    className?: string;
};

export function claseTarjeta({ variante = 'publica', interactiva = false, className }: OpcionesTarjeta = {}) {
    return cn(
        'block border border-borde bg-superficie',
        variantes[variante],
        interactiva && 'transition-colors hover:border-borde-fuerte hover:bg-superficie-2',
        className,
    );
}

type TarjetaProps = HTMLAttributes<HTMLElement> &
    OpcionesTarjeta & {
        /** Qué etiqueta HTML usar. Por defecto <div>. */
        as?: 'div' | 'section' | 'article' | 'li' | 'aside';
    };

export default function Tarjeta({ as: Etiqueta = 'div', variante, interactiva, className, ...resto }: TarjetaProps) {
    return <Etiqueta className={claseTarjeta({ variante, interactiva, className })} {...resto} />;
}

import type { ReactNode } from 'react';
import Spinner from '@/components/spinner';
import { cn } from '@/lib/cn';

/**
 * Los tres estados que toda pantalla con datos tiene que mostrar, iguales en
 * todo el sitio (design.md → Patrones → Estados de carga, error y vacío):
 *
 *   {cargando && <Cargando texto="Cargando equipos…" />}
 *   {error && <MensajeError>{error}</MensajeError>}
 *   {!cargando && lista.length === 0 && <Vacio>Todavía no hay equipos.</Vacio>}
 */

/** Spinner + texto. `role="status"` hace que el lector de pantalla lo anuncie. */
export function Cargando({ texto = 'Cargando…', className }: { texto?: string; className?: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}
        >
            <Spinner width="2rem" height="2rem" />
            <p className="text-meta text-tenue">{texto}</p>
        </div>
    );
}

/**
 * Caja de error. `role="alert"` lo anuncia al aparecer.
 * Rojo claro con fondo muy suave: se nota sin gritar.
 */
export function MensajeError({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <p
            role="alert"
            className={cn(
                'rounded-item border border-rojo-claro/30 bg-rojo-claro/10 px-4 py-3 text-meta text-rojo-claro',
                className,
            )}
        >
            {children}
        </p>
    );
}

/** Lista vacía: borde punteado (el hueco donde irá el contenido) y un mensaje corto. */
export function Vacio({
    children,
    accion,
    className,
}: {
    children: ReactNode;
    /** Un botón `secundario sm` con la acción que llenaría la lista, si la hay. */
    accion?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-item border border-dashed border-borde-fuerte px-6 py-10 text-center',
                className,
            )}
        >
            <p className="max-w-md text-meta text-tenue">{children}</p>
            {accion}
        </div>
    );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Esqueleto común de TODAS las páginas interiores (todas menos la portada).
 *
 *   <Header />
 *   <Pagina>
 *       <EncabezadoPagina titulo="Equipos" descripcion="…" />
 *       …contenido…
 *   </Pagina>
 *
 * Así todas comparten el mismo ancho (el del header, para que el título
 * quede alineado con el logo), los mismos márgenes y el mismo ritmo vertical.
 */
export function Pagina({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <main className={cn('mx-auto w-full max-w-pagina px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20', className)}>
            {children}
        </main>
    );
}

/**
 * Título de la página, con descripción y acciones opcionales a la derecha.
 *
 * - Alineado a la izquierda, sin degradado.
 * - `antetitulo`: una palabra de contexto sobre el título ("Administración").
 * - `acciones`: botones que afectan a toda la página ("Nuevo equipo").
 *   En móvil bajan debajo del título.
 */
export function EncabezadoPagina({
    titulo,
    descripcion,
    antetitulo,
    acciones,
}: {
    titulo: ReactNode;
    descripcion?: ReactNode;
    antetitulo?: ReactNode;
    acciones?: ReactNode;
}) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 sm:mb-10">
            <div className="max-w-2xl">
                {antetitulo && (
                    <p className="mb-2 text-leyenda font-medium uppercase tracking-wider text-tenue">{antetitulo}</p>
                )}
                <h1 className="text-titulo-sm font-semibold text-tinta sm:text-titulo">{titulo}</h1>
                {descripcion && <p className="mt-3 text-cuerpo text-tenue">{descripcion}</p>}
            </div>
            {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
        </div>
    );
}

/** Título de una sección dentro de la página o de una tarjeta. */
export function TituloSeccion({
    children,
    descripcion,
    acciones,
    className,
}: {
    children: ReactNode;
    descripcion?: ReactNode;
    acciones?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
            <div>
                <h2 className="text-subtitulo font-semibold text-tinta">{children}</h2>
                {descripcion && <p className="mt-1 text-meta text-tenue">{descripcion}</p>}
            </div>
            {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
        </div>
    );
}

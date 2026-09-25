'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { enlacesAdmin, esRutaActiva } from '@/lib/navegacion';

/**
 * Desplegable "Administrar" del header de escritorio.
 *
 * Es un patrón de "divulgación" (disclosure): un botón que muestra y oculta
 * una lista de enlaces. NO usa role="menu": ese rol promete navegación con
 * flechas del teclado, y aquí se navega con Tab como en cualquier lista de
 * enlaces. Prometer algo que no se cumple es peor que no prometerlo.
 *
 * Se cierra de cuatro formas: con el mismo botón, al elegir un enlace, con
 * Escape y con un clic fuera.
 */
export default function MenuAdmin() {
    const pathname = usePathname();
    const [abierto, setAbierto] = useState(false);
    const contenedor = useRef<HTMLDivElement>(null);
    // useId genera un id único y estable entre servidor y cliente, para
    // conectar el botón con su lista (aria-controls) sin inventar uno a mano.
    const idLista = useId();

    // ¿Estamos en alguna página de admin? Entonces el botón se ve "activo".
    const activo = enlacesAdmin.some((enlace) => esRutaActiva(pathname, enlace.href));

    // Mismo patrón que en Modal: los listeners solo existen mientras el
    // desplegable está abierto, y el `return` los quita al cerrarse.
    useEffect(() => {
        if (!abierto) return;

        const alHacerClic = (evento: MouseEvent) => {
            // contains(): ¿el clic fue dentro del botón o de la lista? Si no, cerrar.
            if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
        };
        const alPresionar = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') setAbierto(false);
        };

        document.addEventListener('mousedown', alHacerClic);
        document.addEventListener('keydown', alPresionar);
        return () => {
            document.removeEventListener('mousedown', alHacerClic);
            document.removeEventListener('keydown', alPresionar);
        };
    }, [abierto]);

    return (
        <div ref={contenedor} className="relative">
            <button
                type="button"
                aria-expanded={abierto}
                aria-controls={idLista}
                onClick={() => setAbierto((prev) => !prev)}
                className={cn(
                    'flex h-10 items-center gap-1.5 rounded-control px-3 text-meta font-medium transition-colors hover:bg-superficie-2 hover:text-tinta',
                    activo || abierto ? 'text-tinta' : 'text-tenue',
                )}
            >
                Administrar
                <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={cn('size-4 transition-transform', abierto && 'rotate-180')}
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {abierto && (
                // Radio `rounded-item` (16px): es un contenedor flotante pequeño.
                // Las filas de adentro usan `rounded-control` (14px): menor que el
                // de afuera, como pide la regla de anidado de design.md.
                <ul
                    id={idLista}
                    className="absolute right-0 top-full mt-2 w-56 space-y-0.5 rounded-item border border-borde bg-superficie p-1.5"
                >
                    {enlacesAdmin.map((enlace) => (
                        <li key={enlace.href}>
                            <Link
                                href={enlace.href}
                                onClick={() => setAbierto(false)}
                                aria-current={esRutaActiva(pathname, enlace.href) ? 'page' : undefined}
                                className="flex h-10 items-center rounded-control px-3 text-meta text-tinta-2 transition-colors hover:bg-superficie-2 hover:text-tinta aria-[current=page]:bg-superficie-2 aria-[current=page]:font-medium aria-[current=page]:text-tinta"
                            >
                                {enlace.etiqueta}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

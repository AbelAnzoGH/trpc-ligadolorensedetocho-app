'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MenuAdmin from './menu-admin';
import BotonSalir from './boton-salir';
import { enlacesAdmin, enlacesPublicos, esRutaActiva, type Enlace } from '@/lib/navegacion';
import type { RoleEnumType } from '@/app/generated/prisma';

type HeaderUser = { role: RoleEnumType | null } | null;

/*
 * Estilos de los enlaces. Están fuera del componente porque no dependen de
 * nada del render: son strings fijos.
 *
 * El enlace activo se estiliza con `aria-[current=page]:…`. Es decir: el
 * mismo atributo que le avisa al lector de pantalla "estás aquí" es el que
 * pinta el estilo. No hace falta una clase "activo" aparte que se pueda
 * desincronizar del atributo.
 */

/** Escritorio: texto tenue; el activo en tinta con una raya roja debajo. */
const claseEnlaceEscritorio =
    'relative flex h-16 items-center rounded-control px-3 text-meta font-medium text-tenue ' +
    'transition-colors hover:text-tinta ' +
    'aria-[current=page]:text-tinta ' +
    // La raya es un ::after que solo existe cuando el enlace está activo.
    // En Tailwind v4 `after:` ya pone el content: '' que hace falta.
    'aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:bottom-3 ' +
    'aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-rojo';

/** Móvil: filas de 44px de alto (fáciles de tocar); el activo con fondo elevado. */
const claseEnlaceMovil =
    'flex h-11 items-center rounded-item px-3 text-cuerpo font-medium text-tinta-2 ' +
    'transition-colors hover:bg-superficie-2 hover:text-tinta ' +
    'aria-[current=page]:bg-superficie-2 aria-[current=page]:text-tinta';

export default function HeaderNav({ user }: { user: HeaderUser }) {
    const pathname = usePathname();
    const [abierto, setAbierto] = useState(false);
    const cerrar = () => setAbierto(false);

    const esAdmin = user?.role === 'admin';

    /** Un <li> con su enlace. Se usa en las tres listas; solo cambia la clase. */
    const item = (enlace: Enlace, clase: string, alNavegar?: () => void) => (
        <li key={enlace.href}>
            <Link
                href={enlace.href}
                className={clase}
                aria-current={esRutaActiva(pathname, enlace.href) ? 'page' : undefined}
                onClick={alNavegar}
            >
                {enlace.etiqueta}
            </Link>
        </li>
    );

    return (
        <>
            {/* ================= Escritorio (md en adelante) ================= */}
            <nav aria-label="Principal" className="hidden items-center gap-2 md:flex">
                <ul className="flex items-center">
                    {enlacesPublicos.map((enlace) => item(enlace, claseEnlaceEscritorio))}
                </ul>

                {/* Los 4 enlaces de admin irían apretados en la barra, así
                    que en escritorio se agrupan en un desplegable. */}
                {esAdmin && <MenuAdmin />}
                {user && <BotonSalir />}
            </nav>

            {/* ================= Móvil ================= */}
            <button
                type="button"
                className="flex size-10 items-center justify-center rounded-control text-tinta-2 transition-colors hover:bg-superficie-2 hover:text-tinta md:hidden"
                aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={abierto}
                aria-controls="menu-movil"
                onClick={() => setAbierto((prev) => !prev)}
            >
                <svg aria-hidden className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
            </button>

            {/* El panel cuelga del <header> (que es `sticky`, y por eso sirve de
                referencia para `absolute`): top-full = justo debajo, a todo lo ancho. */}
            {abierto && (
                <nav
                    id="menu-movil"
                    aria-label="Principal"
                    className="absolute inset-x-0 top-full border-b border-borde bg-superficie px-4 pb-4 pt-3 md:hidden"
                >
                    <ul className="space-y-1">
                        {enlacesPublicos.map((enlace) => item(enlace, claseEnlaceMovil, cerrar))}
                    </ul>

                    {/* En móvil sí hay espacio: los enlaces de admin van
                        listados, en su propio grupo con título. */}
                    {esAdmin && (
                        <div className="mt-3 border-t border-borde pt-3">
                            <p className="px-3 pb-2 text-leyenda font-medium uppercase tracking-wider text-tenue">
                                Administración
                            </p>
                            <ul className="space-y-1">
                                {enlacesAdmin.map((enlace) => item(enlace, claseEnlaceMovil, cerrar))}
                            </ul>
                        </div>
                    )}

                    {user && (
                        <div className="mt-3 border-t border-borde pt-4">
                            <BotonSalir anchoCompleto />
                        </div>
                    )}
                </nav>
            )}
        </>
    );
}

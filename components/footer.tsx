import Link from 'next/link';
import LogoLiga from './logo-liga';
import { enlacesPublicos } from '@/lib/navegacion';

/**
 * Pie de página (design.md → Patrones → Footer).
 *
 * Decisiones de diseño:
 *   - Mismo ancho y márgenes que el header (max-w-pagina, px-4 sm:px-6),
 *     para que los bordes izquierdos de logo y enlaces queden alineados
 *     arriba y abajo de la página.
 *   - Fondo canvas (el del <body>) y solo un borde fino arriba. El footer
 *     no necesita "pesar" más que el contenido.
 *   - Los enlaces salen de lib/navegacion.ts: si se agrega una página
 *     pública al menú, aparece también aquí.
 *   - El copyright va en `text-tenue` y no en `text-apagado`: hay que
 *     poder leerlo, y `apagado` no pasa contraste AA.
 */
const Footer = () => {
    const anio = new Date().getFullYear();

    return (
        <footer className="border-t border-borde">
            <div className="mx-auto max-w-pagina px-4 py-12 sm:px-6">
                <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
                    {/* ---------- Marca ---------- */}
                    <div className="flex items-center gap-4">
                        <LogoLiga className="h-12 w-auto shrink-0" title="" />
                        <div>
                            <p className="font-bold tracking-tight text-tinta">LIGADOLORENSE DE TOCHO</p>
                            <p className="text-meta text-tenue">Tocho bandera · Dolores Hidalgo, Gto.</p>
                        </div>
                    </div>

                    {/* ---------- Navegación ---------- */}
                    <nav aria-labelledby="footer-titulo-liga">
                        <p
                            id="footer-titulo-liga"
                            className="text-leyenda font-medium uppercase tracking-wider text-tenue"
                        >
                            La liga
                        </p>
                        <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-1">
                            {enlacesPublicos.map((enlace) => (
                                <li key={enlace.href}>
                                    <Link
                                        href={enlace.href}
                                        className="rounded-control text-meta text-tinta-2 transition-colors hover:text-tinta"
                                    >
                                        {enlace.etiqueta}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <p className="mt-10 border-t border-borde pt-6 text-leyenda text-tenue">
                    © {anio} Ligadolorense de Tocho. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;

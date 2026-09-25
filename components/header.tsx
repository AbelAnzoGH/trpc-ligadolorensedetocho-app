import Link from 'next/link';
import LogoLiga from './logo-liga';
import HeaderNav from './header-nav';
import { getAuthUser } from '@/utils/get-auth-user';

/**
 * Header del sitio (design.md → Patrones → Header).
 *
 * Se queda como componente de SERVIDOR: aquí se lee la cookie para saber
 * quién es el usuario, y solo la parte interactiva (menú móvil, enlace
 * activo, dropdown de admin) vive en HeaderNav, que es 'use client'.
 *
 * Decisiones de diseño:
 *   - <header> y no <nav>: el header CONTIENE la navegación. El <nav> con
 *     su aria-label está dentro de HeaderNav.
 *   - bg-canvas/80 + backdrop-blur: al hacer scroll, el contenido pasa por
 *     debajo difuminado en vez de cortarse de golpe.
 *   - relative: el panel del menú móvil se posiciona respecto al header.
 *   - La franja tricolor vive AQUÍ, así que es la franja de todas las
 *     páginas. Ninguna página debe agregar otra. Además hace de borde
 *     inferior del header: por eso no lleva `border-b` (serían dos líneas).
 */
const Header = async () => {
    const user = await getAuthUser({ shouldRedirect: false });

    return (
        <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-pagina items-center justify-between gap-6 px-4 sm:px-6">
                <Link href="/" className="flex min-w-0 items-center gap-3 rounded-control">
                    <LogoLiga className="h-8 w-auto shrink-0" title="" />
                    {/* Sin degradado: el nombre va en tinta y en negrita. El
                        color de la marca ya lo pone el logo junto a él. */}
                    <span className="truncate text-cuerpo font-bold tracking-tight text-tinta sm:text-cuerpo-lg">
                        LIGADOLORENSEDETOCHO
                    </span>
                </Link>

                <HeaderNav user={user} />
            </div>

            <div className="franja-tricolor" aria-hidden />
        </header>
    );
};

export default Header;

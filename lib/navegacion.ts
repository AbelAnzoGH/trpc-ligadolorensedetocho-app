/**
 * Las rutas del menú, en UN solo lugar.
 *
 * Antes cada enlace estaba escrito a mano en header-nav, en auth-menu y en
 * el footer (y el footer ya se había quedado sin "Temporadas"). Con una
 * lista, agregar una página al menú es agregar una línea aquí.
 */

export type Enlace = { href: string; etiqueta: string };

export const enlacesPublicos: Enlace[] = [
    { href: '/', etiqueta: 'Inicio' },
    { href: '/equipos', etiqueta: 'Equipos' },
    { href: '/jugadores', etiqueta: 'Jugadores' },
    { href: '/ligas', etiqueta: 'Temporadas' },
];

export const enlacesAdmin: Enlace[] = [
    { href: '/manejar-equipos', etiqueta: 'Equipos' },
    { href: '/manejar-jugadores', etiqueta: 'Jugadores' },
    { href: '/manejar-temporadas', etiqueta: 'Temporadas' },
    { href: '/manejar-partidos', etiqueta: 'Partidos' },
];

/**
 * ¿Este enlace corresponde a la página en la que estamos?
 *
 * '/' se compara exacto: si no, TODAS las rutas empezarían con '/' y
 * "Inicio" saldría siempre activo. Las demás cuentan también sus
 * subpáginas: en /ligas/ldt/3 debe marcarse "Temporadas" (/ligas).
 */
export function esRutaActiva(pathname: string, href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
}

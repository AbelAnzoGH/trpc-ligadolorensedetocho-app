import type { TeamCategory } from '@/lib/team-schema';

/**
 * Piezas compartidas entre /equipos (tabla pública) y /manejar-equipos (CRUD).
 * Viven aquí para que las dos páginas no dupliquen los mismos tipos y etiquetas:
 * si mañana cambia la forma de lo que devuelve team-controller.ts,
 * se actualiza en un solo lugar.
 */

export type Team = {
    id: string;
    name: string;
    category: TeamCategory;
    /** Dirección del logo, o null si el equipo no tiene. */
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ListTeamsResponse = {
    status: string;
    results: number;
    data: { teams: Team[] };
};

export type TeamResponse = {
    status: string;
    data: { team: Team };
};

/** Cómo se escribe cada categoría en pantalla (el valor de la BD va en minúsculas). */
export const etiquetaCategoria: Record<TeamCategory, string> = {
    femenil: 'Femenil',
    varonil: 'Varonil',
    mixto: 'Mixto',
};

/** Clases de Tailwind para inputs y selects sobre el fondo oscuro del sitio. */
export const inputClass =
    'rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white ' +
    'placeholder:text-gray-500 focus:border-pink-500 focus:outline-none';

import type { TeamCategory } from '@/lib/team-schema';

/**
 * Piezas compartidas entre /equipos (tabla pública) y /manejar-equipos (CRUD).
 * Viven aquí para que las dos páginas no dupliquen los mismos tipos y etiquetas:
 * si mañana cambia la forma de lo que devuelve team-controller.ts,
 * se actualiza en un solo lugar.
 */

/**
 * El equipo como IDENTIDAD permanente: lo que no cambia entre temporadas.
 * Su categoría, plantel y estadísticas viven en cada inscripción
 * (TeamSeason, ver lib/season-ui.ts).
 */
export type Team = {
    id: string;
    name: string;
    /** Dirección del logo, o null si el equipo no tiene. */
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
    /** En cuántas temporadas/categorías ha estado inscrito. */
    _count: { teamSeasons: number };
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
    femenil_libre: 'Femenil Libre',
    varonil_libre: 'Varonil Libre',
    mixto: 'Mixto',
    femenil_u16: 'Femenil Under16',
    mixto_u18: 'Mixto Under18',
};

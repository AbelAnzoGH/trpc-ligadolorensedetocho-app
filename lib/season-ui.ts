import type { SeasonStatus } from '@/lib/season-schema';
import type { TeamCategory } from '@/lib/team-schema';

/**
 * Piezas compartidas por TODAS las pantallas que hablan de temporadas.
 * No importa nada del servidor, así que sirve igual en un componente
 * 'use client' que en un page.tsx.
 *
 * Los tipos describen exactamente lo que devuelve season-controller.ts:
 * si cambias un `select` de allá, actualiza esto también.
 */

// ---------------------------------------------------------------------------
// NOMBRES
// ---------------------------------------------------------------------------

/** 7 → "VII". La temporada guarda el número; el romano solo es de pantalla. */
export const romano = (n: number): string => {
    const tabla: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let resto = n;
    let texto = '';
    for (const [valor, letra] of tabla) {
        while (resto >= valor) {
            texto += letra;
            resto -= valor;
        }
    }
    return texto;
};

/** ("LDT SHADOWS", 2) → "LDT SHADOWS II". El nombre NO se guarda: se calcula. */
export const nombreTemporada = (liga: { name: string }, numero: number) =>
    `${liga.name} ${romano(numero)}`;

/** La dirección pública de una temporada. */
export const urlTemporada = (liga: { slug: string }, numero: number) =>
    `/ligas/${liga.slug}/${numero}`;

export const etiquetaEstado: Record<SeasonStatus, string> = {
    inscripciones: 'Inscripciones',
    activa: 'En curso',
    cerrada: 'Cerrada',
};

/** Colores de la etiqueta de estado sobre el fondo oscuro. */
export const claseEstado: Record<SeasonStatus, string> = {
    inscripciones: 'border-yellow-500/40 text-yellow-300',
    activa: 'border-green-500/40 text-green-300',
    cerrada: 'border-gray-600 text-gray-400',
};

// ---------------------------------------------------------------------------
// TIPOS DE RESPUESTA
// ---------------------------------------------------------------------------

export type LeagueRef = { id: string; name: string; slug: string };

export type SeasonSummary = {
    id: string;
    number: number;
    status: SeasonStatus;
    startDate: string | null;
    endDate: string | null;
    /** Las categorías que se juegan esta temporada, en el orden de teamCategories. */
    categories: TeamCategory[];
    _count: { teamSeasons: number };
};

export type League = LeagueRef & { seasons: SeasonSummary[] };

export type ListLeaguesResponse = {
    status: string;
    results: number;
    data: { leagues: League[] };
};

/** Una inscripción: el equipo (permanente) jugando ESTA temporada en ESTA categoría. */
export type TeamSeason = {
    id: string;
    seasonId: string;
    category: TeamCategory;
    gamesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
    team: { id: string; name: string; logoUrl: string | null };
    season: { id: string; number: number; status: SeasonStatus; league: LeagueRef };
    _count: { memberships: number };
};

export type ListTeamSeasonsResponse = {
    status: string;
    results: number;
    data: { teamSeasons: TeamSeason[] };
};

export type TeamSeasonResponse = { status: string; data: { teamSeason: TeamSeason } };

export type SeasonDetail = Omit<SeasonSummary, '_count'> & {
    league: LeagueRef;
    teamSeasons: TeamSeason[];
};

export type CopyRosterResponse = {
    status: string;
    data: { copiados: number };
};

// ---------------------------------------------------------------------------
// ELEGIR LA TEMPORADA POR DEFECTO
// ---------------------------------------------------------------------------

/**
 * ¿Qué temporada se muestra cuando el visitante no ha elegido ninguna?
 *   1. La activa de la liga preferida (la LDT), si existe.
 *   2. Si no, la activa de cualquier liga.
 *   3. Si no hay ninguna activa, la más reciente (número más alto) de la
 *      liga preferida, o de la primera liga que tenga temporadas.
 * Devuelve null solo si todavía no existe ninguna temporada.
 */
export const temporadaPorDefecto = (
    ligas: League[],
    slugPreferido = 'ldt',
): { liga: League; temporada: SeasonSummary } | null => {
    const ordenadas = [
        ...ligas.filter((l) => l.slug === slugPreferido),
        ...ligas.filter((l) => l.slug !== slugPreferido),
    ];

    for (const liga of ordenadas) {
        const activa = liga.seasons.find((s) => s.status === 'activa');
        if (activa) return { liga, temporada: activa };
    }

    for (const liga of ordenadas) {
        // El servidor ya las manda ordenadas de la más nueva a la más vieja.
        if (liga.seasons.length > 0) return { liga, temporada: liga.seasons[0] };
    }

    return null;
};

/** Busca una temporada por id dentro del árbol de ligas. */
export const buscarTemporada = (ligas: League[], seasonId: string) => {
    for (const liga of ligas) {
        const temporada = liga.seasons.find((s) => s.id === seasonId);
        if (temporada) return { liga, temporada };
    }
    return null;
};

import type { TeamCategory } from '@/lib/team-schema';
import type { GamePhase, GameStatus } from '@/lib/game-schema';

/**
 * Piezas compartidas por las pantallas de partidos (el admin y la página
 * pública de la temporada). No importa nada del servidor.
 *
 * Los tipos describen exactamente lo que devuelve game-controller.ts:
 * si cambias un `select` de allá, actualiza esto también.
 */

// ---------------------------------------------------------------------------
// ETIQUETAS
// ---------------------------------------------------------------------------

export const etiquetaFase: Record<GamePhase, string> = {
    pretemporada: 'Pretemporada',
    amistoso: 'Amistoso',
    regular: 'Temporada regular',
    cuartos: 'Cuartos de final',
    semifinal: 'Semifinal',
    tercer_lugar: 'Tercer lugar',
    final: 'Final',
};

export const etiquetaEstadoPartido: Record<GameStatus, string> = {
    programado: 'Programado',
    finalizado: 'Final',
    suspendido: 'Suspendido',
};

/** Colores de la etiqueta de estado sobre el fondo oscuro. */
export const claseEstadoPartido: Record<GameStatus, string> = {
    programado: 'border-yellow-500/40 text-yellow-300',
    finalizado: 'border-green-500/40 text-green-300',
    suspendido: 'border-red-500/40 text-red-300',
};

// ---------------------------------------------------------------------------
// FECHAS
// ---------------------------------------------------------------------------

/**
 * La base guarda la hora en UTC. En pantalla SIEMPRE se muestra la hora de
 * la liga, sin importar la zona del navegador de quien la vea.
 */
export const ZONA_LIGA = 'America/Mexico_City';

/** "sáb 4 oct, 10:00" */
export const formatoFechaPartido = (fecha: string | Date) =>
    new Intl.DateTimeFormat('es-MX', {
        timeZone: ZONA_LIGA,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(fecha));

// ---------------------------------------------------------------------------
// TIPOS DE RESPUESTA
// ---------------------------------------------------------------------------

export type Venue = {
    id: string;
    name: string;
    address: string | null;
    _count: { games: number };
};

export type ListVenuesResponse = { status: string; results: number; data: { venues: Venue[] } };
export type VenueResponse = { status: string; data: { venue: Venue } };

/** Un lado del partido: la inscripción con lo "de siempre" del equipo. */
export type LadoPartido = {
    id: string;
    category: TeamCategory;
    team: { id: string; name: string; logoUrl: string | null };
};

export type Game = {
    id: string;
    seasonId: string;
    phase: GamePhase;
    round: number | null;
    status: GameStatus;
    /** Texto ISO en UTC (trpc-fetch no convierte fechas). Usa formatoFechaPartido. */
    scheduledAt: string;
    field: number | null;
    homeScore: number | null;
    awayScore: number | null;
    isForfeit: boolean;
    notes: string | null;
    venue: { id: string; name: string };
    homeTeamSeason: LadoPartido;
    awayTeamSeason: LadoPartido;
};

export type ListGamesResponse = { status: string; results: number; data: { games: Game[] } };
export type GameResponse = { status: string; data: { game: Game } };

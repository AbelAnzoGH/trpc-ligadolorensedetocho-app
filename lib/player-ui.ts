import type { PlayerPosition } from '@/lib/player-schema';
import type { TeamCategory } from '@/lib/team-schema';

/**
 * Piezas compartidas por las pantallas de jugadores.
 * Los tipos describen exactamente lo que devuelve player-controller.ts:
 * si cambias el `select` de allá, actualiza esto también.
 */

export type Membership = {
    id: string;
    teamId: string;
    jerseyNumber: number;
    positions: PlayerPosition[];
    /** Foto con este uniforme, o null si no tiene. */
    photoUrl: string | null;
    touchdowns: number;
    interceptions: number;
    touchdownPasses: number;
    safeties: number;
    gamesPlayed: number;
    availableForPlayoffs: boolean;
    team: { id: string; name: string; category: TeamCategory };
};

export type Player = {
    id: string;
    name: string;
    lastName: string;
    age: number;
    height: number;
    memberships: Membership[];
};

export type ListPlayersResponse = {
    status: string;
    results: number;
    data: { players: Player[] };
};

export type PlayerResponse = { status: string; data: { player: Player } };
export type MembershipResponse = { status: string; data: { membership: Membership } };

/**
 * Una membresía junto con los datos de la persona, tal como la devuelve
 * listMemberships. Es la fila del listado público de /jugadores.
 */
export type MembershipConJugador = Membership & {
    player: {
        id: string;
        name: string;
        lastName: string;
        age: number;
        height: number;
    };
};

export type ListMembershipsResponse = {
    status: string;
    results: number;
    /** Total que cumple el filtro, ignorando take/skip. Sirve para "cargar más". */
    total: number;
    data: { memberships: MembershipConJugador[] };
};

/** El nombre largo de cada posición, para tooltips y ayudas. */
export const etiquetaPosicion: Record<PlayerPosition, string> = {
    QB: 'Quarterback',
    C: 'Centro',
    WR: 'Receptor',
    RB: 'Corredor',
    FL: 'Flanker',
    RU: 'Rusher',
    LB: 'Linebacker',
    CB: 'Esquinero',
    S: 'Safety',
    DB: 'Defensivo',
};

/**
 * Las estadísticas, en un solo lugar. Recorrer este arreglo evita
 * escribir cinco inputs casi idénticos a mano: si mañana la liga
 * agrega "conversiones", se agrega aquí y aparece sola en el formulario.
 */
export const camposEstadistica = [
    { key: 'touchdowns', label: 'Touchdowns' },
    { key: 'touchdownPasses', label: 'Pases de TD' },
    { key: 'interceptions', label: 'Intercepciones' },
    { key: 'safeties', label: 'Safeties' },
    { key: 'gamesPlayed', label: 'Partidos jugados' },
] as const;

export type CampoEstadistica = (typeof camposEstadistica)[number]['key'];

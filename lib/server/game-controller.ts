import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada } from '@/lib/season-ui';
import { toTRPCError } from '@/lib/server/reglas-inscripcion';
import { PUNTOS_DEFAULT, type GamePhase } from '@/lib/game-schema';
import type {
    CreateVenueInput,
    UpdateVenueInput,
    VenueIdInput,
    ListGamesInput,
    CreateGameInput,
    UpdateGameInput,
    RecordResultInput,
    RecordForfeitInput,
    GameIdInput,
} from '@/lib/game-schema';

// ---------------------------------------------------------------------------
// SELECTS: qué columnas salen al navegador. Mismos tipos en lib/game-ui.ts.
// ---------------------------------------------------------------------------

const venueSelect = {
    id: true,
    name: true,
    address: true,
    _count: { select: { games: true } },
} as const;

// Cada lado del partido: la inscripción con su categoría y lo "de siempre"
// del equipo (nombre y logo).
const ladoSelect = {
    id: true,
    category: true,
    team: { select: { id: true, name: true, logoUrl: true } },
} as const;

const gameSelect = {
    id: true,
    seasonId: true,
    phase: true,
    round: true,
    status: true,
    scheduledAt: true,
    field: true,
    homeScore: true,
    awayScore: true,
    isForfeit: true,
    notes: true,
    venue: { select: { id: true, name: true, address: true } },
    homeTeamSeason: { select: ladoSelect },
    awayTeamSeason: { select: ladoSelect },
} as const;

// Orden del rol: por fecha y hora; a la misma hora, por campo.
const gameOrder = [{ scheduledAt: 'asc' as const }, { field: 'asc' as const }];

// ---------------------------------------------------------------------------
// REGLAS (las que necesitan consultar la base)
// ---------------------------------------------------------------------------

type TemporadaRef = { status: string; number: number; league: { name: string } };

const temporadaRefSelect = { status: true, number: true, league: { select: { name: true } } } as const;

/**
 * Una temporada cerrada está congelada: sus partidos no se crean, editan,
 * capturan ni borran. (Más estricto que las estadísticas de equipo del
 * sprint pasado, a propósito: el marcador es la fuente de verdad de la tabla.)
 */
const asegurarTemporadaEditable = (season: TemporadaRef) => {
    if (season.status === 'cerrada') {
        throw new TRPCError({
            code: 'CONFLICT',
            message: `${nombreTemporada(season.league, season.number)} está cerrada: sus partidos ya no se modifican.`,
        });
    }
};

/** 'regular' necesita jornada. Se revisa con los valores FINALES del partido. */
const validarJornada = (phase: GamePhase, round: number | null) => {
    if (phase === 'regular' && round == null) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un partido de temporada regular necesita jornada.' });
    }
};

/**
 * El enfrentamiento es válido si: los dos equipos son distintos, existen,
 * están inscritos en ESTA temporada y juegan la MISMA categoría.
 * (Que sean distintos también lo garantiza el CHECK games_equipos_distintos;
 * aquí se revisa para dar un mensaje entendible.)
 */
const validarEnfrentamiento = async ({
    seasonId,
    homeTeamSeasonId,
    awayTeamSeasonId,
}: {
    seasonId: string;
    homeTeamSeasonId: string;
    awayTeamSeasonId: string;
}) => {
    if (homeTeamSeasonId === awayTeamSeasonId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Un equipo no puede jugar contra sí mismo.' });
    }

    const lados = await prisma.teamSeason.findMany({
        where: { id: { in: [homeTeamSeasonId, awayTeamSeasonId] } },
        select: { id: true, seasonId: true, category: true, team: { select: { name: true } } },
    });
    const local = lados.find((l) => l.id === homeTeamSeasonId);
    const visitante = lados.find((l) => l.id === awayTeamSeasonId);

    if (!local) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe la inscripción del equipo local.' });
    if (!visitante) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe la inscripción del equipo visitante.' });

    for (const lado of [local, visitante]) {
        if (lado.seasonId !== seasonId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `${lado.team.name} no está inscrito en esta temporada.`,
            });
        }
    }

    if (local.category !== visitante.category) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `No pueden enfrentarse categorías distintas: ${local.team.name} juega ${etiquetaCategoria[local.category]} y ${visitante.team.name} juega ${etiquetaCategoria[visitante.category]}.`,
        });
    }
};

const asegurarSede = async (venueId: string) => {
    const sede = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
    if (!sede) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa sede.' });
};

/** Trae el partido con lo necesario para decidir si se puede tocar. */
const cargarPartido = async (id: string) => {
    const game = await prisma.game.findUnique({
        where: { id },
        select: {
            id: true,
            seasonId: true,
            homeTeamSeasonId: true,
            awayTeamSeasonId: true,
            phase: true,
            round: true,
            status: true,
            venueId: true,
            season: { select: temporadaRefSelect },
        },
    });
    if (!game) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe ese partido.' });
    return game;
};

// ===========================================================================
// SEDES
// ===========================================================================

export const listVenuesHandler = async () => {
    try {
        const venues = await prisma.venue.findMany({ select: venueSelect, orderBy: { name: 'asc' } });
        return { status: 'success', results: venues.length, data: { venues } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const createVenueHandler = async ({ input }: { input: CreateVenueInput }) => {
    try {
        const repetida = await prisma.venue.findUnique({ where: { name: input.name }, select: { id: true } });
        if (repetida) throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe una sede con ese nombre.' });

        const venue = await prisma.venue.create({
            data: { name: input.name, address: input.address ?? null },
            select: venueSelect,
        });
        return { status: 'success', data: { venue } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const updateVenueHandler = async ({ input }: { input: UpdateVenueInput }) => {
    try {
        const { id, ...changes } = input;

        const existe = await prisma.venue.findUnique({ where: { id }, select: { id: true } });
        if (!existe) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa sede.' });

        if (changes.name) {
            const repetida = await prisma.venue.findFirst({
                where: { name: changes.name, id: { not: id } },
                select: { id: true },
            });
            if (repetida) throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe otra sede con ese nombre.' });
        }

        const venue = await prisma.venue.update({ where: { id }, data: changes, select: venueSelect });
        return { status: 'success', data: { venue } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Solo se borra una sede sin partidos: los partidos jugados ahí son historial. */
export const deleteVenueHandler = async ({ input }: { input: VenueIdInput }) => {
    try {
        const venue = await prisma.venue.findUnique({ where: { id: input.id }, select: venueSelect });
        if (!venue) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa sede.' });

        const n = venue._count.games;
        if (n > 0) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `No se puede eliminar: tiene ${n} ${n === 1 ? 'partido' : 'partidos'} registrados.`,
            });
        }

        await prisma.venue.delete({ where: { id: input.id } });
        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// ===========================================================================
// PARTIDOS
// ===========================================================================

export const listGamesHandler = async ({ input }: { input: ListGamesInput }) => {
    try {
        const games = await prisma.game.findMany({
            where: {
                seasonId: input.seasonId,
                round: input.round,
                phase: input.phase,
                // Los dos lados son de la misma categoría (lo garantiza
                // validarEnfrentamiento), así que basta con mirar al local.
                homeTeamSeason: input.category ? { category: input.category } : undefined,
                OR: input.teamSeasonId
                    ? [{ homeTeamSeasonId: input.teamSeasonId }, { awayTeamSeasonId: input.teamSeasonId }]
                    : undefined,
            },
            select: gameSelect,
            orderBy: gameOrder,
        });

        return { status: 'success', results: games.length, data: { games } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Siempre nace 'programado' y sin marcador. */
export const createGameHandler = async ({ input }: { input: CreateGameInput }) => {
    try {
        const season = await prisma.season.findUnique({ where: { id: input.seasonId }, select: temporadaRefSelect });
        if (!season) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada.' });
        asegurarTemporadaEditable(season);

        validarJornada(input.phase, input.round ?? null);
        await validarEnfrentamiento(input);
        await asegurarSede(input.venueId);

        const game = await prisma.game.create({
            data: {
                seasonId: input.seasonId,
                homeTeamSeasonId: input.homeTeamSeasonId,
                awayTeamSeasonId: input.awayTeamSeasonId,
                phase: input.phase,
                round: input.round ?? null,
                scheduledAt: input.scheduledAt,
                venueId: input.venueId,
                field: input.field ?? null,
                notes: input.notes ?? null,
            },
            select: gameSelect,
        });

        return { status: 'success', data: { game } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * Reprogramar, cambiar sede o campo, suspender / reactivar, corregir equipos,
 * fase, jornada o notas. NO sirve para un partido finalizado: ese solo se
 * corrige con recordResult, o se regresa a 'programado' con undoResult.
 */
export const updateGameHandler = async ({ input }: { input: UpdateGameInput }) => {
    try {
        const { id, ...changes } = input;
        const existing = await cargarPartido(id);
        asegurarTemporadaEditable(existing.season);

        if (existing.status === 'finalizado') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Este partido ya finalizó: solo se puede corregir su marcador. Para cambiar otra cosa, primero deshaz el resultado.',
            });
        }

        // Los valores FINALES: lo que llega pisa lo guardado. `undefined`
        // significa "no lo toques"; `null` (en round) significa "quítalo".
        const final = {
            phase: changes.phase ?? existing.phase,
            round: changes.round !== undefined ? changes.round : existing.round,
            homeTeamSeasonId: changes.homeTeamSeasonId ?? existing.homeTeamSeasonId,
            awayTeamSeasonId: changes.awayTeamSeasonId ?? existing.awayTeamSeasonId,
        };

        validarJornada(final.phase, final.round);

        if (changes.homeTeamSeasonId || changes.awayTeamSeasonId) {
            await validarEnfrentamiento({ seasonId: existing.seasonId, ...final });
        }
        if (changes.venueId && changes.venueId !== existing.venueId) {
            await asegurarSede(changes.venueId);
        }

        const game = await prisma.game.update({ where: { id }, data: changes, select: gameSelect });
        return { status: 'success', data: { game } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * Capturar o CORREGIR el marcador. Deja el partido 'finalizado'. Si era un
 * default, deja de serlo: un marcador capturado a mano es un partido jugado.
 */
export const recordResultHandler = async ({ input }: { input: RecordResultInput }) => {
    try {
        const existing = await cargarPartido(input.id);
        asegurarTemporadaEditable(existing.season);

        const game = await prisma.game.update({
            where: { id: input.id },
            data: {
                status: 'finalizado',
                homeScore: input.homeScore,
                awayScore: input.awayScore,
                isForfeit: false,
            },
            select: gameSelect,
        });
        return { status: 'success', data: { game } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Ganado por default: quien no llegó pierde 0 a PUNTOS_DEFAULT. */
export const recordForfeitHandler = async ({ input }: { input: RecordForfeitInput }) => {
    try {
        const existing = await cargarPartido(input.id);
        asegurarTemporadaEditable(existing.season);

        const faltaLocal = input.absentTeamSeasonId === existing.homeTeamSeasonId;
        const faltaVisitante = input.absentTeamSeasonId === existing.awayTeamSeasonId;
        if (!faltaLocal && !faltaVisitante) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'El equipo ausente debe ser uno de los dos del partido.' });
        }

        const game = await prisma.game.update({
            where: { id: input.id },
            data: {
                status: 'finalizado',
                homeScore: faltaLocal ? 0 : PUNTOS_DEFAULT,
                awayScore: faltaLocal ? PUNTOS_DEFAULT : 0,
                isForfeit: true,
            },
            select: gameSelect,
        });
        return { status: 'success', data: { game } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * La salida para un resultado capturado por error: regresa el partido a
 * 'programado' y borra el marcador. Los tres campos cambian en el MISMO
 * update, así el CHECK games_finalizado_con_marcador nunca ve un estado a medias.
 */
export const undoResultHandler = async ({ input }: { input: GameIdInput }) => {
    try {
        const existing = await cargarPartido(input.id);
        asegurarTemporadaEditable(existing.season);

        if (existing.status !== 'finalizado') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este partido no tiene un resultado que deshacer.' });
        }

        const game = await prisma.game.update({
            where: { id: input.id },
            data: { status: 'programado', homeScore: null, awayScore: null, isForfeit: false },
            select: gameSelect,
        });
        return { status: 'success', data: { game } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Borrar un partido capturado por error. Uno finalizado no se borra. */
export const deleteGameHandler = async ({ input }: { input: GameIdInput }) => {
    try {
        const existing = await cargarPartido(input.id);
        asegurarTemporadaEditable(existing.season);

        if (existing.status === 'finalizado') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Un partido finalizado no se borra. Si el resultado fue un error, deshazlo primero.',
            });
        }

        await prisma.game.delete({ where: { id: input.id } });
        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

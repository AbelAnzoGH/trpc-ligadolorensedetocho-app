import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada } from '@/lib/season-ui';
import {
    toTRPCError,
    asegurarTemporadaAbierta,
    asegurarCategoriaHabilitada,
    buscarChoquesDeCategoria,
    mensajeChoques,
} from '@/lib/server/reglas-inscripcion';
import type {
    CreateLeagueInput,
    UpdateLeagueInput,
    CreateSeasonInput,
    UpdateSeasonInput,
    SeasonIdInput,
    SeasonBySlugInput,
    ListTeamSeasonsInput,
    EnrollTeamInput,
    UpdateTeamSeasonInput,
    TeamSeasonIdInput,
    CopyRosterInput,
} from '@/lib/season-schema';

// ---------------------------------------------------------------------------
// SELECTS: qué columnas salen al navegador. Mismos tipos en lib/season-ui.ts.
// ---------------------------------------------------------------------------

const leagueRefSelect = { id: true, name: true, slug: true } as const;

const seasonSummarySelect = {
    id: true,
    number: true,
    status: true,
    startDate: true,
    endDate: true,
    categories: true,
    _count: { select: { teamSeasons: true } },
} as const;

const teamSeasonSelect = {
    id: true,
    seasonId: true,
    category: true,
    gamesPlayed: true,
    wins: true,
    losses: true,
    ties: true,
    pointsFor: true,
    pointsAgainst: true,
    // Lo "de siempre" viene del equipo: nombre y logo se subieron UNA vez.
    team: { select: { id: true, name: true, logoUrl: true } },
    season: { select: { id: true, number: true, status: true, league: { select: leagueRefSelect } } },
    _count: { select: { memberships: true } },
} as const;

// Orden estándar de las inscripciones: por categoría y luego por nombre.
const teamSeasonOrder = [{ category: 'asc' as const }, { team: { name: 'asc' as const } }];

/**
 * "Máximo UNA temporada activa por liga". La base ya lo garantiza con el
 * índice único parcial `seasons_una_activa_por_liga`; esta comprobación
 * existe para dar un mensaje legible ANTES de que Postgres lo rechace.
 */
const asegurarUnicaActiva = async (leagueId: string, excluirSeasonId?: string) => {
    const activa = await prisma.season.findFirst({
        where: { leagueId, status: 'activa', id: excluirSeasonId ? { not: excluirSeasonId } : undefined },
        select: { number: true, league: { select: { name: true } } },
    });

    if (activa) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: `${nombreTemporada(activa.league, activa.number)} sigue activa. Ciérrala antes de activar otra temporada de la misma liga.`,
        });
    }
};

// ===========================================================================
// LIGAS
// ===========================================================================

/**
 * Todas las ligas con sus temporadas (de la más nueva a la más vieja).
 * Es el "árbol" que usan los selectores de liga/temporada de todas las
 * pantallas: una sola llamada basta para pintar los dos selects.
 */
export const listLeaguesHandler = async () => {
    try {
        const leagues = await prisma.league.findMany({
            select: {
                ...leagueRefSelect,
                seasons: { select: seasonSummarySelect, orderBy: { number: 'desc' } },
            },
            orderBy: { name: 'asc' },
        });

        return { status: 'success', results: leagues.length, data: { leagues } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const createLeagueHandler = async ({ input }: { input: CreateLeagueInput }) => {
    try {
        const duplicada = await prisma.league.findFirst({
            where: { OR: [{ name: input.name }, { slug: input.slug }] },
            select: { name: true, slug: true },
        });

        if (duplicada) {
            throw new TRPCError({
                code: 'CONFLICT',
                message:
                    duplicada.slug === input.slug
                        ? `El slug "${input.slug}" ya lo usa la liga ${duplicada.name}`
                        : 'Ya existe una liga con ese nombre',
            });
        }

        const league = await prisma.league.create({ data: input, select: leagueRefSelect });
        return { status: 'success', data: { league } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const updateLeagueHandler = async ({ input }: { input: UpdateLeagueInput }) => {
    try {
        const { id, ...changes } = input;

        const existe = await prisma.league.findUnique({ where: { id }, select: { id: true } });
        if (!existe) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa liga' });

        if (changes.name || changes.slug) {
            const duplicada = await prisma.league.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(changes.name ? [{ name: changes.name }] : []),
                        ...(changes.slug ? [{ slug: changes.slug }] : []),
                    ],
                },
                select: { id: true },
            });
            if (duplicada) {
                throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe otra liga con ese nombre o slug' });
            }
        }

        const league = await prisma.league.update({ where: { id }, data: changes, select: leagueRefSelect });
        return { status: 'success', data: { league } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// ===========================================================================
// TEMPORADAS
// ===========================================================================

/**
 * La temporada completa para la página pública /ligas/<slug>/<numero>.
 * Incluye sus inscripciones con equipo y conteo de jugadores.
 */
export const getSeasonBySlugHandler = async ({ input }: { input: SeasonBySlugInput }) => {
    try {
        const season = await prisma.season.findFirst({
            where: { number: input.number, league: { slug: input.leagueSlug } },
            select: {
                id: true,
                number: true,
                status: true,
                startDate: true,
                endDate: true,
                categories: true,
                league: { select: leagueRefSelect },
                teamSeasons: { select: teamSeasonSelect, orderBy: teamSeasonOrder },
            },
        });

        if (!season) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada' });
        }

        return { status: 'success', data: { season } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const createSeasonHandler = async ({ input }: { input: CreateSeasonInput }) => {
    try {
        const league = await prisma.league.findUnique({
            where: { id: input.leagueId },
            select: { id: true, name: true },
        });
        if (!league) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa liga' });

        const repetida = await prisma.season.findUnique({
            where: { leagueId_number: { leagueId: input.leagueId, number: input.number } },
            select: { id: true },
        });
        if (repetida) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `${nombreTemporada(league, input.number)} ya existe`,
            });
        }

        if (input.status === 'activa') await asegurarUnicaActiva(input.leagueId);

        const season = await prisma.season.create({
            data: {
                leagueId: input.leagueId,
                number: input.number,
                status: input.status ?? 'inscripciones',
                categories: input.categories,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
            },
            select: seasonSummarySelect,
        });

        return { status: 'success', data: { season } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const updateSeasonHandler = async ({ input }: { input: UpdateSeasonInput }) => {
    try {
        const { id, ...changes } = input;

        const existing = await prisma.season.findUnique({
            where: { id },
            select: {
                id: true,
                leagueId: true,
                status: true,
                number: true,
                categories: true,
                league: { select: { name: true } },
            },
        });
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada' });

        if (changes.status === 'activa' && existing.status !== 'activa') {
            await asegurarUnicaActiva(existing.leagueId, id);
        }

        if (changes.categories) {
            // Una temporada cerrada está congelada. Se mira el estado con el
            // que QUEDARÍA: si en la misma llamada se reabre, sí se permite.
            if ((changes.status ?? existing.status) === 'cerrada') {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `${nombreTemporada(existing.league, existing.number)} está cerrada: sus categorías ya no se cambian.`,
                });
            }

            // Agregar categorías siempre se puede. QUITAR solo si nadie está
            // inscrito en ella: si no, esas inscripciones quedarían en una
            // categoría que "no existe" en su temporada.
            const quitadas = existing.categories.filter((c) => !changes.categories!.includes(c));
            if (quitadas.length > 0) {
                const ocupadas = await prisma.teamSeason.groupBy({
                    by: ['category'],
                    where: { seasonId: id, category: { in: quitadas } },
                    _count: { _all: true },
                });
                if (ocupadas.length > 0) {
                    const detalle = ocupadas
                        .map((o) => `${etiquetaCategoria[o.category]} (${o._count._all} ${o._count._all === 1 ? 'equipo' : 'equipos'})`)
                        .join(', ');
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: `No se puede quitar: ${detalle}. Da de baja esas inscripciones primero.`,
                    });
                }
            }
        }

        const season = await prisma.season.update({ where: { id }, data: changes, select: seasonSummarySelect });
        return { status: 'success', data: { season } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Solo se borra una temporada VACÍA (típicamente, una creada por error). */
export const deleteSeasonHandler = async ({ input }: { input: SeasonIdInput }) => {
    try {
        const season = await prisma.season.findUnique({
            where: { id: input.id },
            select: { id: true, _count: { select: { teamSeasons: true } } },
        });
        if (!season) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada' });

        const n = season._count.teamSeasons;
        if (n > 0) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `No se puede eliminar: tiene ${n} ${n === 1 ? 'equipo inscrito' : 'equipos inscritos'}. Su historial se conserva.`,
            });
        }

        await prisma.season.delete({ where: { id: input.id } });
        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// ===========================================================================
// INSCRIPCIONES (TeamSeason)
// ===========================================================================

export const listTeamSeasonsHandler = async ({ input }: { input: ListTeamSeasonsInput }) => {
    try {
        const teamSeasons = await prisma.teamSeason.findMany({
            where: { seasonId: input.seasonId, teamId: input.teamId, category: input.category },
            select: teamSeasonSelect,
            // Por temporada (la más nueva primero) cuando es el historial de un
            // equipo; dentro de una temporada, por categoría y nombre.
            orderBy: [{ season: { number: 'desc' } }, ...teamSeasonOrder],
        });

        return { status: 'success', results: teamSeasons.length, data: { teamSeasons } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * Inscribir un equipo que YA existe en una temporada, en una categoría.
 * Llega vacío: sin plantel y con todas sus estadísticas en cero. Lo "de
 * siempre" (nombre, logo) ya lo trae el equipo.
 */
export const enrollTeamHandler = async ({ input }: { input: EnrollTeamInput }) => {
    try {
        const [season, team] = await Promise.all([
            prisma.season.findUnique({
                where: { id: input.seasonId },
                select: { status: true, number: true, categories: true, league: { select: { name: true } } },
            }),
            prisma.team.findUnique({ where: { id: input.teamId }, select: { name: true } }),
        ]);

        if (!season) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada' });
        if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe ese equipo' });
        asegurarTemporadaAbierta(season);
        asegurarCategoriaHabilitada(season, input.category);

        const yaInscrito = await prisma.teamSeason.findUnique({
            where: {
                seasonId_teamId_category: {
                    seasonId: input.seasonId,
                    teamId: input.teamId,
                    category: input.category,
                },
            },
            select: { id: true },
        });

        if (yaInscrito) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `${team.name} ya está inscrito en ${etiquetaCategoria[input.category].toLowerCase()} en ${nombreTemporada(season.league, season.number)}`,
            });
        }

        const teamSeason = await prisma.teamSeason.create({ data: input, select: teamSeasonSelect });
        return { status: 'success', data: { teamSeason } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/** Capturar las estadísticas del equipo (a mano, por ahora) o corregir su categoría. */
export const updateTeamSeasonHandler = async ({ input }: { input: UpdateTeamSeasonInput }) => {
    try {
        const { id, ...changes } = input;

        const existing = await prisma.teamSeason.findUnique({
            where: { id },
            select: {
                seasonId: true,
                teamId: true,
                category: true,
                team: { select: { name: true } },
                season: { select: { number: true, categories: true, league: { select: { name: true } } } },
                _count: { select: { memberships: true } },
            },
        });
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa inscripción' });

        if (changes.category && changes.category !== existing.category) {
            asegurarCategoriaHabilitada(existing.season, changes.category);

            // Cambiar la categoría con jugadores adentro podría romper la regla
            // "no dos equipos de la misma categoría" sin que nadie se entere.
            if (existing._count.memberships > 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'No se puede cambiar la categoría de una inscripción que ya tiene jugadores. Quítalos primero o inscribe al equipo en la otra categoría.',
                });
            }

            const choque = await prisma.teamSeason.findUnique({
                where: {
                    seasonId_teamId_category: {
                        seasonId: existing.seasonId,
                        teamId: existing.teamId,
                        category: changes.category,
                    },
                },
                select: { id: true },
            });
            if (choque) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `${existing.team.name} ya está inscrito en ${etiquetaCategoria[changes.category].toLowerCase()} en esta temporada`,
                });
            }
        }

        const teamSeason = await prisma.teamSeason.update({ where: { id }, data: changes, select: teamSeasonSelect });
        return { status: 'success', data: { teamSeason } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * Dar de baja una inscripción. Solo si está VACÍA: una inscripción con
 * jugadores es historial, y el historial no se borra por accidente.
 */
export const removeTeamSeasonHandler = async ({ input }: { input: TeamSeasonIdInput }) => {
    try {
        const existing = await prisma.teamSeason.findUnique({
            where: { id: input.id },
            select: { id: true, _count: { select: { memberships: true } } },
        });
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa inscripción' });

        const n = existing._count.memberships;
        if (n > 0) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `No se puede dar de baja: todavía tiene ${n} ${n === 1 ? 'jugador' : 'jugadores'}. Quítalos primero.`,
            });
        }

        await prisma.teamSeason.delete({ where: { id: input.id } });
        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * COPIAR PLANTILLA de una inscripción a otra.
 *
 * Regla: "Copias quién es. Nunca copias cómo le fue."
 *   Se copian:    playerId, jerseyNumber, positions
 *   NO se copian: estadísticas (nacen en 0), availableForPlayoffs (true),
 *                 photoUrl/photoKey (vacías: si dos membresías apuntaran al
 *                 mismo archivo, cambiar una foto borraría la otra).
 *
 * Decisiones:
 *   - Solo se copia a una inscripción VACÍA. Así nunca hay choques de dorsal.
 *   - Si alguien del plantel ya juega en otro equipo de la misma categoría en
 *     la temporada destino, se rechaza TODO con la lista de nombres.
 *   - Todo va dentro de una transacción: o se copia el plantel entero o nada.
 */
export const copyRosterHandler = async ({ input }: { input: CopyRosterInput }) => {
    try {
        const copiados = await prisma.$transaction(async (tx) => {
            const [origen, destino] = await Promise.all([
                tx.teamSeason.findUnique({
                    where: { id: input.fromTeamSeasonId },
                    select: {
                        memberships: { select: { playerId: true, jerseyNumber: true, positions: true } },
                    },
                }),
                tx.teamSeason.findUnique({
                    where: { id: input.toTeamSeasonId },
                    select: {
                        seasonId: true,
                        category: true,
                        season: { select: { status: true, number: true, league: { select: { name: true } } } },
                        _count: { select: { memberships: true } },
                    },
                }),
            ]);

            if (!origen) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe la inscripción de origen' });
            if (!destino) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe la inscripción de destino' });
            asegurarTemporadaAbierta(destino.season);

            if (destino._count.memberships > 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Solo se puede copiar una plantilla a una inscripción sin jugadores.',
                });
            }

            if (origen.memberships.length === 0) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'La inscripción de origen no tiene jugadores.' });
            }

            const choques = await buscarChoquesDeCategoria(tx, {
                playerIds: origen.memberships.map((m) => m.playerId),
                seasonId: destino.seasonId,
                category: destino.category,
                excluirTeamSeasonId: input.toTeamSeasonId,
            });
            if (choques.length > 0) {
                throw new TRPCError({ code: 'CONFLICT', message: mensajeChoques(choques, destino.category) });
            }

            const creadas = await tx.teamMembership.createMany({
                data: origen.memberships.map((m) => ({
                    playerId: m.playerId,
                    teamSeasonId: input.toTeamSeasonId,
                    jerseyNumber: m.jerseyNumber,
                    positions: m.positions,
                })),
            });

            return creadas.count;
        });

        return { status: 'success', data: { copiados } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

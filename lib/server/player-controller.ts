import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma';
import { almacenamiento } from '@/lib/server/storage';
import {
    asegurarTemporadaAbierta,
    buscarChoquesDeCategoria,
    mensajeChoques,
} from '@/lib/server/reglas-inscripcion';
import type {
    CreatePlayerInput,
    UpdatePlayerInput,
    PlayerIdInput,
    ListPlayersInput,
    CreateMembershipInput,
    RegisterPlayerInTeamInput,
    UpdateMembershipInput,
    MembershipIdInput,
    ListMembershipsInput,
} from '@/lib/player-schema';

// Mismo helper que en team-controller.ts: los TRPCError que lanzamos
// nosotros (NOT_FOUND, CONFLICT) pasan intactos; lo inesperado se vuelve 500.
const toTRPCError = (err: unknown): never => {
    if (err instanceof TRPCError) throw err;

    let message = 'Error Desconocido';
    if (err instanceof Error) {
        message = err.message;
    } else if (typeof err === 'string') {
        message = err;
    } else {
        try {
            message = JSON.stringify(err);
        } catch {
            /* keep fallback message */
        }
    }

    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
};

// Cada membresía se devuelve junto con su inscripción: equipo (nombre y logo,
// que son "de siempre") y temporada (con su liga), para que la pantalla no
// tenga que hacer una segunda petición. Es el salto extra que cuesta el
// Camino B: membership → teamSeason → team.
const membershipSelect = {
    id: true,
    teamSeasonId: true,
    jerseyNumber: true,
    positions: true,
    // photoUrl sale al navegador (es lo que va en el <img>).
    // photoKey NO: solo el servidor la necesita, para borrar el archivo.
    photoUrl: true,
    touchdowns: true,
    interceptions: true,
    touchdownPasses: true,
    safeties: true,
    gamesPlayed: true,
    availableForPlayoffs: true,
    teamSeason: {
        select: {
            id: true,
            category: true,
            team: { select: { id: true, name: true, logoUrl: true } },
            season: {
                select: {
                    id: true,
                    number: true,
                    status: true,
                    league: { select: { id: true, name: true, slug: true } },
                },
            },
        },
    },
} as const;

// De la temporada más nueva a la más vieja. Va fuera del `as const` de abajo
// porque Prisma no acepta arreglos de solo lectura en orderBy.
const membershipOrder: Prisma.TeamMembershipOrderByWithRelationInput[] = [
    { teamSeason: { season: { number: 'desc' } } },
    { teamSeason: { category: 'asc' } },
];

const playerSelect = {
    id: true,
    name: true,
    lastName: true,
    age: true,
    height: true,
    createdAt: true,
    updatedAt: true,
    memberships: { select: membershipSelect, orderBy: membershipOrder },
} as const;

// ---------------------------------------------------------------------------
// LA PERSONA
// ---------------------------------------------------------------------------

export const listPlayersHandler = async ({ input }: { input?: ListPlayersInput }) => {
    try {
        const players = await prisma.player.findMany({
            // "dame las personas que tengan AL MENOS una membresía que cumpla X".
            // `some` es la forma de filtrar por una relación en Prisma.
            where:
                input?.teamSeasonId || input?.seasonId
                    ? {
                          memberships: {
                              some: {
                                  teamSeasonId: input.teamSeasonId,
                                  teamSeason: input.seasonId ? { seasonId: input.seasonId } : undefined,
                              },
                          },
                      }
                    : undefined,
            select: playerSelect,
            orderBy: [{ lastName: 'asc' }, { name: 'asc' }],
        });

        return {
            status: 'success',
            results: players.length,
            data: { players },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const getPlayerHandler = async ({ input }: { input: PlayerIdInput }) => {
    try {
        const player = await prisma.player.findUnique({
            where: { id: input.id },
            select: playerSelect,
        });

        if (!player) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un jugador con ese id' });
        }

        // "¿Cuántos touchdowns lleva en toda su carrera?" No hay columna que lo
        // guarde: es un SUM sobre todas sus membresías. El historial por
        // temporada y el total de carrera salen del MISMO dato, sin duplicarlo.
        const suma = await prisma.teamMembership.aggregate({
            where: { playerId: input.id },
            _sum: {
                touchdowns: true,
                interceptions: true,
                touchdownPasses: true,
                safeties: true,
                gamesPlayed: true,
            },
        });

        const carrera = {
            // Temporadas DISTINTAS: jugar varonil y mixto en LDT VIII cuenta como
            // una temporada (pero dos participaciones).
            temporadas: new Set(player.memberships.map((m) => m.teamSeason.season.id)).size,
            participaciones: player.memberships.length,
            touchdowns: suma._sum.touchdowns ?? 0,
            interceptions: suma._sum.interceptions ?? 0,
            touchdownPasses: suma._sum.touchdownPasses ?? 0,
            safeties: suma._sum.safeties ?? 0,
            gamesPlayed: suma._sum.gamesPlayed ?? 0,
        };

        return { status: 'success', data: { player, carrera } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const createPlayerHandler = async ({ input }: { input: CreatePlayerInput }) => {
    try {
        // A propósito NO se valida que el nombre sea único: en una liga
        // puede haber dos personas distintas que se llamen igual.
        const player = await prisma.player.create({
            data: {
                name: input.name,
                lastName: input.lastName,
                age: input.age,
                height: input.height,
            },
            select: playerSelect,
        });

        return { status: 'success', data: { player } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const updatePlayerHandler = async ({ input }: { input: UpdatePlayerInput }) => {
    try {
        const { id, ...changes } = input;

        const existing = await prisma.player.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un jugador con ese id' });
        }

        const player = await prisma.player.update({
            where: { id },
            data: changes,
            select: playerSelect,
        });

        return { status: 'success', data: { player } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const deletePlayerHandler = async ({ input }: { input: PlayerIdInput }) => {
    try {
        const existing = await prisma.player.findUnique({
            where: { id: input.id },
            select: {
                id: true,
                // Se piden las keys de TODAS sus fotos ANTES de borrar.
                // Esto es importante: el onDelete: Cascade de Postgres borra
                // las FILAS de las membresías, pero no sabe nada de archivos
                // en disco. Si no las recogemos ahora, después de borrar ya
                // no hay forma de saber qué archivos quedaron huérfanos.
                memberships: { select: { photoKey: true } },
            },
        });

        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un jugador con ese id' });
        }

        // El onDelete: Cascade del schema se lleva sus membresías
        // (y con ellas, sus estadísticas) automáticamente.
        await prisma.player.delete({ where: { id: input.id } });

        // Y ahora sí, los archivos. Van en paralelo porque son independientes
        // entre sí, y después del delete por la misma razón de siempre: si el
        // borrado en la base fallara, las fotos seguirían haciendo falta.
        const fotos = existing.memberships
            .map((m) => m.photoKey)
            .filter((key): key is string => Boolean(key));

        await Promise.all(fotos.map((key) => almacenamiento.borrar(key)));

        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// ---------------------------------------------------------------------------
// LAS MEMBRESÍAS
// ---------------------------------------------------------------------------

export const addPlayerToTeamHandler = async ({ input }: { input: CreateMembershipInput }) => {
    try {
        const [player, teamSeason] = await Promise.all([
            prisma.player.findUnique({ where: { id: input.playerId }, select: { id: true } }),
            prisma.teamSeason.findUnique({
                where: { id: input.teamSeasonId },
                select: {
                    seasonId: true,
                    category: true,
                    season: { select: { status: true, number: true, league: { select: { name: true } } } },
                },
            }),
        ]);

        if (!player) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un jugador con ese id' });
        }
        if (!teamSeason) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Ese equipo no está inscrito en esa temporada' });
        }
        asegurarTemporadaAbierta(teamSeason.season);

        const yaEsMiembro = await prisma.teamMembership.findUnique({
            where: {
                playerId_teamSeasonId: { playerId: input.playerId, teamSeasonId: input.teamSeasonId },
            },
            select: { id: true },
        });

        if (yaEsMiembro) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ese jugador ya está en este equipo en esta temporada',
            });
        }

        // Regla de la liga: no puede jugar en OTRO equipo de la misma
        // categoría en la misma temporada.
        const choques = await buscarChoquesDeCategoria(prisma, {
            playerIds: [input.playerId],
            seasonId: teamSeason.seasonId,
            category: teamSeason.category,
            excluirTeamSeasonId: input.teamSeasonId,
        });
        if (choques.length > 0) {
            throw new TRPCError({ code: 'CONFLICT', message: mensajeChoques(choques, teamSeason.category) });
        }

        const jerseyOcupado = await prisma.teamMembership.findUnique({
            where: {
                teamSeasonId_jerseyNumber: {
                    teamSeasonId: input.teamSeasonId,
                    jerseyNumber: input.jerseyNumber,
                },
            },
            select: { id: true },
        });

        if (jerseyOcupado) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `El número ${input.jerseyNumber} ya está ocupado en este equipo`,
            });
        }

        const membership = await prisma.teamMembership.create({
            data: {
                playerId: input.playerId,
                teamSeasonId: input.teamSeasonId,
                jerseyNumber: input.jerseyNumber,
                positions: input.positions,
                // La imagen ya se subió antes por /api/upload; aquí solo
                // se guardan las dos cadenas que aquella petición devolvió.
                photoUrl: input.photoUrl,
                photoKey: input.photoKey,
            },
            select: membershipSelect,
        });

        return { status: 'success', data: { membership } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * ATAJO: crea a la persona y la mete a un equipo en UNA sola operación.
 *
 * ¿Por qué no llamar createPlayer y luego addPlayerToTeam desde el navegador?
 * Porque si el segundo falla (el jersey ya estaba ocupado, por ejemplo), el
 * primero ya ocurrió: la persona queda creada y sin equipo, y al reintentar
 * se crearía OTRA igual. Con $transaction, o se crean las dos filas o ninguna.
 *
 * La regla "no dos equipos de la misma categoría" no hace falta revisarla:
 * la persona es nueva, así que no juega en ningún lado todavía.
 */
export const registerPlayerInTeamHandler = async ({ input }: { input: RegisterPlayerInTeamInput }) => {
    try {
        const teamSeason = await prisma.teamSeason.findUnique({
            where: { id: input.teamSeasonId },
            select: { season: { select: { status: true, number: true, league: { select: { name: true } } } } },
        });
        if (!teamSeason) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Ese equipo no está inscrito en esa temporada' });
        }
        asegurarTemporadaAbierta(teamSeason.season);

        const jerseyOcupado = await prisma.teamMembership.findUnique({
            where: {
                teamSeasonId_jerseyNumber: { teamSeasonId: input.teamSeasonId, jerseyNumber: input.jerseyNumber },
            },
            select: { id: true },
        });
        if (jerseyOcupado) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `El número ${input.jerseyNumber} ya está ocupado en este equipo`,
            });
        }

        const membership = await prisma.$transaction(async (tx) => {
            const player = await tx.player.create({
                data: { name: input.name, lastName: input.lastName, age: input.age, height: input.height },
                select: { id: true },
            });

            return tx.teamMembership.create({
                data: {
                    playerId: player.id,
                    teamSeasonId: input.teamSeasonId,
                    jerseyNumber: input.jerseyNumber,
                    positions: input.positions,
                    photoUrl: input.photoUrl,
                    photoKey: input.photoKey,
                },
                select: membershipSelect,
            });
        });

        return { status: 'success', data: { membership } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const updateMembershipHandler = async ({ input }: { input: UpdateMembershipInput }) => {
    try {
        const { id, ...changes } = input;

        const existing = await prisma.teamMembership.findUnique({
            where: { id },
            // Se pide photoKey además del teamSeasonId: hace falta para saber
            // qué archivo borrar si la foto cambia.
            select: { id: true, teamSeasonId: true, photoKey: true },
        });

        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa membresía' });
        }

        // Si cambia el jersey, tiene que seguir libre dentro de la MISMA inscripción.
        if (changes.jerseyNumber !== undefined) {
            const jerseyOcupado = await prisma.teamMembership.findUnique({
                where: {
                    teamSeasonId_jerseyNumber: {
                        teamSeasonId: existing.teamSeasonId,
                        jerseyNumber: changes.jerseyNumber,
                    },
                },
                select: { id: true },
            });

            // El `!== id` deja que conserve su propio número sin chocar consigo mismo.
            if (jerseyOcupado && jerseyOcupado.id !== id) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `El número ${changes.jerseyNumber} ya está ocupado en este equipo`,
                });
            }
        }

        const membership = await prisma.teamMembership.update({
            where: { id },
            data: changes,
            select: membershipSelect,
        });

        // La foto cambió (o se quitó) y había una antes: se borra el archivo
        // viejo para no acumular basura en el disco. Va DESPUÉS del update
        // a propósito: si el update fallara, no queremos haber borrado una
        // imagen que la membresía sigue usando.
        const fotoCambio = changes.photoKey !== undefined && changes.photoKey !== existing.photoKey;
        if (fotoCambio && existing.photoKey) {
            await almacenamiento.borrar(existing.photoKey);
        }

        return { status: 'success', data: { membership } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

export const removeMembershipHandler = async ({ input }: { input: MembershipIdInput }) => {
    try {
        const existing = await prisma.teamMembership.findUnique({
            where: { id: input.id },
            select: { id: true, photoKey: true },
        });

        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa membresía' });
        }

        // Ojo: esto borra también las estadísticas de ese jugador EN ESA
        // inscripción. La persona y sus otras membresías (otras temporadas,
        // otras categorías) quedan intactas. Es para corregir errores de
        // captura; un jugador que "se fue" simplemente no se agrega a la
        // temporada siguiente, y su fila vieja se queda como historial.
        await prisma.teamMembership.delete({ where: { id: input.id } });

        // La membresía ya no existe: su foto tampoco tiene por qué seguir ahí.
        if (existing.photoKey) {
            await almacenamiento.borrar(existing.photoKey);
        }

        return { status: 'success', data: { id: input.id } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// ---------------------------------------------------------------------------
// EL LISTADO PÚBLICO (por membresía, no por persona)
// ---------------------------------------------------------------------------

export const listMembershipsHandler = async ({
    input,
}: {
    input?: ListMembershipsInput;
}) => {
    try {
        const order = input?.order ?? 'asc';

        // El `where` se arma por partes: cada filtro solo se agrega si vino.
        // Las llaves con `undefined` las ignora Prisma, así que no hace falta
        // construir el objeto con ifs.
        const where = {
            teamSeasonId: input?.teamSeasonId,
            teamSeason: input?.seasonId ? { seasonId: input.seasonId } : undefined,
            jerseyNumber: input?.jerseyNumber,
            // `has` es el operador de Prisma para "este arreglo contiene X".
            positions: input?.position ? { has: input.position } : undefined,
            player: input?.search
                ? {
                      OR: [
                          { name: { contains: input.search, mode: 'insensitive' as const } },
                          { lastName: { contains: input.search, mode: 'insensitive' as const } },
                      ],
                  }
                : undefined,
        };

        // Se piden los datos y el total en paralelo. El total es del filtro
        // COMPLETO, sin el take/skip, para poder decir "mostrando 12 de 87"
        // cuando exista el botón de cargar más.
        const [memberships, total] = await Promise.all([
            prisma.teamMembership.findMany({
                where,
                select: {
                    ...membershipSelect,
                    player: {
                        select: { id: true, name: true, lastName: true, age: true, height: true },
                    },
                },
                // Ordena por apellido y, si empatan, por nombre.
                orderBy: [{ player: { lastName: order } }, { player: { name: order } }],
                take: input?.take,
                skip: input?.skip,
            }),
            prisma.teamMembership.count({ where }),
        ]);

        return {
            status: 'success',
            results: memberships.length,
            total,
            data: { memberships },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

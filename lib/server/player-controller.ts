import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { almacenamiento } from '@/lib/server/storage';
import type {
    CreatePlayerInput,
    UpdatePlayerInput,
    PlayerIdInput,
    ListPlayersInput,
    CreateMembershipInput,
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

// Cada membresía se devuelve junto con los datos básicos de su equipo,
// para que la pantalla no tenga que hacer una segunda petición.
const membershipSelect = {
    id: true,
    teamId: true,
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
    team: { select: { id: true, name: true, category: true } },
} as const;

const playerSelect = {
    id: true,
    name: true,
    lastName: true,
    age: true,
    height: true,
    createdAt: true,
    updatedAt: true,
    memberships: { select: membershipSelect },
} as const;

// ---------------------------------------------------------------------------
// LA PERSONA
// ---------------------------------------------------------------------------

export const listPlayersHandler = async ({ input }: { input?: ListPlayersInput }) => {
    try {
        const players = await prisma.player.findMany({
            // "dame las personas que tengan AL MENOS una membresía en este equipo".
            // `some` es la forma de filtrar por una relación en Prisma.
            where: input?.teamId
                ? { memberships: { some: { teamId: input.teamId } } }
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

        return { status: 'success', data: { player } };
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
        const [player, team] = await Promise.all([
            prisma.player.findUnique({ where: { id: input.playerId }, select: { id: true } }),
            prisma.team.findUnique({ where: { id: input.teamId }, select: { id: true } }),
        ]);

        if (!player) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un jugador con ese id' });
        }
        if (!team) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe un equipo con ese id' });
        }

        const yaEsMiembro = await prisma.teamMembership.findUnique({
            where: { playerId_teamId: { playerId: input.playerId, teamId: input.teamId } },
            select: { id: true },
        });

        if (yaEsMiembro) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ese jugador ya pertenece a este equipo',
            });
        }

        const jerseyOcupado = await prisma.teamMembership.findUnique({
            where: { teamId_jerseyNumber: { teamId: input.teamId, jerseyNumber: input.jerseyNumber } },
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
                teamId: input.teamId,
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

export const updateMembershipHandler = async ({ input }: { input: UpdateMembershipInput }) => {
    try {
        const { id, ...changes } = input;

        const existing = await prisma.teamMembership.findUnique({
            where: { id },
            // Se pide photoKey además del teamId: hace falta para saber
            // qué archivo borrar si la foto cambia.
            select: { id: true, teamId: true, photoKey: true },
        });

        if (!existing) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa membresía' });
        }

        // Si cambia el jersey, tiene que seguir libre dentro del MISMO equipo.
        if (changes.jerseyNumber !== undefined) {
            const jerseyOcupado = await prisma.teamMembership.findUnique({
                where: {
                    teamId_jerseyNumber: {
                        teamId: existing.teamId,
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

        // Ojo: esto borra también las estadísticas de ese jugador EN ESE EQUIPO.
        // La persona y sus otras membresías quedan intactas.
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
            teamId: input?.teamId,
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

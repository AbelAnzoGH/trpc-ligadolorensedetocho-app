import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { almacenamiento } from '@/lib/server/storage';
import type {
    CreateTeamInput,
    UpdateTeamInput,
    TeamIdInput,
    ListTeamsInput,
} from '@/lib/team-schema';

// Qué columnas devolvemos siempre. Tenerlo en una constante evita
// repetirlo en cada handler y que un endpoint devuelva de más por descuido.
const teamSelect = {
    id: true,
    name: true,
    category: true,
    // logoUrl sí sale al navegador (es lo que va en el <img>).
    // logoKey NO: es un detalle interno del almacenamiento que solo el
    // servidor necesita para poder borrar el archivo.
    logoUrl: true,
    createdAt: true,
    updatedAt: true,
} as const;

// Convierte cualquier error desconocido en un TRPCError.
// Si ya es un TRPCError (por ejemplo un NOT_FOUND que lanzamos nosotros),
// lo dejamos pasar tal cual para no perder su código.
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

// READ (lista) -------------------------------------------------------------
export const listTeamsHandler = async ({ input }: { input?: ListTeamsInput }) => {
    try {
        const teams = await prisma.team.findMany({
            where: input?.category ? { category: input.category } : undefined,
            select: teamSelect,
            orderBy: { name: 'asc' },
        });

        return {
            status: 'success',
            results: teams.length,
            data: { teams },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// READ (uno) ---------------------------------------------------------------
export const getTeamHandler = async ({ input }: { input: TeamIdInput }) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: input.id },
            select: teamSelect,
        });

        if (!team) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No existe un equipo con ese id',
            });
        }

        return {
            status: 'success',
            data: { team },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// CREATE -------------------------------------------------------------------
export const createTeamHandler = async ({ input }: { input: CreateTeamInput }) => {
    try {
        const existing = await prisma.team.findUnique({
            where: { name: input.name },
            select: { id: true },
        });

        if (existing) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ya existe un equipo con ese nombre',
            });
        }

        const team = await prisma.team.create({
            data: {
                name: input.name,
                category: input.category,
                logoUrl: input.logoUrl,
                logoKey: input.logoKey,
            },
            select: teamSelect,
        });

        return {
            status: 'success',
            data: { team },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// UPDATE -------------------------------------------------------------------
export const updateTeamHandler = async ({ input }: { input: UpdateTeamInput }) => {
    try {
        const { id, ...changes } = input;

        const team = await prisma.team.findUnique({
            where: { id },
            select: { id: true, logoKey: true },
        });

        if (!team) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No existe un equipo con ese id',
            });
        }

        // Si intentan cambiar el nombre, verificamos que no choque
        // con el de OTRO equipo (el propio nombre sí se puede conservar).
        if (changes.name) {
            const duplicate = await prisma.team.findUnique({
                where: { name: changes.name },
                select: { id: true },
            });

            if (duplicate && duplicate.id !== id) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya existe otro equipo con ese nombre',
                });
            }
        }

        const updatedTeam = await prisma.team.update({
            where: { id },
            data: changes,
            select: teamSelect,
        });

        // El logo cambió (o se quitó) y había uno antes: borra el archivo
        // viejo para no dejar basura acumulándose en el disco. Va DESPUÉS
        // del update a propósito: si el update falla, no queremos haber
        // borrado un archivo que el equipo sigue usando.
        const logoCambio = changes.logoKey !== undefined && changes.logoKey !== team.logoKey;
        if (logoCambio && team.logoKey) {
            await almacenamiento.borrar(team.logoKey);
        }

        return {
            status: 'success',
            data: { team: updatedTeam },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

// DELETE -------------------------------------------------------------------
export const deleteTeamHandler = async ({ input }: { input: TeamIdInput }) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: input.id },
            select: { id: true, logoKey: true },
        });

        if (!team) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No existe un equipo con ese id',
            });
        }

        // Un equipo con jugadores no se puede borrar: primero hay que quitarlos.
        // Sin esta comprobación, el onDelete: Restrict del schema lanzaría un
        // error críptico de Postgres que llegaría al usuario como un 500.
        const jugadores = await prisma.teamMembership.count({
            where: { teamId: input.id },
        });

        if (jugadores > 0) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `No se puede eliminar: el equipo todavía tiene ${jugadores} ${jugadores === 1 ? 'jugador' : 'jugadores'}. Quítalos primero.`,
            });
        }

        await prisma.team.delete({ where: { id: input.id } });

        // El equipo ya no existe: su logo tampoco tiene por qué seguir ahí.
        if (team.logoKey) {
            await almacenamiento.borrar(team.logoKey);
        }

        return {
            status: 'success',
            data: { id: input.id },
        };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

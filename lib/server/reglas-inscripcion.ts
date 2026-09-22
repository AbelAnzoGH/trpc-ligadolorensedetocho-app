import { TRPCError } from '@trpc/server';
import { Prisma } from '@/app/generated/prisma';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada } from '@/lib/season-ui';

/**
 * Reglas de negocio que la BASE no puede garantizar sola y que comparten
 * varios controladores (temporadas y jugadores). Vivir en un solo archivo
 * evita que una misma regla se escriba dos veces y un día se contradiga.
 */

// El cliente de Prisma "normal" y el que recibe un $transaction tienen casi
// la misma forma. Aceptar este tipo deja usar las reglas dentro y fuera de
// una transacción.
type Db = Prisma.TransactionClient;

/**
 * Convierte cualquier error desconocido en un TRPCError.
 * Igual que el helper de team-controller.ts, más dos traducciones de Prisma:
 *   P2002 → choque con un índice único (dos admins haciendo lo mismo a la vez).
 *   P2003 → la base rechazó un borrado por un onDelete: Restrict.
 * Sin esto, esos casos llegarían al usuario como un 500 con texto de Postgres.
 */
export const toTRPCError = (err: unknown): never => {
    if (err instanceof TRPCError) throw err;

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Ese registro ya existe (alguien lo acaba de crear). Recarga e inténtalo de nuevo.',
            });
        }
        if (err.code === 'P2003') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'No se puede borrar: todavía tiene información que depende de él.',
            });
        }
    }

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

/**
 * Una temporada 'cerrada' está congelada: no se inscriben equipos ni se
 * agregan jugadores. Las ESTADÍSTICAS sí se pueden corregir (un error de
 * captura no debe quedarse para siempre). Para inscribir, hay que reabrirla
 * cambiando su estado, y eso es una decisión consciente del admin.
 */
export const asegurarTemporadaAbierta = (season: {
    status: string;
    number: number;
    league: { name: string };
}) => {
    if (season.status === 'cerrada') {
        throw new TRPCError({
            code: 'CONFLICT',
            message: `${nombreTemporada(season.league, season.number)} está cerrada. Cámbiala a "inscripciones" o "activa" para modificar su plantel.`,
        });
    }
};

/**
 * REGLA DE LA LIGA: una persona no puede jugar en dos equipos de la MISMA
 * categoría dentro de la MISMA temporada. (Sí puede jugar varonil y mixto a
 * la vez, y sí puede jugar en otra liga con otro equipo.)
 *
 * La regla cruza tres tablas (membresía → inscripción → temporada), por eso
 * la base no la puede expresar con un @@unique y la hace cumplir el servidor.
 *
 * Devuelve los choques encontrados (vacío = todo bien) para que quien llama
 * decida el mensaje: uno solo al agregar a un jugador, una lista al copiar
 * una plantilla completa.
 */
export const buscarChoquesDeCategoria = async (
    db: Db,
    {
        playerIds,
        seasonId,
        category,
        excluirTeamSeasonId,
    }: {
        playerIds: string[];
        seasonId: string;
        category: TeamCategory;
        /** La inscripción destino: estar ya en ella no es "otro equipo". */
        excluirTeamSeasonId: string;
    },
) => {
    if (playerIds.length === 0) return [];

    const choques = await db.teamMembership.findMany({
        where: {
            playerId: { in: playerIds },
            teamSeasonId: { not: excluirTeamSeasonId },
            teamSeason: { seasonId, category },
        },
        select: {
            player: { select: { name: true, lastName: true } },
            teamSeason: { select: { team: { select: { name: true } } } },
        },
    });

    return choques.map((c) => ({
        jugador: `${c.player.name} ${c.player.lastName}`,
        equipo: c.teamSeason.team.name,
    }));
};

/** El mensaje estándar cuando hay choques de categoría. */
export const mensajeChoques = (
    choques: { jugador: string; equipo: string }[],
    category: TeamCategory,
) => {
    const cat = etiquetaCategoria[category].toLowerCase();
    if (choques.length === 1) {
        const [c] = choques;
        return `${c.jugador} ya juega con ${c.equipo} en la categoría ${cat} de esta temporada.`;
    }
    const lista = choques.map((c) => `${c.jugador} (${c.equipo})`).join(', ');
    return `Estos jugadores ya juegan en otro equipo ${cat} de esta temporada: ${lista}.`;
};

import {
    createPlayerSchema,
    updatePlayerSchema,
    playerIdSchema,
    listPlayersSchema,
    createMembershipSchema,
    registerPlayerInTeamSchema,
    updateMembershipSchema,
    membershipIdSchema,
    listMembershipsSchema,
} from '@/lib/player-schema';

import { adminProcedure, publicProcedure, t } from '@/utils/trpc-server';
import {
    listPlayersHandler,
    getPlayerHandler,
    createPlayerHandler,
    updatePlayerHandler,
    deletePlayerHandler,
    addPlayerToTeamHandler,
    registerPlayerInTeamHandler,
    updateMembershipHandler,
    removeMembershipHandler,
    listMembershipsHandler,
} from '@/lib/server/player-controller';

const playerRouter = t.router({
    // --- Lectura: pública, igual que los equipos ---
    listPlayers: publicProcedure
        .input(listPlayersSchema)
        .query(({ input }) => listPlayersHandler({ input })),

    getPlayer: publicProcedure
        .input(playerIdSchema)
        .query(({ input }) => getPlayerHandler({ input })),

    // Listado por membresía: es el que usa la página pública /jugadores,
    // porque los filtros (equipo, número, posición) son de la membresía.
    listMemberships: publicProcedure
        .input(listMembershipsSchema)
        .query(({ input }) => listMembershipsHandler({ input })),

    // --- Escritura sobre la persona ---
    createPlayer: adminProcedure
        .input(createPlayerSchema)
        .mutation(({ input }) => createPlayerHandler({ input })),

    updatePlayer: adminProcedure
        .input(updatePlayerSchema)
        .mutation(({ input }) => updatePlayerHandler({ input })),

    deletePlayer: adminProcedure
        .input(playerIdSchema)
        .mutation(({ input }) => deletePlayerHandler({ input })),

    // --- Escritura sobre la membresía (jugador dentro de un equipo) ---
    addPlayerToTeam: adminProcedure
        .input(createMembershipSchema)
        .mutation(({ input }) => addPlayerToTeamHandler({ input })),

    // Atajo del modal de plantel: persona nueva + membresía en una transacción.
    registerPlayerInTeam: adminProcedure
        .input(registerPlayerInTeamSchema)
        .mutation(({ input }) => registerPlayerInTeamHandler({ input })),

    updateMembership: adminProcedure
        .input(updateMembershipSchema)
        .mutation(({ input }) => updateMembershipHandler({ input })),

    removeMembership: adminProcedure
        .input(membershipIdSchema)
        .mutation(({ input }) => removeMembershipHandler({ input })),
});

export default playerRouter;

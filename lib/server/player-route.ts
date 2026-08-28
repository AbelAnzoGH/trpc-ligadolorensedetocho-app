import {
    createPlayerSchema,
    updatePlayerSchema,
    playerIdSchema,
    listPlayersSchema,
    createMembershipSchema,
    updateMembershipSchema,
    membershipIdSchema,
    listMembershipsSchema,
} from '@/lib/player-schema';

import { protectedProcedure, publicProcedure, t } from '@/utils/trpc-server';
import {
    listPlayersHandler,
    getPlayerHandler,
    createPlayerHandler,
    updatePlayerHandler,
    deletePlayerHandler,
    addPlayerToTeamHandler,
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
    createPlayer: protectedProcedure
        .input(createPlayerSchema)
        .mutation(({ input }) => createPlayerHandler({ input })),

    updatePlayer: protectedProcedure
        .input(updatePlayerSchema)
        .mutation(({ input }) => updatePlayerHandler({ input })),

    deletePlayer: protectedProcedure
        .input(playerIdSchema)
        .mutation(({ input }) => deletePlayerHandler({ input })),

    // --- Escritura sobre la membresía (jugador dentro de un equipo) ---
    addPlayerToTeam: protectedProcedure
        .input(createMembershipSchema)
        .mutation(({ input }) => addPlayerToTeamHandler({ input })),

    updateMembership: protectedProcedure
        .input(updateMembershipSchema)
        .mutation(({ input }) => updateMembershipHandler({ input })),

    removeMembership: protectedProcedure
        .input(membershipIdSchema)
        .mutation(({ input }) => removeMembershipHandler({ input })),
});

export default playerRouter;

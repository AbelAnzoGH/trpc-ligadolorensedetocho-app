import {
    createTeamSchema,
    updateTeamSchema,
    teamIdSchema,
    listTeamsSchema,
} from '@/lib/team-schema';

import { adminProcedure, publicProcedure, t } from '@/utils/trpc-server';
import {
    listTeamsHandler,
    getTeamHandler,
    createTeamHandler,
    updateTeamHandler,
    deleteTeamHandler,
} from '@/lib/server/team-controller';

const teamRouter = t.router({
    // --- Lectura: pública (cualquiera puede consultar los equipos de la liga) ---
    listTeams: publicProcedure
        .input(listTeamsSchema)
        .query(({ input }) => listTeamsHandler({ input })),

    getTeam: publicProcedure
        .input(teamIdSchema)
        .query(({ input }) => getTeamHandler({ input })),

    // --- Escritura: solo administradores ---
    createTeam: adminProcedure
        .input(createTeamSchema)
        .mutation(({ input }) => createTeamHandler({ input })),

    updateTeam: adminProcedure
        .input(updateTeamSchema)
        .mutation(({ input }) => updateTeamHandler({ input })),

    deleteTeam: adminProcedure
        .input(teamIdSchema)
        .mutation(({ input }) => deleteTeamHandler({ input })),
});

export default teamRouter;

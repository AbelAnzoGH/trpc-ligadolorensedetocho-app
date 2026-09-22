import {
    createLeagueSchema,
    updateLeagueSchema,
    createSeasonSchema,
    updateSeasonSchema,
    seasonIdSchema,
    seasonBySlugSchema,
    listTeamSeasonsSchema,
    enrollTeamSchema,
    updateTeamSeasonSchema,
    teamSeasonIdSchema,
    copyRosterSchema,
} from '@/lib/season-schema';

import { adminProcedure, publicProcedure, t } from '@/utils/trpc-server';
import {
    listLeaguesHandler,
    createLeagueHandler,
    updateLeagueHandler,
    getSeasonBySlugHandler,
    createSeasonHandler,
    updateSeasonHandler,
    deleteSeasonHandler,
    listTeamSeasonsHandler,
    enrollTeamHandler,
    updateTeamSeasonHandler,
    removeTeamSeasonHandler,
    copyRosterHandler,
} from '@/lib/server/season-controller';

// Misma regla que equipos y jugadores: TODO lo que se lee es público
// (un visitante sin sesión ve todas las temporadas completas) y todo lo
// que escribe es solo para administradores.
const seasonRouter = t.router({
    // --- Lectura pública ---
    listLeagues: publicProcedure.query(() => listLeaguesHandler()),

    getSeasonBySlug: publicProcedure
        .input(seasonBySlugSchema)
        .query(({ input }) => getSeasonBySlugHandler({ input })),

    listTeamSeasons: publicProcedure
        .input(listTeamSeasonsSchema)
        .query(({ input }) => listTeamSeasonsHandler({ input })),

    // --- Ligas ---
    createLeague: adminProcedure
        .input(createLeagueSchema)
        .mutation(({ input }) => createLeagueHandler({ input })),

    updateLeague: adminProcedure
        .input(updateLeagueSchema)
        .mutation(({ input }) => updateLeagueHandler({ input })),

    // --- Temporadas ---
    createSeason: adminProcedure
        .input(createSeasonSchema)
        .mutation(({ input }) => createSeasonHandler({ input })),

    updateSeason: adminProcedure
        .input(updateSeasonSchema)
        .mutation(({ input }) => updateSeasonHandler({ input })),

    deleteSeason: adminProcedure
        .input(seasonIdSchema)
        .mutation(({ input }) => deleteSeasonHandler({ input })),

    // --- Inscripciones ---
    // "Existe un equipo nuevo en la liga" (createTeam) y "este equipo juega
    // esta temporada" (enrollTeam) son dos hechos distintos: a veces pasan
    // juntos, a veces no. Por eso son dos endpoints.
    enrollTeam: adminProcedure
        .input(enrollTeamSchema)
        .mutation(({ input }) => enrollTeamHandler({ input })),

    updateTeamSeason: adminProcedure
        .input(updateTeamSeasonSchema)
        .mutation(({ input }) => updateTeamSeasonHandler({ input })),

    removeTeamSeason: adminProcedure
        .input(teamSeasonIdSchema)
        .mutation(({ input }) => removeTeamSeasonHandler({ input })),

    copyRoster: adminProcedure
        .input(copyRosterSchema)
        .mutation(({ input }) => copyRosterHandler({ input })),
});

export default seasonRouter;

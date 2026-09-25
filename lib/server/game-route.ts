import {
    createVenueSchema,
    updateVenueSchema,
    venueIdSchema,
    listGamesSchema,
    createGameSchema,
    updateGameSchema,
    recordResultSchema,
    recordForfeitSchema,
    gameIdSchema,
} from '@/lib/game-schema';

import { adminProcedure, publicProcedure, t } from '@/utils/trpc-server';
import {
    listVenuesHandler,
    createVenueHandler,
    updateVenueHandler,
    deleteVenueHandler,
    listGamesHandler,
    createGameHandler,
    updateGameHandler,
    recordResultHandler,
    recordForfeitHandler,
    undoResultHandler,
    deleteGameHandler,
} from '@/lib/server/game-controller';

// Misma regla que el resto de la app: leer es público (cualquiera ve el rol y
// los marcadores) y escribir es solo para administradores.
//
// Los partidos tienen un endpoint por INTENCIÓN y no un solo "updateGame que
// hace todo": capturar un marcador, marcar un default, deshacer un resultado y
// reprogramar tienen reglas distintas (p. ej. uno finalizado acepta
// recordResult pero no updateGame). Separados, cada regla se lee en un lugar.
const gameRouter = t.router({
    // --- Lectura pública ---
    listVenues: publicProcedure.query(() => listVenuesHandler()),

    listGames: publicProcedure
        .input(listGamesSchema)
        .query(({ input }) => listGamesHandler({ input })),

    // --- Sedes ---
    createVenue: adminProcedure
        .input(createVenueSchema)
        .mutation(({ input }) => createVenueHandler({ input })),

    updateVenue: adminProcedure
        .input(updateVenueSchema)
        .mutation(({ input }) => updateVenueHandler({ input })),

    deleteVenue: adminProcedure
        .input(venueIdSchema)
        .mutation(({ input }) => deleteVenueHandler({ input })),

    // --- Partidos: el rol ---
    createGame: adminProcedure
        .input(createGameSchema)
        .mutation(({ input }) => createGameHandler({ input })),

    updateGame: adminProcedure
        .input(updateGameSchema)
        .mutation(({ input }) => updateGameHandler({ input })),

    deleteGame: adminProcedure
        .input(gameIdSchema)
        .mutation(({ input }) => deleteGameHandler({ input })),

    // --- Partidos: el resultado ---
    recordResult: adminProcedure
        .input(recordResultSchema)
        .mutation(({ input }) => recordResultHandler({ input })),

    recordForfeit: adminProcedure
        .input(recordForfeitSchema)
        .mutation(({ input }) => recordForfeitHandler({ input })),

    undoResult: adminProcedure
        .input(gameIdSchema)
        .mutation(({ input }) => undoResultHandler({ input })),
});

export default gameRouter;

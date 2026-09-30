import { getStandingsSchema } from '@/lib/standings-schema';

import { publicProcedure, t } from '@/utils/trpc-server';
import { listActiveStandingsHandler, getStandingsHandler } from '@/lib/server/standings-controller';

// La tabla de posiciones es SOLO lectura y pública: no hay nada que escribir,
// porque se calcula a partir de los partidos. Para cambiarla, se captura o
// corrige un marcador (game-route: recordResult, recordForfeit, undoResult).
const standingsRouter = t.router({
    // Todas las temporadas activas: /posiciones y el carrusel de la portada.
    listActiveStandings: publicProcedure.query(() => listActiveStandingsHandler()),

    // Una temporada (cualquier estado), opcionalmente una sola categoría: el
    // modal "Ver más" y la página de la temporada.
    getStandings: publicProcedure
        .input(getStandingsSchema)
        .query(({ input }) => getStandingsHandler({ input })),
});

export default standingsRouter;

import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/app/generated/prisma';
import { toTRPCError } from '@/lib/server/reglas-inscripcion';
import { calcularTablas } from '@/lib/tabla-ui';
import type { GetStandingsInput } from '@/lib/standings-schema';

// ---------------------------------------------------------------------------
// SELECTS: lo mínimo para calcular. Mismos tipos en lib/tabla-ui.ts.
// ---------------------------------------------------------------------------

/**
 * Una temporada con TODO lo que necesita su tabla:
 *   - sus inscripciones: se parte de ellas para que un equipo sin partidos
 *     aparezca con ceros;
 *   - solo los partidos que CUENTAN (regular + finalizado). Se filtran aquí,
 *     en la base, para no traer amistosos ni programados que calcularTablas
 *     descartaría de todos modos. (calcularTablas los vuelve a filtrar: así
 *     también sirve si le pasan la lista completa, como en la página de la
 *     temporada.)
 */
const temporadaConTablaSelect = {
    id: true,
    number: true,
    status: true,
    league: { select: { id: true, name: true, slug: true } },
    teamSeasons: {
        select: {
            id: true,
            category: true,
            team: { select: { id: true, name: true, logoUrl: true } },
        },
    },
    games: {
        where: { phase: 'regular' as const, status: 'finalizado' as const },
        select: {
            phase: true,
            status: true,
            homeScore: true,
            awayScore: true,
            homeTeamSeasonId: true,
            awayTeamSeasonId: true,
        },
    },
} as const;

// El tipo exacto de lo que devuelve Prisma con ese select (sin escribirlo a mano).
type TemporadaConTabla = Prisma.SeasonGetPayload<{ select: typeof temporadaConTablaSelect }>;

/**
 * De la fila de Prisma a la respuesta: los datos de la temporada + sus tablas.
 * Los partidos traen las llaves foráneas (homeTeamSeasonId); calcularTablas
 * espera la forma de Game ({ homeTeamSeason: { id } }), así que se adaptan.
 * Pedir las llaves directo es más barato que pedirle a Prisma la relación.
 */
const armarPosiciones = ({ teamSeasons, games, ...temporada }: TemporadaConTabla) => ({
    temporada,
    ...calcularTablas(
        teamSeasons,
        games.map((g) => ({
            phase: g.phase,
            status: g.status,
            homeScore: g.homeScore,
            awayScore: g.awayScore,
            homeTeamSeason: { id: g.homeTeamSeasonId },
            awayTeamSeason: { id: g.awayTeamSeasonId },
        })),
    ),
});

// ---------------------------------------------------------------------------
// HANDLERS (todos públicos)
// ---------------------------------------------------------------------------

/**
 * Las tablas de TODAS las temporadas activas, para /posiciones y el
 * carrusel de la portada. Como hay máximo una activa por liga, ordenar por
 * nombre de liga basta (orden alfabético, decisión de Abel).
 */
export const listActiveStandingsHandler = async () => {
    try {
        const seasons = await prisma.season.findMany({
            where: { status: 'activa' },
            select: temporadaConTablaSelect,
            orderBy: { league: { name: 'asc' } },
        });

        const temporadas = seasons.map(armarPosiciones);
        return { status: 'success', results: temporadas.length, data: { temporadas } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

/**
 * Las tablas de UNA temporada, de cualquier estado (el modal "Ver más").
 * Con `category`, solo esa tabla. `conEmpates` se calcula SIEMPRE con toda la
 * temporada, para que la columna E sea la misma que en /posiciones.
 * Si la categoría no tiene equipos inscritos, `tablas` llega vacía.
 */
export const getStandingsHandler = async ({ input }: { input: GetStandingsInput }) => {
    try {
        const season = await prisma.season.findUnique({
            where: { id: input.seasonId },
            select: temporadaConTablaSelect,
        });
        if (!season) throw new TRPCError({ code: 'NOT_FOUND', message: 'No existe esa temporada.' });

        const posiciones = armarPosiciones(season);
        const tablas = input.category
            ? posiciones.tablas.filter((t) => t.category === input.category)
            : posiciones.tablas;

        return { status: 'success', data: { ...posiciones, tablas } };
    } catch (err: unknown) {
        return toTRPCError(err);
    }
};

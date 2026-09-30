import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import type { GamePhase, GameStatus } from '@/lib/game-schema';

/**
 * La TABLA DE POSICIONES. No se guarda en la base: se CALCULA cada vez a
 * partir de los partidos. Así, capturar un partido olvidado de una jornada
 * vieja o corregir un marcador actualiza la tabla sola, sin contadores que
 * se desincronicen.
 *
 * Funciones puras, sin nada del servidor: las usan igual el controller
 * (lib/server/standings-controller.ts) que un page.tsx o un componente
 * 'use client'.
 *
 * Reglas de la liga (decididas por Abel, 24 y 30 de sept. de 2026):
 *
 *   - Una tabla = una CATEGORÍA de una TEMPORADA de una LIGA
 *     (ej. LDT VII varonil libre, SHADOWS III femenil libre).
 *   - Solo cuentan los partidos de temporada REGULAR ya FINALIZADOS. Un
 *     default cuenta como cualquier partido (36-0). Pretemporada, amistosos
 *     y playoffs no cuentan.
 *   - Puntos (PTS): ganado = +1, perdido = −1, empate = 0. O sea, G − P.
 *   - Orden:
 *       1. PTS            (más arriba el que tenga más)
 *       2. G              (con los mismos PTS, el que ganó más)
 *       3. E              (con los mismos G y P, el que empató más)
 *       4. DIF = PF − PC  (diferencia de puntos)
 *       5. PC             (mejor defensa: MENOS puntos en contra)
 *       6. Nombre         (alfabético, para que el orden nunca cambie al azar)
 *   - La columna E solo se muestra si en la TEMPORADA hubo al menos un
 *     empate (en cualquier categoría).
 */

// ---------------------------------------------------------------------------
// ENTRADAS
// ---------------------------------------------------------------------------

/**
 * Lo mínimo que necesita la tabla de una inscripción. El tipo TeamSeason de
 * season-ui.ts cumple con esto, y cualquier `select` de Prisma que traiga
 * estos campos también.
 */
export type InscripcionTabla = {
    id: string;
    category: TeamCategory;
    team: { id: string; name: string; logoUrl: string | null };
};

/**
 * Lo mínimo que necesita la tabla de un partido. El tipo Game de
 * game-ui.ts cumple con esto, así que la página de la temporada puede
 * pasarle directo la lista que ya tiene.
 */
export type PartidoTabla = {
    phase: GamePhase;
    status: GameStatus;
    homeScore: number | null;
    awayScore: number | null;
    homeTeamSeason: { id: string };
    awayTeamSeason: { id: string };
};

// ---------------------------------------------------------------------------
// SALIDAS
// ---------------------------------------------------------------------------

export type FilaTabla = {
    /** 1, 2, 3… ya ordenada. */
    posicion: number;
    teamSeasonId: string;
    team: InscripcionTabla['team'];
    /** PJ */
    jugados: number;
    /** G */
    ganados: number;
    /** P */
    perdidos: number;
    /** E */
    empatados: number;
    /** PF */
    puntosFavor: number;
    /** PC */
    puntosContra: number;
    /** DIF = PF − PC */
    diferencia: number;
    /** PTS = G − P */
    puntos: number;
};

export type TablaCategoria = {
    category: TeamCategory;
    filas: FilaTabla[];
};

export type TablasTemporada = {
    /**
     * ¿Hubo algún empate en la temporada? Si es false, la pantalla NO pinta
     * la columna E en ninguna de sus tablas.
     */
    conEmpates: boolean;
    /** Una por categoría con equipos inscritos, en el orden de teamCategories. */
    tablas: TablaCategoria[];
};

// ---------------------------------------------------------------------------
// CÁLCULO
// ---------------------------------------------------------------------------

/** ¿Este partido suma a la tabla? */
export const cuentaParaTabla = (p: PartidoTabla) =>
    p.phase === 'regular' && p.status === 'finalizado' && p.homeScore != null && p.awayScore != null;

/**
 * El comparador de la tabla. Devuelve negativo si `a` va ARRIBA de `b`.
 * Se exporta para poder probarlo solo.
 */
export const compararFilas = (a: FilaTabla, b: FilaTabla): number =>
    b.puntos - a.puntos ||
    b.ganados - a.ganados ||
    b.empatados - a.empatados ||
    b.diferencia - a.diferencia ||
    a.puntosContra - b.puntosContra ||
    a.team.name.localeCompare(b.team.name, 'es', { sensitivity: 'base' });

const filaEnCero = (inscripcion: InscripcionTabla): FilaTabla => ({
    posicion: 0,
    teamSeasonId: inscripcion.id,
    team: inscripcion.team,
    jugados: 0,
    ganados: 0,
    perdidos: 0,
    empatados: 0,
    puntosFavor: 0,
    puntosContra: 0,
    diferencia: 0,
    puntos: 0,
});

/** Suma a una fila un partido jugado con marcador `propios`–`rivales`. */
const sumarPartido = (fila: FilaTabla, propios: number, rivales: number) => {
    fila.jugados += 1;
    fila.puntosFavor += propios;
    fila.puntosContra += rivales;
    if (propios > rivales) fila.ganados += 1;
    else if (propios < rivales) fila.perdidos += 1;
    else fila.empatados += 1;
};

/**
 * Todas las tablas de UNA temporada.
 *
 * @param inscripciones TODAS las inscripciones de la temporada. Se parte de
 *   ellas (no de los partidos) para que un equipo que todavía no juega
 *   aparezca en la tabla con puros ceros.
 * @param partidos Los partidos de la temporada, de cualquier fase y estado:
 *   aquí se filtran los que cuentan.
 */
export const calcularTablas = (
    inscripciones: InscripcionTabla[],
    partidos: PartidoTabla[],
): TablasTemporada => {
    const filas = new Map<string, FilaTabla>();
    for (const inscripcion of inscripciones) filas.set(inscripcion.id, filaEnCero(inscripcion));

    let conEmpates = false;

    for (const partido of partidos) {
        if (!cuentaParaTabla(partido)) continue;
        const local = filas.get(partido.homeTeamSeason.id);
        const visitante = filas.get(partido.awayTeamSeason.id);
        // No debería pasar (el servidor valida que ambos lados sean de la
        // temporada), pero si llega un partido de otra temporada, se ignora
        // en vez de contarlo a medias.
        if (!local || !visitante) continue;

        // Los `!` son seguros: cuentaParaTabla ya revisó que no sean null.
        const golesLocal = partido.homeScore!;
        const golesVisitante = partido.awayScore!;
        sumarPartido(local, golesLocal, golesVisitante);
        sumarPartido(visitante, golesVisitante, golesLocal);
        if (golesLocal === golesVisitante) conEmpates = true;
    }

    const porCategoria = new Map<TeamCategory, FilaTabla[]>();
    for (const inscripcion of inscripciones) {
        const fila = filas.get(inscripcion.id)!;
        fila.diferencia = fila.puntosFavor - fila.puntosContra;
        fila.puntos = fila.ganados - fila.perdidos;
        const lista = porCategoria.get(inscripcion.category) ?? [];
        lista.push(fila);
        porCategoria.set(inscripcion.category, lista);
    }

    const tablas: TablaCategoria[] = [];
    for (const category of teamCategories) {
        const lista = porCategoria.get(category);
        if (!lista) continue;
        lista.sort(compararFilas);
        lista.forEach((fila, i) => (fila.posicion = i + 1));
        tablas.push({ category, filas: lista });
    }

    return { conEmpates, tablas };
};

/** "+84", "0", "−12" — la DIF y los PTS se leen mejor con signo. */
export const conSigno = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

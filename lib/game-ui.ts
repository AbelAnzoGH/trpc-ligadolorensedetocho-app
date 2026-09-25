import type { TeamCategory } from '@/lib/team-schema';
import type { GamePhase, GameStatus } from '@/lib/game-schema';
import type { TonoInsignia } from '@/components/ui/insignia';

/**
 * Piezas compartidas por las pantallas de partidos (el admin y la página
 * pública de la temporada). No importa nada del servidor.
 *
 * Los tipos describen exactamente lo que devuelve game-controller.ts:
 * si cambias un `select` de allá, actualiza esto también.
 */

// ---------------------------------------------------------------------------
// ETIQUETAS
// ---------------------------------------------------------------------------

export const etiquetaFase: Record<GamePhase, string> = {
    pretemporada: 'Pretemporada',
    amistoso: 'Amistoso',
    regular: 'Temporada regular',
    cuartos: 'Cuartos de final',
    semifinal: 'Semifinal',
    tercer_lugar: 'Tercer lugar',
    final: 'Final',
};

export const etiquetaEstadoPartido: Record<GameStatus, string> = {
    programado: 'Programado',
    finalizado: 'Final',
    suspendido: 'Suspendido',
};

/**
 * Tono de la <Insignia> de cada estado (design.md → Estados → tono de insignia).
 *   <Insignia tono={tonoEstadoPartido[p.status]}>{etiquetaEstadoPartido[p.status]}</Insignia>
 * "Programado" es lo normal y no merece color; "Final" ya lo dice el
 * marcador; solo "Suspendido" llama la atención.
 */
export const tonoEstadoPartido: Record<GameStatus, TonoInsignia> = {
    programado: 'contorno',
    finalizado: 'neutro',
    suspendido: 'peligro',
};

/** Un partido ganado por default lleva esta insignia además de su estado. */
export const tonoDefault: TonoInsignia = 'aviso';

/** @deprecated Diseño viejo. Usa `tonoEstadoPartido` con <Insignia>. Se borra al terminar la migración. */
export const claseEstadoPartido: Record<GameStatus, string> = {
    programado: 'border-yellow-500/40 text-yellow-300',
    finalizado: 'border-green-500/40 text-green-300',
    suspendido: 'border-red-500/40 text-red-300',
};

// ---------------------------------------------------------------------------
// FECHAS
// ---------------------------------------------------------------------------

/**
 * La base guarda la hora en UTC. En pantalla SIEMPRE se muestra la hora de
 * la liga, sin importar la zona del navegador de quien la vea.
 */
export const ZONA_LIGA = 'America/Mexico_City';

/**
 * La zona de la liga como desfase fijo. México eliminó el horario de verano
 * en 2022, así que la Ciudad de México es UTC-6 todo el año. Si algún día
 * vuelve el horario de verano, esto es lo único que hay que cambiar.
 */
const DESFASE_LIGA = '-06:00';

/** "sáb, 4 oct 2026, 10:00" — día, mes y año, en hora de la liga. */
export const formatoFechaPartido = (fecha: string | Date) =>
    new Intl.DateTimeFormat('es-MX', {
        timeZone: ZONA_LIGA,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date(fecha));

/** "sábado 4 de octubre de 2026" — para el encabezado de una jornada. */
export const formatoDiaPartido = (fecha: string | Date) =>
    new Intl.DateTimeFormat('es-MX', {
        timeZone: ZONA_LIGA,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(fecha));

/** "10:00" — cuando el día ya se dijo en el encabezado. */
export const formatoHoraPartido = (fecha: string | Date) =>
    new Intl.DateTimeFormat('es-MX', {
        timeZone: ZONA_LIGA,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date(fecha));

/**
 * Parte una fecha guardada (UTC) en dos textos, ya en hora de la liga:
 *   { fecha: "2026-10-04", hora: "10:00" }
 * Se arma pieza por pieza con formatToParts para no depender del idioma del
 * navegador (con format() a secas, el orden cambia según el país).
 */
export const separarFechaHora = (valor: string | Date) => {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_LIGA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(valor));
    const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? '';
    return { fecha: `${p('year')}-${p('month')}-${p('day')}`, hora: `${p('hour')}:${p('minute')}` };
};

/**
 * Al revés: fecha "2026-10-04" + hora "10:00" → texto ISO con zona
 * ("2026-10-04T10:00:00-06:00"). La hora que elige el admin se interpreta
 * SIEMPRE como hora de la liga, aunque abra la página desde otro país.
 */
export const unirFechaHora = (fecha: string, hora: string) => `${fecha}T${hora}:00${DESFASE_LIGA}`;

/** Solo el día ("2026-10-04") en hora de la liga: sirve para comparar días. */
export const diaDeLiga = (valor: string | Date) => separarFechaHora(valor).fecha;

// ---------------------------------------------------------------------------
// TIPOS DE RESPUESTA
// ---------------------------------------------------------------------------

export type Venue = {
    id: string;
    name: string;
    address: string | null;
    _count: { games: number };
};

export type ListVenuesResponse = { status: string; results: number; data: { venues: Venue[] } };
export type VenueResponse = { status: string; data: { venue: Venue } };

/** Un lado del partido: la inscripción con lo "de siempre" del equipo. */
export type LadoPartido = {
    id: string;
    category: TeamCategory;
    team: { id: string; name: string; logoUrl: string | null };
};

export type Game = {
    id: string;
    seasonId: string;
    phase: GamePhase;
    round: number | null;
    status: GameStatus;
    /** Texto ISO en UTC (trpc-fetch no convierte fechas). Usa formatoFechaPartido. */
    scheduledAt: string;
    field: number | null;
    homeScore: number | null;
    awayScore: number | null;
    isForfeit: boolean;
    notes: string | null;
    venue: { id: string; name: string; address: string | null };
    homeTeamSeason: LadoPartido;
    awayTeamSeason: LadoPartido;
};

export type ListGamesResponse = { status: string; results: number; data: { games: Game[] } };
export type GameResponse = { status: string; data: { game: Game } };

// ---------------------------------------------------------------------------
// AGRUPAR EL ROL
// ---------------------------------------------------------------------------

export type GrupoPartidos = {
    clave: string;
    titulo: string;
    partidos: Game[];
    /**
     * Si TODOS los partidos del grupo caen el mismo día, la fecha de uno de
     * ellos (para pintar "sábado 4 de octubre de 2026" una sola vez en el
     * encabezado). null si el grupo abarca varios días.
     */
    diaComun: string | null;
};

/**
 * Agrupa por jornada. Los partidos sin jornada (amistosos, pretemporada,
 * playoffs) van en un grupo por fase. Los grupos salen en el orden en que
 * aparece su primer partido; como el servidor ya los manda por fecha, el
 * rol queda cronológico sin ordenar nada más.
 */
export const agruparPorJornada = (partidos: Game[]): GrupoPartidos[] => {
    const grupos = new Map<string, GrupoPartidos>();

    for (const partido of partidos) {
        const clave = partido.round != null ? `jornada-${partido.round}` : `fase-${partido.phase}`;
        const titulo = partido.round != null ? `Jornada ${partido.round}` : etiquetaFase[partido.phase];

        const grupo = grupos.get(clave) ?? { clave, titulo, partidos: [], diaComun: null };
        grupo.partidos.push(partido);
        grupos.set(clave, grupo);
    }

    for (const grupo of grupos.values()) {
        const dias = new Set(grupo.partidos.map((p) => diaDeLiga(p.scheduledAt)));
        grupo.diaComun = dias.size === 1 ? grupo.partidos[0].scheduledAt : null;
    }

    return [...grupos.values()];
};

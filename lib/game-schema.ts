import * as z from "zod";
import { teamCategorySchema } from "@/lib/team-schema";

/**
 * Validación de PARTIDOS y SEDES.
 *
 * Jerarquía:  Season ──1:N──> Game <──N:1── Venue
 *             Game ──> homeTeamSeason / awayTeamSeason (dos inscripciones)
 *
 * Aquí vive lo que se puede revisar mirando SOLO lo que llega. Las reglas que
 * necesitan consultar la base (que los dos equipos sean de la temporada y de
 * la misma categoría, que la temporada no esté cerrada...) viven en
 * lib/server/game-controller.ts.
 */

/** Marcador de un partido ganado por default: el que llegó 36, el ausente 0. */
export const PUNTOS_DEFAULT = 36;

// Si se agrega una fase o un estado, va aquí Y en el enum de prisma/schema.prisma.
export const gamePhases = [
    "pretemporada",
    "amistoso",
    "regular",
    "cuartos",
    "semifinal",
    "tercer_lugar",
    "final",
] as const;

export const gamePhaseSchema = z.enum(gamePhases, { error: "La fase del partido no es válida" });

export const gameStatuses = ["programado", "finalizado", "suspendido"] as const;

export const gameStatusSchema = z.enum(gameStatuses, { error: "El estado del partido no es válido" });

const idSchema = (que: string) =>
    z.string({ error: `El id ${que} es requerido` }).min(1, { error: `El id ${que} es requerido` });

/**
 * Fecha y hora del partido.
 *
 * OJO: utils/trpc-fetch.ts manda JSON plano, SIN los metadatos de SuperJSON.
 * Un Date que sale del navegador llega aquí como TEXTO ("2026-10-03T16:00:00.000Z").
 * Por eso se acepta un Date (si llama el servidor, p. ej. createAsyncCaller)
 * o un texto ISO con zona horaria, y siempre se entrega un Date al controlador.
 */
const fechaHoraSchema = z
    .union([z.date(), z.iso.datetime({ offset: true })], {
        error: "La fecha y hora del partido son requeridas",
    })
    .transform((valor) => (valor instanceof Date ? valor : new Date(valor)));

const jornadaSchema = z
    .number({ error: "La jornada debe ser un número" })
    .int({ error: "La jornada debe ser un número entero" })
    .min(1, { error: "La jornada empieza en 1" })
    .max(99, { error: "Jornada demasiado grande" });

const campoSchema = z
    .number({ error: "El campo debe ser un número" })
    .int({ error: "El campo debe ser un número entero" })
    .min(1, { error: "El campo empieza en 1" })
    .max(99, { error: "Número de campo demasiado grande" });

const notasSchema = z.string().trim().max(500, { error: "Las notas no pueden pasar de 500 caracteres" });

const marcadorSchema = (equipo: string) =>
    z
        .number({ error: `El marcador ${equipo} es requerido` })
        .int({ error: `El marcador ${equipo} debe ser un número entero` })
        .min(0, { error: `El marcador ${equipo} no puede ser negativo` })
        .max(999, { error: `Marcador ${equipo} demasiado grande` });

// ---------------------------------------------------------------------------
// SEDES
// ---------------------------------------------------------------------------

export const createVenueSchema = z.object({
    name: z
        .string({ error: "El nombre de la sede es requerido" })
        .trim()
        .min(1, { error: "El nombre de la sede es requerido" })
        .max(255, { error: "El nombre no puede tener más de 255 caracteres" }),
    address: z.string().trim().max(500, { error: "La dirección es demasiado larga" }).nullable().optional(),
});

export const updateVenueSchema = z.object({
    id: idSchema("de la sede"),
    name: createVenueSchema.shape.name.optional(),
    address: createVenueSchema.shape.address,
});

export const venueIdSchema = z.object({ id: idSchema("de la sede") });

// ---------------------------------------------------------------------------
// PARTIDOS
// ---------------------------------------------------------------------------

// Filtros del listado. La temporada es obligatoria: "todos los partidos de
// todas las ligas" no lo pide ninguna pantalla.
export const listGamesSchema = z.object({
    seasonId: idSchema("de la temporada"),
    category: teamCategorySchema.optional(),
    round: jornadaSchema.optional(),
    phase: gamePhaseSchema.optional(),
    /** Los partidos de UNA inscripción, sea local o visitante. */
    teamSeasonId: z.string().min(1).optional(),
});

// Nace siempre 'programado' y sin marcador: el resultado se captura después
// con recordResult o recordForfeit. Por eso aquí no hay status ni marcadores.
export const createGameSchema = z
    .object({
        seasonId: idSchema("de la temporada"),
        homeTeamSeasonId: idSchema("del equipo local"),
        awayTeamSeasonId: idSchema("del equipo visitante"),
        phase: gamePhaseSchema.default("regular"),
        round: jornadaSchema.nullable().optional(),
        scheduledAt: fechaHoraSchema,
        venueId: idSchema("de la sede"),
        field: campoSchema.nullable().optional(),
        notes: notasSchema.nullable().optional(),
    })
    // Estas dos se pueden revisar sin base de datos, así que van aquí: el
    // error sale antes y marcado en el campo correcto (path).
    .refine((g) => g.homeTeamSeasonId !== g.awayTeamSeasonId, {
        error: "Un equipo no puede jugar contra sí mismo",
        path: ["awayTeamSeasonId"],
    })
    .refine((g) => g.phase !== "regular" || g.round != null, {
        error: "Un partido de temporada regular necesita jornada",
        path: ["round"],
    });

// Todo opcional salvo el id. Las dos reglas de arriba NO se pueden revisar
// aquí: si solo llega `phase: 'regular'`, la jornada puede estar ya guardada.
// El controlador las revisa con los valores FINALES (lo guardado + lo nuevo).
//
// El estado solo puede ir a 'programado' o 'suspendido': a 'finalizado' se
// llega con recordResult / recordForfeit, que exigen marcador.
export const updateGameSchema = z.object({
    id: idSchema("del partido"),
    homeTeamSeasonId: idSchema("del equipo local").optional(),
    awayTeamSeasonId: idSchema("del equipo visitante").optional(),
    phase: gamePhaseSchema.optional(),
    round: jornadaSchema.nullable().optional(),
    scheduledAt: fechaHoraSchema.optional(),
    venueId: idSchema("de la sede").optional(),
    field: campoSchema.nullable().optional(),
    notes: notasSchema.nullable().optional(),
    status: z.enum(["programado", "suspendido"], {
        error: "Para finalizar un partido captura su marcador",
    }).optional(),
});

export const recordResultSchema = z.object({
    id: idSchema("del partido"),
    homeScore: marcadorSchema("local"),
    awayScore: marcadorSchema("visitante"),
});

export const recordForfeitSchema = z.object({
    id: idSchema("del partido"),
    /** La inscripción que NO se presentó: pierde 0 a 36. */
    absentTeamSeasonId: idSchema("del equipo ausente"),
});

// Para deleteGame y undoResult: solo necesitan el id.
export const gameIdSchema = z.object({ id: idSchema("del partido") });

export type GamePhase = z.TypeOf<typeof gamePhaseSchema>;
export type GameStatus = z.TypeOf<typeof gameStatusSchema>;
export type CreateVenueInput = z.TypeOf<typeof createVenueSchema>;
export type UpdateVenueInput = z.TypeOf<typeof updateVenueSchema>;
export type VenueIdInput = z.TypeOf<typeof venueIdSchema>;
export type ListGamesInput = z.TypeOf<typeof listGamesSchema>;
export type CreateGameInput = z.TypeOf<typeof createGameSchema>;
export type UpdateGameInput = z.TypeOf<typeof updateGameSchema>;
export type RecordResultInput = z.TypeOf<typeof recordResultSchema>;
export type RecordForfeitInput = z.TypeOf<typeof recordForfeitSchema>;
export type GameIdInput = z.TypeOf<typeof gameIdSchema>;

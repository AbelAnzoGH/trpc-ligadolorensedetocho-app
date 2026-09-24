import * as z from "zod";
import { teamCategories, teamCategorySchema } from "@/lib/team-schema";

/**
 * Validación de todo lo que tiene que ver con LIGAS, TEMPORADAS e
 * INSCRIPCIONES (un equipo jugando una temporada en una categoría).
 *
 * Jerarquía:  League ──1:N──> Season ──1:N──> TeamSeason ──1:N──> TeamMembership
 */

// Los estados de una temporada. Si se agrega uno, va aquí Y en el enum
// SeasonStatusEnumType de prisma/schema.prisma (más una migración).
export const seasonStatuses = ["inscripciones", "activa", "cerrada"] as const;

export const seasonStatusSchema = z.enum(seasonStatuses, {
    error: "El estado debe ser inscripciones, activa o cerrada",
});

const idSchema = (que: string) =>
    z.string({ error: `El id ${que} es requerido` }).min(1, { error: `El id ${que} es requerido` });

// ---------------------------------------------------------------------------
// LIGAS
// ---------------------------------------------------------------------------

export const createLeagueSchema = z.object({
    name: z
        .string({ error: "El nombre de la liga es requerido" })
        .trim()
        .min(1, { error: "El nombre de la liga es requerido" })
        .max(255, { error: "El nombre no puede tener más de 255 caracteres" }),

    // El slug va en la URL (/ligas/shadows), así que se restringe a lo que
    // se lee bien en una dirección: minúsculas, números y guiones.
    // Lo escribe el admin a propósito: así puede cambiar el nombre bonito
    // de la liga sin romper los enlaces que ya se compartieron.
    slug: z
        .string({ error: "El slug es requerido" })
        .trim()
        .toLowerCase()
        .min(1, { error: "El slug es requerido" })
        .max(60, { error: "El slug no puede tener más de 60 caracteres" })
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
            error: "El slug solo puede llevar minúsculas, números y guiones (ej. ldt-shadows)",
        }),
});

export const updateLeagueSchema = z.object({
    id: idSchema("de la liga"),
    name: createLeagueSchema.shape.name.optional(),
    slug: createLeagueSchema.shape.slug.optional(),
});

// ---------------------------------------------------------------------------
// TEMPORADAS
// ---------------------------------------------------------------------------

// Las categorías que se juegan en una temporada. El transform hace dos cosas
// de una vez: quita repetidos (si llegara ["mixto", "mixto"]) y las deja en el
// orden oficial de teamCategories, sin importar en qué orden se marcaron.
const seasonCategoriesSchema = z
    .array(teamCategorySchema, { error: "Las categorías deben ser una lista" })
    .min(1, { error: "Elige al menos una categoría para la temporada" })
    .transform((elegidas) => teamCategories.filter((c) => elegidas.includes(c)));

export const createSeasonSchema = z.object({
    leagueId: idSchema("de la liga"),

    number: z
        .number({ error: "El número de temporada es requerido" })
        .int({ error: "El número de temporada debe ser un entero" })
        .min(1, { error: "El número de temporada empieza en 1" })
        .max(3999, { error: "Número de temporada demasiado grande" }), // límite de los romanos

    // Por defecto nace en 'inscripciones': se puede preparar sin volverse la activa.
    status: seasonStatusSchema.optional(),

    // Obligatorias al crear: el admin decide qué categorías se juegan.
    categories: seasonCategoriesSchema,

    // z.date() funciona porque tRPC usa SuperJSON: las fechas viajan como Date.
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
});

export const updateSeasonSchema = z.object({
    id: idSchema("de la temporada"),
    // El número y la liga NO se editan: definen la identidad de la temporada
    // (y su URL). Si se capturó mal, se borra (vacía) y se crea otra.
    status: seasonStatusSchema.optional(),
    // La lista COMPLETA de categorías que quedan (no "agrega esta"): lo que
    // falte respecto a la actual se quita, y el servidor revisa que lo que se
    // quita no tenga equipos inscritos.
    categories: seasonCategoriesSchema.optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
});

export const seasonIdSchema = z.object({ id: idSchema("de la temporada") });

// Lo que llega desde la URL /ligas/<slug>/<numero>.
export const seasonBySlugSchema = z.object({
    leagueSlug: z.string().trim().min(1),
    number: z.number().int().min(1),
});

// ---------------------------------------------------------------------------
// INSCRIPCIONES (TeamSeason)
// ---------------------------------------------------------------------------

// Dos usos:
//   { seasonId }  → los equipos inscritos en una temporada (lo normal)
//   { teamId }    → el historial de un equipo: todas sus inscripciones
//                   (lo usa "copiar plantilla" para elegir de dónde copiar)
// Al menos uno de los dos: sin filtro sería la historia completa de la liga.
export const listTeamSeasonsSchema = z
    .object({
        seasonId: z.string().min(1).optional(),
        teamId: z.string().min(1).optional(),
        category: teamCategorySchema.optional(),
    })
    .refine((v) => v.seasonId || v.teamId, {
        error: "Indica la temporada o el equipo",
    });

export const enrollTeamSchema = z.object({
    seasonId: idSchema("de la temporada"),
    teamId: idSchema("del equipo"),
    category: teamCategorySchema,
});

const statSchema = (etiqueta: string) =>
    z
        .number({ error: `${etiqueta} debe ser un número` })
        .int({ error: `${etiqueta} debe ser un número entero` })
        .min(0, { error: `${etiqueta} no puede ser negativo` });

export const updateTeamSeasonSchema = z.object({
    id: idSchema("de la inscripción"),
    category: teamCategorySchema.optional(),

    gamesPlayed: statSchema("Los partidos jugados").optional(),
    wins: statSchema("Los ganados").optional(),
    losses: statSchema("Los perdidos").optional(),
    ties: statSchema("Los empates").optional(),
    pointsFor: statSchema("Los puntos a favor").optional(),
    pointsAgainst: statSchema("Los puntos en contra").optional(),
});

export const teamSeasonIdSchema = z.object({ id: idSchema("de la inscripción") });

// "Copia quién es, nunca cómo le fue": trae a las personas, su número y sus
// posiciones, pero las estadísticas nacen en cero y la foto vacía.
export const copyRosterSchema = z
    .object({
        fromTeamSeasonId: idSchema("de la inscripción de origen"),
        toTeamSeasonId: idSchema("de la inscripción de destino"),
    })
    .refine((v) => v.fromTeamSeasonId !== v.toTeamSeasonId, {
        error: "El origen y el destino no pueden ser la misma inscripción",
    });

export type SeasonStatus = z.TypeOf<typeof seasonStatusSchema>;
export type CreateLeagueInput = z.TypeOf<typeof createLeagueSchema>;
export type UpdateLeagueInput = z.TypeOf<typeof updateLeagueSchema>;
export type CreateSeasonInput = z.TypeOf<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.TypeOf<typeof updateSeasonSchema>;
export type SeasonIdInput = z.TypeOf<typeof seasonIdSchema>;
export type SeasonBySlugInput = z.TypeOf<typeof seasonBySlugSchema>;
export type ListTeamSeasonsInput = z.TypeOf<typeof listTeamSeasonsSchema>;
export type EnrollTeamInput = z.TypeOf<typeof enrollTeamSchema>;
export type UpdateTeamSeasonInput = z.TypeOf<typeof updateTeamSeasonSchema>;
export type TeamSeasonIdInput = z.TypeOf<typeof teamSeasonIdSchema>;
export type CopyRosterInput = z.TypeOf<typeof copyRosterSchema>;

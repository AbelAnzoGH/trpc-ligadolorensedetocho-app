import * as z from "zod";
import { teamCategorySchema } from "@/lib/team-schema";

/**
 * Validación de la TABLA DE POSICIONES.
 *
 * La tabla no se guarda (se calcula con lib/tabla-ui.ts), así que aquí solo
 * hay entradas de LECTURA. No existe nada que crear ni editar: para cambiar
 * la tabla se captura o corrige el marcador de un partido.
 */

/** Las tablas de UNA temporada: todas sus categorías, o solo una. */
export const getStandingsSchema = z.object({
    seasonId: z
        .string({ error: "El id de la temporada es requerido" })
        .min(1, { error: "El id de la temporada es requerido" }),
    category: teamCategorySchema.optional(),
});

export type GetStandingsInput = z.TypeOf<typeof getStandingsSchema>;

import * as z from "zod";

// Las categorías válidas. Si el día de mañana se agrega una nueva
// (por ejemplo "infantil"), se agrega aquí Y en el enum de prisma/schema.prisma.
// Van en el MISMO orden que el enum de Postgres: así los selects y las
// casillas de la pantalla salen en el orden en que la base las ordena.
// Qué categorías se juegan en cada temporada lo decide Season.categories.
export const teamCategories = [
  "femenil_libre",
  "varonil_libre",
  "mixto",
  "femenil_u16",
  "mixto_u18",
] as const;

export const teamCategorySchema = z.enum(teamCategories, {
  error: "La categoría no es válida",
});

/**
 * Dirección de una imagen ya subida.
 *
 * El cliente manda TEXTO, no el archivo: el archivo ya viajó antes por
 * /api/upload. Y como cualquiera puede mandar el texto que quiera, se
 * restringe a las dos formas legítimas: una ruta local de /uploads/ o una
 * URL https (que es como se verá cuando el almacenamiento sea remoto).
 */
const rutaImagenSchema = z
  .string()
  .trim()
  .max(500, { error: "La dirección de la imagen es demasiado larga" })
  .refine((valor) => valor.startsWith("/uploads/") || valor.startsWith("https://"), {
    error: "La dirección de la imagen no es válida",
  });

const claveImagenSchema = z
  .string()
  .trim()
  .max(500)
  .refine((valor) => !valor.includes(".."), { error: "Clave de imagen no válida" });

export const createTeamSchema = z.object({
  name: z
    .string({ error: "El nombre del equipo es requerido" })
    .min(1, { error: "El nombre del equipo es requerido" })
    .max(255, { error: "El nombre no puede tener más de 255 caracteres" })
    .trim(),

  // El logo es opcional: un equipo puede crearse sin él y agregarlo después.
  logoUrl: rutaImagenSchema.optional(),
  logoKey: claveImagenSchema.optional(),

  // La categoría YA NO es del equipo: es de su inscripción en una temporada.
  // Como atajo, al crear un equipo nuevo se puede inscribir de una vez.
  // Si no viene, el equipo existe en la liga pero no juega ninguna temporada.
  inscripcion: z
    .object({
      seasonId: z.string().min(1, { error: "Elige la temporada" }),
      category: teamCategorySchema,
    })
    .optional(),
});

// Para actualizar: el id siempre es obligatorio, pero los demás campos
// son opcionales. La categoría ya no está aquí: se cambia en la inscripción.
export const updateTeamSchema = z.object({
  id: z.string({ error: "El id del equipo es requerido" }).min(1, { error: "El id del equipo es requerido" }),
  name: createTeamSchema.shape.name.optional(),

  // Aquí hay TRES situaciones distintas y por eso es `.nullable().optional()`:
  //   campo ausente (undefined) → no toques el logo
  //   campo con texto           → reemplaza el logo (y borra el archivo viejo)
  //   campo en null             → quita el logo
  logoUrl: rutaImagenSchema.nullable().optional(),
  logoKey: claveImagenSchema.nullable().optional(),
});

// Se usa tanto para getTeam como para deleteTeam: ambos solo necesitan el id.
export const teamIdSchema = z.object({
  id: z.string({ error: "El id del equipo es requerido" }).min(1, { error: "El id del equipo es requerido" }),
});

// listTeams devuelve los equipos como IDENTIDADES permanentes (nombre y
// logo), sin temporada. Para "los equipos de LDT VII" se usa
// listTeamSeasons({ seasonId }). Todo el objeto es opcional para poder
// llamarlo sin mandar nada.
export const listTeamsSchema = z
  .object({
    search: z.string().trim().min(1).optional(),
  })
  .optional();

export type TeamCategory = z.TypeOf<typeof teamCategorySchema>;
export type CreateTeamInput = z.TypeOf<typeof createTeamSchema>;
export type UpdateTeamInput = z.TypeOf<typeof updateTeamSchema>;
export type TeamIdInput = z.TypeOf<typeof teamIdSchema>;
export type ListTeamsInput = z.TypeOf<typeof listTeamsSchema>;

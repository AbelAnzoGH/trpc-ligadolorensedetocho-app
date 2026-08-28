import * as z from "zod";

// Las posiciones válidas. Si la liga usa otra, se agrega aquí Y en el enum
// PlayerPositionEnumType de prisma/schema.prisma (más una migración).
export const playerPositions = [
    "QB", "C", "WR", "RB", "FL", "RU", "LB", "CB", "S", "DB",
] as const;

export const playerPositionSchema = z.enum(playerPositions, {
    error: "Posición no válida",
});

// ---------------------------------------------------------------------------
// LA PERSONA
// ---------------------------------------------------------------------------

export const createPlayerSchema = z.object({
    name: z
        .string({ error: "El nombre es requerido" })
        .min(1, { error: "El nombre es requerido" })
        .max(255, { error: "El nombre no puede tener más de 255 caracteres" })
        .trim(),

    lastName: z
        .string({ error: "El apellido es requerido" })
        .min(1, { error: "El apellido es requerido" })
        .max(255, { error: "El apellido no puede tener más de 255 caracteres" })
        .trim(),

    // .int() rechaza 17.5; los rangos evitan capturas absurdas por dedazo.
    age: z
        .number({ error: "La edad es requerida" })
        .int({ error: "La edad debe ser un número entero" })
        .min(5, { error: "La edad mínima es 5 años" })
        .max(99, { error: "La edad máxima es 99 años" }),

    height: z
        .number({ error: "La altura es requerida" })
        .int({ error: "La altura debe ser un número entero de centímetros" })
        .min(100, { error: "La altura mínima es 100 cm" })
        .max(250, { error: "La altura máxima es 250 cm" }),
});

export const updatePlayerSchema = z.object({
    id: z.string({ error: "El id del jugador es requerido" }).min(1, { error: "El id del jugador es requerido" }),
    name: createPlayerSchema.shape.name.optional(),
    lastName: createPlayerSchema.shape.lastName.optional(),
    age: createPlayerSchema.shape.age.optional(),
    height: createPlayerSchema.shape.height.optional(),
});

export const playerIdSchema = z.object({
    id: z.string({ error: "El id del jugador es requerido" }).min(1, { error: "El id del jugador es requerido" }),
});

export const listPlayersSchema = z
    .object({
        teamId: z.string().min(1).optional(),
    })
    .optional();

// ---------------------------------------------------------------------------
// LA MEMBRESÍA (la persona jugando en UN equipo)
// ---------------------------------------------------------------------------

const statSchema = (etiqueta: string) =>
    z
        .number({ error: `${etiqueta} debe ser un número` })
        .int({ error: `${etiqueta} debe ser un número entero` })
        .min(0, { error: `${etiqueta} no puede ser negativo` });

/**
 * Mismas reglas que para el logo de equipos: lo que viaja es TEXTO (la
 * dirección de una imagen que ya se subió por /api/upload), y se restringe
 * a las dos formas legítimas para que nadie meta una dirección arbitraria.
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

export const createMembershipSchema = z.object({
    playerId: z.string({ error: "El id del jugador es requerido" }).min(1, { error: "El id del jugador es requerido" }),
    teamId: z.string({ error: "El id del equipo es requerido" }).min(1, { error: "El id del equipo es requerido" }),

    jerseyNumber: z
        .number({ error: "El número de jersey es requerido" })
        .int({ error: "El número de jersey debe ser un entero" })
        .min(0, { error: "El número de jersey no puede ser negativo" })
        .max(99, { error: "El número de jersey máximo es 99" }),

    // Un jugador puede cubrir varias posiciones, pero al menos una.
    positions: z
        .array(playerPositionSchema)
        .min(1, { error: "Selecciona al menos una posición" }),

    // La foto es opcional: se puede dar de alta al jugador y agregarla después.
    photoUrl: rutaImagenSchema.optional(),
    photoKey: claveImagenSchema.optional(),
});

export const updateMembershipSchema = z.object({
    id: z.string({ error: "El id de la membresía es requerido" }).min(1, { error: "El id de la membresía es requerido" }),

    jerseyNumber: createMembershipSchema.shape.jerseyNumber.optional(),
    positions: createMembershipSchema.shape.positions.optional(),

    touchdowns: statSchema("Los touchdowns").optional(),
    interceptions: statSchema("Las intercepciones").optional(),
    touchdownPasses: statSchema("Los pases de touchdown").optional(),
    safeties: statSchema("Los safeties").optional(),
    gamesPlayed: statSchema("Los partidos jugados").optional(),

    availableForPlayoffs: z.boolean().optional(),

    // Igual que el logo del equipo, aquí hay TRES casos distintos:
    //   ausente (undefined) → no toques la foto
    //   con texto           → reemplázala (y borra el archivo viejo)
    //   null                → quítala
    photoUrl: rutaImagenSchema.nullable().optional(),
    photoKey: claveImagenSchema.nullable().optional(),
});

export const membershipIdSchema = z.object({
    id: z.string({ error: "El id de la membresía es requerido" }).min(1, { error: "El id de la membresía es requerido" }),
});

// ---------------------------------------------------------------------------
// EL LISTADO PÚBLICO
// ---------------------------------------------------------------------------

/**
 * Filtros del listado de /jugadores.
 *
 * Ojo con la unidad: aquí NO listamos personas, listamos membresías
 * (una persona jugando en un equipo). Es a propósito: filtrar por equipo,
 * por número o por posición solo tiene sentido sobre la membresía, porque
 * el mismo Juan puede ser el #7 receptor en varonil y el #23 safety en mixto.
 */
export const listMembershipsSchema = z
    .object({
        teamId: z.string().min(1).optional(),
        position: playerPositionSchema.optional(),

        jerseyNumber: z
            .number()
            .int({ error: "El número de jersey debe ser un entero" })
            .min(0, { error: "El número de jersey no puede ser negativo" })
            .max(99, { error: "El número de jersey máximo es 99" })
            .optional(),

        // Búsqueda por nombre o apellido, sin distinguir mayúsculas.
        search: z.string().trim().min(1).optional(),

        // Orden alfabético por apellido y luego nombre.
        order: z.enum(["asc", "desc"]).optional(),

        // Preparado para el futuro botón de "cargar más": el cliente pide
        // los primeros N, y luego los siguientes N saltándose los que ya tiene.
        take: z.number().int().min(1).max(200).optional(),
        skip: z.number().int().min(0).optional(),
    })
    .optional();

export type ListMembershipsInput = z.TypeOf<typeof listMembershipsSchema>;

export type PlayerPosition = z.TypeOf<typeof playerPositionSchema>;
export type CreatePlayerInput = z.TypeOf<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.TypeOf<typeof updatePlayerSchema>;
export type PlayerIdInput = z.TypeOf<typeof playerIdSchema>;
export type ListPlayersInput = z.TypeOf<typeof listPlayersSchema>;
export type CreateMembershipInput = z.TypeOf<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.TypeOf<typeof updateMembershipSchema>;
export type MembershipIdInput = z.TypeOf<typeof membershipIdSchema>;

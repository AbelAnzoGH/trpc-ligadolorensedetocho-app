-- Categorías por temporada.
--
-- ESCRITA A MANO. Lo que Prisma generó con --create-only creaba un tipo
-- nuevo y convertía cada fila con `category::text::nuevo_tipo`: las filas con
-- 'varonil' o 'femenil' no tienen a qué convertirse y la migración fallaba
-- (además tocaba seasons.categories antes de crear esa columna).
-- Prisma no puede distinguir "renombrar un valor" de "borrar uno y crear
-- otro", así que eso se escribe a mano.

-- 1) Renombrar DENTRO del mismo tipo: las filas existentes conservan su dato
--    y pasan a leerse con el nombre nuevo.
ALTER TYPE "TeamCategoryEnumType" RENAME VALUE 'femenil' TO 'femenil_libre';
ALTER TYPE "TeamCategoryEnumType" RENAME VALUE 'varonil' TO 'varonil_libre';

-- 2) Las categorías nuevas. ADD VALUE siempre las pone al FINAL del enum; por
--    eso schema.prisma las declara en este mismo orden.
ALTER TYPE "TeamCategoryEnumType" ADD VALUE 'femenil_u16';
ALTER TYPE "TeamCategoryEnumType" ADD VALUE 'mixto_u18';

-- 3) Las categorías que se juegan en cada temporada (línea tal cual la generó Prisma).
ALTER TABLE "seasons" ADD COLUMN     "categories" "TeamCategoryEnumType"[] DEFAULT ARRAY[]::"TeamCategoryEnumType"[];

-- 4) Relleno: cada temporada existente recibe las categorías que YA usan sus
--    inscripciones. Solo toca valores viejos o renombrados: Postgres no deja
--    usar un valor agregado con ADD VALUE en la misma transacción que lo creó.
--    Las temporadas sin inscripciones quedan con '{}' y el admin elige.
UPDATE "seasons" s
SET "categories" = sub.cats
FROM (
    SELECT "seasonId", array_agg(DISTINCT "category" ORDER BY "category") AS cats
    FROM "team_seasons"
    GROUP BY "seasonId"
) sub
WHERE s."id" = sub."seasonId";

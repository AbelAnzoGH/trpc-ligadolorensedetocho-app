-- ═══════════════════════════════════════════════════════════════════════
-- Migración: ligas y temporadas (Camino B)
--
-- Escrita A MANO a partir del esquema, no generada con `migrate dev`,
-- porque Prisma solo sabe cambiar ESTRUCTURA: si la hubiera generado él,
-- habría borrado team_memberships."teamId" (a qué equipo pertenece cada
-- jugador) antes de que pudiéramos copiar ese dato a la columna nueva.
--
-- Forma: AMPLIAR → RELLENAR → RECORTAR.
-- Prisma corre todo el archivo en UNA transacción: si cualquier línea
-- falla, la base queda exactamente como estaba. No existe "a medias".
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- FASE 1 · AMPLIAR — crear lo nuevo sin tocar nada de lo viejo
-- ═══════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "SeasonStatusEnumType" AS ENUM ('inscripciones', 'activa', 'cerrada');

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "SeasonStatusEnumType" NOT NULL DEFAULT 'inscripciones',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_seasons" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "TeamCategoryEnumType" NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_slug_key" ON "leagues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_leagueId_number_key" ON "seasons"("leagueId", "number");

-- CreateIndex
CREATE INDEX "team_seasons_teamId_idx" ON "team_seasons"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_seasons_seasonId_teamId_category_key" ON "team_seasons"("seasonId", "teamId", "category");

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- La columna nueva nace NULLABLE a propósito: las membresías que ya existen
-- todavía no tienen a dónde apuntar. Se vuelve NOT NULL en la fase 3.
ALTER TABLE "team_memberships" ADD COLUMN "teamSeasonId" TEXT;


-- ═══════════════════════════════════════════════════════════════════════
-- FASE 2 · RELLENAR — mover los datos existentes a la forma nueva
-- ═══════════════════════════════════════════════════════════════════════
-- Recordatorio: @default(uuid()) y @updatedAt los pone el CLIENTE de Prisma,
-- no la base. En SQL crudo hay que dar "id" y "updatedAt" explícitamente.

-- 2.1 · La liga y la temporada que contienen todo lo que ya existe.
-- UUIDs fijos escritos a mano: así los pasos siguientes pueden referirse
-- a ellos sin subconsultas. En una migración esto es legítimo.
INSERT INTO "leagues" ("id", "name", "slug", "updatedAt")
VALUES ('00000000-0000-4000-8000-000000000001', 'LDT', 'ldt', CURRENT_TIMESTAMP);

INSERT INTO "seasons" ("id", "leagueId", "number", "status", "updatedAt")
VALUES ('00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', 7, 'activa', CURRENT_TIMESTAMP);

-- 2.2 · Cada equipo actual se inscribe en LDT VII, llevándose su categoría.
-- (Esto DEBE ir antes de borrar teams."category" en la fase 3.)
INSERT INTO "team_seasons" ("id", "seasonId", "teamId", "category", "updatedAt")
SELECT gen_random_uuid()::text,
       '00000000-0000-4000-8000-000000000007',
       t."id",
       t."category",
       CURRENT_TIMESTAMP
FROM "teams" t;

-- 2.3 · Cada membresía apunta a la inscripción de su equipo.
-- Hoy cada equipo tiene exactamente UNA inscripción, así que el cruce es 1 a 1.
UPDATE "team_memberships" tm
SET "teamSeasonId" = ts."id"
FROM "team_seasons" ts
WHERE ts."teamId" = tm."teamId";

-- 2.4 · Verificación dentro de la misma transacción: si algo no cuadra,
-- RAISE EXCEPTION aborta TODA la migración y la base no cambia.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "team_memberships" WHERE "teamSeasonId" IS NULL) THEN
    RAISE EXCEPTION 'Migración abortada: hay membresías sin inscripción';
  END IF;
  IF (SELECT COUNT(*) FROM "teams") <> (SELECT COUNT(*) FROM "team_seasons") THEN
    RAISE EXCEPTION 'Migración abortada: no todos los equipos quedaron inscritos';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- FASE 3 · RECORTAR — quitar lo viejo y apretar las reglas
-- ═══════════════════════════════════════════════════════════════════════

-- a) Ya todas tienen valor: ahora sí es obligatoria.
ALTER TABLE "team_memberships" ALTER COLUMN "teamSeasonId" SET NOT NULL;

-- b) Fuera la llave foránea y los únicos viejos (dependen de "teamId").
ALTER TABLE "team_memberships" DROP CONSTRAINT "team_memberships_teamId_fkey";
DROP INDEX "team_memberships_playerId_teamId_key";
DROP INDEX "team_memberships_teamId_jerseyNumber_key";

-- c) Fuera la columna vieja.
ALTER TABLE "team_memberships" DROP COLUMN "teamId";

-- d) Los únicos nuevos, ahora por inscripción.
CREATE UNIQUE INDEX "team_memberships_playerId_teamSeasonId_key" ON "team_memberships"("playerId", "teamSeasonId");
CREATE UNIQUE INDEX "team_memberships_teamSeasonId_jerseyNumber_key" ON "team_memberships"("teamSeasonId", "jerseyNumber");

-- e) La llave foránea nueva.
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamSeasonId_fkey" FOREIGN KEY ("teamSeasonId") REFERENCES "team_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- f) La categoría ya vive en team_seasons.
ALTER TABLE "teams" DROP COLUMN "category";

-- g) Máximo UNA temporada activa por liga. Índice único PARCIAL: solo
-- indexa las filas con status = 'activa', así que dos 'cerradas' de la misma
-- liga no chocan, pero dos 'activas' sí.
-- ⚠️ Este índice NO está en schema.prisma (Prisma solo lo expresa con un
-- preview feature que además ensucia findUnique). Consecuencia: en futuras
-- `prisma migrate dev`, Prisma puede proponer
--     DROP INDEX "seasons_una_activa_por_liga";
-- Si aparece esa línea en una migración nueva, BÓRRALA antes de aplicarla.
CREATE UNIQUE INDEX "seasons_una_activa_por_liga" ON "seasons"("leagueId") WHERE "status" = 'activa';

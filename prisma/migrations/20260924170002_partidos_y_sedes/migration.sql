-- CreateEnum
CREATE TYPE "GamePhaseEnumType" AS ENUM ('pretemporada', 'amistoso', 'regular', 'cuartos', 'semifinal', 'tercer_lugar', 'final');

-- CreateEnum
CREATE TYPE "GameStatusEnumType" AS ENUM ('programado', 'finalizado', 'suspendido');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "homeTeamSeasonId" TEXT NOT NULL,
    "awayTeamSeasonId" TEXT NOT NULL,
    "phase" "GamePhaseEnumType" NOT NULL DEFAULT 'regular',
    "round" INTEGER,
    "status" "GameStatusEnumType" NOT NULL DEFAULT 'programado',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "venueId" TEXT NOT NULL,
    "field" INTEGER,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "isForfeit" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_name_key" ON "venues"("name");

-- CreateIndex
CREATE INDEX "games_seasonId_round_idx" ON "games"("seasonId", "round");

-- CreateIndex
CREATE INDEX "games_homeTeamSeasonId_idx" ON "games"("homeTeamSeasonId");

-- CreateIndex
CREATE INDEX "games_awayTeamSeasonId_idx" ON "games"("awayTeamSeasonId");

-- CreateIndex
CREATE INDEX "games_venueId_idx" ON "games"("venueId");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_homeTeamSeasonId_fkey" FOREIGN KEY ("homeTeamSeasonId") REFERENCES "team_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_awayTeamSeasonId_fkey" FOREIGN KEY ("awayTeamSeasonId") REFERENCES "team_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ESCRITO A MANO: reglas que schema.prisma no sabe expresar.
-- Prisma no administra los CHECK: no los genera, pero tampoco los borra en
-- migraciones futuras. Si algún día una migración propone DROP CONSTRAINT de
-- alguno de estos, bórrala del .sql antes de aplicarla.
-- ---------------------------------------------------------------------------

-- Nadie juega contra sí mismo.
ALTER TABLE "games" ADD CONSTRAINT "games_equipos_distintos"
    CHECK ("homeTeamSeasonId" <> "awayTeamSeasonId");

-- Un marcador no puede ser negativo. Con NULL (partido sin jugar) el CHECK
-- pasa: en SQL, comparar NULL da "desconocido", y un CHECK solo falla con FALSE.
ALTER TABLE "games" ADD CONSTRAINT "games_marcador_no_negativo"
    CHECK ("homeScore" >= 0 AND "awayScore" >= 0);

-- 'finalizado' ⇔ los dos marcadores tienen valor. Compara dos booleanos: un
-- programado o suspendido NO puede traer marcador, y un finalizado no puede
-- quedarse sin él. (Si algún día se quiere guardar el marcador parcial de un
-- partido suspendido a medio juego, hay que quitar esta restricción.)
ALTER TABLE "games" ADD CONSTRAINT "games_finalizado_con_marcador"
    CHECK (("status" = 'finalizado') = ("homeScore" IS NOT NULL AND "awayScore" IS NOT NULL));

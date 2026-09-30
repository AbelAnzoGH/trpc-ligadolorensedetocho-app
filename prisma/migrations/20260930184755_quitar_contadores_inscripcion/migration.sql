/*
  Warnings:

  - You are about to drop the column `gamesPlayed` on the `team_seasons` table. All the data in the column will be lost.
  - You are about to drop the column `losses` on the `team_seasons` table. All the data in the column will be lost.
  - You are about to drop the column `pointsAgainst` on the `team_seasons` table. All the data in the column will be lost.
  - You are about to drop the column `pointsFor` on the `team_seasons` table. All the data in the column will be lost.
  - You are about to drop the column `ties` on the `team_seasons` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `team_seasons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "team_seasons" DROP COLUMN "gamesPlayed",
DROP COLUMN "losses",
DROP COLUMN "pointsAgainst",
DROP COLUMN "pointsFor",
DROP COLUMN "ties",
DROP COLUMN "wins";

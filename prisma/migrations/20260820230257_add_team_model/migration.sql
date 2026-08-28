-- CreateEnum
CREATE TYPE "TeamCategoryEnumType" AS ENUM ('femenil', 'varonil', 'mixto');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" "TeamCategoryEnumType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

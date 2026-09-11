-- CreateEnum
CREATE TYPE "SpotAccessibility" AS ENUM ('EASY', 'MODERATE', 'HARD', 'RESTRICTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN "accessibility" "SpotAccessibility";

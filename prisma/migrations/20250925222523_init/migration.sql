/*
  Warnings:

  - Made the column `gigDescription` on table `Gig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Gig" ALTER COLUMN "gigDescription" SET NOT NULL;

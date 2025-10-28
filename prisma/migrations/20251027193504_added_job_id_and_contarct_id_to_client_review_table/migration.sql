/*
  Warnings:

  - A unique constraint covering the columns `[contractId]` on the table `ClientReview` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jobId]` on the table `ClientReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contractId` to the `ClientReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobId` to the `ClientReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ClientReview" ADD COLUMN     "contractId" TEXT NOT NULL,
ADD COLUMN     "jobId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClientReview_contractId_key" ON "public"."ClientReview"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientReview_jobId_key" ON "public"."ClientReview"("jobId");

-- AddForeignKey
ALTER TABLE "public"."ClientReview" ADD CONSTRAINT "ClientReview_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientReview" ADD CONSTRAINT "ClientReview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

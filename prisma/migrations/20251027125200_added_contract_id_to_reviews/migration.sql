/*
  Warnings:

  - A unique constraint covering the columns `[contractId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contractId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "contractId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_contractId_key" ON "public"."Review"("contractId");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

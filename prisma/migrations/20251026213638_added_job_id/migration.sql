/*
  Warnings:

  - A unique constraint covering the columns `[jobId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_jobId_key" ON "public"."Review"("jobId");

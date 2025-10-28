/*
  Warnings:

  - You are about to drop the column `job_Id` on the `Application` table. All the data in the column will be lost.
  - Added the required column `jobId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_job_Id_fkey";

-- AlterTable
ALTER TABLE "public"."Application" DROP COLUMN "job_Id",
ADD COLUMN     "jobId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `jobId` on the `Application` table. All the data in the column will be lost.
  - Added the required column `job_Id` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_jobId_fkey";

-- AlterTable
ALTER TABLE "public"."Application" DROP COLUMN "jobId",
ADD COLUMN     "job_Id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_job_Id_fkey" FOREIGN KEY ("job_Id") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

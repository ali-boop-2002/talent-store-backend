-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "description" TEXT,
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "userProfilePic" TEXT[];

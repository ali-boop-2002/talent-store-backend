-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "Bio" TEXT DEFAULT 'No bio added',
ADD COLUMN     "availabilty" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "portfolio" TEXT[];

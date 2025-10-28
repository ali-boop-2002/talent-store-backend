-- AlterTable
ALTER TABLE "public"."Contract" ALTER COLUMN "accepted" DROP NOT NULL,
ALTER COLUMN "accepted" DROP DEFAULT;

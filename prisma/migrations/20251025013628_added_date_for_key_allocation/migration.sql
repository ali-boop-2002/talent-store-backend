-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "lastKeyAllocation" TIMESTAMP(3),
ADD COLUMN     "nextKeyAllocation" TIMESTAMP(3);

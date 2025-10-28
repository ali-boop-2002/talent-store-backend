-- AlterTable
ALTER TABLE "public"."Subscription" ALTER COLUMN "currentPeriodStart" DROP NOT NULL,
ALTER COLUMN "currentPeriodEnd" DROP NOT NULL;

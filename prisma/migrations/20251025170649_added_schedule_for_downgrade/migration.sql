-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "scheduleForDowngrade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionScheduledForDowngrade" "public"."PlanType";

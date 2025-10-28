/*
  Warnings:

  - Added the required column `planType` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('basic_plan', 'pro_plan', 'premium_tier');

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "planType" "public"."PlanType" NOT NULL;

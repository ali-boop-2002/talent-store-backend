-- AlterTable
ALTER TABLE "public"."Contract" ADD COLUMN     "paymentType" "public"."PaymentType" NOT NULL DEFAULT 'HOURLY',
ADD COLUMN     "rate" DOUBLE PRECISION,
ADD COLUMN     "timeline" TEXT;

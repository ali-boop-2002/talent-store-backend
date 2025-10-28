-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "contractId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "public"."Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
